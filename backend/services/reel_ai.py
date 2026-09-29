
"""
USANEX - REEL AI ENGINE
============================================================

Production-oriented AI/ML service layer for Reels.

Responsibilities
----------------
1. Reel content analysis
2. Caption / hashtag NLP
3. Content categorisation
4. Keyword/topic extraction
5. Video metadata extraction
6. Audio/transcript integration hooks
7. Content embedding generation
8. Safety / quality scoring
9. User-interest learning
10. Recommendation feature generation
11. Behaviour-based ML signals
12. Safe fallbacks when optional AI packages are unavailable

This module is intentionally designed as a SERVICE layer.
API routes should call this module instead of putting AI logic
directly inside route files.

Optional packages
-----------------
numpy
scikit-learn
sentence-transformers
opencv-python
moviepy / ffmpeg-python
transformers
torch

The system DOES NOT require every optional package to be installed
for the backend to start.
"""

from __future__ import annotations

import hashlib
import json
import logging
import math
import os
import re
import subprocess
from collections import Counter
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Sequence, Tuple

from sqlalchemy.orm import Session

from ..database.models import (
    Reel,
    ReelAIFeature,
    ReelInteraction,
    UserReelInterest,
)


# ============================================================
# LOGGER
# ============================================================

logger = logging.getLogger("usanex.reel_ai")


# ============================================================
# OPTIONAL ML IMPORTS
# ============================================================

try:
    import numpy as np

    NUMPY_AVAILABLE = True
except Exception:
    np = None
    NUMPY_AVAILABLE = False


try:
    from sklearn.feature_extraction.text import TfidfVectorizer

    SKLEARN_AVAILABLE = True
except Exception:
    TfidfVectorizer = None
    SKLEARN_AVAILABLE = False


try:
    from sentence_transformers import SentenceTransformer

    SENTENCE_TRANSFORMERS_AVAILABLE = True
except Exception:
    SentenceTransformer = None
    SENTENCE_TRANSFORMERS_AVAILABLE = False


# ============================================================
# CONFIGURATION
# ============================================================

AI_VERSION = os.getenv(
    "USANEX_REEL_AI_VERSION",
    "1.0.0",
)

EMBEDDING_MODEL_NAME = os.getenv(
    "USANEX_EMBEDDING_MODEL",
    "all-MiniLM-L6-v2",
)

MAX_TEXT_LENGTH = int(
    os.getenv(
        "USANEX_REEL_AI_MAX_TEXT",
        "5000",
    )
)

MAX_KEYWORDS = int(
    os.getenv(
        "USANEX_REEL_AI_MAX_KEYWORDS",
        "20",
    )
)

MAX_TOPICS = int(
    os.getenv(
        "USANEX_REEL_AI_MAX_TOPICS",
        "10",
    )
)

MIN_INTEREST_SCORE = -100.0
MAX_INTEREST_SCORE = 100.0


# ============================================================
# CATEGORY DEFINITIONS
# ============================================================

CATEGORY_KEYWORDS: Dict[str, Sequence[str]] = {
    "education": (
        "study",
        "education",
        "exam",
        "college",
        "school",
        "teacher",
        "student",
        "coding",
        "programming",
        "python",
        "java",
        "ai",
        "machine learning",
        "engineering",
        "math",
        "science",
        "tutorial",
        "course",
    ),

    "technology": (
        "technology",
        "tech",
        "software",
        "hardware",
        "computer",
        "mobile",
        "phone",
        "android",
        "iphone",
        "app",
        "developer",
        "coding",
        "programming",
        "ai",
        "robot",
    ),

    "entertainment": (
        "movie",
        "film",
        "actor",
        "actress",
        "comedy",
        "funny",
        "entertainment",
        "meme",
        "viral",
        "music",
        "song",
        "dance",
    ),

    "gaming": (
        "game",
        "gaming",
        "gamer",
        "bgmi",
        "pubg",
        "free fire",
        "minecraft",
        "valorant",
        "playstation",
        "xbox",
        "esports",
    ),

    "sports": (
        "cricket",
        "football",
        "soccer",
        "basketball",
        "tennis",
        "sports",
        "match",
        "player",
        "ipl",
        "goal",
        "wicket",
    ),

    "fitness": (
        "gym",
        "fitness",
        "workout",
        "exercise",
        "muscle",
        "bodybuilding",
        "health",
        "training",
        "running",
        "yoga",
    ),

    "food": (
        "food",
        "recipe",
        "cooking",
        "kitchen",
        "restaurant",
        "pizza",
        "burger",
        "cake",
        "biryani",
        "snacks",
    ),

    "travel": (
        "travel",
        "trip",
        "tour",
        "vacation",
        "hotel",
        "flight",
        "train",
        "mountain",
        "beach",
        "tourism",
    ),

    "fashion": (
        "fashion",
        "style",
        "clothing",
        "dress",
        "outfit",
        "makeup",
        "beauty",
        "model",
        "skincare",
    ),

    "business": (
        "business",
        "startup",
        "entrepreneur",
        "marketing",
        "sales",
        "money",
        "finance",
        "investment",
        "company",
    ),

    "motivation": (
        "motivation",
        "success",
        "life",
        "inspiration",
        "mindset",
        "discipline",
        "goal",
        "career",
    ),

    "news": (
        "news",
        "breaking",
        "politics",
        "government",
        "update",
        "latest",
        "report",
    ),

    "lifestyle": (
        "lifestyle",
        "daily",
        "routine",
        "home",
        "family",
        "relationship",
        "life",
    ),
}


