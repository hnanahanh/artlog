import { useEffect, useState, useCallback } from 'react';
import { message } from 'antd';
import { fetchTasks, updateTask, deleteTask, deleteFeedback, updateFeedback } from '../api/task-api-client.js';
import TaskTableView from '../components/table/task-table-view.jsx';

export default function TablePage({ refreshKey }) {
  const [tasks, setTasks] = useState([]);

  const loadTasks = useCallback(() => {
    fetchTasks().then(r => setTasks(r.tasks || r)).catch(console.error);
  }, []);

  useEffect(() => { loadTasks(); }, [refreshKey, loadTasks]);

  const handleEdit = async (id, formData) => {
    try {
      await updateTask(id, formData);
      loadTasks();
    } catch {
      message.error('Update failed');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteTask(id);
      loadTasks();
    } catch {
      message.error('Delete failed');
    }
  };

  const handleDeleteFeedback = async (taskId, fbId) => {
    try {
      await deleteFeedback(taskId, fbId);
      loadTasks();
    } catch {
      message.error('Delete feedback failed');
    }
  };

  const handleUpdateFeedback = async (taskId, fbId, data) => {
    try {
      await updateFeedback(taskId, fbId, data);
      loadTasks();
    } catch {
      message.error('Update feedback failed');
    }
  };

  return (
    <div style={{ background: '#fff', borderRadius: 8, padding: 16, border: '1px solid #f0f0f0' }}>
      <TaskTableView tasks={tasks} onEdit={handleEdit} onDelete={handleDelete}
        onDeleteFeedback={handleDeleteFeedback} onUpdateFeedback={handleUpdateFeedback} />
    </div>
  );
}
