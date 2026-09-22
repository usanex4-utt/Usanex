from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..database.database import get_db
from ..database.models import User


router = APIRouter(
    prefix="/api/users",
    tags=["Users"],
)


@router.get("/people")
def get_people(
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
    users = (
        db.query(User)
        .order_by(User.id.desc())
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
