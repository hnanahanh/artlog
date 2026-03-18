import { useState } from 'react';
import { Modal, Input, Flex, Button, Popconfirm, Select } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import NeoRangePicker from '../shared/neo-range-picker.jsx';
import { getTaskBarStyle } from './calendar-utils.js';
import { STATUSES } from '../../utils/status-constants.js';
import dayjs from 'dayjs';

const neoDropdownStyle = { border: '2px solid #222', borderRadius: 4, background: '#fffdf7' };

/* Single task bar rendered inside calendar grid week row */
export default function CalendarTaskBar({ task, span, todayStr, onEdit, onDelete }) {
  const [hovered, setHovered] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const style = getTaskBarStyle(task, todayStr);
  const isFb = task._isFeedbackBar;
  const bg = isFb ? style.color : style.border;

  const startEdit = (e) => {
    e.stopPropagation();
    if (isFb) return; // feedback bars are not editable
    setForm({
      name: task.name,
      estTime: task.estTime,
      estUnit: task.estUnit || 'd',
      startDate: task.startDate,
      dueDate: task.dueDate,
      status: task.status,
    });
    setEditing(true);
  };

  const handleSave = () => {
    onEdit?.(task.id, form);
    setEditing(false);
  };

  return (
    <>
      <div
        draggable={!isFb}
        onDragStart={e => {
          if (isFb) return;
          e.dataTransfer.setData('taskId', task.id);
          e.dataTransfer.setData('startDate', task.startDate);
          e.dataTransfer.setData('dueDate', task.dueDate);
          e.dataTransfer.effectAllowed = 'move';
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={startEdit}
        style={{
          background: 'var(--bg-card)',
          border: '2px solid var(--border-color)',
          borderLeft: isFb ? `4px solid ${bg}` : `4px solid ${bg}`,
          borderRadius: 2,
          padding: '1px 5px',
          fontSize: 12,
          color: 'var(--text-primary)',
          fontWeight: 700,
          display: 'flex', alignItems: 'center', gap: 4,
          overflow: 'hidden',
          cursor: isFb ? 'default' : 'grab',
          lineHeight: '18px',
          boxShadow: hovered && !isFb ? '0 0 0' : '2px 2px 0 var(--shadow-color)',
          transform: hovered && !isFb ? 'translate(2px, 2px)' : 'none',
          transition: 'all 0.1s ease',
        }}
      >
        <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {task.name}
        </span>
        {hovered && !isFb && (
          <Popconfirm
            title="Xóa task?"
            onConfirm={(e) => { e?.stopPropagation(); onDelete?.(task.id); }}
            okText="OK" cancelText="Hủy"
            onClick={e => e.stopPropagation()}
          >
            <DeleteOutlined
              style={{ fontSize: 10, flexShrink: 0, color: 'var(--danger-color, #cf1322)' }}
              onClick={e => e.stopPropagation()}
            />
          </Popconfirm>
        )}
      </div>

      {/* Edit modal */}
      {editing && (
        <Modal
          open={editing}
          title={<span style={{ fontFamily: "'Google Sans Code', monospace", fontWeight: 900 }}><EditOutlined /> {task.name}</span>}
          onCancel={() => setEditing(false)}
          footer={null}
          width={420}
          styles={{ body: { padding: '16px 0 0' } }}
        >
          <Flex vertical gap={10}>
            <Input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Tên task"
            />
            <Flex gap={8} align="center">
              <Input
                style={{ width: 80 }}
                value={`${form.estTime ?? ''}${form.estUnit ?? 'd'}`}
                placeholder="Est (2d/4h)"
                onChange={e => {
                  const m = e.target.value.match(/^(\d+(?:\.\d+)?)\s*(d|h)?$/i);
                  if (m) setForm(f => ({ ...f, estTime: parseFloat(m[1]), ...(m[2] ? { estUnit: m[2].toLowerCase() } : {}) }));
                }}
              />
              <Select
                style={{ flex: 1 }}
                value={form.status}
                onChange={v => setForm(f => ({ ...f, status: v }))}
                popupStyle={neoDropdownStyle}
                options={STATUSES.map(s => ({ value: s, label: s }))}
              />
            </Flex>
            <NeoRangePicker
              value={[dayjs(form.startDate), dayjs(form.dueDate)]}
              onChange={dates => {
                if (dates?.[0] && dates?.[1]) setForm(f => ({
                  ...f,
                  startDate: dates[0].format('YYYY-MM-DD'),
                  dueDate: dates[1].format('YYYY-MM-DD'),
                }));
              }}
            />
            <Flex gap={8} justify="flex-end" style={{ borderTop: '2px solid var(--border-color)', paddingTop: 12 }}>
              <Button onClick={() => setEditing(false)}>Hủy</Button>
              <Button type="primary" onClick={handleSave}>Lưu</Button>
            </Flex>
          </Flex>
        </Modal>
      )}
    </>
  );
}
