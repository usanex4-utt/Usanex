
# =========================================================
# USANEX — NEXA AI ASSISTANT ROUTES
# backend/routes/ai_assistant.py
# =========================================================

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from ..database.database import get_db
from .auth import get_current_user_from_request


router = APIRouter(
    prefix="/api/ai-assistant",
    tags=["NEXA AI Assistant"],
)


@router.get("/status")
def nexa_status(
    request: Request,
    db: Session = Depends(get_db),
):
    user = get_current_user_from_request(
        request=request,
        db=db,
    )

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="Please log in to use NEXA.",
        )

    return {
        "success": True,
        "assistant": "NEXA",
        "message": f"Hello {user.name}, NEXA is ready.",
    }
