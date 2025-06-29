from pydantic import BaseModel


class CreateSessionRequest(BaseModel):
    user_id: str


class GetAllSessionsForUserRequest(BaseModel):
    user_id: str


class GetSessionRequest(BaseModel):
    user_id: str
    session_id: str
