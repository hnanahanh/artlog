import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { parseRawInput, createTasksBatch, detectFeedback, addFeedback } from '../../api/task-api-client.js';
import { separateFeedbacks, buildSaveResultMessage } from '../../processors/magic-input-processor.js';

const DRAFT_KEY = 'magic-input-draft';

/* Load draft from localStorage */
function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

/* Save draft to localStorage */
function saveDraft(data) {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(data)); } catch { /* ignore */ }
}

function clearDraft() {
  try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
}

// Custom hook encapsulating all state and handlers for MagicInputModal
export function useMagicInput({ onClose, onTasksCreated }) {
  const draft = loadDraft();
  const [rawText, setRawText] = useState(draft?.rawText || '');
  const [parsedTasks, setParsedTasks] = useState(draft?.parsedTasks || []);
  const [feedbackItems, setFeedbackItems] = useState(draft?.feedbackItems || []);
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [parsed, setParsed] = useState(draft?.parsed || false);

  // Auto-save draft on changes
  useEffect(() => {
    saveDraft({ rawText, parsedTasks, feedbackItems, parsed });
  }, [rawText, parsedTasks, feedbackItems, parsed]);

  const reset = () => {
    setRawText('');
    setParsedTasks([]);
    setFeedbackItems([]);
    setWarnings([]);
    setParsed(false);
    clearDraft();
  };

  const handleClose = () => {
    // Don't reset — keep draft for next open
    onClose();
  };

  // Parse raw text and check each line for feedback
  const handleParse = async () => {
    if (!rawText.trim()) return;
    setLoading(true);
    try {
      const result = await parseRawInput(rawText);
      setParsedTasks(result.parsed);
      setWarnings(result.warnings);

      const fbChecks = await Promise.all(
        result.parsed.map(task => detectFeedback(task.name).catch(() => ({ isFeedback: false })))
      );

      const fbItems = [];
      fbChecks.forEach((detection, index) => {
        if (detection.isFeedback) fbItems.push({ index, detection });
      });
      setFeedbackItems(fbItems);
      setParsed(true);
    } catch (err) {
      message.error('Parse failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Update a parsed task field before saving
  const handleTaskEdit = (index, field, value) => {
    setParsedTasks(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Save all: create new tasks + append feedbacks
  const handleSave = async () => {
    if (parsedTasks.length === 0) return;
    setLoading(true);
    try {
      const { newTasks, feedbacksToAppend } = separateFeedbacks(parsedTasks, feedbackItems);

      if (newTasks.length > 0) await createTasksBatch(newTasks);

      for (const fb of feedbacksToAppend) {
        await addFeedback(fb.taskId, fb.content);
      }

      message.success(buildSaveResultMessage(newTasks.length, feedbacksToAppend.length));

      reset(); // Clear draft after successful save
      onClose();
      onTasksCreated?.();
    } catch (err) {
      message.error('Save failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Remove a feedback detection (user says "no, create as new task")
  const handleDismissFeedback = (index) => {
    setFeedbackItems(prev => prev.filter(fb => fb.index !== index));
  };

  return {
    rawText, setRawText,
    parsedTasks, feedbackItems, warnings,
    loading, parsed, setParsed,
    handleClose, handleParse, handleTaskEdit,
    handleSave, handleDismissFeedback,
  };
}
