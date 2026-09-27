# ContextIQ — Intelligent Answers Based On Your Context

ContextIQ is a polished, production-grade learning and research assistant powered by Retrieval-Augmented Generation (RAG). It enables users to upload study documents (PDFs, Markdown, text notes), ask deep questions grounded strictly in their material, inspect exact page-level citations in a collapsible source drawer, manage persistent chat sessions with full ChatGPT-like conversation history, generate multi-style study summaries, and practice with auto-generated problem sets.

The core retrieval and inference logic builds upon the original LangChain, FAISS, and Qwen pipeline, wrapped cleanly in a high-performance FastAPI service and paired with a calm, modern developer-focused React interface.

---

## Architecture Overview

```
contextiq/
├── frontend/                     # React + Vite + Tailwind CSS interface
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.jsx       # Workspace navigation & connection status
│   │   │   └── SourcePanel.jsx   # Collapsible retrieved passage drawer
│   │   ├── pages/
│   │   │   ├── DashboardPage.jsx # Recent docs, pipeline specs, quick actions
│   │   │   ├── ChatPage.jsx      # Grounded Q&A conversation & source cards
│   │   │   ├── DocumentsPage.jsx # Document manifest table & upload/delete
│   │   │   ├── SummariesPage.jsx # Multi-format document summarization
│   │   │   ├── PracticePage.jsx  # Dynamic practice problem set generator
│   │   │   └── SettingsPage.jsx  # Model specifications & token management
│   │   ├── services/
│   │   │   └── api.js            # Centralized typed fetch client
│   │   ├── App.jsx               # Tab router & centralized state
│   │   ├── index.css             # Tailwind base & custom scrollbar
│   │   └── main.jsx
│   ├── vite.config.js            # Dev server with reverse proxy for /api
│   └── package.json
│
├── backend/                      # Python FastAPI application
│   ├── app/
│   │   ├── api/
│   │   │   ├── chat.py           # POST /api/chat
│   │   │   ├── documents.py      # GET/POST/DELETE /api/documents
│   │   │   ├── summaries.py      # POST /api/summarize
│   │   │   ├── practice.py       # POST /api/practice
│   │   │   └── settings.py       # GET/POST /api/settings
│   │   ├── rag/
│   │   │   ├── pipeline.py       # Embeddings, FAISS retriever & Qwen3-8B client
│   │   │   └── document_store.py # PyPDFLoader / Text chunker & manifest
│   │   ├── config.py             # Environment configuration & directory paths
│   │   └── main.py               # FastAPI entry point & CORS
│   ├── data/
│   │   ├── documents/            # Uploaded files
│   │   └── faiss_index/          # Persistent FAISS index files
│   ├── requirements.txt
│   ├── run.py                    # Uvicorn runner
│   └── .env.example
│
├── original_rag.py               # Preserved reference of the initial Colab script
├── rag_using_langchain.py        # Original working pipeline script
├── README.md
└── .gitignore
```

---

## Technical Specifications

- **Language Model (LLM):** `Qwen/Qwen3-8B` via Hugging Face `InferenceClient` (temperature: 0.1 for high precision, zero hallucination prompt guardrails).
- **Embedding Model:** `sentence-transformers/all-MiniLM-L6-v2` (default, fast CPU execution) or `Qwen/Qwen3-Embedding-0.6B` with normalized embeddings.
- **Vector Store:** Local persistent `FAISS` index (`faiss-cpu`), saved and loaded from disk across restarts.
- **Document Chunking:** `RecursiveCharacterTextSplitter` (chunk size: 1000 characters, overlap: 200 characters) preserving source filename and 1-indexed page metadata.
- **Backend API:** FastAPI with asynchronous routes, Pydantic request/response validation, and sanitized error messages.
- **Frontend:** React 19, Vite, Tailwind CSS, Lucide React icons.

---

## Getting Started

