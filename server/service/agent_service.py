import os
import importlib
from google.adk.tools import FunctionTool
from google.adk.agents import Agent, LiveRequestQueue, SequentialAgent
from google.adk.agents.run_config import RunConfig
from google.adk.runners import Runner
from google.adk.sessions import Session
from google.adk.sessions.database_session_service import DatabaseSessionService
from sqlmodel import select

from server.dependencies.database import engine, get_session
from server.models.agent_model import AgentPydantic, SubAgentLink, ADKType
from server.service.scenario_service import ScenarioService

from google.adk.artifacts import InMemoryArtifactService

from enum import Enum


class AgentType(Enum):
    ROOT = "root"
    FEEDBACK = "feedback"


PATH_TO_TOOLS = "server.tools"


class AgentService:
    def __init__(
        self, scenario_service: ScenarioService, agent_type: AgentType = AgentType.ROOT
    ):
        self.app_name = os.getenv("APP_NAME", "Time to Teach")
        # self.session_service = InMemorySessionService()
        db_url = os.getenv("DB_PATH")
        self.session_service = DatabaseSessionService(db_url=f"sqlite:///{db_url}")
        self.runner = None
        self.live_events = None
        self.live_request_queue = None
        self.scenario_service = scenario_service

        if agent_type == AgentType.ROOT:
            self.agent_pydantic, self.root_agent = self.load_root_agent()
        elif agent_type == AgentType.FEEDBACK:
            self.agent_pydantic, self.feedback_agent = self.load_feedback_agent()

    def get_feedback_agent_by_scenario_id(
        self, scenario_id: int
    ) -> tuple[AgentPydantic, Agent]:
        session = next(get_session())
        # TODO: replace below feedack_agent with ENV variable
        statement = select(AgentPydantic).where(
            AgentPydantic.scenario_id == scenario_id,
            AgentPydantic.name == "feedback_agent",
        )
        agent_pydantic = session.exec(statement).one()
        return agent_pydantic, Agent(
            name=agent_pydantic.name,
            description=agent_pydantic.description,
            instruction=agent_pydantic.instruction,
            model=agent_pydantic.model,
        )

    def get_root_agent_by_scenario_id(
        self, scenario_id: int
    ) -> tuple[AgentPydantic, Agent]:
        session = next(get_session())
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

    def load_tools(self, agent_pydantic: AgentPydantic) -> list[FunctionTool] | list:
        tools = []
        active_tool_names = [
            t.strip() for t in agent_pydantic.tools.split(",") if t.strip()
        ]
        active_module_names = [
            m.strip() for m in agent_pydantic.modules.split(",") if m.strip()
        ]
        if active_tool_names and active_module_names:
            for tool, module in zip(active_tool_names, active_module_names):
                module_path = importlib.import_module(f"{PATH_TO_TOOLS}.{module}")
                function = getattr(module_path, tool)
                tools.append(FunctionTool(func=function))

        return tools

    # TODO: make a pydnantic modle to hold agent pydantic and agent
    def get_agent(self, agent_name: str) -> tuple[AgentPydantic, Agent]:
        """
        Get an agent by name

        Args:
            agent_name: The name of the agent to get

        Returns:
            The agent pydantic object and Agent object
        """
        session = next(get_session())
        statement = select(AgentPydantic).where(AgentPydantic.name == agent_name)
        agent_pydantic = session.exec(statement).one()
        return agent_pydantic, Agent(
            name=agent_pydantic.name,
            description=agent_pydantic.description,
            instruction=agent_pydantic.instruction,
            model=agent_pydantic.model,
        )

    def get_agents(self, agent_ids: list[int]) -> list[Agent]:
        session = next(get_session())
        statement = select(AgentPydantic).where(AgentPydantic.id.in_(agent_ids))
        agents_pydantic = session.exec(statement).all()
        agents = []
        for agent_pydantic in agents_pydantic:
            tools = []
            if agent_pydantic.tools:
                tools = self.load_tools(agent_pydantic)
                print(f"Tools: {tools}")

            sub_agents = []
            if self.get_sub_agent_ids(agent_pydantic.id):
                sub_agent_ids = [
                    int(id) for id in agent_pydantic.sub_agent_ids.split(",")
                ]
                sub_agents = self.get_agents(sub_agent_ids)
                print(
                    f"Found additional subagents: {[agent.name for agent in sub_agents]}"
                )
            if agent_pydantic.adk_type == ADKType.LLM.value:
                agents.append(
                    Agent(
                        name=agent_pydantic.name,
                        description=agent_pydantic.description,
                        instruction=agent_pydantic.instruction,
                        model=agent_pydantic.model,
                        sub_agents=sub_agents,
                        tools=tools,
                    )
                )
            elif agent_pydantic.adk_type == ADKType.SEQUENTIAL.value:
                agents.append(
                    SequentialAgent(
                        name=agent_pydantic.name,
                        description=agent_pydantic.description,
                        sub_agents=sub_agents,
                    )
                )
            else:
                raise ValueError(f"Invalid ADK type: {agent_pydantic.adk_type}")
        return agents

    def get_sub_agent_ids(self, root_agent_id: int) -> list[int]:
        session = next(get_session())
        statement = select(SubAgentLink).where(
            SubAgentLink.root_agent_id == root_agent_id
        )
        sub_agent_links = session.exec(statement).all()
        return [link.sub_agent_id for link in sub_agent_links]

    def load_root_agent(self) -> tuple[AgentPydantic, Agent]:
        """
        Loads the root agent for the scenario

        Returns:
            The agent pydantic object and Agent object
        """
        print(f"Loading root agent for scenario {self.scenario_service.scenario.id}")
        session = next(get_session())
        statement = select(AgentPydantic).where(
            AgentPydantic.scenario_id == self.scenario_service.scenario.id,
            AgentPydantic.name == "root_agent",
        )
        agent_pydantic = session.exec(statement).one()
        print(f"Root agent: {agent_pydantic.name}")
        sub_agent_ids = self.get_sub_agent_ids(agent_pydantic.id)
        print(f"Sub agents Ids: {sub_agent_ids}")
        sub_agents = self.get_agents(sub_agent_ids)
        print(f"Sub agents: {[agent.name for agent in sub_agents]}")
        return agent_pydantic, Agent(
            name=agent_pydantic.name,
            description=agent_pydantic.description,
            instruction=agent_pydantic.instruction,
            model=agent_pydantic.model,
            sub_agents=sub_agents,
        )

    def load_feedback_agent(self) -> tuple[AgentPydantic, Agent]:
        """
        Loads the feedback agent for the scenario

        Returns:
            The agent pydantic object and Agent object
        """
        print(
            f"Loading feedback agent for scenario {self.scenario_service.scenario.id}"
        )
        agent_pydantic, feedback_agent = self.get_feedback_agent_by_scenario_id(
            self.scenario_service.scenario.id
        )
        print(f"Feedback agent: {feedback_agent.name}")
        return agent_pydantic, Agent(
            name=feedback_agent.name,
            description=feedback_agent.description,
            instruction=feedback_agent.instruction,
            model=feedback_agent.model,
        )

    async def get_or_create_session(self, user_id: str, session_id: str) -> Session:
        session = await self.session_service.get_session(
            app_name=self.app_name, user_id=user_id, session_id=session_id
        )
        if session is None:
            print(f"Creating session for user {user_id} and session {session_id}")
            session = await self.session_service.create_session(
                app_name=self.app_name,
                user_id=user_id,
                session_id=session_id,
            )
        return session

    async def initialize_agent(
        self,
        user_id: str,
        session_id: str,
    ) -> None:
        """Starts an agent session"""

        # TODO: can pass in initial state here
        session = await self.get_or_create_session(user_id, session_id)

        # Create a Runner
        self.runner = Runner(
            app_name=self.app_name,
            agent=self.root_agent,
            session_service=self.session_service,
            artifact_service=InMemoryArtifactService(),
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
