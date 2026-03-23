import { useState } from 'react';
import { Card, Typography, Flex, Tag } from 'antd';
import { Draggable } from '@hello-pangea/dnd';
import { ClockCircleOutlined } from '@ant-design/icons';
import { isOverdue } from '../../processors/task-processor.js';

const { Text } = Typography;

export default function KanbanTaskCard({ task, index, onOpenEditModal }) {
  const [hovered, setHovered] = useState(false);
  const overdue = isOverdue(task);
  const statusBg = { todo: 'var(--col-todo-card)', in_progress: 'var(--col-progress-card)', done: 'var(--col-done-card)' }[task.status] || 'var(--bg-card)';
  const latestFb = task.feedbacks?.at(-1);

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{ marginBottom: 8, ...provided.draggableProps.style }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <Card
            size="small"
            style={{
              background: statusBg,
              border: '2px solid var(--border-color)',
              borderRadius: 4,
              borderLeft: overdue ? '4px solid var(--danger-color)' : '2px solid var(--border-color)',
              borderRight: task.isFeedback ? '4px solid var(--feedback-color)' : '2px solid var(--border-color)',
              boxShadow: snapshot.isDragging ? '6px 6px 0px var(--shadow-color)' : hovered ? '0px 0px 0px var(--shadow-color)' : '4px 4px 0px var(--shadow-color)',
              transform: hovered && !snapshot.isDragging ? 'translate(4px, 4px)' : 'none',
              transition: 'all 0.15s ease',
              cursor: 'grab',
            }}
            styles={{ body: { padding: '6px 8px' } }}
            onClick={() => onOpenEditModal?.(task)}
          >
            {/* Row 1: Task name */}
            <Text strong style={{
              fontSize: 13, color: overdue ? 'var(--danger-text)' : 'var(--text-primary)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block',
            }}>
              {task.name}
              {latestFb && (
                <span style={{ color: 'var(--feedback-color)', fontWeight: 600 }}> +{latestFb.content}</span>
              )}
            </Text>
            {/* Row 2: Dates */}
            <Flex align="center" gap={6} style={{ marginTop: 4 }}>
              <Text type={overdue ? 'danger' : 'secondary'} style={{ fontSize: 11, fontWeight: 600 }}>
                <ClockCircleOutlined /> {task.startDate?.slice(5)} → {task.dueDate?.slice(5)}
              </Text>
              {latestFb && (
                <Text style={{ color: 'var(--feedback-color)', fontSize: 11, fontWeight: 600 }}>
                  fb: {latestFb.startDate?.slice(5)} → {(latestFb.endDate ?? latestFb.createdAt)?.slice(5, 10)}
                </Text>
              )}
            </Flex>
            {/* Row 3: Tags (game + project) */}
            {(task.game || task.project) && (
              <Flex align="center" gap={4} wrap="wrap" style={{ marginTop: 4 }}>
                {task.game && (
                  <Tag style={{ fontSize: 10, lineHeight: '16px', padding: '0 4px', margin: 0, border: '1px solid var(--border-color)', background: 'var(--accent-active)', color: 'var(--text-primary)' }}>
                    {task.game}
                  </Tag>
                )}
                {task.project && (
                  <Tag style={{ fontSize: 10, lineHeight: '16px', padding: '0 4px', margin: 0, border: '1px solid var(--border-color)', background: 'var(--col-progress-card)', color: 'var(--text-primary)' }}>
                    {task.project}
                  </Tag>
                )}
              </Flex>
            )}
          </Card>
        </div>
      )}
    </Draggable>
  );
}
