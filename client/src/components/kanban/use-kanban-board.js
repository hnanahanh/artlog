import { useEffect, useState, useCallback } from 'react';
import { message } from 'antd';
import { fetchTasks, updateTaskStatus, updateTask, deleteTask, deleteFeedback, updateFeedback } from '../../api/task-api-client.js';

// Custom hook encapsulating all data fetching and event handlers for KanbanBoard
export function useKanbanBoard({ refreshKey, onRefresh }) {
  const [columns, setColumns] = useState({
    todo: [], in_progress: [], review: [], done: [],
  });

  const loadTasks = useCallback(() => {
    fetchTasks().then(result => {
      const tasks = result.tasks || result;
      const grouped = { todo: [], in_progress: [], review: [], done: [] };
      tasks.forEach(task => {
        if (grouped[task.status]) grouped[task.status].push(task);
      });
      setColumns(grouped);
    }).catch(console.error);
  }, []);

  useEffect(() => { loadTasks(); }, [refreshKey, loadTasks]);

  const handleDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const srcStatus = source.droppableId;
    const destStatus = destination.droppableId;

    // Optimistic update: move task in state
    setColumns(prev => {
      const updated = { ...prev };
      const srcList = [...updated[srcStatus]];
      const [moved] = srcList.splice(source.index, 1);
      moved.status = destStatus;
      const destList = srcStatus === destStatus ? srcList : [...updated[destStatus]];
      destList.splice(destination.index, 0, moved);
      updated[srcStatus] = srcList;
      updated[destStatus] = destList;
      return updated;
    });

    if (srcStatus !== destStatus) {
      try {
        await updateTaskStatus(draggableId, destStatus);
        onRefresh?.();
      } catch {
        message.error('Status update failed');
        loadTasks();
      }
    }
  };

  const handleEdit = async (taskId, formData) => {
    try {
      await updateTask(taskId, formData);
      loadTasks();
      onRefresh?.();
    } catch {
      message.error('Update failed');
    }
  };

  const handleDeleteFeedback = async (taskId, fbId) => {
    try {
      await deleteFeedback(taskId, fbId);
      loadTasks();
      onRefresh?.();
    } catch {
      message.error('Delete feedback failed');
    }
  };

  const handleUpdateFeedback = async (taskId, fbId, data) => {
    try {
      await updateFeedback(taskId, fbId, data);
      loadTasks();
      onRefresh?.();
    } catch {
      message.error('Update feedback failed');
    }
  };

  const handleDelete = async (taskId) => {
    try {
      await deleteTask(taskId);
      loadTasks();
      onRefresh?.();
    } catch {
      message.error('Delete failed');
    }
  };

  return {
    columns,
    handleDragEnd, handleEdit, handleDelete,
    handleDeleteFeedback, handleUpdateFeedback,
  };
}
