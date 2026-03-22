import { useRef, useCallback, useMemo } from 'react';
import { Table, Input, Select, Badge, Button, Tooltip } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { useI18n } from '../../i18n/i18n-config.jsx';
import NeoRangePicker from '../shared/neo-range-picker.jsx';
import dayjs from 'dayjs';

/* Column keys in navigation order */
const COL_KEYS = ['name', 'game', 'project', 'est'];

export default function ParsedTaskPreviewTable({
  tasks, feedbackItems, onEditTask, onDismissFeedback,
}) {
  const { t } = useI18n();
  const tableRef = useRef(null);

  // Map feedback items by index for quick lookup
  const feedbackMap = new Map(feedbackItems.map(fb => [fb.index, fb]));

  // Extract unique project/type options from current tasks
  const gameOptions = useMemo(() =>
    [...new Set(tasks.map(t => t.game).filter(Boolean))].map(v => ({ value: v, label: v })),
  [tasks]);
  const projectOptions = useMemo(() =>
    [...new Set(tasks.map(t => t.project).filter(Boolean))].map(v => ({ value: v, label: v })),
  [tasks]);

  /* Arrow key navigation between cells */
  const handleCellKeyDown = useCallback((e, rowIdx, colKey) => {
    const colIdx = COL_KEYS.indexOf(colKey);
    if (colIdx < 0) return;
    let nextRow = rowIdx, nextCol = colIdx;

    if (e.key === 'ArrowDown') { nextRow = Math.min(rowIdx + 1, tasks.length - 1); }
    else if (e.key === 'ArrowUp') { nextRow = Math.max(rowIdx - 1, 0); }
    else if (e.key === 'ArrowRight' && e.target.selectionStart === e.target.value?.length) {
      nextCol = Math.min(colIdx + 1, COL_KEYS.length - 1);
    } else if (e.key === 'ArrowLeft' && e.target.selectionStart === 0) {
      nextCol = Math.max(colIdx - 1, 0);
    } else return;

    if (nextRow === rowIdx && nextCol === colIdx) return;
    e.preventDefault();

    // Focus target cell input
    const nextKey = COL_KEYS[nextCol];
    const el = tableRef.current?.querySelector(`[data-cell="${nextRow}-${nextKey}"] input`);
    if (el) el.focus();
  }, [tasks.length]);

  const columns = [
    {
      title: t('table.name'),
      dataIndex: 'name',
      key: 'name',
      render: (val, _, index) => {
        const fb = feedbackMap.get(index);
        return (
          <div data-cell={`${index}-name`}>
            <Input
              size="small"
              value={val}
              onChange={e => onEditTask(index, 'name', e.target.value)}
              onKeyDown={e => handleCellKeyDown(e, index, 'name')}
              style={{ marginBottom: fb ? 4 : 0 }}
            />
            {fb && (
              <div>
                <Badge
                  status="warning"
                  text={
                    <span style={{ fontSize: 12 }}>
                      Feedback → <strong>{fb.detection.targetTask.name}</strong>
                      {' '}
                      <Tooltip title="Dismiss">
                        <Button type="text" size="small" icon={<CloseOutlined />}
                          onClick={() => onDismissFeedback(index)} />
                      </Tooltip>
                    </span>
                  }
                />
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: t('table.game'),
      dataIndex: 'game',
      key: 'game',
      width: 100,
      render: (val, _, index) => (
        <div data-cell={`${index}-game`}>
          <Select
            size="small"
            value={val || undefined}
            onChange={v => onEditTask(index, 'game', v)}
            onKeyDown={e => handleCellKeyDown(e, index, 'game')}
            style={{ width: '100%' }}
            showSearch
            allowClear
            placeholder="—"
            options={gameOptions}
            dropdownStyle={{ minWidth: 120 }}
            filterOption={(input, option) => option.label.toLowerCase().includes(input.toLowerCase())}
            onSearch={() => {}} // enable typing in search
          />
        </div>
      ),
    },
    {
      title: t('table.project'),
      dataIndex: 'project',
      key: 'project',
      width: 100,
      render: (val, _, index) => (
        <div data-cell={`${index}-project`}>
          <Select
            size="small"
            value={val || undefined}
            onChange={v => onEditTask(index, 'project', v)}
            onKeyDown={e => handleCellKeyDown(e, index, 'project')}
            style={{ width: '100%' }}
            showSearch
            allowClear
            placeholder="—"
            options={projectOptions}
            dropdownStyle={{ minWidth: 120 }}
            filterOption={(input, option) => option.label.toLowerCase().includes(input.toLowerCase())}
            onSearch={() => {}}
          />
        </div>
      ),
    },
    {
      title: t('table.est'),
      key: 'est',
      width: 60,
      render: (_, record, index) => (
        <div data-cell={`${index}-est`}>
          <Input
            size="small"
            value={`${record.estTime}${record.estUnit}`}
            onKeyDown={e => handleCellKeyDown(e, index, 'est')}
            onChange={e => {
              const match = e.target.value.match(/^(\d+(?:\.\d+)?)\s*(d|h)?$/i);
              if (match) {
                onEditTask(index, 'estTime', parseFloat(match[1]));
                if (match[2]) onEditTask(index, 'estUnit', match[2].toLowerCase());
              }
            }}
          />
        </div>
      ),
    },
    {
      title: t('table.due'),
      key: 'dueDate',
      width: 110,
      render: (_, record, index) => (
        <NeoRangePicker
          value={record.startDate && record.dueDate ? [dayjs(record.startDate), dayjs(record.dueDate)] : undefined}
          onChange={([start, end]) => {
            onEditTask(index, 'startDate', start.format('YYYY-MM-DD'));
            onEditTask(index, 'dueDate', end.format('YYYY-MM-DD'));
          }}
          numberOfMonths={1}
          placeholder={record.startDate ? `${record.startDate.slice(5)} → ${record.dueDate?.slice(5)}` : 'Pick'}
        />
      ),
    },
  ];

  return (
    <>
      <style>{`
        .magic-preview .ant-table { border: 3px solid var(--border-color) !important; box-shadow: 4px 4px 0px var(--shadow-color) !important; border-radius: 2px !important; overflow: hidden; background: var(--bg-card) !important; }
        .magic-preview .ant-table-thead > tr > th { background: var(--bg-header) !important; border-bottom: 3px solid var(--border-color) !important; font-weight: 700 !important; }
        .magic-preview .ant-table-tbody > tr > td { border-bottom: 2px solid var(--border-color) !important; background: var(--bg-card) !important; }
        .magic-preview .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
        .magic-preview .ant-table-cell::before { display: none !important; }
        .magic-preview .ant-table-container { border: none !important; box-shadow: none !important; }
      `}</style>
      <div ref={tableRef}>
        <Table
          className="magic-preview"
          dataSource={tasks.map((t, i) => ({ ...t, key: t.id || i }))}
          columns={columns}
          pagination={false}
          size="small"
          scroll={{ x: false }}
          rowClassName={(_, index) => feedbackMap.has(index) ? 'feedback-row' : ''}
        />
      </div>
    </>
  );
}
