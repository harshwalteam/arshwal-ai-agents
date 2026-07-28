const { AGENTS, SIZE_MULTIPLIERS } = require('../lib/agents');

module.exports = (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed, use POST' });
  }

  const { size = 'medium', agentIds = [] } = req.body || {};
  const sizeMult = SIZE_MULTIPLIERS[size] ?? 1.0;

  const selected = AGENTS.filter(a => agentIds.includes(a.id));
  if (selected.length === 0) {
    return res.status(200).json({
      setupLow: 0, setupHigh: 0,
      monthlyLow: 0, monthlyHigh: 0,
      annualLow: 0, annualHigh: 0,
      efficiencyPct: 0,
    });
  }

  const setupLow = selected.reduce((sum, a) => sum + a.setupLow * sizeMult, 0);
  const setupHigh = selected.reduce((sum, a) => sum + a.setupHigh * sizeMult, 0);
  const monthlyLow = selected.reduce((sum, a) => sum + a.monthlyLow * sizeMult, 0);
  const monthlyHigh = selected.reduce((sum, a) => sum + a.monthlyHigh * sizeMult, 0);
  const annualLow = monthlyLow * 12;
  const annualHigh = monthlyHigh * 12;
  const efficiencyPct = Math.min(15 + (selected.length - 1) * 4, 40);

  res.status(200).json({
    setupLow: Math.round(setupLow),
    setupHigh: Math.round(setupHigh),
    monthlyLow: Math.round(monthlyLow),
    monthlyHigh: Math.round(monthlyHigh),
    annualLow: Math.round(annualLow),
    annualHigh: Math.round(annualHigh),
    efficiencyPct,
  });
};
