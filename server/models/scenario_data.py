from pydantic import BaseModel


# TODO: delete this and move the below lists to the agent_model.py file
class ScenarioData(BaseModel):
    name: str
    description: str
    overview: str
    initial_prompt: str
    system_instructions: str


class ScenarioDataList(BaseModel):
    scenarios: dict[str, ScenarioData]


class SetScenarioData(BaseModel):
    scenario_id: str
