from sqlmodel import Session
from yaml import safe_load

from server.dependencies.database import engine
from server.models.agent_model import AgentPydantic, Scenario, SubAgentLink
from server.models.user_model import UserInDB

FLASH_MODEL = "gemini-2.5-flash-preview-04-17"
PRO_MODEL = "gemini-2.5-pro-exp-03-25"


def initialize_scenario_data() -> list[Scenario]:
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

    return scenarios


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


def load_student_agents(
    file_path: str = "server/orm/student_agents.yaml",
) -> list[AgentPydantic]:
    print(f"Loading student agent data from {file_path}")
    with open(file_path, "r") as f:
        student_agents_yaml = safe_load(f)

    student_agents = []
    # Root agent is at index 1
    for i, student_agent in enumerate(student_agents_yaml, start=1):
        student_agents.append(
            AgentPydantic(
                id=i + 1,
                scenario_id=1,
                name=student_agent["name"],
                instruction=student_agent["instruction"],
                description=student_agent["description"],
                model=FLASH_MODEL,
            )
        )

    return student_agents


# TODO: make this a deterministically run agent with appropriate session
def load_feedback_agent(
    file_path: str = "server/orm/feedback_agent.yaml",
) -> AgentPydantic:
    print(f"Loading feedback agent data from {file_path}")
    with open(file_path, "r") as f:
        feedback_agent_yaml = safe_load(f)

    return AgentPydantic(
        id=5,
        scenario_id=1,
        name=feedback_agent_yaml["name"],
        instruction=feedback_agent_yaml["instruction"],
        description=feedback_agent_yaml["description"],
        model=PRO_MODEL,
    )


# TODO: I think I can just parameterize this with the root agent name and
# load it from the database
def load_root_agent(file_path: str = "server/orm/root_agent.yaml") -> AgentPydantic:
    print(f"Loading root agent data from {file_path}")
    with open(file_path, "r") as f:
        root_agent_yaml = safe_load(f)

    return AgentPydantic(
        id=1,
        scenario_id=1,
        name=root_agent_yaml["name"],
        instruction=root_agent_yaml["instruction"],
        description=root_agent_yaml["description"],
        model=PRO_MODEL,
    )


def initialize_sub_agent_links() -> list[SubAgentLink]:
    """Creates linkage between a root agent and the feedback agents"""
    sub_agent_links = [
        SubAgentLink(root_agent_id=1, sub_agent_id=2),
        SubAgentLink(root_agent_id=1, sub_agent_id=3),
        SubAgentLink(root_agent_id=1, sub_agent_id=4),
    ]
    return sub_agent_links


def initialize_sample_agent_data():
    with Session(engine) as session:
        session.add_all(initialize_scenario_data())
        session.commit()
        session.add_all(load_student_agents())
        session.add(load_feedback_agent())
        session.add(load_root_agent())
        session.commit()
        session.add_all(initialize_sub_agent_links())
        session.commit()


def initialize_all_sample_data():
    initialize_sample_user_data()
    initialize_sample_agent_data()
