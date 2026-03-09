"""
AI Matching & Fairness Engine
-----------------------------

This module implements a two-stage recommendation pipeline:

1. Stage 1 – Similarity Matching:
   - Donor preferences (cause, geography, budget) and NGO attributes
     (sector, geographic focus, historical scale) are encoded into
     numeric feature vectors.
   - Cosine similarity is used to rank NGOs by functional alignment.

2. Stage 2 – Fairness Adjustment:
   - Uses the transactions table to calculate total funding received
     by each NGO over the last fiscal year.
   - Computes a sector-wise median funding baseline.
   - Under-funded NGOs (below the median in their sector) receive a
     positive multiplicative boost to their similarity score.
"""

from datetime import datetime, timedelta
from typing import Any, Dict, List

import numpy as np
import pandas as pd

# sklearn imports are handled inside functions to avoid module-level import failures

# Support both package-style imports (recommended when running as
# `python -m backend.app`) and direct script-style imports.
try:  # package import
    from ..models import NGOProfile, Transaction, db
except ImportError:  # script import fallback
    from models import NGOProfile, Transaction, db  # type: ignore


SECTOR_NORMALIZATION = {
    "env.": "Environment",
    "environmental": "Environment",
    "edu.": "Education",
    "healthcare": "Health",
    "med": "Health",
}


def _normalize_text(value: str) -> str:
    if value is None:
        return ""
    s = str(value).strip()
    if not s:
        return ""
    lowered = s.lower()
    mapped = SECTOR_NORMALIZATION.get(lowered)
    return mapped if mapped else s


def _load_ngo_frame() -> pd.DataFrame:
    """Load NGO profiles into a Pandas DataFrame."""
    ngos = NGOProfile.query.all()
    if not ngos:
        return pd.DataFrame(
            columns=[
                "ngo_id",
                "name",
                "sector",
                "geographic_focus",
                "credibility_score",
                "description",
            ]
        )

    records = []
    for ngo in ngos:
        records.append(
            {
                "ngo_id": ngo.id,
                "name": ngo.user.organization_name or ngo.user.name,
                "sector": _normalize_text(ngo.sector),
                "geographic_focus": _normalize_text(ngo.geographic_focus),
                "credibility_score": ngo.credibility_score,
                "description": (ngo.mission_statement or "").strip(),
            }
        )
    return pd.DataFrame.from_records(records)


def _load_funding_frame(last_n_days: int = 365) -> pd.DataFrame:
    """
    Aggregate transaction history into a funding DataFrame.

    In addition to the total amount received by each NGO, we also
    track a lightweight proxy for "popularity" via transaction count.
    This allows the fairness layer to softly tilt recommendations
    toward lesser-known NGOs (fewer historical donations).
    """
    cutoff = datetime.utcnow() - timedelta(days=last_n_days)
    txs = (
        Transaction.query.join(NGOProfile, Transaction.ngo_id == NGOProfile.id)
        .filter(Transaction.transacted_at >= cutoff)
        .all()
    )

    if not txs:
        return pd.DataFrame(columns=["ngo_id", "sector", "total_amount", "tx_count"])

    rows = []
    for tx in txs:
        rows.append(
            {
                "ngo_id": tx.ngo_id,
                "sector": tx.ngo.sector,
                "total_amount": float(tx.amount),
                # Count each transaction once; this is used as a
                # simple "visibility/popularity" signal.
                "tx_count": 1,
            }
        )
    df = pd.DataFrame.from_records(rows)
    grouped = (
        df.groupby(["ngo_id", "sector"], as_index=False)
        .agg(
            total_amount=("total_amount", "sum"),
            tx_count=("tx_count", "sum"),
        )
        .astype({"tx_count": "int64"})
    )
    return grouped


def _encode_features(
    ngo_df: pd.DataFrame, donor_prefs: Dict[str, Any]
) -> (np.ndarray, np.ndarray):
    """
    Convert NGO attributes and donor preferences into comparable vectors.

    Categorical: sector, geographic_focus
    Numerical:   target_budget (approximate)
    """
    if ngo_df.empty:
        return np.empty((0, 0)), np.empty((0, 0))

    # Check if sklearn is available
    try:
        from sklearn.preprocessing import OneHotEncoder, StandardScaler
        SKLEARN_AVAILABLE = True
    except ImportError:
        SKLEARN_AVAILABLE = False

    if SKLEARN_AVAILABLE:
        # sklearn imports are handled inside functions to avoid module-level import failures
        try:
            from sklearn.preprocessing import OneHotEncoder, StandardScaler
            cat_encoder = OneHotEncoder(sparse_output=False, handle_unknown="ignore")
        except TypeError:
            cat_encoder = OneHotEncoder(sparse=False, handle_unknown="ignore")
        num_scaler = StandardScaler()

        ngo_cat_encoded = cat_encoder.fit_transform(ngo_cat)
        ngo_num_scaled = num_scaler.fit_transform(ngo_num)

        ngo_features = np.hstack([ngo_cat_encoded, ngo_num_scaled])

        # Build donor preference row using the same encoders
        donor_cat = pd.DataFrame(
            {
                "sector": [_normalize_text(donor_prefs.get("cause", ""))],
                "geographic_focus": [_normalize_text(donor_prefs.get("location", ""))],
            }
        ).astype(str)
        donor_num = pd.DataFrame(
            {
                "target_budget": [
                    float(donor_prefs.get("max_budget", donor_prefs.get("budget", 1.0)))
                ]
            }
        )

        donor_cat_encoded = cat_encoder.transform(donor_cat)
        donor_num_scaled = num_scaler.transform(donor_num)
        donor_features = np.hstack([donor_cat_encoded, donor_num_scaled])

        return ngo_features, donor_features
    else:
        # Fallback: simple encoding without sklearn
        # Create basic feature vectors based on string matching
        ngo_features = []
        for _, ngo in ngo_df.iterrows():
            # Simple encoding: 1 if sector/location matches donor preference, 0 otherwise
            sector_match = 1.0 if _normalize_text(donor_prefs.get("cause", "")).lower() in str(ngo.get("sector", "")).lower() else 0.0
            location_match = 1.0 if _normalize_text(donor_prefs.get("location", "")).lower() in str(ngo.get("geographic_focus", "")).lower() else 0.0
            budget_score = 1.0  # Default score
            ngo_features.append([sector_match, location_match, budget_score])

        donor_features = [[1.0, 1.0, 1.0]]  # Donor preferences vector

        return np.array(ngo_features), np.array(donor_features)


