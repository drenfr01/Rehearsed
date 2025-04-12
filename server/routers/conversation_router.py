from fastapi import APIRouter, Request
from pydantic import BaseModel

router = APIRouter(
    prefix="/conversation",
    tags=["conversation"],
    responses={404: {"description": "Not found"}},
)


# TODO: make userID into a session variable
class GeminiMessage(BaseModel):
    message: str
    user_id: str


@router.post("/send_message")
async def get_gemini_message(request: Request, gemini_message: GeminiMessage):
    return request.state.gemini_service.get_gemini_message(
        message=gemini_message.message, user_id=gemini_message.user_id
    )


@router.get("/messages")
async def fetch_user_messages(request: Request, user_id: str):
    return request.state.gemini_service.fetch_user_messages(user_id=int(user_id))
