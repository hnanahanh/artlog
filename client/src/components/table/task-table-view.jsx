import { useState, useRef, useEffect } from 'react';
import { Table, Tag, Input, Select, Button, Popconfirm, DatePicker, Flex, Typography } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useI18n } from '../../i18n/i18n-config.jsx';
import { STATUSES, STATUS_TAG_COLORS } from '../../utils/status-constants.js';
import { toHours } from '../../processors/task-processor.js';

const { Text } = Typography;
const PRIORITY_COLORS = { high: 'red', medium: 'orange', low: 'default' };
const PRIORITY_OPTIONS = ['high', 'medium', 'low'];

// Neo-brutalism dropdown style for Select/DatePicker popups
const neoDropdownStyle = { border: '2px solid #222', borderRadius: 4, background: '#fffdf7' };

// Neo-brutalism CSS for table
const NEO_TABLE_CSS = `
.task-table .ant-table { background: transparent !important; }
.task-table .ant-table-container { background: transparent !important; }
.task-table .ant-table-content { background: transparent !important; }
.task-table .ant-table-wrapper { background: transparent !important; }
.task-table .ant-table-thead > tr > th {
  background: #fffdf7 !important;
  border-bottom: 3px solid #222 !important;
  font-weight: 700 !important;
}
.task-table .ant-table-tbody > tr > td {
  border-bottom: 2px solid #ddd !important;
}
.task-table .ant-table-tbody > tr:hover > td {
  background: #f0f0f0 !important;
}
.task-table .ant-table-cell { cursor: pointer; }
.task-table .ant-input,
.task-table .ant-picker {
  border: 2px solid #222 !important;
  border-radius: 4px !important;
}
.task-table .ant-input:focus,
.task-table .ant-input-focused,
.task-table .ant-picker-focused {
  border-color: #222 !important;
  box-shadow: 2px 2px 0px #222 !important;
}
.task-table .ant-select .ant-select-selector {
  border: 2px solid #222 !important;
  border-radius: 4px !important;
}
.task-table .ant-select-focused .ant-select-selector {
  box-shadow: 2px 2px 0px #222 !important;
}
.task-table .ant-pagination { background: transparent; }
.task-table .fb-row > td { background: #faf5ff !important; }
.task-table .fb-row:hover > td { background: #f0e6ff !important; }
.task-table .fb-row .ant-input { border-color: #722ed1 !important; }
.task-table .fb-row .ant-picker { border-color: #722ed1 !important; }
.task-table .fb-row .ant-table-selection-column .ant-checkbox-wrapper { display: none; }
`;

