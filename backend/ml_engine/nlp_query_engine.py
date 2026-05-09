"""
Natural Language Query Engine
==============================
Converts free-text user queries into structured search intents,
then routes them to the appropriate matching pipeline.

Examples of queries handled:
  "find education NGOs near Mysuru"
  "show healthcare organizations in Karnataka"
  "I want to donate to child welfare causes"
  "which NGOs work on environment in South India?"
  "grassroots NGOs for women empowerment"
  "compare education and healthcare NGOs"
  "top rated NGOs in Bangalore"
  "NGOs accepting donations under 1000 rupees"
"""

from __future__ import annotations

import re
import math
from typing import Any


# ─────────────────────────────────────────────────────────────────────────────
# Entity Dictionaries  (domain knowledge for intent extraction)
# ─────────────────────────────────────────────────────────────────────────────

# Sector synonyms → canonical tag
SECTOR_PATTERNS: dict[str, list[str]] = {
    "Education": [
        "education", "school", "schooling", "literacy", "learning",
        "teaching", "academic", "study", "students", "scholarship",
        "gurukul", "college", "university", "tutoring", "elearning",
    ],
    "Healthcare": [
        "health", "healthcare", "medical", "hospital", "doctor",
        "medicine", "treatment", "clinic", "disease", "patient",
        "nutrition", "wellness", "mental health", "disability",
    ],
    "Food Security": [
        "food", "hunger", "meal", "nutrition", "midday meal",
        "starvation", "feeding", "ration", "famine", "nourishment",
    ],
    "Environment": [
        "environment", "climate", "ecology", "conservation", "forest",
        "wildlife", "green", "pollution", "sustainability", "biodiversity",
        "renewable", "solar", "tree", "nature", "carbon",
    ],
    "Women Empowerment": [
        "women", "woman", "girl", "gender", "female", "empowerment",
        "self help group", "shg", "domestic violence", "maternal",
    ],
    "Children": [
        "child", "children", "kids", "orphan", "juvenile",
        "infant", "toddler", "minor", "underage", "youth",
    ],
    "Rural Development": [
        "rural", "village", "farming", "agriculture", "livelihood",
        "community", "panchayat", "gram", "tribal", "adivasi",
    ],
    "Art & Culture": [
        "art", "culture", "music", "dance", "heritage", "theatre",
        "drama", "classical", "craft", "painting", "performance",
    ],
    "Technology": [
        "technology", "tech", "ict", "digital", "computer",
        "innovation", "startup", "software", "internet", "stem",
    ],
    "Social Justice": [
        "justice", "rights", "equality", "discrimination", "marginalized",
        "dalit", "caste", "human rights", "advocacy", "empowerment",
    ],
    "Elderly Welfare": [
        "elderly", "senior", "old age", "geriatric", "pensioner",
        "aged", "grandfather", "grandmother", "retirement",
    ],
    "Disaster Relief": [
        "disaster", "relief", "flood", "earthquake", "emergency",
        "humanitarian", "rescue", "rehabilitation", "cyclone",
    ],
    "Research": [
        "research", "study", "analysis", "policy", "data",
        "evidence", "publication", "academic", "institute",
    ],
    "Skills Development": [
        "skill", "vocational", "training", "workshop", "apprentice",
        "employability", "career", "job", "placement",
    ],
}

