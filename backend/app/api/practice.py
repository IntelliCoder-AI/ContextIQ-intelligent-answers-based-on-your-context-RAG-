from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.rag.pipeline import generate_practice
from app.rag.document_store import get_document

router = APIRouter()


class PracticeRequest(BaseModel):
    document_id: str
    num_questions: int = Field(default=5, ge=1, le=15)
    difficulty: str = Field(default="Medium")
    question_type: str = Field(default="Multiple choice")


class PracticeResponse(BaseModel):
    document_id: str
    document_name: str
    content: str


@router.post("", response_model=PracticeResponse)
async def create_practice_questions(payload: PracticeRequest):
    doc = get_document(payload.document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Selected document not found.")

    try:
        content = generate_practice(
            document_id=payload.document_id,
            num_questions=payload.num_questions,
            difficulty=payload.difficulty,
            question_type=payload.question_type,
        )
        return PracticeResponse(
            document_id=payload.document_id,
            document_name=doc.get("filename", "Document"),
            content=content,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate practice questions: {str(e).splitlines()[0]}",
        )
