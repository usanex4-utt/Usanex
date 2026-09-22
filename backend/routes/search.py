from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy import or_
from sqlalchemy.orm import Session

from ..database.database import get_db
from ..database.models import User
from .auth import get_current_user_from_request


router = APIRouter(
    prefix="/api/search",
    tags=["Search"],
)


@router.get("/people")
def search_people(
    request: Request,
    q: str = Query(
        default="",
        min_length=1,
        max_length=100,
    ),
    limit: int = Query(
        default=20,
        ge=1,
        le=50,
    ),
    offset: int = Query(
        default=0,
        ge=0,
    ),
    db: Session = Depends(get_db),
):
    """
    Search users by:
    - name
    - username
    - mobile
    - user_id

    The currently logged-in user is excluded.
    """

    current_user = get_current_user_from_request(
        request=request,
        db=db,
    )

    if current_user is None:
        raise HTTPException(
            status_code=401,
            detail="Authentication required",
        )

    search_text = q.strip()

    if not search_text:
        return {
            "success": True,
            "users": [],
            "pagination": {
                "limit": limit,
                "offset": offset,
                "count": 0,
            },
        }

    search_pattern = f"%{search_text}%"

    users = (
        db.query(User)
        .filter(
            User.id != current_user.id,
            or_(
                User.name.ilike(search_pattern),
                User.username.ilike(search_pattern),
                User.mobile.ilike(search_pattern),
                User.user_id.ilike(search_pattern),
            ),
        )
        .order_by(
            User.id.desc()
        )
        .offset(offset)
        .limit(limit)
        .all()
    )

    return {
        "success": True,
        "users": [
            {
                "username": user.username,
                "user_id": user.user_id,
                "name": user.name,
                "profile_photo": user.profile_photo,
            }
            for user in users
        ],
        "pagination": {
            "limit": limit,
            "offset": offset,
            "count": len(users),
        },
    }
