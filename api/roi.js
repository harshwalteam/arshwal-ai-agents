const { AGENTS, SIZE_MULTIPLIERS } = require('../lib/agents');

module.exports = (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed, use POST' });
  }

  const { size = 'medium', agentIds = [] } = req.body || {};
  const sizeMult = SIZE_MULTIPLIERS[size] ?? 1.0;

  const selected = AGENTS.filter(a => agentIds.includes(a.id));
  if (selected.length === 0) {
    return res.status(200).json({ implLow: 0, implHigh: 0, amcAnnual: 0, amcMonthly: 0, efficiencyPct: 0 });
  }

  const implLow = selected.reduce((sum, a) => sum + a.baseLow * sizeMult, 0);
  const implHigh = selected.reduce((sum, a) => sum + a.baseHigh * sizeMult, 0);
  const implAvg = (implLow + implHigh) / 2;
  const amcAnnual = implAvg * 0.18;
  const amcMonthly = amcAnnual / 12;
  const efficiencyPct = Math.min(15 + (selected.length - 1) * 4, 40);

  res.status(200).json({
    implLow: Math.round(implLow),
    implHigh: Math.round(implHigh),
    amcAnnual: Math.round(amcAnnual),
    amcMonthly: Math.round(amcMonthly),
    efficiencyPct,
  });
};
