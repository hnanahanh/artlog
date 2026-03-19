import { useState } from 'react';
import { Card, Typography, Flex, Button, Popconfirm } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import EditTaskModal from '../kanban/edit-task-modal.jsx';
import { getTaskBarStyle } from './calendar-utils.js';

const { Text } = Typography;

// Calendar task bar — draggable, click-to-edit modal, status-colored background
export default function CalendarTaskBar({ task, span, todayStr, onEdit, onDelete, onDeleteFeedback, onUpdateFeedback, gameOptions = [], projectOptions = [] }) {
  const [hovered, setHovered] = useState(false);
  const [editing, setEditing] = useState(false);

  const isFb = task._isFeedbackBar;
  const style = getTaskBarStyle(task, todayStr);
  const accentColor = isFb ? '#722ed1' : style.border;
  const bgColor = isFb ? '#f9f0ff' : style.bg;

  return (
    <div
      draggable={!isFb}
      onDragStart={e => {
        e.dataTransfer.setData('taskId', task.id);
        e.dataTransfer.setData('startDate', task.startDate);
        e.dataTransfer.setData('dueDate', task.dueDate);
        e.dataTransfer.effectAllowed = 'move';
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="calendar-task-bar"
      style={{ marginBottom: 2 }}
    >
      <Card
        size="small"
        onClick={() => setEditing(true)}
        style={{
          border: '2px solid var(--border-color)',
          borderRadius: 4,
          borderLeft: `4px solid ${accentColor}`,
          background: bgColor,
          transition: 'box-shadow 0.1s ease, transform 0.1s ease',
          cursor: isFb ? 'default' : 'grab',
          overflow: 'hidden',
        }}
        styles={{ body: { padding: 0 } }}
      >
        <Flex align="stretch" style={{ height: '100%' }}>
          {/* Main task section */}
          <Flex align="center" gap={4} style={{
            flex: 1, minWidth: 0, padding: '3px 6px', overflow: 'hidden',
          }}>
            <Text style={{
              fontSize: 12, fontWeight: 700,
              color: accentColor,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              flex: 1, minWidth: 0,
            }}>
              {task.name}
            </Text>
            {(task.game || task.project) && (
              <Text style={{
                fontSize: 10, color: accentColor, opacity: 0.7, flexShrink: 0,
                whiteSpace: 'nowrap',
              }}>
                {[task.game, task.project].filter(Boolean).join(' / ')}
              </Text>
            )}
          </Flex>

          {/* Fixed-width delete slot */}
          <div style={{ width: 22, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {hovered && (
              <Popconfirm
                title={isFb ? 'Xóa feedback?' : 'Xóa task?'}
                onConfirm={e => {
                  e?.stopPropagation();
                  if (isFb) {
                    // task.id = 'fb-{realFbId}', task._parentId = real task id
                    const realFbId = task.id.replace(/^fb-/, '');
                    onDeleteFeedback?.(task._parentId, realFbId);
                  } else {
                    onDelete?.(task.id);
                  }
                }}
                okText="OK" cancelText="Hủy"
                onClick={e => e.stopPropagation()}
              >
                <Button
                  type="text" size="small" danger icon={<DeleteOutlined style={{ fontSize: 11 }} />}
                  style={{ width: 20, height: 20, padding: 0, fontSize: 11 }}
                  onClick={e => e.stopPropagation()}
                />
              </Popconfirm>
            )}
          </div>
        </Flex>
      </Card>

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
  );
}
