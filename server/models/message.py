from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class Message(BaseModel):
    message_id: UUID = Field(default_factory=uuid4)
    message: str
    role: str


class SummarizeFeedbackRequest(BaseModel):
    user_id: str


class SummarizeFeedbackResponse(BaseModel):
    feedback: str
