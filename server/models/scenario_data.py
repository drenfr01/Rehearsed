from pydantic import BaseModel


class ScenarioData(BaseModel):
    name: str
    description: str
    overview: str
    initial_prompt: str
    system_instructions: str
