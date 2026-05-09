# """
# AI Matching & Fairness Engine
# -----------------------------

# This module implements a two-stage recommendation pipeline:

# 1. Stage 1 – Similarity Matching:
#    - Donor preferences (cause, geography, budget) and NGO attributes
#      (sector, geographic focus, historical scale) are encoded into
#      numeric feature vectors.
#    - Cosine similarity is used to rank NGOs by functional alignment.

# 2. Stage 2 – Fairness Adjustment:
#    - Uses the transactions table to calculate total funding received
#      by each NGO over the last fiscal year.
#    - Computes a sector-wise median funding baseline.
#    - Under-funded NGOs (below the median in their sector) receive a
#      positive multiplicative boost to their similarity score.
# """

# from datetime import datetime, timedelta
# from typing import Any, Dict, List

# import numpy as np
# import pandas as pd

# # sklearn imports are handled inside functions to avoid module-level import failures

# # Support both package-style imports (recommended when running as
# # `python -m backend.app`) and direct script-style imports.
# try:  # package import
#     from ..models import NGOProfile, Transaction, db
# except ImportError:  # script import fallback
#     from models import NGOProfile, Transaction, db  # type: ignore


# SECTOR_NORMALIZATION = {
#     "env.": "Environment",
#     "environmental": "Environment",
#     "edu.": "Education",
#     "healthcare": "Health",
#     "med": "Health",
# }


# def _normalize_text(value: str) -> str:
#     if value is None:
#         return ""
#     s = str(value).strip()
#     if not s:
#         return ""
#     lowered = s.lower()
#     mapped = SECTOR_NORMALIZATION.get(lowered)
#     return mapped if mapped else s


# def _load_ngo_frame() -> pd.DataFrame:
#     """Load NGO profiles into a Pandas DataFrame."""
#     ngos = NGOProfile.query.all()
#     if not ngos:
#         return pd.DataFrame(
#             columns=[
#                 "ngo_id",
#                 "name",
#                 "sector",
#                 "geographic_focus",
#                 "credibility_score",
#                 "description",
#             ]
#         )

#     records = []
#     for ngo in ngos:
#         records.append(
#             {
#                 "ngo_id": ngo.id,
#                 "name": ngo.user.organization_name or ngo.user.name,
#                 "sector": _normalize_text(ngo.sector),
#                 "geographic_focus": _normalize_text(ngo.geographic_focus),
#                 "credibility_score": ngo.credibility_score,
#                 "description": (ngo.mission_statement or "").strip(),
#             }
#         )
#     return pd.DataFrame.from_records(records)


# def _load_funding_frame(last_n_days: int = 365) -> pd.DataFrame:
#     """
#     Aggregate transaction history into a funding DataFrame.

#     In addition to the total amount received by each NGO, we also
#     track a lightweight proxy for "popularity" via transaction count.
#     This allows the fairness layer to softly tilt recommendations
#     toward lesser-known NGOs (fewer historical donations).
#     """
#     cutoff = datetime.utcnow() - timedelta(days=last_n_days)
#     txs = (
#         Transaction.query.join(NGOProfile, Transaction.ngo_id == NGOProfile.id)
#         .filter(Transaction.transacted_at >= cutoff)
#         .all()
#     )

#     if not txs:
#         return pd.DataFrame(columns=["ngo_id", "sector", "total_amount", "tx_count"])

#     rows = []
#     for tx in txs:
#         rows.append(
#             {
#                 "ngo_id": tx.ngo_id,
#                 "sector": tx.ngo.sector,
#                 "total_amount": float(tx.amount),
#                 # Count each transaction once; this is used as a
#                 # simple "visibility/popularity" signal.
#                 "tx_count": 1,
#             }
#         )
#     df = pd.DataFrame.from_records(rows)
#     grouped = (
#         df.groupby(["ngo_id", "sector"], as_index=False)
#         .agg(
#             total_amount=("total_amount", "sum"),
#             tx_count=("tx_count", "sum"),
#         )
#         .astype({"tx_count": "int64"})
#     )
#     return grouped


# def _encode_features(
#     ngo_df: pd.DataFrame, donor_prefs: Dict[str, Any]
# ) -> (np.ndarray, np.ndarray):
#     """
#     Convert NGO attributes and donor preferences into comparable vectors.

#     Categorical: sector, geographic_focus
#     Numerical:   target_budget (approximate)
#     """
#     if ngo_df.empty:
#         return np.empty((0, 0)), np.empty((0, 0))

#     # Check if sklearn is available
#     try:
#         from sklearn.preprocessing import OneHotEncoder, StandardScaler
#         SKLEARN_AVAILABLE = True
#     except ImportError:
#         SKLEARN_AVAILABLE = False

#     if SKLEARN_AVAILABLE:
#         # sklearn imports are handled inside functions to avoid module-level import failures
#         try:
#             from sklearn.preprocessing import OneHotEncoder, StandardScaler
#             cat_encoder = OneHotEncoder(sparse_output=False, handle_unknown="ignore")
#         except TypeError:
#             cat_encoder = OneHotEncoder(sparse=False, handle_unknown="ignore")
#         num_scaler = StandardScaler()

#         ngo_cat_encoded = cat_encoder.fit_transform(ngo_cat)
#         ngo_num_scaled = num_scaler.fit_transform(ngo_num)

#         ngo_features = np.hstack([ngo_cat_encoded, ngo_num_scaled])

#         # Build donor preference row using the same encoders
#         donor_cat = pd.DataFrame(
#             {
#                 "sector": [_normalize_text(donor_prefs.get("cause", ""))],
#                 "geographic_focus": [_normalize_text(donor_prefs.get("location", ""))],
#             }
#         ).astype(str)
#         donor_num = pd.DataFrame(
#             {
#                 "target_budget": [
#                     float(donor_prefs.get("max_budget", donor_prefs.get("budget", 1.0)))
#                 ]
#             }
#         )

#         donor_cat_encoded = cat_encoder.transform(donor_cat)
#         donor_num_scaled = num_scaler.transform(donor_num)
#         donor_features = np.hstack([donor_cat_encoded, donor_num_scaled])

#         return ngo_features, donor_features
#     else:
#         # Fallback: simple encoding without sklearn
#         # Create basic feature vectors based on string matching
#         ngo_features = []
#         for _, ngo in ngo_df.iterrows():
#             # Simple encoding: 1 if sector/location matches donor preference, 0 otherwise
#             sector_match = 1.0 if _normalize_text(donor_prefs.get("cause", "")).lower() in str(ngo.get("sector", "")).lower() else 0.0
#             location_match = 1.0 if _normalize_text(donor_prefs.get("location", "")).lower() in str(ngo.get("geographic_focus", "")).lower() else 0.0
#             budget_score = 1.0  # Default score
#             ngo_features.append([sector_match, location_match, budget_score])

#         donor_features = [[1.0, 1.0, 1.0]]  # Donor preferences vector

#         return np.array(ngo_features), np.array(donor_features)


# def _apply_fairness_adjustment(
#     ngo_df: pd.DataFrame, base_scores: np.ndarray, funding_df: pd.DataFrame
# ) -> List[Dict[str, Any]]:
#     """
#     Stage 2: Fairness-aware re-weighting.

#     For each NGO, compare its funding against the sector median.
#     If below median, apply a multiplier to lift its score.
#     """
#     if ngo_df.empty:
#         return []

#     df = ngo_df.copy()
#     df["base_similarity"] = base_scores

#     if funding_df.empty:
#         # No funding history yet: just return similarity-based ranking
#         df["fairness_multiplier"] = 1.0
#         df["final_score"] = df["base_similarity"]
#     else:
#         merged = df.merge(
#             funding_df[["ngo_id", "total_amount", "tx_count"]],
#             on="ngo_id",
#             how="left",
#         )
#         merged["total_amount"] = merged["total_amount"].fillna(0.0)
#         merged["tx_count"] = merged["tx_count"].fillna(0.0)

#         # Compute sector medians for amount-based underfunding
#         sector_median = (
#             merged.groupby("sector")["total_amount"].transform("median").replace(0, 1.0)
#         )

#         # Under-funded if below median in sector
#         underfunded_mask = merged["total_amount"] < sector_median

#         # Multiplier grows with underfunding ratio but is capped
#         ratio = 1.0 - (merged["total_amount"] / sector_median.clip(lower=1.0))
#         multiplier = 1.0 + (0.5 * ratio.clip(lower=0.0, upper=1.0))

#         merged["fairness_multiplier"] = 1.0
#         merged.loc[underfunded_mask, "fairness_multiplier"] = multiplier[
#             underfunded_mask
#         ]

#         # Additional "lesser-known NGO" preference:
#         # NGOs with fewer historical transactions receive a soft boost,
#         # encouraging discovery of smaller or emerging organizations.
#         if "tx_count" in merged.columns:
#             tx_count_series = merged["tx_count"].astype(float)
#             if not tx_count_series.empty:
#                 # Derive simple buckets from overall distribution
#                 q25, q50 = tx_count_series.quantile([0.25, 0.50])
#                 low_mask = tx_count_series <= max(1.0, q25)
#                 mid_mask = (tx_count_series > max(1.0, q25)) & (
#                     tx_count_series <= max(1.0, q50)
#                 )

