from typing import List
from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session, select
from server.models.agent_model import AgentPydantic
from server.dependencies.database import get_session

router = APIRouter(prefix="/agents_crud", tags=["agents_crud"])


@router.post("/", response_model=AgentPydantic)
def create_agent(agent: AgentPydantic, session: Session = Depends(get_session)):
    """Create a new agent"""
    session.add(agent)
    session.commit()
    session.refresh(agent)
    return agent


@router.get("/", response_model=List[AgentPydantic])
def get_agents(session: Session = Depends(get_session)):
    """Get all agents"""
    agents = session.exec(select(AgentPydantic)).all()
    return agents


@router.get("/{agent_id}", response_model=AgentPydantic)
def get_agent(agent_id: int, session: Session = Depends(get_session)):
    """Get a specific agent by ID"""
    agent = session.get(AgentPydantic, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent


@router.put("/{agent_id}", response_model=AgentPydantic)
def update_agent(
    agent_id: int, agent_update: AgentPydantic, session: Session = Depends(get_session)
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
def delete_agent(agent_id: int, session: Session = Depends(get_session)):
    """Delete a specific agent"""
    agent = session.get(AgentPydantic, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    session.delete(agent)
    session.commit()
    return {"message": "Agent deleted successfully"}
