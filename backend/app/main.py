from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import APP_SETTINGS
from app.routers import health, projects, flow_prompts, renders, audio, assets, motion_graphics, visual_generation

app = FastAPI(
    title=APP_SETTINGS["app_name"],
    version=APP_SETTINGS["version"],
    description="Local backend engine for AI Video Studio"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router)
app.include_router(projects.router)
app.include_router(flow_prompts.router)
app.include_router(renders.router)
app.include_router(audio.router)
app.include_router(assets.router)
app.include_router(motion_graphics.router)
app.include_router(motion_graphics.overlay_router)
app.include_router(visual_generation.router)

@app.get("/")
def root():
    return {
        "message": "AI Video Studio Local API is operational",
        "docs_url": "/docs",
        "health_url": "/api/health",
        "projects_url": "/api/projects"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=APP_SETTINGS["host"], port=APP_SETTINGS["port"], reload=True)
