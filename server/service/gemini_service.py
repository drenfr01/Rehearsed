import os

from google import genai
from google.genai import types


class GeminiService:
    def __init__(self):
        self.client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

    def get_gemini_message(self, message: str, model_name: str = "gemini-2.0-flash"):
        """
        Sends a prompt to Gemini and returns the response

        Args:
            prompt: The prompt to send to Gemini
            model: The model to use

        Returns:
            The message from Gemini
        """
        response = self.client.models.generate_content(
            model=model_name,
            contents=[types.Part.from_text(text=message)],
            config=types.GenerateContentConfig(
                response_mime_type="text/plain",
                system_instruction=[
                    types.Part.from_text(text="You are a helpful assistant that can answer questions and help with tasks.")
                ],
            ),
        )
        return response.text
