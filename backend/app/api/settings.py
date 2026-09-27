import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.config import (
    EMBEDDING_MODEL_NAME,
    LLM_MODEL_NAME,
    DEVICE_CONFIG,
    ENV_PATH,
)
from app.rag.pipeline import get_device, get_vectorstore
from app.rag.document_store import list_documents

router = APIRouter()


class SettingsResponse(BaseModel):
    llm_model: str
    embedding_model: str
    vector_store: str
    device: str
    is_hf_token_set: bool
    total_documents: int
    total_chunks: int


class UpdateTokenRequest(BaseModel):
    hf_token: str


from dotenv import load_dotenv


@router.get("", response_model=SettingsResponse)
async def get_settings():
    load_dotenv(dotenv_path=ENV_PATH, override=True)
    token = os.getenv("HF_TOKEN") or os.getenv("HUGGINGFACEHUB_API_TOKEN") or ""
    has_token = bool(token and token.strip() and token != "your_huggingface_api_token_here")

    docs = list_documents()
    total_chunks = sum(d.get("chunk_count", 0) for d in docs)
    vs = get_vectorstore()
    vs_status = "FAISS (Active)" if vs is not None else "FAISS (Empty)"

    return SettingsResponse(
        llm_model=LLM_MODEL_NAME,
        embedding_model=EMBEDDING_MODEL_NAME,
        vector_store=vs_status,
        device=get_device().upper(),
        is_hf_token_set=has_token,
        total_documents=len(docs),
        total_chunks=total_chunks,
    )


@router.post("/token")
async def update_token(payload: UpdateTokenRequest):
    new_token = payload.hf_token.strip()
    if not new_token:
        raise HTTPException(status_code=400, detail="Token cannot be empty.")

    os.environ["HF_TOKEN"] = new_token

    # Write or update .env safely
    lines = []
    found = False
    if ENV_PATH.exists():
        with open(ENV_PATH, "r", encoding="utf-8") as f:
            for line in f:
                if line.startswith("HF_TOKEN="):
                    lines.append(f"HF_TOKEN={new_token}\n")
                    found = True
                else:
                    lines.append(line)
    if not found:
        lines.append(f"HF_TOKEN={new_token}\n")

    with open(ENV_PATH, "w", encoding="utf-8") as f:
        f.writelines(lines)

    return {"success": True, "message": "API token configured successfully."}
