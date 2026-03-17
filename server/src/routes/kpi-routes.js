import { Router } from 'express';
import { generateKPI, kpiToCSV } from '../services/kpi-exporter-service.js';

const router = Router();

// KPI summary (JSON)
router.get('/export', (req, res) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) return res.status(400).json({ error: 'from and to required' });
    const kpi = generateKPI(from, to);
    res.json(kpi);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// KPI as CSV download
router.get('/export-csv', (req, res) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) return res.status(400).json({ error: 'from and to required' });
    const kpi = generateKPI(from, to);
    const csv = kpiToCSV(kpi);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=kpi-${from}-to-${to}.csv`);
    res.send('\uFEFF' + csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
