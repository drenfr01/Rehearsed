from typing import List

from fastapi import APIRouter, Depends, HTTPException, Request
from server.dependencies.database import get_session
from server.models.agent_model import AgentPydantic
from server.models.user_model import User
from server.routers.admin.util import verify_admin
from sqlmodel import Session, select

router = APIRouter(prefix="/agents_crud", tags=["agents_crud"])


@router.post("/", response_model=AgentPydantic)
async def create_agent(
    request: Request,
    agent: AgentPydantic,
    session: Session = Depends(get_session),
    _: User = Depends(verify_admin),
):
    """Create a new agent"""
    session.add(agent)
    session.commit()
    session.refresh(agent)

    # Update agent in memory
    request.app.state.agent_service.get_agents_from_database()

    return agent


@router.get("/", response_model=List[AgentPydantic])
async def get_agents(
    session: Session = Depends(get_session), _: User = Depends(verify_admin)
) -> List[AgentPydantic]:
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
    request: Request,
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

    # Update agent in memory
    request.app.state.agent_service.get_agents_from_database()
    return db_agent


@router.delete("/{agent_id}")
async def delete_agent(
    request: Request,
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

    # Update agent in memory
    request.app.state.agent_service.get_agents_from_database()

    return {"message": "Agent deleted successfully"}
