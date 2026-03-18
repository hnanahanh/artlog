import { useEffect, useState, useCallback } from 'react';
import { DatePicker, Typography, Empty, Flex } from 'antd';
import NeoRangePicker from '../components/shared/neo-range-picker.jsx';
import { BarChartOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { fetchKPI } from '../api/task-api-client.js';
import { useI18n } from '../i18n/i18n-config.jsx';
import KpiDashboard from '../components/kpi/kpi-dashboard.jsx';
import AppHeader from '../components/layout/app-header.jsx';

const { Title } = Typography;

export default function KpiPage() {
  const { t } = useI18n();
  const [year, setYear] = useState(dayjs());
  const [range, setRange] = useState([dayjs().startOf('month'), dayjs()]);
  const [data, setData] = useState(null);

  const load = useCallback((from, to) => {
    fetchKPI(from.format('YYYY-MM-DD'), to.format('YYYY-MM-DD'))
      .then(setData).catch(console.error);
  }, []);

  /* When year changes, reset range to full year */
  const handleYearChange = (val) => {
    if (!val) return;
    setYear(val);
    const start = val.startOf('year');
    const end = val.year() === dayjs().year() ? dayjs() : val.endOf('year');
    setRange([start, end]);
  };

  /* Auto-load when date range changes */
  useEffect(() => {
    if (range?.[0] && range?.[1]) load(range[0], range[1]);
  }, [range, load]);

  return (
    <div>
      <div style={{ padding: 20 }}>
        <Flex align="center" gap={12} style={{ marginBottom: 20 }}>
          <Title level={4} style={{ margin: 0, color: 'var(--text-primary)', fontFamily: "'Google Sans Code', monospace" }}>
            <BarChartOutlined /> {t('kpi.title')}
          </Title>
          <DatePicker picker="year" value={year} onChange={handleYearChange}
            style={{ border: '2px solid var(--border-color)', borderRadius: 2 }} />
          <NeoRangePicker value={range} onChange={setRange} />
        </Flex>

        {data ? (
          <KpiDashboard data={data}
            from={range[0].format('YYYY-MM-DD')} to={range[1].format('YYYY-MM-DD')} />
        ) : (
          <Empty description={t('kpi.title')} />
        )}
      </div>
    </div>
  );
}