# ============================================================
# STOP WORDS
# ============================================================

STOP_WORDS = {
    "the",
    "and",
    "for",
    "with",
    "this",
    "that",
    "from",
    "your",
    "you",
    "are",
    "was",
    "were",
    "have",
    "has",
    "had",
    "will",
    "just",
    "very",
    "into",
    "about",
    "what",
    "when",
    "where",
    "which",
    "how",
    "why",
    "who",
    "can",
    "our",
    "their",
    "they",
    "them",
    "his",
    "her",
    "its",
    "not",
    "but",
    "all",
    "more",
    "one",
    "two",
    "three",
    "this",
    "that",
    "aise",
    "hai",
    "hain",
    "ka",
    "ki",
    "ke",
    "ko",
    "se",
    "me",
    "main",
    "aur",
    "ye",
    "wo",
    "ek",
    "kya",
    "kaise",
    "sab",
}


# ============================================================
# EMBEDDING MODEL CACHE
# ============================================================

_embedding_model = None
_embedding_model_failed = False


# ============================================================
# BASIC HELPERS
# ============================================================

def utc_now() -> datetime:
    return datetime.utcnow()


def clamp(
    value: float,
    minimum: float,
    maximum: float,
) -> float:
    return max(
        minimum,
        min(
            maximum,
            float(value),
        ),
    )


def safe_json(value: Any) -> str:
    try:
        return json.dumps(
            value,
            ensure_ascii=False,
            separators=(",", ":"),
        )
    except Exception:
        return "[]"


def parse_json_list(value: Optional[str]) -> List[str]:
    if not value:
        return []

    try:
        parsed = json.loads(value)

        if isinstance(parsed, list):
            return [
                str(item)
                for item in parsed
                if item is not None
            ]

    except Exception:
        pass

    return []


def normalize_text(text: Optional[str]) -> str:
    if not text:
        return ""

    text = str(text)

    text = text[:MAX_TEXT_LENGTH]

    text = re.sub(
        r"\s+",
        " ",
        text,
    )

    return text.strip()


# ============================================================
# HASH / EMBEDDING KEY
# ============================================================

def make_embedding_key(text: str) -> str:
    """
    Stable key used to identify an embedding.

    The actual vector can later live in pgvector/vector DB.
    """

    normalized = normalize_text(text).lower()

    digest = hashlib.sha256(
        normalized.encode(
            "utf-8",
            errors="ignore",
        )
    ).hexdigest()

    return f"sha256:{digest}"


# ============================================================
# HASHTAG EXTRACTION
# ============================================================

def extract_hashtags(
    text: Optional[str],
) -> List[str]:

    text = normalize_text(text)

    hashtags = re.findall(
        r"#([A-Za-z0-9_\u0900-\u097F]+)",
        text,
    )

    result = []

    for tag in hashtags:
        tag = tag.lower().strip()

        if tag and tag not in result:
            result.append(tag)

    return result[:MAX_KEYWORDS]


# ============================================================
# TOKENIZATION
# ============================================================

