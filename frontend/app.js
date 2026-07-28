/* ---------- Tabs ---------- */
document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.sheet').forEach(s => s.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('sheet-' + btn.dataset.tab).classList.add('active');
  });
});

let AGENTS = [];
let PERSONAS = {};
let currentAgentType = 'support';

const SAMPLE_PROMPTS = {
  support: [
    "I can't log into our client portal, can you help?",
    "How do I request a copy of last year's report?",
    "Can you check the status of our open service request?",
  ],
  voice: [
    "Hi, I need to speak with someone about our upcoming audit.",
    "Can you transfer me to the tax team?",
    "I'd like to schedule a callback for tomorrow morning.",
  ],
  email: [
    "Draft a reply to a client asking for a filing extension.",
    "Write a follow-up email for missing documentation.",
    "Draft a thank-you note after a completed engagement.",
  ],
  report: [
    "Explain what a budget variance report shows.",
    "Summarize what a board-ready financial summary includes.",
    "What would a monthly reporting dashboard track for us?",
  ],
  tax: [
    "What documents do I need to submit for our annual single audit?",
    "Our nonprofit missed a Form 990 deadline — what should we do?",
    "Can you explain what a disbursement attribute test checks for?",
  ],
  kb: [
    "Where can I find our expense reimbursement policy?",
    "Walk me through the new-vendor onboarding process.",
    "How would a new task get routed to the right team?",
  ],
};

async function loadData() {
  try {
    const res = await fetch('/api/data');
    const data = await res.json();
    AGENTS = data.agents;
    PERSONAS = data.personas || {};
    populateCalcForm();
    renderAgentPicker();
    selectAgent(currentAgentType);
    populateWidgetPersonas();
    resetWidgetChat();
  } catch (err) {
    console.error('Failed to load reference data from backend:', err);
  }
}

function populateCalcForm() {
  const agentsWrap = document.getElementById('calcAgents');
  agentsWrap.innerHTML = '';
  AGENTS.forEach((a, i) => {
    const label = document.createElement('label');
    label.className = 'check-item';
    label.innerHTML = `<input type="checkbox" class="agent-check" value="${a.id}" ${i < 2 ? 'checked' : ''}/> ${a.label}`;
    agentsWrap.appendChild(label);
  });

  document.getElementById('calcSize').addEventListener('change', recalc);
  agentsWrap.addEventListener('change', recalc);
  recalc();
}

function fmt(n) {
  return '$' + Math.round(n).toLocaleString('en-US');
}

async function recalc() {
  const size = document.getElementById('calcSize').value;
  const agentIds = Array.from(document.querySelectorAll('.agent-check:checked')).map(c => c.value);

  try {
    const res = await fetch('/api/roi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ size, agentIds }),
    });
    const r = await res.json();

    document.getElementById('resImpl').textContent = agentIds.length ? `${fmt(r.setupLow)} – ${fmt(r.setupHigh)}` : '$0';
    document.getElementById('resAmcMo').textContent = agentIds.length ? `${fmt(r.monthlyLow)} – ${fmt(r.monthlyHigh)} / mo` : '$0 / mo';
    document.getElementById('resAmc').textContent = agentIds.length ? `${fmt(r.annualLow)} – ${fmt(r.annualHigh)} / yr` : '$0 / yr';
    document.getElementById('resEff').textContent = agentIds.length ? `~${r.efficiencyPct}%` : '0%';
  } catch (err) {
    console.error('ROI calculation failed:', err);
  }
}

/* ---------- Live chat demo ---------- */
const chatLog = document.getElementById('chatLog');
const chatInput = document.getElementById('chatInput');
const chatSend = document.getElementById('chatSend');
const agentPicker = document.getElementById('agentPicker');
const promptChips = document.getElementById('promptChips');
let history = [];

function renderAgentPicker() {
  agentPicker.innerHTML = '';
  Object.entries(PERSONAS).forEach(([id, p]) => {
    const btn = document.createElement('button');
    btn.className = 'agent-pill' + (id === currentAgentType ? ' active' : '');
    btn.textContent = p.label;
    btn.dataset.agentType = id;
    btn.addEventListener('click', () => selectAgent(id));
    agentPicker.appendChild(btn);
  });
}

function selectAgent(id) {
  currentAgentType = id;
  history = [];
  document.querySelectorAll('.agent-pill').forEach(p => {
    p.classList.toggle('active', p.dataset.agentType === id);
  });

  chatLog.innerHTML = '';
  const note = document.createElement('div');
  note.className = 'msg system-note';
  note.textContent = 'Session started, no data retained';
  chatLog.appendChild(note);
  if (PERSONAS[id] && PERSONAS[id].greeting) addMsg(PERSONAS[id].greeting, 'agent');

  promptChips.innerHTML = '';
  (SAMPLE_PROMPTS[id] || []).forEach(text => {
    const chip = document.createElement('button');
    chip.className = 'chip-btn';
    chip.textContent = text;
    chip.addEventListener('click', () => sendMessage(text));
    promptChips.appendChild(chip);
  });
}

