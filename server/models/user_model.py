from sqlmodel import Field, SQLModel


class User(SQLModel):
    id: int = Field(default=None, primary_key=True, unique=True)
    username: str = Field(default=None)
    email: str
    disabled: bool


class UserInDB(User, table=True):
    hashed_password: str
    admin: bool = Field(default=False)
