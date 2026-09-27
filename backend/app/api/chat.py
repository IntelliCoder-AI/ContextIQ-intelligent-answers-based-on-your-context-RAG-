from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.rag.pipeline import ask_rag

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    document_id: Optional[str] = None


class SourceItem(BaseModel):
    document: str
    page: int
    content: str


class ChatResponse(BaseModel):
    answer: str
    sources: List[SourceItem]


@router.post("", response_model=ChatResponse)
async def chat_endpoint(payload: ChatRequest):
    query = payload.message.strip()
    if not query:
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    try:
        answer, sources = ask_rag(
            question=query,
            document_id=payload.document_id,
        )
        return ChatResponse(answer=answer, sources=sources)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        error_msg = str(e)
        if "unreachable" in error_msg.lower():
            detail = "The AI model is temporarily warming up on Hugging Face's serverless network. Please wait a moment and send your question again."
        elif "rate limit" in error_msg.lower():
            detail = "Hugging Face API rate limit reached. Please wait a moment and try again."
        elif "authorization" in error_msg.lower() or "token" in error_msg.lower() or "401" in error_msg:
            detail = "Invalid or missing Hugging Face API token. Please update it in Settings."
        else:
            detail = f"Could not generate an answer: {error_msg.splitlines()[0]}"
        raise HTTPException(status_code=500, detail=detail)
