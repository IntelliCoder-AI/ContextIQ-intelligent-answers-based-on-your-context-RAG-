import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  Trash2,
  MessageSquare,
  FileSpreadsheet,
  GraduationCap,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Search,
} from 'lucide-react';

export default function DocumentsPage({
  documents,
  onUploadFile,
  onDeleteDocument,
  onSelectDocForChat,
  onNavigate,
  isUploading,
  uploadError,
  uploadSuccess,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const fileInputRef = useRef(null);

  const filteredDocs = documents.filter((d) =>
    d.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadFile(file);
      e.target.value = '';
    }
  };

  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const handleConfirmDelete = async (docId) => {
    setDeletingId(docId);
    setConfirmDeleteId(null);
    try {
      await onDeleteDocument(docId);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">Documents</h1>
          <p className="text-xs text-zinc-500 mt-1">
            Manage files indexed in your FAISS vector database for retrieval-augmented generation.
          </p>
        </div>

        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.txt,.md"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800 disabled:bg-zinc-300 transition-colors shadow-2xs"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Processing & Vectorizing...</span>
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Document</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Upload Feedback */}
      {uploadError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {uploadSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md flex items-center gap-2 text-xs text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{uploadSuccess}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents by name..."
            className="w-full pl-9 pr-3 py-1.5 rounded-md border border-zinc-200 bg-white text-xs text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 transition-colors shadow-2xs"
          />
        </div>

        <div className="text-xs text-zinc-500 font-medium">
          {documents.length} document{documents.length === 1 ? '' : 's'} available
        </div>
      </div>

      {/* Document List Table */}
      <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden shadow-2xs">
        {filteredDocs.length === 0 ? (
          <div className="p-10 text-center text-zinc-400">
            <FileText className="w-8 h-8 mx-auto text-zinc-300 mb-2 stroke-[1.5]" />
            <p className="text-xs font-medium text-zinc-600">
              {searchQuery ? 'No documents match your search.' : 'No documents uploaded yet.'}
            </p>
            <p className="text-[11px] text-zinc-400 mt-1 max-w-xs mx-auto">
              {searchQuery
                ? 'Try a different search keyword.'
                : 'Click "Upload Document" above to upload a PDF or study text.'}
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-50/70 border-b border-zinc-200 text-zinc-500 text-[11px] font-semibold uppercase tracking-wider">
                <th className="py-2.5 px-4">Document</th>
                <th className="py-2.5 px-4">Type</th>
                <th className="py-2.5 px-4">Pages</th>
                <th className="py-2.5 px-4">Chunks</th>
                <th className="py-2.5 px-4">Uploaded</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredDocs.map((doc) => (
                <tr key={doc.id} className="hover:bg-zinc-50/50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded bg-zinc-100 text-zinc-600">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-medium text-zinc-900 truncate max-w-xs" title={doc.filename}>
                        {doc.filename}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-zinc-500">
                    <span className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700">
                      {doc.file_type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-zinc-600">
                    {doc.page_count} {doc.page_count === 1 ? 'page' : 'pages'}
                  </td>
                  <td className="py-3 px-4 text-zinc-500 font-mono text-[11px]">
                    {doc.chunk_count}
                  </td>
                  <td className="py-3 px-4 text-zinc-400 text-[11px]">
                    {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {confirmDeleteId === doc.id ? (
                        <div className="flex items-center gap-2 bg-red-50 text-red-700 px-2.5 py-1 rounded-md border border-red-200 text-[11px] animate-in fade-in">
                          <span className="font-medium">Delete?</span>
                          <button
                            onClick={() => handleConfirmDelete(doc.id)}
                            className="font-bold text-red-700 hover:text-red-900 underline cursor-pointer"
                          >
                            Yes
                          </button>
                          <span className="text-zinc-300">|</span>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="text-zinc-600 hover:text-zinc-900 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => onSelectDocForChat(doc.id)}
                            className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded transition-colors"
                            title="Ask questions in Chat"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onNavigate('summaries', doc.id)}
                            className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded transition-colors"
                            title="Summarize document"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onNavigate('practice', doc.id)}
                            className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded transition-colors"
                            title="Practice questions"
                          >
                            <GraduationCap className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(doc.id)}
                            disabled={deletingId === doc.id}
                            className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete from knowledge base"
                          >
                            {deletingId === doc.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Supported formats note */}
      <div className="text-[11px] text-zinc-400 text-center">
        Supported file formats: PDF (.pdf), Text (.txt), Markdown (.md). Text chunks are parsed with RecursiveCharacterTextSplitter (1000 char chunks, 200 overlap).
      </div>
    </div>
  );
}