#                 # Stronger boost for the least-known NGOs, lighter boost for mid-tier
#                 lesser_known_bonus = np.where(low_mask, 0.30, 0.0)
#                 lesser_known_bonus = np.where(
#                     mid_mask & ~low_mask, 0.15, lesser_known_bonus
#                 )

#                 merged["fairness_multiplier"] *= 1.0 + lesser_known_bonus

#         merged["final_score"] = merged["base_similarity"] * merged["fairness_multiplier"]
#         df = merged

#     df = df.sort_values("final_score", ascending=False)

#     results: List[Dict[str, Any]] = []
#     for _, row in df.iterrows():
#         results.append(
#             {
#                 "ngo_id": int(row["ngo_id"]),
#                 "name": row["name"],
#                 "sector": row["sector"],
#                 "geographic_focus": row["geographic_focus"],
#                 "description": row.get("description") or "",
#                 "base_similarity": float(row["base_similarity"]),
#                 "fairness_multiplier": float(row.get("fairness_multiplier", 1.0)),
#                 "final_score": float(row["final_score"]),
#             }
#         )
#     return results


# def get_ngo_recommendations(donor_preferences: Dict[str, Any]) -> List[Dict[str, Any]]:
#     """
#     Public entrypoint for the recommendation engine.

#     Parameters
#     ----------
#     donor_preferences: dict
#         {
#           "cause": "education",
#           "location": "India",
#           "min_budget": 5000,
#           "max_budget": 20000
#         }

#     Returns
#     -------
#     list of dicts
#         Ranked NGO objects with similarity and fairness metrics.
#     """
#     with db.session.no_autoflush:
#         ngo_df = _load_ngo_frame()
#         if ngo_df.empty:
#             return []

#         ngo_features, donor_features = _encode_features(ngo_df, donor_preferences)
#         if ngo_features.size == 0:
#             return []

#         # Stage 1: cosine similarity
#         try:
#             from sklearn.metrics.pairwise import cosine_similarity
#             sim_matrix = cosine_similarity(ngo_features, donor_features)
#             base_scores = sim_matrix[:, 0]
#         except ImportError:
#             # Fallback: simple Euclidean distance-based similarity
#             import numpy as np
#             distances = np.linalg.norm(ngo_features - donor_features, axis=1)
#             # Convert distance to similarity (closer = more similar)
#             max_dist = np.max(distances) if len(distances) > 0 else 1
#             base_scores = 1 - (distances / max_dist) if max_dist > 0 else np.ones(len(distances))

#         # Stage 2: fairness adjustment
#         funding_df = _load_funding_frame(last_n_days=365)
#         ranked = _apply_fairness_adjustment(ngo_df, base_scores, funding_df)
#         return ranked

# """
# AI Matching & Fairness Engine  –  SBERT Edition
# ================================================
# Semantic similarity is now powered by Sentence-BERT (all-MiniLM-L6-v2),
# replacing the old TF-IDF bag-of-words cosine.

# Why SBERT over TF-IDF here?
#   • "education" ↔ "schooling"          → high similarity  ✓
#   • "Mysore"    ↔ "Mysuru"             → high similarity  ✓
#   • "healthcare"↔ "medical aid"        → high similarity  ✓
#   • "child welfare" ↔ "children dev"   → high similarity  ✓
#   TF-IDF gives 0.0 for all of the above.

# Model: all-MiniLM-L6-v2
#   • 384-dimensional embeddings
#   • ~22 MB on disk  (auto-downloaded on first run)
#   • Fast inference: ~2 ms per sentence on CPU
#   • Trained on 1B+ sentence pairs

# Architecture
# ------------
#   donor_query_text  ──► SBERT ──► 384-d vector ─┐
#                                                   ├─► cosine ──► semantic_score
#   ngo_feature_text  ──► SBERT ──► 384-d vector ─┘

#   Final score = W_SEMANTIC * semantic
#               + W_SECTOR   * sector_match
#               + W_GEO      * geo_affinity
#               + W_FAIRNESS * fairness_boost
#               + W_CREDIBILITY * credibility
# """

# from __future__ import annotations

# import math
# import re
# import os
# import numpy as np
# from functools import lru_cache
# from typing import Any

# # ─────────────────────────────────────────────────────────────────────────────
# # Weight constants  (tune here without touching algorithm logic)
# # ─────────────────────────────────────────────────────────────────────────────
# W_SEMANTIC    = 0.35   # SBERT cosine similarity
# W_SECTOR      = 0.25   # exact / partial sector tag match
# W_GEO         = 0.20   # geographic affinity
# W_FAIRNESS    = 0.12   # under-recognition boost
# W_CREDIBILITY = 0.08   # DB credibility score

# # ─────────────────────────────────────────────────────────────────────────────
# # Regional alias sets
# # ─────────────────────────────────────────────────────────────────────────────
# MYSURU_ALIASES = {
#     "mysore", "mysuru", "mysuru district", "mysore district",
# }
# KARNATAKA_ALIASES = {
#     "karnataka", "karnataka state", "south karnataka",
# }
# SOUTH_INDIA_ALIASES = {
#     "south india", "southern india", "deccan",
# }
# MYSURU_NGO_SIGNAL_WORDS = {
#     "mysore", "mysuru", "vivekananda", "akshaya", "divya",
#     "ganabharathi", "graam", "natana", "odanadi", "sadhana",
#     "vidyanikethan", "kanasu", "brahmavidya", "sjce",
# }

# # ─────────────────────────────────────────────────────────────────────────────
# # SBERT model  (singleton, lazy-loaded)
# # ─────────────────────────────────────────────────────────────────────────────
# _SBERT_MODEL = None
# _SBERT_MODEL_NAME = os.getenv(
#     "SBERT_MODEL", "sentence-transformers/all-MiniLM-L6-v2"
# )

# def _get_sbert():
#     """
#     Lazy-load the SBERT model once per process.
#     Falls back to TF-IDF cosine if sentence-transformers is not installed,
#     so the app never hard-crashes in constrained environments.
#     """
#     global _SBERT_MODEL
#     if _SBERT_MODEL is not None:
#         return _SBERT_MODEL
#     try:
#         from sentence_transformers import SentenceTransformer
#         print(f"[matching] Loading SBERT model: {_SBERT_MODEL_NAME}")
#         _SBERT_MODEL = SentenceTransformer(_SBERT_MODEL_NAME)
#         print("[matching] SBERT model loaded ✓")
#     except ImportError:
#         print("[matching] WARNING: sentence-transformers not installed. "
#               "Falling back to TF-IDF cosine similarity.")
#         _SBERT_MODEL = "TFIDF_FALLBACK"
#     return _SBERT_MODEL


# # ─────────────────────────────────────────────────────────────────────────────
# # Embedding cache  –  avoids re-encoding the same NGO text on every request
# # ─────────────────────────────────────────────────────────────────────────────
# _EMBEDDING_CACHE: dict[str, np.ndarray] = {}


# def _embed(text: str) -> np.ndarray | None:
#     """
#     Return a unit-normalised SBERT embedding for *text*.
#     Results are cached by text content so each unique string
#     is encoded only once per process lifetime.
#     Returns None if SBERT is unavailable (triggers TF-IDF fallback).
#     """
#     if not text.strip():
#         return None

#     model = _get_sbert()
#     if model == "TFIDF_FALLBACK":
#         return None  # caller handles fallback

#     if text in _EMBEDDING_CACHE:
#         return _EMBEDDING_CACHE[text]

#     vec = model.encode(text, convert_to_numpy=True, normalize_embeddings=True)
#     _EMBEDDING_CACHE[text] = vec
#     return vec


# def _batch_embed_catalog(catalog: list[dict]) -> dict[str, np.ndarray]:
#     """
#     Encode all NGO feature texts in a single batched forward pass.
#     Batch encoding is ~10× faster than encoding one-by-one.
#     Called once when the catalog is first loaded.
#     """
#     model = _get_sbert()
#     if model == "TFIDF_FALLBACK":
#         return {}

#     texts  = [_ngo_feature_text(ngo) for ngo in catalog]
#     names  = [ngo.get("name", "") for ngo in catalog]

#     print(f"[matching] Batch-encoding {len(texts)} NGO profiles …")
#     vectors = model.encode(
#         texts,
#         batch_size=32,
#         convert_to_numpy=True,
#         normalize_embeddings=True,
#         show_progress_bar=False,
#     )
#     result = {name: vec for name, vec in zip(names, vectors)}
#     _EMBEDDING_CACHE.update(
#         {text: vec for text, vec in zip(texts, vectors)}
#     )
#     print("[matching] Batch encoding done ✓")
#     return result


# # ─────────────────────────────────────────────────────────────────────────────
# # TF-IDF fallback  (used when SBERT is unavailable)
# # ─────────────────────────────────────────────────────────────────────────────
# def _tokenize(text: str) -> list[str]:
#     text = text.lower()
#     text = re.sub(r"[^a-z0-9\s]", " ", text)
#     return [t for t in text.split() if len(t) > 1]


# def _build_tf(tokens: list[str]) -> dict[str, float]:
#     tf: dict[str, float] = {}
#     for t in tokens:
#         tf[t] = tf.get(t, 0) + 1
#     total = len(tokens) or 1
#     return {t: c / total for t, c in tf.items()}


