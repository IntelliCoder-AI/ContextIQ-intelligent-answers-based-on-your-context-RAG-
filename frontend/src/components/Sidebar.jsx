import React from 'react';
import {
  MessageSquare,
  FileText,
  FileSpreadsheet,
  GraduationCap,
  Settings,
  LayoutDashboard,
  Plus,
  Trash2,
  BookOpen,
} from 'lucide-react';

export default function Sidebar({
  currentTab,
  setCurrentTab,
  systemStatus,
  conversations = [],
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
}) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'summaries', label: 'Summaries', icon: FileSpreadsheet },
    { id: 'practice', label: 'Practice', icon: GraduationCap },
  ];

  return (
    <aside className="w-64 bg-[#f8f9fa] border-r border-zinc-200 flex flex-col justify-between select-none h-full shrink-0">
      <div className="flex flex-col flex-1 min-h-0">
        {/* Logo & Brand */}
        <div className="h-16 px-4 border-b border-zinc-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-md bg-zinc-900 text-white flex items-center justify-center shadow-xs shrink-0">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-zinc-900 tracking-tight text-[15px] truncate">
                  ContextIQ
                </span>
                <span className="text-[9px] uppercase font-mono px-1 py-0.2 rounded bg-zinc-200/70 text-zinc-600 font-medium">
                  RAG
                </span>
              </div>
              <span className="text-[10px] text-zinc-400 truncate leading-tight">
                intelligent answers based on context
              </span>
            </div>
          </div>
        </div>

        {/* New Chat Button */}
        <div className="p-3 pb-1">
          <button
            onClick={onNewChat}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-zinc-900 text-white hover:bg-zinc-800 text-xs font-medium transition-colors shadow-2xs cursor-pointer"
            title="Start a new chat session"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Primary Navigation */}
        <nav className="p-3 pt-2 space-y-0.5">
          <div className="px-2 py-1 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
            Workspace
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] font-medium transition-colors text-left cursor-pointer ${
                  isActive
                    ? 'bg-zinc-200/80 text-zinc-900 font-semibold'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-zinc-900' : 'text-zinc-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Chat History Section (ChatGPT-like) */}
        <div className="flex-1 flex flex-col min-h-0 px-3 py-2 border-t border-zinc-200/80">
          <div className="flex items-center justify-between px-2 py-1 mb-1">
            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
              Chat History
            </span>
            <span className="text-[10px] font-mono text-zinc-400">
              {conversations.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-0.5 pr-1">
            {conversations.length === 0 ? (
              <div className="px-2 py-3 text-[11px] text-zinc-400 text-center">
                No past conversations
              </div>
            ) : (
              conversations.map((conv) => {
                const isActive = currentTab === 'chat' && conv.id === activeConversationId;
                return (
                  <div
                    key={conv.id}
                    onClick={() => onSelectConversation(conv.id)}
                    className={`group flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-zinc-200/90 text-zinc-900 font-medium'
                        : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-zinc-900' : 'text-zinc-400'}`} />
                      <span className="truncate" title={conv.title}>
                        {conv.title || 'New Chat'}
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteConversation(conv.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-red-600 hover:bg-zinc-200/60 rounded transition-all shrink-0 ml-1"
                      title="Delete chat"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Footer / Settings & Status */}
      <div className="p-3 border-t border-zinc-200 space-y-2 shrink-0">
        <button
          onClick={() => setCurrentTab('settings')}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-[13px] font-medium transition-colors cursor-pointer ${
            currentTab === 'settings'
              ? 'bg-zinc-200/80 text-zinc-900 font-semibold'
              : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Settings className="w-4 h-4 text-zinc-500" />
            <span>Settings</span>
          </div>
          {systemStatus?.is_hf_token_set ? (
            <span className="w-2 h-2 rounded-full bg-emerald-500" title="API Token Configured" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-amber-500" title="Token Needed" />
          )}
        </button>

        <div className="px-2.5 py-2 rounded-md bg-white border border-zinc-200/80 text-[11px] text-zinc-500">
          <div className="flex items-center justify-between text-zinc-700 font-medium mb-0.5">
            <span>Qwen3-8B</span>
            <span className="font-mono text-[10px] text-zinc-400">FAISS</span>
          </div>
          <div className="truncate text-zinc-400 text-[10px]">
            {systemStatus?.total_documents || 0} doc{systemStatus?.total_documents === 1 ? '' : 's'} • {systemStatus?.total_chunks || 0} chunks
          </div>
        </div>
      </div>
    </aside>
  );
}
