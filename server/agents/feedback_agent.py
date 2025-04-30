from google.adk.agents import Agent
from yaml import safe_load

FEEDBACK_AGENT_MODEL = "gemini-2.5-flash-preview-04-17"
# FEEDBACK_AGENT_MODEL = "gemini-2.5-pro-exp-03-25"


def load_feedback_agent(file_path: str = "agents/feedback_agent.yaml") -> Agent:
    print(f"Loading root agent from {file_path}")
    with open(file_path, "r") as f:
        feedback_agent_yaml = safe_load(f)

    return Agent(
        model=FEEDBACK_AGENT_MODEL,
        name=feedback_agent_yaml["name"],
        instruction=feedback_agent_yaml["instruction"],
        description=feedback_agent_yaml["description"],
    )


feedback_agent = load_feedback_agent()
