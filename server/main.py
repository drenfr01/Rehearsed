from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from server.routers import agent_router, conversation_router, scenario_router
from server.service.gemini_service import GeminiService
from server.service.scenario_service import ScenarioService


@asynccontextmanager
async def lifespan(app: FastAPI):
    # TODO: probably factor these to Depends in the individual routes
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


@app.get("/")
async def read_root():
    return {"message": "Welcome to the time to teach app!"}
