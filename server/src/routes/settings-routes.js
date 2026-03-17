import { Router } from 'express';
import {
  readRules, writeRules, readSettings, writeSettings,
} from '../storage/json-storage-adapter.js';

const router = Router();

// Get rules
router.get('/rules', (_req, res) => {
  try {
    res.json(readRules());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update rules
router.put('/rules', (req, res) => {
  try {
    writeRules(req.body);
    res.json(readRules());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get settings
router.get('/settings', (_req, res) => {
  try {
    res.json(readSettings() || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update settings
router.put('/settings', (req, res) => {
  try {
    const current = readSettings() || {};
    const updated = { ...current, ...req.body };
    writeSettings(updated);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
