# =========================================================
# USANEX — NEXA AI ASSISTANT ROUTES
# backend/routes/ai_assistant.py
# =========================================================

import os

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


@router.get("/status")
def nexa_status(
    request: Request,
    db: Session = Depends(get_db),
):
    user = get_logged_in_user(request, db)

    return {
        "success": True,
        "assistant": "NEXA",
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

    # API key must be configured in the server environment.
    api_key = os.getenv("OPENAI_API_KEY")

    if not api_key:
        raise HTTPException(
            status_code=503,
            detail=(
                "NEXA AI is not configured yet. "
                "Please add OPENAI_API_KEY in Render environment variables."
            ),
        )

    try:
        from openai import OpenAI

        client = OpenAI(api_key=api_key)

        response = client.responses.create(
            model=os.getenv("NEXA_MODEL", "gpt-5-mini"),
            instructions=(
                "You are NEXA, the personal AI assistant inside Usanex. "
                "Be helpful, friendly, accurate, and concise. "
                "Support users with learning, coding, productivity, "
                "and questions about using the Usanex platform. "
                "Do not claim to access private Usanex account data "
                "unless that data is explicitly provided to you. "
                "Reply in the language the user uses when practical."
            ),
            input=message,
        )

        reply = response.output_text.strip()

        if not reply:
            raise RuntimeError("The AI returned an empty response.")

        return {
            "success": True,
            "assistant": "NEXA",
            "reply": reply,
            "user": user.name,
        }

    except HTTPException:
        raise

    except Exception:
        # Keep provider details and secrets out of the response.
        raise HTTPException(
            status_code=502,
            detail=(
                "NEXA could not generate a reply right now. "
                "Please try again shortly."
            ),
        )
