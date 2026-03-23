import { useMemo } from 'react';
import { Table, Typography } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { PieChart, Pie, Cell, Label, Tooltip, ResponsiveContainer } from 'recharts';
import { useI18n } from '../../i18n/i18n-config.jsx';
import { getKPICsvUrl } from '../../api/task-api-client.js';

const { Text } = Typography;

/* Fallback chart colors — actual values read from CSS vars at render time */
const CHART_FALLBACK = ['#c47dff', '#faad14', '#1677ff', '#52c41a', '#ff4d4f', '#13c2c2', '#eb2f96', '#8c8c8c'];
function getChartColors() {
  try {
    const s = getComputedStyle(document.documentElement);
    return Array.from({ length: 8 }, (_, i) => s.getPropertyValue(`--chart-color-${i + 1}`).trim() || CHART_FALLBACK[i]);
  } catch { return CHART_FALLBACK; }
}

/* Stat card styled like kanban column header */
function StatCard({ label, value, headerBg }) {
  return (
    <div style={{
      overflow: 'hidden', background: headerBg,
      padding: '8px 6px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '100%',
    }}>
      <span style={{ fontWeight: 900, fontSize: 10, color: 'var(--text-primary)', textTransform: 'uppercase', fontFamily: "'JetBrains Mono'", textAlign: 'center', lineHeight: 1.2 }}>{label}</span>
      <Text strong style={{ fontSize: 18, color: 'var(--text-primary)', fontFamily: "'JetBrains Mono'", textAlign: 'center' }}>{value}</Text>
    </div>
  );
}

/* Recharts Donut chart with center label */
function DonutChart({ data, title }) {
  const CHART_COLORS = useMemo(getChartColors, []);
  const total = useMemo(() => data.reduce((s, d) => s + d.value, 0), [data]);
  if (total === 0) return <Text type="secondary">—</Text>;

  const chartData = data.map((d, i) => ({
    name: d.label, value: d.value, fill: CHART_COLORS[i % CHART_COLORS.length],
  }));

  return (
    <div style={{ background: 'var(--bg-card)', padding: 12, overflow: 'visible' }}>
      <Text strong style={{
        fontSize: 13, color: 'var(--text-primary)', display: 'block',
        marginBottom: 4, fontWeight: 900,
      }}>{title}</Text>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, justifyContent: 'center' }}>
        {/* Recharts pie */}
        <div className="kpi-pie-box" style={{ width: '100%', margin: '0 auto' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                wrapperStyle={{ zIndex: 100 }}
                contentStyle={{
                  border: '2px solid var(--border-color)', borderRadius: 2,
                  boxShadow: '3px 3px 0 var(--shadow-color)',
                  background: 'var(--bg-card)', fontFamily: "'JetBrains Mono'",
                  fontWeight: 700, fontSize: 12,
                }}
              />
              <Pie data={chartData} dataKey="value" nameKey="name"
                cx="50%" cy="50%"
                innerRadius="35%" outerRadius="65%" strokeWidth={2}
                stroke="var(--border-color)"
              >
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                      return (
                        <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                          <tspan x={viewBox.cx} y={viewBox.cy - 8} style={{ fontSize: 22, fontWeight: 900, fill: 'var(--text-primary)' }}>
                            {total}
                          </tspan>
                          <tspan x={viewBox.cx} y={viewBox.cy + 10} style={{ fontSize: 10, fill: 'var(--text-secondary)' }}>
                            tasks
                          </tspan>
                        </text>
                      );
                    }
                  }}
                />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        {/* Legend */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 100, flex: '1 1 100px' }}>
          {data.map((d, i) => (
            <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <div style={{
                width: 12, height: 12, borderRadius: 2,
                background: CHART_COLORS[i % CHART_COLORS.length],
                border: '1.5px solid var(--border-color)', flexShrink: 0,
              }} />
              <Text style={{ color: 'var(--text-primary)', fontSize: 12, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.label}</Text>
              <Text strong style={{ color: 'var(--text-primary)', fontSize: 12, flexShrink: 0, marginLeft: 4 }}>{d.value}</Text>
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
      render: (val) => <Text strong style={{ color: 'var(--feedback-color)', fontSize: 13 }}>{kpiMap[val] ?? 0}%</Text> },
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
      {/* Row 1+2: Stats + Charts gom chung 1 khung */}
      <div className="neo-box" style={{
        border: '3px solid var(--border-color)', borderRadius: 2,
        boxShadow: '4px 4px 0px var(--shadow-color)', background: 'var(--bg-card)',
        overflow: 'hidden',
      }}>
        {/* Stats row: 3 equal columns */}
        <div className="kpi-stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderBottom: '2px solid var(--border-color)' }}>
          {[
            { label: t('kpi.total'), value: s.totalTasks, headerBg: 'var(--col-todo-header)' },
            { label: t('kpi.overdue_rate'), value: `${s.overdueCount || 0} (${s.overdueRate || 0}%)`, headerBg: 'var(--danger-bg)' },
            { label: t('kpi.est_days'), value: s.totalEstDays, headerBg: 'var(--col-progress-header)' },
          ].map((card, i, arr) => (
            <div key={card.label} style={{
              borderRight: i < arr.length - 1 ? '2px solid var(--border-color)' : 'none',
            }}>
              <StatCard label={card.label} value={card.value} headerBg={card.headerBg} />
            </div>
          ))}
        </div>

        {/* Charts row: 2 equal columns */}
        <div className="kpi-charts-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', background: 'var(--bg-secondary)' }}>
          <div style={{ borderRight: '2px solid var(--border-color)' }}>
            <DonutChart data={gameChartData} title={t('kpi.by_game')} />
          </div>
          <div>
            <DonutChart data={projectChartData} title={t('kpi.by_project')} />
          </div>
        </div>
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
            <button className="neo-btn" style={{
              padding: '6px 14px', fontSize: 13, fontWeight: 900,
              color: '#222', background: 'var(--btn-add-bg)',
              display: 'flex', alignItems: 'center', gap: 6,
              whiteSpace: 'nowrap',
            }}>
              <DownloadOutlined style={{ fontSize: 12 }} /> {t('kpi.download_csv')}
            </button>
          </a>
        </div>
        <style>{`
          @media (max-width: 768px) {
            .kpi-grid { grid-template-columns: 1fr !important; }
            .kpi-grid > div { grid-column: span 1 !important; border-right: none !important; border-bottom: 2px solid var(--border-color); }
            .kpi-grid > div:last-child { border-bottom: none !important; }
          }
          .kpi-table .ant-table { background: transparent !important; }
          .kpi-table .ant-table-thead > tr > th { background: var(--bg-header) !important; border-bottom: 2px solid var(--border-color) !important; }
          .kpi-table .ant-table-tbody > tr > td { border-bottom: 2px solid var(--border-color) !important; background: transparent !important; }
          .kpi-table .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
          .kpi-table .ant-table-tbody > tr:hover > td { background: transparent !important; }
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
