from fastapi import APIRouter, Request
from pydantic import BaseModel

from server.models.message import SummarizeFeedbackRequest, SummarizeFeedbackResponse

router = APIRouter(
    prefix="/conversation",
    tags=["conversation"],
    responses={404: {"description": "Not found"}},
)


# TODO: make userID into a session variable
class GeminiMessage(BaseModel):
    message: str
    user_id: int


@router.post("/send_message")
async def get_gemini_message(request: Request, gemini_message: GeminiMessage):
    return request.state.gemini_service.get_gemini_message(
        message=gemini_message.message, user_id=gemini_message.user_id
    )


@router.get("/messages")
async def fetch_user_messages(request: Request, user_id: str):
    return request.state.gemini_service.fetch_user_messages(user_id=int(user_id))


@router.post("/provide_user_feedback")
async def provide_user_feedback(
    request: Request, summarize_feedback_request: SummarizeFeedbackRequest
) -> SummarizeFeedbackResponse:
    return request.state.gemini_service.provide_user_feedback(
        user_id=summarize_feedback_request.user_id
    )
