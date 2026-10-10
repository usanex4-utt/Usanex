
# =====================================================
# USANEX - NEXA AI ENGINE
# File: backend/services/nexa_engine.py
# =====================================================

import re


def normalize_text(text: str) -> str:
    """Clean user message."""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s]", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def generate_reply(message: str, user_name: str) -> str:
    """Generate a basic NEXA response."""

    text = normalize_text(message)
    name = user_name.strip() or "Sir"

    if not text:
        return "Apna sawal dobara likhiye."

    # Greetings
    if text in (
        "hi", "hello", "hey", "hii",
        "namaste", "namaskar"
    ):
        return (
            f"Hello {name}! Main NEXA hoon. "
            "Bataiye, main aapki kya help karun?"
        )

    # NEXA identity
    if any(word in text for word in (
        "who are you", "tum kaun ho",
        "aap kaun ho", "your name",
        "tumhara naam"
    )):
        return (
            "Main NEXA hoon, Usanex ka personal "
            "assistant. Main aapki madad ke liye hoon."
        )

    # Usanex
    if "usanex" in text:
        return (
            "Usanex ek social communication platform hai. "
            "Aap kis feature par kaam karna chahte hain?"
        )

    # AI learning
    if any(word in text for word in (
        "artificial intelligence", "machine learning",
        "deep learning", "apna ai", "own ai"
    )):
        return (
            "AI banane ke liye data, model, training aur "
            "testing ki zarurat hoti hai. Hum NEXA ko "
            "step-by-step develop karenge."
        )

    # Coding
    if any(word in text for word in (
        "python", "coding", "programming",
        "fastapi", "javascript", "error", "bug"
    )):
        return (
            "Apna code ya error bhejiye. Main use samajhne "
            "aur solve karne mein madad karunga."
        )

    # Thanks
    if any(word in text for word in (
        "thank you", "thanks", "shukriya"
    )):
        return "Welcome! 💙 Bataiye, aur kya help chahiye?"

    # Default response
    return (
        "Main NEXA hoon. Aap apna sawal thoda aur "
        "detail mein batayein, taaki main madad kar sakun."
    )
