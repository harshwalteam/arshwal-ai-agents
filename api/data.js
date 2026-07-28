const { AGENTS, SIZE_MULTIPLIERS, AGENT_PERSONAS } = require('../lib/agents');

module.exports = (req, res) => {
  const personas = Object.fromEntries(
    Object.entries(AGENT_PERSONAS).map(([id, p]) => [id, { label: p.label, greeting: p.greeting }])
  );
  res.status(200).json({ agents: AGENTS, sizeMultipliers: SIZE_MULTIPLIERS, personas });
};
