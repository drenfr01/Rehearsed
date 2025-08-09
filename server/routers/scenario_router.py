from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from server.models.agent_model import (
    Scenario,
    SetScenarioData,
)

router = APIRouter(
    prefix="/scenario",
    tags=["scenario"],
    responses={404: {"description": "Not found"}},
)


@router.get("/get-all")
async def get_all_scenarios(request: Request) -> list[Scenario]:
    return request.app.state.scenario_service.get_all_scenarios()


@router.get("/get-current-scenario")
async def get_current_scenario(request: Request) -> Scenario:
    return request.app.state.scenario_service.get_current_scenario()


@router.post("/set-scenario-data")
async def set_scenario_data(request: Request, scenario_data: SetScenarioData):
    # We load the agents from the database upon scenario selection
    print(f"Setting scenario to {scenario_data.scenario_id}")
    request.app.state.scenario_service.set_scenario(
        scenario_id=scenario_data.scenario_id
    )
    request.app.state.agent_service.get_agents_from_database()
    return JSONResponse(content={"message": "Scenario set successfully"})
