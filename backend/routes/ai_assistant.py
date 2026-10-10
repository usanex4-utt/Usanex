
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database.database import get_db
from ..database.models import User
from ..services.nexa_engine import generate_reply
from .auth import get_current_user_from_request

router = APIRouter(
    prefix="/api/ai-assistant",
    tags=["AI Assistant"],
)


class ChatRequest(BaseModel):
    message: str


@router.get("/status")
def ai_assistant_status():
    return {
        "app": "Usanex",
        "assistant": "NEXA",
        "status": "online",
        "engine": "python-basic",
    }


@router.post("/chat")
def nexa_chat(
    request: ChatRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user_from_request),
):
    message = request.message.strip()

    if not message:
        raise HTTPException(
            status_code=400,
            detail="Please enter a message.",
        )

    try:
        reply = generate_reply(
            message=message,
            user_name=user.name,
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
        
