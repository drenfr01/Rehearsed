import base64
import json
import os

from fastapi import WebSocket
from google.adk.agents import LiveRequestQueue
from google.adk.agents.run_config import RunConfig
from google.adk.runners import InMemoryRunner
from google.genai.types import Blob, Content, Part

from server.service.agent_service import AgentService
from server.service.session_service import SessionService


class AgentServiceStreaming:
    def __init__(self, agent_service: AgentService):
        self.agent_service = agent_service
        self.session_service = SessionService()
        self.app_name = os.getenv("APP_NAME", "Rehearsed")

        self.runner = None
        self.live_request_queue = None
        self.live_events = None

    async def start_agent_session(
        self,
        user_id: str,
        session_id: str,
        root_agent_name: str,
        is_audio: bool = False,
    ) -> None:
        """Starts an agent session

        Args:
            user_id: The user ID
            session_id: The session ID
            root_agent_name: The name of the root agent
            is_audio: Whether the session is audio
        """

        session = await self.session_service.get_or_create_session(user_id, session_id)

        root_agent = self.agent_service.lookup_agent(root_agent_name).agent
        if not root_agent:
            raise ValueError(f"Root agent {root_agent_name} not found")

        print(f"Root agent: {root_agent.name}")

        self.runner = InMemoryRunner(
            app_name=self.app_name,
            agent=root_agent,
        )

        # Set response modality
        modality = "AUDIO" if is_audio else "TEXT"
        run_config = RunConfig(response_modalities=[modality])

        # Create a LiveRequestQueue for this session
        self.live_request_queue = LiveRequestQueue()

        # Start agent session
        self.live_events = self.runner.run_live(
            session=session,
            live_request_queue=self.live_request_queue,
            run_config=run_config,
        )

    async def agent_to_client_messaging(self, websocket: WebSocket):
        """Agent to client communication"""
        while True:
            async for event in self.live_events:
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

                # If it's text and a parial text, send it
                if part.text and event.partial:
                    message = {"mime_type": "text/plain", "data": part.text}
                    await websocket.send_text(json.dumps(message))
                    print(f"[AGENT TO CLIENT]: text/plain: {message}")

    async def client_to_agent_messaging(self, websocket: WebSocket):
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
                self.live_request_queue.send_content(content=content)
                print(f"[CLIENT TO AGENT]: {data}")
            elif mime_type == "audio/pcm":
                # Send an audio data
                decoded_data = base64.b64decode(data)
                self.live_request_queue.send_realtime(
                    Blob(data=decoded_data, mime_type=mime_type)
                )
            else:
                raise ValueError(f"Mime type not supported: {mime_type}")
