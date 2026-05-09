"""
crisis_scraper.py
=================
Scrapes live disaster / humanitarian-crisis headlines from
Times of India and UNICEF, then maps each crisis to relevant
NGOs from the platform catalog using keyword matching.
"""
from __future__ import annotations
import re
import logging
import hashlib
from datetime import datetime, timezone
from typing import Any

logger = logging.getLogger("crisis_scraper")
if not logger.handlers:
    _h = logging.StreamHandler()
    _h.setFormatter(logging.Formatter(
        "[%(asctime)s] %(levelname)s [crisis] %(message)s",
        datefmt="%H:%M:%S"
    ))
    logger.addHandler(_h)
    logger.setLevel(logging.DEBUG)

# ─────────────────────────────────────────────────────────────────────────────
# Keyword → sector/NGO tag mappings
# ─────────────────────────────────────────────────────────────────────────────
CRISIS_SECTOR_MAP = {
    "flood":          ["Rural Development", "Healthcare", "Food Security"],
    "earthquake":     ["Rural Development", "Healthcare", "Community Development"],
    "cyclone":        ["Rural Development", "Environment", "Healthcare"],
    "drought":        ["Food Security", "Rural Development", "Environment"],
    "wildfire":       ["Environment", "Rural Development", "Healthcare"],
    "landslide":      ["Rural Development", "Healthcare"],
    "tsunami":        ["Rural Development", "Healthcare", "Food Security"],
    "epidemic":       ["Healthcare", "Education", "Food Security"],
    "pandemic":       ["Healthcare", "Education", "Food Security"],
    "famine":         ["Food Security", "Healthcare", "Rural Development"],
    "hunger":         ["Food Security", "Healthcare"],
    "malnutrition":   ["Food Security", "Healthcare", "Children"],
    "displacement":   ["Rural Development", "Healthcare", "Women Empowerment"],
    "refugee":        ["Rural Development", "Healthcare", "Education"],
    "conflict":       ["Healthcare", "Education", "Social Justice"],
    "war":            ["Healthcare", "Social Justice", "Education"],
    "child":          ["Children", "Education", "Healthcare"],
    "women":          ["Women Empowerment", "Healthcare", "Education"],
    "sanitation":     ["Healthcare", "Rural Development"],
    "water":          ["Rural Development", "Environment", "Healthcare"],
    "education":      ["Education", "Children"],
    "school":         ["Education", "Children"],
    "vaccination":    ["Healthcare", "Children"],
    "disease":        ["Healthcare", "Food Security"],
    "pollution":      ["Environment", "Healthcare"],
    "climate":        ["Environment", "Rural Development"],
    "heat wave":      ["Healthcare", "Rural Development", "Environment"],
    "cold wave":      ["Healthcare", "Rural Development"],
    "storm":          ["Rural Development", "Environment"],
    "landfall":       ["Rural Development", "Healthcare"],
}

URGENCY_KEYWORDS = {
    "high":   ["killed", "dead", "deaths", "emergency", "catastrophe",
               "devastating", "massive", "critical", "urgent", "severe",
               "crisis", "disaster", "stranded", "collapsed", "destroyed"],
    "medium": ["affected", "displaced", "injured", "warning", "alert",
               "threat", "impact", "damage", "loss", "flood", "fire"],
    "low":    ["risk", "concern", "watch", "possible", "expected",
               "monitoring", "preparing"],
}

# In SOURCE_CONFIG — mark UNICEF as html type
SOURCE_CONFIG = {
    "Times of India": {
        "rss_url":  "https://timesofindia.indiatimes.com/rssfeeds/296589292.cms",
        "homepage": "https://timesofindia.indiatimes.com/india",
        "icon":     "📰",
        "color":    "#e53e3e",
        "type":     "rss",              # ← add type field
    },
    "UNICEF": {
        "rss_url":  None,               # ← no RSS anymore
        "homepage": "https://www.unicef.org/emergencies",
        "icon":     "🌐",
        "color":    "#1a90d9",
        "type":     "html",             # ← scrape HTML instead
    },
}