### Prerequisites
- **Python 3.10+** (64-bit)
- **Node.js 18+** and **npm**
- A free Hugging Face User Access Token (from [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens))

---

### 1. Backend Setup

1. Open a terminal in the project directory:
   ```bash
   cd backend
   ```

2. Create and activate a virtual environment (recommended):
   ```bash
   # Windows PowerShell
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # macOS / Linux
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Open `.env` and set your Hugging Face API key:
   ```env
   HF_TOKEN=hf_your_actual_token_here
   EMBEDDING_MODEL_NAME=sentence-transformers/all-MiniLM-L6-v2
   LLM_MODEL_NAME=Qwen/Qwen3-8B
   BACKEND_HOST=127.0.0.1
   BACKEND_PORT=8000
   ```

5. Run the FastAPI backend:
   ```bash
   python run.py
   ```
   The backend will start at `http://127.0.0.1:8000`. You can inspect the interactive OpenAPI documentation at `http://127.0.0.1:8000/docs`.

---

### 2. Frontend Setup

1. In a separate terminal, navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   Open `http://127.0.0.1:5173/` in your browser.

---

## Features & Walkthrough

### 1. Dashboard
- Displays recent study materials with verified page counts and vectorized chunk totals.
- Shows real-time pipeline status (active embedding model, FAISS index vector count, computation device).
- Quick navigation shortcuts into chat, documents, and practice modes.

### 2. Grounded Chat (RAG)
- Supports natural questions about your documents (e.g., *"What is the difference between an LLM and traditional machine learning?"*).
- System prompt strictly confines answers to the retrieved context with a standard fallback when information is absent.
- Displays clickable source citation cards underneath each response indicating the exact document name, page number, and quote snippet.
- Includes a collapsible right-side drawer for deep inspection of retrieved passages.
- Supports document filtering (query all documents or lock onto a specific text).

### 3. Documents Management
- Table view displaying filename, file format (`PDF`, `MD`, `TXT`), page count, chunk count, and upload date.
- Real document upload endpoint (`POST /api/documents/upload`): parses files, computes embeddings, and updates the FAISS index immediately.
- Document removal with automatic FAISS index synchronization.

### 4. Document Summaries
- Allows selecting any indexed document.
- Choose between three formats:
  - **Comprehensive Overview:** Major themes and concepts.
  - **Key Points & Definitions:** Core takeaways in bullet points.
  - **Executive Study Guide:** Review notes, formulas, and frameworks.

### 5. Practice & Self-Test
- Generate custom review problem sets from your uploaded material.
- Configurable question counts (3, 5, 10), difficulty levels (*Easy*, *Medium*, *Hard*), and formats (*Multiple Choice* or *Short Answer*).

### 6. Settings
- Real-time verification of backend connectivity, embedding model, and vector store.
- Secure Hugging Face token configuration without exposing secrets to client code.

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Healthcheck and service identifier |
| `GET` | `/api/documents` | List all indexed documents and metadata |
| `POST` | `/api/documents/upload` | Upload & vectorize a PDF, MD, or TXT file |
| `DELETE` | `/api/documents/{id}` | Delete a document and rebuild FAISS index |
| `POST` | `/api/chat` | Query RAG pipeline; returns answer and source citations |
| `POST` | `/api/summarize` | Generate structured summary for a document |
| `POST` | `/api/practice` | Generate practice questions from document chunks |
| `GET` | `/api/settings` | Inspect model names, FAISS status, and token state |
| `POST` | `/api/settings/token` | Update Hugging Face API access token |

---

## Security & Best Practices

- **Zero Secret Leakage:** API keys are never bundled in frontend JavaScript. All LLM calls pass through the FastAPI backend.
- **Sanitized Errors:** Internal Python stack traces are intercepted and replaced with human-readable error messages for missing keys, network timeouts, or rate limits.
- **Local FAISS Persistence:** Vector embeddings are stored on disk under `backend/data/faiss_index/` and reloaded automatically across application restarts.
