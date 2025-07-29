import asyncio
import base64
import json
from typing import Optional

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    Request,
    UploadFile,
    WebSocket,
)
from fastapi.responses import JSONResponse
from google.adk.agents import Agent, LiveRequestQueue
from google.adk.agents.run_config import RunConfig
from google.adk.runners import InMemoryRunner
from google.adk.tools import google_search  # Import the tool
from google.genai.types import (
    Blob,
    Content,
    Part,
)
from pydantic import BaseModel

from server.models.agent_interface import Conversation
from server.service.agent_service_streaming import AgentServiceStreaming
from server.service.agent_request_service import AgentRequestService
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

APP_NAME = "Time To Teach"


async def get_agent_service_request(request: Request) -> AgentRequestService:
    return AgentRequestService(
        agent_service=request.app.state.agent_service,
    )


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


async def start_agent_session(user_id, is_audio=False):
    """Starts an agent session"""

    root_agent = Agent(
        # A unique name for the agent.
        name="google_search_agent",
        # The Large Language Model (LLM) that agent will use.
        model="gemini-2.0-flash-live-001",  # This model supports audio generation
        # model="gemini-2.0-flash-exp",  # fallback
        # A short description of the agent's purpose.
        description="Agent to answer questions using Google Search.",
        # Instructions to set the agent's behavior.
        instruction="Answer the question using the Google Search tool.",
        # Add google_search tool to perform grounding with Google search.
        tools=[google_search],
    )

    # Create a Runner
    runner = InMemoryRunner(
        app_name=APP_NAME,
        agent=root_agent,
    )

    # Create a Session
    session = await runner.session_service.create_session(
        app_name=APP_NAME,
        user_id=user_id,  # Replace with actual user ID
    )

    # Set response modality
    modality = "AUDIO" if is_audio else "TEXT"
    run_config = RunConfig(response_modalities=[modality])
    print(f"Agent session started with modality: {modality}")

    # Create a LiveRequestQueue for this session
    live_request_queue = LiveRequestQueue()

    # Start agent session
    live_events = runner.run_live(
        session=session,
        live_request_queue=live_request_queue,
        run_config=run_config,
    )
    return live_events, live_request_queue


async def agent_to_client_messaging(websocket, live_events):
    """Agent to client communication"""
    while True:
        async for event in live_events:
            print(f"[AGENT EVENT]: {event}")
            # If the turn complete or interrupted, send it
            if event.turn_complete or event.interrupted:
                message = {
                    "turn_complete": event.turn_complete,
                    "interrupted": event.interrupted,
                }
                await websocket.send_text(json.dumps(message))
                print(f"[AGENT TO CLIENT]: {message}")
                continue

            # Read the Content and its first Part
            part: Part = (
                event.content and event.content.parts and event.content.parts[0]
            )
            if not part:
                continue

            # If it's audio, send Base64 encoded audio data
            is_audio = part.inline_data and part.inline_data.mime_type.startswith(
                "audio/pcm"
            )
            if is_audio:
                audio_data = part.inline_data and part.inline_data.data
                if audio_data:
                    message = {
                        "mime_type": "audio/pcm",
                        "data": base64.b64encode(audio_data).decode("ascii"),
                    }
                    await websocket.send_text(json.dumps(message))
                    print(f"[AGENT TO CLIENT]: audio/pcm: {len(audio_data)} bytes.")
                    continue
            else:
                print(
                    f"[AGENT TO CLIENT]: Non-audio part - mime_type: {part.inline_data.mime_type if part.inline_data else 'None'}"
                )

            # If it's text and a parial text, send it
            if part.text and event.partial:
                message = {"mime_type": "text/plain", "data": part.text}
                await websocket.send_text(json.dumps(message))
                print(f"[AGENT TO CLIENT]: text/plain: {message}")


async def client_to_agent_messaging(websocket, live_request_queue):
    """Client to agent communication"""
    while True:
        # Decode JSON message
        message_json = await websocket.receive_text()
        message = json.loads(message_json)
        mime_type = message["mime_type"]
        data = message["data"]

        # Send the message to the agent
        if mime_type == "text/plain":
            # Send a text message
            content = Content(role="user", parts=[Part.from_text(text=data)])
            live_request_queue.send_content(content=content)
            print(f"[CLIENT TO AGENT]: {data}")
        elif mime_type == "audio/pcm":
            # Send an audio data
            decoded_data = base64.b64decode(data)
            live_request_queue.send_realtime(
                Blob(data=decoded_data, mime_type=mime_type)
            )
        else:
            raise ValueError(f"Mime type not supported: {mime_type}")


#


async def get_agent_service_streaming() -> AgentServiceStreaming:
    return AgentServiceStreaming()


@router.websocket("/ws/{user_id}/{session_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    user_id: str,
    session_id: str,
    is_audio: str = "false",
):
    """Client websocket endpoint"""
    agent_service_streaming = AgentServiceStreaming(
        agent_service=websocket.app.state.agent_service,
    )
    # Wait for client connection
    await websocket.accept()
    print(f"Client #{session_id} connected")

    # # Start agent session
    live_events, live_request_queue = await agent_service_streaming.start_agent_session(
        user_id, session_id, "streaming_student_agent", is_audio
    )

    # Start agent to client messaging
    agent_to_client_task = asyncio.create_task(
        agent_service_streaming.agent_to_client_messaging(websocket, live_events)
    )

    # Start client to agent messaging
    client_to_agent_task = asyncio.create_task(
        agent_service_streaming.client_to_agent_messaging(websocket, live_request_queue)
    )

    # Wait for both tasks to complete
    await asyncio.gather(agent_to_client_task, client_to_agent_task)

    print(f"Client #{session_id} disconnected")
