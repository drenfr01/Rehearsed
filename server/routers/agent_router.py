from fastapi import APIRouter, Depends, WebSocket
from server.service.agent_service_request import AgentServiceRequest
from server.service.agent_service_streaming import AgentServiceStreaming
import asyncio
from pydantic import BaseModel
from server.agents.agent_streaming import streaming_root_agent
from server.agents.agent import root_agent as request_root_agent
from server.agents.feedback_agent import feedback_agent
from server.models.agent_interface import Conversation

router = APIRouter(
    prefix="/agent",
    tags=["agent"],
    responses={404: {"description": "Not found"}},
)


async def get_agent_service_request() -> AgentServiceRequest:
    return AgentServiceRequest(root_agent=request_root_agent)


async def get_agent_service_streaming() -> AgentServiceStreaming:
    return AgentServiceStreaming()


class AgentRequest(BaseModel):
    message: str
    session_id: str
    user_id: str


@router.post("/start-session")
async def start_session(
    agent_request: AgentRequest,
    agent_service: AgentServiceRequest = Depends(get_agent_service_request),
):
    return await agent_service.initialize_agent(
        agent_request.user_id, agent_request.session_id
    )


@router.post("/request")
async def request_agent_response(
    agent_request: AgentRequest,
    agent_service: AgentServiceRequest = Depends(get_agent_service_request),
):
    # TODO: I don't love this, it seems brittle
    # The issue is that each request gets a different AgentService. So
    # the initialization in the below get request doesn't actually configure
    # the agentservice for this route
    agent_service.initialize_agent(agent_request.user_id, agent_request.session_id)
    return await agent_service.request_agent_response(
        agent_service.runner,
        agent_request.user_id,
        agent_request.session_id,
        agent_request.message,
    )


@router.get("/conversation/{user_id}/{session_id}")
async def get_conversation_content(
    user_id: str,
    session_id: str,
    agent_service: AgentServiceRequest = Depends(get_agent_service_request),
) -> Conversation:
    return await agent_service.get_session_content(user_id, session_id)


@router.post("/feedback")
async def request_feedback(
    feedback_request: AgentRequest,
    agent_service: AgentServiceRequest = Depends(get_agent_service_request),
):
    print(f"Requesting feedback for session {feedback_request.session_id}")
    runner = agent_service.get_agent_session(
        user_id=feedback_request.user_id,
        session_id=feedback_request.session_id,
        root_agent=feedback_agent,
    )

    feedback_message = "Please provide feedback on the users conversation"
    # TODO: figure out how to pass in feedback agent?
    return await agent_service.request_agent_response(
        runner,
        feedback_request.user_id,
        feedback_request.session_id,
        feedback_message,
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
