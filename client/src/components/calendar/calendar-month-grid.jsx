import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import CalendarTaskBar from './calendar-task-bar.jsx';

const todayStr = dayjs().format('YYYY-MM-DD');
const LABEL_W = 160; // task name column width
const DAY_W = 38;    // per-day column width

/** All weekdays (Mon–Fri) within the given month */
function getMonthWeekdays(year, month) {
  const firstDay = dayjs(`${year}-${String(month).padStart(2, '0')}-01`);
  const lastDay = firstDay.endOf('month');
  const days = [];
  let d = firstDay;
  while (!d.isAfter(lastDay)) {
    if (d.day() >= 1 && d.day() <= 5) days.push(d); // 1=Mon, 5=Fri
    d = d.add(1, 'day');
  }
  return days;
}

/** Bar start/end indices in the weekdays array; returns null if not visible */
function getBarPos(task, weekdays) {
  const taskStart = task.startDate || task.dueDate;
  const taskEnd = task.dueDate;
  let startIdx = weekdays.findIndex(d => d.format('YYYY-MM-DD') >= taskStart);
  let endIdx = -1;
  for (let i = weekdays.length - 1; i >= 0; i--) {
    if (weekdays[i].format('YYYY-MM-DD') <= taskEnd) { endIdx = i; break; }
  }
  if (startIdx === -1 || endIdx === -1 || startIdx > endIdx) return null;
  return { startIdx, endIdx, span: endIdx - startIdx + 1 };
}

