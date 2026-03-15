import { Router } from 'express';
import { getTaskById, createTask, createTasksBatch, updateTask, updateTaskStatus, deleteTask } from '../services/task-service.js';
import { addFeedback, deleteFeedback, updateFeedback } from '../services/feedback-service.js';
import { getTasks, getTodayTasks, getTasksByDateRange } from '../services/task-query-service.js';
import { autoArchive } from '../services/task-archive-service.js';
import { parseRawInput } from '../services/smart-parser-service.js';
import { detectFeedback } from '../services/feedback-detector-service.js';

const router = Router();

// List tasks with optional filters
router.get('/', (req, res) => {
  try {
    const tasks = getTasks(req.query);
    res.json({ tasks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Today + overdue
router.get('/today', (_req, res) => {
  try {
    res.json(getTodayTasks());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Calendar range
router.get('/calendar', (req, res) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) return res.status(400).json({ error: 'from and to required' });
    const tasks = getTasksByDateRange(from, to);
    res.json({ tasks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Parse raw text (preview, not saved)
router.post('/parse', (req, res) => {
  try {
    const { rawText } = req.body;
    if (!rawText) return res.status(400).json({ error: 'rawText required' });
    const result = parseRawInput(rawText);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Detect feedback
router.post('/detect-feedback', (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'text required' });
    const result = detectFeedback(text);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Batch create
router.post('/batch', (req, res) => {
  try {
    const { tasks } = req.body;
    if (!Array.isArray(tasks)) return res.status(400).json({ error: 'tasks array required' });
    const created = createTasksBatch(tasks);
    res.status(201).json({ created });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Archive done tasks
router.post('/archive', (_req, res) => {
  try {
    const result = autoArchive();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single task
router.get('/:id', (req, res) => {
  try {
    const task = getTaskById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create single task
router.post('/', (req, res) => {
  try {
    const task = createTask(req.body);
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update task
router.put('/:id', (req, res) => {
  try {
    const task = updateTask(req.params.id, req.body);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Quick status update
router.put('/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'status required' });
    const task = updateTaskStatus(req.params.id, status);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add feedback
router.post('/:id/feedback', (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'content required' });
    const result = addFeedback(req.params.id, content);
    if (!result) return res.status(404).json({ error: 'Task not found' });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete feedback from task
router.delete('/:id/feedback/:fbId', (req, res) => {
  try {
    const result = deleteFeedback(req.params.id, req.params.fbId);
    if (!result) return res.status(404).json({ error: 'Task or feedback not found' });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update feedback content and/or date
router.put('/:id/feedback/:fbId', (req, res) => {
  try {
    const { content, createdAt } = req.body;
    if (!content && !createdAt) return res.status(400).json({ error: 'content or createdAt required' });
    const result = updateFeedback(req.params.id, req.params.fbId, { content, createdAt });
    if (!result) return res.status(404).json({ error: 'Not found' });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete task
router.delete('/:id', (req, res) => {
  try {
    const deleted = deleteTask(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Task not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
