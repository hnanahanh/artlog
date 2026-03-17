import { useState } from 'react';
import { message } from 'antd';
import { parseRawInput, createTasksBatch, detectFeedback, addFeedback } from '../../api/task-api-client.js';
import { separateFeedbacks, buildSaveResultMessage } from '../../processors/magic-input-processor.js';

// Custom hook encapsulating all state and handlers for MagicInputModal
export function useMagicInput({ onClose, onTasksCreated }) {
  const [rawText, setRawText] = useState('');
  const [parsedTasks, setParsedTasks] = useState([]);
  const [feedbackItems, setFeedbackItems] = useState([]); // { index, detection }
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [parsed, setParsed] = useState(false);

  const reset = () => {
    setRawText('');
    setParsedTasks([]);
    setFeedbackItems([]);
    setWarnings([]);
    setParsed(false);
  };

  const handleClose = () => {
    reset();
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

      handleClose();
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
