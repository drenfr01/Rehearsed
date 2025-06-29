from fastapi import APIRouter, Query, Request
from typing import Annotated
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
    return request.app.state.session_service.get_or_create_session(
        user_id=create_session_request.user_id
    )


@router.get("/get-current-session")
async def get_current_session(request: Request, get_session_request: GetSessionRequest):
    return request.app.state.session_service.get_or_create_session(
        user_id=get_session_request.user_id,
        session_id=get_session_request.session_id,
    )


@router.get("/get-session-content")
async def get_session_content(request: Request, get_session_request: GetSessionRequest):
    return request.app.state.session_service.get_session_content(
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
