import { Table, Typography, Button } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { useI18n } from '../../i18n/i18n-config.jsx';
import { getKPICsvUrl } from '../../api/task-api-client.js';
import { transformGameData, transformGameTaskList } from '../../processors/kpi-processor.js';

const { Text } = Typography;

/* Neo-brutalism card wrapper */
function BentoCard({ title, children, style }) {
  return (
    <div style={{
      border: '3px solid var(--border-color)', borderRadius: 2,
      boxShadow: '4px 4px 0px var(--shadow-color)', background: 'var(--bg-card)',
      overflow: 'hidden', ...style,
    }}>
      <div style={{
        background: 'var(--bg-header)', padding: '8px 12px',
        fontWeight: 900, fontSize: 14, borderBottom: '2px solid var(--border-color)',
        color: 'var(--text-primary)',
      }}>
        {title}
      </div>
      <div style={{ padding: '12px' }}>
        {children}
      </div>
    </div>
  );
}

/* Game stat row */
function GameRow({ game, count }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '8px 0', borderBottom: '1px solid var(--bg-header)',
    }}>
      <Text strong style={{ fontSize: 14, color: 'var(--text-primary)' }}>{game}</Text>
      <Text style={{
        fontSize: 13, fontWeight: 700, color: 'var(--accent-color)',
        background: 'var(--bg-secondary)', padding: '2px 10px',
        border: '2px solid var(--border-color)', borderRadius: 2,
      }}>
        {count}
      </Text>
    </div>
  );
}

export default function KpiDashboard({ data, from, to }) {
  const { t } = useI18n();
  const s = data.summary;
  const gameData = transformGameData(s.byGame);
  const taskList = transformGameTaskList(s.byGameTasks);

  const taskColumns = [
    { title: t('table.name'), dataIndex: 'name', key: 'name',
      render: (val) => <Text strong style={{ color: 'var(--text-primary)' }}>{val}</Text> },
    { title: t('table.game'), dataIndex: 'game', key: 'game', width: 120,
      render: (val) => <Text style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{val}</Text> },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20 }}>
      {/* Left: Game stats */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <BentoCard title={t('kpi.by_game')}>
          {gameData.length > 0 ? (
            gameData.map(g => <GameRow key={g.key} game={g.game} count={g.count} />)
          ) : (
            <Text type="secondary">—</Text>
          )}
        </BentoCard>

        {/* CSV download */}
        <a href={getKPICsvUrl(from, to)} download style={{ alignSelf: 'flex-start' }}>
          <Button icon={<DownloadOutlined />} style={{
            border: '2px solid var(--border-color)', boxShadow: '3px 3px 0px var(--shadow-color)',
            borderRadius: 2, fontWeight: 700,
          }}>
            {t('kpi.download_csv')}
          </Button>
        </a>
      </div>

      {/* Right: Completed tasks table */}
      <BentoCard title={`${t('kpi.completed_tasks')} (${taskList.length})`}>
        <Table
          dataSource={taskList}
          columns={taskColumns}
          pagination={false}
          size="small"
          style={{ background: 'transparent' }}
          locale={{ emptyText: '—' }}
        />
      </BentoCard>
    </div>
  );
}
