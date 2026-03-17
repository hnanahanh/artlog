import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMagicInput } from '../use-magic-input.js';

// Mock task API
vi.mock('../../../api/task-api-client.js', () => ({
  parseRawInput: vi.fn(async (text) => ({
    parsed: [
      { id: 'auto_1', name: 'Task from ' + text.split('\n')[0] },
    ],
    warnings: [],
  })),
  createTasksBatch: vi.fn(async () => ({ success: true })),
  detectFeedback: vi.fn(async () => ({ isFeedback: false })),
  addFeedback: vi.fn(async () => ({ success: true })),
}));

describe('useMagicInput', () => {
  it('initial state - rawText empty, parsedTasks empty, loading false', () => {
    const { result } = renderHook(() => useMagicInput({
      onClose: () => {},
      onTasksCreated: () => {},
    }));

    expect(result.current.rawText).toBe('');
    expect(result.current.parsedTasks).toEqual([]);
    expect(result.current.feedbackItems).toEqual([]);
    expect(result.current.warnings).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.parsed).toBe(false);
  });

  it('handleParse - calls parseRawInput and sets parsedTasks', async () => {
    const { result } = renderHook(() => useMagicInput({
      onClose: () => {},
      onTasksCreated: () => {},
    }));

    await act(async () => {
      result.current.setRawText('Task 1\nTask 2');
      await result.current.handleParse();
    });

    expect(result.current.parsedTasks.length).toBeGreaterThan(0);
    expect(result.current.parsed).toBe(true);
    expect(result.current.loading).toBe(false);
  });

  it('handleParse - detects feedbacks via detectFeedback', async () => {
    const { detectFeedback } = await import('../../../api/task-api-client.js');
    detectFeedback.mockResolvedValue({
      isFeedback: true,
      targetTask: { id: 't1' },
      feedbackContent: 'feedback text',
    });

    const { result } = renderHook(() => useMagicInput({
      onClose: () => {},
      onTasksCreated: () => {},
    }));

    await act(async () => {
      result.current.setRawText('Task 1');
      await result.current.handleParse();
    });

    expect(result.current.feedbackItems.length).toBeGreaterThan(0);
  });

  it('handleParse - does nothing on empty text', async () => {
    const { result } = renderHook(() => useMagicInput({
      onClose: () => {},
      onTasksCreated: () => {},
    }));

    await act(async () => {
      result.current.setRawText('');
      await result.current.handleParse();
    });

    expect(result.current.parsedTasks).toEqual([]);
  });

  it('handleTaskEdit - updates parsed task field', () => {
    const { result } = renderHook(() => useMagicInput({
      onClose: () => {},
      onTasksCreated: () => {},
    }));

    act(() => {
      // Mock existing parsed task
      result.current.setParsedTasks([
        { id: '1', name: 'Original', priority: 'low' },
      ]);
    });

    act(() => {
      result.current.handleTaskEdit(0, 'name', 'Updated');
    });

    expect(result.current.parsedTasks[0].name).toBe('Updated');
  });

  it('handleTaskEdit - preserves other fields', () => {
    const { result } = renderHook(() => useMagicInput({
      onClose: () => {},
      onTasksCreated: () => {},
    }));

    act(() => {
      result.current.setParsedTasks([
        { id: '1', name: 'Task', priority: 'high', dueDate: '2025-03-20' },
      ]);
    });

    act(() => {
      result.current.handleTaskEdit(0, 'name', 'New Name');
    });

    expect(result.current.parsedTasks[0].priority).toBe('high');
    expect(result.current.parsedTasks[0].dueDate).toBe('2025-03-20');
  });

  it('handleDismissFeedback - removes feedback item', () => {
    const { result } = renderHook(() => useMagicInput({
      onClose: () => {},
      onTasksCreated: () => {},
    }));

    act(() => {
      result.current.setFeedbackItems([
        { index: 0, detection: { isFeedback: true } },
        { index: 1, detection: { isFeedback: true } },
      ]);
    });

    act(() => {
      result.current.handleDismissFeedback(0);
    });

    expect(result.current.feedbackItems.length).toBe(1);
    expect(result.current.feedbackItems[0].index).toBe(1);
  });

  it('handleSave - separates tasks from feedbacks', async () => {
    const { createTasksBatch, addFeedback } = await import('../../../api/task-api-client.js');

    const { result } = renderHook(() => useMagicInput({
      onClose: () => {},
      onTasksCreated: () => {},
    }));

    act(() => {
      result.current.setParsedTasks([
        { id: '1', name: 'Task 1' },
        { id: '2', name: 'Feedback for task' },
        { id: '3', name: 'Task 3' },
      ]);
      result.current.setFeedbackItems([
        { index: 1, detection: { targetTask: { id: 't1' }, feedbackContent: 'feedback' } },
      ]);
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(createTasksBatch).toHaveBeenCalled();
    expect(addFeedback).toHaveBeenCalled();
  });

  it('handleSave - calls createTasksBatch for new tasks', async () => {
    const { createTasksBatch } = await import('../../../api/task-api-client.js');
    createTasksBatch.mockClear();

    const { result } = renderHook(() => useMagicInput({
      onClose: () => {},
      onTasksCreated: () => {},
    }));

    act(() => {
      result.current.setParsedTasks([
        { id: '1', name: 'Task 1' },
        { id: '2', name: 'Task 2' },
      ]);
      result.current.setFeedbackItems([]);
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(createTasksBatch).toHaveBeenCalledWith([
      { id: '1', name: 'Task 1' },
      { id: '2', name: 'Task 2' },
    ]);
  });

  it('handleSave - calls addFeedback for each feedback', async () => {
    const { addFeedback } = await import('../../../api/task-api-client.js');
    addFeedback.mockClear();

    const { result } = renderHook(() => useMagicInput({
      onClose: () => {},
      onTasksCreated: () => {},
    }));

    act(() => {
      result.current.setParsedTasks([{ id: '1', name: 'Task' }]);
      result.current.setFeedbackItems([
        { index: 0, detection: { targetTask: { id: 't1' }, feedbackContent: 'feedback 1' } },
        { index: 1, detection: { targetTask: { id: 't2' }, feedbackContent: 'feedback 2' } },
      ]);
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(addFeedback).toHaveBeenCalledTimes(2);
  });

  it('handleClose - resets all state', () => {
    const onClose = vi.fn();
    const { result } = renderHook(() => useMagicInput({
      onClose,
      onTasksCreated: () => {},
    }));

    act(() => {
      result.current.setRawText('some text');
      result.current.setParsedTasks([{ id: '1', name: 'Task' }]);
      result.current.setWarnings(['warning']);
      result.current.setParsed(true);
    });

    act(() => {
      result.current.handleClose();
    });

    expect(result.current.rawText).toBe('');
    expect(result.current.parsedTasks).toEqual([]);
    expect(result.current.feedbackItems).toEqual([]);
    expect(result.current.warnings).toEqual([]);
    expect(result.current.parsed).toBe(false);
    expect(onClose).toHaveBeenCalled();
  });

  it('handleSave - does nothing on empty parsedTasks', async () => {
    const { createTasksBatch } = await import('../../../api/task-api-client.js');
    createTasksBatch.mockClear();

    const { result } = renderHook(() => useMagicInput({
      onClose: () => {},
      onTasksCreated: () => {},
    }));

    act(() => {
      result.current.setParsedTasks([]);
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(createTasksBatch).not.toHaveBeenCalled();
  });

  it('handleParse - handles error gracefully', async () => {
    const { parseRawInput } = await import('../../../api/task-api-client.js');
    parseRawInput.mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useMagicInput({
      onClose: () => {},
      onTasksCreated: () => {},
    }));

    await act(async () => {
      result.current.setRawText('some text');
      await result.current.handleParse();
    });

    expect(result.current.loading).toBe(false);
  });
});
