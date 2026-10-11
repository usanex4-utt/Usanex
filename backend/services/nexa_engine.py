
# =====================================================
# USANEX - NEXA AI ENGINE
# Knowledge-based local response engine
# =====================================================

import json
import re
from pathlib import Path
from difflib import SequenceMatcher

KNOWLEDGE_FILE = Path(__file__).with_name("usanex_knowledge.json")


def normalize_text(text: str) -> str:
    text = (text or "").lower().strip()
    text = re.sub(r"[^\w\s]", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def tokenize(text: str) -> set:
    return set(normalize_text(text).split())


def load_knowledge() -> dict:
    try:
        with KNOWLEDGE_FILE.open("r", encoding="utf-8") as file:
            data = json.load(file)
        return data if isinstance(data, dict) else {}
    except (OSError, json.JSONDecodeError):
        return {}


def find_knowledge_reply(message: str) -> str | None:
    data = load_knowledge()
    features = data.get("features", [])
    question = normalize_text(message)
    question_words = tokenize(question)

    if not question_words:
        return None

    # Direct answers about Usanex and NEXA
    if any(term in question for term in (
        "nexa kya hai", "what is nexa", "tum kaun ho",
        "aap kaun ho", "your name", "tumhara naam"
    )):
        return (
            f"NEXA {data.get('assistant_name', 'NEXA')} hai. "
            + data.get("purpose", "")
        )

    if any(term in question for term in (
        "usanex kya hai", "what is usanex",
        "usanex ka purpose", "usanex ka main purpose"
    )):
        return data.get(
            "purpose",
            "Usanex ek social communication platform hai."
        )

    # Search feature names and descriptions
    best_feature = None
    best_score = 0.0

    for feature in features:
        name = normalize_text(feature.get("name", ""))
        description = normalize_text(feature.get("description", ""))
        searchable_words = tokenize(name + " " + description)

        overlap = len(question_words & searchable_words)
        coverage = overlap / len(question_words) if question_words else 0
        similarity = SequenceMatcher(
            None, question, name
        ).ratio() if name else 0

        score = max(coverage, similarity * 0.75)

        if score > best_score:
            best_score = score
            best_feature = feature

    # Require a reasonable match to avoid random answers.
    if best_feature and best_score >= 0.30:
        feature_status = best_feature.get("status", "unknown")
        return (
            f"{best_feature.get('name', 'Feature')}: "
            f"{best_feature.get('description', '')} "
            f"Status: {feature_status}."
        )

    return None


def generate_reply(message: str, user_name: str) -> str:
    """Generate a response using local knowledge and basic rules."""

    text = normalize_text(message)
    name = (user_name or "").strip() or "Sir"

    if not text:
        return "Apna sawal dobara likhiye."

    # Greetings
    if text in ("hi", "hello", "hey", "hii", "namaste", "namaskar"):
        return (
            f"Hello {name}! Main NEXA hoon. "
            "Bataiye, main aapki kya help karun?"
        )

    # Thanks
    if any(term in text for term in ("thank you", "thanks", "shukriya")):
        return "Welcome! 💙 Bataiye, aur kya help chahiye?"

    # Knowledge base lookup
    knowledge_reply = find_knowledge_reply(message)
    if knowledge_reply:
        return knowledge_reply

    # AI learning
    if any(term in text for term in (
        "artificial intelligence", "machine learning",
        "deep learning", "apna ai", "own ai"
    )):
        return (
            "AI banane ke liye data, model, training aur testing "
            "ki zarurat hoti hai. Hum NEXA ko step-by-step develop karenge."
        )

    # Coding
    if any(term in text for term in (
        "python", "coding", "programming",
        "fastapi", "javascript", "error", "bug"
    )):
        return (
            "Apna code ya error bhejiye. Main use samajhne "
            "aur solve karne mein madad karunga."
        )

    return (
        "Mujhe is sawal ka sahi jawab abhi knowledge base mein nahi mila. "
        "Aap sawal ko thoda alag tarike se pooch sakte hain."
    )
