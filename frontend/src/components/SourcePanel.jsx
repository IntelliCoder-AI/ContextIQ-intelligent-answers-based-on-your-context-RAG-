import React, { useState } from 'react';
import { X, ExternalLink, Copy, Check, FileText } from 'lucide-react';

export default function SourcePanel({ sources, isOpen, onClose, selectedDocName }) {
  const [copiedIndex, setCopiedIndex] = useState(null);

  if (!isOpen) return null;

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 1800);
  };

  return (
    <aside className="w-80 border-l border-zinc-200 bg-[#fcfcfd] flex flex-col h-full animate-in slide-in-from-right duration-200 select-none">
      <div className="h-14 px-4 border-b border-zinc-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-zinc-500" />
          <h3 className="text-xs font-semibold text-zinc-800 uppercase tracking-wider">
            Retrieved Sources
          </h3>
          <span className="text-[11px] font-mono bg-zinc-200/70 text-zinc-700 px-1.5 py-0.5 rounded-full">
            {sources.length}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-md transition-colors"
          title="Close panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {sources.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-400">
            <FileText className="w-8 h-8 mb-2 stroke-[1.5] text-zinc-300" />
            <p className="text-xs font-medium text-zinc-600">No sources retrieved yet</p>
            <p className="text-[11px] text-zinc-400 mt-1">
              Ask a question about your uploaded documents to view matched passages.
            </p>
          </div>
        ) : (
          sources.map((source, idx) => (
            <div
              key={idx}
              className="bg-white border border-zinc-200 rounded-lg p-3 text-xs shadow-2xs hover:border-zinc-300 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-zinc-800 truncate max-w-[170px]" title={source.document}>
                  {source.document}
                </span>
                <span className="px-2 py-0.5 rounded bg-zinc-100 font-mono text-[10px] font-medium text-zinc-600">
                  Page {source.page}
                </span>
              </div>

              <p className="text-zinc-600 leading-relaxed font-sans text-[12px] bg-zinc-50/70 p-2.5 rounded border border-zinc-100 font-normal">
                "{source.content}"
              </p>

              <div className="mt-2.5 flex items-center justify-end">
                <button
                  onClick={() => handleCopy(source.content, idx)}
                  className="inline-flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 hover:text-zinc-800 transition-colors py-1 px-1.5 rounded hover:bg-zinc-100"
                >
                  {copiedIndex === idx ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-600">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy snippet</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
