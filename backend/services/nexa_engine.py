# =========================================================
# USANEX — NEXA BRAIN v0.16
# Math + Hinglish + Local Q&A + Conversation Context
# =========================================================

import ast
import json
import operator
import re
from pathlib import Path
from difflib import SequenceMatcher

BRAIN_DIR = Path(__file__).with_name("nexa_brain")
DATA_FILE = BRAIN_DIR / "nexa_data_v0_15.json"

_data_cache = None

# Temporary conversation memory.
# Note: This resets when the server restarts.
# Production memory should be stored in the database.
_user_memory = {}

MAX_MEMORY_USERS = 1000
MAX_HISTORY = 8


# ---------------------------------------------------------
# TEXT NORMALIZATION
# ---------------------------------------------------------

def normalize_text(text: str) -> str:
    text = (text or "").lower().strip()
    text = re.sub(r"[^\w\s]", " ", text)
    return re.sub(r"\s+", " ", text).strip()


# ---------------------------------------------------------
# LOAD EXISTING 269 Q&A
# ---------------------------------------------------------

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

        overlap = (
            len(question_words & candidate_words) / len(union)
            if union else 0.0
        )

        similarity = SequenceMatcher(
            None, question, candidate
        ).ratio()

        score = max(similarity, overlap)

        if score > best_score:
            best_score = score
            best_answer = answer

    if best_score >= 0.70:
        return best_answer

    return None


# ---------------------------------------------------------
# SAFE MATH ENGINE
# Does not use eval() and does not execute arbitrary code.
# ---------------------------------------------------------

_ALLOWED_OPERATORS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.FloorDiv: operator.floordiv,
    ast.Mod: operator.mod,
    ast.Pow: operator.pow,
    ast.UAdd: operator.pos,
    ast.USub: operator.neg,
}


def _calculate_node(node):
    if isinstance(node, ast.Expression):
        return _calculate_node(node.body)

    if isinstance(node, ast.Constant):
        if isinstance(node.value, bool):
            raise ValueError("Invalid number")
        if isinstance(node.value, (int, float)):
            if abs(node.value) > 10**12:
                raise ValueError("Number too large")
            return node.value
        raise ValueError("Invalid value")

    if isinstance(node, ast.BinOp):
        operation = _ALLOWED_OPERATORS.get(type(node.op))

        if operation is None:
            raise ValueError("Operator not allowed")

        left = _calculate_node(node.left)
        right = _calculate_node(node.right)

        if isinstance(node.op, ast.Pow) and abs(right) > 10:
            raise ValueError("Exponent too large")

        if isinstance(node.op, (ast.Div, ast.FloorDiv, ast.Mod)):
            if right == 0:
                raise ZeroDivisionError

        result = operation(left, right)

        if isinstance(result, (int, float)) and abs(result) > 10**15:
            raise ValueError("Result too large")

        return result

    if isinstance(node, ast.UnaryOp):
        operation = _ALLOWED_OPERATORS.get(type(node.op))

        if operation is None:
            raise ValueError("Operator not allowed")

        return operation(_calculate_node(node.operand))

    raise ValueError("Unsupported math expression")


def solve_math(message: str) -> str | None:
    text = (message or "").lower().strip()

    # Convert common Hinglish math phrases into symbols.
    text = re.sub(r"\bmultiplied by\b", "*", text)
    text = re.sub(r"\btimes\b|\btime\b", "*", text)
    text = re.sub(r"\bplus\b", "+", text)
    text = re.sub(r"\bminus\b", "-", text)
    text = re.sub(r"\bdivided by\b", "/", text)

    # Accept "4 plus 6", "what is 4*9", etc.
    text = re.sub(
        r"^(what is|calculate|solve|kitna hota hai|"
        r"what's|answer of)\s+",
        "",
        text,
    )
    text = text.replace("?", "").strip()

    # Only attempt calculation when the whole message looks mathematical.
    if not re.fullmatch(r"[\d\s.+*/()%\-]+", text):
        return None

    if not re.search(r"[+\-*/%]", text):
        return None

    if len(text) > 100:
        return None

    try:
        tree = ast.parse(text, mode="eval")
        result = _calculate_node(tree)

        if isinstance(result, float) and result.is_integer():
            result = int(result)

        return f"Answer: {result}"

    except (ValueError, TypeError, SyntaxError, OverflowError,
            ZeroDivisionError, ArithmeticError):
        return None


# ---------------------------------------------------------
# SIMPLE CONVERSATION MEMORY
# ---------------------------------------------------------

def _get_memory(user_key: str) -> dict:
    if user_key not in _user_memory:
        # Keep memory bounded for this temporary implementation.
        if len(_user_memory) >= MAX_MEMORY_USERS:
            oldest_key = next(iter(_user_memory))
            _user_memory.pop(oldest_key, None)

        _user_memory[user_key] = {
            "name": None,
            "mood": None,
            "history": [],
        }

    return _user_memory[user_key]


def _save_history(memory: dict, message: str, reply: str) -> None:
    memory["history"].append({
        "user": message[:500],
        "assistant": reply[:1000],
    })
    memory["history"] = memory["history"][-MAX_HISTORY:]


