import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { DAY_NAMES, getWeeksInMonth, getTaskWeekPosition, packTasksIntoRows } from './calendar-utils.js';
import CalendarTaskBar from './calendar-task-bar.jsx';

const todayStr = dayjs().format('YYYY-MM-DD');

export default function CalendarMonthGrid({ year, month, tasks, onEdit, onDelete, onDeleteFeedback, onUpdateFeedback, onAddTask, navBar }) {
  const weeks = getWeeksInMonth(year, month);
  // Derive unique game/project options from all tasks for the edit modal
  const gameOptions = [...new Set(tasks.map(t => t.game).filter(Boolean))];
  const projectOptions = [...new Set(tasks.map(t => t.project).filter(Boolean))];
  const [dragOverDate, setDragOverDate] = useState(null);
  const [hoveredDate, setHoveredDate] = useState(null);

  // Reset highlight if drag ends without a valid drop
  useEffect(() => {
    const clear = () => setDragOverDate(null);
    document.addEventListener('dragend', clear);
    return () => document.removeEventListener('dragend', clear);
  }, []);

  const handleDrop = (e, targetDate) => {
    e.preventDefault();
    setDragOverDate(null);
    const taskId = e.dataTransfer.getData('taskId');
    const startDate = e.dataTransfer.getData('startDate');
    const dueDate = e.dataTransfer.getData('dueDate');
    if (!taskId) return;
    const duration = dayjs(dueDate).diff(dayjs(startDate), 'day');
    onEdit?.(taskId, {
      startDate: targetDate,
      dueDate: dayjs(targetDate).add(duration, 'day').format('YYYY-MM-DD'),
    });
  };

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(7, 1fr)', // Sun–Sat
      width: '100%',
      border: '2px solid #222', 
      borderRadius: 4, 
      overflow: 'hidden', 
      boxShadow: '4px 4px 0px #222',
      background: '#fffdf7'
    }}>
      {/* 0. Navigation bar spanning all columns */}
      {navBar && (
        <div style={{
          gridColumn: '1 / -1',
          padding: '8px 12px',
          borderBottom: '2px solid #222',
          background: '#fffdf7',
        }}>
          {navBar}
        </div>
      )}

      {/* 1. Header: Thứ 2 -> CN — weekend columns (0=CN, 6=T7) muted */}
      {DAY_NAMES.map((name, i) => {
        const isWeekend = i === 0 || i === 6;
        return (
          <div key={name} style={{
            textAlign: 'center', fontSize: 12, fontWeight: 800,
            color: isWeekend ? '#bbb' : '#222', padding: '8px 0',
            background: '#fffdf7',
            borderRight: i < 6 ? `1px solid ${isWeekend ? '#ddd' : '#222'}` : 'none',
            borderBottom: '2px solid #222',
          }}>
            {name}
          </div>
        );
      })}

      {/* 2. Toàn bộ các ô ngày trong tháng */}
      {weeks.map((weekDays, weekIdx) => {
        const weekStart = weekDays[0];
        const weekEnd = weekDays[6];

        // Lọc Task bars + Feedback bars riêng (adjacent, cùng row với parent)
        const positioned = [];
        for (const task of tasks) {
          const pos = getTaskWeekPosition(task, weekStart, weekEnd);
          if (pos) positioned.push({ ...task, ...pos });

          // Latest feedback as a separate adjacent bar in the same row
          const latestFb = task.feedbacks?.at(-1);
          if (latestFb) {
            const fbStart = latestFb.startDate ?? latestFb.createdAt?.slice(0, 10) ?? task.dueDate;
            const fbEnd = latestFb.endDate ?? fbStart;
            const fbProxy = {
              // Carry full task data so EditTaskModal works when clicking the feedback bar
              ...task,
              id: `fb-${latestFb.id}`,
              name: latestFb.content,
              startDate: fbStart,
              dueDate: fbEnd,
              _isFeedbackBar: true,
              _parentId: task.id,
            };
            const fbPos = getTaskWeekPosition(fbProxy, weekStart, weekEnd);
            if (fbPos) positioned.push({ ...fbProxy, ...fbPos });
          }
        }
        const taskRows = packTasksIntoRows(positioned);

        return weekDays.map((day, dayIdx) => {
          const dateStr = day.format('YYYY-MM-DD');
          const isCurrentMonth = day.month() + 1 === month;
          const isToday = dateStr === todayStr;
          const isWeekend = dayIdx === 0 || dayIdx === 6;

          const isDragOver = dragOverDate === dateStr;
          const isHovered = hoveredDate === dateStr;
          return (
            <div key={dateStr}
              onMouseEnter={() => setHoveredDate(dateStr)}
              onMouseLeave={() => setHoveredDate(null)}
              onDragOver={e => { e.preventDefault(); setDragOverDate(dateStr); }}
              onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOverDate(null); }}
              onDrop={e => handleDrop(e, dateStr)}
              style={{
                minHeight: '120px',
                background: isDragOver ? 'rgba(22,119,255,0.10)' : !isCurrentMonth ? '#f5f5f5' : isWeekend ? '#f9f9f6' : 'transparent',
                borderRight: dayIdx < 6 ? `1px solid ${isWeekend ? '#ddd' : '#222'}` : 'none',
                borderBottom: weekIdx < weeks.length - 1 ? '1px solid #222' : 'none',
                display: 'flex',
                flexDirection: 'column',
                outline: isDragOver ? '2px dashed #1677ff' : 'none',
                outlineOffset: '-2px',
                transition: 'background 0.1s',
                position: 'relative',
                minWidth: 0,
              }}>
              {/* Date number + add button */}
              <div style={{
                padding: '4px 8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div style={{ width: 18 }}>
                  {isHovered && (
                    <button
                      onClick={() => onAddTask?.(dateStr)}
                      style={{
                        width: 18, height: 18,
                        border: '2px solid #222',
                        borderRadius: 2,
                        background: '#fff',
                        boxShadow: '2px 2px 0 #222',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 900, lineHeight: 1,
                        padding: 0,
                        transition: 'transform 0.08s, box-shadow 0.08s',
                      }}
                      onMouseDown={e => { e.currentTarget.style.transform = 'translate(2px,2px)'; e.currentTarget.style.boxShadow = 'none'; }}
                      onMouseUp={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '2px 2px 0 #222'; }}
                    >+</button>
                  )}
                </div>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 22, height: 22, borderRadius: '50%',
                  background: isToday ? '#ff4d4f' : 'transparent',
                  fontSize: 13, fontWeight: 800, fontFamily: "Google Sans Code",
                  color: isToday ? '#fff' : !isCurrentMonth ? '#bfbfbf' : isWeekend ? '#bbb' : '#222',
                }}>
                  {day.date()}
                </span>
              </div>

              {/* Task hiển thị trong ô này */}
              <div style={{ flex: 1, padding: 0 }}>
                {taskRows.map((row, rowIdx) => {
                  // Find the bar that STARTS at this column (exact match prevents task bar
                  // from shadowing an adjacent feedback bar sharing the same boundary column)
                  const taskInCell = row.find(t => t.startCol === dayIdx);
                  if (taskInCell) {
                    return (
                      <div key={taskInCell.id} style={{
                        width: `calc(${taskInCell.span}00%)`,
                        zIndex: 2,
                        position: 'relative',
                        marginBottom: '2px',
                        padding: '0 1px'
                      }}>
                        <CalendarTaskBar task={taskInCell} span={taskInCell.span} todayStr={todayStr} onEdit={onEdit} onDelete={onDelete} onDeleteFeedback={onDeleteFeedback} onUpdateFeedback={onUpdateFeedback} gameOptions={gameOptions} projectOptions={projectOptions} />
                      </div>
                    );
                  }
                  // Placeholder preserves row height for cells where a bar spans through
                  const spansThrough = row.some(t => t.startCol < dayIdx && (t.startCol + t.span) > dayIdx);
                  if (!spansThrough) return null;
                  return <div key={`empty-${rowIdx}`} style={{ height: '26px', marginBottom: '4px' }} />;
                })}
              </div>
            </div>
          );
        });
      })}
    </div>
  );
}