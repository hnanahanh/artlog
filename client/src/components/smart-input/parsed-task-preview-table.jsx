import { Table, Tag, Input, Badge, Button, Tooltip, Select } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { useI18n } from '../../i18n/i18n-config.jsx';
import { STATUS_TAG_COLORS } from '../../utils/status-constants.js';

export default function ParsedTaskPreviewTable({
  tasks, feedbackItems, onEditTask, onDismissFeedback,
}) {
  const { t } = useI18n();

  // Map feedback items by index for quick lookup
  const feedbackMap = new Map(feedbackItems.map(fb => [fb.index, fb]));

  const columns = [
    {
      title: t('table.name'),
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (val, _, index) => {
        const fb = feedbackMap.get(index);
        return (
          <div>
            <Input
              size="small"
              value={val}
              onChange={e => onEditTask(index, 'name', e.target.value)}
              style={{ marginBottom: fb ? 4 : 0 }}
            />
            {fb && (
              <div>
                <Badge
                  status="warning"
                  text={
                    <span style={{ fontSize: 12 }}>
                      <Tag color="orange">{t('magic.feedback_detected')}</Tag>
                      {t('magic.feedback_confirm')}:{' '}
                      <strong>{fb.detection.targetTask.name}</strong>
                      {' '}
                      <Tooltip title="Dismiss - create as new task">
                        <Button
                          type="text"
                          size="small"
                          icon={<CloseOutlined />}
                          onClick={() => onDismissFeedback(index)}
                        />
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
      width: 120,
      render: (val, _, index) => (
        <Input size="small" value={val} onChange={e => onEditTask(index, 'game', e.target.value)} />
      ),
    },
    {
      title: t('table.project'),
      dataIndex: 'project',
      key: 'project',
      width: 140,
      render: (val, _, index) => (
        <Input size="small" value={val} onChange={e => onEditTask(index, 'project', e.target.value)} />
      ),
    },
    {
      title: t('table.est'),
      key: 'est',
      width: 100,
      render: (_, record, index) => (
        <Input
          size="small"
          value={`${record.estTime}${record.estUnit}`}
          onChange={e => {
            const match = e.target.value.match(/^(\d+(?:\.\d+)?)\s*(d|h)?$/i);
            if (match) {
              onEditTask(index, 'estTime', parseFloat(match[1]));
              if (match[2]) onEditTask(index, 'estUnit', match[2].toLowerCase());
            }
          }}
        />
      ),
    },
    {
      title: t('table.due'),
      key: 'dueDate',
      width: 150,
      render: (_, record) => (
        <Tag>{record.startDate?.slice(5)} → {record.dueDate?.slice(5)}</Tag>
      ),
    },
    {
      title: t('table.status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (val, _, index) => (
        <Select
          size="small"
          value={val}
          onChange={v => onEditTask(index, 'status', v)}
          style={{ width: '100%' }}
          options={[
            { value: 'todo', label: t('status.todo') },
            { value: 'in_progress', label: t('status.in_progress') },
            { value: 'review', label: t('status.review') },
            { value: 'done', label: t('status.done') },
          ]}
        />
      ),
    },
    {
      title: t('table.priority'),
      dataIndex: 'priorityLabel',
      key: 'priority',
      width: 100,
      render: (val) => {
        const colorMap = { high: 'red', medium: 'orange', low: 'default' };
        const labelMap = { high: 'High', medium: 'Medium', low: 'Low' };
        return <Tag color={colorMap[val] || 'default'}>{labelMap[val] || val}</Tag>;
      },
    },
  ];

  return (
    <Table
      dataSource={tasks.map((t, i) => ({ ...t, key: t.id || i }))}
      columns={columns}
      pagination={false}
      size="small"
      scroll={{ x: 800 }}
      rowClassName={(_, index) => feedbackMap.has(index) ? 'feedback-row' : ''}
    />
  );
}