def _apply_fairness_adjustment(
    ngo_df: pd.DataFrame, base_scores: np.ndarray, funding_df: pd.DataFrame
) -> List[Dict[str, Any]]:
    """
    Stage 2: Fairness-aware re-weighting.

    For each NGO, compare its funding against the sector median.
    If below median, apply a multiplier to lift its score.
    """
    if ngo_df.empty:
        return []

    df = ngo_df.copy()
    df["base_similarity"] = base_scores

    if funding_df.empty:
        # No funding history yet: just return similarity-based ranking
        df["fairness_multiplier"] = 1.0
        df["final_score"] = df["base_similarity"]
    else:
        merged = df.merge(
            funding_df[["ngo_id", "total_amount", "tx_count"]],
            on="ngo_id",
            how="left",
        )
        merged["total_amount"] = merged["total_amount"].fillna(0.0)
        merged["tx_count"] = merged["tx_count"].fillna(0.0)

        # Compute sector medians for amount-based underfunding
        sector_median = (
            merged.groupby("sector")["total_amount"].transform("median").replace(0, 1.0)
        )

        # Under-funded if below median in sector
        underfunded_mask = merged["total_amount"] < sector_median

        # Multiplier grows with underfunding ratio but is capped
        ratio = 1.0 - (merged["total_amount"] / sector_median.clip(lower=1.0))
        multiplier = 1.0 + (0.5 * ratio.clip(lower=0.0, upper=1.0))

        merged["fairness_multiplier"] = 1.0
        merged.loc[underfunded_mask, "fairness_multiplier"] = multiplier[
            underfunded_mask
        ]

        # Additional "lesser-known NGO" preference:
        # NGOs with fewer historical transactions receive a soft boost,
        # encouraging discovery of smaller or emerging organizations.
        if "tx_count" in merged.columns:
            tx_count_series = merged["tx_count"].astype(float)
            if not tx_count_series.empty:
                # Derive simple buckets from overall distribution
                q25, q50 = tx_count_series.quantile([0.25, 0.50])
                low_mask = tx_count_series <= max(1.0, q25)
                mid_mask = (tx_count_series > max(1.0, q25)) & (
                    tx_count_series <= max(1.0, q50)
                )

                # Stronger boost for the least-known NGOs, lighter boost for mid-tier
                lesser_known_bonus = np.where(low_mask, 0.30, 0.0)
                lesser_known_bonus = np.where(
                    mid_mask & ~low_mask, 0.15, lesser_known_bonus
                )

                merged["fairness_multiplier"] *= 1.0 + lesser_known_bonus

        merged["final_score"] = merged["base_similarity"] * merged["fairness_multiplier"]
        df = merged

    df = df.sort_values("final_score", ascending=False)

    results: List[Dict[str, Any]] = []
    for _, row in df.iterrows():
        results.append(
            {
                "ngo_id": int(row["ngo_id"]),
                "name": row["name"],
                "sector": row["sector"],
                "geographic_focus": row["geographic_focus"],
                "description": row.get("description") or "",
                "base_similarity": float(row["base_similarity"]),
                "fairness_multiplier": float(row.get("fairness_multiplier", 1.0)),
                "final_score": float(row["final_score"]),
            }
        )
    return results


def get_ngo_recommendations(donor_preferences: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Public entrypoint for the recommendation engine.

    Parameters
    ----------
    donor_preferences: dict
        {
          "cause": "education",
          "location": "India",
          "min_budget": 5000,
          "max_budget": 20000
        }

    Returns
    -------
    list of dicts
        Ranked NGO objects with similarity and fairness metrics.
    """
    with db.session.no_autoflush:
        ngo_df = _load_ngo_frame()
        if ngo_df.empty:
            return []

        ngo_features, donor_features = _encode_features(ngo_df, donor_preferences)
        if ngo_features.size == 0:
            return []

        # Stage 1: cosine similarity
        try:
            from sklearn.metrics.pairwise import cosine_similarity
            sim_matrix = cosine_similarity(ngo_features, donor_features)
            base_scores = sim_matrix[:, 0]
        except ImportError:
            # Fallback: simple Euclidean distance-based similarity
            import numpy as np
            distances = np.linalg.norm(ngo_features - donor_features, axis=1)
            # Convert distance to similarity (closer = more similar)
            max_dist = np.max(distances) if len(distances) > 0 else 1
            base_scores = 1 - (distances / max_dist) if max_dist > 0 else np.ones(len(distances))

        # Stage 2: fairness adjustment
        funding_df = _load_funding_frame(last_n_days=365)
        ranked = _apply_fairness_adjustment(ngo_df, base_scores, funding_df)
        return ranked

