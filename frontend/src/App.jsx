import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import DashboardPage from './pages/DashboardPage';
import ChatPage from './pages/ChatPage';
import DocumentsPage from './pages/DocumentsPage';
import SummariesPage from './pages/SummariesPage';
import PracticePage from './pages/PracticePage';
import SettingsPage from './pages/SettingsPage';
import { api } from './services/api';

const CONVERSATIONS_STORAGE_KEY = 'contextiq_conversations_v1';
const ACTIVE_CONV_STORAGE_KEY = 'contextiq_active_id_v1';

function createNewConversation(docId = null) {
  return {
    id: 'chat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    title: 'New Chat',
    messages: [],
    activeSources: [],
    selectedDocId: docId,
    createdAt: new Date().toISOString(),
  };
}

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [documents, setDocuments] = useState([]);
  const [systemStatus, setSystemStatus] = useState(null);

  // Chat History Management (ChatGPT-style)
  const [conversations, setConversations] = useState(() => {
    try {
      const saved = localStorage.getItem(CONVERSATIONS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore parsing error
    }
    return [createNewConversation()];
  });

  const [activeConversationId, setActiveConversationId] = useState(() => {
    try {
      const savedId = localStorage.getItem(ACTIVE_CONV_STORAGE_KEY);
      if (savedId) return savedId;
    } catch {
      // ignore
    }
    return conversations[0]?.id || '';
  });

  // Save conversations to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(conversations));
    } catch {
      // storage full or disabled
    }
  }, [conversations]);

  useEffect(() => {
    try {
      if (activeConversationId) {
        localStorage.setItem(ACTIVE_CONV_STORAGE_KEY, activeConversationId);
      }
    } catch {
      // ignore
    }
  }, [activeConversationId]);

  // Active conversation object
  const activeConversation =
    conversations.find((c) => c.id === activeConversationId) ||
    conversations[0] ||
    createNewConversation();

  // Chat Loading & Error state
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatError, setChatError] = useState(null);

  // Document Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);

  const loadData = async () => {
    try {
      const [docs, status] = await Promise.all([
        api.getDocuments().catch(() => []),
        api.getSettings().catch(() => null),
      ]);
      setDocuments(docs || []);
      setSystemStatus(status);
    } catch {
      // Backend may be starting up
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleNewChat = (docId = null) => {
    const newChat = createNewConversation(docId);
    setConversations((prev) => [newChat, ...prev]);
    setActiveConversationId(newChat.id);
    setChatError(null);
    setCurrentTab('chat');
  };

  const handleSelectConversation = (id) => {
    setActiveConversationId(id);
    setChatError(null);
    setCurrentTab('chat');
  };

  const handleDeleteConversation = (id) => {
    setConversations((prev) => {
      const filtered = prev.filter((c) => c.id !== id);
      if (filtered.length === 0) {
        const fresh = createNewConversation();
        setActiveConversationId(fresh.id);
        return [fresh];
      }
      if (activeConversationId === id) {
        setActiveConversationId(filtered[0].id);
      }
      return filtered;
    });
  };

  const handleSetDocId = (docId) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversationId ? { ...c, selectedDocId: docId } : c
      )
    );
  };

  const handleViewSourceInPanel = (sources) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversationId ? { ...c, activeSources: sources } : c
      )
    );
  };

  const handleSendMessage = async (userText, docId) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = {
      role: 'user',
      content: userText,
      timestamp: time,
    };

    // Determine title if this is the first message
    const isFirstMessage = activeConversation.messages.length === 0;
    const computedTitle = isFirstMessage
      ? userText.length > 34
        ? userText.slice(0, 34) + '...'
        : userText
      : activeConversation.title;

    // Optimistically update conversation
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeConversationId) {
          return {
            ...c,
            title: computedTitle,
            messages: [...c.messages, userMsg],
          };
        }
        return c;
      })
    );

    setIsChatLoading(true);
    setChatError(null);

    try {
      const res = await api.sendChatMessage(userText, docId);
      const assistantMsg = {
        role: 'assistant',
        content: res.answer,
        sources: res.sources || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === activeConversationId) {
            return {
              ...c,
              messages: [...c.messages, assistantMsg],
              activeSources: res.sources && res.sources.length > 0 ? res.sources : c.activeSources,
            };
          }
          return c;
        })
      );
    } catch (err) {
      setChatError(err.message || 'Unable to retrieve answer.');
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleUploadFile = async (file) => {
    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const newDoc = await api.uploadDocument(file);
      setUploadSuccess(`Successfully uploaded and indexed "${newDoc.filename}" (${newDoc.chunk_count} chunks).`);
      await loadData();
      setTimeout(() => setUploadSuccess(null), 4000);
    } catch (err) {
      setUploadError(err.message || 'Upload and indexing failed.');
      setTimeout(() => setUploadError(null), 6000);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (docId) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
    try {
      await api.deleteDocument(docId);
      await loadData();
    } catch (err) {
      alert(`Could not delete document: ${err.message}`);
      await loadData();
    }
  };

  const handleSelectDocForChat = (docId) => {
    handleNewChat(docId);
  };

  const handleNavigateWithDoc = (tab, docId) => {
    if (docId) handleSetDocId(docId);
    setCurrentTab(tab);
  };

  const triggerUploadClick = () => {
    setCurrentTab('documents');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#fbfcfd] text-zinc-900 font-sans">
      {/* Left Navigation & Chat History */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        systemStatus={systemStatus}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewChat={() => handleNewChat()}
        onDeleteConversation={handleDeleteConversation}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {currentTab === 'dashboard' && (
          <DashboardPage
            documents={documents}
            onNavigate={setCurrentTab}
            onSelectDocForChat={handleSelectDocForChat}
            onUploadClick={triggerUploadClick}
            systemStatus={systemStatus}
          />
        )}

        {currentTab === 'chat' && (
          <ChatPage
            messages={activeConversation.messages || []}
            onSendMessage={handleSendMessage}
            isLoading={isChatLoading}
            error={chatError}
            documents={documents}
            selectedDocId={activeConversation.selectedDocId}
            setSelectedDocId={handleSetDocId}
            activeSources={activeConversation.activeSources || []}
            onViewSourceInPanel={handleViewSourceInPanel}
            conversationTitle={activeConversation.title}
            onNewChat={() => handleNewChat()}
          />
        )}

        {currentTab === 'documents' && (
          <DocumentsPage
            documents={documents}
            onUploadFile={handleUploadFile}
            onDeleteDocument={handleDeleteDocument}
            onSelectDocForChat={handleSelectDocForChat}
            onNavigate={handleNavigateWithDoc}
            isUploading={isUploading}
            uploadError={uploadError}
            uploadSuccess={uploadSuccess}
          />
        )}

        {currentTab === 'summaries' && (
          <SummariesPage
            documents={documents}
            preselectedDocId={activeConversation.selectedDocId}
          />
        )}

        {currentTab === 'practice' && (
          <PracticePage
            documents={documents}
            preselectedDocId={activeConversation.selectedDocId}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsPage
            systemStatus={systemStatus}
            onRefreshStatus={loadData}
          />
        )}
      </main>
    </div>
  );
}
