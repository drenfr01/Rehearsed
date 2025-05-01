from typing import List
from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session, select
from server.models.agent_model import SubAgentLink
from server.dependencies.database import get_session

router = APIRouter(prefix="/subagent_links", tags=["subagent_links_crud"])


@router.post("/", response_model=SubAgentLink)
def create_subagent_link(link: SubAgentLink, session: Session = Depends(get_session)):
    """Create a new subagent link"""
    session.add(link)
    session.commit()
    session.refresh(link)
    return link


@router.get("/", response_model=List[SubAgentLink])
def get_subagent_links(session: Session = Depends(get_session)):
    """Get all subagent links"""
    links = session.exec(select(SubAgentLink)).all()
    return links


@router.get("/root/{root_agent_id}", response_model=List[SubAgentLink])
def get_subagent_links_by_root(
    root_agent_id: int, session: Session = Depends(get_session)
):
    """Get all subagent links for a specific root agent"""
    links = session.exec(
        select(SubAgentLink).where(SubAgentLink.root_agent_id == root_agent_id)
    ).all()
    return links


@router.get("/sub/{sub_agent_id}", response_model=List[SubAgentLink])
def get_subagent_links_by_sub(
    sub_agent_id: int, session: Session = Depends(get_session)
):
    """Get all subagent links for a specific sub agent"""
    links = session.exec(
        select(SubAgentLink).where(SubAgentLink.sub_agent_id == sub_agent_id)
    ).all()
    return links


@router.delete("/{root_agent_id}/{sub_agent_id}")
def delete_subagent_link(
    root_agent_id: int, sub_agent_id: int, session: Session = Depends(get_session)
):
    """Delete a specific subagent link"""
    link = session.get(SubAgentLink, (root_agent_id, sub_agent_id))
    if not link:
        raise HTTPException(status_code=404, detail="SubAgentLink not found")

    session.delete(link)
    session.commit()
    return {"message": "SubAgentLink deleted successfully"}
