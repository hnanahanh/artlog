import { useEffect, useState, useCallback } from 'react';
import { Typography, Flex, Tabs, Button, message } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { fetchTodayTasks, fetchTasks, updateTask, deleteTask, deleteFeedback, updateFeedback, fetchCalendarTasks } from '../api/task-api-client.js';
import { categorizeByDueDate } from '../processors/task-processor.js';
import { useI18n } from '../i18n/i18n-config.jsx';
import KanbanBoard from '../components/kanban/kanban-board.jsx';
import TaskTableView from '../components/table/task-table-view.jsx';
import CalendarMonthGrid from '../components/calendar/calendar-month-grid.jsx';

const { Text, Title } = Typography;

// Neo-brutalism tab CSS — using CSS variables for dark mode
const NEO_TABS_CSS = `
.neo-tabs { border: 3px solid var(--border-color); border-radius: 2px; overflow: hidden; box-shadow: 4px 4px 0px var(--shadow-color); background: var(--bg-card); transition: background-color 0.3s, border-color 0.3s; }
.neo-tabs .ant-tabs-nav { margin-bottom: 0 !important; background: var(--bg-header); padding: 0 !important; border-bottom: 2px solid var(--border-color); }
.neo-tabs .ant-tabs-nav::before { border: none !important; }
.neo-tabs .ant-tabs-ink-bar { display: none !important; }
.neo-tabs .ant-tabs-tab {
  border: none !important;
  border-right: 2px solid var(--border-color) !important;
  border-radius: 0 !important;
  font-weight: 700 !important;
  padding: 8px 20px !important;
  margin: 0 !important;
  background: transparent !important;
  transition: all 0.15s ease !important;
}
.neo-tabs .ant-tabs-tab:hover { background: rgba(0,0,0,0.08) !important; }
.neo-tabs .ant-tabs-tab-active { background: var(--accent-active) !important; }
.neo-tabs .ant-tabs-tab-active .ant-tabs-tab-btn { color: #222 !important; }
.neo-tabs .ant-tabs-content { background: var(--bg-card) !important; }
.neo-tabs .ant-tabs-tabpane { padding: 12px 16px; }
.neo-tabs .ant-tabs-nav-wrap { flex: 1 !important; }
.neo-tabs .ant-tabs-nav-list { display: flex !important; width: 100% !important; }
.neo-tabs .ant-tabs-tab { flex: 1 !important; justify-content: center !important; }
.reminder-content::-webkit-scrollbar { width: 8px; }
.reminder-content::-webkit-scrollbar-track { background: var(--bg-secondary); border-left: 2px solid var(--border-color); }
.reminder-content::-webkit-scrollbar-thumb { background: var(--border-color); border: 2px solid var(--border-color); border-radius: 0; }
`;

