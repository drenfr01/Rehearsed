"""Also used for the Agent ADK CLI"""

from google.adk.agents import Agent
from google.adk.runners import Runner
from google.genai import types
from yaml import safe_load

# Streaming not yet supported for 2.5 models, defaulting to models used for
# adk web and HTTP commands
# TODO: change to 2.5-pro-exp-03-25 or 2.5-flash-preview-04-17
# ROOT_AGENT_MODEL = "gemini-2.5-pro-exp-03-25"
ROOT_AGENT_MODEL = "gemini-2.5-pro-preview-03-25"
STUDENT_AGENT_MODEL = "gemini-2.5-pro-preview-03-25"
FEEDBACK_AGENT_MODEL = "gemini-2.5-pro-preview-03-25"


# TODO: make this load from the database
def load_student_agents(
    file_path: str = "server/orm/student_agents.yaml",
) -> list[Agent]:
    print(f"Loading student agents from {file_path}")
    with open(file_path, "r") as f:
        student_agents_yaml = safe_load(f)

    student_agents = []
    for student_agent in student_agents_yaml:
        student_agents.append(
            Agent(
                model=STUDENT_AGENT_MODEL,
                name=student_agent["name"],
                instruction=student_agent["instruction"],
                description=student_agent["description"],
            )
        )

    return student_agents


# TODO: make this load from the database
def load_feedback_agent(
    file_path: str = "server/orm/feedback_agent.yaml",
) -> list[Agent]:
    print(f"Loading feedback agent from {file_path}")
    with open(file_path, "r") as f:
        feedback_agent_yaml = safe_load(f)

    return [
        Agent(
            model=FEEDBACK_AGENT_MODEL,
            name=feedback_agent_yaml["name"],
            instruction=feedback_agent_yaml["instruction"],
            description=feedback_agent_yaml["description"],
        )
    ]


# TODO: I think I can just parameterize this with the root agent name and
# load it from the database
def load_root_agent(file_path: str = "server/orm/root_agent.yaml") -> Agent:
    print(f"Loading root agent from {file_path}")
    with open(file_path, "r") as f:
        root_agent_yaml = safe_load(f)
    # Will have to load sub agents from the database using the link

    return Agent(
        model=ROOT_AGENT_MODEL,
        name=root_agent_yaml["name"],
        instruction=root_agent_yaml["instruction"],
        description=root_agent_yaml["description"],
        sub_agents=load_student_agents() + load_feedback_agent(),
    )


# Note: this has to be called root_agent for ADK CLI to work
root_agent = load_root_agent()
