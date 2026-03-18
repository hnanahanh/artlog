import { Tooltip, Typography } from 'antd';
import { getTaskBarStyle } from './calendar-utils.js';

const { Text } = Typography;

// Single task bar rendered inside calendar grid week row
export default function CalendarTaskBar({ task, span, todayStr }) {
  const dateRange = `${task.startDate?.slice(5)} → ${task.dueDate?.slice(5)}`;
  const style = getTaskBarStyle(task, todayStr);

  // Feedback bar: same color family but darker (use style.color), prefix 🛠️
  const isFb = task._isFeedbackBar;
  const bg = isFb ? style.color : style.border;
  const tooltipText = isFb
    ? `🛠️ ${task.name} — ${dateRange}`
    : `${task.name} — ${[task.game, task.project].filter(Boolean).join(' / ')}${task.game || task.project ? ' — ' : ''}${dateRange}`;

  return (
    <Tooltip title={tooltipText}>
      <div style={{
        background: bg,
        borderRadius: 0,
        padding: '2px 6px',
        fontSize: 12,
        color: '#fff',
        fontWeight: 700,
        display: 'flex', alignItems: 'center', gap: 3,
        overflow: 'hidden',
        cursor: 'default',
        lineHeight: '20px',
      }}>
        {isFb
          ? <span style={{ fontSize: 10, flexShrink: 0 }}>🛠️</span>
          : style.emoji && <span>{style.emoji}</span>
        }
        <Text style={{ fontSize: 12, color: '#fff', flex: 1, minWidth: 0 }} ellipsis>
          {task.name}
        </Text>
      </div>
    </Tooltip>
  );
}
