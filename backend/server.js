require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

/* =======================================================
   Reference data — opportunity map + agent catalogue
   ======================================================= */
const AGENTS = [
  { id: 'support', label: 'AI Customer Support', baseLow: 8000, baseHigh: 15000 },
  { id: 'voice', label: 'AI Voice / Receptionist', baseLow: 10000, baseHigh: 20000 },
  { id: 'email', label: 'AI Email / Comms', baseLow: 6000, baseHigh: 12000 },
  { id: 'report', label: 'AI Reporting / Analytics', baseLow: 12000, baseHigh: 25000 },
  { id: 'tax', label: 'AI Tax / Audit / Compliance', baseLow: 15000, baseHigh: 30000 },
  { id: 'kb', label: 'AI Knowledge / Workflow', baseLow: 10000, baseHigh: 20000 },
];

const SIZE_MULTIPLIERS = { small: 0.8, medium: 1.0, large: 1.4 };

// Demo personas — one per common agent type, so the Live Demo tab can
// actually showcase a Customer Support agent, not just Tax & Compliance.
const AGENT_PERSONAS = {
  support: {
    label: 'AI Customer Support Agent',
    greeting: "Hi, I'm Harshwal's AI Customer Support Agent (demo). Ask me about an account issue, a service request, or where to find something on your client portal.",
    system:
      "You are Harshwal & Company LLP's AI Customer Support Agent — a live demo shown to prospective clients. You handle general help-desk style questions: account/portal access, service requests, status checks, scheduling, and 'how do I…' questions. Be friendly, concise (under 100 words), and solution-oriented. If a question needs a human (billing disputes, legal/compliance judgment calls), say so and offer to route it to the right Harshwal team.",
  },
  voice: {
    label: 'AI Voice / Receptionist Agent',
    greeting: "Hello, thanks for calling Harshwal & Company (demo transcript). How can I direct your call today?",
    system:
      "You are Harshwal & Company LLP's AI Voice/Receptionist Agent, shown here as a text transcript of what a phone call would look like. Greet callers, understand their reason for calling, collect the key details (name, organization, reason, callback number), and either answer simply or say you're routing them to the right department/person. Keep replies short and spoken-style (under 60 words), like a real phone conversation.",
  },
  email: {
    label: 'AI Email & Communication Agent',
    greeting: "Hi, I'm Harshwal's AI Email Agent (demo). Paste a client email or describe what you need drafted, and I'll write a response.",
    system:
      "You are Harshwal & Company LLP's AI Email & Communication Agent — a live demo. Given a client's message or a request, draft a professional, warm, clear email reply (or ask one clarifying question if truly needed). Keep drafts under 150 words, sign off as 'The Harshwal Team', and flag anything that needs a licensed professional's review before sending.",
  },
  report: {
    label: 'AI Reporting & Analytics Agent',
    greeting: "Hi, I'm Harshwal's AI Reporting Agent (demo). Ask me to explain a variance, summarize a trend, or describe what a report would show.",
    system:
      "You are Harshwal & Company LLP's AI Reporting & Analytics Agent — a live demo. Answer questions about financial/operational reporting, variance narratives, and dashboard summaries in plain language a board member could understand. Keep responses under 120 words, and note when a real answer would require pulling the client's actual data.",
  },
  tax: {
    label: 'AI Tax & Compliance Support Agent',
    greeting: "Namaste! I'm Harshwal's AI Tax & Compliance Support Agent (demo). Ask me about a filing deadline, a documentation request, or an audit sample question.",
    system:
      "You are Harshwal & Company LLP's AI Tax & Compliance Support Agent — a live demo. Answer tax, audit, compliance and general support questions helpfully and concisely (under 120 words). Be professional and warm. Always note that anything filing- or compliance-specific should be verified by a licensed Harshwal professional before acting on it.",
  },
  kb: {
    label: 'AI Knowledge Base & Workflow Agent',
    greeting: "Hi, I'm Harshwal's AI Knowledge/Workflow Agent (demo). Ask me to find a policy, explain a process, or route a task.",
    system:
      "You are Harshwal & Company LLP's AI Knowledge Base & Workflow Agent — a live demo. Help with internal SOP/policy lookups, explain multi-step processes clearly, and describe how a task would be routed between teams. Keep answers under 120 words and structured (numbered steps where useful).",
  },
};

/* =======================================================
   Routes
   ======================================================= */

// Health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'harshwal-ai-agents-backend' });
});

// Reference data for the opportunity map + calculator form
app.get('/api/data', (req, res) => {
  const personas = Object.fromEntries(
    Object.entries(AGENT_PERSONAS).map(([id, p]) => [id, { label: p.label, greeting: p.greeting }])
  );
  res.json({ agents: AGENTS, sizeMultipliers: SIZE_MULTIPLIERS, personas });
});

// ROI / pricing calculator — all business logic lives server-side
app.post('/api/roi', (req, res) => {
  const { size = 'medium', agentIds = [] } = req.body || {};
  const sizeMult = SIZE_MULTIPLIERS[size] ?? 1.0;

  const selected = AGENTS.filter(a => agentIds.includes(a.id));
  if (selected.length === 0) {
    return res.json({ implLow: 0, implHigh: 0, amcAnnual: 0, amcMonthly: 0, efficiencyPct: 0 });
  }

  const implLow = selected.reduce((sum, a) => sum + a.baseLow * sizeMult, 0);
  const implHigh = selected.reduce((sum, a) => sum + a.baseHigh * sizeMult, 0);
  const implAvg = (implLow + implHigh) / 2;
  const amcAnnual = implAvg * 0.18;
  const amcMonthly = amcAnnual / 12;
  const efficiencyPct = Math.min(15 + (selected.length - 1) * 4, 40);

  res.json({
    implLow: Math.round(implLow),
    implHigh: Math.round(implHigh),
    amcAnnual: Math.round(amcAnnual),
    amcMonthly: Math.round(amcMonthly),
    efficiencyPct,
  });
});

// Live AI Agent demo — proxies chat to Google Gemini's free-tier API using a server-side key
app.post('/api/chat', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not set on the server. Add it to backend/.env' });
  }

  const { messages = [], agentType = 'tax' } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  const persona = AGENT_PERSONAS[agentType] || AGENT_PERSONAS.tax;
  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

  // Gemini expects { role: 'user' | 'model', parts: [{ text }] } instead of
  // Anthropic-style { role: 'user' | 'assistant', content }.
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

    res.json({ reply: text || "I couldn't generate a response just now — please try again." });
  } catch (err) {
    console.error('Chat proxy error:', err);
    res.status(500).json({ error: 'Failed to reach the AI service. Please try again.' });
  }
});

/* =======================================================
   Serve the frontend
   ======================================================= */
app.use(express.static(path.join(__dirname, '../frontend')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
  console.log(`Harshwal AI Agents backend running at http://localhost:${PORT}`);
});