def _conversation_reply(message: str, memory: dict,
                        user_name: str = "User") -> str | None:
    text = normalize_text(message)

    # Name declaration: "Mai Uttam hu", "my name is Uttam".
    match = re.search(
        r"\b(?:mera naam|mai|main|my name is|i am|i'm)\s+"
        r"([a-zA-Z][a-zA-Z'-]{0,30})"
        r"(?:\s+hu|hoon|hun|hai)?$",
        (message or "").strip(),
        flags=re.IGNORECASE,
    )

    if match and text not in {"mai", "main", "i am", "i m"}:
        possible_name = match.group(1).strip()
        common_words = {
            "fine", "happy", "sad", "tired", "okay", "good",
            "bad", "student", "ready", "busy", "here",
        }

        if possible_name.lower() not in common_words:
            memory["name"] = possible_name.title()
            return (
                f"Achha {memory['name']}! Main is conversation mein "
                "tumhara naam yaad rakhunga."
            )

    # Ask NEXA to recall the name.
    if any(phrase in text for phrase in (
        "mera naam kya", "my name", "naam jante ho",
        "naam yaad", "do you know my name",
    )):
        saved_name = memory.get("name")

        if saved_name:
            return f"Haan, tumne apna naam {saved_name} bataya tha."

        return "Abhi tumne is conversation mein apna naam nahi bataya."

    if any(phrase in text for phrase in (
        "hello", "hallo", "hi nexa", "hello nexa",
        "hey nexa", "hii",
    )):
        return "Hii! Batao, aaj kis baare mein baat karein?"

    if "kya haal" in text or "how are you" in text:
        return "Main theek hoon! Tum batao, kaise ho?"

    if any(phrase in text for phrase in (
        "mood kharab", "sad hu", "sad hoon",
        "upset hu", "upset hoon", "pareshan hu",
        "pareshan hoon", "feeling sad",
    )):
        memory["mood"] = "upset"
        return (
            "Oh, kya hua? Agar tum chaho to mujhe bata sakte ho. "
            "Main tumhari baat sun raha hoon."
        )

    if any(phrase in text for phrase in (
        "gf bat nahi kar", "girlfriend bat nahi kar",
        "girlfriend baat nahi kar", "gf baat nahi kar",
    )):
        return (
            "Samajh sakta hoon, is wajah se tum upset ho sakte ho. "
            "Kya tum dono ke beech kuch hua tha?"
        )

    if text in {"lete h", "lete hain", "so raha hu",
                "so rha hu", "sone ja raha hu"}:
        return "Achha, thoda rest kar lo. Agar baat karni ho, main yahin hoon."

    if "usanex kya" in text or "what is usanex" in text:
        return (
            "Usanex ek social communication platform hai. "
            "Tum uske kis feature ke baare mein jaanna chahoge?"
        )

    return None


# ---------------------------------------------------------
# MAIN RESPONSE PIPELINE
# ---------------------------------------------------------

def generate_reply(
    message: str,
    user_name: str = "User",
    conversation_id: str | None = None,
) -> str:
    if not (message or "").strip():
        return "Please enter a question."

    message = message.strip()

    # Per-user memory key is supplied by the authenticated API.
    user_key = str(conversation_id or user_name or "anonymous")
    memory = _get_memory(user_key)

    # 1. Deterministic math takes priority.
    reply = solve_math(message)

    # 2. Personal/contextual conversation responses.
    if reply is None:
        reply = _conversation_reply(message, memory, user_name)

    # 3. Existing local knowledge dataset.
    if reply is None:
        reply = find_brain_reply(message)

    # 4. Honest fallback; no fake claim of model generation.
    if reply is None:
        reply = (
            "Mujhe is sawal ka bharosemand jawab abhi nahi mila. "
            "Tum ise thoda aur detail mein pooch sakte ho."
        )

    _save_history(memory, message, reply)
    return reply


# ---------------------------------------------------------
# CHECKPOINT DIAGNOSTIC
# This checks the checkpoint; it does NOT generate text.
# ---------------------------------------------------------

def inspect_trained_checkpoint() -> dict:
    checkpoint_path = BRAIN_DIR / "nexa_brain_v0_15_trained.pt"

    if not checkpoint_path.exists():
        return {
            "available": False,
            "message": "Trained checkpoint file not found.",
        }

    try:
        import torch

        checkpoint = torch.load(
            checkpoint_path,
            map_location="cpu",
            weights_only=True,
        )

        config = checkpoint.get("config", {})
        state = checkpoint.get("model_state_dict", {})
        vocab = checkpoint.get("vocab")

        return {
            "available": True,
            "loaded": bool(state),
            "config": config,
            "vocab_size": len(vocab) if vocab is not None else None,
            "message": (
                "Checkpoint loaded for inspection only. "
                "Text generation still requires the original "
                "tokenization and decoding rules."
            ),
        }

    except Exception as exc:
        print(f"[NEXA] Checkpoint inspection failed: {exc}")
        return {
            "available": True,
            "loaded": False,
            "message": "Checkpoint inspection failed.",
        }