def _fetch_unicef_html() -> list[dict]:
    """
    Scrapes UNICEF emergencies page directly since their RSS feed is dead.
    Parses article cards from https://www.unicef.org/emergencies
    """
    import urllib.request
    import urllib.error
    from html.parser import HTMLParser

    URL = "https://www.unicef.org/emergencies"

    # ── Lightweight HTML parser for UNICEF emergency cards ────────────────
    class UNICEFParser(HTMLParser):
        def __init__(self):
            super().__init__()
            self.articles       = []
            self._in_card       = False
            self._in_title      = False
            self._in_desc       = False
            self._current       = {}
            self._depth         = 0
            self._card_depth    = 0
            self._capture_text  = False
            self._buffer        = []

        def handle_starttag(self, tag, attrs):
            attr_dict = dict(attrs)
            classes   = attr_dict.get("class", "")
            href      = attr_dict.get("href", "")

            # UNICEF uses article cards with these class patterns
            if tag in ("article", "div") and any(
                kw in classes for kw in (
                    "emergency", "card", "story",
                    "feature", "highlight", "situation"
                )
            ):
                self._in_card    = True
                self._card_depth = self._depth
                self._current    = {"url": "", "title": "", "description": ""}

            if self._in_card:
                # Capture linked title
                if tag == "a" and href:
                    if not self._current.get("url"):
                        link = href if href.startswith("http") else f"https://www.unicef.org{href}"
                        self._current["url"] = link

                # Title tags
                if tag in ("h2", "h3", "h4"):
                    self._in_title      = True
                    self._capture_text  = True
                    self._buffer        = []

                # Description tags
                if tag == "p" and not self._in_title:
                    self._in_desc      = True
                    self._capture_text = True
                    self._buffer       = []

            self._depth += 1

        def handle_endtag(self, tag):
            self._depth -= 1

            if self._in_title and tag in ("h2", "h3", "h4"):
                self._current["title"] = " ".join(self._buffer).strip()
                self._in_title        = False
                self._capture_text    = False
                self._buffer          = []

            if self._in_desc and tag == "p":
                self._current["description"] = " ".join(self._buffer).strip()
                self._in_desc              = False
                self._capture_text         = False
                self._buffer               = []

            # End of card
            if self._in_card and self._depth <= self._card_depth:
                if self._current.get("title"):
                    self.articles.append(dict(self._current))
                self._in_card  = False
                self._current  = {}

        def handle_data(self, data):
            if self._capture_text:
                cleaned = data.strip()
                if cleaned:
                    self._buffer.append(cleaned)

    # ── Fetch the page ────────────────────────────────────────────────────
    try:
        req = urllib.request.Request(
            URL,
            headers={
                "User-Agent": (
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/124.0.0.0 Safari/537.36"
                ),
                "Accept":          "text/html,application/xhtml+xml",
                "Accept-Language": "en-US,en;q=0.9",
                "Accept-Encoding": "gzip, deflate",
            },
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            # Handle gzip encoding
            import gzip
            raw = resp.read()
            if resp.headers.get("Content-Encoding") == "gzip":
                raw = gzip.decompress(raw)
            html = raw.decode("utf-8", errors="replace")

        logger.info(f"[HTML] UNICEF: fetched page ({len(html):,} bytes)")

    except urllib.error.HTTPError as e:
        logger.warning(f"[HTML] UNICEF page failed: HTTP {e.code} {e.reason}")
        return []
    except Exception as e:
        logger.warning(f"[HTML] UNICEF page failed: {type(e).__name__}: {e}")
        return []

    # ── Parse ─────────────────────────────────────────────────────────────
    parser = UNICEFParser()
    parser.feed(html)

    if not parser.articles:
        # Fallback — use regex to pull <a> tags with crisis-related text
        logger.warning("[HTML] UNICEF: card parser found nothing, trying regex fallback")
        parser.articles = _unicef_regex_fallback(html)

    articles = []
    for item in parser.articles[:20]:
        title = _clean_text(item.get("title", ""))
        desc  = _clean_text(item.get("description", ""))
        url   = item.get("url", "https://www.unicef.org/emergencies")
        if not title:
            continue
        articles.append({
            "title":       title,
            "description": desc,
            "url":         url,
            "published":   "",          # HTML page has no pub date
            "source":      "UNICEF",
        })

    logger.info(f"[HTML] UNICEF: extracted {len(articles)} emergency items")
    return articles


def _unicef_regex_fallback(html: str) -> list[dict]:
    """
    Last-resort regex scrape — pulls any anchor whose text looks
    like a crisis headline from the UNICEF emergencies page.
    """
    CRISIS_WORDS = (
        "crisis", "emergency", "flood", "drought", "conflict",
        "famine", "cholera", "disease", "displacement", "refugee",
        "hunger", "malnutrition", "war", "earthquake", "cyclone",
    )
    # Match <a href="...">Title text</a>
    pattern = re.compile(
        r'<a[^>]+href="(/[^"]*|https://www\.unicef\.org[^"]*)"[^>]*>'
        r'\s*([^<]{20,200})\s*</a>',
        re.IGNORECASE,
    )
    results = []
    for m in pattern.finditer(html):
        href  = m.group(1)
        title = _clean_text(m.group(2))
        if any(word in title.lower() for word in CRISIS_WORDS):
            url = href if href.startswith("http") else f"https://www.unicef.org{href}"
            results.append({"title": title, "description": "", "url": url})
    # Deduplicate
    seen, unique = set(), []
    for r in results:
        if r["title"] not in seen:
            seen.add(r["title"])
            unique.append(r)
    logger.info(f"[HTML] UNICEF regex fallback: found {len(unique)} items")
    return unique[:20]

# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────
def _clean_text(raw: str) -> str:
    """Strip HTML tags and excess whitespace."""
    text = re.sub(r"<[^>]+>", " ", raw or "")
    text = re.sub(r"&[a-z]+;", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def _crisis_id(title: str, source: str) -> str:
    return hashlib.md5(f"{source}::{title}".encode()).hexdigest()[:10]


def _detect_sectors(text: str) -> list[str]:
    text_lower = text.lower()
    found: list[str] = []
    for keyword, sectors in CRISIS_SECTOR_MAP.items():
        if keyword in text_lower:
            for s in sectors:
                if s not in found:
                    found.append(s)
    return found or ["Rural Development", "Healthcare"]


def _detect_urgency(text: str) -> str:
    text_lower = text.lower()
    for level in ("high", "medium", "low"):
        if any(kw in text_lower for kw in URGENCY_KEYWORDS[level]):
            return level
    return "low"


def _detect_location(text: str) -> str:
    """
    Very lightweight location extraction.
    Returns the first recognised Indian state / country name found.
    """
    LOCATIONS = [
        "Assam", "Bihar", "Gujarat", "Himachal Pradesh", "Jammu", "Kashmir",
        "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
        "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan",
        "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
        "Uttarakhand", "West Bengal", "Delhi", "Goa", "Andhra Pradesh",
        "India", "Bangladesh", "Pakistan", "Nepal", "Sri Lanka",
        "Afghanistan", "Myanmar", "Sudan", "Ethiopia", "Yemen", "Syria",
        "Ukraine", "Gaza", "Haiti", "Somalia",
    ]
    for loc in LOCATIONS:
        if loc.lower() in text.lower():
            return loc
    return "India / Global"


# ─────────────────────────────────────────────────────────────────────────────
# RSS fetcher  (primary method — no Selenium needed)
# ─────────────────────────────────────────────────────────────────────────────
def _fetch_rss(source_name: str, config: dict) -> list[dict]:
    """
    Fetch and parse an RSS feed.
    Returns a list of raw article dicts.
    """
    try:
        import urllib.request
        import xml.etree.ElementTree as ET

        req = urllib.request.Request(
            config["rss_url"],
            headers={
                "User-Agent": (
                    "Mozilla/5.0 (compatible; CrisisBot/1.0; "
                    "+https://unifiedimpact.org)"
                )
            },
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            raw_xml = resp.read().decode("utf-8", errors="replace")

        root = ET.fromstring(raw_xml)
        channel = root.find("channel")
        items   = channel.findall("item") if channel else root.findall(".//item")

        articles = []
        for item in items[:20]:          # cap at 20 per source
            title       = _clean_text(item.findtext("title",       ""))
            description = _clean_text(item.findtext("description", ""))
            link        = (item.findtext("link", "") or "").strip()
            pub_date    = (item.findtext("pubDate", "") or "").strip()

            if not title:
                continue

            articles.append({
                "title":       title,
                "description": description,
                "url":         link,
                "published":   pub_date,
                "source":      source_name,
            })

        logger.info(f"[RSS] {source_name}: fetched {len(articles)} items")
        return articles

    except Exception as exc:
        logger.warning(f"[RSS] {source_name} failed: {exc}")
        return []


# ─────────────────────────────────────────────────────────────────────────────
# Crisis filter — keep only disaster / humanitarian headlines
# ─────────────────────────────────────────────────────────────────────────────
CRISIS_FILTER_WORDS = set(CRISIS_SECTOR_MAP.keys()) | {
    "disaster", "emergency", "crisis", "relief", "aid", "rescue",
    "humanitarian", "casualties", "evacuation", "affected", "damage",
    "alert", "warning", "devastat", "collapse", "outbreak",
}


def _is_crisis_article(title: str, description: str) -> bool:
    combined = (title + " " + description).lower()
    return any(word in combined for word in CRISIS_FILTER_WORDS)


# ─────────────────────────────────────────────────────────────────────────────
# NGO matcher — match crisis sectors to platform NGOs
# ─────────────────────────────────────────────────────────────────────────────
def _match_ngos_to_crisis(
    crisis_sectors: list[str],
    crisis_location: str,
    db_ngos: list[dict],
    catalog_ngos: list[dict],
) -> list[dict]:
    """
    Returns up to 8 best-matching NGOs for a crisis event.
    Combines registered DB NGOs + static catalog NGOs.
    """
    combined: list[dict] = []

    # ── Score DB-registered NGOs ──────────────────────────────────────────
    for ngo in db_ngos:
        ngo_sectors = {
            s.strip().lower()
            for s in (ngo.get("sector") or "").split("|")
            if s.strip()
        }
        crisis_s_lower = [s.lower() for s in crisis_sectors]
        sector_hits = sum(
            1 for cs in crisis_s_lower
            if any(cs in ns or ns in cs for ns in ngo_sectors)
        )
        geo_bonus = 0.2 if crisis_location.lower() in (
            ngo.get("geographic_focus") or ""
        ).lower() else 0.0

        score = (sector_hits / max(len(crisis_sectors), 1)) * 0.7 + geo_bonus
        if score > 0.05:
            combined.append({
                "id":                  ngo.get("id"),
                "name":                ngo.get("name", "Unknown NGO"),
                "sector":              ngo.get("sector", ""),
                "geographic_focus":    ngo.get("geographic_focus", "India"),
                "description":         ngo.get("description", ""),
                "verification_status": ngo.get("verification_status", "PENDING"),
                "credibility_score":   ngo.get("credibility_score", 40),
                "source":              "registered",
                "match_score":         round(score, 3),
            })

    # ── Score catalog NGOs ────────────────────────────────────────────────
    for ngo in catalog_ngos:
        ngo_tags = {
            t.strip().lower()
            for t in (ngo.get("sector_tags") or "").split("|")
            if t.strip()
        }
        crisis_s_lower = [s.lower() for s in crisis_sectors]
        sector_hits = sum(
            1 for cs in crisis_s_lower
            if any(cs in nt or nt in cs for nt in ngo_tags)
        )
        score = (sector_hits / max(len(crisis_sectors), 1)) * 0.6
        if score > 0.05:
            combined.append({
                "id":                  None,
                "name":                ngo.get("name", ""),
                "sector":              ngo.get("sector_tags", ""),
                "geographic_focus":    f"{ngo.get('state','')}, {ngo.get('country','')}",
                "description":         ngo.get("description", ""),
                "verification_status": "CATALOG",
                "credibility_score":   65,
                "source":              "catalog",
                "match_score":         round(score, 3),
            })

    # Deduplicate by name, sort by score
    seen: set[str] = set()
    unique = []
    for n in sorted(combined, key=lambda x: x["match_score"], reverse=True):
        key = n["name"].lower().strip()
        if key not in seen:
            seen.add(key)
            unique.append(n)

    return unique[:8]


# ─────────────────────────────────────────────────────────────────────────────
# Public API — called from Flask route
# ─────────────────────────────────────────────────────────────────────────────
# In fetch_crisis_alerts — route to correct fetcher by type
def fetch_crisis_alerts(
    db_ngos: list[dict],
    catalog_ngos: list[dict],
) -> dict[str, Any]:

    all_crises:     list[dict]       = []
    source_statuses: dict[str, str]  = {}

    for source_name, config in SOURCE_CONFIG.items():

        # ── Choose fetcher based on source type ───────────────────────────
        if config.get("type") == "html":
            articles = _fetch_unicef_html()
        else:
            articles = _fetch_rss(source_name, config)

        # rest of your loop stays exactly the same ...
        count = 0
        for art in articles:
            if not _is_crisis_article(art["title"], art["description"]):
                continue
            combined_text = art["title"] + " " + art["description"]
            sectors  = _detect_sectors(combined_text)
            urgency  = _detect_urgency(combined_text)
            location = _detect_location(combined_text)
            matched  = _match_ngos_to_crisis(
                sectors, location, db_ngos, catalog_ngos
            )
            all_crises.append({
                "id":           _crisis_id(art["title"], source_name),
                "title":        art["title"],
                "description":  art["description"][:300],
                "url":          art["url"],
                "published":    art["published"],
                "source":       source_name,
                "source_icon":  config["icon"],
                "source_color": config["color"],
                "urgency":      urgency,
                "location":     location,
                "sectors":      sectors,
                "matched_ngos": matched,
                "fetched_at":   datetime.now(timezone.utc).isoformat(),
            })
            count += 1

        source_statuses[source_name] = (
            f"{count} crisis articles found"
            if count else "No crisis articles found"
        )
        logger.info(f"[crisis] {source_name}: {count} crises identified")

    urgency_order = {"high": 0, "medium": 1, "low": 2}
    all_crises.sort(key=lambda c: urgency_order.get(c["urgency"], 2))

    return {
        "crises":          all_crises,
        "total":           len(all_crises),
        "source_statuses": source_statuses,
        "fetched_at":      datetime.now(timezone.utc).isoformat(),
    }
