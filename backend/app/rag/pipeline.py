import os
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple

import torch
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.documents import Document
from huggingface_hub import InferenceClient

from app.config import (
    HF_TOKEN,
    EMBEDDING_MODEL_NAME,
    LLM_MODEL_NAME,
    DEVICE_CONFIG,
    INDEX_DIR,
)
from app.rag.document_store import get_all_chunks_from_storage

_embedding_model: Optional[HuggingFaceEmbeddings] = None
_vectorstore: Optional[FAISS] = None


def get_device() -> str:
    if DEVICE_CONFIG in ("cuda", "cpu"):
        return DEVICE_CONFIG
    return "cuda" if torch.cuda.is_available() else "cpu"


def get_embedding_model() -> HuggingFaceEmbeddings:
    global _embedding_model
    if _embedding_model is None:
        device = get_device()
        _embedding_model = HuggingFaceEmbeddings(
            model_name=EMBEDDING_MODEL_NAME,
            model_kwargs={"device": device},
            encode_kwargs={"normalize_embeddings": True},
        )
    return _embedding_model


def get_vectorstore() -> Optional[FAISS]:
    global _vectorstore
    if _vectorstore is not None:
        return _vectorstore

    index_file = INDEX_DIR / "index.faiss"
    if index_file.exists():
        try:
            embeddings = get_embedding_model()
            _vectorstore = FAISS.load_local(
                str(INDEX_DIR),
                embeddings=embeddings,
                allow_dangerous_deserialization=True,
            )
            return _vectorstore
        except Exception:
            _vectorstore = None

    chunks = get_all_chunks_from_storage()
    if chunks:
        embeddings = get_embedding_model()
        _vectorstore = FAISS.from_documents(chunks, embedding=embeddings)
        _vectorstore.save_local(str(INDEX_DIR))
        return _vectorstore

    return None


def add_chunks_to_vectorstore(chunks: List[Document]) -> None:
    global _vectorstore
    if not chunks:
        return

    embeddings = get_embedding_model()
    if _vectorstore is None:
        vs = get_vectorstore()
        if vs is None:
            _vectorstore = FAISS.from_documents(chunks, embedding=embeddings)
            _vectorstore.save_local(str(INDEX_DIR))
            return

    _vectorstore.add_documents(chunks)
    _vectorstore.save_local(str(INDEX_DIR))


def rebuild_vectorstore() -> None:
    global _vectorstore
    chunks = get_all_chunks_from_storage()
    if not chunks:
        _vectorstore = None
        for file in INDEX_DIR.glob("*"):
            if file.name != ".gitkeep":
                try:
                    file.unlink()
                except OSError:
                    pass
        return

    embeddings = get_embedding_model()
    _vectorstore = FAISS.from_documents(chunks, embedding=embeddings)
    _vectorstore.save_local(str(INDEX_DIR))


def delete_document_from_vectorstore(doc_id: str) -> None:
    global _vectorstore
    vs = get_vectorstore()
    if vs is None:
        return

    # Find all chunk IDs corresponding to this doc_id
    ids_to_remove = [
        k for k, v in vs.docstore._dict.items()
        if v.metadata.get("doc_id") == doc_id
    ]

    if ids_to_remove:
        try:
            vs.delete(ids_to_remove)
            vs.save_local(str(INDEX_DIR))
            return
        except Exception:
            pass

    # If no documents are left in storage, clean index
    chunks = get_all_chunks_from_storage()
    if not chunks:
        _vectorstore = None
        for file in INDEX_DIR.glob("*"):
            if file.name != ".gitkeep":
                try:
                    file.unlink()
                except OSError:
                    pass
        return

    # Fallback to rebuild if specific deletion was not supported
    rebuild_vectorstore()


import time


def _call_llm_with_retry(
    messages: List[Dict[str, str]],
    token_override: Optional[str] = None,
    max_tokens: int = 2048,
    temperature: float = 0.1,
) -> str:
    token = token_override or os.getenv("HF_TOKEN") or HF_TOKEN
    if not token or token == "your_huggingface_api_token_here":
        raise ValueError(
            "Hugging Face API token is not configured. Please set your HF_TOKEN in Settings or in backend/.env"
        )

    last_error = None
    for provider in ["auto", None]:
        try:
            client = InferenceClient(token=token, provider=provider)
        except Exception:
            continue

        for attempt in range(2):
            try:
                try:
                    response = client.chat.completions.create(
                        model=LLM_MODEL_NAME,
                        messages=messages,
                        temperature=temperature,
                        max_tokens=max_tokens,
                        extra_body={"chat_template_kwargs": {"enable_thinking": False}},
                    )
                except Exception:
                    response = client.chat.completions.create(
                        model=LLM_MODEL_NAME,
                        messages=messages,
                        temperature=temperature,
                        max_tokens=max_tokens,
                    )

                msg = response.choices[0].message
                content = msg.content
                if not content and hasattr(msg, "reasoning_content") and msg.reasoning_content:
                    content = msg.reasoning_content

                if content and content.strip():
                    return content.strip()
            except Exception as e:
                last_error = e
                err_str = str(e).lower()
                if "unreachable" in err_str or "503" in err_str or "504" in err_str or "loading" in err_str:
                    time.sleep(1.5)
                    continue
                break

    raise RuntimeError(
        f"The model ({LLM_MODEL_NAME}) is temporarily unreachable on Hugging Face. {last_error}"
    )


