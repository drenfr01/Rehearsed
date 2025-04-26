import os
from typing import AsyncGenerator


from google.adk.runners import Runner
from google.adk.agents import LiveRequestQueue
from google.adk.agents import Agent
from google.adk.agents.run_config import RunConfig
from google.adk.sessions.in_memory_session_service import InMemorySessionService


class AgentService:
    def __init__(self):
        self.app_name = os.getenv("APP_NAME", "Time to Teach")
        self.session_service = InMemorySessionService()

    # TODO: make return type a Pydantic model
    def start_agent_session(
        self, user_id: str, session_id: str, root_agent: Agent
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