# Location patterns → normalized region
LOCATION_PATTERNS: dict[str, list[str]] = {
    "Mysuru": [
        "mysore", "mysuru", "mysore city", "mysuru city",
        "chamundi", "brindavan", "srirangapatna",
    ],
    "Karnataka": [
        "karnataka", "bangalore", "bengaluru", "hubli", "dharwad",
        "mangalore", "mangaluru", "belagavi", "belgaum", "tumkur",
        "hassan", "shimoga", "shivamogga", "mandya", "chamarajanagar",
        "kodagu", "coorg", "udupi", "davangere", "bidar",
        "kolar", "raichur", "koppal", "gadag", "haveri",
        "south karnataka", "north karnataka",
    ],
    "South India": [
        "south india", "tamilnadu", "tamil", "kerala", "andhra",
        "telangana", "hyderabad", "chennai", "kochi", "deccan",
    ],
    "Maharashtra": [
        "maharashtra", "mumbai", "pune", "nagpur", "nashik",
        "aurangabad", "thane",
    ],
    "Delhi": [
        "delhi", "new delhi", "ncr", "gurgaon", "noida", "faridabad",
    ],
    "Gujarat": [
        "gujarat", "ahmedabad", "surat", "vadodara", "rajkot",
    ],
    "Rajasthan": [
        "rajasthan", "jaipur", "jodhpur", "udaipur", "ajmer",
    ],
    "India": [
        "india", "indian", "pan india", "national", "all india",
        "across india", "throughout india",
    ],
    "Global": [
        "global", "international", "worldwide", "world", "abroad",
    ],
}

# Intent signal words
INTENT_FIND_WORDS = [
    "find", "search", "show", "list", "display", "get", "fetch",
    "recommend", "suggest", "discover", "explore", "look for",
    "want", "need", "looking for", "interested in", "tell me about",
]
INTENT_DONATE_WORDS = [
    "donate", "donation", "contribute", "give", "fund", "sponsor",
    "support financially", "invest in", "pay", "transfer",
]
INTENT_COMPARE_WORDS = [
    "compare", "difference", "vs", "versus", "which is better",
    "contrast", "rank", "top", "best", "highest rated",
]
INTENT_INFO_WORDS = [
    "what is", "who is", "tell me", "explain", "describe",
    "information about", "details of", "about",
]

# Recognition tier filters
TIER_PATTERNS = {
    "grassroots": ["grassroots", "small", "local ngo", "community based",
                   "lesser known", "under recognized", "unknown", "tiny"],
    "well_known":  ["well known", "famous", "popular", "large", "big",
                   "established", "national level", "international"],
}

# Budget patterns  (extracts numeric amounts)
BUDGET_PATTERN = re.compile(
    r"(?:rs\.?|inr|₹|usd|\$)?\s*(\d[\d,]*)\s*"
    r"(?:rupees?|rs\.?|inr|dollars?|usd)?",
    re.IGNORECASE,
)

# Negation words (for "NOT education" style queries)
NEGATION_WORDS = ["not", "no", "except", "excluding", "without", "ignore",
                  "don't", "dont", "avoid", "skip"]


# ─────────────────────────────────────────────────────────────────────────────
# Core NLP Parser
# ─────────────────────────────────────────────────────────────────────────────

class QueryIntent:
    """Structured representation of a parsed natural language query."""

    def __init__(self):
        self.raw_query:        str        = ""
        self.intent:           str        = "find"   # find|donate|compare|info
        self.sectors:          list[str]  = []
        self.excluded_sectors: list[str]  = []
        self.locations:        list[str]  = []
        self.tier_filter:      str | None = None     # grassroots|well_known|None
        self.budget_min:       float | None = None
        self.budget_max:       float | None = None
        self.top_n:            int         = 10
        self.keywords:         list[str]   = []
        self.is_question:      bool        = False
        self.confidence:       float       = 0.0

    def to_matching_prefs(self) -> dict:
        """Convert intent to the prefs dict expected by the SBERT engine."""
        return {
            "sectors":   self.sectors,
            "sector":    self.sectors[0] if self.sectors else "",
            "location":  self.locations[0] if self.locations else "",
            "interests": " ".join(self.keywords + self.sectors),
            "keywords":  " ".join(self.keywords),
            "cause":     " ".join(self.sectors),
        }

    def to_dict(self) -> dict:
        return {
            "intent":           self.intent,
            "sectors":          self.sectors,
            "excluded_sectors": self.excluded_sectors,
            "locations":        self.locations,
            "tier_filter":      self.tier_filter,
            "budget_min":       self.budget_min,
            "budget_max":       self.budget_max,
            "top_n":            self.top_n,
            "keywords":         self.keywords,
            "confidence":       round(self.confidence, 3),
        }