def tokenize(text: str) -> List[str]:

    text = normalize_text(text).lower()

    tokens = re.findall(
        r"[a-zA-Z0-9\u0900-\u097F]+",
        text,
    )

    return [
        token
        for token in tokens
        if len(token) > 2
        and token not in STOP_WORDS
    ]


# ============================================================
# KEYWORD EXTRACTION
# ============================================================

def extract_keywords(
    text: Optional[str],
    hashtags: Optional[Sequence[str]] = None,
) -> List[str]:

    text = normalize_text(text)

    tokens = tokenize(text)

    counts = Counter(tokens)

    result = []

    if hashtags:
        for tag in hashtags:
            tag = str(tag).lower().strip()

            if tag and tag not in result:
                result.append(tag)

    for token, _count in counts.most_common():
        if token not in result:
            result.append(token)

        if len(result) >= MAX_KEYWORDS:
            break

    return result[:MAX_KEYWORDS]


# ============================================================
# CATEGORY CLASSIFICATION
# ============================================================

def classify_category(
    text: Optional[str],
) -> Tuple[str, float, Dict[str, float]]:

    normalized = normalize_text(text).lower()

    if not normalized:
        return (
            "other",
            0.0,
            {},
        )

    scores: Dict[str, float] = {}

    for category, keywords in CATEGORY_KEYWORDS.items():

        score = 0.0

        for keyword in keywords:

            keyword = keyword.lower()

            if keyword in normalized:

                if " " in keyword:
                    score += 2.0
                else:
                    score += 1.0

        if score > 0:
            scores[category] = score

    if not scores:
        return (
            "other",
            0.0,
            {},
        )

    ordered = sorted(
        scores.items(),
        key=lambda item: item[1],
        reverse=True,
    )

    best_category = ordered[0][0]
    best_score = ordered[0][1]

    total_score = sum(scores.values())

    confidence = (
        best_score / total_score
        if total_score > 0
        else 0
    )

    return (
        best_category,
        clamp(
            confidence,
            0.0,
            1.0,
        ),
        scores,
    )


# ============================================================
# SUBCATEGORY CLASSIFICATION
# ============================================================

def classify_subcategory(
    category: str,
    text: str,
) -> str:

    text = normalize_text(text).lower()

    subcategories = {

        "education": {
            "coding": (
                "coding",
                "programming",
                "python",
                "java",
                "javascript",
            ),
            "exam": (
                "exam",
                "question",
                "aktu",
                "upsc",
                "ssc",
                "study",
            ),
            "ai": (
                "artificial intelligence",
                "machine learning",
                "deep learning",
                "generative ai",
            ),
        },

        "technology": {
            "mobile": (
                "phone",
                "mobile",
                "android",
                "iphone",
            ),
            "software": (
                "software",
                "app",
                "application",
                "developer",
            ),
            "artificial_intelligence": (
                "ai",
                "machine learning",
                "deep learning",
            ),
        },

        "fitness": {
            "gym": (
                "gym",
                "muscle",
                "weight",
            ),
            "workout": (
                "workout",
                "exercise",
                "training",
            ),
            "yoga": (
                "yoga",
                "meditation",
            ),
        },

        "food": {
            "recipe": (
                "recipe",
                "cook",
                "cooking",
            ),
            "restaurant": (
                "restaurant",
                "cafe",
                "hotel",
            ),
        },

        "gaming": {
            "mobile_gaming": (
                "bgmi",
                "pubg",
                "free fire",
            ),
            "pc_gaming": (
                "valorant",
                "minecraft",
                "pc",
            ),
        },
    }

    options = subcategories.get(
        category,
        {},
    )

    for name, keywords in options.items():

        for keyword in keywords:

            if keyword in text:
                return name

    return "general"


# ============================================================
# LANGUAGE DETECTION
# ============================================================

def detect_language(
    text: Optional[str],
) -> str:

    text = normalize_text(text)

    if not text:
        return "unknown"

    devanagari = len(
        re.findall(
            r"[\u0900-\u097F]",
            text,
        )
    )

    latin = len(
        re.findall(
            r"[A-Za-z]",
            text,
        )
    )

    if devanagari > latin:
        return "hi"

    if latin > 0:
        return "en"

    return "unknown"


# ============================================================
# VIDEO METADATA
# ============================================================

