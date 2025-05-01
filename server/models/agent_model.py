from pydantic import BaseModel
from sqlmodel import Field, SQLModel


class Scenario(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True, unique=True)
    name: str = Field(default=None)
    description: str = Field(default=None)
    overview: str = Field(default=None)
    system_instructions: str = Field(default=None)
    initial_prompt: str = Field(default=None)


class SetScenarioData(BaseModel):
    scenario_id: int


# Name to avoid collison with ADK Agent Class
class AgentPydantic(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True, unique=True)
    scenario_id: int = Field(default=None, foreign_key="scenario.id")
    name: str = Field(default=None)
    instruction: str = Field(default=None)
    description: str = Field(default=None)
    model: str = Field(default=None)


class SubAgentLink(SQLModel, table=True):
    root_agent_id: int = Field(
        default=None, foreign_key="agentpydantic.id", primary_key=True
    )
    sub_agent_id: int = Field(
        default=None, foreign_key="agentpydantic.id", primary_key=True
    )
