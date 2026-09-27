import React from 'react';
import {
  FileText,
  MessageSquare,
  FileSpreadsheet,
  GraduationCap,
  Upload,
  ArrowRight,
  Database,
  Cpu,
  Layers,
  Sparkles,
} from 'lucide-react';

export default function DashboardPage({
  documents,
  onNavigate,
  onSelectDocForChat,
  onUploadClick,
  systemStatus,
}) {
  return (
    <div className="flex-1 overflow-y-auto p-8 max-w-5xl mx-auto space-y-8">
      {/* Welcome header */}
      <div className="border-b border-zinc-200 pb-6">
        <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">
          Good to see you
        </h1>
        <p className="text-sm text-zinc-500 mt-1.5 leading-relaxed">
          <strong className="font-semibold text-zinc-700">ContextIQ</strong> — intelligent answers based on your context. Indexes your documents into a local FAISS vector store and uses Qwen3 to answer questions, cite source pages, and generate tailored study material.
        </p>

        {/* Quick action strip */}
        <div className="flex flex-wrap items-center gap-2.5 mt-5">
          <button
            onClick={() => onNavigate('chat')}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800 transition-colors shadow-2xs"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Open Chat</span>
          </button>
          <button
            onClick={onUploadClick}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-white border border-zinc-200 text-zinc-700 text-xs font-medium hover:bg-zinc-50 hover:border-zinc-300 transition-colors shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5 text-zinc-500" />
            <span>Upload Document</span>
          </button>
          <button
            onClick={() => onNavigate('summaries')}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-white border border-zinc-200 text-zinc-700 text-xs font-medium hover:bg-zinc-50 hover:border-zinc-300 transition-colors shadow-2xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-zinc-500" />
            <span>Summarize Notes</span>
          </button>
          <button
            onClick={() => onNavigate('practice')}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-white border border-zinc-200 text-zinc-700 text-xs font-medium hover:bg-zinc-50 hover:border-zinc-300 transition-colors shadow-2xs"
          >
            <GraduationCap className="w-3.5 h-3.5 text-zinc-500" />
            <span>Practice Questions</span>
          </button>
        </div>
      </div>

      {/* Recent Documents */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">Recent Documents</h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Available in the vector database for grounded retrieval
            </p>
          </div>
          <button
            onClick={() => onNavigate('documents')}
            className="text-xs font-medium text-zinc-600 hover:text-zinc-900 inline-flex items-center gap-1 transition-colors"
          >
            View all
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {documents.length === 0 ? (
          <div className="bg-white border border-dashed border-zinc-300 rounded-lg p-8 text-center">
            <FileText className="w-9 h-9 mx-auto text-zinc-300 mb-3 stroke-[1.5]" />
            <h3 className="text-sm font-medium text-zinc-800">No documents indexed yet</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1 mb-4 leading-relaxed">
              Upload study PDFs or lecture notes to populate your knowledge base and enable Q&A retrieval.
            </p>
            <button
              onClick={onUploadClick}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800 transition-colors shadow-2xs"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload PDF or Notes
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documents.slice(0, 4).map((doc) => (
              <div
                key={doc.id}
                className="bg-white border border-zinc-200 rounded-lg p-4 hover:border-zinc-300 transition-colors shadow-2xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded bg-zinc-100 text-zinc-700">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-zinc-900 line-clamp-1" title={doc.filename}>
                          {doc.filename}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-zinc-500">
                          <span className="font-medium text-zinc-700">
                            {doc.page_count} {doc.page_count === 1 ? 'page' : 'pages'}
                          </span>
                          <span>•</span>
                          <span>{doc.chunk_count || 0} chunks</span>
                          <span>•</span>
                          <span className="uppercase text-[10px] font-mono px-1 rounded bg-zinc-100">
                            {doc.file_type}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-zinc-400">
                    {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : 'Active'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectDocForChat(doc.id)}
                      className="px-2.5 py-1 text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 rounded text-xs font-medium transition-colors"
                    >
                      Ask Questions
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Architecture and Verified Pipeline Details */}
      <div className="bg-zinc-50/70 border border-zinc-200 rounded-lg p-5">
        <h3 className="text-xs font-semibold text-zinc-800 uppercase tracking-wider mb-3">
          Pipeline Architecture
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-white p-3 rounded border border-zinc-200/80">
            <div className="flex items-center gap-2 text-zinc-500 mb-1">
              <Layers className="w-3.5 h-3.5 text-zinc-700" />
              <span className="font-medium text-zinc-700">Embeddings</span>
            </div>
            <div className="font-mono text-zinc-900 font-medium text-[11px]">
              {systemStatus?.embedding_model || 'Qwen/Qwen3-Embedding-0.6B'}
            </div>
            <div className="text-[11px] text-zinc-400 mt-1">
              Running on {systemStatus?.device || 'CPU'}
            </div>
          </div>

          <div className="bg-white p-3 rounded border border-zinc-200/80">
            <div className="flex items-center gap-2 text-zinc-500 mb-1">
              <Database className="w-3.5 h-3.5 text-zinc-700" />
              <span className="font-medium text-zinc-700">Vector Store</span>
            </div>
            <div className="font-mono text-zinc-900 font-medium text-[11px]">
              {systemStatus?.vector_store || 'FAISS (Local Index)'}
            </div>
            <div className="text-[11px] text-zinc-400 mt-1">
              {systemStatus?.total_chunks || 0} vectorized chunks
            </div>
          </div>

          <div className="bg-white p-3 rounded border border-zinc-200/80">
            <div className="flex items-center gap-2 text-zinc-500 mb-1">
              <Cpu className="w-3.5 h-3.5 text-zinc-700" />
              <span className="font-medium text-zinc-700">Language Model</span>
            </div>
            <div className="font-mono text-zinc-900 font-medium text-[11px]">
              {systemStatus?.llm_model || 'Qwen/Qwen3-8B'}
            </div>
            <div className="text-[11px] text-zinc-400 mt-1">
              InferenceClient / temperature 0.1
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
