from google.adk.agents import Agent
from google.adk.runners import Runner

from server.agents.agent import call_agent_async
from server.models.agent_interface import Conversation, ConversationTurn
from server.service.agent_service import AgentService


class AgentServiceRequest(AgentService):
    def __init__(self, root_agent: Agent):
        super().__init__(root_agent=root_agent)

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
                conversation_turn = ConversationTurn(
                    content=event.content.parts[0].text,
                    role=event.content.role,
                    author=event.author,
                    message_id=event.id,
                )
                conversation.turns.append(conversation_turn)

        print(f"Conversation: {conversation}")
        return conversation
