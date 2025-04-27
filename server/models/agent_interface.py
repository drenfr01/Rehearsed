from pydantic import BaseModel


class ConversationTurn(BaseModel):
    """The role is always the user or model,
    but the author delineates among multiple agents
    """

    content: str
    role: str
    author: str
    message_id: str


class Conversation(BaseModel):
    turns: list[ConversationTurn]
