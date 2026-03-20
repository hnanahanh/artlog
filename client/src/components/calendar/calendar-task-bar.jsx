import { useState } from 'react';
import { Card, Typography, Flex, Dropdown, Button, Popconfirm } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import EditTaskModal from '../kanban/edit-task-modal.jsx';
import { getTaskBarStyle } from './calendar-utils.js';

const { Text } = Typography;

// Calendar task bar — draggable, left-click edit, right-click context menu, hover delete
export default function CalendarTaskBar({ task, span, todayStr, onEdit, onDelete, onDeleteFeedback, onUpdateFeedback, gameOptions = [], projectOptions = [] }) {
  const [hovered, setHovered] = useState(false);
  const [editing, setEditing] = useState(false);

  const isFb = task._isFeedbackBar;
  const style = getTaskBarStyle(task, todayStr);
  const accentColor = isFb ? '#722ed1' : style.border;
  const bgColor = isFb ? '#d3adf7' : style.bg;

  const handleDelete = () => {
    if (isFb) {
      const realFbId = task.id.replace(/^fb-/, '');
      onDeleteFeedback?.(task._parentId, realFbId);
    } else {
      onDelete?.(task.id);
    }
  };

  // Right-click context menu items
  const contextMenuItems = [
    { key: 'edit', label: 'Edit' },
    { key: 'delete', label: 'Delete', danger: true },
  ];

  const handleMenuClick = ({ key }) => {
    if (key === 'edit') setEditing(true);
    if (key === 'delete') handleDelete();
  };

  return (
    <Dropdown
      menu={{ items: contextMenuItems, onClick: handleMenuClick }}
      trigger={['contextMenu']}
    >
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
            border: '2px solid transparent',
            borderRadius: 0,
            borderLeft: `4px solid ${accentColor}`,
            background: bgColor,
            transition: 'box-shadow 0.1s ease, transform 0.1s ease',
            cursor: isFb ? 'default' : 'grab',
            overflow: 'hidden',
          }}
          styles={{ body: { padding: 0 } }}
        >
          <Flex align="center" gap={4} style={{
            minWidth: 0, padding: '3px 6px', overflow: 'hidden',
          }}>
            {/* Task name + game/project inline */}
            <Text style={{
              fontSize: 12, fontWeight: 700,
              color: '#222222',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              flex: 1, minWidth: 0,
            }}>
              {task.name}
              {(task.game || task.project) && (
                <span style={{ fontSize: 10, fontWeight: 400, opacity: 0.7 }}>
                  {' · '}{[task.game, task.project].filter(Boolean).join(' / ')}
                </span>
              )}
            </Text>

            {/* Delete button — hover only */}
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
