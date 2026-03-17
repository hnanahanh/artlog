import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useKanbanBoard } from '../use-kanban-board.js';

// Mock task API
vi.mock('../../../api/task-api-client.js', () => ({
  fetchTasks: vi.fn(async () => ({
    tasks: [
      { id: 't1', title: 'Task 1', status: 'todo' },
      { id: 't2', title: 'Task 2', status: 'in_progress' },
      { id: 't3', title: 'Task 3', status: 'done' },
    ],
  })),
  updateTaskStatus: vi.fn(async () => ({ success: true })),
  updateTask: vi.fn(async () => ({ success: true })),
  deleteTask: vi.fn(async () => ({ success: true })),
  deleteFeedback: vi.fn(async () => ({ success: true })),
  updateFeedback: vi.fn(async () => ({ success: true })),
}));

describe('useKanbanBoard', () => {
  it('initial state - columns empty', () => {
    const { result } = renderHook(() => useKanbanBoard({
      refreshKey: 0,
      onRefresh: () => {},
    }));

    expect(result.current.columns).toEqual({
      todo: [],
      in_progress: [],
      review: [],
      done: [],
    });
  });

  it('loadTasks - fetches and groups by status', async () => {
    const { result } = renderHook(() => useKanbanBoard({
      refreshKey: 0,
      onRefresh: () => {},
    }));

    await waitFor(() => {
      expect(result.current.columns.todo.length).toBeGreaterThan(0);
    });

    expect(result.current.columns.todo).toEqual([
      expect.objectContaining({ id: 't1', status: 'todo' }),
    ]);
    expect(result.current.columns.in_progress).toEqual([
      expect.objectContaining({ id: 't2', status: 'in_progress' }),
    ]);
    expect(result.current.columns.done).toEqual([
      expect.objectContaining({ id: 't3', status: 'done' }),
    ]);
  });

  it('loadTasks - groups tasks by status correctly', async () => {
    const { result } = renderHook(() => useKanbanBoard({
      refreshKey: 0,
      onRefresh: () => {},
    }));

    await waitFor(() => {
      expect(result.current.columns.todo.length).toBe(1);
    });

    expect(result.current.columns.todo[0].id).toBe('t1');
    expect(result.current.columns.in_progress[0].id).toBe('t2');
    expect(result.current.columns.done[0].id).toBe('t3');
  });

  it('handleDragEnd - optimistic update moves task', async () => {
    const { result } = renderHook(() => useKanbanBoard({
      refreshKey: 0,
      onRefresh: () => {},
    }));

    await waitFor(() => {
      expect(result.current.columns.todo.length).toBeGreaterThan(0);
    });

    await act(async () => {
      await result.current.handleDragEnd({
        source: { droppableId: 'todo', index: 0 },
        destination: { droppableId: 'in_progress', index: 0 },
        draggableId: 't1',
      });
    });

    expect(result.current.columns.todo.length).toBe(0);
    expect(result.current.columns.in_progress[0].status).toBe('in_progress');
  });

  it('handleDragEnd - ignores when source equals destination', async () => {
    const { result } = renderHook(() => useKanbanBoard({
      refreshKey: 0,
      onRefresh: () => {},
    }));

    await waitFor(() => {
      expect(result.current.columns.todo.length).toBeGreaterThan(0);
    });

    const prevLength = result.current.columns.todo.length;

    await act(async () => {
      await result.current.handleDragEnd({
        source: { droppableId: 'todo', index: 0 },
        destination: { droppableId: 'todo', index: 0 },
        draggableId: 't1',
      });
    });

    expect(result.current.columns.todo.length).toBe(prevLength);
  });

  it('handleDragEnd - ignores when no destination', async () => {
    const { result } = renderHook(() => useKanbanBoard({
      refreshKey: 0,
      onRefresh: () => {},
    }));

    await waitFor(() => {
      expect(result.current.columns.todo.length).toBeGreaterThan(0);
    });

    const prevLength = result.current.columns.todo.length;

    await act(async () => {
      await result.current.handleDragEnd({
        source: { droppableId: 'todo', index: 0 },
        destination: null,
        draggableId: 't1',
      });
    });

    expect(result.current.columns.todo.length).toBe(prevLength);
  });

  it('handleDragEnd - calls updateTaskStatus when status changes', async () => {
    const { updateTaskStatus } = await import('../../../api/task-api-client.js');
    updateTaskStatus.mockClear();

    const { result } = renderHook(() => useKanbanBoard({
      refreshKey: 0,
      onRefresh: () => {},
    }));

    await waitFor(() => {
      expect(result.current.columns.todo.length).toBeGreaterThan(0);
    });

    await act(async () => {
      await result.current.handleDragEnd({
        source: { droppableId: 'todo', index: 0 },
        destination: { droppableId: 'in_progress', index: 0 },
        draggableId: 't1',
      });
    });

    expect(updateTaskStatus).toHaveBeenCalledWith('t1', 'in_progress');
  });

  it('handleDragEnd - does not call API when dragging within same status', async () => {
    const { updateTaskStatus } = await import('../../../api/task-api-client.js');
    updateTaskStatus.mockClear();

    const { result } = renderHook(() => useKanbanBoard({
      refreshKey: 0,
      onRefresh: () => {},
    }));

    await waitFor(() => {
      expect(result.current.columns.todo.length).toBeGreaterThan(0);
    });

    await act(async () => {
      await result.current.handleDragEnd({
        source: { droppableId: 'todo', index: 0 },
        destination: { droppableId: 'todo', index: 0 },
        draggableId: 't1',
      });
    });

    expect(updateTaskStatus).not.toHaveBeenCalled();
  });

  it('handleDragEnd - reverts on API failure', async () => {
    const { updateTaskStatus, fetchTasks } = await import('../../../api/task-api-client.js');
    updateTaskStatus.mockRejectedValueOnce(new Error('API Error'));
    fetchTasks.mockResolvedValueOnce({
      tasks: [
        { id: 't1', title: 'Task 1', status: 'todo' },
        { id: 't2', title: 'Task 2', status: 'in_progress' },
      ],
    });

    const { result } = renderHook(() => useKanbanBoard({
      refreshKey: 0,
      onRefresh: () => {},
    }));

    await waitFor(() => {
      expect(result.current.columns.todo.length).toBeGreaterThan(0);
    });

    await act(async () => {
      await result.current.handleDragEnd({
        source: { droppableId: 'todo', index: 0 },
        destination: { droppableId: 'in_progress', index: 0 },
        draggableId: 't1',
      });
    });

    await waitFor(() => {
      expect(result.current.columns.todo.length).toBe(1);
    });
  });

  it('handleEdit - calls updateTask and reloads', async () => {
    const { updateTask } = await import('../../../api/task-api-client.js');
    updateTask.mockClear();

    const onRefresh = vi.fn();
    const { result } = renderHook(() => useKanbanBoard({
      refreshKey: 0,
      onRefresh,
    }));

    await waitFor(() => {
      expect(result.current.columns.todo.length).toBeGreaterThan(0);
    });

    await act(async () => {
      await result.current.handleEdit('t1', { title: 'Updated' });
    });

    expect(updateTask).toHaveBeenCalledWith('t1', { title: 'Updated' });
    expect(onRefresh).toHaveBeenCalled();
  });

  it('handleDelete - calls deleteTask and reloads', async () => {
    const { deleteTask } = await import('../../../api/task-api-client.js');
    deleteTask.mockClear();

    const onRefresh = vi.fn();
    const { result } = renderHook(() => useKanbanBoard({
      refreshKey: 0,
      onRefresh,
    }));

    await waitFor(() => {
      expect(result.current.columns.todo.length).toBeGreaterThan(0);
    });

    await act(async () => {
      await result.current.handleDelete('t1');
    });

    expect(deleteTask).toHaveBeenCalledWith('t1');
    expect(onRefresh).toHaveBeenCalled();
  });

  it('handleDeleteFeedback - calls deleteFeedback and reloads', async () => {
    const { deleteFeedback } = await import('../../../api/task-api-client.js');
    deleteFeedback.mockClear();

    const onRefresh = vi.fn();
    const { result } = renderHook(() => useKanbanBoard({
      refreshKey: 0,
      onRefresh,
    }));

    await waitFor(() => {
      expect(result.current.columns.todo.length).toBeGreaterThan(0);
    });

    await act(async () => {
      await result.current.handleDeleteFeedback('t1', 'fb_001');
    });

    expect(deleteFeedback).toHaveBeenCalledWith('t1', 'fb_001');
    expect(onRefresh).toHaveBeenCalled();
  });

  it('handleUpdateFeedback - calls updateFeedback and reloads', async () => {
    const { updateFeedback } = await import('../../../api/task-api-client.js');
    updateFeedback.mockClear();

    const onRefresh = vi.fn();
    const { result } = renderHook(() => useKanbanBoard({
      refreshKey: 0,
      onRefresh,
    }));

    await waitFor(() => {
      expect(result.current.columns.todo.length).toBeGreaterThan(0);
    });

    await act(async () => {
      await result.current.handleUpdateFeedback('t1', 'fb_001', { content: 'updated' });
    });

    expect(updateFeedback).toHaveBeenCalledWith('t1', 'fb_001', { content: 'updated' });
    expect(onRefresh).toHaveBeenCalled();
  });

  it('loadTasks - called on refreshKey change', async () => {
    const { fetchTasks } = await import('../../../api/task-api-client.js');
    fetchTasks.mockClear();

    const { result, rerender } = renderHook(
      ({ refreshKey }) => useKanbanBoard({ refreshKey, onRefresh: () => {} }),
      { initialProps: { refreshKey: 0 } }
    );

    await waitFor(() => {
      expect(fetchTasks).toHaveBeenCalled();
    });

    const callCount1 = fetchTasks.mock.calls.length;

    rerender({ refreshKey: 1 });

    await waitFor(() => {
      expect(fetchTasks.mock.calls.length).toBeGreaterThan(callCount1);
    });
  });
});
