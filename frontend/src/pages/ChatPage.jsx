import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Loader2,
  FileText,
  AlertCircle,
  PanelRightClose,
  PanelRightOpen,
  Filter,
  RefreshCw,
  Sparkles,
  BookOpen,
  Plus,
} from 'lucide-react';
import SourcePanel from '../components/SourcePanel';

export default function ChatPage({
  messages = [],
  onSendMessage,
  isLoading,
  error,
  documents = [],
  selectedDocId,
  setSelectedDocId,
  activeSources = [],
  onViewSourceInPanel,
  conversationTitle,
  onNewChat,
}) {
  const [input, setInput] = useState('');
  const [isSourcePanelOpen, setIsSourcePanelOpen] = useState(true);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim(), selectedDocId);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleInputResize = (e) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
  };

  const starterQuestions = [
    'What is the difference between an LLM and traditional machine learning?',
    'What are the core stages of training a modern transformer model?',
    'Explain how vector embeddings and similarity search work in RAG.',
  ];

  const selectedDocObj = documents.find((d) => d.id === selectedDocId);

  return (
    <div className="flex-1 flex overflow-hidden bg-white">
      {/* Center Conversation */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Chat Header Bar */}
        <div className="h-14 px-6 border-b border-zinc-200 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <h2 className="text-sm font-semibold text-zinc-900 truncate max-w-[240px]" title={conversationTitle || 'New Chat'}>
              {conversationTitle || 'Chat'}
            </h2>
            <div className="h-4 w-[1px] bg-zinc-200 shrink-0" />
            {/* Filter by document */}
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 shrink-0">
              <Filter className="w-3.5 h-3.5 text-zinc-400" />
              <select
                value={selectedDocId || ''}
                onChange={(e) => setSelectedDocId(e.target.value || null)}
                className="bg-transparent text-xs text-zinc-700 font-medium py-1 px-1.5 rounded border border-transparent hover:border-zinc-300 focus:border-zinc-400 focus:outline-none transition-colors max-w-[180px] truncate"
              >
                <option value="">All Documents ({documents.length})</option>
                {documents.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.filename}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onNewChat}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-zinc-700 hover:text-zinc-900 border border-zinc-200 hover:bg-zinc-50 transition-colors shadow-2xs cursor-pointer"
              title="Start a new chat"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Chat</span>
            </button>

            <button
              onClick={() => setIsSourcePanelOpen(!isSourcePanelOpen)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors border cursor-pointer ${
                isSourcePanelOpen
                  ? 'bg-zinc-100 text-zinc-900 border-zinc-300'
                  : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
              }`}
              title={isSourcePanelOpen ? 'Collapse source panel' : 'Open source panel'}
            >
              {isSourcePanelOpen ? (
                <>
                  <PanelRightClose className="w-3.5 h-3.5" />
                  <span>Hide Sources</span>
                </>
              ) : (
                <>
                  <PanelRightOpen className="w-3.5 h-3.5" />
                  <span>Sources ({activeSources.length})</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col justify-center items-center max-w-xl mx-auto text-center px-4 py-8">
              <div className="w-10 h-10 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-800 mb-4">
                <BookOpen className="w-5 h-5 stroke-[1.75]" />
              </div>
              <h3 className="text-base font-semibold text-zinc-900">
                Ask about your documents & context
              </h3>
              <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed max-w-md">
                Every query is retrieved against your indexed material. ContextIQ strictly grounds its answers on your text and cites matching pages.
              </p>

              <div className="w-full mt-6 space-y-2 text-left">
                <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider px-1">
                  Example questions
                </div>
                {starterQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInput(q);
                      textareaRef.current?.focus();
                    }}
                    className="w-full p-2.5 rounded-md border border-zinc-200 bg-zinc-50/50 hover:bg-zinc-100/70 hover:border-zinc-300 text-xs text-zinc-700 transition-colors text-left font-normal cursor-pointer"
                  >
                    "{q}"
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={index}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-2 mb-1 px-1">
                    <span className="text-[11px] font-medium text-zinc-400">
                      {isUser ? 'You' : 'ContextIQ'}
                    </span>
                    <span className="text-[10px] text-zinc-300 font-mono">
                      {msg.timestamp || ''}
                    </span>
                  </div>

                  <div
                    className={`max-w-2xl text-xs leading-relaxed rounded-lg p-3.5 ${
                      isUser
                        ? 'bg-zinc-900 text-white font-normal shadow-xs'
                        : 'bg-[#f8f9fa] border border-zinc-200 text-zinc-800'
                    }`}
                  >
                    <div className="whitespace-pre-wrap font-sans text-[13px] leading-relaxed">
                      {msg.content}
                    </div>

                    {/* Grounded Sources under assistant answer */}
                    {!isUser && msg.sources && msg.sources.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-zinc-200/80">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider">
                            Sources Cited
                          </span>
                          <span className="text-[10px] text-zinc-400">
                            {msg.sources.length} matching passage{msg.sources.length === 1 ? '' : 's'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {msg.sources.map((src, sIdx) => (
                            <div
                              key={sIdx}
                              onClick={() => {
                                onViewSourceInPanel(msg.sources);
                                setIsSourcePanelOpen(true);
                              }}
                              className="p-2 rounded bg-white border border-zinc-200 hover:border-zinc-300 transition-colors cursor-pointer group shadow-2xs"
                            >
                              <div className="flex items-center justify-between text-[11px] mb-1">
                                <span className="font-medium text-zinc-800 truncate max-w-[130px]" title={src.document}>
                                  {src.document}
                                </span>
                                <span className="px-1.5 py-0.2 rounded bg-zinc-100 font-mono text-[10px] text-zinc-600">
                                  p. {src.page}
                                </span>
                              </div>
                              <p className="text-[11px] text-zinc-500 line-clamp-2 italic font-serif">
                                "{src.content}"
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="bg-[#f8f9fa] border border-zinc-200 rounded-lg p-3 max-w-sm flex items-center gap-2.5 text-xs text-zinc-600">
                <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />
                <span>Searching indexed passages & generating answer...</span>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="p-3 bg-red-50/80 border border-red-200 rounded-md flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">{error}</p>
                {error.includes('token') && (
                  <p className="mt-1 text-[11px] text-red-600">
                    You can configure your free token in the Settings tab.
                  </p>
                )}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-zinc-200 bg-white">
          <div className="max-w-3xl mx-auto">
            <div className="relative border border-zinc-200 focus-within:border-zinc-400 rounded-lg bg-white shadow-xs transition-colors">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputResize}
                onKeyDown={handleKeyDown}
                placeholder={
                  selectedDocObj
                    ? `Ask about "${selectedDocObj.filename}"...`
                    : 'Ask about your documents and context...'
                }
                rows={1}
                disabled={isLoading}
                className="w-full resize-none py-3 pl-3.5 pr-12 text-xs md:text-[13px] text-zinc-900 placeholder:text-zinc-400 bg-transparent focus:outline-none max-h-44 leading-relaxed"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="absolute right-2 bottom-2 p-1.5 rounded-md bg-zinc-900 text-white disabled:bg-zinc-200 disabled:text-zinc-400 hover:bg-zinc-800 transition-colors shadow-2xs cursor-pointer"
                title="Send question (Enter)"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-zinc-400">
              <span>Press <kbd className="px-1 py-0.5 rounded bg-zinc-100 border border-zinc-200 font-mono text-[10px] text-zinc-600">Enter</kbd> to send, <kbd className="px-1 py-0.5 rounded bg-zinc-100 border border-zinc-200 font-mono text-[10px] text-zinc-600">Shift + Enter</kbd> for newline</span>
              <span>Grounded on FAISS & Qwen3</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Collapsible Sources Panel */}
      <SourcePanel
        sources={activeSources}
        isOpen={isSourcePanelOpen}
        onClose={() => setIsSourcePanelOpen(false)}
        selectedDocName={selectedDocObj?.filename}
      />
    </div>
  );
}
