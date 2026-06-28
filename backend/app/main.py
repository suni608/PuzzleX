from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from .database.db import engine, Base
from .api.router import router as api_router

# Create DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="PuzzleX API",
    description="High-performance puzzle solving and optimization engine API",
    version="1.0.0"
)

# Configure CORS for React frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For dev simplicity, customize in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(api_router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Welcome to the PuzzleX Solver Engine API"}

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
