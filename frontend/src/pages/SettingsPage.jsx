import React, { useState, useEffect } from 'react';
import {
  Key,
  Database,
  Cpu,
  Layers,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../services/api';

export default function SettingsPage({ systemStatus, onRefreshStatus }) {
  const [tokenInput, setTokenInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    onRefreshStatus?.();
  }, []);

  const handleSaveToken = async (e) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;

    setIsSaving(true);
    setFeedback(null);

    try {
      await api.updateToken(tokenInput.trim());
      setFeedback({ type: 'success', message: 'Hugging Face API token saved successfully.' });
      setTokenInput('');
      onRefreshStatus();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update token.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-zinc-200 pb-5">
        <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">Settings</h1>
        <p className="text-xs text-zinc-500 mt-1">
          Inspect backend models, vector store status, and API configuration.
        </p>
      </div>

      {/* Model & Infrastructure Info */}
      <div className="bg-white border border-zinc-200 rounded-lg p-5 shadow-2xs space-y-4">
        <h2 className="text-xs font-semibold text-zinc-800 uppercase tracking-wider">
          Inference & Pipeline Specifications
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-md border border-zinc-100 bg-zinc-50/50">
            <div className="flex items-center gap-2 text-zinc-500 mb-1">
              <Cpu className="w-3.5 h-3.5 text-zinc-700" />
              <span className="font-medium text-zinc-700">Language Model (LLM)</span>
            </div>
            <div className="font-mono text-zinc-900 font-medium">
              {systemStatus?.llm_model || 'Qwen/Qwen3-8B'}
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">
              Accessed via Hugging Face InferenceClient
            </p>
          </div>

          <div className="p-3.5 rounded-md border border-zinc-100 bg-zinc-50/50">
            <div className="flex items-center gap-2 text-zinc-500 mb-1">
              <Layers className="w-3.5 h-3.5 text-zinc-700" />
              <span className="font-medium text-zinc-700">Embedding Model</span>
            </div>
            <div className="font-mono text-zinc-900 font-medium">
              {systemStatus?.embedding_model || 'Qwen/Qwen3-Embedding-0.6B'}
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">
              Normalized embeddings on {systemStatus?.device || 'CPU'}
            </p>
          </div>

          <div className="p-3.5 rounded-md border border-zinc-100 bg-zinc-50/50">
            <div className="flex items-center gap-2 text-zinc-500 mb-1">
              <Database className="w-3.5 h-3.5 text-zinc-700" />
              <span className="font-medium text-zinc-700">Vector Store</span>
            </div>
            <div className="font-mono text-zinc-900 font-medium">
              {systemStatus?.vector_store || 'FAISS (Local Disk Index)'}
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">
              {systemStatus?.total_chunks || 0} vectorized chunks across {systemStatus?.total_documents || 0} files
            </p>
          </div>

          <div className="p-3.5 rounded-md border border-zinc-100 bg-zinc-50/50">
            <div className="flex items-center gap-2 text-zinc-500 mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-zinc-700" />
              <span className="font-medium text-zinc-700">HF Token Status</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              {systemStatus?.is_hf_token_set ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-medium text-emerald-800">Active & Configured</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="font-medium text-amber-800">Not Configured</span>
                </>
              )}
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">
              Raw tokens are never exposed or returned to the client
            </p>
          </div>
        </div>
      </div>

      {/* Hugging Face Token Configuration */}
      <div className="bg-white border border-zinc-200 rounded-lg p-5 shadow-2xs space-y-4">
        <div>
          <h2 className="text-xs font-semibold text-zinc-800 uppercase tracking-wider">
            API Configuration
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            Provide your Hugging Face User Access Token with read permissions to query Qwen/Qwen3-8B.
          </p>
        </div>

        {feedback && (
          <div
            className={`p-3 rounded-md flex items-center gap-2 text-xs ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        <form onSubmit={handleSaveToken} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Hugging Face Access Token (HF_TOKEN)
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="hf_..."
                className="flex-1 px-3 py-2 text-xs border border-zinc-200 rounded-md bg-white focus:outline-none focus:border-zinc-400 font-mono transition-colors"
              />
              <button
                type="submit"
                disabled={isSaving || !tokenInput.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-md text-xs font-medium hover:bg-zinc-800 disabled:bg-zinc-300 transition-colors shadow-2xs"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Update Token</span>
                )}
              </button>
            </div>
          </div>
        </form>

        <div className="pt-2 text-[11px] text-zinc-400 flex items-center gap-1.5">
          <span>Need a free Hugging Face token?</span>
          <a
            href="https://huggingface.co/settings/tokens"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-700 hover:text-zinc-900 inline-flex items-center gap-0.5 font-medium underline underline-offset-2"
          >
            Generate one here
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
