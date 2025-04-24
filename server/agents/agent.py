import asyncio
from google.adk.agents import Agent
from google.adk.sessions import InMemorySessionService
from google.adk.runners import Runner
from google.genai import types

from yaml import safe_load

ROOT_AGENT_MODEL = "gemini-2.5-pro-exp-03-25"
STUDENT_AGENT_MODEL = "gemini-2.5-flash-preview-04-17"
FEEDBACK_AGENT_MODEL = "gemini-2.5-pro-exp-03-25"

# TODO: delete this and change it because it was in Github
GEMINI_API_KEY = "AIzaSyD17WtpBvb5JXbtfl_jdlaoKDaJWGh8dDk"
# Has to be here because the ADK CLI needs to find it


def load_student_agents(file_path: str = "agents/student_agents.yaml") -> list[Agent]:
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
def load_feedback_agent(file_path: str = "agents/feedback_agent.yaml") -> list[Agent]:
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


def load_root_agent(file_path: str = "agents/root_agent.yaml") -> Agent:
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


root_agent = load_root_agent()


async def call_agent_async(query: str, runner: Runner, user_id: str, session_id: str):
    """Sends a query to the agent and prints the final response."""
    print(f"\n>>> User Query: {query}")

    # Prepare the user's message in ADK format
    content = types.Content(role="user", parts=[types.Part(text=query)])

    final_response_text = "Agent did not produce a final response."  # Default

    # Key Concept: run_async executes the agent logic and yields Events.
    # We iterate through events to find the final answer.
    async for event in runner.run_async(
        user_id=user_id, session_id=session_id, new_message=content
    ):
        # You can uncomment the line below to see *all* events during execution
        # print(f"  [Event] Author: {event.author}, Type: {type(event).__name__}, Final: {event.is_final_response()}, Content: {event.content}")

        # Key Concept: is_final_response() marks the concluding message for the turn.
        if event.is_final_response():
            if event.content and event.content.parts:
                # Assuming text response in the first part
                final_response_text = event.content.parts[0].text
            elif (
                event.actions and event.actions.escalate
            ):  # Handle potential errors/escalations
                final_response_text = (
                    f"Agent escalated: {event.error_message or 'No specific message.'}"
                )
            # Add more checks here if needed (e.g., specific error codes)
            break  # Stop processing events once the final response is found

    print(f"<<< Agent Response: {final_response_text}")


async def run_team_conversation():
    print("\n--- Testing Agent Team Delegation ---")
    # InMemorySessionService is simple, non-persistent storage for this tutorial.
    session_service = InMemorySessionService()

    # Define constants for identifying the interaction context
    APP_NAME = "initial_tutorial_agent"
    USER_ID = "user_1_agent_team"
    SESSION_ID = "session_001_agent_team"  # Using a fixed ID for simplicity

    # Create the specific session where the conversation will happen
    _ = session_service.create_session(
        app_name=APP_NAME, user_id=USER_ID, session_id=SESSION_ID
    )
    print(
        f"Session created: App='{APP_NAME}', User='{USER_ID}', Session='{SESSION_ID}'"
    )

    # --- Get the actual root agent object ---
    # Use the determined variable name

    # Create a runner specific to this agent team test
    print(f"Root agent: {root_agent}")
    runner_agent_team = Runner(
        agent=root_agent,  # Use the root agent object
        app_name=APP_NAME,  # Use the specific app name
        session_service=session_service,  # Use the specific session service
    )
    # Corrected print statement to show the actual root agent's name
    print(f"Runner created for agent '{root_agent.name}'.")

    # Always interact via the root agent's runner, passing the correct IDs
    await call_agent_async(
        query="Hello there!",
        runner=runner_agent_team,
        user_id=USER_ID,
        session_id=SESSION_ID,
    )
    await call_agent_async(
        query="What is the weather in New York?",
        runner=runner_agent_team,
        user_id=USER_ID,
        session_id=SESSION_ID,
    )
    await call_agent_async(
        query="Thanks, bye!",
        runner=runner_agent_team,
        user_id=USER_ID,
        session_id=SESSION_ID,
    )


def main():
    print("Starting main")
    asyncio.run(run_team_conversation())
