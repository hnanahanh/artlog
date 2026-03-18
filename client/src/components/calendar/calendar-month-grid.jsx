import dayjs from 'dayjs';
import { DAY_NAMES, getWeeksInMonth, getTaskWeekPosition, packTasksIntoRows } from './calendar-utils.js';
import CalendarTaskBar from './calendar-task-bar.jsx';

const todayStr = dayjs().format('YYYY-MM-DD');

export default function CalendarMonthGrid({ year, month, tasks }) {
  const weeks = getWeeksInMonth(year, month);

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(7, 1fr)', // Ép 7 cột cố định
      border: '2px solid #222', 
      borderRadius: 4, 
      overflow: 'hidden', 
      boxShadow: '4px 4px 0px #222',
      background: 'transparent' 
    }}>
      {/* 1. Header: Thứ 2 -> CN */}
      {DAY_NAMES.map((name, i) => (
        <div key={name} style={{
          textAlign: 'center', fontSize: 12, fontWeight: 800,
          color: '#222', padding: '8px 0',
          background: '#fffdf7',
          borderRight: i < 6 ? '1px solid #222' : 'none',
          borderBottom: '2px solid #222',
        }}>
          {name}
        </div>
      ))}

      {/* 2. Toàn bộ các ô ngày trong tháng */}
      {weeks.map((weekDays, weekIdx) => {
        const weekStart = weekDays[0];
        const weekEnd = weekDays[6];

        // Lọc và sắp xếp Task + Feedback bars cho từng tuần
        const positioned = [];
        for (const task of tasks) {
          const pos = getTaskWeekPosition(task, weekStart, weekEnd);
          if (pos) positioned.push({ ...task, ...pos });

          // Feedback bars (purple)
          if (task.feedbacks?.length > 0) {
            for (const fb of task.feedbacks) {
              const barStart = fb.startDate || task.dueDate;
              const barEnd = fb.endDate || fb.createdAt?.slice(0, 10);
              if (!barStart || !barEnd) continue;
              const fbTask = {
                id: `${task.id}_fb_${fb.id}`,
                name: fb.content,
                startDate: barStart < barEnd ? barStart : barEnd,
                dueDate: barStart < barEnd ? barEnd : barStart,
                status: task.status,
                _isFeedbackBar: true,
                _parentId: task.id,  // force same row as parent
              };
              const fbPos = getTaskWeekPosition(fbTask, weekStart, weekEnd);
              if (fbPos) positioned.push({ ...fbTask, ...fbPos });
            }
          }
        }
        const taskRows = packTasksIntoRows(positioned);

        return weekDays.map((day, dayIdx) => {
          const dateStr = day.format('YYYY-MM-DD');
          const isCurrentMonth = day.month() + 1 === month;
          const isToday = dateStr === todayStr;
          const isWeekend = dayIdx >= 5;

          return (
            <div key={dateStr} style={{
              minHeight: '120px', // Đảm bảo các ô có chiều cao bằng nhau
              background: isToday ? '#e6f4ff' : !isCurrentMonth ? '#f5f5f5' : '#fffdf7',
              borderRight: dayIdx < 6 ? '1px solid #222' : 'none',
              borderBottom: weekIdx < weeks.length - 1 ? '1px solid #222' : 'none',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* Số ngày */}
              <div style={{
                padding: '4px 8px',
                textAlign: 'right',
                fontSize: 13,
                fontWeight: 800,
                color: !isCurrentMonth ? '#bfbfbf' : isWeekend ? '#ff7875' : '#222',
              }}>
                {day.date()}
              </div>

              {/* Task hiển thị trong ô này */}
              <div style={{ flex: 1, padding: '2px' }}>
                {taskRows.map((row, rowIdx) => {
                  const taskInCell = row.find(t => t.startCol <= dayIdx && (t.startCol + t.span) > dayIdx);
                  if (taskInCell && taskInCell.startCol === dayIdx) {
                    return (
                      <div key={taskInCell.id} style={{ 
                        width: `calc(${taskInCell.span}00% + ${(taskInCell.span - 1)}px)`,
                        zIndex: 10,
                        position: 'relative',
                        marginBottom: '2px'
                      }}>
                        <CalendarTaskBar task={taskInCell} span={taskInCell.span} todayStr={todayStr} />
                      </div>
                    );
                  }
                  return <div key={`empty-${rowIdx}`} style={{ height: '22px', marginBottom: '2px' }} />;
                })}
              </div>
            </div>
          );
        });
      })}
    </div>
  );
}