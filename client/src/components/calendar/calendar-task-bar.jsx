import { useState, useRef, useCallback, useEffect } from 'react';
import { Card, Typography, Flex, Dropdown, Button, Popconfirm } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import EditTaskModal from '../kanban/edit-task-modal.jsx';
import { getTaskBarStyle } from './calendar-utils.js';

const { Text } = Typography;

// Resize handle style — thin strip on bar edges, visible on hover
const HANDLE_STYLE = {
  position: 'absolute', top: 0, bottom: 0, width: 8,
  cursor: 'col-resize', zIndex: 10,
};

const HANDLE_INDICATOR = {
  position: 'absolute', top: '50%', transform: 'translateY(-50%)',
  width: 3, height: 16, borderRadius: 2, background: '#555',
  boxShadow: '0 0 0 1px rgba(255,255,255,0.5)',
};

// Calculate new estTime from date range
function calcEstTime(startDate, dueDate, estUnit) {
  const days = dayjs(dueDate).diff(dayjs(startDate), 'day');
  if (estUnit === 'h') return Math.max(1, days * 8);
  return Math.max(1, days);
}

// Calendar task bar — draggable, resizable edges, left-click edit, right-click context menu
export default function CalendarTaskBar({ task, span, todayStr, onEdit, onDelete, onDeleteFeedback, onUpdateFeedback, gameOptions = [], projectOptions = [], weekStart }) {
  const [hovered, setHovered] = useState(false);
  const [editing, setEditing] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [resizePreview, setResizePreview] = useState(null); // { left, width }
  const barRef = useRef(null);
  const resizeRef = useRef(null);

  const isFb = task._isFeedbackBar;
  const style = getTaskBarStyle(task, todayStr);
  const accentColor = isFb ? 'var(--feedback-color)' : style.border;
  const bgColor = isFb ? '#d3adf7' : style.bg;

  const handleDelete = () => {
    if (isFb) {
      const realFbId = task.id.replace(/^fb-/, '');
      onDeleteFeedback?.(task._parentId, realFbId);
    } else {
      onDelete?.(task.id);
    }
  };

  const contextMenuItems = [
    { key: 'edit', label: 'Edit' },
    { key: 'delete', label: 'Delete', danger: true },
  ];

  const handleMenuClick = ({ key }) => {
    if (key === 'edit') setEditing(true);
    if (key === 'delete') handleDelete();
  };

  // Resize handler — side: 'left' or 'right'
  const handleResizeStart = useCallback((e, side) => {
    e.preventDefault();
    e.stopPropagation();
    if (!barRef.current || !weekStart) return;

    const barEl = barRef.current;
    const cellWidth = barEl.offsetWidth / span;
    const startX = e.clientX;
    const origStartDate = task.startDate;
    const origDueDate = task.dueDate;

    const origBarLeft = barEl.offsetLeft;
    const origBarWidth = barEl.offsetWidth;
    setResizing(true);
    setResizePreview(null);

    const onMouseMove = (ev) => {
      const dx = ev.clientX - startX;
      const colDelta = Math.round(dx / cellWidth);
      if (colDelta === 0) { setResizePreview(null); return; }

      let newStart = origStartDate;
      let newDue = origDueDate;

      if (side === 'right') {
        newDue = dayjs(origDueDate).add(colDelta, 'day').format('YYYY-MM-DD');
        if (newDue <= newStart) return;
        setResizePreview({ left: 0, width: origBarWidth + colDelta * cellWidth });
      } else {
        newStart = dayjs(origStartDate).add(colDelta, 'day').format('YYYY-MM-DD');
        if (newStart >= newDue) return;
        setResizePreview({ left: colDelta * cellWidth, width: origBarWidth - colDelta * cellWidth });
      }

      resizeRef.current = { startDate: newStart, dueDate: newDue };
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      setResizing(false);
      setResizePreview(null);

      if (resizeRef.current) {
        const { startDate, dueDate } = resizeRef.current;
        const estTime = calcEstTime(startDate, dueDate, task.estUnit);
        onEdit?.(task.id, { startDate, dueDate, estTime, estUnit: task.estUnit });
        resizeRef.current = null;
      }
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [span, task, weekStart, onEdit]);

  // Cleanup listeners on unmount
  useEffect(() => {
    return () => { resizeRef.current = null; };
  }, []);

  return (
    <Dropdown
      menu={{ items: contextMenuItems, onClick: handleMenuClick }}
      trigger={['contextMenu']}
    >
      <div
        ref={barRef}
        draggable={!isFb && !resizing}
        onDragStart={e => {
          if (resizing) { e.preventDefault(); return; }
          e.dataTransfer.setData('taskId', task.id);
          e.dataTransfer.setData('startDate', task.startDate);
          e.dataTransfer.setData('dueDate', task.dueDate);
          e.dataTransfer.effectAllowed = 'move';
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="calendar-task-bar"
        style={{ marginBottom: 2, position: 'relative' }}
      >
        <Card
          size="small"
          onClick={() => { if (!resizing) setEditing(true); }}
          style={{
            border: '2px solid transparent',
            borderRadius: 0,
            borderLeft: `4px solid ${accentColor}`,
            background: bgColor,
            transition: 'box-shadow 0.1s ease, transform 0.1s ease',
            cursor: resizing ? 'col-resize' : isFb ? 'default' : 'grab',
            overflow: 'hidden',
          }}
          styles={{ body: { padding: 0 } }}
        >
          <Flex align="center" gap={4} style={{
            minWidth: 0, padding: '3px 10px 3px 6px', overflow: 'hidden',
          }}>
            <Text style={{
              fontSize: 12, fontWeight: 700,
              color: '#222222',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              flex: 1, minWidth: 0,
            }}>
              {task._displayName || task.name}
              {(task.game || task.project) && (
                <span style={{ fontSize: 10, fontWeight: 400, opacity: 0.7 }}>
                  {' · '}{[task.game, task.project].filter(Boolean).join(' / ')}
                </span>
              )}
            </Text>

            <Popconfirm
              title={isFb ? 'Xóa feedback?' : 'Xóa task?'}
              onConfirm={e => { e?.stopPropagation(); handleDelete(); }}
              okText="OK" cancelText="Hủy"
              onClick={e => e.stopPropagation()}
            >
              <Button
                type="text" size="small" danger
                icon={<DeleteOutlined style={{ fontSize: 11 }} />}
                style={{
                  width: 20, height: 20, padding: 0, fontSize: 11, flexShrink: 0,
                  visibility: hovered ? 'visible' : 'hidden',
                }}
                onClick={e => e.stopPropagation()}
              />
            </Popconfirm>
          </Flex>
        </Card>

        {/* Ghost preview bar during resize */}
        {resizePreview && (
          <div style={{
            position: 'absolute', top: 0, bottom: 0,
            left: resizePreview.left, width: resizePreview.width,
            background: accentColor, opacity: 0.25,
            borderRadius: 2, pointerEvents: 'none', zIndex: 5,
            border: `2px dashed ${accentColor}`,
          }} />
        )}

        {/* Resize handles — visible on hover, not for feedback bars */}
        {hovered && !isFb && (
          <>
            <div
              style={{ ...HANDLE_STYLE, left: 0 }}
              onMouseDown={e => handleResizeStart(e, 'left')}
            >
              <div style={{ ...HANDLE_INDICATOR, left: 1 }} />
            </div>
            <div
              style={{ ...HANDLE_STYLE, right: 0 }}
              onMouseDown={e => handleResizeStart(e, 'right')}
            >
              <div style={{ ...HANDLE_INDICATOR, right: 1 }} />
            </div>
          </>
        )}

        {editing && (
          <EditTaskModal
            task={task}
            open={editing}
            onClose={() => setEditing(false)}
            onEdit={onEdit}
            onDeleteFeedback={onDeleteFeedback}
            onUpdateFeedback={onUpdateFeedback}
            gameOptions={gameOptions}
            projectOptions={projectOptions}
          />
        )}
      </div>
    </Dropdown>
  );
}
