from google.adk.artifacts import InMemoryArtifactService
from google.adk.runners import LiveRequestQueue, RunConfig, Runner
from google.genai import types

from server.models.agent_model import AgentResponse
from server.service.agent_service import AgentService
from server.service.session_service import SessionService

ROOT_AGENT_MODEL = "gemini-2.5-pro-preview-03-25"
STUDENT_AGENT_MODEL = "gemini-2.5-pro-preview-03-25"
FEEDBACK_AGENT_MODEL = "gemini-2.5-pro-preview-03-25"


class AgentRequestService:
    def __init__(self, agent_service: AgentService):
        self.session_service = SessionService()
        self.agent_service = agent_service

    async def request_agent_response(
        self,
        runner: Runner,
        user_id: str,
        session_id: str,
        message: str,
    ) -> AgentResponse:
        await self.initialize_runner(user_id, session_id)
        return await self.call_agent_async(message, runner, user_id, session_id)

    async def initialize_runner(
        self,
        user_id: str,
        session_id: str,
    ) -> None:
        """Starts an agent session"""

        session = await self.session_service.get_or_create_session(user_id, session_id)

        # Create a Runner
        self.runner = Runner(
            app_name=self.agent_service.app_name,
            agent=self.agent_service.root_agent,
            session_service=self.session_service.get_session_service(),
            artifact_service=InMemoryArtifactService(),
        )

        # Set response modality = TEXT
        run_config = RunConfig(response_modalities=["TEXT"])

        # Create a LiveRequestQueue for this session
        self.live_request_queue = LiveRequestQueue()

        # Start agent session
        self.live_events = self.runner.run_live(
            session=session,
            live_request_queue=self.live_request_queue,
            run_config=run_config,
        )

    async def handle_media_types(
        self, runner: Runner, user_id: str, session_id: str, filename: str
    ) -> str:
        """Handles the media types for the agent"""
        text_part = await runner.artifact_service.load_artifact(
            app_name=self.agent_service.app_name,
            user_id=user_id,
            session_id=session_id,
            filename=filename,
        )
        return text_part.text

    async def call_agent_async(
        self, query: str, runner: Runner, user_id: str, session_id: str
    ) -> AgentResponse:
        text_str = None
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
            print(
                f"  [Event] Author: {event.author}, Type: {type(event).__name__}, Final: {event.is_final_response()}, Content: {event.content}"
            )

            # Key Concept: is_final_response() marks the concluding message for the turn.
            if event.is_final_response():
                agent_pydantic, _ = self.agent_service.get_agent(event.author)
                if agent_pydantic.name == "feedback_agent":
                    text_str = event.content.parts[0].text

                if event.content and event.content.parts:
                    # Assuming text response in the first part
                    final_response_text = event.content.parts[0].text
                elif (
                    event.actions and event.actions.escalate
                ):  # Handle potential errors/escalations
                    final_response_text = f"Agent escalated: {event.error_message or 'No specific message.'}"
                # Add more checks here if needed (e.g., specific error codes)

                # Only break if it's an LLM agent, if it's a parallel or sequential agent we will want to aggregate responses
                # if self.agent_pydantic.adk_type == ADKType.LLM.value:
                #     break  # Stop processing events once the final response is found

        print(f"<<< Agent Response: {final_response_text}")

        return AgentResponse(
            agent_response_text=final_response_text,
            markdown_text=text_str,
        )
