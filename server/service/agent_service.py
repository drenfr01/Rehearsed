import os

from google.adk.agents import Agent, LiveRequestQueue
from google.adk.agents.run_config import RunConfig
from google.adk.runners import Runner
from google.adk.sessions import Session
from google.adk.sessions.database_session_service import DatabaseSessionService

from server.dependencies.database import engine
from server.service.scenario_service import ScenarioService
from sqlmodel import select, Session

from server.models.agent_model import AgentPydantic, SubAgentLink


class AgentService:
    def __init__(self, scenario_service: ScenarioService):
        self.app_name = os.getenv("APP_NAME", "Time to Teach")
        # self.session_service = InMemorySessionService()
        db_url = os.getenv("DB_URL")
        self.session_service = DatabaseSessionService(db_url=db_url)
        self.runner = None
        self.live_events = None
        self.live_request_queue = None
        self.scenario_service = scenario_service
        self.root_agent = self.load_root_agent()

    def get_root_agent_by_scenario_id(
        self, scenario_id: int
    ) -> tuple[AgentPydantic, Agent]:
        with Session(engine) as session:
            statement = select(AgentPydantic).where(
                AgentPydantic.scenario_id == scenario_id,
                AgentPydantic.name == "root_agent",
            )
            agent_pydantic = session.exec(statement).one()
            return agent_pydantic, Agent(
                name=agent_pydantic.name,
                description=agent_pydantic.description,
                instruction=agent_pydantic.instruction,
                model=agent_pydantic.model,
            )

    def get_agents(self, agents: list[int]) -> list[Agent]:
        with Session(engine) as session:
            statement = select(AgentPydantic).where(AgentPydantic.id.in_(agents))
            agents_pydantic = session.exec(statement).all()
            agents = []
            for agent_pydantic in agents_pydantic:
                agents.append(
                    Agent(
                        name=agent_pydantic.name,
                        description=agent_pydantic.description,
                        instruction=agent_pydantic.instruction,
                        model=agent_pydantic.model,
                    )
                )
            return agents

    def get_sub_agent_ids(self, root_agent_id: int) -> list[int]:
        with Session(engine) as session:
            statement = select(SubAgentLink).where(
                SubAgentLink.root_agent_id == root_agent_id
            )
            sub_agent_links = session.exec(statement).all()
            return [link.sub_agent_id for link in sub_agent_links]

    def load_root_agent(self) -> Agent:
        print(f"Loading root agent for scenario {self.scenario_service.scenario.id}")
        agent_pydantic, root_agent = self.get_root_agent_by_scenario_id(
            self.scenario_service.scenario.id
        )
        print(f"Root agent: {root_agent.name}")
        sub_agent_ids = self.get_sub_agent_ids(agent_pydantic.id)
        sub_agents = self.get_agents(sub_agent_ids)
        print(f"Sub agents: {[agent.name for agent in sub_agents]}")
        return Agent(
            name=root_agent.name,
            description=root_agent.description,
            instruction=root_agent.instruction,
            model=root_agent.model,
            sub_agents=sub_agents,
        )

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