# def _tfidf_cosine(text_a: str, text_b: str) -> float:
#     tf_a = _build_tf(_tokenize(text_a))
#     tf_b = _build_tf(_tokenize(text_b))
#     common = set(tf_a) & set(tf_b)
#     if not common:
#         return 0.0
#     dot   = sum(tf_a[k] * tf_b[k] for k in common)
#     mag_a = math.sqrt(sum(v * v for v in tf_a.values()))
#     mag_b = math.sqrt(sum(v * v for v in tf_b.values()))
#     if mag_a == 0 or mag_b == 0:
#         return 0.0
#     return dot / (mag_a * mag_b)


# # ─────────────────────────────────────────────────────────────────────────────
# # Semantic similarity  (SBERT with TF-IDF fallback)
# # ─────────────────────────────────────────────────────────────────────────────
# def _semantic_similarity(text_a: str, text_b: str) -> float:
#     """
#     Primary path  : SBERT unit-vector dot product  (= cosine, since normalised)
#     Fallback path : TF-IDF bag-of-words cosine
#     """
#     vec_a = _embed(text_a)
#     vec_b = _embed(text_b)

#     if vec_a is not None and vec_b is not None:
#         # Both vectors are L2-normalised → dot product == cosine similarity
#         score = float(np.dot(vec_a, vec_b))
#         # Clamp to [0, 1]  (tiny floating-point negatives can appear)
#         return max(0.0, min(score, 1.0))

#     # Fallback
#     return _tfidf_cosine(text_a, text_b)


# # ─────────────────────────────────────────────────────────────────────────────
# # Catalog singleton
# # ─────────────────────────────────────────────────────────────────────────────
# _NGO_CATALOG: list[dict] | None = None
# _NGO_EMBEDDINGS: dict[str, np.ndarray] = {}   # name → embedding


# def _get_catalog() -> list[dict]:
#     global _NGO_CATALOG, _NGO_EMBEDDINGS
#     if _NGO_CATALOG is None:
#         try:
#             from backend.ngo_catalog import NGO_CATALOG
#         except ImportError:
#             from ngo_catalog import NGO_CATALOG  # type: ignore
#         _NGO_CATALOG = NGO_CATALOG
#         # Pre-compute all NGO embeddings in one batch
#         _NGO_EMBEDDINGS = _batch_embed_catalog(_NGO_CATALOG)
#     return _NGO_CATALOG


# # ─────────────────────────────────────────────────────────────────────────────
# # Feature text builders
# # ─────────────────────────────────────────────────────────────────────────────
# def _ngo_feature_text(ngo: dict) -> str:
#     """
#     Rich feature string fed into SBERT.
#     Sector tags are repeated to up-weight them relative to description prose.
#     """
#     tags_expanded = ngo.get("sector_tags", "").replace("|", " ")
#     parts = [
#         ngo.get("name", ""),
#         tags_expanded,
#         tags_expanded,           # repeat for emphasis
#         ngo.get("description", ""),
#         ngo.get("state", ""),
#         ngo.get("country", ""),
#     ]
#     return " ".join(p for p in parts if p).strip()


# def _donor_feature_text(prefs: dict) -> str:
#     """
#     Donor preference → query string for SBERT.
#     All intent signals are concatenated so the model sees full context.
#     """
#     parts = [
#         prefs.get("sector", ""),
#         prefs.get("sectors", "") if isinstance(prefs.get("sectors"), str)
#             else " ".join(prefs.get("sectors") or []),
#         prefs.get("interests", ""),
#         prefs.get("location", ""),
#         prefs.get("region", ""),
#         prefs.get("city", ""),
#         prefs.get("cause", ""),
#         prefs.get("keywords", ""),
#         prefs.get("mission", ""),
#         prefs.get("focus", ""),
#     ]
#     return " ".join(str(p) for p in parts if p).strip()


# # ─────────────────────────────────────────────────────────────────────────────
# # Sector match score  (0 – 1)
# # ─────────────────────────────────────────────────────────────────────────────
# # Synonym map: maps donor sector terms → canonical NGO sector tags
# _SECTOR_SYNONYMS: dict[str, list[str]] = {
#     "education":          ["education", "literacy", "schooling", "learning",
#                            "academic", "skills development", "youth development"],
#     "healthcare":         ["healthcare", "health", "medical", "disability",
#                            "mental health", "nutrition"],
#     "environment":        ["environment", "conservation", "climate action",
#                            "ecology", "sustainability", "green"],
#     "rural development":  ["rural development", "community development",
#                            "livelihood", "agriculture"],
#     "women empowerment":  ["women empowerment", "gender equality", "human rights",
#                            "women", "gender"],
#     "children":           ["children", "child welfare", "child rights",
#                            "youth development", "kids"],
#     "technology":         ["technology", "innovation", "ict", "science",
#                            "digital", "stem"],
#     "arts & culture":     ["art & culture", "arts", "culture", "heritage",
#                            "music", "dance", "traditional"],
#     "food security":      ["food security", "nutrition", "hunger", "meals",
#                            "food"],
#     "social justice":     ["social justice", "human rights", "equality",
#                            "civil rights"],
# }


# def _expand_sector(sector_term: str) -> set[str]:
#     """Expand a single sector term to all its synonyms."""
#     term_lower = sector_term.strip().lower()
#     expanded = {term_lower}
#     for canonical, synonyms in _SECTOR_SYNONYMS.items():
#         if term_lower == canonical or term_lower in synonyms:
#             expanded.update(synonyms)
#             expanded.add(canonical)
#     return expanded


# def _sector_match(ngo_tags: str, donor_sectors: list[str]) -> float:
#     if not donor_sectors:
#         return 0.5  # neutral

#     ngo_tag_set = {t.strip().lower() for t in ngo_tags.split("|")}

#     best_hit = 0.0
#     for ds in donor_sectors:
#         expanded_donor = _expand_sector(ds)
#         # Direct intersection with expanded synonyms
#         hits = ngo_tag_set & expanded_donor
#         if hits:
#             best_hit = max(best_hit, len(hits) / max(len(ngo_tag_set), 1))
#             continue
#         # Partial substring fallback
#         partial = sum(
#             1 for dw in expanded_donor
#             for nw in ngo_tag_set
#             if dw in nw or nw in dw
#         )
#         best_hit = max(best_hit, min(partial * 0.12, 0.4))

#     return min(best_hit, 1.0)


# # ─────────────────────────────────────────────────────────────────────────────
# # Geographic affinity  (0 – 1)
# # ─────────────────────────────────────────────────────────────────────────────
# def _geo_score(ngo: dict, prefs: dict) -> float:
#     location_hint = " ".join([
#         prefs.get("location", ""),
#         prefs.get("region", ""),
#         prefs.get("city", ""),
#     ]).lower()

#     ngo_state      = ngo.get("state", "").lower()
#     ngo_country    = ngo.get("country", "").lower()
#     ngo_name_lower = ngo.get("name", "").lower()

#     # ── Mysuru / Mysore ──────────────────────────────────────────────────────
#     if any(a in location_hint for a in MYSURU_ALIASES):
#         if any(a in ngo_state for a in MYSURU_ALIASES):
#             return 1.0
#         if any(a in ngo_state for a in KARNATAKA_ALIASES):
#             return 0.88
#         if any(w in ngo_name_lower for w in MYSURU_NGO_SIGNAL_WORDS):
#             return 0.82
#         if ngo_country == "india":
#             return 0.42
#         if ngo_country == "global":
#             return 0.28
#         return 0.10

#     # ── Karnataka ────────────────────────────────────────────────────────────
#     if any(a in location_hint for a in KARNATAKA_ALIASES):
#         if any(a in ngo_state for a in KARNATAKA_ALIASES):
#             return 1.0
#         if ngo_country == "india":
#             return 0.48
#         if ngo_country == "global":
#             return 0.28
#         return 0.10

#     # ── South India ──────────────────────────────────────────────────────────
#     if any(a in location_hint for a in SOUTH_INDIA_ALIASES):
#         if any(a in ngo_state for a in KARNATAKA_ALIASES):
#             return 0.90
#         if ngo_country == "india":
#             return 0.58
#         if ngo_country == "global":
#             return 0.28
#         return 0.15

#     # ── India generic ────────────────────────────────────────────────────────
#     if "india" in location_hint:
#         if ngo_country == "india":
#             return 0.90
#         if ngo_country == "global":
#             return 0.52
#         return 0.22

#     # ── No location preference ───────────────────────────────────────────────
#     if not location_hint.strip():
#         if ngo_country == "india":
#             return 0.62
#         if ngo_country == "global":
#             return 0.55
#         return 0.40

#     # ── Non-India location ───────────────────────────────────────────────────
#     if ngo_country == "global":
#         return 0.72
#     if ngo_country == "india":
#         return 0.32
#     return 0.22


# # ─────────────────────────────────────────────────────────────────────────────
# # Fairness / under-recognition boost  (0 – 1)
# # ─────────────────────────────────────────────────────────────────────────────
# _WELL_KNOWN_NGOS = {
#     "cry", "pratham", "teach for india", "akshaya patra",
#     "smile foundation", "sewa", "helpage india", "barefoot college",
#     "magic bus", "wwf", "greenpeace", "oxfam", "care india",
#     "azim premji foundation", "habitat for humanity", "sightsavers",
#     "giveindia", "save the children", "wateraid", "unicef",
#     "red cross", "doctors without borders",
# }

