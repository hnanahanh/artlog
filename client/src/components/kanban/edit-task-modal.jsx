import { useState, useEffect } from 'react';
import { Modal, Input, Select, DatePicker, Button, Flex, Space, Popconfirm, Typography, Divider } from 'antd';
import NeoRangePicker from '../shared/neo-range-picker.jsx';
import { DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { STATUSES } from '../../utils/status-constants.js';

const { Text } = Typography;

export default function EditTaskModal({ task, open, onClose, onEdit, onDeleteFeedback, onUpdateFeedback, t }) {
  const [form, setForm] = useState({});
  const [fbEdits, setFbEdits] = useState({});

  // Sync form state when task changes
  useEffect(() => {
    if (task) {
      setForm({
        name: task.name, estTime: task.estTime, estUnit: task.estUnit,
        startDate: task.startDate, dueDate: task.dueDate, status: task.status,
      });
      const edits = {};
      task.feedbacks?.forEach(fb => { edits[fb.id] = { content: fb.content, createdAt: fb.createdAt }; });
      setFbEdits(edits);
    }
  }, [task]);

  const handleSave = () => {
    onEdit?.(task.id, form);
    onClose?.();
  };

  const handleFbSave = (fbId) => {
    const edit = fbEdits[fbId];
    const original = task.feedbacks?.find(f => f.id === fbId);
    if (!edit || !original) return;
    const data = {};
    if (edit.content?.trim() && edit.content !== original.content) data.content = edit.content.trim();
    if (edit.createdAt && edit.createdAt !== original.createdAt) data.createdAt = edit.createdAt;
    if (Object.keys(data).length) onUpdateFeedback?.(task.id, fbId, data);
  };

  if (!task) return null;

  return (
    <Modal
      title={t?.('common.edit') || 'Edit Task'}
      open={open}
      onCancel={onClose}
      onOk={handleSave}
      okText={t?.('common.save') || 'Save'}
      cancelText={t?.('common.cancel') || 'Cancel'}
      width={480}
      destroyOnClose
    >
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        {/* Task name */}
        <div>
          <Text type="secondary" style={{ fontSize: 11 }}>Name</Text>
          <Input size="small" value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        </div>
        {/* Est time + Status */}
        <Flex gap={8}>
          <div style={{ flex: 1 }}>
            <Text type="secondary" style={{ fontSize: 11 }}>Est Time</Text>
            <Input size="small" value={form.estTime != null ? `${form.estTime}${form.estUnit}` : ''}
              onChange={e => {
                const m = e.target.value.match(/^(\d+(?:\.\d+)?)\s*(d|h)?$/i);
                if (m) setForm(f => ({ ...f, estTime: parseFloat(m[1]), ...(m[2] ? { estUnit: m[2].toLowerCase() } : {}) }));
              }} />
          </div>
          <div style={{ flex: 1 }}>
            <Text type="secondary" style={{ fontSize: 11 }}>Status</Text>
            <Select size="small" style={{ width: '100%' }} value={form.status}
              onChange={v => setForm(f => ({ ...f, status: v }))}>
              {STATUSES.map(s => (
                <Select.Option key={s} value={s}>{t?.(`status.${s}`) || s}</Select.Option>
              ))}
            </Select>
          </div>
        </Flex>
        {/* Date range */}
        <div>
          <Text type="secondary" style={{ fontSize: 11 }}>Dates</Text>
          <NeoRangePicker style={{ width: '100%' }}
            value={form.startDate ? [dayjs(form.startDate), dayjs(form.dueDate)] : null}
            onChange={dates => {
              if (dates?.[0] && dates?.[1]) {
                setForm(f => ({ ...f, startDate: dates[0].format('YYYY-MM-DD'), dueDate: dates[1].format('YYYY-MM-DD') }));
              }
            }} />
        </div>
        {/* Feedbacks section */}
        {task.feedbacks?.length > 0 && (
          <>
            <Divider style={{ margin: '8px 0' }}>
              <Text type="secondary" style={{ fontSize: 11 }}>Feedbacks ({task.feedbacks.length})</Text>
            </Divider>
            {task.feedbacks.map(fb => (
              <Flex key={fb.id} gap={6} align="center">
                <Input size="small" style={{ flex: 1 }}
                  value={fbEdits[fb.id]?.content ?? fb.content}
                  onChange={e => setFbEdits(prev => ({
                    ...prev, [fb.id]: { ...prev[fb.id], content: e.target.value },
                  }))}
                  onBlur={() => handleFbSave(fb.id)}
                  onPressEnter={() => handleFbSave(fb.id)} />
                <DatePicker size="small" style={{ width: 120 }}
                  value={dayjs(fbEdits[fb.id]?.createdAt ?? fb.createdAt)}
                  onChange={d => {
                    if (d) {
                      setFbEdits(prev => ({
                        ...prev, [fb.id]: { ...prev[fb.id], createdAt: d.toISOString() },
                      }));
                      setTimeout(() => handleFbSave(fb.id), 0);
                    }
                  }} />
                <Popconfirm title={t?.('common.delete') || 'Delete?'}
                  onConfirm={() => onDeleteFeedback?.(task.id, fb.id)}
                  okText="OK" cancelText={t?.('common.cancel') || 'Cancel'}>
                  <Button size="small" danger icon={<DeleteOutlined />} style={{ flexShrink: 0 }} />
                </Popconfirm>
              </Flex>
            ))}
          </>
        )}
      </Space>
    </Modal>
  );
}