def parse_query(raw: str) -> QueryIntent:
    """
    Main NLP parsing pipeline.

    Steps:
    1.  Normalise text
    2.  Detect negation windows
    3.  Extract intent verb
    4.  Extract sector entities
    5.  Extract location entities
    6.  Extract tier filter
    7.  Extract budget constraints
    8.  Extract residual keywords
    9.  Score confidence
    """
    intent = QueryIntent()
    intent.raw_query = raw

    if not raw or not raw.strip():
        return intent

    text = raw.strip().lower()
    intent.is_question = text.endswith("?") or text.startswith(
        ("what", "who", "where", "which", "how", "when", "why", "is ", "are ", "do ", "does ")
    )

    # ── 1. Intent detection ──────────────────────────────────────────────────
    if any(w in text for w in INTENT_DONATE_WORDS):
        intent.intent = "donate"
    elif any(w in text for w in INTENT_COMPARE_WORDS):
        intent.intent = "compare"
    elif any(w in text for w in INTENT_INFO_WORDS):
        intent.intent = "info"
    else:
        intent.intent = "find"

    # ── 2. Negation windows ──────────────────────────────────────────────────
    # Build a set of token positions that follow a negation word
    tokens = text.split()
    negated_positions: set[int] = set()
    for i, tok in enumerate(tokens):
        if tok in NEGATION_WORDS:
            # Mark next 4 tokens as negated
            for j in range(i + 1, min(i + 5, len(tokens))):
                negated_positions.add(j)

    # ── 3. Sector extraction ─────────────────────────────────────────────────
    for canonical, synonyms in SECTOR_PATTERNS.items():
        matched = False
        for syn in synonyms:
            idx = text.find(syn)
            if idx == -1:
                continue
            # Check if any token of the synonym is in a negated window
            syn_start_token = len(text[:idx].split())
            is_negated = any(
                t in negated_positions
                for t in range(syn_start_token, syn_start_token + len(syn.split()))
            )
            if is_negated:
                if canonical not in intent.excluded_sectors:
                    intent.excluded_sectors.append(canonical)
            else:
                if canonical not in intent.sectors:
                    intent.sectors.append(canonical)
            matched = True
            break

    # ── 4. Location extraction ───────────────────────────────────────────────
    for normalized, aliases in LOCATION_PATTERNS.items():
        for alias in aliases:
            if alias in text:
                if normalized not in intent.locations:
                    intent.locations.append(normalized)
                break

    # ── 5. Tier filter ───────────────────────────────────────────────────────
    for tier, signals in TIER_PATTERNS.items():
        if any(s in text for s in signals):
            intent.tier_filter = tier
            break

    # ── 6. Budget extraction ─────────────────────────────────────────────────
    amounts = []
    for m in BUDGET_PATTERN.finditer(text):
        try:
            amounts.append(float(m.group(1).replace(",", "")))
        except ValueError:
            pass
    if len(amounts) == 1:
        # Single amount → treat as max budget
        intent.budget_max = amounts[0]
    elif len(amounts) >= 2:
        intent.budget_min = min(amounts)
        intent.budget_max = max(amounts)

    # ── 7. top_n extraction ──────────────────────────────────────────────────
    top_n_match = re.search(
        r"(?:top|best|show|find|list)\s+(\d+)", text
    )
    if top_n_match:
        n = int(top_n_match.group(1))
        intent.top_n = max(1, min(n, 50))

    # ── 8. Residual keyword extraction ──────────────────────────────────────
    # Remove stop words and already-matched entities
    stop_words = {
        "i", "me", "my", "we", "you", "it", "is", "are", "was", "were",
        "a", "an", "the", "and", "or", "but", "in", "on", "at", "to",
        "for", "of", "with", "by", "from", "that", "this", "which",
        "want", "need", "find", "show", "get", "give", "help",
        "ngo", "ngos", "organization", "organisations", "trust", "foundation",
        "near", "around", "close", "nearby", "about",
        "some", "any", "all", "both", "more", "most",
        "please", "can", "could", "would", "should",
    }
    matched_entity_words: set[str] = set()
    for sector in intent.sectors + intent.excluded_sectors:
        matched_entity_words.update(sector.lower().split())
    for loc in intent.locations:
        matched_entity_words.update(loc.lower().split())

    keywords = []
    for tok in tokens:
        clean = re.sub(r"[^a-z0-9]", "", tok)
        if (
            clean
            and len(clean) > 2
            and clean not in stop_words
            and clean not in matched_entity_words
        ):
            keywords.append(clean)
    intent.keywords = list(dict.fromkeys(keywords))  # deduplicate, preserve order

    # ── 9. Confidence scoring ────────────────────────────────────────────────
    score = 0.0
    if intent.sectors:    score += 0.40
    if intent.locations:  score += 0.25
    if intent.intent != "find": score += 0.10
    if intent.tier_filter:score += 0.10
    if intent.keywords:   score += min(len(intent.keywords) * 0.03, 0.15)
    intent.confidence = min(score, 1.0)

    return intent


