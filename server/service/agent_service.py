import os


from google.adk.runners import Runner
from google.adk.agents import LiveRequestQueue
from google.adk.agents import Agent
from google.adk.agents.run_config import RunConfig
from google.adk.sessions.database_session_service import DatabaseSessionService
from google.adk.sessions import Session


class AgentService:
    def __init__(self, root_agent: Agent):
        self.app_name = os.getenv("APP_NAME", "Time to Teach")
        # self.session_service = InMemorySessionService()
        db_url = os.getenv("DB_URL")
        self.session_service = DatabaseSessionService(db_url=db_url)
        self.runner = None
        self.live_events = None
        self.live_request_queue = None
        self.root_agent = root_agent

    def get_or_create_session(self, user_id: str, session_id: str) -> Session:
        session = self.session_service.get_session(
            app_name=self.app_name, user_id=user_id, session_id=session_id
        )
        if session is None:
            print(f"Creating session for user {user_id} and session {session_id}")
            session = self.session_service.create_session(
                app_name=self.app_name,
                user_id=user_id,
                session_id=session_id,
            )
        return session

    def initialize_agent(
        self,
        user_id: str,
        session_id: str,
    ) -> None:
        """Starts an agent session"""

        # TODO: can pass in initial state here
        session = self.get_or_create_session(user_id, session_id)

        # Create a Runner
        self.runner = Runner(
            app_name=self.app_name,
            agent=self.root_agent,
            session_service=self.session_service,
        )

        # Set response modality = TEXT
        run_config = RunConfig(response_modalities=["TEXT"])

        # Create a LiveRequestQueue for this session
        self.live_request_queue = LiveRequestQueue()

        # Start agent session
        self.live_events = self.runner.run_live(
            session=session,
            live_request_queue=self.live_request_queue,
            run_config=run_config,
        )
