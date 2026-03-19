import { useState, useEffect } from 'react';
import { Modal, Button, Flex, Space, Popconfirm, Typography, Divider } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import NeoRangePicker from '../shared/neo-range-picker.jsx';
import NeoSelect from '../shared/neo-select.jsx';
import NeoInput from '../shared/neo-input.jsx';
import { STATUSES } from '../../utils/status-constants.js';

const { Text } = Typography;

const neoLabel = { fontSize: 11, fontWeight: 700, color: 'var(--text-secondary, #666)', textTransform: 'uppercase', letterSpacing: 0.5 };

export default function EditTaskModal({ task, open, onClose, onEdit, onDeleteFeedback, onUpdateFeedback, t, gameOptions = [], projectOptions = [] }) {
  const [form, setForm] = useState({});
  const [fbEdits, setFbEdits] = useState({});

  useEffect(() => {
    if (task) {
      setForm({
        name: task.name, estTime: task.estTime, estUnit: task.estUnit,
        startDate: task.startDate, dueDate: task.dueDate, status: task.status,
        game: task.game || '', project: task.project || '',
      });
      const edits = {};
      task.feedbacks?.forEach(fb => { edits[fb.id] = { content: fb.content, createdAt: fb.createdAt }; });
      setFbEdits(edits);
    }
  }, [task]);

  // Sync estTime from dates whenever date range changes
  useEffect(() => {
    if (!form.startDate || !form.dueDate) return;
    const days = dayjs(form.dueDate).diff(dayjs(form.startDate), 'day') + 1;
    if (days !== form.estTime) {
      setForm(f => ({ ...f, estTime: days, estUnit: f.estUnit === 'h' ? 'd' : (f.estUnit || 'd') }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.startDate, form.dueDate]);

  // Use real task id (feedback bar proxies carry _parentId)
  const realTaskId = task._parentId ?? task.id;

  const handleSave = () => {
    onEdit?.(realTaskId, form);
    onClose?.();
  };

  const handleFbSave = (fbId) => {
    const edit = fbEdits[fbId];
    const original = task.feedbacks?.find(f => f.id === fbId);
    if (!edit || !original) return;
    const data = {};
    if (edit.content?.trim() && edit.content !== original.content) data.content = edit.content.trim();
    if (edit.startDate && edit.startDate !== original.startDate) data.startDate = edit.startDate;
    if (edit.endDate && edit.endDate !== original.endDate) data.endDate = edit.endDate;
    if (Object.keys(data).length) onUpdateFeedback?.(realTaskId, fbId, data);
  };

  if (!task) return null;

  return (
    <Modal
      title={<span style={{ fontWeight: 900, fontSize: 14, letterSpacing: 0.3 }}>Edit Task</span>}
      open={open}
      onCancel={onClose}
      onOk={handleSave}
      okText="Save"
      cancelText="Cancel"
      width={480}
      destroyOnClose
      styles={{
        header: { borderBottom: '2px solid var(--border-color)', paddingBottom: 10, marginBottom: 0 },
        footer: { borderTop: '2px solid var(--border-color)', paddingTop: 10, marginTop: 0 },
      }}
    >
      <Space direction="vertical" size={10} style={{ width: '100%', paddingTop: 8 }}>
        {/* Name */}
        <div>
          <Text style={neoLabel}>Name</Text>
          <NeoInput
            value={form.name ?? ''}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          />
        </div>

        {/* Game + Project */}
        <Flex gap={8}>
          <div style={{ flex: 1 }}>
            <Text style={neoLabel}>Game</Text>
            <NeoSelect
              value={form.game}
              options={gameOptions}
              placeholder="Type or select"
              onChange={v => setForm(f => ({ ...f, game: v || '' }))}
            />
          </div>
          <div style={{ flex: 1 }}>
            <Text style={neoLabel}>Project</Text>
            <NeoSelect
              value={form.project}
              options={projectOptions}
              placeholder="Type or select"
              onChange={v => setForm(f => ({ ...f, project: v || '' }))}
            />
          </div>
        </Flex>

        {/* Est time + Status */}
        <Flex gap={8}>
          <div style={{ flex: 1 }}>
            <Text style={neoLabel}>Est Time</Text>
            <NeoInput
              value={form.estTime != null ? `${form.estTime}${form.estUnit}` : ''}
              placeholder="2d / 4h"
              onChange={e => {
                const m = e.target.value.match(/^(\d+(?:\.\d+)?)\s*(d|h)?$/i);
                if (m) {
                  const val = parseFloat(m[1]);
                  const unit = m[2] ? m[2].toLowerCase() : (form.estUnit || 'd');
                  setForm(f => {
                    const days = unit === 'h' ? Math.ceil(val / 8) : Math.round(val);
                    const dueDate = f.startDate ? dayjs(f.startDate).add(Math.max(0, days - 1), 'day').format('YYYY-MM-DD') : f.dueDate;
                    return { ...f, estTime: val, estUnit: unit, dueDate };
                  });
                }
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <Text style={neoLabel}>Status</Text>
            <NeoSelect
              value={form.status}
              options={STATUSES}
              allowClear={false}
              onChange={v => setForm(f => ({ ...f, status: v }))}
            />
          </div>
        </Flex>

        {/* Dates */}
        <div>
          <Text style={neoLabel}>Dates</Text>
          <NeoRangePicker
            style={{ width: '100%' }}
            value={form.startDate ? [dayjs(form.startDate), dayjs(form.dueDate)] : null}
            onChange={dates => {
              if (dates?.[0] && dates?.[1]) {
                const start = dates[0].format('YYYY-MM-DD');
                const end = dates[1].format('YYYY-MM-DD');
                setForm(f => ({ ...f, startDate: start, dueDate: end }));
                // Linked boundary: first feedback startDate = task dueDate
                const firstFb = task.feedbacks?.[0];
                if (firstFb) {
                  setFbEdits(prev => ({ ...prev, [firstFb.id]: { ...prev[firstFb.id], startDate: end } }));
                  onUpdateFeedback?.(realTaskId, firstFb.id, { startDate: end });
                }
              }
            }}
          />
        </div>

        {/* Feedbacks */}
        {task.feedbacks?.length > 0 && (
          <>
            <Divider style={{ margin: '4px 0', borderColor: 'var(--border-color)', borderWidth: 2 }}>
              <Text style={{ ...neoLabel, fontSize: 10 }}>Feedbacks ({task.feedbacks.length})</Text>
            </Divider>
            {task.feedbacks.map(fb => (
              <Flex key={fb.id} gap={6} align="center">
                <NeoInput
                  style={{ flex: 1 }}
                  value={fbEdits[fb.id]?.content ?? fb.content}
                  onChange={e => setFbEdits(prev => ({ ...prev, [fb.id]: { ...prev[fb.id], content: e.target.value } }))}
                  onBlur={() => handleFbSave(fb.id)}
                  onKeyDown={e => { if (e.key === 'Enter') handleFbSave(fb.id); }}
                />
                {/* Feedback date as range picker */}
                <NeoRangePicker
                  numberOfMonths={1}
                  value={[
                    dayjs(fbEdits[fb.id]?.startDate ?? fb.startDate ?? fb.createdAt),
                    dayjs(fbEdits[fb.id]?.endDate ?? fb.endDate ?? fb.createdAt),
                  ]}
                  onChange={dates => {
                    if (dates?.[0] && dates?.[1]) {
                      const newStart = dates[0].format('YYYY-MM-DD');
                      const newEnd = dates[1].format('YYYY-MM-DD');
                      setFbEdits(prev => ({
                        ...prev,
                        [fb.id]: { ...prev[fb.id], startDate: newStart, endDate: newEnd },
                      }));
                      // Linked boundary: if first feedback, sync task dueDate = feedback startDate
                      if (task.feedbacks?.indexOf(fb) === 0) {
                        setForm(f => ({ ...f, dueDate: newStart }));
                      }
                      const data = {};
                      if (newStart !== fb.startDate) data.startDate = newStart;
                      if (newEnd !== (fb.endDate ?? fb.createdAt?.slice(0, 10))) data.endDate = newEnd;
                      if (Object.keys(data).length) onUpdateFeedback?.(realTaskId, fb.id, data);
                    }
                  }}
                />
                <Popconfirm title="Delete?" onConfirm={() => onDeleteFeedback?.(realTaskId, fb.id)} okText="OK" cancelText="Cancel">
                  <Button danger icon={<DeleteOutlined />} style={{ flexShrink: 0 }} />
                </Popconfirm>
              </Flex>
            ))}
          </>
        )}
      </Space>
    </Modal>
  );
}