# ─────────────────────────────────────────────────────────────────────────────
# Result explainer  –  generates human-readable reasoning per result
# ─────────────────────────────────────────────────────────────────────────────

def explain_result(ngo: dict, intent: QueryIntent) -> str:
    """
    Generate a one-sentence natural language explanation of WHY
    this NGO was matched to the user's query.
    """
    reasons = []

    # Sector match
    ngo_sectors = {s.strip().lower() for s in (ngo.get("sector_tags") or "").split("|")}
    matched_sectors = [
        s for s in intent.sectors
        if s.lower() in ngo_sectors or any(s.lower() in ns for ns in ngo_sectors)
    ]
    if matched_sectors:
        reasons.append(f"works in {', '.join(matched_sectors)}")

    # Location match
    ngo_state = (ngo.get("state") or "").lower()
    ngo_name  = (ngo.get("name")  or "").lower()
    if intent.locations:
        for loc in intent.locations:
            loc_lower = loc.lower()
            if loc_lower in ngo_state or loc_lower in ngo_name:
                reasons.append(f"is based in {loc}")
                break
        else:
            if ngo.get("country", "").lower() == "india" and "India" in intent.locations:
                reasons.append("operates across India")

    # Tier
    tier = ngo.get("recognition_tier", "")
    if intent.tier_filter == "grassroots" and tier == "grassroots":
        reasons.append("is a grassroots community organisation")
    elif intent.tier_filter == "well_known" and tier == "well_known":
        reasons.append("is a well-established national organisation")

    # Score
    score = ngo.get("score", 0)
    if score >= 0.70:
        reasons.append(f"has a strong match score ({int(score * 100)}%)")
    elif score >= 0.50:
        reasons.append(f"has a good match score ({int(score * 100)}%)")

    if not reasons:
        return "Matched based on semantic similarity to your query."

    return "Matched because it " + " and ".join(reasons) + "."


# ─────────────────────────────────────────────────────────────────────────────
# NLP Query Runner  –  orchestrates parse → search → explain
# ─────────────────────────────────────────────────────────────────────────────

