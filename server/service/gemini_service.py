import os

import yaml
from google import genai
from google.genai import types

from server.models.message import Message, SummarizeFeedbackResponse
from server.service.scenario_service import ScenarioService


# TODO: move to ORM layer with DB call
def load_feedback_prompt() -> str:
    with open("orm/feedback_prompt.yaml", "r") as f:
        return yaml.safe_load(f)["prompt"]


class GeminiService:
    def __init__(self, scenario_service: ScenarioService):
        # TODO: make this a persistent database
        self.temp_client_messages: dict[str, list[Message]] = {}
        self.client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
        # gemini-2.5-pro-exp-03-25
        # gemini-2.0-flash
        self.model_name = "gemini-2.5-flash-preview-04-17"
        # TODO: use chat for multi turn history
        self.chat = self.client.chats.create(model=self.model_name)

        self.scenario_service = scenario_service
        self.populate_initial_data()
        self.feedback_prompt = load_feedback_prompt()

    def populate_initial_data(self, user_id: int = 1) -> None:
        """Runs the initial prompt through the Gemini client and also stores the response

        Args:
            user_id: The user id to populate the initial data for

        Returns:
            None
        """
        # TODO: setup logging and log this
        if user_id not in self.temp_client_messages:
            self.temp_client_messages[user_id] = []

        scenario_data = self.scenario_service.get_scenario_data()

        response = self.client.models.generate_content(
            model=self.model_name,
            contents=[types.Part.from_text(text=scenario_data.initial_prompt)],
            config=types.GenerateContentConfig(
                response_mime_type="text/plain",
                system_instruction=[
                    types.Part.from_text(text=scenario_data.system_instructions)
                ],
            ),
        )
        self.temp_client_messages[user_id].append(
            Message(message=response.text, role="system")
        )

    def fetch_user_messages(self, user_id: int) -> list[Message]:
        """Fetches the messages for a user from the client messages

        Args:
            user_id: The user id to fetch the messages for

        Returns:
            The messages for the user
        """
        return self.temp_client_messages.get(user_id, [])

    def get_gemini_message(self, message: str, user_id: str):
        """
        Sends a prompt to Gemini and returns the response

        Args:
            prompt: The prompt to send to Gemini
            model: The model to use

        Returns:
            The message from Gemini
        """

        self.temp_client_messages[user_id].append(Message(message=message, role="user"))
        scenario_data = self.scenario_service.get_scenario_data()
        response = self.client.models.generate_content(
            model=self.model_name,
            contents=[types.Part.from_text(text=message)],
            config=types.GenerateContentConfig(
                response_mime_type="text/plain",
                system_instruction=[
                    types.Part.from_text(text=scenario_data.system_instructions)
                ],
            ),
        )
        self.temp_client_messages[user_id].append(
            Message(message=response.text, role="system")
        )
        return response.text

    def provide_user_feedback(self, user_id: str) -> SummarizeFeedbackResponse:
        """
        Provides feedback to the user based on the conversation
        """
        print(self.temp_client_messages[1])
        response = self.client.models.generate_content(
            model=self.model_name,
            contents=[
                # types.Part.from_text(text=self.temp_client_messages[1]),
                types.Part.from_text(text=self.feedback_prompt),
            ],
            config=types.GenerateContentConfig(
                response_mime_type="text/plain",
            ),
        )

        return SummarizeFeedbackResponse(feedback=response.text)
