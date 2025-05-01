from typing import List
from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session, select
from server.models.agent_model import AgentPydantic
from server.dependencies.database import get_session
from server.routers.login_router import get_current_active_user
from server.models.user_model import User

router = APIRouter(prefix="/agents_crud", tags=["agents_crud"])


async def verify_admin(current_user: User = Depends(get_current_active_user)):
    if not current_user.admin:
        raise HTTPException(
            status_code=403, detail="Not enough permissions. Admin access required."
        )
    return current_user


@router.post("/", response_model=AgentPydantic)
async def create_agent(
    agent: AgentPydantic,
    session: Session = Depends(get_session),
    _: User = Depends(verify_admin),
):
    """Create a new agent"""
    session.add(agent)
    session.commit()
    session.refresh(agent)
    return agent


@router.get("/", response_model=List[AgentPydantic])
async def get_agents(
    session: Session = Depends(get_session), _: User = Depends(verify_admin)
):
    """Get all agents"""
    agents = session.exec(select(AgentPydantic)).all()
    return agents


@router.get("/{agent_id}", response_model=AgentPydantic)
async def get_agent(
    agent_id: int,
    session: Session = Depends(get_session),
    _: User = Depends(verify_admin),
):
    """Get a specific agent by ID"""
    agent = session.get(AgentPydantic, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent


@router.put("/{agent_id}", response_model=AgentPydantic)
async def update_agent(
    agent_id: int,
    agent_update: AgentPydantic,
    session: Session = Depends(get_session),
    _: User = Depends(verify_admin),
):
    """Update a specific agent"""
    db_agent = session.get(AgentPydantic, agent_id)
    if not db_agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    agent_data = agent_update.dict(exclude_unset=True)
    for key, value in agent_data.items():
        setattr(db_agent, key, value)

    session.add(db_agent)
    session.commit()
    session.refresh(db_agent)
    return db_agent


@router.delete("/{agent_id}")
async def delete_agent(
    agent_id: int,
    session: Session = Depends(get_session),
    _: User = Depends(verify_admin),
):
    """Delete a specific agent"""
    agent = session.get(AgentPydantic, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    session.delete(agent)
    session.commit()
    return {"message": "Agent deleted successfully"}
