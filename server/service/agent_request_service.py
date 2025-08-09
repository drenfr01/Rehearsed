from google.adk.artifacts import InMemoryArtifactService
from google.adk.runners import LiveRequestQueue, RunConfig, Runner
from google.genai import types
from google.genai.types import Blob

from server.models.agent_model import AgentResponse
from server.service.agent_service import AgentService
from server.service.session_service import SessionService


class AgentRequestService:
    def __init__(self, agent_service: AgentService):
        self.session_service = SessionService()
        self.agent_service = agent_service
        self.runner = None

    async def request_agent_response(
        self,
        root_agent_name: str,
        user_id: str,
        session_id: str,
        message: str,
        image_content: bytes | None = None,
        image_mime_type: str | None = None,
    ) -> AgentResponse:
        await self.initialize_runner(user_id, session_id, root_agent_name)
        return await self.call_agent_async(
            query=message,
            user_id=user_id,
            session_id=session_id,
            image_content=image_content,
            image_mime_type=image_mime_type,
        )

    async def initialize_runner(
        self,
        user_id: str,
        session_id: str,
        root_agent_name: str,
    ) -> None:
        """Starts an agent session

        Args:
            user_id: The user ID
            session_id: The session ID
            root_agent_name: The name of the root agent
        """

        session = await self.session_service.get_or_create_session(user_id, session_id)

        root_agent = self.agent_service.lookup_agent(root_agent_name).agent
        if not root_agent:
            raise ValueError(f"Root agent {root_agent_name} not found")

        print(f"Root agent: {root_agent.name}")
        self.runner = Runner(
            app_name=self.agent_service.app_name,
            agent=root_agent,
            session_service=self.session_service.get_session_service(),
            artifact_service=InMemoryArtifactService(),
        )

        run_config = RunConfig(response_modalities=["TEXT"])

        self.live_request_queue = LiveRequestQueue()

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
        self,
        query: str,
        user_id: str,
        session_id: str,
        image_content: bytes | None = None,
        image_mime_type: str | None = None,
    ) -> AgentResponse:
        """Sends a query to the agent and prints the final response.

        Args:
            query: The query to send to the agent
            user_id: The user ID
            session_id: The session ID

        Returns:
            The final response from the agent
        """
        event_author = None
        print(f"\n>>> User Query: {query}")
        # Prepare the user's message in ADK format
        parts: list[types.Part] = [types.Part(text=query)]
        if image_content and image_mime_type:
            parts.append(
                types.Part(
                    inline_data=Blob(data=image_content, mime_type=image_mime_type)
                )
            )
        content = types.Content(role="user", parts=parts)

        final_response_text = "Agent did not produce a final response."  # Default

        # Key Concept: run_async executes the agent logic and yields Events.
        # We iterate through events to find the final answer.
        if not self.runner:
            raise ValueError("Runner not initialized")

        async for event in self.runner.run_async(
            user_id=user_id, session_id=session_id, new_message=content
        ):
            # You can uncomment the line below to see *all* events during execution
            print(
                f"  [Event] Author: {event.author}, Type: {type(event).__name__}, Final: {event.is_final_response()}, Content: {event.content}"
            )

            # Key Concept: is_final_response() marks the concluding message for the turn.
            if event.is_final_response():
                event_author = event.author
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
            author=event_author,
        )
