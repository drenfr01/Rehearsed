import asyncio
from google.adk.agents import Agent
from google.adk.sessions import InMemorySessionService
from google.adk.runners import Runner
from google.genai import types

MODEL = "gemini-2.5-pro-exp-03-25"

# TODO: delete this
GEMINI_API_KEY = "AIzaSyD17WtpBvb5JXbtfl_jdlaoKDaJWGh8dDk"
most_conditions_student = Agent(
    model="gemini-2.5-flash-preview-04-17",
    name="most_conditions_student",
    instruction="This student likes finding solutions to tasks that are novel. This student does not only look for the right or most efficent solution, but likes exploring multiple ways to solve a problem. This student solves the problem correctly albeit using creative approaches.",
    description="Have this student always speak first.",
)

medium_conditions_student = Agent(
    model="gemini-2.5-flash-preview-04-17",
    name="medium_conditions_student",
    instruction="This student likes finding the most efficient solution, but often lands on a solution that, while more efficient than others, is not the most efficient or the traditionally correct solution. This student solves the problem correctly albeit not finding the most traditional solution.",
    description="Have this student speak when teacher asks for a soultion that just focuses on the y-intercept.",
)

minimum_conditions_student = Agent(
    model="gemini-2.5-flash-preview-04-17",
    name="minimum_conditions_student",
    instruction="This student almost always finds the most efficient solution, and is able to explain it. They do not see the need to explore beyond what is minially viable and correct, and need explination as to why other strategies are useful.",
    description="Have this student speak when the teacher asks for the most efficient strategy.",
)

root_agent = Agent(
    model=MODEL,
    name="teacher_agent",
    instruction="Based on the information that the user provides, select the student to respond that forces the user to connect the procedural and conceptual background of the math idea"
    "You have three specialized sub-agents:"
    "1. most_conditions_student: Delegate to this student when the user asks for a broad solution."
    "2. medium_conditions_student: Delegate to this student when the user asks for someone to correct the Most Conditions, or to add an additional solution."
    "3. minimum_conditions_student: Delegate to this student when the user asks for the minimum requirements to solve this task.",
    description="Use the three specialized sub-agents to respond to the user who is acting as an 8th grade math teacher",
    sub_agents=[
        most_conditions_student,
        medium_conditions_student,
        minimum_conditions_student,
    ],
)


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
    session = session_service.create_session(
        app_name=APP_NAME, user_id=USER_ID, session_id=SESSION_ID
    )
    print(
        f"Session created: App='{APP_NAME}', User='{USER_ID}', Session='{SESSION_ID}'"
    )

    # --- Get the actual root agent object ---
    # Use the determined variable name

    # Create a runner specific to this agent team test
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
    asyncio.run(run_team_conversation())
