from config import MIN_SCORE


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


def analyze(text):
    text_lower = text.lower()
    score = 0

    # Strong direct hiring phrase
    for signal in STRONG_HIRING:
        if signal in text_lower:
            score += 50
            break

    # Additional client/hiring context
    for signal in CLIENT_SIGNALS:
        if signal in text_lower:
            score += 10

    # Generic editing terms
    for signal in GENERAL_SIGNALS:
        if signal in text_lower:
            score += 5

    # Payment/budget boost
    if "₹" in text or "$" in text or "rs" in text_lower:
        score += 10

    # Reduce messages that look like editors promoting themselves
    for signal in NEGATIVE_SIGNALS:
        if signal in text_lower:
            score -= 25

    score = max(0, min(score, 100))

    if score >= 70:
        category = "🔥 HOT"
    elif score >= MIN_SCORE:
        category = "🟡 WARM"
    else:
        category = "⚪ LOW"

    return score, category