def run_nlp_query(raw_query: str, top_n: int = 10) -> dict:
    """
    Full pipeline: natural language → structured results.

    Returns
    -------
    {
        "query":        str,
        "intent":       dict,
        "results":      list[dict],   ← NGOs with match explanations
        "summary":      str,          ← Human-readable summary sentence
        "suggestions":  list[str],    ← Follow-up query suggestions
    }
    """
    # Import here to avoid circular imports
    try:
        from backend.ml_engine.fairness_matching import (
            get_ngo_recommendations, get_corporate_ngo_matches,
        )
    except ImportError:
        from ml_engine.fairness_matching import (  # type: ignore
            get_ngo_recommendations, get_corporate_ngo_matches,
        )

    intent = parse_query(raw_query)
    prefs  = intent.to_matching_prefs()

    # Apply top_n override from query ("show top 5 NGOs")
    effective_top_n = intent.top_n if intent.top_n != 10 else top_n

    # Run the appropriate matching pipeline
    if intent.intent == "donate":
        raw_results = get_ngo_recommendations(prefs, top_n=effective_top_n)
    elif intent.intent == "compare":
        raw_results = get_ngo_recommendations(prefs, top_n=effective_top_n * 2)
    else:
        raw_results = get_ngo_recommendations(prefs, top_n=effective_top_n)

    # Post-filter: excluded sectors
    if intent.excluded_sectors:
        excluded_lower = {s.lower() for s in intent.excluded_sectors}
        raw_results = [
            r for r in raw_results
            if not any(
                exc in (r.get("sector_tags") or "").lower()
                for exc in excluded_lower
            )
        ]

    # Post-filter: tier
    if intent.tier_filter:
        tier_filtered = [
            r for r in raw_results
            if r.get("recognition_tier") == intent.tier_filter
        ]
        # If strict filtering yields too few, relax it
        if len(tier_filtered) >= 3:
            raw_results = tier_filtered
        else:
            # Promote tier-matched results to top
            tier_matched = [r for r in raw_results if r.get("recognition_tier") == intent.tier_filter]
            others       = [r for r in raw_results if r.get("recognition_tier") != intent.tier_filter]
            raw_results  = tier_matched + others

    # Trim to top_n
    raw_results = raw_results[:effective_top_n]

    # Attach natural language explanations
    results_with_explanation = []
    for ngo in raw_results:
        enriched = dict(ngo)
        enriched["match_explanation"] = explain_result(ngo, intent)
        results_with_explanation.append(enriched)

    # Build human-readable summary
    summary = _build_summary(intent, results_with_explanation)

    # Build follow-up suggestions
    suggestions = _build_suggestions(intent)

    return {
        "query":       raw_query,
        "intent":      intent.to_dict(),
        "results":     results_with_explanation,
        "summary":     summary,
        "suggestions": suggestions,
    }


def _build_summary(intent: QueryIntent, results: list[dict]) -> str:
    """Generate a conversational summary of the search results."""
    count = len(results)
    if count == 0:
        return (
            "No NGOs found matching your query. "
            "Try broadening your sector or location criteria."
        )

    parts = []

    # Count
    parts.append(f"Found {count} NGO{'s' if count != 1 else ''}")

    # Sectors
    if intent.sectors:
        parts.append(f"in {' and '.join(intent.sectors)}")

    # Location
    if intent.locations:
        loc = intent.locations[0]
        parts.append(f"near {loc}")

    # Tier
    if intent.tier_filter == "grassroots":
        parts.append("(grassroots organisations prioritised)")
    elif intent.tier_filter == "well_known":
        parts.append("(well-established organisations prioritised)")

    # Top result
    if results:
        top = results[0]
        parts.append(
            f"— top match: {top.get('name', 'Unknown')} "
            f"({int(float(top.get('score', 0)) * 100)}% match)"
        )

    return " ".join(parts) + "."


def _build_suggestions(intent: QueryIntent) -> list[str]:
    """Generate contextual follow-up query suggestions."""
    suggestions = []

    if intent.sectors:
        sec = intent.sectors[0]
        if intent.locations:
            loc = intent.locations[0]
            suggestions.append(f"Show grassroots {sec} NGOs in {loc}")
            suggestions.append(f"Top 5 verified {sec} organisations in {loc}")
        else:
            suggestions.append(f"Find {sec} NGOs in Mysuru Karnataka")
            suggestions.append(f"Grassroots {sec} NGOs accepting donations")
    else:
        suggestions.append("Find education NGOs near Mysuru")
        suggestions.append("Show healthcare organisations in Karnataka")

    if not intent.locations:
        suggestions.append("Show all NGOs in Karnataka")

    suggestions.append("Compare education and healthcare NGOs")
    suggestions.append("Show top 10 verified NGOs in India")

    return suggestions[:5]


# ─────────────────────────────────────────────────────────────────────────────
# Chatbot-style conversational NLP
# ─────────────────────────────────────────────────────────────────────────────

# Simple conversational state – stored per session_id
_CONVERSATION_SESSIONS: dict[str, list[dict]] = {}

