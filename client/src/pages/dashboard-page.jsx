import { useEffect, useState, useCallback } from 'react';
import { Typography, Flex, Button, message } from 'antd';
import NeoTabs from '../components/shared/neo-tabs.jsx';
import { LeftOutlined, RightOutlined, PlusOutlined } from '@ant-design/icons';
// PlusOutlined still used by addButton below
import { Drawer } from 'antd';
import dayjs from 'dayjs';
import { fetchTodayTasks, fetchTasks, updateTask, deleteTask, deleteFeedback, updateFeedback, fetchCalendarTasks } from '../api/task-api-client.js';
import { categorizeByDueDate } from '../processors/task-processor.js';
import { useI18n } from '../i18n/i18n-config.jsx';
import KanbanBoard from '../components/kanban/kanban-board.jsx';
import TaskTableView from '../components/table/task-table-view.jsx';
import CalendarMonthGrid from '../components/calendar/calendar-month-grid.jsx';
import QuickMagicInput from '../components/smart-input/quick-magic-input.jsx';
import AppHeader from '../components/layout/app-header.jsx';

const { Text, Title } = Typography;

/* Neo-brutalism tab CSS — no outer border/shadow (container handles it) */
const NEO_TABS_CSS = `

.neo-tabs .ant-tabs-nav { margin-bottom: 0 !important; background: var(--bg-header); padding: 0 !important; border-bottom: 2px solid var(--border-color); }
.neo-tabs .ant-tabs-nav::before { border: none !important; }
.neo-tabs .ant-tabs-ink-bar { display: none !important; }
.neo-tabs .ant-tabs-tab {
  border: none !important;
  border-right: 2px solid var(--border-color) !important;
  border-radius: 0 !important;
  font-weight: 700 !important;
  font-family: 'JetBrains Mono' !important;
  padding: 8px 20px !important;
  margin: 0 !important;
  background: transparent !important;
  transition: all 0.15s ease !important;
}
.neo-tabs .ant-tabs-tab:hover { background: rgba(0,0,0,0.08) !important; }
.neo-tabs .ant-tabs-tab-active { background: var(--accent-active) !important; }
.neo-tabs .ant-tabs-tab-active .ant-tabs-tab-btn { color: var(--text-primary) !important; }
.neo-tabs .ant-tabs-content { background: var(--bg-card) !important; }
.neo-tabs .ant-tabs-tabpane { padding: 12px 16px; }
.neo-tabs .ant-tabs-nav-wrap { flex: 1 !important; }
.neo-tabs .ant-tabs-nav-list { display: flex !important; width: 100% !important; }
.neo-tabs .ant-tabs-tab { flex: 1 !important; justify-content: center !important; }
.reminder-content::-webkit-scrollbar { width: 8px; }
.reminder-content::-webkit-scrollbar-track { background: var(--bg-secondary); border-left: 2px solid var(--border-color); }
.reminder-content::-webkit-scrollbar-thumb { background: var(--border-color); border: 2px solid var(--border-color); border-radius: 0; }
@media (max-width: 768px) {
  .dashboard-row { flex-direction: column !important; }
  .dashboard-row > * { flex: none !important; width: 100% !important; max-width: 100% !important; min-width: 0 !important; }
}
`;

