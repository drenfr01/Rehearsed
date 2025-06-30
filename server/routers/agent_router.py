import asyncio
import base64
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, Request, UploadFile, WebSocket
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from server.models.agent_interface import Conversation
from server.service.agent_request_service import AgentRequestService
from server.service.agent_service_streaming import AgentServiceStreaming
from server.service.session_service import SessionService
from server.service.speech_to_text_service import SpeechToTextService
from server.service.text_to_speech_service import TextToSpeechService

router = APIRouter(
    prefix="/agent",
    tags=["agent"],
    responses={404: {"description": "Not found"}},
)

# Initialize the services
speech_to_text_service = SpeechToTextService()
text_to_speech_service = TextToSpeechService()


async def get_agent_service_request(request: Request) -> AgentRequestService:
    return AgentRequestService(
        agent_service=request.app.state.agent_service,
    )


async def get_agent_service_streaming() -> AgentServiceStreaming:
    return AgentServiceStreaming()


class AgentRequest(BaseModel):
    agent_name: str
    message: str
    session_id: str
    user_id: str


@router.post("/start-session")
async def start_session(
    agent_request: AgentRequest,
    agent_request_service: AgentRequestService = Depends(get_agent_service_request),
):
    return await agent_request_service.initialize_runner(
        agent_request.user_id, agent_request.session_id
    )


@router.post("/request")
async def request_agent_response(
    agent_name: str = Form(...),
    message: str = Form(...),
    user_id: str = Form(...),
    session_id: str = Form(...),
    audio: Optional[UploadFile] = File(None),
    agent_request_service: AgentRequestService = Depends(get_agent_service_request),
) -> JSONResponse:
    if audio:
        audio_content = await audio.read()
        transcript = await speech_to_text_service.transcribe_audio(audio_content)

        if transcript:
            message = transcript

    print(f"Requesting agent response for agent {agent_name}")
    response = await agent_request_service.request_agent_response(
        agent_name,
        user_id,
        session_id,
        message,
    )

    audio_content = await text_to_speech_service.text_to_speech(
        response.agent_response_text
    )

    print("Sending back Agent Response")
    return JSONResponse(
        content={
            "text": response.agent_response_text,
            "audio": base64.b64encode(audio_content).decode("utf-8")
            if audio_content
            else None,
            "markdown_text": response.markdown_text,
            "author": response.author,
        }
    )


@router.get("/conversation/{user_id}/{session_id}")
async def get_conversation_content(
    user_id: str,
    session_id: str,
) -> Conversation:
    print(f"Getting conversation content for user {user_id} and session {session_id}")
    session_service = SessionService()
    return await session_service.get_session_content(user_id, session_id)


@router.post("/feedback")
async def request_feedback(
    agent_request: AgentRequest,
    agent_request_service: AgentRequestService = Depends(get_agent_service_request),
):
    print(f"Requesting feedback for session {agent_request.session_id}")
    return await agent_request_service.request_agent_response(
        agent_request.agent_name,
        agent_request.user_id,
        agent_request.session_id,
        agent_request.message,
    )


@router.websocket("/ws/{user_id}/{session_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    user_id: int,
    is_audio: str,
    agent_service_streaming: AgentServiceStreaming = Depends(
        get_agent_service_streaming
    ),
):
    """Client websocket endpoint"""
    # Wait for client connection
    await websocket.accept()
    print(f"Client #{user_id} connected, audio mode: {is_audio}")

    # Start tasks
    agent_to_client_task = asyncio.create_task(
        agent_service_streaming.agent_to_client_messaging(websocket)
    )
    client_to_agent_task = asyncio.create_task(
        agent_service_streaming.client_to_agent_messaging(websocket)
    )

    # Wait until the websocket is disconnected or an error occurs
    tasks = [agent_to_client_task, client_to_agent_task]
    await asyncio.wait(tasks, return_when=asyncio.FIRST_EXCEPTION)

    # Close LiveRequestQueue
    agent_service_streaming.live_request_queue.close()

    # Disconnected
    print(f"Client #{user_id} disconnected")
