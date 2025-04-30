from sqlmodel import Session

from server.dependencies.database import engine
from server.orm.user_model import UserInDB


def initialize_sample_user_data():
    with Session(engine) as session:
        user = UserInDB(
            user_id=1,
            username="johndoe",
            email="john@test.com",
            hashed_password="$2b$12$pCYsSI/mmqaZOoxkUSslbeFzyxlr38CTulWtGkElzld7p1xVemRYG",
            disabled=False,
        )
        user2 = UserInDB(
            user_id=2,
            username="janedoe",
            email="jane@test.com",
            hashed_password="$2b$12$CfXveIDjm7Pvs//KSXc7m.A7mw2XViro3gmfxIbH6p8/skAx4xxea",
            disabled=False,
        )
        session.add(user)
        session.add(user2)
        session.commit()
