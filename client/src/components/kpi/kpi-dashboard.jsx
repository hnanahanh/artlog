import { Table, Typography, Button } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { useI18n } from '../../i18n/i18n-config.jsx';
import { getKPICsvUrl } from '../../api/task-api-client.js';

const { Text } = Typography;

/* Neo-brutalism palette for chart slices */
const CHART_COLORS = ['#c47dff', '#faad14', '#1677ff', '#52c41a', '#ff4d4f', '#13c2c2', '#eb2f96', '#8c8c8c'];

/* Stat card styled like kanban column header */
function StatCard({ label, value, headerBg, bodyBg }) {
  return (
    <div className="neo-box" style={{
      border: '3px solid var(--border-color)', borderRadius: 2, overflow: 'hidden',
      boxShadow: '4px 4px 0px var(--shadow-color)',
      transition: 'box-shadow 0.15s, transform 0.15s',
    }}>
      <div style={{
        background: headerBg, padding: '6px 12px',
        fontWeight: 900, fontSize: 12, color: 'var(--text-primary)',
        borderBottom: '2px solid var(--border-color)',
      }}>{label}</div>
      <div style={{
        background: bodyBg, padding: '12px',
        textAlign: 'center',
      }}>
        <Text strong style={{ fontSize: 26, color: 'var(--text-primary)' }}>{value}</Text>
      </div>
    </div>
  );
}

