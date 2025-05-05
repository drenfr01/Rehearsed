import base64
from google.adk.runners import Runner

from server.agents.agent import call_agent_async
from server.models.agent_interface import Conversation, ConversationTurn
from server.service.agent_service import AgentService, AgentType
from server.service.scenario_service import ScenarioService
from server.service.text_to_speech_service import TextToSpeechService


class AgentServiceRequest(AgentService):
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
        return await call_agent_async(message, runner, user_id, session_id)

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