// --- Reminder Row ---
function ReminderRow({ task, type }) {
  const isOverdue = type === 'overdue';
  const gameProject = [task.game, task.project].filter(Boolean).join(' / ');

  const rowStyle = isOverdue
    ? { padding: '8px 12px', borderBottom: '2px solid var(--bg-header)', background: 'var(--danger-bg)', margin: '0 -12px' }
    : { padding: '8px 0', borderBottom: '2px solid var(--bg-header)' };

  return (
    <Flex align="center" gap={8} style={rowStyle}>
      {isOverdue && <span style={{ fontSize: '1rem', flexShrink: 0 }}>🚨</span>}
      <Text style={{
        flex: 1, minWidth: 0, fontSize: 15, fontWeight: 700,
        color: isOverdue ? 'var(--danger-text)' : 'var(--text-primary)',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {task.name}
        {task.feedbacks?.length > 0 && (
          <span style={{ color: 'var(--feedback-color)', fontWeight: 600, marginLeft: 6 }}>
            + {task.feedbacks.at(-1).content}
          </span>
        )}
      </Text>
      {gameProject && (
        <Text style={{ fontSize: 11, whiteSpace: 'nowrap', flexShrink: 0, color: 'var(--text-secondary)', width: 100, textAlign: 'right' }}>
          {gameProject}
        </Text>
      )}
      <Text style={{
        fontSize: 15, whiteSpace: 'nowrap', flexShrink: 0, fontWeight: 700, width: 110, textAlign: 'right',
        color: isOverdue ? 'var(--danger-text)' : 'var(--text-primary)',
      }}>
        {task.startDate?.slice(5)} → {task.dueDate?.slice(5)}
      </Text>
    </Flex>
  );
}

// --- Table Tab ---
function TableTab({ refreshKey }) {
  const [tasks, setTasks] = useState([]);
  const loadTasks = useCallback(() => {
    fetchTasks().then(r => setTasks(r.tasks || r)).catch(console.error);
  }, []);
  useEffect(() => { loadTasks(); }, [refreshKey, loadTasks]);

  const handleEdit = async (id, formData) => {
    try { await updateTask(id, formData); loadTasks(); } catch { message.error('Update failed'); }
  };
  const handleDelete = async (id) => {
    try { await deleteTask(id); loadTasks(); } catch { message.error('Delete failed'); }
  };
  const handleDeleteFeedback = async (taskId, fbId) => {
    try { await deleteFeedback(taskId, fbId); loadTasks(); } catch { message.error('Delete feedback failed'); }
  };
  const handleUpdateFeedback = async (taskId, fbId, data) => {
    try { await updateFeedback(taskId, fbId, data); loadTasks(); } catch { message.error('Update feedback failed'); }
  };

  return (
    <TaskTableView tasks={tasks} onEdit={handleEdit} onDelete={handleDelete}
      onDeleteFeedback={handleDeleteFeedback} onUpdateFeedback={handleUpdateFeedback} />
  );
}

// --- Calendar Tab ---
function CalendarTab({ refreshKey }) {
  const { t } = useI18n();
  const [current, setCurrent] = useState(dayjs());
  const [tasks, setTasks] = useState([]);
  const year = current.year();
  const month = current.month() + 1;

  useEffect(() => {
    const from = current.startOf('month').startOf('week').format('YYYY-MM-DD');
    const to = current.endOf('month').endOf('week').format('YYYY-MM-DD');
    fetchCalendarTasks(from, to).then(r => setTasks(r.tasks || r)).catch(console.error);
  }, [year, month, refreshKey]);

  return (
    <div>
      <Flex align="center" gap={12} style={{ marginBottom: 12 }}>
        <Button icon={<LeftOutlined />} size="small" onClick={() => setCurrent(c => c.subtract(1, 'month'))} />
        <Title level={5} style={{ margin: 0, minWidth: 160, textAlign: 'center', color: 'var(--text-primary)' }}>
          {(t('calendar.month_format') || '{month}/{year}').replace('{month}', month).replace('{year}', year)}
        </Title>
        <Button icon={<RightOutlined />} size="small" onClick={() => setCurrent(c => c.add(1, 'month'))} />
        <Button size="small" onClick={() => setCurrent(dayjs())}>{t('calendar.today') || 'Hôm nay'}</Button>
      </Flex>
      <CalendarMonthGrid year={year} month={month} tasks={tasks} />
    </div>
  );
}

// --- Main Dashboard ---
export default function DashboardPage({ refreshKey }) {
  const { t } = useI18n();
  const [data, setData] = useState({ today: [], overdue: [], upcoming: [] });
  const [localRefresh, setLocalRefresh] = useState(0);

  const loadData = () => fetchTodayTasks().then(setData).catch(console.error);
  useEffect(() => { loadData(); }, [refreshKey, localRefresh]);

  const handleRefresh = () => setLocalRefresh(k => k + 1);

  const { urgentList, upcomingList } = categorizeByDueDate(data);
  const hasUrgent = urgentList.length > 0;
  const hasUpcoming = upcomingList.length > 0;

  const tabItems = [
    { key: 'kanban', label: 'Kanban', children: <KanbanBoard refreshKey={refreshKey} onRefresh={handleRefresh} /> },
    { key: 'calendar', label: t('nav.calendar') || 'Lịch', children: <CalendarTab refreshKey={refreshKey} /> },
    { key: 'table', label: t('nav.table') || 'Bảng', children: <TableTab refreshKey={refreshKey} /> },
  ];

  return (
    <div>
      <style>{NEO_TABS_CSS}</style>

      {/* Reminder Panel */}
      <div style={{
        border: '3px solid var(--border-color)', borderRadius: 2, overflow: 'hidden',
        marginBottom: 16, boxShadow: '4px 4px 0px var(--shadow-color)',
        transition: 'border-color 0.3s',
      }}>
        <div style={{
          background: 'var(--bg-header)', padding: '8px 12px',
          fontWeight: 900, fontSize: 14, borderBottom: '2px solid var(--border-color)',
          color: 'var(--text-primary)',
        }}>
          {t('reminder.title')}
        </div>
        <div className="reminder-content" style={{ background: 'var(--bg-secondary)', padding: '8px 12px', maxHeight: 200, overflowY: 'auto' }}>
          {!hasUrgent && <Text type="secondary" style={{ fontSize: 12 }}>—</Text>}
          {urgentList.map(task => (
            <ReminderRow key={task.id} task={task} type={task._type} />
          ))}
          {hasUpcoming && (
            <>
              <div style={{
                background: 'var(--bg-header)', padding: '6px 10px',
                fontWeight: 900, fontSize: 13, color: 'var(--text-primary)',
                margin: '8px -12px', borderTop: '2px solid var(--border-color)', borderBottom: '2px solid var(--border-color)',
              }}>
                {t('reminder.upcoming')}
              </div>
              {upcomingList.map(task => (
                <ReminderRow key={task.id} task={task} type="upcoming" />
              ))}
            </>
          )}
        </div>
      </div>

      {/* Task Views Tabs */}
      <Tabs
        className="neo-tabs"
        defaultActiveKey="kanban"
        items={tabItems}
        destroyInactiveTabPane={false}
      />
    </div>
  );
}
