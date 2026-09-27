import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Loader2,
  Copy,
  Check,
  AlertCircle,
  FileText,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';

export default function SummariesPage({ documents, preselectedDocId }) {
  const [selectedDocId, setSelectedDocId] = useState(preselectedDocId || (documents[0]?.id || ''));
  const [style, setStyle] = useState('comprehensive');
  const [summary, setSummary] = useState('');
  const [currentDocName, setCurrentDocName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!selectedDocId) return;
    setIsLoading(true);
    setError(null);
    setSummary('');

    try {
      const res = await api.generateSummary(selectedDocId, style);
      setSummary(res.summary);
      setCurrentDocName(res.document_name);
    } catch (err) {
      setError(err.message || 'Failed to generate summary.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-zinc-200 pb-5">
        <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">
          Document Summaries
        </h1>
        <p className="text-xs text-zinc-500 mt-1">
          Synthesize key concepts, takeaways, and study notes from your indexed materials using Qwen3.
        </p>
      </div>

      {documents.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-lg p-8 text-center text-zinc-400">
          <FileText className="w-8 h-8 mx-auto text-zinc-300 mb-2 stroke-[1.5]" />
          <h3 className="text-xs font-semibold text-zinc-700">No documents found</h3>
          <p className="text-[11px] text-zinc-400 mt-1 max-w-xs mx-auto">
            Please upload a document in the Documents section before generating a summary.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="bg-white border border-zinc-200 rounded-lg p-5 shadow-2xs space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                  Select Document
                </label>
                <select
                  value={selectedDocId}
                  onChange={(e) => setSelectedDocId(e.target.value)}
                  className="w-full bg-white border border-zinc-200 rounded-md py-2 px-3 text-xs text-zinc-800 focus:outline-none focus:border-zinc-400 transition-colors"
                >
                  {documents.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.filename} ({doc.page_count} pages)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                  Summary Format
                </label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="w-full bg-white border border-zinc-200 rounded-md py-2 px-3 text-xs text-zinc-800 focus:outline-none focus:border-zinc-400 transition-colors"
                >
                  <option value="comprehensive">Comprehensive Overview (Major Themes)</option>
                  <option value="key_points">Key Points & Core Takeaways</option>
                  <option value="study_guide">Executive Study Guide (Definitions & Formulas)</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleGenerate}
                disabled={isLoading || !selectedDocId}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800 disabled:bg-zinc-300 transition-colors shadow-2xs"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing & Summarizing...</span>
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Generate Summary</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Error notification */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Result card */}
          {summary && (
            <div className="bg-white border border-zinc-200 rounded-lg p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <div>
                  <h3 className="text-xs font-semibold text-zinc-900">
                    Summary: {currentDocName}
                  </h3>
                  <span className="text-[11px] text-zinc-400 capitalize">
                    Style: {style.replace('_', ' ')}
                  </span>
                </div>
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-zinc-600 hover:text-zinc-900 border border-zinc-200 hover:bg-zinc-50 rounded transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy text</span>
                    </>
                  )}
                </button>
              </div>

              <div className="text-xs md:text-[13px] text-zinc-800 leading-relaxed whitespace-pre-wrap font-sans">
                {summary}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
