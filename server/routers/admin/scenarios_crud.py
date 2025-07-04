from typing import List

from fastapi import APIRouter, Depends, HTTPException
from server.dependencies.database import get_session
from server.models.agent_model import Scenario
from server.models.user_model import User
from server.routers.admin.util import verify_admin
from sqlmodel import Session, select

router = APIRouter(prefix="/scenarios", tags=["scenarios_crud"])


@router.post("/", response_model=Scenario)
async def create_scenario(
    scenario: Scenario,
    session: Session = Depends(get_session),
    _: User = Depends(verify_admin),
):
    """Create a new scenario"""
    session.add(scenario)
    session.commit()
    session.refresh(scenario)
    return scenario


@router.get("/", response_model=List[Scenario])
async def get_scenarios(
    session: Session = Depends(get_session), _: User = Depends(verify_admin)
):
    """Get all scenarios"""
    scenarios = session.exec(select(Scenario)).all()
    return scenarios


@router.get("/{scenario_id}", response_model=Scenario)
async def get_scenario(
    scenario_id: int,
    session: Session = Depends(get_session),
    _: User = Depends(verify_admin),
):
    """Get a specific scenario by ID"""
    scenario = session.get(Scenario, scenario_id)
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return scenario


@router.put("/{scenario_id}", response_model=Scenario)
async def update_scenario(
    scenario_id: int,
    scenario_update: Scenario,
    session: Session = Depends(get_session),
    _: User = Depends(verify_admin),
):
    """Update a specific scenario"""
    db_scenario = session.get(Scenario, scenario_id)
    if not db_scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")

    scenario_data = scenario_update.dict(exclude_unset=True)
    for key, value in scenario_data.items():
        setattr(db_scenario, key, value)

    session.add(db_scenario)
    session.commit()
    session.refresh(db_scenario)
    return db_scenario


@router.delete("/{scenario_id}")
async def delete_scenario(
    scenario_id: int,
    session: Session = Depends(get_session),
    _: User = Depends(verify_admin),
):
    """Delete a specific scenario"""
    scenario = session.get(Scenario, scenario_id)
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")

    session.delete(scenario)
    session.commit()
    return {"message": "Scenario deleted successfully"}
