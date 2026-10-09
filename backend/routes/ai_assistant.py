# =========================================================
# USANEX — NEXA PERSONAL AI ASSISTANT
# File: backend/routes/ai_assistant.py
# OpenAI API: NOT REQUIRED
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
    message: str = Field(
        ...,
        min_length=1,
        max_length=4000,
    )


def get_logged_in_user(request: Request, db: Session):
    user = get_current_user_from_request(
        request=request,
        db=db,
    )

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="Please log in to use NEXA.",
        )

    return user


def normalize_text(text: str) -> str:
    """Normalize user text for basic intent matching."""
    return re.sub(r"\s+", " ", text.lower()).strip()


def generate_nexa_reply(message: str, user_name: str) -> str:
    """
    Initial rule-based NEXA engine.
    This works locally without an external AI API.
    It is not yet a trained language model.
    """

    text = normalize_text(message)

    # Greetings
    greetings = (
        "hi", "hello", "hey", "hii", "namaste",
        "namaskar", "kaise ho", "good morning",
        "good evening", "good afternoon",
    )

    if text in greetings or text.startswith(
        ("hello ", "hi ", "hey ", "namaste ")
    ):
        return (
            f"Hello {user_name}! 💙 Main NEXA hoon, "
            "tumhara Usanex personal assistant. "
            "Batao, aaj kya help chahiye?"
        )

    # Assistant identity
    if any(term in text for term in (
        "who are you", "tum kaun ho", "aap kaun ho",
        "your name", "tumhara naam", "nexa kaun",
    )):
        return (
            "Main NEXA hoon 💙, Usanex ka personal AI assistant. "
            "Abhi mera basic Python response engine active hai. "
            "Hum ise dheere-dheere apne knowledge aur model "
            "se improve karenge."
        )

    # Usanex project
    if "usanex" in text:
        return (
            "Usanex ek social communication platform hai. 💙 "
            "Is project mein login, profiles, connections, "
            "notifications, chat aur doosre features ko "
            "step-by-step develop kiya ja sakta hai. "
            "Main abhi tumhare private account data ko "
            "automatically access nahi karta."
        )

    # Couple chat
    if any(term in text for term in (
        "couple chat", "couple-chat", "partner chat",
    )):
        return (
            "Couple Chat 💙 ke liye hum partner-specific chat, "
            "message delivery/seen status aur conversation "
            "features par kaam kar sakte hain. "
            "Actual chat kholne ke liye app route integration "
            "alag se implement karna hoga."
        )

    # Usanex-related assignment or ideas
    if any(term in text for term in (
        "assignment", "project idea", "feature idea",
    )):
        return (
            "Usanex se related ek idea: NEXA ke andar "
            "'Smart Learning & Project Helper' section banaya "
            "ja sakta hai. Ismein users project ideas, coding "
            "guidance aur step-by-step explanations le sakte hain. "
            "Yeh existing Usanex app ke andar hi rahega."
        )

    # AI development
    if any(term in text for term in (
        "train model", "own model", "apna ai",
        "khud ka ai", "machine learning", "deep learning",
        "language model", "llm",
    )):
        return (
            "Apna AI banane ke liye hum 3 steps lenge 💙:\n"
            "1. Python-based response engine.\n"
            "2. Curated knowledge aur search system.\n"
            "3. Training data, evaluation aur testing ke baad "
            "apna chhota language model.\n\n"
            "Abhi NEXA ka engine basic hai; ise trained model "
            "samajhna sahi nahi hoga."
        )

    # Python and coding
    if any(term in text for term in (
        "python", "coding", "code", "programming",
        "fastapi", "api",
    )):
        return (
            "Main coding mein step-by-step help karne ke liye "
            "taiyar hoon 💻. Abhi mera built-in knowledge "
            "limited hai. Apna code ya exact error bhejo, "
            "toh main available information ke basis par "
            "guide kar sakta hoon."
        )

    # Help
    if any(term in text for term in (
        "help", "madad", "kya kar sakte", "what can you do",
    )):
        return (
            "Main abhi in basic topics par help kar sakta hoon 💙:\n"
            "• Usanex ke features aur ideas\n"
            "• NEXA ko develop karne ki planning\n"
            "• Basic coding guidance\n"
            "• AI model banane ke initial steps\n\n"
            "Abhi main har sawal ka jawab nahi jaanta. "
            "Hum naye verified knowledge se ise improve karenge."
        )

    # Default response
    return (
        f"{user_name}, tumhara message mujhe mil gaya. 💙\n\n"
        "Abhi main ek initial Python-based assistant hoon, "
        "isliye mere paas har topic ka ready answer nahi hai. "
        "Apna sawal thoda aur detail mein likho ya Usanex, "
        "coding aur AI development se related sawal poochho."
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
        "message": f"Hello {user.name}, NEXA is ready.",
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
            detail="Please enter a message.",
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
