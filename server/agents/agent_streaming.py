from google.adk.agents import Agent
from yaml import safe_load

# Streaming not yet supported for 2.5 models, defaulting to models used for
# adk web and HTTP commands
ROOT_AGENT_MODEL = "gemini-2.0-flash-exp"
STUDENT_AGENT_MODEL = "gemini-2.0-flash-exp"
FEEDBACK_AGENT_MODEL = "gemini-2.0-flash-exp"

# TODO: delete this and change it because it was in Github
GEMINI_API_KEY = "AIzaSyD17WtpBvb5JXbtfl_jdlaoKDaJWGh8dDk"
# Has to be here because the ADK CLI needs to find it


def load_student_agents(file_path: str = "orm/student_agents.yaml") -> list[Agent]:
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


# TODO: make this a deterministically run agent with appropriate session
def load_feedback_agent(file_path: str = "orm/feedback_agent.yaml") -> list[Agent]:
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


def load_root_agent(file_path: str = "orm/root_agent.yaml") -> Agent:
    print(f"Loading root agent from {file_path}")
    with open(file_path, "r") as f:
        root_agent_yaml = safe_load(f)

    return Agent(
        model=ROOT_AGENT_MODEL,
        name=root_agent_yaml["name"],
        instruction=root_agent_yaml["instruction"],
        description=root_agent_yaml["description"],
        sub_agents=load_student_agents() + load_feedback_agent(),
    )


streaming_root_agent = load_root_agent()