# _NICHE_SECTORS = {
#     "art & culture", "heritage", "culture", "social justice",
#     "human rights", "traditional education", "elderly welfare",
#     "disability", "research", "public policy",
# }


# def _recognition_tier(ngo_name: str) -> str:
#     name_lower = ngo_name.lower()
#     if any(wk in name_lower for wk in _WELL_KNOWN_NGOS):
#         return "well_known"
#     grassroots_signals = [
#         "trust", "samsthe", "kendra", "ashrama", "seva",
#         "samiti", "sangha", "gram", "graam",
#     ]
#     if any(gs in name_lower for gs in grassroots_signals):
#         return "grassroots"
#     return "mid_tier"


# def _fairness_boost(ngo: dict, prefs: dict) -> float:
#     tier = _recognition_tier(ngo.get("name", ""))

#     # a) Under-recognition bonus
#     recognition_score = {"grassroots": 1.0, "mid_tier": 0.65, "well_known": 0.20}[tier]

#     # b) Location diversity bonus
#     has_location_pref = bool(
#         (prefs.get("location") or "").strip()
#         or (prefs.get("region") or "").strip()
#         or (prefs.get("city") or "").strip()
#     )
#     ngo_state  = ngo.get("state", "").lower()
#     is_regional = any(
#         a in ngo_state for a in MYSURU_ALIASES | KARNATAKA_ALIASES
#     )
#     location_diversity_score = (
#         0.80 if (not has_location_pref and is_regional) else 0.40
#     )

#     # c) Niche-sector bonus
#     ngo_sectors  = {s.strip().lower() for s in ngo.get("sector_tags", "").split("|")}
#     niche_score  = min(len(ngo_sectors & _NICHE_SECTORS) * 0.25, 0.80)

#     return (recognition_score * 0.55) + (location_diversity_score * 0.25) + (niche_score * 0.20)


# # ─────────────────────────────────────────────────────────────────────────────
# # Credibility score  (0 – 1)
# # ─────────────────────────────────────────────────────────────────────────────
# def _credibility_score(ngo: dict, db_ngo_map: dict[str, Any]) -> float:
#     ngo_name = ngo.get("name", "")
#     if ngo_name in db_ngo_map:
#         raw = float(db_ngo_map[ngo_name].get("credibility_score") or 40.0)
#         return raw / 100.0
#     # Catalog-only heuristic
#     verified   = ngo.get("country", "").lower() in {"india", "global"}
#     base       = 0.55 if verified else 0.35
#     richness   = min(len(ngo.get("description", "")) / 600.0, 0.20)
#     return min(base + richness, 1.0)


# # ─────────────────────────────────────────────────────────────────────────────
# # DB enrichment
# # ─────────────────────────────────────────────────────────────────────────────
# def _build_db_ngo_map() -> dict[str, Any]:
#     try:
#         try:
#             from backend.models import NGOProfile
#         except ImportError:
#             from models import NGOProfile  # type: ignore
#         result: dict[str, Any] = {}
#         for rec in NGOProfile.query.all():
#             name = (
#                 rec.user.organization_name
#                 if rec.user and rec.user.organization_name
#                 else (rec.user.name if rec.user else "")
#             )
#             result[name] = {
#                 "credibility_score":   rec.credibility_score,
#                 "verification_status": rec.verification_status,
#             }
#         return result
#     except Exception:
#         return {}


# # ─────────────────────────────────────────────────────────────────────────────
# # Core NGO scorer
# # ─────────────────────────────────────────────────────────────────────────────
# def _score_ngo_for_donor(
#     ngo: dict,
#     donor_text: str,
#     donor_sectors: list[str],
#     prefs: dict,
#     db_ngo_map: dict[str, Any],
# ) -> dict:
#     ngo_text = _ngo_feature_text(ngo)

#     # ── Semantic similarity (SBERT or TF-IDF fallback) ──────────────────────
#     # Use cached NGO embedding when available
#     ngo_name   = ngo.get("name", "")
#     ngo_vec    = _NGO_EMBEDDINGS.get(ngo_name) or _embed(ngo_text)
#     donor_vec  = _embed(donor_text)

#     if ngo_vec is not None and donor_vec is not None:
#         semantic = float(max(0.0, min(np.dot(ngo_vec, donor_vec), 1.0)))
#         engine   = "sbert"
#     else:
#         semantic = _tfidf_cosine(ngo_text, donor_text)
#         engine   = "tfidf"

#     sector      = _sector_match(ngo.get("sector_tags", ""), donor_sectors)
#     geo         = _geo_score(ngo, prefs)
#     fairness    = _fairness_boost(ngo, prefs)
#     credibility = _credibility_score(ngo, db_ngo_map)

#     composite = (
#         W_SEMANTIC    * semantic
#         + W_SECTOR    * sector
#         + W_GEO       * geo
#         + W_FAIRNESS  * fairness
#         + W_CREDIBILITY * credibility
#     )

#     return {
#         "name":        ngo_name,
#         "sector_tags": ngo.get("sector_tags"),
#         "state":       ngo.get("state"),
#         "country":     ngo.get("country"),
#         "description": ngo.get("description"),
#         "score":       round(composite, 4),
#         "score_breakdown": {
#             "semantic_similarity": round(semantic, 4),
#             "sector_match":        round(sector, 4),
#             "geographic_affinity": round(geo, 4),
#             "fairness_boost":      round(fairness, 4),
#             "credibility":         round(credibility, 4),
#             "similarity_engine":   engine,   # "sbert" or "tfidf"
#         },
#         "recognition_tier": _recognition_tier(ngo_name),
#         "db_enriched":      ngo_name in db_ngo_map,
#     }


# # ─────────────────────────────────────────────────────────────────────────────
# # Public API 1 – Donor → NGO
# # ─────────────────────────────────────────────────────────────────────────────
# def get_ngo_recommendations(
#     prefs: dict,
#     top_n: int = 10,
#     ensure_grassroots: int = 3,
# ) -> list[dict]:
#     """
#     Fairness-adjusted donor → NGO ranking using SBERT semantic similarity.
#     """
#     catalog    = _get_catalog()
#     db_ngo_map = _build_db_ngo_map()

#     # Normalise sector inputs
#     donor_sectors: list[str] = []
#     if prefs.get("sectors"):
#         raw = prefs["sectors"]
#         donor_sectors = raw if isinstance(raw, list) else [s.strip() for s in raw.split("|")]
#     if prefs.get("sector") and prefs["sector"] not in donor_sectors:
#         donor_sectors.append(str(prefs["sector"]))

#     donor_text = _donor_feature_text(prefs)

#     scored = [
#         _score_ngo_for_donor(ngo, donor_text, donor_sectors, prefs, db_ngo_map)
#         for ngo in catalog
#     ]
#     scored.sort(key=lambda x: x["score"], reverse=True)

#     # Grassroots fairness injection
#     top = scored[:top_n]
#     grassroots_in_top = sum(1 for r in top if r["recognition_tier"] == "grassroots")
#     if grassroots_in_top < ensure_grassroots:
#         remainder  = scored[top_n:]
#         extra      = [r for r in remainder if r["recognition_tier"] == "grassroots"][
#                          : ensure_grassroots - grassroots_in_top]
#         wk_indices = [i for i, r in enumerate(top) if r["recognition_tier"] == "well_known"]
#         for idx, replacement in zip(wk_indices[-(len(extra)):], extra):
#             top[idx] = replacement
#         top.sort(key=lambda x: x["score"], reverse=True)

#     return top


# # ─────────────────────────────────────────────────────────────────────────────
# # Public API 2 – NGO → Donor pool
# # ─────────────────────────────────────────────────────────────────────────────
# def get_donor_matches_for_ngo(
#     ngo_prefs: dict,
#     donor_pool: list[dict],
#     top_n: int = 10,
# ) -> list[dict]:
#     ngo_text = " ".join([
#         ngo_prefs.get("name", ""),
#         ngo_prefs.get("sector", ""),
#         ngo_prefs.get("sector", ""),        # repeat for emphasis
#         ngo_prefs.get("description", ""),
#         ngo_prefs.get("mission_statement", ""),
#         ngo_prefs.get("geographic_focus", ""),
#     ])
#     ngo_sectors = {s.strip().lower() for s in ngo_prefs.get("sector", "").split("|")}

#     results = []
#     for donor in donor_pool:
#         donor_text = " ".join([
#             donor.get("name", ""),
#             donor.get("interests", ""),
#             donor.get("sector_focus", ""),
#             donor.get("sector_focus", ""),  # repeat for emphasis
#             donor.get("description", ""),
#             donor.get("location", ""),
#         ])

#         # Semantic similarity
#         semantic = _semantic_similarity(ngo_text, donor_text)

#         # Sector alignment (Jaccard)
#         donor_sectors = {
#             s.strip().lower()
#             for s in donor.get("sector_focus", "").split("|") if s.strip()
#         }
#         shared   = ngo_sectors & donor_sectors
#         sector_align = len(shared) / max(len(ngo_sectors | donor_sectors), 1)

