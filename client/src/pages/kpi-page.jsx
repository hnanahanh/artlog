import { useEffect, useState, useCallback } from 'react';
import { Typography, Empty, Flex } from 'antd';
import NeoRangePicker from '../components/shared/neo-range-picker.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
          <Select value={year.year().toString()} onValueChange={val => handleYearChange(dayjs().year(parseInt(val)))}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 6 }, (_, i) => dayjs().year() - 3 + i).map(y => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
