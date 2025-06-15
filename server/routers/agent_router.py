import asyncio
from fastapi import APIRouter, Depends, Request, WebSocket, File, UploadFile, Form
from pydantic import BaseModel
from typing import Optional
from fastapi.responses import JSONResponse

from server.agents.agent_streaming import streaming_root_agent
from server.agents.feedback_agent import feedback_agent
from server.models.agent_interface import Conversation
from server.models.agent_model import AgentResponse
from server.service.agent_service_request import AgentServiceRequest
from server.service.agent_service_streaming import AgentServiceStreaming
from server.service.speech_to_text_service import SpeechToTextService
from server.service.text_to_speech_service import TextToSpeechService

from server.service.agent_service import AgentType

router = APIRouter(
    prefix="/agent",
    tags=["agent"],
    responses={404: {"description": "Not found"}},
)

# Initialize the services
speech_to_text_service = SpeechToTextService()
text_to_speech_service = TextToSpeechService()


async def get_agent_service_request(request: Request) -> AgentServiceRequest:
    return AgentServiceRequest(
        scenario_service=request.state.scenario_service, agent_type=AgentType.ROOT
    )


async def get_feedback_agent_service_request(request: Request) -> AgentServiceRequest:
    return AgentServiceRequest(
        scenario_service=request.state.scenario_service,
        agent_type=AgentType.FEEDBACK,
    )


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
    message: str = Form(...),
    user_id: str = Form(...),
    session_id: str = Form(...),
    audio: Optional[UploadFile] = File(None),
    agent_service: AgentServiceRequest = Depends(get_agent_service_request),
) -> JSONResponse:
    # Initialize the agent service
    agent_service.initialize_agent(user_id, session_id)

    # If there's an audio file, process it
    if audio:
        audio_content = await audio.read()
        # Transcribe the audio
        transcript = await speech_to_text_service.transcribe_audio(audio_content)

        if transcript:
            # Combine the transcribed text with the original message
            message = transcript

    # Get the agent's response
    response = await agent_service.request_agent_response(
        agent_service.runner,
        user_id,
        session_id,
        message,
    )

    # Convert the response to speech
    audio_content = await text_to_speech_service.text_to_speech(response)

    # Return both the text response and audio content
    return JSONResponse(
        content={
            "text": response,
            "audio": audio_content.decode("latin1") if audio_content else None,
            "markdown_text": response.markdown_text,
        }
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
    agent_request: AgentRequest,
    agent_service: AgentServiceRequest = Depends(get_feedback_agent_service_request),
):
    print(f"Requesting feedback for session {agent_request.session_id}")
    agent_service.initialize_agent(agent_request.user_id, agent_request.session_id)
    return await agent_service.request_agent_response(
        agent_service.runner,
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
