import React, { useState } from 'react';
import {
  GraduationCap,
  Loader2,
  AlertCircle,
  FileText,
  Copy,
  Check,
  HelpCircle,
} from 'lucide-react';
import { api } from '../services/api';

export default function PracticePage({ documents, preselectedDocId }) {
  const [selectedDocId, setSelectedDocId] = useState(preselectedDocId || (documents[0]?.id || ''));
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState('Medium');
  const [questionType, setQuestionType] = useState('Multiple choice');
  const [practiceContent, setPracticeContent] = useState('');
  const [currentDocName, setCurrentDocName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!selectedDocId) return;
    setIsLoading(true);
    setError(null);
    setPracticeContent('');

    try {
      const res = await api.generatePractice({
        documentId: selectedDocId,
        numQuestions: parseInt(numQuestions, 10),
        difficulty,
        questionType,
      });
      setPracticeContent(res.content);
      setCurrentDocName(res.document_name);
    } catch (err) {
      setError(err.message || 'Failed to generate practice test.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!practiceContent) return;
    navigator.clipboard.writeText(practiceContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-zinc-200 pb-5">
        <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">
          Practice & Self-Test
        </h1>
        <p className="text-xs text-zinc-500 mt-1">
          Generate realistic practice questions and review problem sets derived strictly from your course material.
        </p>
      </div>

      {documents.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-lg p-8 text-center text-zinc-400">
          <FileText className="w-8 h-8 mx-auto text-zinc-300 mb-2 stroke-[1.5]" />
          <h3 className="text-xs font-semibold text-zinc-700">No documents found</h3>
          <p className="text-[11px] text-zinc-400 mt-1 max-w-xs mx-auto">
            Please upload study material before generating practice questions.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="bg-white border border-zinc-200 rounded-lg p-5 shadow-2xs space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                  Target Document
                </label>
                <select
                  value={selectedDocId}
                  onChange={(e) => setSelectedDocId(e.target.value)}
                  className="w-full bg-white border border-zinc-200 rounded-md py-2 px-2.5 text-xs text-zinc-800 focus:outline-none focus:border-zinc-400 transition-colors"
                >
                  {documents.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.filename}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                  Number of Questions
                </label>
                <select
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(e.target.value)}
                  className="w-full bg-white border border-zinc-200 rounded-md py-2 px-2.5 text-xs text-zinc-800 focus:outline-none focus:border-zinc-400 transition-colors"
                >
                  <option value={3}>3 questions (Quick check)</option>
                  <option value={5}>5 questions (Standard drill)</option>
                  <option value={10}>10 questions (Deep test)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                  Difficulty Level
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full bg-white border border-zinc-200 rounded-md py-2 px-2.5 text-xs text-zinc-800 focus:outline-none focus:border-zinc-400 transition-colors"
                >
                  <option value="Easy">Easy (Recall & terms)</option>
                  <option value="Medium">Medium (Application)</option>
                  <option value="Hard">Hard (Analysis & nuance)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                  Question Format
                </label>
                <select
                  value={questionType}
                  onChange={(e) => setQuestionType(e.target.value)}
                  className="w-full bg-white border border-zinc-200 rounded-md py-2 px-2.5 text-xs text-zinc-800 focus:outline-none focus:border-zinc-400 transition-colors"
                >
                  <option value="Multiple choice">Multiple Choice</option>
                  <option value="Short answer">Short Answer</option>
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
                    <span>Generating Practice Set...</span>
                  </>
                ) : (
                  <>
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>Generate Practice Questions</span>
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

          {/* Result view */}
          {practiceContent && (
            <div className="bg-white border border-zinc-200 rounded-lg p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <div>
                  <h3 className="text-xs font-semibold text-zinc-900">
                    Practice Drill: {currentDocName}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
                    <span>{difficulty}</span>
                    <span>•</span>
                    <span>{questionType}</span>
                    <span>•</span>
                    <span>{numQuestions} Questions</span>
                  </div>
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
                      <span>Copy test</span>
                    </>
                  )}
                </button>
              </div>

              <div className="text-xs md:text-[13px] text-zinc-800 leading-relaxed whitespace-pre-wrap font-sans">
                {practiceContent}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
