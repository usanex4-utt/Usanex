
# =========================================================
# USANEX — NEXA AI ASSISTANT ROUTES
# File: backend/routes/ai_assistant.py
# =========================================================

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..database.database import get_db
from ..database.models import User
from ..services.nexa_engine import generate_reply
from .auth import get_current_user_from_request


router = APIRouter(
    prefix="/api/ai-assistant",
    tags=["AI Assistant"],
)


# =========================================================
# REQUEST MODEL
# =========================================================

class ChatRequest(BaseModel):
    message: str = Field(
        min_length=1,
        max_length=5000,
    )


# =========================================================
# STATUS
# GET /api/ai-assistant/status
# =========================================================

@router.get("/status")
def ai_assistant_status():
    return {
        "app": "Usanex",
        "assistant": "NEXA",
        "status": "online",
        "engine": "python-basic",
    }


# =========================================================
# CHAT
# POST /api/ai-assistant/chat
# Requires a logged-in user
# =========================================================

@router.post("/chat")
def nexa_chat(
    request: ChatRequest,
    user: User | None = Depends(
        get_current_user_from_request
    ),
):
    # Check authentication
    if user is None:
        raise HTTPException(
            status_code=401,
            detail="Please log in to use NEXA.",
        )

    # Validate message
    message = request.message.strip()

    if not message:
        raise HTTPException(
            status_code=400,
            detail="Please enter a message.",
        )

    # Generate NEXA response
    try:
        reply = generate_reply(
            message=message,
            user_name=user.name or "User",
        )

        return {
            "success": True,
            "assistant": "NEXA",
            "reply": reply,
            "engine": "python-basic",
        }

    except Exception as exc:
        print(f"[NEXA] Chat error: {exc}")

        raise HTTPException(
            status_code=500,
            detail="NEXA could not process your message.",
        )
        
