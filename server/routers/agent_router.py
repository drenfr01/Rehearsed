from fastapi import APIRouter, Depends, WebSocket
from server.service.agent_service_request import AgentServiceRequest
from server.service.agent_service_streaming import AgentServiceStreaming
import asyncio
from pydantic import BaseModel
from server.agents.agent_streaming import streaming_root_agent
from server.agents.agent import root_agent as request_root_agent

router = APIRouter(
    prefix="/agent",
    tags=["agent"],
    responses={404: {"description": "Not found"}},
)


async def get_agent_service_request() -> AgentServiceRequest:
    return AgentServiceRequest()


async def get_agent_service_streaming() -> AgentServiceStreaming:
    return AgentServiceStreaming()


class AgentRequest(BaseModel):
    message: str
    session_id: str
    user_id: str


@router.post("/request")
async def request_agent_response(
    agent_request: AgentRequest,
    agent_service: AgentServiceRequest = Depends(get_agent_service_request),
):
    print(f"Requesting agent response for session {agent_request.session_id}")
    runner, _, _ = agent_service.start_agent_session(
        agent_request.user_id, agent_request.session_id, request_root_agent
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
    agent_service: AgentServiceStreaming = Depends(get_agent_service_streaming),
):
    await websocket.accept()
    print(f"Client #{session_id} connected")

    # # Start agent session
    _, live_events, live_request_queue = agent_service.start_agent_session(
        user_id, session_id, streaming_root_agent
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
