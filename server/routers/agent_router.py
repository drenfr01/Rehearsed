from fastapi import APIRouter, Depends, WebSocket
from server.service.agent_service import AgentService
import asyncio
from pydantic import BaseModel

router = APIRouter(
    prefix="/agent",
    tags=["agent"],
    responses={404: {"description": "Not found"}},
)


async def get_agent_service() -> AgentService:
    return AgentService()


class AgentRequest(BaseModel):
    message: str
    session_id: str
    user_id: str


@router.post("/request")
async def request_agent_response(
    agent_request: AgentRequest,
    agent_service: AgentService = Depends(get_agent_service),
):
    print(f"Requesting agent response for session {agent_request.session_id}")
    runner, _, _ = agent_service.start_agent_session(
        agent_request.user_id, agent_request.session_id
    )
    return await agent_service.request_agent_response(
        runner,
        agent_request.user_id,
        agent_request.session_id,
        agent_request.message,
    )


@router.websocket("/ws/{user_id}/{session_id}")
async def agent_websocket(
    websocket: WebSocket,
    user_id: str,
    session_id: str,
    agent_service: AgentService = Depends(get_agent_service),
):
    await websocket.accept()
    print(f"Client #{session_id} connected")

    # Start agent session
    _, live_events, live_request_queue = agent_service.start_agent_session(
        user_id, session_id
    )

    # Start agent to client messaging
    agent_to_client_task = asyncio.create_task(
        agent_service.agent_to_client_messaging(websocket, live_events)
    )

    # Start client to agent messaging
    client_to_agent_task = asyncio.create_task(
        agent_service.client_to_agent_messaging(websocket, live_request_queue)
    )

    # Wait for both tasks to complete
    await asyncio.gather(agent_to_client_task, client_to_agent_task)

    print(f"Client #{session_id} disconnected")