#         # Geo alignment
#         donor_loc = donor.get("location", "").lower()
#         ngo_geo   = ngo_prefs.get("geographic_focus", "").lower()
#         if any(a in donor_loc for a in MYSURU_ALIASES) and \
#            any(a in ngo_geo for a in MYSURU_ALIASES | KARNATAKA_ALIASES):
#             geo_align = 1.0
#         elif "karnataka" in donor_loc and "karnataka" in ngo_geo:
#             geo_align = 0.90
#         elif "india" in donor_loc and "india" in ngo_geo:
#             geo_align = 0.65
#         else:
#             geo_align = 0.30

#         # Giving capacity
#         cap_raw = donor.get("giving_capacity", "")
#         if isinstance(cap_raw, (int, float)):
#             capacity = min(math.log1p(float(cap_raw)) / math.log1p(10_000_000), 1.0)
#         else:
#             capacity = {"low": 0.25, "medium": 0.50, "high": 0.75, "enterprise": 1.0}.get(
#                 str(cap_raw).lower(), 0.5
#             )

#         alignment = (
#             0.35 * semantic
#             + 0.30 * sector_align
#             + 0.20 * geo_align
#             + 0.15 * capacity
#         )

#         results.append({
#             "donor_name":      donor.get("name"),
#             "donor_type":      donor.get("type", "individual"),
#             "location":        donor.get("location"),
#             "sector_focus":    donor.get("sector_focus"),
#             "alignment_score": round(alignment, 4),
#             "score_breakdown": {
#                 "semantic_similarity": round(semantic, 4),
#                 "sector_alignment":    round(sector_align, 4),
#                 "geographic_alignment":round(geo_align, 4),
#                 "giving_capacity":     round(capacity, 4),
#             },
#             "shared_sectors": list(shared),
#         })

#     results.sort(key=lambda x: x["alignment_score"], reverse=True)
#     return results[:top_n]


# # ─────────────────────────────────────────────────────────────────────────────
# # Public API 3 – Corporate → NGO  (CSR matching)
# # ─────────────────────────────────────────────────────────────────────────────
# _CORPORATE_SECTOR_MAP: dict[str, list[str]] = {
#     "education":       ["education", "literacy", "youth development", "skills development"],
#     "healthcare":      ["healthcare", "health", "disability", "mental health"],
#     "environment":     ["environment", "conservation", "climate action", "sustainability"],
#     "rural development":["rural development", "community development", "livelihood"],
#     "women empowerment":["women empowerment", "gender equality", "human rights"],
#     "technology":      ["technology", "innovation", "science", "ict"],
#     "arts & culture":  ["art & culture", "heritage", "culture"],
#     "food security":   ["food security", "nutrition"],
#     "social justice":  ["social justice", "child rights", "human rights"],
# }


# def _expand_corporate_sectors(csr_focus: list[str]) -> list[str]:
#     expanded = []
#     for focus in csr_focus:
#         fl = focus.strip().lower()
#         for key, synonyms in _CORPORATE_SECTOR_MAP.items():
#             if fl == key or fl in synonyms:
#                 expanded.extend(synonyms)
#     return list(set(expanded)) or csr_focus


# def get_corporate_ngo_matches(
#     corporate_prefs: dict,
#     top_n: int = 10,
#     ensure_grassroots: int = 2,
# ) -> list[dict]:
#     catalog    = _get_catalog()
#     db_ngo_map = _build_db_ngo_map()

#     csr_raw: list[str] = corporate_prefs.get("csr_focus", [])
#     if isinstance(csr_raw, str):
#         csr_raw = [s.strip() for s in csr_raw.split("|")]
#     expanded = _expand_corporate_sectors(csr_raw)

#     scale_pref      = corporate_prefs.get("preferred_scale", "").lower()
#     scale_geo_boost = scale_pref in {"local", "regional"}

#     synth_prefs = {
#         "sector":    "|".join(expanded),
#         "sectors":   expanded,
#         "location":  corporate_prefs.get("location", ""),
#         "keywords":  corporate_prefs.get("keywords", ""),
#         "interests": " ".join(csr_raw),
#     }
#     donor_text = _donor_feature_text(synth_prefs)

#     scored = []
#     for ngo in catalog:
#         base = _score_ngo_for_donor(ngo, donor_text, expanded, synth_prefs, db_ngo_map)
#         ngo_state = ngo.get("state", "").lower()
#         if scale_geo_boost and any(
#             a in ngo_state for a in MYSURU_ALIASES | KARNATAKA_ALIASES
#         ):
#             base["score"] = min(base["score"] * 1.18, 1.0)
#             base["score_breakdown"]["scale_geo_bonus"] = True
#         base["csr_sector_overlap"] = [
#             s for s in expanded if s in ngo.get("sector_tags", "").lower()
#         ]
#         scored.append(base)

#     scored.sort(key=lambda x: x["score"], reverse=True)

#     # Grassroots guarantee
#     top = scored[:top_n]
#     grassroots_in_top = sum(1 for r in top if r["recognition_tier"] == "grassroots")
#     if grassroots_in_top < ensure_grassroots:
#         extra  = [r for r in scored[top_n:] if r["recognition_tier"] == "grassroots"][
#                      : ensure_grassroots - grassroots_in_top]
#         wk_idx = [i for i, r in enumerate(top) if r["recognition_tier"] == "well_known"]
#         for idx, rep in zip(wk_idx[-(len(extra)):], extra):
#             top[idx] = rep
#         top.sort(key=lambda x: x["score"], reverse=True)

#     return top











"""
AI Matching & Fairness Engine  –  SBERT Edition
================================================
"""
from __future__ import annotations
import math
import re
import os
import logging
import numpy as np
from functools import lru_cache
from typing import Any

# ─────────────────────────────────────────────────────────────────────────────
# Logger setup
# ─────────────────────────────────────────────────────────────────────────────
logger = logging.getLogger("fairness_matching")
if not logger.handlers:
    _handler = logging.StreamHandler()
    _handler.setFormatter(logging.Formatter(
        "[%(asctime)s] %(levelname)s [matching] %(message)s",
        datefmt="%H:%M:%S"
    ))
    logger.addHandler(_handler)
    logger.setLevel(logging.DEBUG)

# ─────────────────────────────────────────────────────────────────────────────
# Score threshold for warnings
# ─────────────────────────────────────────────────────────────────────────────
LOW_SCORE_THRESHOLD = 0.50   # 50 %

# ─────────────────────────────────────────────────────────────────────────────
# Weight constants
# ─────────────────────────────────────────────────────────────────────────────
W_SEMANTIC    = 0.35
W_SECTOR      = 0.25
W_GEO         = 0.20
W_FAIRNESS    = 0.12
W_CREDIBILITY = 0.08

# ─────────────────────────────────────────────────────────────────────────────
# Regional alias sets
# ─────────────────────────────────────────────────────────────────────────────
MYSURU_ALIASES = {
    "mysore", "mysuru", "mysuru district", "mysore district",
}
KARNATAKA_ALIASES = {
    "karnataka", "karnataka state", "south karnataka",
}
SOUTH_INDIA_ALIASES = {
    "south india", "southern india", "deccan",
}
MYSURU_NGO_SIGNAL_WORDS = {
    "mysore", "mysuru", "vivekananda", "akshaya", "divya",
    "ganabharathi", "graam", "natana", "odanadi", "sadhana",
    "vidyanikethan", "kanasu", "brahmavidya", "sjce",
}

# ─────────────────────────────────────────────────────────────────────────────
# SBERT model  (singleton, lazy-loaded)
# ─────────────────────────────────────────────────────────────────────────────
_SBERT_MODEL = None
_SBERT_MODEL_NAME = os.getenv(
    "SBERT_MODEL", "sentence-transformers/all-MiniLM-L6-v2"
)

def _get_sbert():
    global _SBERT_MODEL
    if _SBERT_MODEL is not None:
        return _SBERT_MODEL
    try:
        from sentence_transformers import SentenceTransformer
        logger.info(f"Loading SBERT model: {_SBERT_MODEL_NAME}")
        _SBERT_MODEL = SentenceTransformer(_SBERT_MODEL_NAME)
        logger.info("SBERT model loaded ✓")
    except ImportError:
        logger.warning(
            "sentence-transformers not installed. "
            "Falling back to TF-IDF cosine similarity."
        )
        _SBERT_MODEL = "TFIDF_FALLBACK"
    return _SBERT_MODEL

# ─────────────────────────────────────────────────────────────────────────────
# Embedding cache
# ─────────────────────────────────────────────────────────────────────────────
_EMBEDDING_CACHE: dict[str, np.ndarray] = {}

def _embed(text: str) -> np.ndarray | None:
    if not text.strip():
        return None
    model = _get_sbert()
    if model == "TFIDF_FALLBACK":
        return None
    if text in _EMBEDDING_CACHE:
        return _EMBEDDING_CACHE[text]
    vec = model.encode(text, convert_to_numpy=True, normalize_embeddings=True)
    _EMBEDDING_CACHE[text] = vec
    return vec

