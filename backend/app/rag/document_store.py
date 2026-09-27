import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional

from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

from app.config import DOCUMENTS_DIR, DATA_DIR

META_FILE = DATA_DIR / "documents_meta.json"

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200
)


def _load_manifest() -> Dict[str, Dict[str, Any]]:
    if not META_FILE.exists():
        return {}
    try:
        with open(META_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def _save_manifest(manifest: Dict[str, Dict[str, Any]]) -> None:
    with open(META_FILE, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)


def list_documents() -> List[Dict[str, Any]]:
    manifest = _load_manifest()
    docs = list(manifest.values())
    docs.sort(key=lambda x: x.get("uploaded_at", ""), reverse=True)
    return docs


def get_document(doc_id: str) -> Optional[Dict[str, Any]]:
    manifest = _load_manifest()
    return manifest.get(doc_id)


def process_document(file_path: Path, filename: str) -> tuple[Dict[str, Any], List[Document]]:
    ext = file_path.suffix.lower()
    raw_docs: List[Document] = []
    page_count = 1

    if ext == ".pdf":
        loader = PyPDFLoader(str(file_path))
        raw_docs = loader.load()
        page_count = len(raw_docs)
    else:
        loader = TextLoader(str(file_path), encoding="utf-8")
        raw_docs = loader.load()
        page_count = max(1, len(raw_docs[0].page_content.split("\n\n")) // 4)

    doc_id = str(uuid.uuid4())[:8]
    chunks = text_splitter.split_documents(raw_docs)

    for chunk in chunks:
        chunk.metadata["doc_id"] = doc_id
        chunk.metadata["source"] = filename
        if "page" not in chunk.metadata:
            chunk.metadata["page"] = 0

    doc_info = {
        "id": doc_id,
        "filename": filename,
        "file_type": ext.replace(".", "").upper() or "TXT",
        "file_path": str(file_path),
        "file_size": file_path.stat().st_size,
        "page_count": page_count,
        "chunk_count": len(chunks),
        "uploaded_at": datetime.now().isoformat()
    }

    manifest = _load_manifest()
    manifest[doc_id] = doc_info
    _save_manifest(manifest)

    return doc_info, chunks


def remove_document(doc_id: str) -> Optional[Dict[str, Any]]:
    manifest = _load_manifest()
    doc_info = manifest.pop(doc_id, None)
    if doc_info:
        _save_manifest(manifest)
        file_path = Path(doc_info.get("file_path", ""))
        if file_path.exists():
            try:
                file_path.unlink()
            except OSError:
                pass
    return doc_info


def get_all_chunks_from_storage() -> List[Document]:
    manifest = _load_manifest()
    all_chunks: List[Document] = []
    for doc_id, doc_info in manifest.items():
        file_path = Path(doc_info.get("file_path", ""))
        filename = doc_info.get("filename", "")
        if file_path.exists():
            try:
                ext = file_path.suffix.lower()
                if ext == ".pdf":
                    loader = PyPDFLoader(str(file_path))
                    raw_docs = loader.load()
                else:
                    loader = TextLoader(str(file_path), encoding="utf-8")
                    raw_docs = loader.load()
                chunks = text_splitter.split_documents(raw_docs)
                for chunk in chunks:
                    chunk.metadata["doc_id"] = doc_id
                    chunk.metadata["source"] = filename
                    if "page" not in chunk.metadata:
                        chunk.metadata["page"] = 0
                all_chunks.extend(chunks)
            except Exception:
                continue
    return all_chunks
