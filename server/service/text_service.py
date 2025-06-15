import os
from google import genai
from google.genai import types


class TextService:
    def __init__(self, project_id: str | None = None, location: str | None = None):
        """
        Args:
            project_id: The project ID to use for the client
            location: The location to use for the client
        """
        try:
            self.project_id = project_id or os.environ.get("GOOGLE_PROJECT_ID")
            self.location = location or os.environ.get("GOOGLE_LOCATION")
            self.client = genai.Client(
                vertexai=True, project_id=self.project_id, location=self.location
            )
        except Exception as e:
            error_message = f"Error initializing TextService: {e}"
            raise Exception(error_message)

    def generate_markdown_text(
        self, prompt: str, model: str = "gemini-2.5-flash-preview-05-20"
    ) -> str:
        """
        Generate markdown text using the Gemini API.

        Args:
            prompt: The prompt to generate text from
            model: The model to use for the generation
        """
        response = self.client.generate_content(
            model=model,
            prompt=prompt,
            config=types.GenerationConfig(
                system_instruction="Return all responses in Markdown format"
            ),
        )
        return response.text
