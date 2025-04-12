from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from server.routers import conversation_router
from server.service.gemini_service import GeminiService


@asynccontextmanager
async def lifespan(app: FastAPI):
    gemini_service = GeminiService()
    yield {"gemini_service": gemini_service}


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


@app.get("/")
async def read_root():
    return {"message": "Welcome to the time to teach app!"}