/* SVG Donut chart with center text */
function DonutChart({ data, title, size = 160 }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <Text type="secondary">—</Text>;

  const cx = size / 2, cy = size / 2, r = size * 0.35, stroke = size * 0.15;
  let cumAngle = -90;

  const arcs = data.map((d, i) => {
    const angle = (d.value / total) * 360;
    const startRad = (cumAngle * Math.PI) / 180;
    const endRad = ((cumAngle + angle) * Math.PI) / 180;
    cumAngle += angle;

    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);
    const large = angle > 180 ? 1 : 0;

    if (data.length === 1) {
      return (
        <circle key={i} cx={cx} cy={cy} r={r}
          fill="none" stroke={CHART_COLORS[i % CHART_COLORS.length]}
          strokeWidth={stroke} />
      );
    }

    return (
      <path key={i}
        d={`M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`}
        fill="none" stroke={CHART_COLORS[i % CHART_COLORS.length]}
        strokeWidth={stroke} />
    );
  });

  return (
    <div className="neo-box" style={{
      border: '3px solid var(--border-color)', borderRadius: 2,
      boxShadow: '4px 4px 0px var(--shadow-color)', background: 'var(--bg-card)',
      padding: 12, overflow: 'hidden',
    }}>
      <Text strong style={{
        fontSize: 13, color: 'var(--text-primary)', display: 'block',
        marginBottom: 8, fontWeight: 900,
      }}>{title}</Text>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {arcs}
          <text x={cx} y={cy - 6} textAnchor="middle" fontSize="22" fontWeight="900"
            fill="var(--text-primary)">{total}</text>
          <text x={cx} y={cy + 12} textAnchor="middle" fontSize="10"
            fill="var(--text-secondary)">tasks</text>
        </svg>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
          {data.map((d, i) => (
            <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <div style={{
                width: 12, height: 12, borderRadius: 2,
                background: CHART_COLORS[i % CHART_COLORS.length],
                border: '1.5px solid var(--border-color)', flexShrink: 0,
              }} />
              <Text style={{ color: 'var(--text-primary)', fontSize: 12, flex: 1 }}>{d.label}</Text>
              <Text strong style={{ color: 'var(--text-primary)', fontSize: 12 }}>{d.value}</Text>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* Format est time for display */
function formatEst(estTime, estUnit) {
  if (!estTime) return '—';
  return estUnit === 'h' ? `${estTime}h` : `${estTime}d`;
}

export default function KpiDashboard({ data, from, to }) {
  const { t } = useI18n();
  const s = data.summary;

  // Donut data
  const gameChartData = Object.entries(s.byGame || {}).map(([k, v]) => ({ label: k, value: v }));
  const projectChartData = Object.entries(s.byProject || {}).map(([k, v]) => ({ label: k, value: v }));

  // Table data
  const tableData = s.completedDetails
    ? s.completedDetails.map((d, i) => ({ key: i, ...d }))
    : Object.entries(s.byGameTasks || {}).flatMap(([game, tasks]) =>
        tasks.map((name, i) => ({ key: `${game}-${i}`, name, game, project: '', estTime: 0, estUnit: 'd' }))
      );

  // Compute rowSpan for game column — merge consecutive same-game rows
  const gameRowSpans = tableData.map((row, i) => {
    if (i > 0 && row.game === tableData[i - 1].game) return 0;
    let span = 1;
    while (i + span < tableData.length && tableData[i + span].game === row.game) span++;
    return span;
  });

  // Distribute 100% evenly among games, integers summing to 100 (largest remainder method)
  const games = [...new Set(tableData.map(r => r.game).filter(Boolean))];
  const exact = 100 / (games.length || 1);
  const floors = games.map(() => Math.floor(exact));
  const leftover = 100 - floors.reduce((s, v) => s + v, 0);
  games.map((_, i) => ({ i, r: exact - floors[i] }))
    .sort((a, b) => b.r - a.r)
    .slice(0, leftover)
    .forEach(({ i }) => floors[i]++);
  const kpiMap = Object.fromEntries(games.map((g, i) => [g, floors[i]]));

  const COL_BORDER = { borderRight: '2px solid var(--border-color)' };

  const columns = [
    { title: t('table.game'), dataIndex: 'game', key: 'game', width: 120,
      onCell: (_, index) => ({ rowSpan: gameRowSpans[index], style: COL_BORDER }),
      onHeaderCell: () => ({ style: COL_BORDER }),
      render: (val) => <Text strong style={{ color: 'var(--accent-color)', fontSize: 13 }}>{val}</Text> },
    { title: t('kpi.game_weight'), dataIndex: 'game', key: 'kpi_weight', width: 70, align: 'center',
      onCell: (_, index) => ({ rowSpan: gameRowSpans[index], style: COL_BORDER }),
      onHeaderCell: () => ({ style: COL_BORDER }),
      render: (val) => <Text strong style={{ color: '#722ed1', fontSize: 13 }}>{kpiMap[val] ?? 0}%</Text> },
    { title: t('table.project'), dataIndex: 'project', key: 'project', width: 140,
      onCell: () => ({ style: COL_BORDER }),
      onHeaderCell: () => ({ style: COL_BORDER }),
      render: (val) => <Text style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{val || '—'}</Text> },
    { title: t('table.name'), dataIndex: 'name', key: 'name',
      onCell: () => ({ style: COL_BORDER }),
      onHeaderCell: () => ({ style: COL_BORDER }),
      render: (val) => <Text strong style={{ color: 'var(--text-primary)', fontSize: 13 }}>{val}</Text> },
    { title: t('table.est'), dataIndex: 'estTime', key: 'est', width: 80, align: 'center',
      render: (val, row) => <Text style={{
        fontWeight: 700, fontSize: 13, color: 'var(--text-primary)',
      }}>{formatEst(val, row.estUnit)}</Text> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Row 1: 3 stat cards — kanban column style */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <StatCard label={t('kpi.total')} value={s.totalTasks}
          headerBg="var(--col-todo-header)" bodyBg="var(--col-todo-body)" />
        <StatCard label={t('kpi.overdue_rate')} value={`${s.overdueCount || 0} (${s.overdueRate || 0}%)`}
          headerBg="var(--danger-bg)" bodyBg="var(--danger-bg)" />
        <StatCard label={t('kpi.est_days')} value={s.totalEstDays}
          headerBg="var(--col-progress-header)" bodyBg="var(--col-progress-body)" />
      </div>

      {/* Row 2: 2 donut charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <DonutChart data={gameChartData} title={t('kpi.by_game')} />
        <DonutChart data={projectChartData} title={t('kpi.by_project')} />
      </div>

      {/* Row 3: Completed tasks — unified border, no inner table border */}
      <div className="neo-box" style={{
        border: '3px solid var(--border-color)', borderRadius: 2,
        boxShadow: '4px 4px 0px var(--shadow-color)', background: 'var(--bg-card)',
        overflow: 'hidden',
      }}>
        <div style={{
          background: 'var(--bg-header)', padding: '8px 12px',
          fontWeight: 900, fontSize: 14, borderBottom: '2px solid var(--border-color)',
          color: 'var(--text-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span>{t('kpi.completed_tasks')} ({tableData.length})</span>
          <a href={getKPICsvUrl(from, to)} download>
            <Button size="small" icon={<DownloadOutlined />} style={{
              border: '2px solid var(--border-color)', borderRadius: 2, fontWeight: 700, fontSize: 12,
            }}>
              {t('kpi.download_csv')}
            </Button>
          </a>
        </div>
        <style>{`
          .kpi-table .ant-table { background: transparent !important; }
          .kpi-table .ant-table-thead > tr > th { background: var(--bg-header) !important; border-bottom: 2px solid var(--border-color) !important; }
          .kpi-table .ant-table-tbody > tr > td { border-bottom: 2px solid var(--border-color) !important; background: transparent !important; }
          .kpi-table .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
          .kpi-table .ant-table-tbody > tr:hover > td { background: var(--bg-secondary) !important; }
          .kpi-table .ant-table-container { border: none !important; box-shadow: none !important; }
          .kpi-table .ant-table-cell::before { display: none !important; }
          .kpi-table .ant-table-content { border: none !important; }
        `}</style>
        <Table
          className="kpi-table"
          dataSource={tableData}
          columns={columns}
          pagination={false}
          size="small"
          bordered={false}
          style={{ background: 'transparent' }}
          locale={{ emptyText: '—' }}
        />
      </div>
    </div>
  );
}