def _batch_embed_catalog(catalog: list[dict]) -> dict[str, np.ndarray]:
    model = _get_sbert()
    if model == "TFIDF_FALLBACK":
        return {}
    texts  = [_ngo_feature_text(ngo) for ngo in catalog]
    names  = [ngo.get("name", "") for ngo in catalog]
    logger.info(f"Batch-encoding {len(texts)} NGO profiles …")
    vectors = model.encode(
        texts,
        batch_size=32,
        convert_to_numpy=True,
        normalize_embeddings=True,
        show_progress_bar=False,
    )
    result = {name: vec for name, vec in zip(names, vectors)}
    _EMBEDDING_CACHE.update(
        {text: vec for text, vec in zip(texts, vectors)}
    )
    logger.info("Batch encoding done ✓")
    return result

# ─────────────────────────────────────────────────────────────────────────────
# TF-IDF fallback
# ─────────────────────────────────────────────────────────────────────────────
def _tokenize(text: str) -> list[str]:
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    return [t for t in text.split() if len(t) > 1]

def _build_tf(tokens: list[str]) -> dict[str, float]:
    tf: dict[str, float] = {}
    for t in tokens:
        tf[t] = tf.get(t, 0) + 1
    total = len(tokens) or 1
    return {t: c / total for t, c in tf.items()}

def _tfidf_cosine(text_a: str, text_b: str) -> float:
    tf_a = _build_tf(_tokenize(text_a))
    tf_b = _build_tf(_tokenize(text_b))
    common = set(tf_a) & set(tf_b)
    if not common:
        return 0.0
    dot   = sum(tf_a[k] * tf_b[k] for k in common)
    mag_a = math.sqrt(sum(v * v for v in tf_a.values()))
    mag_b = math.sqrt(sum(v * v for v in tf_b.values()))
    if mag_a == 0 or mag_b == 0:
        return 0.0
    return dot / (mag_a * mag_b)

# ─────────────────────────────────────────────────────────────────────────────
# Semantic similarity
# ─────────────────────────────────────────────────────────────────────────────
def _semantic_similarity(text_a: str, text_b: str) -> float:
    vec_a = _embed(text_a)
    vec_b = _embed(text_b)
    if vec_a is not None and vec_b is not None:
        score = float(np.dot(vec_a, vec_b))
        return max(0.0, min(score, 1.0))
    return _tfidf_cosine(text_a, text_b)

# ─────────────────────────────────────────────────────────────────────────────
# Catalog singleton
# ─────────────────────────────────────────────────────────────────────────────
_NGO_CATALOG: list[dict] | None = None
_NGO_EMBEDDINGS: dict[str, np.ndarray] = {}

def _get_catalog() -> list[dict]:
    global _NGO_CATALOG, _NGO_EMBEDDINGS
    if _NGO_CATALOG is None:
        try:
            from backend.ngo_catalog import NGO_CATALOG
        except ImportError:
            from ngo_catalog import NGO_CATALOG  # type: ignore
        _NGO_CATALOG = NGO_CATALOG
        _NGO_EMBEDDINGS = _batch_embed_catalog(_NGO_CATALOG)
    return _NGO_CATALOG

# ─────────────────────────────────────────────────────────────────────────────
# Feature text builders
# ─────────────────────────────────────────────────────────────────────────────
def _ngo_feature_text(ngo: dict) -> str:
    tags_expanded = ngo.get("sector_tags", "").replace("|", " ")
    parts = [
        ngo.get("name", ""),
        tags_expanded,
        tags_expanded,
        ngo.get("description", ""),
        ngo.get("state", ""),
        ngo.get("country", ""),
    ]
    return " ".join(p for p in parts if p).strip()

def _donor_feature_text(prefs: dict) -> str:
    parts = [
        prefs.get("sector", ""),
        prefs.get("sectors", "") if isinstance(prefs.get("sectors"), str)
            else " ".join(prefs.get("sectors") or []),
        prefs.get("interests", ""),
        prefs.get("location", ""),
        prefs.get("region", ""),
        prefs.get("city", ""),
        prefs.get("cause", ""),
        prefs.get("keywords", ""),
        prefs.get("mission", ""),
        prefs.get("focus", ""),
    ]
    return " ".join(str(p) for p in parts if p).strip()

# ─────────────────────────────────────────────────────────────────────────────
# Sector match score  (0 – 1)
# ─────────────────────────────────────────────────────────────────────────────
_SECTOR_SYNONYMS: dict[str, list[str]] = {
    "education":          ["education", "literacy", "schooling", "learning",
                           "academic", "skills development", "youth development"],
    "healthcare":         ["healthcare", "health", "medical", "disability",
                           "mental health", "nutrition"],
    "environment":        ["environment", "conservation", "climate action",
                           "ecology", "sustainability", "green"],
    "rural development":  ["rural development", "community development",
                           "livelihood", "agriculture"],
    "women empowerment":  ["women empowerment", "gender equality", "human rights",
                           "women", "gender"],
    "children":           ["children", "child welfare", "child rights",
                           "youth development", "kids"],
    "technology":         ["technology", "innovation", "ict", "science",
                           "digital", "stem"],
    "arts & culture":     ["art & culture", "arts", "culture", "heritage",
                           "music", "dance", "traditional"],
    "food security":      ["food security", "nutrition", "hunger", "meals",
                           "food"],
    "social justice":     ["social justice", "human rights", "equality",
                           "civil rights"],
}

def _expand_sector(sector_term: str) -> set[str]:
    term_lower = sector_term.strip().lower()
    expanded = {term_lower}
    for canonical, synonyms in _SECTOR_SYNONYMS.items():
        if term_lower == canonical or term_lower in synonyms:
            expanded.update(synonyms)
            expanded.add(canonical)
    return expanded

def _sector_match(ngo_tags: str, donor_sectors: list[str]) -> float:
    if not donor_sectors:
        return 0.5
    ngo_tag_set = {t.strip().lower() for t in ngo_tags.split("|")}
    best_hit = 0.0
    for ds in donor_sectors:
        expanded_donor = _expand_sector(ds)
        hits = ngo_tag_set & expanded_donor
        if hits:
            best_hit = max(best_hit, len(hits) / max(len(ngo_tag_set), 1))
            continue
        partial = sum(
            1 for dw in expanded_donor
            for nw in ngo_tag_set
            if dw in nw or nw in dw
        )
        best_hit = max(best_hit, min(partial * 0.12, 0.4))
    return min(best_hit, 1.0)

# ─────────────────────────────────────────────────────────────────────────────
# Geographic affinity  (0 – 1)
# ─────────────────────────────────────────────────────────────────────────────
def _geo_score(ngo: dict, prefs: dict) -> float:
    location_hint = " ".join([
        prefs.get("location", ""),
        prefs.get("region", ""),
        prefs.get("city", ""),
    ]).lower()
    ngo_state      = ngo.get("state", "").lower()
    ngo_country    = ngo.get("country", "").lower()
    ngo_name_lower = ngo.get("name", "").lower()

    if any(a in location_hint for a in MYSURU_ALIASES):
        if any(a in ngo_state for a in MYSURU_ALIASES):       return 1.0
        if any(a in ngo_state for a in KARNATAKA_ALIASES):    return 0.88
        if any(w in ngo_name_lower for w in MYSURU_NGO_SIGNAL_WORDS): return 0.82
        if ngo_country == "india":                            return 0.42
        if ngo_country == "global":                           return 0.28
        return 0.10

    if any(a in location_hint for a in KARNATAKA_ALIASES):
        if any(a in ngo_state for a in KARNATAKA_ALIASES):    return 1.0
        if ngo_country == "india":                            return 0.48
        if ngo_country == "global":                           return 0.28
        return 0.10

    if any(a in location_hint for a in SOUTH_INDIA_ALIASES):
        if any(a in ngo_state for a in KARNATAKA_ALIASES):    return 0.90
        if ngo_country == "india":                            return 0.58
        if ngo_country == "global":                           return 0.28
        return 0.15

    if "india" in location_hint:
        if ngo_country == "india":                            return 0.90
        if ngo_country == "global":                           return 0.52
        return 0.22

    if not location_hint.strip():
        if ngo_country == "india":                            return 0.62
        if ngo_country == "global":                           return 0.55
        return 0.40

    if ngo_country == "global":                               return 0.72
    if ngo_country == "india":                                return 0.32
    return 0.22

# ─────────────────────────────────────────────────────────────────────────────
# Fairness / under-recognition boost  (0 – 1)
# ─────────────────────────────────────────────────────────────────────────────
_WELL_KNOWN_NGOS = {
    "cry", "pratham", "teach for india", "akshaya patra",
    "smile foundation", "sewa", "helpage india", "barefoot college",
    "magic bus", "wwf", "greenpeace", "oxfam", "care india",
    "azim premji foundation", "habitat for humanity", "sightsavers",
    "giveindia", "save the children", "wateraid", "unicef",
    "red cross", "doctors without borders",
}
_NICHE_SECTORS = {
    "art & culture", "heritage", "culture", "social justice",
    "human rights", "traditional education", "elderly welfare",
    "disability", "research", "public policy",
}

def _recognition_tier(ngo_name: str) -> str:
    name_lower = ngo_name.lower()
    if any(wk in name_lower for wk in _WELL_KNOWN_NGOS):
        return "well_known"
    grassroots_signals = [
        "trust", "samsthe", "kendra", "ashrama", "seva",
        "samiti", "sangha", "gram", "graam",
    ]
    if any(gs in name_lower for gs in grassroots_signals):
        return "grassroots"
    return "mid_tier"

