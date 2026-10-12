
# =====================================================
# USANEX - NEXA BRAIN v0.15
# Local responses from NEXA Brain ZIP data
# =====================================================

import json
import re
from pathlib import Path
from difflib import SequenceMatcher

BRAIN_DIR = Path(__file__).with_name("nexa_brain")
DATA_FILE = BRAIN_DIR / "nexa_data_v0_15.json"

_data_cache = None


def normalize_text(text: str) -> str:
    text = (text or "").lower().strip()
    text = re.sub(r"[^\w\s]", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def load_brain_data() -> list:
    global _data_cache

    if _data_cache is not None:
        return _data_cache

    try:
        with DATA_FILE.open("r", encoding="utf-8") as file:
            data = json.load(file)

        if not isinstance(data, list):
            raise ValueError("NEXA Brain data must be a list")

        pairs = []

        for item in data:
            if (
                isinstance(item, (list, tuple))
                and len(item) >= 2
                and isinstance(item[0], str)
                and isinstance(item[1], str)
            ):
                question = item[0].strip()
                answer = item[1].strip()

                if question and answer:
                    pairs.append((question, answer))

        _data_cache = pairs
        print(f"[NEXA] Loaded {len(pairs)} Brain Q&A pairs")
        return _data_cache

    except (OSError, json.JSONDecodeError, ValueError) as exc:
        print(f"[NEXA] Brain data loading failed: {exc}")
        return []


def find_brain_reply(message: str) -> str | None:
    question = normalize_text(message)

    if not question:
        return None

    pairs = load_brain_data()
    if not pairs:
        return None

    best_answer = None
    best_score = 0.0

    question_words = set(question.split())

    for stored_question, answer in pairs:
        candidate = normalize_text(stored_question)

        if not candidate:
            continue

        if question == candidate:
            return answer

        candidate_words = set(candidate.split())
        union = question_words | candidate_words

        overlap_score = (
            len(question_words & candidate_words) / len(union)
            if union else 0.0
        )

        similarity = SequenceMatcher(
            None, question, candidate
        ).ratio()

        score = max(similarity, overlap_score)

        if score > best_score:
            best_score = score
            best_answer = answer

    # Avoid returning an unrelated answer for an unmatched question.
    if best_score >= 0.55:
        return best_answer

    return None


def generate_reply(message: str, user_name: str = "User") -> str:
    """Find a relevant response in the local NEXA Brain dataset."""

    if not (message or "").strip():
        return "Please enter a question."

    reply = find_brain_reply(message)

    if reply:
        return reply

    return (
        "Mujhe NEXA Brain v0.15 ke available data mein "
        "is sawal ka matching jawab nahi mila. "
        "Aap sawal ko doosre tarike se pooch sakte hain."
    )