def extract_video_metadata(
    video_path: Optional[str],
) -> Dict[str, Any]:

    result: Dict[str, Any] = {
        "duration": 0.0,
        "width": None,
        "height": None,
        "fps": None,
        "file_size": None,
    }

    if not video_path:
        return result

    path = Path(video_path)

    if not path.exists():
        return result

    try:
        result["file_size"] = path.stat().st_size
    except Exception:
        pass

    # ffprobe is optional.
    try:

        command = [
            "ffprobe",
            "-v",
            "quiet",
            "-print_format",
            "json",
            "-show_format",
            "-show_streams",
            str(path),
        ]

        completed = subprocess.run(
            command,
            capture_output=True,
            text=True,
            timeout=20,
            check=False,
        )

        if completed.returncode != 0:
            return result

        data = json.loads(
            completed.stdout or "{}"
        )

        fmt = data.get(
            "format",
            {},
        )

        if fmt.get("duration"):
            result["duration"] = float(
                fmt["duration"]
            )

        streams = data.get(
            "streams",
            [],
        )

        video_stream = next(
            (
                stream
                for stream in streams
                if stream.get("codec_type")
                == "video"
            ),
            None,
        )

        if video_stream:

            result["width"] = (
                video_stream.get("width")
            )

            result["height"] = (
                video_stream.get("height")
            )

            fps = video_stream.get(
                "r_frame_rate"
            )

            if fps and "/" in str(fps):

                numerator, denominator = (
                    str(fps).split("/", 1)
                )

                denominator = float(
                    denominator
                )

                if denominator:
                    result["fps"] = (
                        float(numerator)
                        / denominator
                    )

    except Exception as exc:

        logger.warning(
            "Video metadata extraction failed: %s",
            exc,
        )

    return result


# ============================================================
# QUALITY SCORE
# ============================================================

def calculate_quality_score(
    duration: float,
    width: Optional[int],
    height: Optional[int],
    caption: Optional[str],
) -> float:

    score = 0.50

    if duration > 0:

        if 3 <= duration <= 90:
            score += 0.10

        elif duration > 180:
            score -= 0.05

    if width and height:

        resolution = width * height

        if resolution >= 1920 * 1080:
            score += 0.20

        elif resolution >= 1280 * 720:
            score += 0.12

        elif resolution >= 720 * 480:
            score += 0.05

        else:
            score -= 0.10

    if normalize_text(caption):
        score += 0.05

    return clamp(
        score,
        0.0,
        1.0,
    )


# ============================================================
# SAFETY SCORE
# ============================================================

def calculate_basic_safety_score(
    text: Optional[str],
) -> float:

    text = normalize_text(text).lower()

    if not text:
        return 0.90

    # This is intentionally only a preliminary filter.
    # Production moderation should use a dedicated moderation model.
    suspicious_terms = (
        "explicit",
        "graphic violence",
        "sexual abuse",
        "illegal drug",
        "terrorist recruitment",
    )

    hits = sum(
        1
        for term in suspicious_terms
        if term in text
    )

    if hits == 0:
        return 0.95

    return clamp(
        0.95 - (hits * 0.20),
        0.0,
        1.0,
    )


# ============================================================
# EMBEDDING MODEL
# ============================================================

def get_embedding_model():
    global _embedding_model
    global _embedding_model_failed

    if not SENTENCE_TRANSFORMERS_AVAILABLE:
        return None

    if _embedding_model_failed:
        return None

    if _embedding_model is not None:
        return _embedding_model

    try:

        _embedding_model = SentenceTransformer(
            EMBEDDING_MODEL_NAME
        )

        return _embedding_model

    except Exception as exc:

        _embedding_model_failed = True

        logger.warning(
            "Embedding model unavailable: %s",
            exc,
        )

        return None


# ============================================================
# GENERATE EMBEDDING
# ============================================================

def generate_embedding(
    text: Optional[str],
) -> Optional[List[float]]:

    text = normalize_text(text)

    if not text:
        return None

    model = get_embedding_model()

    if model is None:
        return None

    try:

        vector = model.encode(
            text,
            normalize_embeddings=True,
        )

        if hasattr(
            vector,
            "tolist",
        ):
            vector = vector.tolist()

        return [
            float(value)
            for value in vector
        ]

    except Exception as exc:

        logger.warning(
            "Embedding generation failed: %s",
            exc,
        )

        return None