def _fairness_boost(ngo: dict, prefs: dict) -> float:
    tier = _recognition_tier(ngo.get("name", ""))
    recognition_score = {"grassroots": 1.0, "mid_tier": 0.65, "well_known": 0.20}[tier]
    has_location_pref = bool(
        (prefs.get("location") or "").strip()
        or (prefs.get("region") or "").strip()
        or (prefs.get("city") or "").strip()
    )
    ngo_state  = ngo.get("state", "").lower()
    is_regional = any(
        a in ngo_state for a in MYSURU_ALIASES | KARNATAKA_ALIASES
    )
    location_diversity_score = (
        0.80 if (not has_location_pref and is_regional) else 0.40
    )
    ngo_sectors  = {s.strip().lower() for s in ngo.get("sector_tags", "").split("|")}
    niche_score  = min(len(ngo_sectors & _NICHE_SECTORS) * 0.25, 0.80)
    return (recognition_score * 0.55) + (location_diversity_score * 0.25) + (niche_score * 0.20)

# ─────────────────────────────────────────────────────────────────────────────
# Credibility score  (0 – 1)
# ─────────────────────────────────────────────────────────────────────────────
def _credibility_score(ngo: dict, db_ngo_map: dict[str, Any]) -> float:
    ngo_name = ngo.get("name", "")
    if ngo_name in db_ngo_map:
        raw = float(db_ngo_map[ngo_name].get("credibility_score") or 40.0)
        return raw / 100.0
    verified = ngo.get("country", "").lower() in {"india", "global"}
    base     = 0.55 if verified else 0.35
    richness = min(len(ngo.get("description", "")) / 600.0, 0.20)
    return min(base + richness, 1.0)

# ─────────────────────────────────────────────────────────────────────────────
# DB enrichment
# ─────────────────────────────────────────────────────────────────────────────
def _build_db_ngo_map() -> dict[str, Any]:
    try:
        try:
            from backend.models import NGOProfile
        except ImportError:
            from models import NGOProfile  # type: ignore
        result: dict[str, Any] = {}
        for rec in NGOProfile.query.all():
            name = (
                rec.user.organization_name
                if rec.user and rec.user.organization_name
                else (rec.user.name if rec.user else "")
            )
            result[name] = {
                "credibility_score":   rec.credibility_score,
                "verification_status": rec.verification_status,
            }
        return result
    except Exception:
        return {}

# ─────────────────────────────────────────────────────────────────────────────
# Terminal logging helpers
# ─────────────────────────────────────────────────────────────────────────────
def _log_score_table_header(match_type: str, left_label: str, right_label: str):
    """Print a formatted table header for a matching session."""
    width = 110
    logger.info("=" * width)
    logger.info(f"  MATCHING SESSION  │  {match_type}")
    logger.info(f"  {left_label}  →  {right_label}")
    logger.info("=" * width)
    logger.info(
        f"  {'Rank':<5} {'Name':<38} {'Total':>7} "
        f"{'Semantic':>9} {'Sector':>8} {'Geo':>6} "
        f"{'Fair':>6} {'Cred':>6}  {'Engine':<6}  {'⚠ Low?':<6}"
    )
    logger.info("-" * width)

def _log_score_row(
    rank: int,
    name: str,
    score: float,
    breakdown: dict,
    engine: str = "sbert",
):
    """Print a single scored result row."""
    flag = "⚠ LOW" if score < LOW_SCORE_THRESHOLD else ""
    logger.info(
        f"  {rank:<5} {name[:37]:<38} {score:>7.4f} "
        f"{breakdown.get('semantic_similarity', breakdown.get('semantic', 0)):>9.4f} "
        f"{breakdown.get('sector_match', breakdown.get('sector_alignment', 0)):>8.4f} "
        f"{breakdown.get('geographic_affinity', breakdown.get('geographic_alignment', 0)):>6.4f} "
        f"{breakdown.get('fairness_boost', 0):>6.4f} "
        f"{breakdown.get('credibility', breakdown.get('giving_capacity', 0)):>6.4f}  "
        f"{engine:<6}  {flag:<6}"
    )

def _log_score_table_footer(
    match_type: str,
    total_evaluated: int,
    results_shown: int,
    low_count: int,
):
    width = 110
    logger.info("-" * width)
    logger.info(
        f"  {match_type} │ Evaluated: {total_evaluated} │ "
        f"Shown: {results_shown} │ Below 50% threshold: {low_count}"
    )
    logger.info("=" * width)

def _collect_low_score_warnings(
    results: list[dict],
    left_name: str,
    match_type: str,
) -> list[dict]:
    """
    Return structured warning objects for every result whose
    alignment / composite score is below LOW_SCORE_THRESHOLD.
    These are forwarded to the API response so the frontend
    can display popup alerts.
    """
    warnings = []
    score_key = "score" if "score" in (results[0] if results else {}) else "alignment_score"
    for r in results:
        s = r.get(score_key, 1.0)
        if s < LOW_SCORE_THRESHOLD:
            name_key = (
                "name"       if "name"       in r else
                "donor_name" if "donor_name" in r else
                "corporate_name"
            )
            warnings.append({
                "match_type":    match_type,
                "left_entity":   left_name,
                "right_entity":  r.get(name_key, "Unknown"),
                "score":         round(s, 4),
                "score_pct":     f"{s * 100:.1f}%",
                "message": (
                    f"Low alignment ({s * 100:.1f}%) between "
                    f"'{left_name}' and '{r.get(name_key, 'Unknown')}'. "
                    f"Consider refining sector or location preferences."
                ),
            })
    return warnings

# ─────────────────────────────────────────────────────────────────────────────
# Core NGO scorer
# ─────────────────────────────────────────────────────────────────────────────
def _score_ngo_for_donor(
    ngo: dict,
    donor_text: str,
    donor_sectors: list[str],
    prefs: dict,
    db_ngo_map: dict[str, Any],
) -> dict:
    ngo_text  = _ngo_feature_text(ngo)
    ngo_name  = ngo.get("name", "")
    ngo_vec   = _NGO_EMBEDDINGS.get(ngo_name) or _embed(ngo_text)
    donor_vec = _embed(donor_text)

    if ngo_vec is not None and donor_vec is not None:
        semantic = float(max(0.0, min(np.dot(ngo_vec, donor_vec), 1.0)))
        engine   = "sbert"
    else:
        semantic = _tfidf_cosine(ngo_text, donor_text)
        engine   = "tfidf"

    sector      = _sector_match(ngo.get("sector_tags", ""), donor_sectors)
    geo         = _geo_score(ngo, prefs)
    fairness    = _fairness_boost(ngo, prefs)
    credibility = _credibility_score(ngo, db_ngo_map)

    composite = (
        W_SEMANTIC      * semantic
        + W_SECTOR      * sector
        + W_GEO         * geo
        + W_FAIRNESS    * fairness
        + W_CREDIBILITY * credibility
    )

    return {
        "name":        ngo_name,
        "sector_tags": ngo.get("sector_tags"),
        "state":       ngo.get("state"),
        "country":     ngo.get("country"),
        "description": ngo.get("description"),
        "score":       round(composite, 4),
        "score_breakdown": {
            "semantic_similarity": round(semantic, 4),
            "sector_match":        round(sector, 4),
            "geographic_affinity": round(geo, 4),
            "fairness_boost":      round(fairness, 4),
            "credibility":         round(credibility, 4),
            "similarity_engine":   engine,
        },
        "recognition_tier": _recognition_tier(ngo_name),
        "db_enriched":      ngo_name in db_ngo_map,
    }

# ─────────────────────────────────────────────────────────────────────────────
# Public API 1 – Donor → NGO
# ─────────────────────────────────────────────────────────────────────────────
def get_ngo_recommendations(
    prefs: dict,
    top_n: int = 10,
    ensure_grassroots: int = 3,
) -> list[dict]:
    catalog    = _get_catalog()
    db_ngo_map = _build_db_ngo_map()

    donor_sectors: list[str] = []
    if prefs.get("sectors"):
        raw = prefs["sectors"]
        donor_sectors = raw if isinstance(raw, list) else [s.strip() for s in raw.split("|")]
    if prefs.get("sector") and prefs["sector"] not in donor_sectors:
        donor_sectors.append(str(prefs["sector"]))

    donor_text  = _donor_feature_text(prefs)
    donor_label = prefs.get("name") or prefs.get("sector") or "Anonymous Donor"

    logger.info(
        f"[Donor→NGO] Scoring {len(catalog)} NGOs for donor: '{donor_label}' "
        f"| sectors={donor_sectors} "
        f"| location='{prefs.get('location','') or prefs.get('city','')}'"
    )

    scored = [
        _score_ngo_for_donor(ngo, donor_text, donor_sectors, prefs, db_ngo_map)
        for ngo in catalog
    ]
    scored.sort(key=lambda x: x["score"], reverse=True)

    # Grassroots injection
    top = scored[:top_n]
    grassroots_in_top = sum(1 for r in top if r["recognition_tier"] == "grassroots")
    if grassroots_in_top < ensure_grassroots:
        remainder  = scored[top_n:]
        extra      = [r for r in remainder if r["recognition_tier"] == "grassroots"][
                         : ensure_grassroots - grassroots_in_top]
        wk_indices = [i for i, r in enumerate(top) if r["recognition_tier"] == "well_known"]
        for idx, replacement in zip(wk_indices[-(len(extra)):], extra):
            top[idx] = replacement
        top.sort(key=lambda x: x["score"], reverse=True)

    # ── Terminal table ────────────────────────────────────────────────────────
    _log_score_table_header("Donor → NGO", f"Donor: {donor_label}", "Top NGO Matches")
    low_count = 0
    for rank, r in enumerate(top, 1):
        bd = r["score_breakdown"]
        engine = bd.get("similarity_engine", "sbert")
        _log_score_row(rank, r["name"], r["score"], bd, engine)
        if r["score"] < LOW_SCORE_THRESHOLD:
            low_count += 1
    _log_score_table_footer("Donor→NGO", len(catalog), len(top), low_count)

    return top

