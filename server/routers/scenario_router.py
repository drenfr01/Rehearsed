from fastapi import APIRouter, Request

from server.models.scenario_data import (
    ScenarioData,
    ScenarioDataList,
    SetScenarioData,
)

router = APIRouter(
    prefix="/scenario",
    tags=["scenario"],
    responses={404: {"description": "Not found"}},
)


@router.get("/get-all")
async def get_all_scenarios(request: Request) -> ScenarioDataList:
    return request.state.scenario_service.get_all_scenario_data()


@router.get("/get-current-scenario")
async def get_current_scenario(request: Request) -> ScenarioData:
    return request.state.scenario_service.get_scenario_data()


@router.post("/set-scenario-data")
async def set_scenario_data(request: Request, scenario_data: SetScenarioData):
    return request.state.scenario_service.set_scenario_data(
        scenario_id=scenario_data.scenario_id
    )
