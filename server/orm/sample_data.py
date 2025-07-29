from sqlmodel import Session
from yaml import safe_load

from server.dependencies.database import engine
from server.models.agent_model import (
    ADKType,
    AgentPydantic,
    MediaType,
    Scenario,
    SubAgentLink,
)
from server.models.user_model import UserInDB

# TODO: move these to the .env file
PRO_MODEL = "gemini-2.5-pro"
FLASH_MODEL = "gemini-2.0-flash-exp"


def initialize_scenario_data(session: Session) -> None:
    with open("server/orm/temp_scenario_data.yaml", "r") as f:
        scenario_data_yaml = safe_load(f)

    scenarios = []
    for scenario_id, scenario_data in enumerate(scenario_data_yaml, start=1):
        scenario = Scenario(
            id=scenario_id,
            name=scenario_data["name"],
            description=scenario_data["description"],
            overview=scenario_data["overview"],
            system_instructions=scenario_data["system_instructions"],
            initial_prompt=scenario_data["initial_prompt"],
        )
        scenarios.append(scenario)

    session.add_all(scenarios)
    session.commit()


def initialize_sample_user_data() -> None:
    """
    Initialize sample user data.
    """
    with Session(engine) as session:
        user = UserInDB(
            id=1,
            username="johndoe",
            email="john@test.com",
            hashed_password="$2b$12$pCYsSI/mmqaZOoxkUSslbeFzyxlr38CTulWtGkElzld7p1xVemRYG",
            disabled=False,
            admin=False,
        )
        user2 = UserInDB(
            id=2,
            username="janedoe",
            email="jane@test.com",
            hashed_password="$2b$12$CfXveIDjm7Pvs//KSXc7m.A7mw2XViro3gmfxIbH6p8/skAx4xxea",
            disabled=False,
            admin=True,
        )
        session.add(user)
        session.add(user2)
        session.commit()


def load_agents(
    file_path: str,
    scenario_id: int = 1,
    model: str = FLASH_MODEL,
    session: Session = None,
) -> list[AgentPydantic] | AgentPydantic:
    """
    Load agent(s) from a YAML file.

    Args:
        file_path: Path to the YAML file containing agent data
        scenario_id: ID of the scenario the agent(s) belong to
        model: Model to use for the agent(s)
        session: Session to use for the agent(s)

    Returns:
        Either a single AgentPydantic object or a list of them
    """
    print(f"Loading agent data from {file_path}")
    with open(file_path, "r") as f:
        agent_data_yaml = safe_load(f)

    if isinstance(agent_data_yaml, dict):
        agent_data_yaml = [agent_data_yaml]

    agents = []
    for agent_data in agent_data_yaml:
        agent_id = int(agent_data["id"])
        agents.append(
            AgentPydantic(
                id=agent_id,
                scenario_id=scenario_id,
                name=agent_data["name"],
                instruction=agent_data["instruction"],
                description=agent_data["description"],
                model=model,
                adk_type=agent_data.get("adk_type", ADKType.LLM),
                media_type=agent_data.get("media_type", MediaType.NONE),
                tools=agent_data.get("tools", ""),
                modules=agent_data.get("modules", ""),
                sub_agent_ids=agent_data.get("sub_agent_ids", ""),
                voice_name=agent_data.get("voice_name", "Aoede"),
            )
        )
        if agent_data.get("sub_agent_ids"):
            initialize_sub_agent_links(session, agent_id, agent_data["sub_agent_ids"])

    session.add_all(agents)
    session.commit()


def initialize_sub_agent_links(
    session: Session, root_agent_id: int, sub_agent_ids: str
) -> None:
    """Creates linkage between a root agent and the feedback agents"""
    sub_agent_links = []
    if sub_agent_ids:
        for sub_agent_id in sub_agent_ids.split(","):
            sub_agent_links.append(
                SubAgentLink(root_agent_id=root_agent_id, sub_agent_id=sub_agent_id)
            )
    session.add_all(sub_agent_links)
    session.commit()


# TODO: figure out how to assign the agent IDs better
def initialize_sample_agent_data():
    with Session(engine) as session:
        initialize_scenario_data(session)
        load_agents("server/orm/student_agents.yaml", session=session)
        load_agents(
            "server/orm/inline_feedback_agent.yaml",
            model=FLASH_MODEL,
            session=session,
        )
        load_agents(
            "server/orm/root_agent.yaml",
            model=FLASH_MODEL,
            session=session,
        )
        load_agents(
            "server/orm/overall_feedback_agent.yaml",
            model=FLASH_MODEL,
            session=session,
        )
        load_agents(
            "server/orm/streaming_student_agent.yaml",
            model="gemini-2.0-flash-exp",
            session=session,
        )


def initialize_all_sample_data():
    initialize_sample_user_data()
    initialize_sample_agent_data()
