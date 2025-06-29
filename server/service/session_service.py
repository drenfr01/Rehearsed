import base64
import os

from google.adk.sessions import Session
from google.adk.sessions.database_session_service import DatabaseSessionService

from server.models.agent_interface import Conversation, ConversationTurn
from server.service.text_to_speech_service import TextToSpeechService


class SessionService:
    def __init__(self):
        self.app_name = os.getenv("APP_NAME", "Time to Teach")
        db_url = os.getenv("DB_PATH")
        self.session_service = DatabaseSessionService(db_url=f"sqlite:///{db_url}")
        self.text_to_speech_service = TextToSpeechService()

    async def get_all_sessions_for_user(self, user_id: str) -> dict:
        print(f"Getting all sessions for user: {user_id}")
        sessions = await self.session_service.list_sessions(
            app_name=self.app_name, user_id=user_id
        )
        print(f"Raw sessions response: {sessions}")
        print(
            f"Number of sessions found: {len(sessions.sessions) if sessions.sessions else 0}"
        )

        # Sort sessions by lastUpdatedTime in descending order (most recent first)
        sorted_sessions = sorted(
            sessions.sessions,
            key=lambda session: session.last_update_time,
            reverse=True,
        )
        print(f"Sorted sessions: {sorted_sessions}")

        # Transform sessions to match client interface
        transformed_sessions = []
        for session in sorted_sessions:
            transformed_session = {
                "id": session.id,
                "userId": session.user_id,
                "lastUpdateTime": str(session.last_update_time),
            }
            transformed_sessions.append(transformed_session)

        result = {"sessions": transformed_sessions}
        print(f"Returning transformed sessions: {result}")
        return result

    def get_session_service(self) -> DatabaseSessionService:
        return self.session_service

    async def get_or_create_session(self, user_id: str, session_id: str) -> Session:
        """Either retrieves an existing session or creates a new one

        Args:
            user_id (str): The user ID
            session_id (str): The session ID

        Returns:
            Session: The session
        """
        print(
            f"Getting or creating session for user {user_id} and session {session_id}"
        )
        session = await self.session_service.get_session(
            app_name=self.app_name, user_id=user_id, session_id=session_id
        )
        if session is None:
            print(f"Creating new session for user {user_id} and session {session_id}")
            session = await self.session_service.create_session(
                app_name=self.app_name,
                user_id=user_id,
                session_id=session_id,
            )
            print(f"Session created successfully: {session.id}")
        else:
            print(f"Retrieved existing session: {session.id}")
        return session

    async def get_session_content(
        self,
        user_id: str,
        session_id: str,
        include_audio: bool = True,
    ) -> Conversation:
        """Gets the session for a given user and session id. Session is always initialized

        Args:
            user_id (str): The user ID
            session_id (str): The session ID
            include_audio (bool): Whether to include audio in the conversation

        Returns:
            Conversation: The conversation
        """
        print(f"Getting session content for user {user_id} and session {session_id}")
        saved_session = await self.get_or_create_session(user_id, session_id)
        conversation = Conversation(turns=[])

        for event in saved_session.events:
            # TODO: make an enum with agent names here. This is a hack
            if (
                event.content
                and event.content.parts
                and event.content.parts[0].text
                and event.author != "feedback_agent"
            ):
                # Generate audio for system responses
                audio_content = None
                # TODO: make an enum with "user" and "model" here
                if event.content.role == "model" and include_audio:
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