# ============================================================
# CONTENT DOCUMENT
# ============================================================

def build_content_document(
    reel: Reel,
    transcript: Optional[str] = None,
) -> str:

    parts = []

    if reel.caption:
        parts.append(
            normalize_text(
                reel.caption
            )
        )

    if reel.hashtags:
        parts.append(
            normalize_text(
                reel.hashtags
            )
        )

    if transcript:
        parts.append(
            normalize_text(
                transcript
            )
        )

    return " ".join(
        part
        for part in parts
        if part
    )[:MAX_TEXT_LENGTH]


# ============================================================
# ANALYZE REEL
# ============================================================

def analyze_reel(
    reel: Reel,
    video_path: Optional[str] = None,
    transcript: Optional[str] = None,
) -> Dict[str, Any]:

    document = build_content_document(
        reel,
        transcript=transcript,
    )

    hashtags = extract_hashtags(
        document
    )

    keywords = extract_keywords(
        document,
        hashtags=hashtags,
    )

    category, confidence, category_scores = (
        classify_category(document)
    )

    subcategory = classify_subcategory(
        category,
        document,
    )

    language = detect_language(
        document
    )

    metadata = extract_video_metadata(
        video_path
    )

    quality_score = (
        calculate_quality_score(
            duration=float(
                metadata.get(
                    "duration",
                    reel.duration or 0,
                )
            ),
            width=metadata.get(
                "width"
            ),
            height=metadata.get(
                "height"
            ),
            caption=reel.caption,
        )
    )

    safety_score = (
        calculate_basic_safety_score(
            document
        )
    )

    embedding = generate_embedding(
        document
    )

    embedding_key = (
        make_embedding_key(
            document
        )
        if document
        else None
    )

    topics = [
        category,
        subcategory,
    ]

    topics.extend(
        keywords[:MAX_TOPICS]
    )

    return {
        "category": category,
        "subcategory": subcategory,
        "category_confidence": confidence,
        "category_scores": category_scores,
        "keywords": keywords,
        "topics": list(
            dict.fromkeys(
                topics
            )
        )[:MAX_TOPICS],
        "detected_objects": [],
        "detected_scenes": [],
        "transcript": transcript,
        "detected_language": language,
        "audio_name": None,
        "audio_type": None,
        "duration": metadata.get(
            "duration",
            0.0,
        ),
        "width": metadata.get(
            "width"
        ),
        "height": metadata.get(
            "height"
        ),
        "fps": metadata.get(
            "fps"
        ),
        "file_size": metadata.get(
            "file_size"
        ),
        "content_quality_score": quality_score,
        "safety_score": safety_score,
        "ai_confidence": confidence,
        "embedding": embedding,
        "embedding_reference": embedding_key,
        "ai_version": AI_VERSION,
    }


# ============================================================
# SAVE AI ANALYSIS TO DATABASE
# ============================================================

def save_reel_analysis(
    db: Session,
    reel: Reel,
    analysis: Dict[str, Any],
) -> ReelAIFeature:

    feature = (
        db.query(ReelAIFeature)
        .filter(
            ReelAIFeature.reel_id
            == reel.id
        )
        .first()
    )

    if feature is None:

        feature = ReelAIFeature(
            reel_id=reel.id,
            created_at=utc_now(),
        )

        db.add(feature)

    feature.category = analysis.get(
        "category"
    )

    feature.subcategory = analysis.get(
        "subcategory"
    )

    feature.keywords = safe_json(
        analysis.get(
            "keywords",
            [],
        )
    )

    feature.detected_objects = safe_json(
        analysis.get(
            "detected_objects",
            [],
        )
    )

    feature.detected_scenes = safe_json(
        analysis.get(
            "detected_scenes",
            [],
        )
    )

    feature.transcript = analysis.get(
        "transcript"
    )

    feature.detected_language = analysis.get(
        "detected_language"
    )

    feature.audio_name = analysis.get(
        "audio_name"
    )

    feature.audio_type = analysis.get(
        "audio_type"
    )

    feature.embedding_reference = (
        analysis.get(
            "embedding_reference"
        )
    )

    feature.content_quality_score = (
        analysis.get(
            "content_quality_score"
        )
    )

    feature.safety_score = analysis.get(
        "safety_score"
    )

    feature.ai_confidence = analysis.get(
        "ai_confidence"
    )

    feature.updated_at = utc_now()

    db.commit()
    db.refresh(feature)

    return feature


