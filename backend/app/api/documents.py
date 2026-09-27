import shutil
from pathlib import Path
from typing import List, Dict, Any
from fastapi import APIRouter, UploadFile, File, HTTPException

from app.config import DOCUMENTS_DIR
from app.rag.document_store import (
    list_documents,
    process_document,
    remove_document,
    get_document,
)
from app.rag.pipeline import (
    add_chunks_to_vectorstore,
    delete_document_from_vectorstore,
    rebuild_vectorstore,
)

router = APIRouter()

ALLOWED_EXTENSIONS = {".pdf", ".txt", ".md"}


@router.get("", response_model=List[Dict[str, Any]])
async def get_documents():
    return list_documents()


@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    filename = file.filename or "uploaded_document"
    ext = Path(filename).suffix.lower()

    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Supported formats: PDF, TXT, MD.",
        )

    # Sanitize filename
    safe_name = "".join(c for c in filename if c.isalnum() or c in " ._-").strip()
    target_path = DOCUMENTS_DIR / safe_name

    # If already exists with same name, make it unique
    counter = 1
    base_stem = target_path.stem
    while target_path.exists():
        target_path = DOCUMENTS_DIR / f"{base_stem}_{counter}{ext}"
        counter += 1

    try:
        with open(target_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to save file: {str(e)}"
        )
    finally:
        await file.close()

    try:
        doc_info, chunks = process_document(target_path, target_path.name)
        if chunks:
            add_chunks_to_vectorstore(chunks)
        return doc_info
    except Exception as e:
        if target_path.exists():
            target_path.unlink()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to parse and index document: {str(e)}",
        )


@router.delete("/{doc_id}")
async def delete_document(doc_id: str):
    doc = get_document(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    remove_document(doc_id)
    try:
        delete_document_from_vectorstore(doc_id)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Document deleted but index update failed: {str(e)}",
        )

    return {"success": True, "message": f"Document '{doc.get('filename')}' deleted."}