# Max turns to keep in memory
MAX_TURNS = 10


def get_or_create_session(session_id: str) -> list[dict]:
    if session_id not in _CONVERSATION_SESSIONS:
        _CONVERSATION_SESSIONS[session_id] = []
    return _CONVERSATION_SESSIONS[session_id]


def resolve_coreferences(query: str, history: list[dict]) -> str:
    """
    Simple coreference resolution:
    Replace pronouns / vague references with entities from prior turns.

    Example:
      Turn 1: "find education NGOs in Mysuru"
      Turn 2: "show me more of them" → "show me more education NGOs in Mysuru"
    """
    pronouns = {"them", "they", "those", "these", "it", "that", "this"}
    query_lower = query.lower()

    if not any(p in query_lower.split() for p in pronouns):
        return query  # No pronouns → nothing to resolve

    # Extract last mentioned sectors and locations from history
    last_sectors:   list[str] = []
    last_locations: list[str] = []

    for turn in reversed(history[-4:]):
        if turn.get("role") == "user":
            prior_intent = parse_query(turn.get("content", ""))
            if prior_intent.sectors and not last_sectors:
                last_sectors = prior_intent.sectors
            if prior_intent.locations and not last_locations:
                last_locations = prior_intent.locations
        if last_sectors and last_locations:
            break

    resolved = query
    replacements = []
    if last_sectors:
        replacements.append(" ".join(last_sectors))
    if last_locations:
        replacements.append("in " + last_locations[0])

    for pronoun in pronouns:
        pattern = re.compile(rf"\b{re.escape(pronoun)}\b", re.IGNORECASE)
        if replacements:
            resolved = pattern.sub(" ".join(replacements), resolved)

    return resolved.strip()


def conversational_query(
    raw_query: str,
    session_id: str = "default",
    top_n: int = 8,
) -> dict:
    """
    Stateful conversational NLP query handler.

    Maintains session history, resolves coreferences, and enriches
    the response with conversational context.
    """
    history = get_or_create_session(session_id)

    # Append user turn
    history.append({"role": "user", "content": raw_query})

    # Resolve coreferences using session history
    resolved_query = resolve_coreferences(raw_query, history[:-1])

    # Handle meta-queries (not NGO search)
    meta_response = _handle_meta_query(raw_query, history)
    if meta_response:
        history.append({"role": "assistant", "content": meta_response["reply"]})
        if len(history) > MAX_TURNS * 2:
            history[:] = history[-(MAX_TURNS * 2):]
        return meta_response

    # Run the NLP search pipeline
    result = run_nlp_query(resolved_query, top_n=top_n)

    # Build conversational reply
    reply = _build_conversational_reply(result, raw_query, resolved_query)

    history.append({"role": "assistant", "content": reply})

    # Trim history
    if len(history) > MAX_TURNS * 2:
        history[:] = history[-(MAX_TURNS * 2):]

    return {
        "reply":       reply,
        "results":     result["results"],
        "intent":      result["intent"],
        "summary":     result["summary"],
        "suggestions": result["suggestions"],
        "resolved_query": resolved_query if resolved_query != raw_query else None,
    }