# ============================================================
# FULL REEL PROCESSING
# ============================================================

def process_reel(
    db: Session,
    reel: Reel,
    video_path: Optional[str] = None,
    transcript: Optional[str] = None,
) -> Dict[str, Any]:

    """
    Main entry point called after reel upload.

    This method is intentionally safe:
    if optional AI functionality fails, the upload itself
    should not automatically fail.
    """

    try:

        analysis = analyze_reel(
            reel=reel,
            video_path=video_path,
            transcript=transcript,
        )

        feature = save_reel_analysis(
            db=db,
            reel=reel,
            analysis=analysis,
        )

        # Update basic Reel fields when available.
        if hasattr(
            reel,
            "ai_processed",
        ):
            reel.ai_processed = True

        if hasattr(
            reel,
            "ai_processing_status",
        ):
            reel.ai_processing_status = (
                "completed"
            )

        if hasattr(
            reel,
            "ai_category",
        ):
            reel.ai_category = analysis.get(
                "category"
            )

        if hasattr(
            reel,
            "ai_confidence",
        ):
            reel.ai_confidence = analysis.get(
                "ai_confidence"
            )

        if hasattr(
            reel,
            "duration",
        ):
            duration = analysis.get(
                "duration"
            )

            if duration:
                reel.duration = duration

        if hasattr(
            reel,
            "updated_at",
        ):
            reel.updated_at = utc_now()

        db.commit()

        return {
            "success": True,
            "reel_id": reel.id,
            "analysis": analysis,
            "feature_id": feature.id,
        }

    except Exception as exc:

        logger.exception(
            "Reel AI processing failed for reel=%s",
            getattr(
                reel,
                "id",
                None,
            ),
        )

        try:

            if hasattr(
                reel,
                "ai_processing_status",
            ):
                reel.ai_processing_status = (
                    "failed"
                )

            db.commit()

        except Exception:
            db.rollback()

        return {
            "success": False,
            "reel_id": getattr(
                reel,
                "id",
                None,
            ),
            "error": str(exc),
        }


# ============================================================
# INTERACTION SIGNAL WEIGHT
# ============================================================

def calculate_interaction_signal(
    interaction: ReelInteraction,
) -> float:

    score = 0.0

    watch_percentage = clamp(
        getattr(
            interaction,
            "watch_percentage",
            getattr(
                interaction,
                "completion_percent",
                0,
            ),
        ) or 0,
        0,
        100,
    )

    # --------------------------------------------------------
    # WATCH SIGNAL
    # --------------------------------------------------------

    score += (
        watch_percentage / 100
    ) * 2.5

    # --------------------------------------------------------
    # COMPLETION
    # --------------------------------------------------------

    if getattr(
        interaction,
        "completed",
        False,
    ):
        score += 3.0

    # --------------------------------------------------------
    # REPLAY
    # --------------------------------------------------------

    if getattr(
        interaction,
        "replayed",
        False,
    ):
        score += 2.5

    # --------------------------------------------------------
    # STAR
    # --------------------------------------------------------

    rating = getattr(
        interaction,
        "star_rating",
        0,
    ) or 0

    if rating == 1:
        score += 1.0

    elif rating == 2:
        score += 3.0

    elif rating == 3:
        score += 5.0

    # --------------------------------------------------------
    # POSITIVE ACTIONS
    # --------------------------------------------------------

    if getattr(
        interaction,
        "interested",
        False,
    ):
        score += 5.0

    if getattr(
        interaction,
        "saved",
        False,
    ):
        score += 5.0

    if getattr(
        interaction,
        "shared",
        False,
    ):
        score += 6.0

    if getattr(
        interaction,
        "downloaded",
        False,
    ):
        score += 3.0

    if getattr(
        interaction,
        "commented",
        False,
    ):
        score += 4.0

    # --------------------------------------------------------
    # NEGATIVE ACTIONS
    # --------------------------------------------------------

    if getattr(
        interaction,
        "not_interested",
        False,
    ):
        score -= 8.0

    return clamp(
        score,
        MIN_INTEREST_SCORE,
        MAX_INTEREST_SCORE,
    )


