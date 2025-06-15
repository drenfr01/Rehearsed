import base64
from google.adk.runners import Runner

from server.models.agent_interface import Conversation, ConversationTurn
from server.service.agent_service import AgentService, AgentType
from server.service.scenario_service import ScenarioService
from server.service.text_to_speech_service import TextToSpeechService
from google.adk.runners import Runner
from google.genai import types


ROOT_AGENT_MODEL = "gemini-2.5-pro-preview-03-25"
STUDENT_AGENT_MODEL = "gemini-2.5-pro-preview-03-25"
FEEDBACK_AGENT_MODEL = "gemini-2.5-pro-preview-03-25"


class AgentServiceRequest(AgentService):
    # TODO: refactor this to not take in an AgentType
    def __init__(
        self, scenario_service: ScenarioService, agent_type: AgentType = AgentType.ROOT
    ):
        super().__init__(scenario_service=scenario_service, agent_type=agent_type)
        self.text_to_speech_service = TextToSpeechService()

    async def request_agent_response(
        self,
        runner: Runner,
        user_id: str,
        session_id: str,
        message: str,
    ):
        self.initialize_agent(user_id, session_id)
        return await self.call_agent_async(message, runner, user_id, session_id)

    async def get_session_content(
        self,
        user_id: str,
        session_id: str,
    ) -> Conversation:
        """Gets the session for a given user and session id. Session is always initialized"""
        saved_session = self.get_or_create_session(user_id, session_id)
        conversation = Conversation(turns=[])

        for event in saved_session.events:
            if event.content and event.content.parts and event.content.parts[0].text:
                # Generate audio for system responses
                audio_content = None
                # TODO: make an enum with "user" and "model" here
                if event.content.role == "model":
                    print(
                        f"Generating audio for system message: {event.content.parts[0].text[:100]}..."
                    )
                    audio_content = await self.text_to_speech_service.text_to_speech(
                        event.content.parts[0].text
                    )
                    print(f"Audio content generated: {audio_content is not None}")
                    if audio_content:
                        # Properly encode the audio content as base64
                        audio_content = base64.b64encode(audio_content).decode("utf-8")
                        print(f"Audio content encoded: {len(audio_content)} bytes")

                conversation_turn = ConversationTurn(
                    content=event.content.parts[0].text,
                    role=event.content.role,
                    author=event.author,
                    message_id=event.id,
                    audio=audio_content,
                )
                print(
                    f"Conversation turn created with audio: {conversation_turn.audio is not None}"
                )
                conversation.turns.append(conversation_turn)

        print(f"Conversation: {conversation}")
        return conversation

    async def call_agent_async(
        self, query: str, runner: Runner, user_id: str, session_id: str
    ):
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
                agent_pydantic, _ = self.get_agent(event.author)
                if event.content and event.content.parts:
                    # Assuming text response in the first part
                    final_response_text = event.content.parts[0].text
                elif (
                    event.actions and event.actions.escalate
                ):  # Handle potential errors/escalations
                    final_response_text = f"Agent escalated: {event.error_message or 'No specific message.'}"
                # Add more checks here if needed (e.g., specific error codes)

                # Only break if it's an LLM agent, if it's a parallel or sequential agent we will want to aggregate responses
                if self.agent_pydantic.agent_type == AgentType.LLM.value:
                    break  # Stop processing events once the final response is found

        print(f"<<< Agent Response: {final_response_text}")
        return final_response_text