def _handle_meta_query(query: str, history: list[dict]) -> dict | None:
    """
    Handle conversational meta-queries that don't map to NGO search.
    Returns a reply dict or None if not a meta-query.
    """
    q = query.lower().strip()

    greetings = ["hi", "hello", "hey", "namaste", "good morning",
                 "good afternoon", "good evening", "hola"]
    if any(q == g or q.startswith(g + " ") for g in greetings):
        return {
            "reply": (
                "👋 Namaste! I'm ImpactBot — your AI guide to NGOs and social impact.\n\n"
                "You can ask me things like:\n"
                "• *\"Find education NGOs near Mysuru\"*\n"
                "• *\"Show healthcare organizations in Karnataka\"*\n"
                "• *\"Grassroots NGOs for women empowerment\"*\n"
                "• *\"I want to donate to child welfare causes\"*\n\n"
                "What cause are you passionate about? 🌱"
            ),
            "results": [],
            "intent":  {},
            "summary": "",
            "suggestions": [
                "Find education NGOs near Mysuru",
                "Show healthcare NGOs in Karnataka",
                "Grassroots women empowerment organisations",
            ],
        }

    thanks = ["thank", "thanks", "thank you", "thx", "ty", "great", "awesome"]
    if any(t in q for t in thanks) and len(q) < 40:
        return {
            "reply": (
                "You're welcome! 😊 Is there anything else you'd like to explore?\n\n"
                "You can ask about specific sectors, locations, or types of NGOs."
            ),
            "results": [],
            "intent":  {},
            "summary": "",
            "suggestions": [
                "Show top NGOs in Mysuru",
                "Find environment NGOs in South India",
            ],
        }

    how_it_works = ["how does this work", "how do i use", "what can you do",
                    "help", "how to donate", "how to find ngo"]
    if any(h in q for h in how_it_works):
        return {
            "reply": (
                "Here's how to use ImpactBot 🤖:\n\n"
                "**Finding NGOs:**\n"
                "• *\"Find education NGOs near Mysuru\"*\n"
                "• *\"Show top 5 healthcare organisations in Karnataka\"*\n"
                "• *\"Grassroots women empowerment NGOs\"*\n\n"
                "**Donating:**\n"
                "• *\"I want to donate to child welfare in Mysore\"*\n"
                "• *\"NGOs accepting donations under ₹1000\"*\n\n"
                "**Comparing:**\n"
                "• *\"Compare education and healthcare NGOs in India\"*\n\n"
                "**Natural language works!** Just describe what you're looking for."
            ),
            "results": [],
            "intent":  {},
            "summary": "",
            "suggestions": [
                "Find education NGOs near Mysuru",
                "Show grassroots NGOs in Karnataka",
                "I want to donate to healthcare causes",
            ],
        }

    return None  # Not a meta-query


def _build_conversational_reply(
    result: dict,
    original_query: str,
    resolved_query: str,
) -> str:
    """Build a natural, conversational reply from structured search results."""
    intent  = result.get("intent", {})
    results = result.get("results", [])
    summary = result.get("summary", "")
    count   = len(results)

    lines = []

    # Coreference note
    if resolved_query and resolved_query != original_query:
        lines.append(f"*(Interpreting as: \"{resolved_query}\")*\n")

    # Low confidence warning
    confidence = intent.get("confidence", 0)
    if confidence < 0.25 and not results:
        lines.append(
            "I wasn't sure exactly what you meant. "
            "Could you try being more specific? For example:\n"
            "*\"Find education NGOs in Mysuru\"* or "
            "*\"Show healthcare organisations in Karnataka\"*"
        )
        return "\n".join(lines)

    # Summary line
    lines.append(f"🔍 {summary}\n")

    # Top 3 results in conversational form
    if results:
        lines.append("**Here are the top matches:**\n")
        for i, ngo in enumerate(results[:3], 1):
            score     = int(float(ngo.get("score", 0)) * 100)
            name      = ngo.get("name", "Unknown")
            tags      = (ngo.get("sector_tags") or "").replace("|", ", ")
            location  = ngo.get("state") or ngo.get("country") or "India"
            tier      = ngo.get("recognition_tier", "")
            tier_icon = "🌱" if tier == "grassroots" else "⭐" if tier == "well_known" else "🔷"
            explanation = ngo.get("match_explanation", "")

            lines.append(
                f"{i}. **{name}** {tier_icon} — {score}% match\n"
                f"   📍 {location} | 🏷️ {tags}\n"
                f"   _{explanation}_"
            )

        if count > 3:
            lines.append(f"\n...and {count - 3} more results shown in the panel below.")
    else:
        lines.append(
            "No NGOs found for your query. Try:\n"
            "• Broadening the sector (e.g., just \"Education\" instead of \"school literacy\")\n"
            "• Removing the location filter\n"
            "• Using the suggestion buttons below"
        )

    return "\n".join(lines)
