import os
import json
import asyncio
from typing import AsyncGenerator

from google.genai.types import (
    Part,
    Content,
)

from google.adk.runners import Runner
from google.adk.agents import LiveRequestQueue
from google.adk.agents.run_config import RunConfig
from google.adk.sessions.in_memory_session_service import InMemorySessionService


from server.agents.agent import root_agent, call_agent_async


class AgentService:
    def __init__(self):
        self.app_name = os.getenv("APP_NAME", "Time to Teach")
        self.session_service = InMemorySessionService()

    # TODO: make return type a Pydantic model
    def start_agent_session(
        self, user_id: str, session_id: str
    ) -> tuple[Runner, AsyncGenerator, LiveRequestQueue]:
        """Starts an agent session"""

        # Create a Session
        # TODO: pass in a real user_id
        # TODO: can pass in initial state here
        session = self.session_service.create_session(
            app_name=self.app_name,
            user_id=user_id,
            session_id=session_id,
        )

        # Create a Runner
        runner = Runner(
            app_name=self.app_name,
            agent=root_agent,
            session_service=self.session_service,
        )

        # Set response modality = TEXT
        run_config = RunConfig(response_modalities=["TEXT"])

        # Create a LiveRequestQueue for this session
        live_request_queue = LiveRequestQueue()

        # Start agent session
        live_events = runner.run_live(
            session=session,
            live_request_queue=live_request_queue,
            run_config=run_config,
        )
        return runner, live_events, live_request_queue

    async def request_agent_response(
        self, runner: Runner, user_id: str, session_id: str, message: str
    ):
        print(f"Requesting agent response for session {session_id}")
        return await call_agent_async(message, runner, user_id, session_id)

    @staticmethod
    async def agent_to_client_messaging(websocket, live_events):
        """Agent to client communication"""
        while True:
            async for event in live_events:
                # turn_complete
                if event.turn_complete:
                    await websocket.send_text(json.dumps({"turn_complete": True}))
                    print("[TURN COMPLETE]")

                if event.interrupted:
                    await websocket.send_text(json.dumps({"interrupted": True}))
                    print("[INTERRUPTED]")

                # Read the Content and its first Part
                part: Part = (
                    event.content and event.content.parts and event.content.parts[0]
                )
                if not part or not event.partial:
                    continue

                # Get the text
                text = (
                    event.content
                    and event.content.parts
                    and event.content.parts[0].text
                )
                if not text:
                    continue

                # Send the text to the client
                await websocket.send_text(json.dumps({"message": text}))
                print(f"[AGENT TO CLIENT]: {text}")
                await asyncio.sleep(0)

    @staticmethod
    async def client_to_agent_messaging(websocket, live_request_queue):
        """Client to agent communication"""
        while True:
            text = await websocket.receive_text()
            content = Content(role="user", parts=[Part.from_text(text=text)])
            live_request_queue.send_content(content=content)
            print(f"[CLIENT TO AGENT]: {text}")
            await asyncio.sleep(0)
