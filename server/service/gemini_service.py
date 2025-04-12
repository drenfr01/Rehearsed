import os
import uuid

from google import genai
from google.genai import types
from server.models.message import Message


class GeminiService:
    def __init__(self):
        self.client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
        # TODO: make this a persistent database
        self.temp_client_messages: dict[str, list[Message]] = {}
        self.populate_sample_data()

    def populate_sample_data(self, user_id: int = 1):
        self.temp_client_messages[user_id] = [
            Message(
                message="Hello, welcome to the Simulation App!",
                role="user",
            )
        ]

    def fetch_user_messages(self, user_id: int) -> list[Message]:
        """Fetches the messages for a user from the client messages

        Args:
            user_id: The user id to fetch the messages for

        Returns:
            The messages for the user
        """
        return self.temp_client_messages.get(user_id, [])

    def get_gemini_message(
        self, message: str, user_id: str, model_name: str = "gemini-2.0-flash"
    ):
        """
        Sends a prompt to Gemini and returns the response

        Args:
            prompt: The prompt to send to Gemini
            model: The model to use

        Returns:
            The message from Gemini
        """
        # TODO: setup logging and log this
        if user_id not in self.temp_client_messages:
            self.temp_client_messages[user_id] = []

        self.temp_client_messages[user_id].append(Message(message=message, role="user"))
        response = self.client.models.generate_content(
            model=model_name,
            contents=[types.Part.from_text(text=message)],
            config=types.GenerateContentConfig(
                response_mime_type="text/plain",
                system_instruction=[
                    types.Part.from_text(
                        text="You are a helpful assistant that can answer questions and help with tasks."
                    )
                ],
            ),
        )
        self.temp_client_messages[user_id].append(
            Message(message=response.text, role="system")
        )
        print(self.temp_client_messages[user_id])
        return response.text