export default function TaskTableView({ tasks, onEdit, onDelete, onDeleteFeedback, onUpdateFeedback }) {
  const { t } = useI18n();
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({});
  const [fbEdits, setFbEdits] = useState({});
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const savingRef = useRef(false);
  const tableRef = useRef(null);
  const todayStr = dayjs().format('YYYY-MM-DD');

  const startEdit = async (task) => {
    if (savingRef.current) return;
    if (editingId && editingId !== task.id) {
      await autoSave();
    }
    if (task.id === editingId) return;
    setEditingId(task.id);
    setForm({
      name: task.name, estTime: task.estTime, estUnit: task.estUnit,
      startDate: task.startDate, dueDate: task.dueDate,
      status: task.status, priorityLabel: task.priorityLabel,
    });
    const edits = {};
    task.feedbacks?.forEach(fb => {
      edits[fb.id] = { content: fb.content, startDate: fb.startDate, endDate: fb.endDate };
    });
    setFbEdits(edits);
  };

  // Auto-save on blur/onChange — prevents double-save with ref
  const autoSave = async (updates) => {
    if (savingRef.current || !editingId) return;
    savingRef.current = true;
    const merged = { ...form, ...updates };
    await onEdit(editingId, merged);
    // Save changed feedbacks
    const editingTask = tasks.find(t => t.id === editingId);
    editingTask?.feedbacks?.forEach(fb => {
      const edit = fbEdits[fb.id];
      if (edit && (edit.content !== fb.content || edit.startDate !== fb.startDate || edit.endDate !== fb.endDate)) {
        onUpdateFeedback?.(editingId, fb.id, { content: edit.content, startDate: edit.startDate, endDate: edit.endDate });
      }
    });
    setEditingId(null);
    setForm({});
    setFbEdits({});
    savingRef.current = false;
  };

  // Click outside table → save and exit edit
  useEffect(() => {
    if (!editingId) return;
    const handler = (e) => {
      if (tableRef.current?.contains(e.target)) return;
      if (e.target.closest('.ant-picker-dropdown, .ant-select-dropdown, .ant-popover')) return;
      autoSave();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  });

  // Delayed blur save — allows clicking other cells in same row
  const handleInputBlur = () => {
    setTimeout(() => {
      if (!savingRef.current && editingId) autoSave();
    }, 150);
  };

  const isEditing = (id) => id === editingId;

  const handleBulkDelete = async () => {
    for (const id of selectedRowKeys) { await onDelete(id); }
    setSelectedRowKeys([]);
  };

  // Build flat dataSource: task rows + fb sub-rows (only when editing)
  const dataSource = [];
  tasks.forEach(task => {
    dataSource.push({ ...task, key: task.id });
    if (editingId === task.id && task.feedbacks?.length) {
      task.feedbacks.forEach(fb => {
        dataSource.push({
          key: `fb_${fb.id}`,
          _isFb: true,
          _parentId: task.id,
          _fb: fb,
        });
      });
    }
  });

  const editableOnCell = (record) => ({
    onClick: () => {
      if (record._isFb) return; // fb row click handled separately
      startEdit(record);
    },
  });

  const columns = [
    {
      title: t('table.name'), dataIndex: 'name', key: 'name', width: 220,
      sorter: (a, b) => (a.name || '').localeCompare(b.name || ''),
      onCell: editableOnCell,
      render: (_, record) => {
        // Feedback row
        if (record._isFb) {
          const fb = record._fb;
          const editing = isEditing(record._parentId);
          if (editing) {
            return (
              <Flex gap={4} align="center">
                <Text style={{ color: '#722ed1', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>└─</Text>
                <Input size="small" style={{ flex: 1 }}
                  value={fbEdits[fb.id]?.content ?? fb.content}
                  onClick={e => e.stopPropagation()}
                  onChange={e => setFbEdits(prev => ({
                    ...prev, [fb.id]: { ...prev[fb.id], content: e.target.value },
                  }))} />
              </Flex>
            );
          }
          return (
            <Text style={{ color: '#722ed1', fontSize: 13, fontWeight: 600, paddingLeft: 8 }}>
              └─ {fb.content}
            </Text>
          );
        }
        // Task row
        if (isEditing(record.id)) {
          return (
            <Input size="small" value={form.name}
              onClick={e => e.stopPropagation()}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              onBlur={handleInputBlur}
              onPressEnter={() => autoSave()} />
          );
        }
        const latestFb = record.feedbacks?.at(-1);
        return (
          <Text strong style={{ fontSize: 13 }}>
            {record.name}
            {latestFb && (
              <>
                <span style={{ color: '#8c8c8c', margin: '0 4px', fontWeight: 400 }}>+</span>
                <span style={{ color: '#722ed1' }}>{latestFb.content}</span>
              </>
            )}
          </Text>
        );
      },
    },
    {
      title: t('table.est'), key: 'est', width: 80,
      sorter: (a, b) => toHours(a) - toHours(b),
      onCell: editableOnCell,
      render: (_, record) => {
        // Feedback row — show days diff
        if (record._isFb) {
          const fb = record._fb;
          const fbStart = fbEdits[fb.id]?.startDate ?? fb.startDate ?? '';
          const fbEnd = fbEdits[fb.id]?.endDate ?? fb.endDate ?? fb.createdAt;
          const fbDays = fbStart && fbEnd ? Math.max(1, Math.ceil((dayjs(fbEnd).valueOf() - dayjs(fbStart).valueOf()) / 86400000)) : '—';
          const editing = isEditing(record._parentId);
          if (editing) {
            return (
              <Flex gap={2} align="center">
                <Input size="small" style={{ width: 40, textAlign: 'center' }}
                  value={fbDays}
                  onClick={e => e.stopPropagation()}
                  onChange={e => {
                    const days = parseInt(e.target.value) || 1;
                    const newEnd = dayjs(fbStart).add(days, 'day').format('YYYY-MM-DD');
                    setFbEdits(prev => ({
                      ...prev, [fb.id]: { ...prev[fb.id], endDate: newEnd },
                    }));
                  }} />
                <Text style={{ color: '#722ed1', fontSize: 11, fontWeight: 600 }}>d</Text>
              </Flex>
            );
          }
          return <Text style={{ color: '#722ed1', fontSize: 13, fontWeight: 600 }}>{fbDays}d</Text>;
        }
        // Task row
        if (isEditing(record.id)) {
          return (
            <Flex gap={2} align="center">
              <Input size="small" style={{ width: 50 }}
                value={form.estTime}
                onClick={e => e.stopPropagation()}
                onChange={e => {
                  const v = e.target.value;
                  if (v === '' || /^\d*\.?\d*$/.test(v)) setForm(f => ({ ...f, estTime: v }));
                }}
                onBlur={handleInputBlur}
                onPressEnter={() => autoSave()} />
              <Text style={{ fontSize: 12, fontWeight: 600 }}>{form.estUnit}</Text>
            </Flex>
          );
        }
        return <span>{record.estTime}{record.estUnit}</span>;
      },
    },
    {
      title: t('table.due'), key: 'dates', width: 220,
      sorter: (a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''),
      onCell: editableOnCell,
      render: (_, record) => {
        // Feedback row
        if (record._isFb) {
          const fb = record._fb;
          const parentTask = tasks.find(t => t.id === record._parentId);
          const fbStart = fbEdits[fb.id]?.startDate ?? fb.startDate ?? parentTask?.dueDate;
          const fbEnd = fbEdits[fb.id]?.endDate ?? fb.endDate ?? fb.createdAt;
          const editing = isEditing(record._parentId);
          if (editing) {
            return (
              <DatePicker.RangePicker size="small" style={{ width: '100%' }}
                popupStyle={neoDropdownStyle}
                disabledDate={() => false}
                onClick={e => e.stopPropagation()}
                value={[dayjs(fbStart), dayjs(fbEnd)]}
                onChange={dates => dates?.[0] && dates?.[1] && setFbEdits(prev => ({
                  ...prev, [fb.id]: { ...prev[fb.id], startDate: dates[0].format('YYYY-MM-DD'), endDate: dates[1].format('YYYY-MM-DD') },
                }))} />
            );
          }
          return (
            <Text style={{ color: '#722ed1', fontSize: 13, fontWeight: 600 }}>
              {fbStart?.slice(5)} → {fbEnd?.slice(5, 10)}
            </Text>
          );
        }
        // Task row
        if (isEditing(record.id)) {
          return (
            <DatePicker.RangePicker size="small" style={{ width: '100%' }}
              popupStyle={neoDropdownStyle}
              disabledDate={() => false}
              onClick={e => e.stopPropagation()}
              value={[dayjs(form.startDate), dayjs(form.dueDate)]}
              onChange={dates => {
                if (dates?.[0] && dates?.[1]) {
                  const start = dates[0].format('YYYY-MM-DD');
                  const due = dates[1].format('YYYY-MM-DD');
                  const diffDays = Math.max(1, Math.ceil((dates[1].valueOf() - dates[0].valueOf()) / 86400000));
                  autoSave({ startDate: start, dueDate: due, estTime: diffDays, estUnit: 'd' });
                }
              }} />
          );
        }
        const latestFb = record.feedbacks?.at(-1);
        const fbEnd = latestFb?.endDate || latestFb?.createdAt;
        const isOverdue = record.dueDate < todayStr && record.status !== 'done';
        return (
          <Text style={{ color: isOverdue ? '#cf1322' : '#595959', fontSize: 13, fontWeight: 600 }}>
            {record.startDate?.slice(5)} → {record.dueDate?.slice(5)}
            {fbEnd && <span style={{ color: '#722ed1' }}> → {fbEnd.slice(5, 10)}</span>}
          </Text>
        );
      },
    },
    {
      title: t('table.status'), dataIndex: 'status', key: 'status', width: 130,
      filters: STATUSES.map(s => ({ text: t(`status.${s}`), value: s })),
      onFilter: (v, r) => r.status === v,
      onCell: editableOnCell,
      render: (val, record) => {
        // Feedback row — show delete button
        if (record._isFb) {
          const editing = isEditing(record._parentId);
          if (!editing) return null;
          return (
            <Popconfirm title={t?.('common.delete') || 'Delete?'}
              onConfirm={() => onDeleteFeedback?.(record._parentId, record._fb.id)}
              okText="OK" cancelText={t?.('common.cancel') || 'Cancel'}>
              <Button size="small" danger icon={<DeleteOutlined />}
                style={{ width: 24, height: 24, padding: 0 }}
                onClick={e => e.stopPropagation()} />
            </Popconfirm>
          );
        }
        // Task row
        if (isEditing(record.id)) {
          return (
            <Select size="small" value={form.status} style={{ width: '100%' }}
              popupStyle={neoDropdownStyle}
              onClick={e => e.stopPropagation()}
              onChange={v => autoSave({ status: v })}
              options={STATUSES.map(s => ({ value: s, label: t(`status.${s}`) }))} />
          );
        }
        return <Tag color={STATUS_TAG_COLORS[val]}>{t(`status.${val}`)}</Tag>;
      },
    },
    {
      title: t('table.priority'), dataIndex: 'priorityLabel', key: 'priority', width: 100,
      sorter: (a, b) => (a.priority || 0) - (b.priority || 0),
      onCell: editableOnCell,
      render: (val, record) => {
        if (record._isFb) return null;
        if (isEditing(record.id)) {
          return (
            <Select size="small" value={form.priorityLabel || 'medium'} style={{ width: '100%' }}
              popupStyle={neoDropdownStyle}
              onClick={e => e.stopPropagation()}
              onChange={v => autoSave({ priorityLabel: v })}
              options={PRIORITY_OPTIONS.map(p => ({ value: p, label: p }))} />
          );
        }
        return <Tag color={PRIORITY_COLORS[val] || 'default'}>{val || '—'}</Tag>;
      },
    },
  ];

  return (
    <div ref={tableRef}>
      <style>{NEO_TABLE_CSS}</style>

      {/* Bulk Actions Bar */}
      {selectedRowKeys.length > 0 && (
        <Flex align="center" gap={12} style={{
          padding: '8px 16px', marginBottom: 8,
          background: '#fffdf7', border: '2px solid #222', boxShadow: '4px 4px 0px #222',
        }}>
          <Text strong>{t('common.selected') || 'Đã chọn'} {selectedRowKeys.length} task</Text>
          <Popconfirm title={`${t('common.delete') || 'Xóa'} ${selectedRowKeys.length} task?`}
            onConfirm={handleBulkDelete} okText="OK" cancelText={t('common.cancel') || 'Hủy'}>
            <Button size="small" danger icon={<DeleteOutlined />}
              style={{ border: '2px solid #222', borderRadius: 0, boxShadow: '2px 2px 0px #222' }}>
              {t('common.delete') || 'Xóa'}
            </Button>
          </Popconfirm>
          <Button size="small" icon={<EditOutlined />}
            style={{ border: '2px solid #222', borderRadius: 0, boxShadow: '2px 2px 0px #222' }}>
            {t('common.bulkEdit') || 'Sửa hàng loạt'}
          </Button>
        </Flex>
      )}

      <Table
        className="task-table"
        dataSource={dataSource}
        columns={columns}
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
          getCheckboxProps: (r) => ({ disabled: !!r._isFb, style: r._isFb ? { display: 'none' } : {} }),
        }}
        pagination={{ pageSize: 20, showSizeChanger: true, pageSizeOptions: [10, 20, 50] }}
        size="small"
        scroll={{ x: 800 }}
        rowClassName={(record) => {
          if (record._isFb) return 'fb-row';
          return record.dueDate < todayStr && record.status !== 'done' ? 'overdue-row' : '';
        }}
        style={{ background: 'transparent' }}
      />
    </div>
  );
}
