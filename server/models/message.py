from pydantic import BaseModel, Field
from uuid import UUID, uuid4


class Message(BaseModel):
    message_id: UUID = Field(default_factory=uuid4)
    message: str
    role: str
