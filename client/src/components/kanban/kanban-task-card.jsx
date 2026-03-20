import { useState, useMemo } from 'react';
import { Card, Typography, Flex, Button, Popconfirm, Input, Select, Space, Tag } from 'antd';
import NeoRangePicker from '../shared/neo-range-picker.jsx';
import { Draggable } from '@hello-pangea/dnd';
import {
  ClockCircleOutlined, EditOutlined, DeleteOutlined,
  CheckOutlined, CloseOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { isOverdue } from '../../processors/task-processor.js';

const { Text } = Typography;

export default function KanbanTaskCard({ task, index, onEdit, onDelete, onDeleteFeedback, onUpdateFeedback, t }) {
  const [editing, setEditing] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [form, setForm] = useState({});
  const [fbEdits, setFbEdits] = useState({});
  const overdue = isOverdue(task);
  const latestFb = task.feedbacks?.at(-1);
  const hasFeedbacks = task.feedbacks?.length > 0;

  const startEdit = (e) => {
    e?.stopPropagation();
    setForm({
      name: task.name, estTime: task.estTime, estUnit: task.estUnit,
      startDate: task.startDate, dueDate: task.dueDate, status: task.status,
    });
    const edits = {};
    task.feedbacks?.forEach(fb => { edits[fb.id] = { content: fb.content, startDate: fb.startDate, endDate: fb.endDate }; });
    setFbEdits(edits);
    setEditing(true);
  };

  const handleSave = () => {
    onEdit?.(task.id, form);
    task.feedbacks?.forEach(fb => {
      const edit = fbEdits[fb.id];
      if (edit && (edit.content !== fb.content || edit.startDate !== fb.startDate || edit.endDate !== fb.endDate)) {
        onUpdateFeedback?.(task.id, fb.id, { content: edit.content, startDate: edit.startDate, endDate: edit.endDate });
      }
    });
    setEditing(false);
  };

  // Build multi-range for merged picker (task + feedbacks)
  const dateRanges = useMemo(() => {
    if (!hasFeedbacks || !form.startDate) return null;
    const ranges = [{
      key: 'task', label: 'Task',
      value: form.startDate ? [dayjs(form.startDate), dayjs(form.dueDate)] : null,
    }];
    task.feedbacks.forEach((fb, i) => {
      const s = fbEdits[fb.id]?.startDate ?? fb.startDate ?? task.dueDate;
      const e = fbEdits[fb.id]?.endDate ?? fb.endDate ?? fb.createdAt;
      ranges.push({ key: `fb-${fb.id}`, label: `FB ${i + 1}`, value: [dayjs(s), dayjs(e)] });
    });
    return ranges;
  }, [hasFeedbacks, form.startDate, form.dueDate, task.feedbacks, task.dueDate, fbEdits]);

  // Multi-range change with chain cascade
  const handleRangeChange = (key, dates) => {
    if (!dates?.[0] || !dates?.[1]) return;
    const start = dates[0].format('YYYY-MM-DD');
    const end = dates[1].format('YYYY-MM-DD');

    if (key === 'task') {
      setForm(f => ({ ...f, startDate: start, dueDate: end }));
      const firstFb = task.feedbacks?.[0];
      if (firstFb) setFbEdits(prev => ({ ...prev, [firstFb.id]: { ...prev[firstFb.id], startDate: end } }));
    } else {
      const fbId = key.replace('fb-', '');
      setFbEdits(prev => ({ ...prev, [fbId]: { ...prev[fbId], startDate: start, endDate: end } }));
      const fbIdx = task.feedbacks?.findIndex(f => f.id === fbId);
      if (fbIdx === 0) setForm(f => ({ ...f, dueDate: start }));
      else if (fbIdx > 0) {
        const prevFb = task.feedbacks[fbIdx - 1];
        if (prevFb) setFbEdits(prev => ({ ...prev, [prevFb.id]: { ...prev[prevFb.id], endDate: start } }));
      }
      const nextFb = task.feedbacks?.[fbIdx + 1];
      if (nextFb) setFbEdits(prev => ({ ...prev, [nextFb.id]: { ...prev[nextFb.id], startDate: end } }));
    }
  };

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
          >
            {editing ? (
              /* Inline edit form */
              <Space direction="vertical" size={4} style={{ width: '100%' }} onMouseDown={e => e.stopPropagation()}>
                <Input size="small" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                <Flex gap={4} wrap="wrap">
                  <Input size="small" style={{ width: 55 }} value={`${form.estTime}${form.estUnit}`}
                    onChange={e => {
                      const m = e.target.value.match(/^(\d+(?:\.\d+)?)\s*(d|h)?$/i);
                      if (m) setForm(f => ({ ...f, estTime: parseFloat(m[1]), ...(m[2] ? { estUnit: m[2].toLowerCase() } : {}) }));
                    }} />
                  {/* Merged date picker: task + feedbacks on one calendar */}
                  {dateRanges ? (
                    <NeoRangePicker style={{ width: 200 }}
                      ranges={dateRanges}
                      onRangeChange={handleRangeChange} />
                  ) : (
                    <NeoRangePicker style={{ width: 200 }}
                      value={[dayjs(form.startDate), dayjs(form.dueDate)]}
                      onChange={dates => {
                        if (dates?.[0] && dates?.[1]) {
                          setForm(f => ({ ...f, startDate: dates[0].format('YYYY-MM-DD'), dueDate: dates[1].format('YYYY-MM-DD') }));
                        }
                      }} />
                  )}
                </Flex>
                {/* Feedback content inputs (dates merged into calendar above) */}
                {hasFeedbacks && (
                  <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: 4, marginTop: 2 }}>
                    {task.feedbacks.map(fb => (
                      <Flex key={fb.id} gap={4} align="center" style={{ marginBottom: 3 }}>
                        <Input size="small" style={{ flex: 1 }}
                          value={fbEdits[fb.id]?.content ?? fb.content}
                          onChange={e => setFbEdits(prev => ({
                            ...prev, [fb.id]: { ...prev[fb.id], content: e.target.value },
                          }))} />
                        <Popconfirm title={t?.('common.delete') || 'Delete?'}
                          onConfirm={() => onDeleteFeedback?.(task.id, fb.id)}
                          okText="OK" cancelText={t?.('common.cancel') || 'Cancel'}>
                          <Button size="small" danger icon={<DeleteOutlined />} style={{ flexShrink: 0, width: 24, height: 24, padding: 0 }} />
                        </Popconfirm>
                      </Flex>
                    ))}
                  </div>
                )}
                <Flex gap={4}>
                  <Button size="small" type="primary" icon={<CheckOutlined />} onClick={handleSave} />
                  <Button size="small" icon={<CloseOutlined />} onClick={() => setEditing(false)} />
                </Flex>
              </Space>
            ) : (
              /* Compact display: Title + Date MM/DD + Project Tag */
              <>
                <Flex justify="space-between" align="start">
                  <Text strong style={{
                    fontSize: 13, color: overdue ? 'var(--danger-text)' : 'var(--text-primary)',
                    flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {task.name}
                    {latestFb && (
                      <span style={{ color: 'var(--feedback-color)', fontWeight: 600 }}> +{latestFb.content}</span>
                    )}
                  </Text>
                  {hovered && (
                    <Space size={0} style={{ flexShrink: 0, marginLeft: 4 }}>
                      <Button type="text" size="small" icon={<EditOutlined />} onClick={startEdit}
                        style={{ width: 22, height: 22, padding: 0 }} />
                      <Popconfirm title={`${t?.('common.delete') || 'Delete'}?`}
                        onConfirm={() => onDelete?.(task.id)} okText="OK"
                        cancelText={t?.('common.cancel') || 'Cancel'}>
                        <Button type="text" size="small" danger icon={<DeleteOutlined />}
                          style={{ width: 22, height: 22, padding: 0 }} />
                      </Popconfirm>
                    </Space>
                  )}
                </Flex>
                <Flex align="center" gap={6} style={{ marginTop: 2 }}>
                  <Text type={overdue ? 'danger' : 'secondary'} style={{ fontSize: 11, fontWeight: 600 }}>
                    <ClockCircleOutlined /> {task.dueDate?.slice(5)}
                  </Text>
                  {latestFb && (
                    <Text style={{ color: '#722ed1', fontSize: 11, fontWeight: 600 }}>
                      {latestFb.startDate?.slice(5)} → {(latestFb.endDate ?? latestFb.createdAt)?.slice(5, 10)}
                    </Text>
                  )}
                  {task.project && (
                    <Tag style={{ fontSize: 10, lineHeight: '16px', padding: '0 4px', margin: 0, border: '1px solid var(--border-color)' }}>
                      {task.project}
                    </Tag>
                  )}
                </Flex>
              </>
            )}
          </Card>
        </div>
      )}
    </Draggable>
  );
}
