from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Note: dependencies matters, we need to import all models before creating the engine
from server.dependencies.database import initialize_clean_db
from server.orm.sample_data import initialize_all_sample_data
from server.routers import (
    agent_router,
    conversation_router,
    login_router,
    scenario_router,
)
from server.service.gemini_service import GeminiService
from server.service.scenario_service import ScenarioService

from server.routers.admin.scenarios_crud import router as scenarios_crud_router
from server.routers.admin.agents_crud import router as agents_crud_router
from server.routers.admin.subagent_links_crud import (
    router as subagent_links_crud_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # TODO: need to change this to more persistent storage, right now just starting with clean db every time
    initialize_clean_db()
    initialize_all_sample_data()

    scenario_service = ScenarioService()
    gemini_service = GeminiService(scenario_service)
    yield {
        "gemini_service": gemini_service,
        "scenario_service": scenario_service,
    }


load_dotenv()

app = FastAPI(lifespan=lifespan)


# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite's default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(conversation_router.router)
app.include_router(scenario_router.router)
app.include_router(agent_router.router)
app.include_router(login_router.router)

# CRUD routers for admin
app.include_router(scenarios_crud_router)
app.include_router(agents_crud_router)
app.include_router(subagent_links_crud_router)


@app.get("/")
async def read_root():
    return {"message": "Welcome to the time to teach app!"}