// --- Reminder Row ---
function ReminderRow({ task, type }) {
  const isOverdue = type === 'overdue';
  const gameProject = [task.project, task.type].filter(Boolean).join(' / ');

  const rowStyle = isOverdue
    ? { padding: '8px 12px', borderBottom: '2px solid var(--border-color)', background: 'var(--danger-bg)', margin: '0 -12px' }
    : { padding: '8px 0', borderBottom: '2px solid var(--border-color)' };

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
        fontSize: 15, whiteSpace: 'nowrap', flexShrink: 0, fontWeight: 700, textAlign: 'right',
        color: isOverdue ? 'var(--danger-text)' : 'var(--text-primary)',
      }}>
        {task.startDate?.slice(5)} → {task.dueDate?.slice(5)}
        {task.feedbacks?.length > 0 && (() => {
          const fb = task.feedbacks.at(-1);
          const fbEnd = fb.endDate ?? fb.createdAt;
          return <span style={{ color: 'var(--feedback-color)' }}> → {fb.startDate?.slice(5)} → {fbEnd?.slice(5, 10)}</span>;
        })()}
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
function CalendarTab({ refreshKey, onAddTask }) {
  const { t } = useI18n();
  const [current, setCurrent] = useState(dayjs());
  const [tasks, setTasks] = useState([]);
  const year = current.year();
  const month = current.month() + 1;

  const loadTasks = useCallback(() => {
    const from = current.startOf('month').startOf('week').format('YYYY-MM-DD');
    const to = current.endOf('month').endOf('week').format('YYYY-MM-DD');
    fetchCalendarTasks(from, to).then(r => setTasks(r.tasks || r)).catch(console.error);
  }, [current]);

  useEffect(() => { loadTasks(); }, [year, month, refreshKey, loadTasks]);

  const handleEdit = async (id, formData) => {
    try {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, ...formData } : t));
      await updateTask(id, formData);
      loadTasks();
    } catch { message.error('Update failed'); }
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

  const titleBar = (
    <Flex align="center" justify="space-between">
      <Title level={5} style={{ margin: 0, color: 'var(--text-primary)' }}>
        {(t('calendar.month_format') || '{month}/{year}').replace('{month}', month).replace('{monthName}', current.format('MMMM')).replace('{year}', year)}
      </Title>
      <Flex gap={8}>
        <Button icon={<LeftOutlined />} size="small" onClick={() => setCurrent(c => c.subtract(1, 'month'))} />
        <Button size="small" onClick={() => setCurrent(dayjs())}>{t('calendar.today') || 'Hôm nay'}</Button>
        <Button icon={<RightOutlined />} size="small" onClick={() => setCurrent(c => c.add(1, 'month'))} />
      </Flex>
    </Flex>
  );

  return (
    <div>
      <CalendarMonthGrid year={year} month={month} tasks={tasks} onEdit={handleEdit} onDelete={handleDelete} onDeleteFeedback={handleDeleteFeedback} onUpdateFeedback={handleUpdateFeedback} onAddTask={onAddTask} navBar={titleBar} />
    </div>
  );
}

// --- Main Dashboard ---
export default function DashboardPage({ refreshKey, onTasksCreated }) {
  const { t } = useI18n();
  const [data, setData] = useState({ today: [], overdue: [], upcoming: [] });
  const [localRefresh, setLocalRefresh] = useState(0);

  const loadData = () => fetchTodayTasks().then(setData).catch(console.error);
  useEffect(() => { loadData(); }, [refreshKey, localRefresh]);

  const handleRefresh = () => setLocalRefresh(k => k + 1);

  const { urgentList, upcomingList } = categorizeByDueDate(data);
  const hasUrgent = urgentList.length > 0;
  const hasUpcoming = upcomingList.length > 0;

  // Reminder tab content
  const ReminderTab = () => (
    <div className="reminder-content" style={{ background: 'var(--bg-secondary)', padding: '8px 12px', maxHeight: 360, overflowY: 'auto' }}>
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
  );

  const [addOpen, setAddOpen] = useState(false);

  const tabItems = [
    { value: 'kanban', label: 'Kanban', children: <KanbanBoard refreshKey={refreshKey} onRefresh={handleRefresh} /> },
    { value: 'calendar', label: t('nav.calendar') || 'Lịch', children: <CalendarTab refreshKey={refreshKey} onAddTask={() => setAddOpen(true)} /> },
    { value: 'table', label: t('nav.table') || 'Bảng', children: <TableTab refreshKey={refreshKey} /> },
  ];

  const addButton = (
    <button
      className="neo-btn"
      onClick={() => setAddOpen(true)}
      style={{
        padding: '8px 16px', fontSize: 13, fontWeight: 900,
        color: 'var(--text-on-accent)', background: 'var(--btn-add-bg)',
        display: 'flex', alignItems: 'center', gap: 6,
        whiteSpace: 'nowrap',
      }}
    >
      <PlusOutlined style={{ fontSize: 12 }} /> {t('common.add_task')}
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <NeoTabs defaultValue="calendar" defaultVisible={['calendar']} items={tabItems} extra={addButton} />

      {/* Shared Add Task drawer */}
      <Drawer
        open={addOpen}
        onClose={() => setAddOpen(false)}
        placement={window.innerWidth <= 768 ? 'bottom' : 'right'}
        width={720}
        height="85vh"
        title={<span style={{ fontWeight: 900, fontFamily: "'JetBrains Mono'" }}>{t('magic.drawer_title')}</span>}
        styles={{
          header: { border: 'none', borderBottom: '2px solid var(--border-color)', background: 'var(--bg-header)', flexShrink: 0 },
          body: { padding: 0, background: 'var(--bg-card)', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
          wrapper: { boxShadow: 'none' },
        }}
        destroyOnClose={false}
      >
        <QuickMagicInput
          onTasksCreated={() => { handleRefresh(); onTasksCreated?.(); setAddOpen(false); }}
        />
      </Drawer>

{/* Overdue notification moved to App level */}
    </div>
  );
}
