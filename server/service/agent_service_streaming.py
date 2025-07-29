import base64
import json
import os

from fastapi import WebSocket, WebSocketDisconnect
from google.adk.agents import LiveRequestQueue
from google.adk.agents.run_config import RunConfig
from google.adk.runners import InMemoryRunner
from google.genai.types import (
    Blob,
    Content,
    Part,
    SpeechConfig,
    VoiceConfig,
    PrebuiltVoiceConfig,
)

from server.service.agent_service import AgentService
from server.service.session_service import SessionService


class AgentServiceStreaming:
    def __init__(self, agent_service: AgentService):
        self.agent_service = agent_service
        self.session_service = SessionService()
        self.app_name = os.getenv("APP_NAME", "Rehearsed")

    async def start_agent_session(
        self,
        user_id: str,
        session_id: str,
        root_agent_name: str,
        is_audio: bool = False,
    ):
        """Starts an agent session

        Args:
            user_id: The user ID
            session_id: The session ID
            root_agent_name: The name of the root agent
            is_audio: Whether the session is audio
        """

        # session = await self.session_service.get_or_create_session(user_id, session_id)

        in_memory_agent = self.agent_service.lookup_agent(root_agent_name)
        if not in_memory_agent:
            raise ValueError(f"Root agent {root_agent_name} not found")

        root_agent = in_memory_agent.agent
        pydantic_agent = in_memory_agent.agent_pydantic
        print(f"Root agent: {root_agent.name}")

        runner = InMemoryRunner(
            app_name=self.app_name,
            agent=root_agent,
        )

        # Set response modality
        modality = "AUDIO" if is_audio else "TEXT"
        run_config = RunConfig(
            response_modalities=[modality],
            speech_config=SpeechConfig(
                voice_config=VoiceConfig(
                    prebuilt_voice_config=PrebuiltVoiceConfig(
                        voice_name=pydantic_agent.voice_name,
                    )
                ),
            ),
        )

        # Create a LiveRequestQueue for this session
        live_request_queue = LiveRequestQueue()

        # Create a Session
        session = await runner.session_service.create_session(
            app_name=self.app_name,
            user_id=user_id,
        )

        # Start agent session
        live_events = runner.run_live(
            session=session,
            live_request_queue=live_request_queue,
            run_config=run_config,
        )
        print("Agent session started with live_events", live_events)

        return live_events, live_request_queue

    async def agent_to_client_messaging(self, websocket: WebSocket, live_events):
        """Agent to client communication"""
        try:
            print("Starting agent to client messaging")
            while True:
                print("Waiting for event")
                async for event in live_events:
                    print(f"Received event: {event}")
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
                    is_audio = (
                        part.inline_data
                        and part.inline_data.mime_type.startswith("audio/pcm")
                    )
                    if is_audio:
                        audio_data = part.inline_data and part.inline_data.data
                        if audio_data:
                            message = {
                                "mime_type": "audio/pcm",
                                "data": base64.b64encode(audio_data).decode("ascii"),
                            }
                            await websocket.send_text(json.dumps(message))
                            print(
                                f"[AGENT TO CLIENT]: audio/pcm: {len(audio_data)} bytes."
                            )
                            continue

                    # If it's text and a partial text, send it
                    if part.text and event.partial:
                        message = {"mime_type": "text/plain", "data": part.text}
                        await websocket.send_text(json.dumps(message))
                        print(f"[AGENT TO CLIENT]: text/plain: {message}")
        except WebSocketDisconnect:
            print("WebSocket client disconnected during agent messaging")
            # Don't re-raise, just return gracefully
            return
        except Exception as e:
            print(f"Error in agent_to_client_messaging: {e}")
            # Re-raise to be handled by the main WebSocket handler
            raise

    async def client_to_agent_messaging(self, websocket: WebSocket, live_request_queue):
        """Client to agent communication"""
        try:
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
        except WebSocketDisconnect:
            print("WebSocket client disconnected")
            # Don't re-raise, just return gracefully
            return
        except json.JSONDecodeError as e:
            print(f"Invalid JSON received from client: {e}")
            # Send error message back to client
            try:
                await websocket.send_text(json.dumps({"error": "Invalid JSON format"}))
            except:
                pass
        except Exception as e:
            print(f"Error in client_to_agent_messaging: {e}")
            # Send error message back to client
            try:
                await websocket.send_text(
                    json.dumps({"error": "Internal server error"})
                )
            except:
                pass
