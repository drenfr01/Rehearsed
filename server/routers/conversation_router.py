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
    user_id: int


@router.post("/send_message")
async def get_gemini_message(request: Request, gemini_message: GeminiMessage):
    return request.state.gemini_service.get_gemini_message(
        message=gemini_message.message, user_id=gemini_message.user_id
    )


@router.get("/messages")
async def fetch_user_messages(request: Request, user_id: str):
    return request.state.gemini_service.fetch_user_messages(user_id=int(user_id))


# TODO: break this into a scenario service?
# @router.get("/scenarios")
# async def get_scenarios(request: Request):
#     return request.state.gemini_service.get_scenario_data()


# # TODO: break this into a scenario service?
# @router.post("/set_scenario_data")
# async def set_scenario_data(request: Request, scenario_id: str):
#     return request.state.gemini_service.set_scenario_data(scenario_id=scenario_id)
