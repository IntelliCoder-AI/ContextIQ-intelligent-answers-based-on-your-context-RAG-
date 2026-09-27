from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.chat import router as chat_router
from app.api.documents import router as documents_router
from app.api.summaries import router as summaries_router
from app.api.practice import router as practice_router
from app.api.settings import router as settings_router

app = FastAPI(
    title="ContextIQ API",
    description="ContextIQ — intelligent answers based on your context. Built on LangChain, FAISS, and Qwen.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router, prefix="/api/chat", tags=["Chat"])
app.include_router(documents_router, prefix="/api/documents", tags=["Documents"])
app.include_router(summaries_router, prefix="/api/summarize", tags=["Summaries"])
app.include_router(practice_router, prefix="/api/practice", tags=["Practice"])
app.include_router(settings_router, prefix="/api/settings", tags=["Settings"])


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "service": "ContextIQ API"}
