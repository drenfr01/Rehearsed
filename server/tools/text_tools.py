from google.adk.tools import ToolContext
from google.genai import types

from ..service.text_service import TextService


async def generate_text(prompt: str, tool_context: "ToolContext") -> dict:
    """
    Generate text using the TextService.
    """
    # Note: google adk does not like default parameter
    file_name = "text.md"

    text_service = TextService()
    text_response = text_service.generate_markdown_text(prompt)
    if text_response is None:
        await tool_context.save_artifact(
            file_name,
            types.Part.from_text(text=text_response),
        )
        return {
            "status": "success",
            "details": "Markdown text generated successfully and stored in artifacts",
            "file_name": file_name,
        }
    else:
        return {
            "status": "success",
            "details": "Markdown text generated successfully",
        }