export default function CalendarMonthGrid({ year, month, tasks, onEdit, onDelete }) {
  const weekdays = getMonthWeekdays(year, month);
  const [dragOverDate, setDragOverDate] = useState(null);
  const todayIdx = weekdays.findIndex(d => d.format('YYYY-MM-DD') === todayStr);
  const totalW = LABEL_W + weekdays.length * DAY_W;

  // Clear highlight when drag ends without a valid drop
  useEffect(() => {
    const clear = () => setDragOverDate(null);
    document.addEventListener('dragend', clear);
    return () => document.removeEventListener('dragend', clear);
  }, []);

  const handleDrop = (e, targetDate) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    const startDate = e.dataTransfer.getData('startDate');
    const dueDate = e.dataTransfer.getData('dueDate');
    if (!taskId) return;
    const duration = dayjs(dueDate).diff(dayjs(startDate), 'day');
    onEdit?.(taskId, { startDate: targetDate, dueDate: dayjs(targetDate).add(duration, 'day').format('YYYY-MM-DD') });
    setDragOverDate(null);
  };

  // Flatten tasks + feedback bars into rows
  const rows = [];
  tasks.forEach(task => {
    rows.push(task);
    task.feedbacks?.forEach(fb => {
      const s = fb.startDate || task.dueDate;
      const e = fb.endDate || fb.createdAt?.slice(0, 10);
      if (!s || !e) return;
      rows.push({
        id: `${task.id}_fb_${fb.id}`,
        name: fb.content,
        startDate: s < e ? s : e,
        dueDate: s < e ? e : s,
        status: task.status,
        _isFeedbackBar: true,
        _parentId: task.id,
      });
    });
  });

  // Group weekdays by week for header grouping
  const weekGroups = [];
  weekdays.forEach((d, i) => {
    const wk = d.format('YYYY-[W]WW');
    if (!weekGroups.length || weekGroups.at(-1).week !== wk) {
      weekGroups.push({ week: wk, start: i, days: [d] });
    } else {
      weekGroups.at(-1).days.push(d);
    }
  });

  return (
    <div style={{
      border: '2px solid #222', borderRadius: 4, overflow: 'hidden',
      boxShadow: '4px 4px 0px #222', overflowX: 'auto',
    }}>
      <div style={{ minWidth: totalW }}>
        {/* ── Week group header ────────────────────────────── */}
        <div style={{ display: 'flex', borderBottom: '1px solid #ccc', background: 'var(--bg-header, #f5f5f5)' }}>
          <div style={{ width: LABEL_W, flexShrink: 0, borderRight: '2px solid #222' }} />
          {weekGroups.map(g => (
            <div key={g.week} style={{
              width: g.days.length * DAY_W, flexShrink: 0, textAlign: 'center',
              fontSize: 11, fontWeight: 900, padding: '3px 0', color: 'var(--text-secondary, #888)',
              borderRight: '1px solid #ccc',
            }}>
              {g.days[0].format('MM/DD')} – {g.days.at(-1).format('MM/DD')}
            </div>
          ))}
        </div>

        {/* ── Day header ───────────────────────────────────── */}
        <div style={{ display: 'flex', borderBottom: '2px solid #222', background: 'var(--bg-header, #fffdf7)', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{
            width: LABEL_W, flexShrink: 0, padding: '6px 8px', fontSize: 12, fontWeight: 900,
            borderRight: '2px solid #222', color: 'var(--text-primary, #222)',
            position: 'sticky', left: 0, background: 'var(--bg-header, #fffdf7)', zIndex: 11,
          }}>Task</div>
          {weekdays.map((d, i) => {
            const isToday = d.format('YYYY-MM-DD') === todayStr;
            return (
              <div key={d.format()} style={{
                width: DAY_W, flexShrink: 0, textAlign: 'center', fontSize: 10, fontWeight: 800,
                padding: '4px 0', lineHeight: '14px',
                color: isToday ? '#1677ff' : 'var(--text-primary, #222)',
                background: isToday ? '#e6f4ff' : 'transparent',
                borderRight: i < weekdays.length - 1 ? '1px solid #ddd' : 'none',
              }}>
                <div>{['', 'T2', 'T3', 'T4', 'T5', 'T6'][d.day()]}</div>
                <div style={{ fontSize: 9 }}>{d.format('DD')}</div>
              </div>
            );
          })}
        </div>

        {/* ── Task rows ────────────────────────────────────── */}
        {rows.map(task => {
          const barPos = getBarPos(task, weekdays);
          return (
            <div key={task.id} style={{
              display: 'flex', borderBottom: '1px solid var(--border-color, #e0e0e0)',
              minHeight: 30,
              background: task._isFeedbackBar ? 'var(--bg-secondary, #fafafa)' : 'var(--bg-card, #fff)',
            }}>
              {/* Task label — sticky left */}
              <div style={{
                width: LABEL_W, flexShrink: 0, padding: '4px 8px',
                borderRight: '2px solid #222', fontSize: 12,
                fontWeight: task._isFeedbackBar ? 400 : 700,
                color: task._isFeedbackBar ? '#722ed1' : 'var(--text-primary, #222)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                display: 'flex', alignItems: 'center',
                position: 'sticky', left: 0, background: 'inherit', zIndex: 2,
              }}>
                {task._isFeedbackBar ? <span style={{ marginRight: 4 }}>🛠</span> : null}
                {task.name}
              </div>

              {/* Timeline — drop targets + bar */}
              <div style={{ position: 'relative', display: 'flex', flex: 1 }}>
                {/* Today vertical highlight */}
                {todayIdx >= 0 && (
                  <div style={{
                    position: 'absolute', left: todayIdx * DAY_W, width: DAY_W,
                    top: 0, bottom: 0, background: 'rgba(22,119,255,0.06)', zIndex: 0, pointerEvents: 'none',
                  }} />
                )}

                {/* Day cells as drop targets */}
                {weekdays.map((d, i) => {
                  const dateStr = d.format('YYYY-MM-DD');
                  return (
                    <div key={dateStr}
                      onDragOver={e => { e.preventDefault(); setDragOverDate(dateStr); }}
                      onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOverDate(null); }}
                      onDrop={e => handleDrop(e, dateStr)}
                      style={{
                        width: DAY_W, flexShrink: 0, zIndex: 1,
                        background: dragOverDate === dateStr ? 'rgba(22,119,255,0.12)' : 'transparent',
                        borderRight: i < weekdays.length - 1 ? '1px solid #eee' : 'none',
                        transition: 'background 0.1s',
                      }}
                    />
                  );
                })}

                {/* Task bar — absolutely positioned over day cells */}
                {barPos && (
                  <div style={{
                    position: 'absolute',
                    left: barPos.startIdx * DAY_W,
                    width: barPos.span * DAY_W - 2,
                    top: 3, bottom: 3, zIndex: 3,
                  }}>
                    <CalendarTaskBar
                      task={task} span={barPos.span} todayStr={todayStr}
                      onEdit={onEdit} onDelete={onDelete}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {rows.length === 0 && (
          <div style={{ padding: '24px', textAlign: 'center', color: '#888', fontSize: 13 }}>—</div>
        )}
      </div>
    </div>
  );
}
