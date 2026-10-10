# =========================================================
# USANEX — NEXA PERSONAL ASSISTANT
# File: backend/routes/ai_assistant.py
# No OpenAI API required
# =========================================================

import re

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..database.database import get_db
from .auth import get_current_user_from_request


router = APIRouter(
    prefix="/api/ai-assistant",
    tags=["NEXA AI Assistant"],
)


class NEXAChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)


def get_logged_in_user(request: Request, db: Session):
    user = get_current_user_from_request(request=request, db=db)

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="Please log in to use NEXA."
        )

    return user


def normalize_text(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s]", " ", text, flags=re.UNICODE)
    return re.sub(r"\s+", " ", text).strip()


def contains_any(text: str, phrases: tuple) -> bool:
    return any(phrase in text for phrase in phrases)


def generate_nexa_reply(message: str, user_name: str) -> str:
    text = normalize_text(message)

    if not text:
        return "Sir, aap apna sawal dobara boliye."

    # Greetings
    if text in (
        "hi", "hello", "hey", "hii", "namaste",
        "namaskar", "good morning", "good evening",
        "good afternoon", "kaise ho", "kaise hain"
    ):
        return (
            f"Hello sir {user_name}! Main NEXA hoon. "
            "Bataiye, main aapki kya help kar sakta hoon?"
        )

    # Identity
    if contains_any(text, (
        "who are you", "tum kaun ho", "aap kaun ho",
        "tumhara naam", "aapka naam", "your name",
        "nexa kaun"
    )):
        return (
            "Sir, main NEXA hoon, Usanex ka personal assistant. "
            "Main aapke sawalon aur Usanex project mein madad "
            "karne ke liye bana hoon."
        )

    # Capabilities
    if contains_any(text, (
        "what can you do", "kya kar sakte ho",
        "kya kar sakte hain", "meri help", "help me",
        "madad karo", "help chahiye"
    )):
        return (
            "Sir, main abhi basic Python engine par kaam kar raha hoon. "
            "Main greetings, Usanex ke ideas, basic coding aur AI "
            "development ke baare mein madad kar sakta hoon. "
            "Abhi mere paas har topic ka jawab nahi hai."
        )

    # Usanex
    if "usanex" in text:
        return (
            "Sir, Usanex aapka social communication platform hai. "
            "Ismein profiles, connections, notifications, chat aur "
            "NEXA assistant jaise features hain. Aap bataiye, "
            "Usanex ke kis feature par kaam karna hai?"
        )

    # Couple chat
    if contains_any(text, (
        "couple chat", "partner chat", "couple-chat"
    )):
        return (
            "Sir, Couple Chat mein partner-specific conversations, "
            "message delivery aur seen status jaise features par "
            "kaam kiya ja sakta hai. Aap kis feature ko improve "
            "karna chahte hain?"
        )

    # AI and machine learning
    if contains_any(text, (
        "artificial intelligence", "machine learning",
        "deep learning", "language model", "llm",
        "apna ai", "khud ka ai", "own ai", "train model"
    )):
        return (
            "Sir, apna AI banane ke liye Python, data preparation, "
            "model selection, training aur testing seekhna hoga. "
            "Bina external AI API ke local model ya rule-based "
            "system use kiya ja sakta hai. Dono ki capabilities "
            "alag hoti hain. Aap chahen to hum ise step-by-step "
            "develop kar sakte hain."
        )

    # Python and coding
    if contains_any(text, (
        "python", "coding", "programming", "fastapi",
        "api", "javascript", "html", "css", "error", "bug"
    )):
        return (
            "Sir, coding mein help karne ke liye apna code, error "
            "message ya exact requirement batayein. Main available "
            "information ke basis par step-by-step guidance dunga."
        )

    # Assignment and project
    if contains_any(text, (
        "assignment", "project idea", "feature idea",
        "college project"
    )):
        return (
            "Sir, Usanex ke andar ek Smart Learning section banaya "
            "ja sakta hai. Ismein project ideas, coding guidance, "
            "concept explanations aur learning progress ho sakti hai. "
            "Aap kis idea ko implement karna chahte hain?"
        )

    # Thanks
    if contains_any(text, (
        "thank you", "thanks", "shukriya", "dhanyawad"
    )):
        return "You're welcome sir! 💙 Bataiye, aur kya help chahiye?"

    # Name and time-independent conversational fallback
    return (
        f"Ji sir, aapne kaha: {message}. "
        "Main abhi basic Python-based assistant hoon aur har sawal "
        "ka jawab nahi jaanta. Aap apna sawal thoda detail mein "
        "batayein; main available rules ke hisaab se madad karunga."
    )


@router.get("/status")
def nexa_status(
    request: Request,
    db: Session = Depends(get_db),
):
    user = get_logged_in_user(request, db)

    return {
        "success": True,
        "assistant": "NEXA",
        "engine": "python-basic",
        "message": f"Hello {user.name}, NEXA is ready."
    }


@router.post("/chat")
def nexa_chat(
    payload: NEXAChatRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    user = get_logged_in_user(request, db)
    message = payload.message.strip()

    if not message:
        raise HTTPException(
            status_code=400,
            detail="Please say your question again."
        )

    reply = generate_nexa_reply(
        message=message,
        user_name=user.name,
    )

    return {
        "success": True,
        "assistant": "NEXA",
        "engine": "python-basic",
        "reply": reply,
        "user": user.name,
    }
