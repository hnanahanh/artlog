import { useState, useEffect } from 'react';
import { Modal, Button, Flex, Space, Popconfirm, Typography } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import NeoRangePicker from '../shared/neo-range-picker.jsx';
import NeoSelect from '../shared/neo-select.jsx';
import NeoInput from '../shared/neo-input.jsx';
import { useI18n } from '../../i18n/i18n-config.jsx';

const { Text } = Typography;

const neoLabel = { fontSize: 11, fontWeight: 700, color: 'var(--text-secondary, #666)', textTransform: 'uppercase', letterSpacing: 0.5 };

export default function EditTaskModal({ task, open, onClose, onEdit, onDelete, onDeleteFeedback, onUpdateFeedback, projectOptions = [], typeOptions = [] }) {
  const { t } = useI18n();
  const [form, setForm] = useState({});
  const [fbEdits, setFbEdits] = useState({});
  const [hoveredFbId, setHoveredFbId] = useState(null);

  useEffect(() => {
    if (task) {
      setForm({
        name: task.name, estTime: task.estTime, estUnit: task.estUnit,
        startDate: task.startDate, dueDate: task.dueDate,
        project: task.project || '', type: task.type || '',
      });
      const edits = {};
      task.feedbacks?.forEach(fb => { edits[fb.id] = { content: fb.content }; });
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

  const realTaskId = task._parentId ?? task.id;
  const hasFeedbacks = task.feedbacks?.length > 0;

  const handleSave = () => {
    onEdit?.(realTaskId, form);
    onClose?.();
  };

  const handleFbSave = (fbId) => {
    const edit = fbEdits[fbId];
    const original = task.feedbacks?.find(f => f.id === fbId);
    if (!edit || !original) return;
    if (edit.content?.trim() && edit.content !== original.content) {
      onUpdateFeedback?.(realTaskId, fbId, { content: edit.content.trim() });
    }
  };

  if (!task) return null;

  return (
    <>
    <style>{`.neo-modal-wrapper .ant-modal-content { overflow: visible !important; } .neo-modal-wrapper .ant-modal { overflow: visible !important; }`}</style>
    <Modal
      title={<span style={{ fontWeight: 900, fontSize: 14, letterSpacing: 0.3 }}>Edit Task</span>}
      open={open}
      onCancel={onClose}
      closable={{ closeIcon: <span style={{ fontWeight: 900, fontSize: 14 }}>✕</span> }}
      footer={
        <Flex justify="space-between" align="center">
          {onDelete ? (
            <Popconfirm title="Delete task?" onConfirm={() => { onDelete(realTaskId); onClose(); }} okText="OK" cancelText="Cancel">
              <Button danger style={{ fontWeight: 700, height: 32 }}>Delete</Button>
            </Popconfirm>
          ) : <span />}
          <Space>
            <Button onClick={onClose} style={{ height: 32 }}>Cancel</Button>
            <Button type="primary" onClick={handleSave} style={{ height: 32, background: 'var(--accent-color)', color: 'var(--text-on-accent)' }}>Save</Button>
          </Space>
        </Flex>
      }
      width={480}
      destroyOnClose
      classNames={{ wrapper: 'neo-modal-wrapper', body: 'neo-modal-body-padded' }}
      styles={{
        content: { border: '3px solid var(--border-color)', boxShadow: '6px 6px 0px var(--shadow-color)', borderRadius: 2, padding: 0, overflow: 'visible' },
        header: { borderBottom: '2px solid var(--border-color)', padding: '10px 16px', marginBottom: 0, background: 'var(--bg-header)' },
        body: { overflow: 'visible', padding: '20px 24px' },
        footer: { borderTop: '2px solid var(--border-color)', padding: '10px 16px', marginTop: 0 },
      }}
    >
      <Space direction="vertical" size={10} style={{ width: '100%' }}>
        {/* Name + Feedback names inline */}
        <div>
          <Text style={neoLabel}>Name</Text>
          <NeoInput
            value={form.name ?? ''}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          />
          {hasFeedbacks && task.feedbacks.map(fb => (
            <Flex
              key={fb.id} gap={4} align="center"
              style={{ marginTop: 4, marginLeft: 16 }}
              onMouseEnter={() => setHoveredFbId(fb.id)}
              onMouseLeave={() => setHoveredFbId(null)}
            >
              <span style={{ color: 'var(--text-secondary)', fontSize: 12, flexShrink: 0, fontWeight: 700 }}>↳</span>
              <div style={{ flex: 1, position: 'relative' }}>
                <NeoInput
                  style={{ width: '100%', paddingRight: hoveredFbId === fb.id ? 28 : 8 }}
                  value={fbEdits[fb.id]?.content ?? fb.content}
                  onChange={e => setFbEdits(prev => ({ ...prev, [fb.id]: { ...prev[fb.id], content: e.target.value } }))}
                  onBlur={() => handleFbSave(fb.id)}
                  onKeyDown={e => { if (e.key === 'Enter') handleFbSave(fb.id); }}
                />
                {hoveredFbId === fb.id && (
                  <Popconfirm title="Delete?" onConfirm={() => onDeleteFeedback?.(realTaskId, fb.id)} okText="OK" cancelText="Cancel">
                    <button style={{
                      position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger-text)',
                      fontWeight: 900, fontSize: 12, padding: '2px 4px',
                    }}>✕</button>
                  </Popconfirm>
                )}
              </div>
            </Flex>
          ))}
        </div>

        {/* Project + Type */}
        <Flex gap={8}>
          <div style={{ flex: 1 }}>
            <Text style={neoLabel}>{t('table.project')}</Text>
            <NeoSelect
              value={form.project}
              options={projectOptions}
              placeholder="Type or select"
              onChange={v => setForm(f => ({ ...f, project: v || '' }))}
            />
          </div>
          <div style={{ flex: 1 }}>
            <Text style={neoLabel}>{t('table.type')}</Text>
            <NeoSelect
              value={form.type}
              options={typeOptions}
              placeholder="Type or select"
              onChange={v => setForm(f => ({ ...f, type: v || '' }))}
            />
          </div>
        </Flex>

        {/* Est time + Dates */}
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
          <div style={{ flex: 2 }}>
            <Text style={neoLabel}>Dates</Text>
            <NeoRangePicker
              style={{ width: '100%' }}
              value={form.startDate ? [dayjs(form.startDate), dayjs(form.dueDate)] : null}
              onChange={dates => {
                if (dates?.[0] && dates?.[1]) {
                  setForm(f => ({ ...f, startDate: dates[0].format('YYYY-MM-DD'), dueDate: dates[1].format('YYYY-MM-DD') }));
                }
              }}
            />
          </div>
        </Flex>

      </Space>
    </Modal>
    </>
  );
}