function addMsg(text, cls, targetLog) {
  const log = targetLog || chatLog;
  const div = document.createElement('div');
  div.className = 'msg ' + cls;
  div.textContent = text;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
  return div;
}

function addTyping(targetLog) {
  const log = targetLog || chatLog;
  const div = document.createElement('div');
  div.className = 'msg agent';
  div.innerHTML = '<span class="typing-dots"><span></span><span></span><span></span></span>';
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
  return div;
}

async function sendMessage(text) {
  if (!text.trim()) return;
  addMsg(text, 'user');
  history.push({ role: 'user', content: text });
  chatInput.value = '';
  chatSend.disabled = true;
  const thinking = addTyping();

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history, agentType: currentAgentType }),
    });
    const data = await response.json();
    thinking.remove();

    if (!response.ok) {
      addMsg(data.error || 'Demo connection error, please try again in a moment.', 'agent system-note');
    } else {
      addMsg(data.reply, 'agent');
      history.push({ role: 'assistant', content: data.reply });
    }
  } catch (err) {
    thinking.remove();
    addMsg('Demo connection error, please try again in a moment.', 'agent system-note');
  }
  chatSend.disabled = false;
  chatInput.focus();
}

chatSend.addEventListener('click', () => sendMessage(chatInput.value));
chatInput.addEventListener('keydown', e => { if (e.key === 'Enter') sendMessage(chatInput.value); });

/* ---------- Floating chatbot widget ---------- */
const fabChat = document.getElementById('fabChat');
const widgetPanel = document.getElementById('widgetPanel');
const widgetPersonaSelect = document.getElementById('widgetPersonaSelect');
const widgetLog = document.getElementById('widgetLog');
const widgetInput = document.getElementById('widgetInput');
const widgetSend = document.getElementById('widgetSend');
let widgetAgentType = 'support';
let widgetHistory = [];

fabChat.addEventListener('click', () => {
  const isOpen = widgetPanel.classList.toggle('open');
  fabChat.classList.toggle('open', isOpen);
  if (isOpen) widgetInput.focus();
});

function populateWidgetPersonas() {
  widgetPersonaSelect.innerHTML = '';
  Object.entries(PERSONAS).forEach(([id, p]) => {
    const opt = document.createElement('option');
    opt.value = id;
    opt.textContent = p.label;
    if (id === widgetAgentType) opt.selected = true;
    widgetPersonaSelect.appendChild(opt);
  });
}

function resetWidgetChat() {
  widgetHistory = [];
  widgetLog.innerHTML = '';
  const note = document.createElement('div');
  note.className = 'msg system-note';
  note.textContent = 'Session started, no data retained';
  widgetLog.appendChild(note);
  if (PERSONAS[widgetAgentType] && PERSONAS[widgetAgentType].greeting) {
    addMsg(PERSONAS[widgetAgentType].greeting, 'agent', widgetLog);
  }
}

widgetPersonaSelect.addEventListener('change', () => {
  widgetAgentType = widgetPersonaSelect.value;
  resetWidgetChat();
});

async function sendWidgetMessage(text) {
  if (!text.trim()) return;
  addMsg(text, 'user', widgetLog);
  widgetHistory.push({ role: 'user', content: text });
  widgetInput.value = '';
  widgetSend.disabled = true;
  const thinking = addTyping(widgetLog);

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: widgetHistory, agentType: widgetAgentType }),
    });
    const data = await response.json();
    thinking.remove();

    if (!response.ok) {
      addMsg(data.error || 'Demo connection error, please try again in a moment.', 'agent system-note', widgetLog);
    } else {
      addMsg(data.reply, 'agent', widgetLog);
      widgetHistory.push({ role: 'assistant', content: data.reply });
    }
  } catch (err) {
    thinking.remove();
    addMsg('Demo connection error, please try again in a moment.', 'agent system-note', widgetLog);
  }
  widgetSend.disabled = false;
  widgetInput.focus();
}

widgetSend.addEventListener('click', () => sendWidgetMessage(widgetInput.value));
widgetInput.addEventListener('keydown', e => { if (e.key === 'Enter') sendWidgetMessage(widgetInput.value); });

/* ---------- Widget close button ---------- */
const widgetClose = document.getElementById('widgetClose');
widgetClose.addEventListener('click', () => {
  widgetPanel.classList.remove('open');
  fabChat.classList.remove('open');
});

/* ---------- Fab tooltip (auto-show once, then fade) ---------- */
const fabTooltip = document.getElementById('fabTooltip');
let tooltipShown = false;
setTimeout(() => {
  if (!widgetPanel.classList.contains('open')) {
    fabTooltip.classList.add('show');
    tooltipShown = true;
    setTimeout(() => fabTooltip.classList.remove('show'), 5000);
  }
}, 1800);
fabChat.addEventListener('click', () => fabTooltip.classList.remove('show'));

loadData();
