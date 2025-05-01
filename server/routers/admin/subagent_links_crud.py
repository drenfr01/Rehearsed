from typing import List
from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session, select
from server.models.agent_model import SubAgentLink
from server.dependencies.database import get_session
from server.routers.login_router import get_current_active_user
from server.models.user_model import User

router = APIRouter(prefix="/subagent_links", tags=["subagent_links_crud"])


async def verify_admin(current_user: User = Depends(get_current_active_user)):
    if not current_user.admin:
        raise HTTPException(
            status_code=403, detail="Not enough permissions. Admin access required."
        )
    return current_user


@router.post("/", response_model=SubAgentLink)
async def create_subagent_link(
    link: SubAgentLink,
    session: Session = Depends(get_session),
    _: User = Depends(verify_admin),
):
    """Create a new subagent link"""
    session.add(link)
    session.commit()
    session.refresh(link)
    return link


@router.get("/", response_model=List[SubAgentLink])
async def get_subagent_links(
    session: Session = Depends(get_session), _: User = Depends(verify_admin)
):
    """Get all subagent links"""
    links = session.exec(select(SubAgentLink)).all()
    return links


@router.get("/root/{root_agent_id}", response_model=List[SubAgentLink])
async def get_subagent_links_by_root(
    root_agent_id: int,
    session: Session = Depends(get_session),
    _: User = Depends(verify_admin),
):
    """Get all subagent links for a specific root agent"""
    links = session.exec(
        select(SubAgentLink).where(SubAgentLink.root_agent_id == root_agent_id)
    ).all()
    return links


@router.get("/sub/{sub_agent_id}", response_model=List[SubAgentLink])
async def get_subagent_links_by_sub(
    sub_agent_id: int,
    session: Session = Depends(get_session),
    _: User = Depends(verify_admin),
):
    """Get all subagent links for a specific sub agent"""
    links = session.exec(
        select(SubAgentLink).where(SubAgentLink.sub_agent_id == sub_agent_id)
    ).all()
    return links


@router.delete("/{root_agent_id}/{sub_agent_id}")
async def delete_subagent_link(
    root_agent_id: int,
    sub_agent_id: int,
    session: Session = Depends(get_session),
    _: User = Depends(verify_admin),
):
    """Delete a specific subagent link"""
    link = session.get(SubAgentLink, (root_agent_id, sub_agent_id))
    if not link:
        raise HTTPException(status_code=404, detail="SubAgentLink not found")

    session.delete(link)
    session.commit()
    return {"message": "SubAgentLink deleted successfully"}
