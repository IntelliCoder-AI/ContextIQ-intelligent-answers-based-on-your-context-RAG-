const API_BASE = '/api';

async function handleResponse(response) {
  if (!response.ok) {
    let errorDetail = 'An unexpected server error occurred.';
    try {
      const data = await response.json();
      if (data && data.detail) {
        errorDetail = data.detail;
      }
    } catch {
      errorDetail = `Request failed with status ${response.status} (${response.statusText})`;
    }
    throw new Error(errorDetail);
  }
  return response.json();
}

export const api = {
  async getHealth() {
    return handleResponse(await fetch(`${API_BASE}/health`));
  },

  async getDocuments() {
    return handleResponse(await fetch(`${API_BASE}/documents`));
  },

  async uploadDocument(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse(response);
  },

  async deleteDocument(docId) {
    return handleResponse(
      await fetch(`${API_BASE}/documents/${docId}`, {
        method: 'DELETE',
      })
    );
  },

  async sendChatMessage(message, documentId = null) {
    const response = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        document_id: documentId || null,
      }),
    });
    return handleResponse(response);
  },

  async generateSummary(documentId, style = 'comprehensive') {
    const response = await fetch(`${API_BASE}/summarize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        document_id: documentId,
        style,
      }),
    });
    return handleResponse(response);
  },

  async generatePractice({ documentId, numQuestions = 5, difficulty = 'Medium', questionType = 'Multiple choice' }) {
    const response = await fetch(`${API_BASE}/practice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        document_id: documentId,
        num_questions: numQuestions,
        difficulty,
        question_type: questionType,
      }),
    });
    return handleResponse(response);
  },

  async getSettings() {
    return handleResponse(await fetch(`${API_BASE}/settings`));
  },

  async updateToken(hfToken) {
    const response = await fetch(`${API_BASE}/settings/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        hf_token: hfToken,
      }),
    });
    return handleResponse(response);
  },
};