# ============================================================
# UPDATE USER INTEREST
# ============================================================

def update_user_interest(
    db: Session,
    user_id: int,
    category: str,
    subcategory: Optional[str],
    interaction: ReelInteraction,
) -> UserReelInterest:

    """
    Learns user preferences from actual behaviour.

    This is the online-learning layer before a dedicated
    trained recommendation model is introduced.
    """

    query = (
        db.query(UserReelInterest)
        .filter(
            UserReelInterest.user_id
            == user_id,
            UserReelInterest.category
            == category,
        )
    )

    if subcategory:
        query = query.filter(
            UserReelInterest.subcategory
            == subcategory
        )

    interest = query.first()

    if interest is None:

        interest = UserReelInterest(
            user_id=user_id,
            category=category,
            subcategory=subcategory,
            interest_score=0.0,
            positive_score=0.0,
            negative_score=0.0,
            videos_seen=0,
            videos_completed=0,
            total_watch_time=0.0,
            average_watch_percentage=0.0,
            total_replays=0,
            total_saves=0,
            total_shares=0,
            total_downloads=0,
            total_one_star=0,
            total_two_star=0,
            total_three_star=0,
            last_updated=utc_now(),
        )

        db.add(interest)

    # --------------------------------------------------------
    # COUNTERS
    # --------------------------------------------------------

    interest.videos_seen += 1

    watch_time = float(
        getattr(
            interaction,
            "watch_time",
            getattr(
                interaction,
                "watch_time_seconds",
                0,
            ),
        )
        or 0
    )

    watch_percentage = float(
        getattr(
            interaction,
            "watch_percentage",
            getattr(
                interaction,
                "completion_percent",
                0,
            ),
        )
        or 0
    )

    old_count = max(
        interest.videos_seen - 1,
        0,
    )

    interest.total_watch_time += (
        watch_time
    )

    interest.average_watch_percentage = (
        (
            interest.average_watch_percentage
            * old_count
        )
        + watch_percentage
    ) / max(
        interest.videos_seen,
        1,
    )

    if getattr(
        interaction,
        "completed",
        False,
    ):
        interest.videos_completed += 1

    if getattr(
        interaction,
        "replayed",
        False,
    ):
        interest.total_replays += 1

    if getattr(
        interaction,
        "saved",
        False,
    ):
        interest.total_saves += 1

    if getattr(
        interaction,
        "shared",
        False,
    ):
        interest.total_shares += 1

    if getattr(
        interaction,
        "downloaded",
        False,
    ):
        interest.total_downloads += 1

    rating = getattr(
        interaction,
        "star_rating",
        0,
    ) or 0

    if rating == 1:
        interest.total_one_star += 1

    elif rating == 2:
        interest.total_two_star += 1

    elif rating == 3:
        interest.total_three_star += 1

    # --------------------------------------------------------
    # SCORE
    # --------------------------------------------------------

    signal = calculate_interaction_signal(
        interaction
    )

    if signal >= 0:
        interest.positive_score += signal
    else:
        interest.negative_score += abs(
            signal
        )

    # Exponential-style smoothing.
    old_score = interest.interest_score

    learning_rate = 0.18

    interest.interest_score = clamp(
        (
            old_score
            * (1 - learning_rate)
        )
        + (
            signal
            * learning_rate
        ),
        MIN_INTEREST_SCORE,
        MAX_INTEREST_SCORE,
    )

    interest.last_updated = utc_now()

    db.commit()
    db.refresh(interest)

    return interest


# ============================================================
# RECOMMENDATION FEATURES
# ============================================================