def ask_rag(
    question: str,
    document_id: Optional[str] = None,
    token_override: Optional[str] = None,
) -> Tuple[str, List[Dict[str, Any]]]:
    vectorstore = get_vectorstore()
    if vectorstore is None:
        return (
            "No documents have been indexed yet. Please upload a PDF or document in the Documents tab to start asking questions.",
            [],
        )

    retriever = vectorstore.as_retriever(
        search_type="similarity",
        search_kwargs={"k": 5},
    )

    retrieved_docs: List[Document] = retriever.invoke(question)

    if document_id:
        filtered = [
            doc for doc in retrieved_docs if doc.metadata.get("doc_id") == document_id
        ]
        if filtered:
            retrieved_docs = filtered

    if not retrieved_docs:
        return (
            "I couldn't find any relevant sections in your documents for this question.",
            [],
        )

    context_parts = []
    sources = []

    for doc in retrieved_docs:
        page = doc.metadata.get("page", 0)
        source = doc.metadata.get("source", "Document")
        page_num = page + 1 if isinstance(page, int) else 1

        context_parts.append(
            f"Source: {source}\nPage: {page_num}\n\nContent:\n{doc.page_content}\n"
        )

        sources.append(
            {
                "document": source,
                "page": page_num,
                "content": doc.page_content.strip(),
            }
        )

    context = "\n\n".join(context_parts)

    prompt = f"""You are a personal learning assistant.

Answer the user's question using ONLY the
information contained in the provided context.

Rules:

1. Do not use outside knowledge.
2. Do not invent information.
3. If the answer is not present in the context,
   say exactly:

   "I couldn't find the answer in the uploaded material."

4. Explain technical concepts clearly.
5. Prefer simple language.
6. When possible, mention the relevant source page.

CONTEXT
================================

{context}

================================

USER QUESTION
================================

{question}

================================

ANSWER
"""

    messages = [
        {
            "role": "system",
            "content": "You are a precise RAG-based learning assistant.",
        },
        {"role": "user", "content": prompt},
    ]

    answer = _call_llm_with_retry(
        messages=messages,
        token_override=token_override,
        max_tokens=1500,
        temperature=0.1,
    )

    return answer, sources


def generate_summary(
    document_id: str,
    style: str = "comprehensive",
    token_override: Optional[str] = None,
) -> str:
    chunks = [
        c
        for c in get_all_chunks_from_storage()
        if c.metadata.get("doc_id") == document_id
    ]
    if not chunks:
        raise ValueError("Selected document has no extractable content or does not exist.")

    sampled_chunks = chunks[:8]
    combined_content = "\n\n---\n\n".join(
        [f"[Page {c.metadata.get('page', 0) + 1}]\n{c.page_content}" for c in sampled_chunks]
    )

    style_instruction = {
        "comprehensive": "Provide a comprehensive overview with key themes, main arguments, and major takeaways.",
        "key_points": "Provide a bulleted list of the top key takeaways and core concepts.",
        "study_guide": "Format as an executive study guide with core definitions, formulas/frameworks, and review notes.",
    }.get(style, "Provide an overview of the key concepts.")

    prompt = f"""You are an expert academic tutor and study assistant.
Summarize the following document excerpt following this style instruction:
{style_instruction}

Document Content:
{combined_content}

Structure your response with clear markdown headings, concise bullet points, and highlight critical terminology.
"""

    return _call_llm_with_retry(
        messages=[
            {"role": "system", "content": "You create clear, structured, high-value study summaries."},
            {"role": "user", "content": prompt},
        ],
        token_override=token_override,
        max_tokens=1500,
        temperature=0.2,
    )


def generate_practice(
    document_id: str,
    num_questions: int = 5,
    difficulty: str = "Medium",
    question_type: str = "Multiple choice",
    token_override: Optional[str] = None,
) -> str:
    chunks = [
        c
        for c in get_all_chunks_from_storage()
        if c.metadata.get("doc_id") == document_id
    ]
    if not chunks:
        raise ValueError("Selected document has no extractable content or does not exist.")

    sampled_chunks = chunks[:8]
    combined_content = "\n\n---\n\n".join(
        [f"[Page {c.metadata.get('page', 0) + 1}]\n{c.page_content}" for c in sampled_chunks]
    )

    prompt = f"""You are an educational assessment expert.
Based strictly on the document text provided below, generate {num_questions} practice questions.

Difficulty: {difficulty}
Question Type: {question_type}

Document excerpt:
{combined_content}

Instructions:
1. For Multiple Choice: Provide 4 options (A, B, C, D), clearly specify the correct answer, and provide a 1-sentence rationale referencing the source.
2. For Short Answer: Provide the question, a model answer, and key criteria for full credit.
3. Format output cleanly in Markdown with bold questions and clean spacing.
"""

    return _call_llm_with_retry(
        messages=[
            {"role": "system", "content": "You generate high quality academic practice questions."},
            {"role": "user", "content": prompt},
        ],
        token_override=token_override,
        max_tokens=1500,
        temperature=0.3,
    )
