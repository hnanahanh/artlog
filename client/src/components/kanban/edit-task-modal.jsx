import { useState, useEffect, useMemo } from 'react';
import { Modal, Button, Flex, Space, Popconfirm, Typography } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import NeoRangePicker from '../shared/neo-range-picker.jsx';
import NeoSelect from '../shared/neo-select.jsx';
import NeoInput from '../shared/neo-input.jsx';
import { useI18n } from '../../i18n/i18n-config.jsx';

const { Text } = Typography;

const neoLabel = { fontSize: 11, fontWeight: 700, color: 'var(--text-secondary, #666)', textTransform: 'uppercase', letterSpacing: 0.5 };

export default function EditTaskModal({ task, open, onClose, onEdit, onDelete, onDeleteFeedback, onUpdateFeedback, gameOptions = [], projectOptions = [] }) {
  const { t } = useI18n();
  const [form, setForm] = useState({});
  const [fbEdits, setFbEdits] = useState({});
  const [hoveredFbId, setHoveredFbId] = useState(null);

  useEffect(() => {
    if (task) {
      setForm({
        name: task.name, estTime: task.estTime, estUnit: task.estUnit,
        startDate: task.startDate, dueDate: task.dueDate,
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
    const data = {};
    if (edit.content?.trim() && edit.content !== original.content) data.content = edit.content.trim();
    if (edit.startDate && edit.startDate !== original.startDate) data.startDate = edit.startDate;
    if (edit.endDate && edit.endDate !== original.endDate) data.endDate = edit.endDate;
    if (Object.keys(data).length) onUpdateFeedback?.(realTaskId, fbId, data);
  };

  // Build ranges array for multi-range picker (task + feedbacks)
  const dateRanges = useMemo(() => {
    if (!hasFeedbacks || !form.startDate) return null;
    const ranges = [{
      key: 'task',
      label: 'Task',
      value: form.startDate ? [dayjs(form.startDate), dayjs(form.dueDate)] : null,
    }];
    task.feedbacks.forEach((fb, i) => {
      const s = fbEdits[fb.id]?.startDate ?? fb.startDate ?? fb.createdAt;
      const e = fbEdits[fb.id]?.endDate ?? fb.endDate ?? fb.createdAt;
      ranges.push({
        key: `fb-${fb.id}`,
        label: `FB ${i + 1}`,
        value: [dayjs(s), dayjs(e)],
      });
    });
    return ranges;
  }, [hasFeedbacks, form.startDate, form.dueDate, task.feedbacks, fbEdits]);

  // Handle multi-range change with chain cascade
  const handleRangeChange = (key, dates) => {
    if (!dates?.[0] || !dates?.[1]) return;
    const start = dates[0].format('YYYY-MM-DD');
    const end = dates[1].format('YYYY-MM-DD');

    if (key === 'task') {
      setForm(f => ({ ...f, startDate: start, dueDate: end }));
      // Chain: task.dueDate → FB1.startDate
      const firstFb = task.feedbacks?.[0];
      if (firstFb) {
        setFbEdits(prev => ({ ...prev, [firstFb.id]: { ...prev[firstFb.id], startDate: end } }));
        onUpdateFeedback?.(realTaskId, firstFb.id, { startDate: end });
      }
    } else {
      // Feedback range changed
      const fbId = key.replace('fb-', '');
      setFbEdits(prev => ({
        ...prev,
        [fbId]: { ...prev[fbId], startDate: start, endDate: end },
      }));

      const fbIdx = task.feedbacks?.findIndex(f => f.id === fbId);
      if (fbIdx === -1) return;

      // Chain backward: if first feedback, sync task.dueDate = fb.startDate
      if (fbIdx === 0) {
        setForm(f => ({ ...f, dueDate: start }));
      } else {
        // Chain backward: prev feedback endDate = this feedback startDate
        const prevFb = task.feedbacks[fbIdx - 1];
        if (prevFb) {
          setFbEdits(prev => ({ ...prev, [prevFb.id]: { ...prev[prevFb.id], endDate: start } }));
          onUpdateFeedback?.(realTaskId, prevFb.id, { endDate: start });
        }
      }

      // Chain forward: next feedback startDate = this feedback endDate
      const nextFb = task.feedbacks?.[fbIdx + 1];
      if (nextFb) {
        setFbEdits(prev => ({ ...prev, [nextFb.id]: { ...prev[nextFb.id], startDate: end } }));
        onUpdateFeedback?.(realTaskId, nextFb.id, { startDate: end });
      }

      // Persist this feedback's dates
      const fb = task.feedbacks[fbIdx];
      const data = {};
      if (start !== fb.startDate) data.startDate = start;
      if (end !== (fb.endDate ?? fb.createdAt?.slice(0, 10))) data.endDate = end;
      if (Object.keys(data).length) onUpdateFeedback?.(realTaskId, fbId, data);
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
            <Button type="primary" onClick={handleSave} style={{ height: 32, background: 'var(--accent-color)', color: '#222' }}>Save</Button>
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

        {/* Project (game) + Type (project) */}
        <Flex gap={8}>
          <div style={{ flex: 1 }}>
            <Text style={neoLabel}>{t('table.game')}</Text>
            <NeoSelect
              value={form.game}
              options={gameOptions}
              placeholder="Type or select"
              onChange={v => setForm(f => ({ ...f, game: v || '' }))}
            />
          </div>
          <div style={{ flex: 1 }}>
            <Text style={neoLabel}>{t('table.project')}</Text>
            <NeoSelect
              value={form.project}
              options={projectOptions}
              placeholder="Type or select"
              onChange={v => setForm(f => ({ ...f, project: v || '' }))}
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
            {dateRanges ? (
              <NeoRangePicker
                style={{ width: '100%' }}
                ranges={dateRanges}
                onRangeChange={handleRangeChange}
              />
            ) : (
              <NeoRangePicker
                style={{ width: '100%' }}
                value={form.startDate ? [dayjs(form.startDate), dayjs(form.dueDate)] : null}
                onChange={dates => {
                  if (dates?.[0] && dates?.[1]) {
                    setForm(f => ({ ...f, startDate: dates[0].format('YYYY-MM-DD'), dueDate: dates[1].format('YYYY-MM-DD') }));
                  }
                }}
              />
            )}
          </div>
        </Flex>

      </Space>
    </Modal>
    </>
  );
}
