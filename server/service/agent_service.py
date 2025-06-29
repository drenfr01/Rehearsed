import importlib
import os

from google.adk.agents import Agent, ParallelAgent, SequentialAgent
from google.adk.tools import FunctionTool
from sqlmodel import select

from server.dependencies.database import get_session
from server.models.agent_model import (
    ADKType,
    AgentPydantic,
    InMemoryAgent,
)
from server.service.scenario_service import ScenarioService

PATH_TO_TOOLS = "server.tools"


class AgentService:
    def __init__(self, scenario_service: ScenarioService):
        self.app_name = os.getenv("APP_NAME", "Rehearsed")
        self.runner = None
        self.live_events = None
        self.live_request_queue = None
        self.scenario_service = scenario_service

        self.in_memory_agent_lookup: dict[str, InMemoryAgent] = (
            self.get_agents_from_database()
        )

    def get_agents_from_database(
        self, load_tools: bool = True
    ) -> dict[str, InMemoryAgent]:
        """Loads all agents in the database into memory with all of their sub agents.

        First it loads all the agent pydantic objects from the database into memory.
        Then it uses those pydantic objects to initialize the Agents objects and store them.

        Note: This method is public because we want to reload the agents upon an Admin making any changes to the DB

        Args:
            load_tools: Whether to load the tools for the agent

        Returns:
            A dict of InMemoryAgents indexed by their name
        """
        # TODO: move this to ORM layer?
        session = next(get_session())
        statement = select(AgentPydantic).where(
            AgentPydantic.scenario_id == self.scenario_service.scenario.id
        )
        agents_pydantic = session.exec(statement).all()

        # Note: it might be more memory efficient to do this all in one pass,
        # but I didn't want to modify objects I'm iterating over for simplicity
        agent_pydantic_lookup: dict[int, AgentPydantic] = {}
        for agent_pydantic in agents_pydantic:
            agent_pydantic_lookup[agent_pydantic.id] = agent_pydantic

        in_memory_agent_lookup: dict[int, InMemoryAgent] = {}
        for agent_id, agent_pydantic in agent_pydantic_lookup.items():
            in_memory_agent_lookup[agent_pydantic.name] = InMemoryAgent(
                agent_pydantic=agent_pydantic,
                agent=self._load_root_agent(
                    agent_id, agent_pydantic_lookup, load_tools=load_tools
                ),
            )
        return in_memory_agent_lookup

    def list_available_agents(self) -> list[str]:
        """Returns a list of available agents loaded into memory"""
        return [agent_name for agent_name in self.in_memory_agent_lookup.keys()]

    def lookup_agent(self, agent_name: str) -> InMemoryAgent:
        """Returns the specified agent from the in memory agent store
        Args:
            agent_name: The name of the agent to lookup
        Returns:
            The InMemory Agent
        """
        if agent_name not in self.in_memory_agent_lookup:
            raise ValueError(f"Agent {agent_name} not found")

        return self.in_memory_agent_lookup[agent_name]

    def _load_tools(
        self, agent_pydantic: AgentPydantic
    ) -> list[FunctionTool] | list[None]:
        tools = []
        active_tool_names = [
            t.strip() for t in agent_pydantic.tools.split(",") if t.strip()
        ]
        active_module_names = [
            m.strip() for m in agent_pydantic.modules.split(",") if m.strip()
        ]
        if active_tool_names and active_module_names:
            for tool, module in zip(active_tool_names, active_module_names):
                print(
                    f"For agent {agent_pydantic.name}, loading tool: {tool} from module: {module}"
                )
                module_path = importlib.import_module(f"{PATH_TO_TOOLS}.{module}")
                function = getattr(module_path, tool)
                tools.append(FunctionTool(func=function))

        return tools

    def _build_adk_agent(
        self,
        agent_pydantic: AgentPydantic,
        sub_agents: list[Agent],
        tools: list[FunctionTool],
    ) -> Agent:
        """
        Builds an ADK agent based on the agent pydantic object

        Args:
            agent_pydantic: The agent pydantic object
            sub_agents: The sub agents of the agent
            tools: The tools of the agent

        Returns:
            The agent object
        """

        if agent_pydantic.adk_type == ADKType.LLM.value:
            return Agent(
                name=agent_pydantic.name,
                description=agent_pydantic.description,
                instruction=agent_pydantic.instruction,
                model=agent_pydantic.model,
                sub_agents=sub_agents,
                tools=tools,
            )
        elif agent_pydantic.adk_type == ADKType.SEQUENTIAL.value:
            return SequentialAgent(
                name=agent_pydantic.name,
                description=agent_pydantic.description,
                sub_agents=sub_agents,
            )
        elif agent_pydantic.adk_type == ADKType.PARALLEL.value:
            return ParallelAgent(
                name=agent_pydantic.name,
                description=agent_pydantic.description,
                sub_agents=sub_agents,
            )
        else:
            raise ValueError(f"Invalid ADK type: {agent_pydantic.adk_type}")

    def _get_agents(
        self, agent_ids: list[int], agent_pydantic_lookup: dict[int, AgentPydantic]
    ) -> list[Agent]:
        agents_pydantic = [agent_pydantic_lookup[agent_id] for agent_id in agent_ids]
        agents = []
        for agent_pydantic in agents_pydantic:
            tools = []
            if agent_pydantic.tools:
                tools = self._load_tools(agent_pydantic)

            sub_agents = []
            if agent_pydantic.sub_agent_ids:
                sub_agent_ids = [
                    int(id) for id in agent_pydantic.sub_agent_ids.split(",")
                ]
                sub_agents = self._get_agents(sub_agent_ids, agent_pydantic_lookup)
            agents.append(self._build_adk_agent(agent_pydantic, sub_agents, tools))
        return agents

    def _load_root_agent(
        self,
        agent_id: int,
        agent_pydantic_lookup: dict[int, AgentPydantic],
        load_tools: bool = True,
    ) -> Agent:
        """
        Loads the root agent for the scenario

        Args:
            agent_id: The id of the agent to load
            load_tools: Whether to load the tools for the agent

        Returns:
            The Agent object
        """
        agent_pydantic = agent_pydantic_lookup[agent_id]
        print(
            f"Loading root agent for scenario {self.scenario_service.scenario.id} with agent name {agent_pydantic.name}"
        )

        print(f"Root agent: {agent_pydantic.name}")

        if agent_pydantic.sub_agent_ids:
            sub_agent_ids = [int(id) for id in agent_pydantic.sub_agent_ids.split(",")]
            sub_agents = self._get_agents(sub_agent_ids, agent_pydantic_lookup)
        else:
            sub_agents = []

        if load_tools:
            tools = self._load_tools(agent_pydantic)
        else:
            tools = []

        return self._build_adk_agent(agent_pydantic, sub_agents, tools)
