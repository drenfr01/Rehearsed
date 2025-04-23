import asyncio
from google.adk.agents import Agent
from google.adk.sessions import InMemorySessionService
from google.adk.runners import Runner
from google.genai import types


# TODO: delete this
GEMINI_API_KEY = "AIzaSyD17WtpBvb5JXbtfl_jdlaoKDaJWGh8dDk"
most_conditions_student = Agent(
    model="gemini-2.5-flash-preview-04-17",
    name="most_conditions_student",
    instruction="The student is using the slope and y-intercept of the original line to create a system with one solution. They do this by finding the opposite-reciprocal slope and leaving the y-intercept the same. The student conceptually understands that opposite-reciprocal slopes means that two linear equations will intersect exactly once due to them being perpendicular. The student also understands that having the same y-intercept means that two lines will intersect exactly once. The student may not be confident that having either the opposite-reciprocal slope or the same y-intercept ensures the system has one solution, as opposed to both. However, this might be because the task only asks for a line that does make a system with exactly one solution, which the student’s solution satisfies albeit with additional conditions. Student 1 is confident that their solution satisfies the condition of the task. When asked to explain their process, the student explains how their solution is a method that will always work. When it is brought to their attention, the student realizes that they did not have to have the specific conditions of the opposite-reciprocal slope and same y-intercept, and connects their condition of the opposite-reciprocal slope to be a subset of any slope that is not ⅖. ",
    description="Have this student speak when the user asks for a broad solution.",
)

medium_conditions_student = Agent(
    model="gemini-2.5-flash-preview-04-17",
    name="medium_conditions_student",
    instruction="The student is using a slope that is not the same as the original line, and the same y-intercept of the original line to create a system with one solution. They do this by leaving the y-intercept the same, and select two different slopes that are not the same as the original line. The student conceptually understands that two lines with the same y-intercept means that the lines have to cross at the location of the y-intercept. The student also understands that for those lines to intersect only once, at that point of the y-intercept, their slopes have to be different. The student may not be confident about the difference between two lines with the same y-intercept but different slopes as having one solution in comparison with two lines with the same y-intercept and the same or equivalent slopes as having infinite solutions. However, because the task asks for a line that does make a system with exactly one solution, the student’s proposed conditions of having the same y-intercept and different slopes meets the condition of the task.  Student 2 sees the connections between their work and that of Student 1, who says a system of linear equations with one solution must have the opposite-reciprocal slope and the same y-intercept. However, Student 2 is confident that having the opposite-reciprocal slope is an unnecessary condition that Student 1 claims is necessary. Student 2 believes a condition that will always satisfy the conditions of the task is having the same y-intercept, so that the writer of the new linear equation only needs to make the slope different from the original line without the necessity of making it the opposite-reciprocal slope.",
    description="Have this student speak if the user asks for someone to corret the Most Conditions, or to add an additional solution.",
)

minimum_conditions_student = Agent(
    model="gemini-2.5-flash-preview-04-17",
    name="minimum_conditions_student",
    instruction="The student is singularly using the slope of the original line to create a system with one solution. They do this by proposing any other line that has a slope that is not the same as the original line. The students’ understanding of the ideas involved in the problem/process: The student conceptually understands that any two linear equations with different slopes will intersect exactly once. The student also understands that having the same y-intercept means that any two lines will also cross only once, but notes that that condition is not necessary if the slopes are different. The student’s response does not specifically clarify that having different slopes includes the condition of having non-equivalent slopes (e.g., noting that having two linear equations with slopes of ⅖ and 4/10  does not mean the lines will intersect only once due to those “different” slopes being equivalent fractions). Student 3 is confident that they have identified the minimal conditions necessary to create a line that, with the original line, makes a system of linear equations with one solution (being, only needing a different slope). The student recognizes why the other proposed conditions from Student 1 and Student 2 are sufficient, but not necessary, to meet the conditions of the task. ",
    description="Have this student speak when the user asks for the minimum requirements to solve this task.",
)

root_agent = Agent(
    model="gemini-2.5-flash-preview-04-17",
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
