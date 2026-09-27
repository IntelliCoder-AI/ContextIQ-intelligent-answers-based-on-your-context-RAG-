from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.rag.pipeline import generate_summary
from app.rag.document_store import get_document

router = APIRouter()


class SummarizeRequest(BaseModel):
    document_id: str
    style: Optional[str] = "comprehensive"


class SummarizeResponse(BaseModel):
    document_id: str
    document_name: str
    summary: str


@router.post("", response_model=SummarizeResponse)
async def summarize_document(payload: SummarizeRequest):
    doc = get_document(payload.document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Selected document not found.")

    try:
        summary_text = generate_summary(
            document_id=payload.document_id,
            style=payload.style or "comprehensive",
        )
        return SummarizeResponse(
            document_id=payload.document_id,
            document_name=doc.get("filename", "Document"),
            summary=summary_text,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate summary: {str(e).splitlines()[0]}",
        )
