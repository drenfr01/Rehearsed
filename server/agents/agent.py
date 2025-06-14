"""Also used for the Agent ADK CLI"""

from google.adk.agents import Agent, ParallelAgent
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
    inline_feedback: bool = False,
) -> list[Agent]:
    print(f"Loading student agents from {file_path}")
    with open(file_path, "r") as f:
        student_agents_yaml = safe_load(f)

    student_agents = []
    for student_agent in student_agents_yaml:
        student_agent = Agent(
            model=STUDENT_AGENT_MODEL,
            name=student_agent["name"],
            instruction=student_agent["instruction"],
            description=student_agent["description"],
        )
        if inline_feedback:
            student_agents.append(
                ParallelAgent(
                    name=f"{student_agent.name}_inline_feedback",
                    sub_agents=[student_agent, load_inline_feedback_agent()],
                )
            )
        else:
            student_agents.append(student_agent)

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


def load_inline_feedback_agent(
    file_path: str = "server/orm/inline_feedback_agent.yaml",
) -> Agent:
    print(f"Loading inline feedback agent from {file_path}")
    with open(file_path, "r") as f:
        inline_feedback_agent_yaml = safe_load(f)

    return Agent(
        model=FEEDBACK_AGENT_MODEL,
        name=inline_feedback_agent_yaml["name"],
        instruction=inline_feedback_agent_yaml["instruction"],
        description=inline_feedback_agent_yaml["description"],
    )


# TODO: I think I can just parameterize this with the root agent name and
# load it from the database
def load_root_agent(
    file_path: str = "server/orm/root_agent.yaml", inline_feedback: bool = True
) -> Agent:
    print(f"Loading root agent from {file_path}")
    with open(file_path, "r") as f:
        root_agent_yaml = safe_load(f)
    # Will have to load sub agents from the database using the link

    return Agent(
        model=ROOT_AGENT_MODEL,
        name=root_agent_yaml["name"],
        instruction=root_agent_yaml["instruction"],
        description=root_agent_yaml["description"],
        sub_agents=load_student_agents(inline_feedback=inline_feedback)
        + load_feedback_agent(),
    )


# Note: this has to be called root_agent for ADK CLI to work
root_agent = load_root_agent(inline_feedback=True)


async def call_agent_async(query: str, runner: Runner, user_id: str, session_id: str):
    """Sends a query to the agent and prints the final response."""
    print(f"\n>>> User Query: {query}")

    # Prepare the user's message in ADK format
    content = types.Content(role="user", parts=[types.Part(text=query)])

    final_response_text = "Agent did not produce a final response."  # Default

    print(f"Running root agent with model {ROOT_AGENT_MODEL}")

    # Key Concept: run_async executes the agent logic and yields Events.
    # We iterate through events to find the final answer.
    async for event in runner.run_async(
        user_id=user_id, session_id=session_id, new_message=content
    ):
        # You can uncomment the line below to see *all* events during execution
        # print(f"  [Event] Author: {event.author}, Type: {type(event).__name__}, Final: {event.is_final_response()}, Content: {event.content}")

        # Key Concept: is_final_response() marks the concluding message for the turn.
        if event.is_final_response():
            print(f"Event: {event}")
            print("\n")
            if event.content and event.content.parts:
                # Assuming text response in the first part
                if event.author == "inline_feedback_agent":
                    feedback_text = event.content.parts[0].text
                # Student agents
                else:
                    student_response_text = event.content.parts[0].text
            elif (
                event.actions and event.actions.escalate
            ):  # Handle potential errors/escalations
                student_response_text = (
                    f"Agent escalated: {event.error_message or 'No specific message.'}"
                )
            # Add more checks here if needed (e.g., specific error codes)
            # break  # Stop processing events once the final response is found

    print(f"<<< Student Response: {student_response_text}")
    print(f"<<< Feedback Response: {feedback_text}")
    return student_response_text, feedback_text
