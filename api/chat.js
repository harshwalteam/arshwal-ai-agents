const { AGENT_PERSONAS } = require('../lib/agents');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed, use POST' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not set. Add it in your Vercel project Environment Variables.' });
  }

  const { messages = [], agentType = 'tax' } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  const persona = AGENT_PERSONAS[agentType] || AGENT_PERSONAS.tax;
  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          systemInstruction: { parts: [{ text: persona.system }] },
          generationConfig: { maxOutputTokens: 400 },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data?.error?.message || 'Upstream API error' });
    }

    const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('\n') || '';

    res.status(200).json({ reply: text || "I couldn't generate a response just now — please try again." });
  } catch (err) {
    console.error('Chat proxy error:', err);
    res.status(500).json({ error: 'Failed to reach the AI service. Please try again.' });
  }
};