def build_recommendation_features(
    user_interest: Optional[UserReelInterest],
    reel: Reel,
    ai_feature: Optional[ReelAIFeature],
    interaction: Optional[ReelInteraction] = None,
) -> Dict[str, float]:

    category_match = 0.0
    keyword_match = 0.0
    quality_score = 0.5
    safety_score = 0.9

    if ai_feature:

        quality_score = clamp(
            ai_feature.content_quality_score
            if ai_feature.content_quality_score
            is not None
            else 0.5,
            0,
            1,
        )

        safety_score = clamp(
            ai_feature.safety_score
            if ai_feature.safety_score
            is not None
            else 0.9,
            0,
            1,
        )

        if (
            user_interest
            and user_interest.category
            == ai_feature.category
        ):
            category_match = 1.0

        elif (
            user_interest
            and user_interest.subcategory
            and user_interest.subcategory
            == ai_feature.subcategory
        ):
            category_match = 1.0

    watch_signal = 0.0

    if interaction:

        watch_percentage = float(
            getattr(
                interaction,
                "watch_percentage",
                0,
            )
            or 0
        )

        watch_signal = clamp(
            watch_percentage / 100,
            0,
            1,
        )

    return {
        "category_match": category_match,
        "keyword_match": keyword_match,
        "quality_score": quality_score,
        "safety_score": safety_score,
        "watch_signal": watch_signal,
    }


# ============================================================
# RECOMMENDATION SCORE
# ============================================================

def calculate_recommendation_score(
    *,
    interest_score: float = 0.0,
    content_score: float = 0.0,
    popularity_score: float = 0.0,
    freshness_score: float = 0.0,
    exploration_score: float = 0.0,
    safety_score: float = 1.0,
) -> float:

    """
    Hybrid recommendation score.

    Later this function can be replaced by a trained
    ranking model without changing the rest of the system.
    """

    score = (

        interest_score * 0.40

        + content_score * 0.22

        + popularity_score * 0.12

        + freshness_score * 0.10

        + exploration_score * 0.08

        + safety_score * 0.08
    )

    return clamp(
        score,
        0.0,
        100.0,
    )


# ============================================================
# BATCH USER INTEREST REBUILD
# ============================================================

def rebuild_user_interest(
    db: Session,
    user_id: int,
) -> Dict[str, Any]:

    """
    Rebuild interest profile from historical interactions.

    Useful for:
    - first ML deployment
    - profile recalculation
    - model migrations
    - recovery
    """

    interactions = (
        db.query(ReelInteraction)
        .filter(
            ReelInteraction.user_id
            == user_id
        )
        .order_by(
            ReelInteraction.created_at.asc()
        )
        .all()
    )

    processed = 0

    category_stats: Dict[
        Tuple[str, Optional[str]],
        List[float],
    ] = {}

    for interaction in interactions:

        reel = (
            db.query(Reel)
            .filter(
                Reel.id
                == interaction.reel_id
            )
            .first()
        )

        if reel is None:
            continue

        feature = (
            db.query(ReelAIFeature)
            .filter(
                ReelAIFeature.reel_id
                == reel.id
            )
            .first()
        )

        if feature is None:
            continue

        category = (
            feature.category
            or reel.category
            or "other"
        )

        subcategory = (
            feature.subcategory
            if feature
            else None
        )

        signal = (
            calculate_interaction_signal(
                interaction
            )
        )

        key = (
            category,
            subcategory,
        )

        if key not in category_stats:
            category_stats[key] = []

        category_stats[key].append(
            signal
        )

        update_user_interest(
            db=db,
            user_id=user_id,
            category=category,
            subcategory=subcategory,
            interaction=interaction,
        )

        processed += 1

    return {
        "success": True,
        "user_id": user_id,
        "processed_interactions": processed,
        "categories": len(
            category_stats
        ),
    }


# ============================================================
# ML HEALTH CHECK
# ============================================================

def get_ai_status() -> Dict[str, Any]:

    return {
        "ai_version": AI_VERSION,
        "numpy": NUMPY_AVAILABLE,
        "sklearn": SKLEARN_AVAILABLE,
        "sentence_transformers": (
            SENTENCE_TRANSFORMERS_AVAILABLE
        ),
        "embedding_model": (
            EMBEDDING_MODEL_NAME
            if SENTENCE_TRANSFORMERS_AVAILABLE
            else None
        ),
    }


# ============================================================
# PUBLIC API
# ============================================================

__all__ = [
    "analyze_reel",
    "process_reel",
    "save_reel_analysis",
    "extract_keywords",
    "extract_hashtags",
    "classify_category",
    "classify_subcategory",
    "detect_language",
    "generate_embedding",
    "extract_video_metadata",
    "calculate_quality_score",
    "calculate_basic_safety_score",
    "calculate_interaction_signal",
    "update_user_interest",
    "build_recommendation_features",
    "calculate_recommendation_score",
    "rebuild_user_interest",
    "get_ai_status",
]
