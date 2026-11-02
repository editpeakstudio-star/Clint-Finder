import re
from config import MIN_SCORE, KEYWORDS, get_active_keywords

# Strong direct hiring signals
STRONG_HIRING = [
    "i need video editor",
    "i need a video editor",
    "need video editor",
    "need a video editor",
    "need an editor",
    "need editor",
    "video editor needed",
    "editor needed",
    "video editor required",
    "editor required",
    "looking for a video editor",
    "looking for video editor",
    "looking for an editor",
    "looking for editor",
    "hiring a video editor",
    "hiring video editor",
    "hiring editor",
    "hire a video editor",
    "hire an editor",
    "editor wanted",
]

# Additional hiring/context signals
CLIENT_SIGNALS = [
    "long term",
    "long-term",
    "monthly",
    "budget",
    "paid",
    "paid work",
    "per video",
    "payment",
    "salary",
    "rate",
    "urgent",
    "urgently",
    "remote",
    "work from home",
    "freelance",
]

# Normal editing-related keywords
GENERAL_SIGNALS = [
    "video editor",
    "video editing",
    "youtube editor",
    "reels editor",
    "reel editor",
    "shorts editor",
    "short form editor",
    "long form editor",
    "podcast editor",
    "real estate editor",
    "gaming video editor",
    "documentary editor",
    "cinematic editor",
    "faceless video editor",
    "ugc video editor",
    "ad video editor",
    "commercial video editor",
]

# Messages that usually come from editors looking for clients
NEGATIVE_SIGNALS = [
    "i am a video editor",
    "i'm a video editor",
    "i am an editor",
    "i'm an editor",
    "looking for clients",
    "looking for client",
    "my portfolio",
    "check my portfolio",
    "hire me",
    "available for work",
]


class AnalysisResult(tuple):
    """Backwards-compatible tuple (score, category) that also holds matched keywords."""
    def __new__(cls, score, category, matched=None):
        return super(AnalysisResult, cls).__new__(cls, (score, category))

    def __init__(self, score, category, matched=None):
        self.score = score
        self.category = category
        self.matched = matched or []


def analyze(text, custom_keywords=None, min_threshold=None):
    if not text:
        return AnalysisResult(0, "⚪ LOW", [])

    text_lower = text.lower()
    score = 0
    matched = []

    threshold = min_threshold if min_threshold is not None else MIN_SCORE

    # Strong direct hiring phrase
    for signal in STRONG_HIRING:
        if signal in text_lower:
            score += 50
            if signal not in matched:
                matched.append(signal)
            break

    # Additional client/hiring context
    for signal in CLIENT_SIGNALS:
        if signal in text_lower:
            score += 10
            if signal not in matched:
                matched.append(signal)

    # Generic editing terms
    for signal in GENERAL_SIGNALS:
        if signal in text_lower:
            score += 5
            if signal not in matched:
                matched.append(signal)

    # Dynamic keywords from database or custom list
    active_kws = custom_keywords if custom_keywords is not None else get_active_keywords()
    for kw in active_kws:
        kw_clean = kw.strip().lower()
        if kw_clean and kw_clean in text_lower:
            if kw_clean not in matched:
                matched.append(kw_clean)
                # Boost score slightly if not already scored heavily
                if score < 70:
                    score += 5

    # Payment/budget boost
    if "₹" in text or "$" in text or re.search(r'\b(rs|inr|usd|eur|gbp)\b', text_lower):
        score += 10
        if "currency signal" not in matched:
            matched.append("rate/currency")

    # Reduce messages that look like editors promoting themselves
    for signal in NEGATIVE_SIGNALS:
        if signal in text_lower:
            score -= 25
            if f"self-promo ({signal})" not in matched:
                matched.append(f"self-promo ({signal})")

    score = max(0, min(score, 100))

    if score >= 70:
        category = "🔥 HOT"
    elif score >= threshold:
        category = "🟡 WARM"
    else:
        category = "⚪ LOW"

    return AnalysisResult(score, category, matched)
