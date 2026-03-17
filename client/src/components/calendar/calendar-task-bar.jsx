import { Tooltip, Typography } from 'antd';
import { getTaskBarStyle } from './calendar-utils.js';

const { Text } = Typography;

// Single task bar rendered inside calendar grid week row
export default function CalendarTaskBar({ task, span, todayStr }) {
  const dateRange = `${task.startDate?.slice(5)} → ${task.dueDate?.slice(5)}`;

  // Feedback continuation bar (purple)
  if (task._isFeedbackBar) {
    return (
      <Tooltip title={`🛠️ ${task.name} — ${dateRange}`}>
        <div style={{
          background: '#f9f0ff',
          border: '2px solid #222',
          borderRadius: 0,
          padding: '2px 6px',
          fontSize: 11,
          color: '#531dab',
          fontWeight: 700,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          cursor: 'default',
          lineHeight: '18px',
        }}>
          🛠️ {task.name}
        </div>
      </Tooltip>
    );
  }

  // Normal task bar
  const style = getTaskBarStyle(task, todayStr);
  const gameProject = [task.game, task.project].filter(Boolean).join(' / ');

  return (
    <Tooltip title={`${task.name} — ${gameProject ? gameProject + ' — ' : ''}${dateRange}`}>
      <div style={{
        background: style.bg,
        border: '2px solid #222',
        borderRadius: 0,
        padding: '2px 6px',
        fontSize: 12,
        color: style.color,
        fontWeight: 700,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        cursor: 'default',
        lineHeight: '20px',
      }}>
        {style.isFeedback && <span style={{ display:'inline-block', width:6, height:6, borderRadius:'50%', background:'#722ed1', marginRight:2, verticalAlign:'middle', flexShrink:0 }} />}
        {style.emoji && <span style={{ marginRight: 3 }}>{style.emoji}</span>}
        <Text style={{ fontSize: 12, color: style.color }} ellipsis>
          {task.name}
        </Text>
      </div>
    </Tooltip>
  );
}
