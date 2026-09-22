from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    Request,
)
from sqlalchemy.orm import Session

from ..database.database import get_db
from ..database.models import User
from .auth import get_current_user_from_request


router = APIRouter(
    prefix="/api/users",
    tags=["Users"],
)


@router.get("/people")
def get_people(
    request: Request,
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
    # Current logged-in user
    current_user = get_current_user_from_request(
        request=request,
        db=db,
    )

    # Login/session nahi hai
    if current_user is None:
        raise HTTPException(
            status_code=401,
            detail="Authentication required",
        )

    # Current user ko People list se exclude karo
    users = (
        db.query(User)
        .filter(
            User.id != current_user.id
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
