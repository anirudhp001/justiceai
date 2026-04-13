import { SYSTEM_PROMPT } from './systemPrompt';

// Route requests to our local Node.js RAG backend instead of raw Ollama
const RAG_BACKEND_URL = 'http://localhost:3001/api/chat';

export async function sendMessage(conversationHistory, userMessage, options = {}) {
  const { 
    judgePersonality = 'Neutral', 
    mode = 'copilot', 
    jurisdiction = 'National',
    language = 'en'
  } = options;

  try {
    const response = await fetch(RAG_BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          ...conversationHistory.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        ],
        personality: judgePersonality,
        mode: mode,
        jurisdiction: jurisdiction,
        basePrompt: SYSTEM_PROMPT,
        provider: localStorage.getItem('justice_ai_provider') || 'grok',
        apiKeys: JSON.parse(localStorage.getItem('justice_ai_keys') || '{}'),
        language: language
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data.message.content;
  } catch (error) {
    console.error('❌ Backend connection failed:', error.message);

    // Re-throw the error so the UI can display it properly
    // instead of silently returning a fake response
    throw new Error(
      `Could not reach the JusticeAI backend. Please ensure:\n` +
        `1. Ollama is running (ollama serve)\n` +
        `2. The backend server is running (node server.js)\n` +
        `\nTechnical details: ${error.message}`,
    );
  }
}
