import uuid
from typing import Annotated

from fastapi import APIRouter, Query, Request

from server.models.session_interface import (
    CreateSessionRequest,
    GetAllSessionsForUserRequest,
    GetSessionRequest,
)

router = APIRouter(
    prefix="/session",
    tags=["session"],
    responses={404: {"description": "Not found"}},
)


@router.post("/create")
async def create_session(
    request: Request, create_session_request: CreateSessionRequest
):
    # Generate a new session ID
    session_id = str(uuid.uuid4())
    session = await request.app.state.session_service.get_or_create_session(
        user_id=create_session_request.user_id, session_id=session_id
    )

    # Transform session to match client interface
    transformed_session = {
        "id": session.id,
        "userId": session.user_id,
        "lastUpdateTime": str(session.last_update_time),
    }

    return {"sessions": [transformed_session]}


@router.get("/get-current-session")
async def get_current_session(
    request: Request, get_session_request: Annotated[GetSessionRequest, Query()]
):
    return request.app.state.session_service.get_or_create_session(
        user_id=get_session_request.user_id,
        session_id=get_session_request.session_id,
    )


@router.get("/get-session-content")
async def get_session_content(
    request: Request, get_session_request: Annotated[GetSessionRequest, Query()]
):
    return await request.app.state.session_service.get_session_content(
        user_id=get_session_request.user_id,
        session_id=get_session_request.session_id,
    )


@router.get("/get-all-sessions-for-user")
async def get_all_sessions_for_user(
    request: Request,
    get_all_sessions_for_user_request: Annotated[GetAllSessionsForUserRequest, Query()],
):
    return await request.app.state.session_service.get_all_sessions_for_user(
        user_id=get_all_sessions_for_user_request.user_id
    )


@router.get("/debug-sessions")
async def debug_sessions(request: Request):
    """Debug endpoint to check session storage"""
    user_id = "18"  # Test user ID
    sessions = await request.app.state.session_service.get_all_sessions_for_user(
        user_id
    )
    return {"message": "Debug sessions", "user_id": user_id, "sessions": sessions}
