from enum import Enum
from typing import Literal

from pydantic import BaseModel
from sqlmodel import Field, SQLModel, String


class AgentResponse(BaseModel):
    agent_response_text: str
    markdown_text: str | None = None


class ADKType(str, Enum):
    LLM = "llm"
    SEQUENTIAL = "sequential"
    PARALLEL = "parallel"


class MediaType(str, Enum):
    NONE = "none"
    TEXT = "text"


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
    adk_type: Literal[ADKType.LLM, ADKType.SEQUENTIAL] = Field(
        default=ADKType.LLM, sa_type=String
    )
    media_type: Literal[MediaType.NONE, MediaType.TEXT] = Field(
        default=MediaType.NONE, sa_type=String
    )
    instruction: str = Field(default=None)
    description: str = Field(default=None)
    model: str = Field(default=None)
    tools: str = Field(default="")
    modules: str = Field(default="")
    sub_agent_ids: str = Field(default="")


class SubAgentLink(SQLModel, table=True):
    root_agent_id: int = Field(
        default=None, foreign_key="agentpydantic.id", primary_key=True
    )
    sub_agent_id: int = Field(
        default=None, foreign_key="agentpydantic.id", primary_key=True
    )
