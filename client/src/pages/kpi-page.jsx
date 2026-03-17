import { useEffect, useState, useCallback } from 'react';
import { DatePicker, Typography, Empty, Flex } from 'antd';
import { BarChartOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { fetchKPI } from '../api/task-api-client.js';
import { useI18n } from '../i18n/i18n-config.jsx';
import KpiDashboard from '../components/kpi/kpi-dashboard.jsx';

const { Title } = Typography;

export default function KpiPage() {
  const { t } = useI18n();
  const [range, setRange] = useState([dayjs().startOf('month'), dayjs()]);
  const [data, setData] = useState(null);

  const load = useCallback((from, to) => {
    fetchKPI(from.format('YYYY-MM-DD'), to.format('YYYY-MM-DD'))
      .then(setData).catch(console.error);
  }, []);

  /* Auto-load when date range changes */
  useEffect(() => {
    if (range?.[0] && range?.[1]) load(range[0], range[1]);
  }, [range, load]);

  return (
    <div>
      <Flex align="center" gap={12} style={{ marginBottom: 20 }}>
        <Title level={4} style={{ margin: 0, color: 'var(--text-primary)' }}>
          <BarChartOutlined /> {t('kpi.title')}
        </Title>
        <DatePicker.RangePicker value={range} onChange={setRange} />
      </Flex>

      {data ? (
        <KpiDashboard data={data}
          from={range[0].format('YYYY-MM-DD')} to={range[1].format('YYYY-MM-DD')} />
      ) : (
        <Empty description={t('kpi.title')} />
      )}
    </div>
  );
}
