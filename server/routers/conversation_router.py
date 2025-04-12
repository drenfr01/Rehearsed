from fastapi import APIRouter, Request
from pydantic import BaseModel

router = APIRouter(
    prefix="/conversation",
    tags=["conversation"],
    responses={404: {"description": "Not found"}},
)


class GeminiMessage(BaseModel):
    message: str
    user_id: str


@router.post("/message")
async def get_gemini_message(request: Request, gemini_message: GeminiMessage):
    return request.state.gemini_service.get_gemini_message(
        message=gemini_message.message, user_id=gemini_message.user_id
    )