# ─────────────────────────────────────────────────────────────────────────────
# Public API 2 – NGO → Donor pool
# ─────────────────────────────────────────────────────────────────────────────
def get_donor_matches_for_ngo(
    ngo_prefs: dict,
    donor_pool: list[dict],
    top_n: int = 10,
) -> list[dict]:
    ngo_label = ngo_prefs.get("name", "Unknown NGO")

    ngo_text = " ".join([
        ngo_prefs.get("name", ""),
        ngo_prefs.get("sector", ""),
        ngo_prefs.get("sector", ""),
        ngo_prefs.get("description", ""),
        ngo_prefs.get("mission_statement", ""),
        ngo_prefs.get("geographic_focus", ""),
    ])
    ngo_sectors = {s.strip().lower() for s in ngo_prefs.get("sector", "").split("|")}

    logger.info(
        f"[NGO→Donor] Scoring {len(donor_pool)} donors for NGO: '{ngo_label}' "
        f"| sectors={list(ngo_sectors)} "
        f"| geo='{ngo_prefs.get('geographic_focus', '')}'"
    )

    results = []
    for donor in donor_pool:
        donor_text = " ".join([
            donor.get("name", ""),
            donor.get("interests", ""),
            donor.get("sector_focus", ""),
            donor.get("sector_focus", ""),
            donor.get("description", ""),
            donor.get("location", ""),
        ])

        semantic = _semantic_similarity(ngo_text, donor_text)

        donor_sectors = {
            s.strip().lower()
            for s in donor.get("sector_focus", "").split("|") if s.strip()
        }
        shared       = ngo_sectors & donor_sectors
        sector_align = len(shared) / max(len(ngo_sectors | donor_sectors), 1)

        donor_loc = donor.get("location", "").lower()
        ngo_geo   = ngo_prefs.get("geographic_focus", "").lower()
        if any(a in donor_loc for a in MYSURU_ALIASES) and \
           any(a in ngo_geo   for a in MYSURU_ALIASES | KARNATAKA_ALIASES):
            geo_align = 1.0
        elif "karnataka" in donor_loc and "karnataka" in ngo_geo:
            geo_align = 0.90
        elif "india" in donor_loc and "india" in ngo_geo:
            geo_align = 0.65
        else:
            geo_align = 0.30

        cap_raw = donor.get("giving_capacity", "")
        if isinstance(cap_raw, (int, float)):
            capacity = min(math.log1p(float(cap_raw)) / math.log1p(10_000_000), 1.0)
        else:
            capacity = {"low": 0.25, "medium": 0.50, "high": 0.75, "enterprise": 1.0}.get(
                str(cap_raw).lower(), 0.5
            )

        alignment = (
            0.35 * semantic
            + 0.30 * sector_align
            + 0.20 * geo_align
            + 0.15 * capacity
        )

        results.append({
            "donor_name":      donor.get("name"),
            "donor_type":      donor.get("type", "individual"),
            "location":        donor.get("location"),
            "sector_focus":    donor.get("sector_focus"),
            "alignment_score": round(alignment, 4),
            "score_breakdown": {
                "semantic_similarity":  round(semantic, 4),
                "sector_alignment":     round(sector_align, 4),
                "geographic_alignment": round(geo_align, 4),
                "giving_capacity":      round(capacity, 4),
            },
            "shared_sectors": list(shared),
        })

    results.sort(key=lambda x: x["alignment_score"], reverse=True)
    top_results = results[:top_n]

    # ── Terminal table ────────────────────────────────────────────────────────
    _log_score_table_header("NGO → Donor", f"NGO: {ngo_label}", "Top Donor Matches")
    low_count = 0
    for rank, r in enumerate(top_results, 1):
        bd     = r["score_breakdown"]
        engine = "sbert" if _get_sbert() != "TFIDF_FALLBACK" else "tfidf"
        _log_score_row(rank, r.get("donor_name", "?"), r["alignment_score"], bd, engine)
        if r["alignment_score"] < LOW_SCORE_THRESHOLD:
            low_count += 1
    _log_score_table_footer("NGO→Donor", len(donor_pool), len(top_results), low_count)

    return top_results

# ─────────────────────────────────────────────────────────────────────────────
# Public API 3 – Corporate → NGO  (CSR matching)
# ─────────────────────────────────────────────────────────────────────────────
_CORPORATE_SECTOR_MAP: dict[str, list[str]] = {
    "education":        ["education", "literacy", "youth development", "skills development"],
    "healthcare":       ["healthcare", "health", "disability", "mental health"],
    "environment":      ["environment", "conservation", "climate action", "sustainability"],
    "rural development":["rural development", "community development", "livelihood"],
    "women empowerment":["women empowerment", "gender equality", "human rights"],
    "technology":       ["technology", "innovation", "science", "ict"],
    "arts & culture":   ["art & culture", "heritage", "culture"],
    "food security":    ["food security", "nutrition"],
    "social justice":   ["social justice", "child rights", "human rights"],
}

def _expand_corporate_sectors(csr_focus: list[str]) -> list[str]:
    expanded = []
    for focus in csr_focus:
        fl = focus.strip().lower()
        for key, synonyms in _CORPORATE_SECTOR_MAP.items():
            if fl == key or fl in synonyms:
                expanded.extend(synonyms)
    return list(set(expanded)) or csr_focus

def get_corporate_ngo_matches(
    corporate_prefs: dict,
    top_n: int = 10,
    ensure_grassroots: int = 2,
) -> list[dict]:
    catalog    = _get_catalog()
    db_ngo_map = _build_db_ngo_map()

    csr_raw: list[str] = corporate_prefs.get("csr_focus", [])
    if isinstance(csr_raw, str):
        csr_raw = [s.strip() for s in csr_raw.split("|")]

    expanded        = _expand_corporate_sectors(csr_raw)
    scale_pref      = corporate_prefs.get("preferred_scale", "").lower()
    scale_geo_boost = scale_pref in {"local", "regional"}
    corp_label      = corporate_prefs.get("name", "Anonymous Corporate")

    synth_prefs = {
        "sector":    "|".join(expanded),
        "sectors":   expanded,
        "location":  corporate_prefs.get("location", ""),
        "keywords":  corporate_prefs.get("keywords", ""),
        "interests": " ".join(csr_raw),
    }

    logger.info(
        f"[Corporate→NGO] Scoring {len(catalog)} NGOs for corporate: '{corp_label}' "
        f"| csr_focus={csr_raw} "
        f"| location='{corporate_prefs.get('location', '')}'"
    )

    donor_text = _donor_feature_text(synth_prefs)
    scored = []
    for ngo in catalog:
        base = _score_ngo_for_donor(ngo, donor_text, expanded, synth_prefs, db_ngo_map)
        ngo_state = ngo.get("state", "").lower()
        if scale_geo_boost and any(
            a in ngo_state for a in MYSURU_ALIASES | KARNATAKA_ALIASES
        ):
            base["score"] = min(base["score"] * 1.18, 1.0)
            base["score_breakdown"]["scale_geo_bonus"] = True
        base["csr_sector_overlap"] = [
            s for s in expanded if s in ngo.get("sector_tags", "").lower()
        ]
        scored.append(base)

    scored.sort(key=lambda x: x["score"], reverse=True)

    # Grassroots guarantee
    top = scored[:top_n]
    grassroots_in_top = sum(1 for r in top if r["recognition_tier"] == "grassroots")
    if grassroots_in_top < ensure_grassroots:
        extra  = [r for r in scored[top_n:] if r["recognition_tier"] == "grassroots"][
                     : ensure_grassroots - grassroots_in_top]
        wk_idx = [i for i, r in enumerate(top) if r["recognition_tier"] == "well_known"]
        for idx, rep in zip(wk_idx[-(len(extra)):], extra):
            top[idx] = rep
        top.sort(key=lambda x: x["score"], reverse=True)

    # ── Terminal table ────────────────────────────────────────────────────────
    _log_score_table_header("Corporate → NGO", f"Corporate: {corp_label}", "Top NGO Matches")
    low_count = 0
    for rank, r in enumerate(top, 1):
        bd     = r["score_breakdown"]
        engine = bd.get("similarity_engine", "sbert")
        _log_score_row(rank, r["name"], r["score"], bd, engine)
        if r["score"] < LOW_SCORE_THRESHOLD:
            low_count += 1
    _log_score_table_footer("Corporate→NGO", len(catalog), len(top), low_count)

    return top
