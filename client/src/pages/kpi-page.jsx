import { useEffect, useState, useCallback } from 'react';
import { Typography, Empty, Flex } from 'antd';
import NeoRangePicker from '../components/shared/neo-range-picker.jsx';
import YearCombobox from '../components/shared/year-combobox.jsx';
import dayjs from 'dayjs';
import { fetchKPI } from '../api/task-api-client.js';
import { useI18n } from '../i18n/i18n-config.jsx';
import KpiDashboard from '../components/kpi/kpi-dashboard.jsx';
import AppHeader from '../components/layout/app-header.jsx';


export default function KpiPage() {
  const { t } = useI18n();
  const [mode, setMode] = useState('year'); // 'year' | 'range'
  const [year, setYear] = useState(dayjs());
  const [range, setRange] = useState([dayjs().startOf('month'), dayjs()]);
  const [data, setData] = useState(null);

  const load = useCallback((from, to) => {
    fetchKPI(from.format('YYYY-MM-DD'), to.format('YYYY-MM-DD'))
      .then(setData).catch(console.error);
  }, []);

  const handleYearChange = (val) => {
    if (!val) return;
    setYear(val);
    const start = val.startOf('year');
    const end = val.year() === dayjs().year() ? dayjs() : val.endOf('year');
    setRange([start, end]);
  };

  const handleModeSwitch = (m) => {
    setMode(m);
    if (m === 'year') {
      // Reset to full year of current selected year
      handleYearChange(year);
    }
  };

  useEffect(() => {
    if (range?.[0] && range?.[1]) load(range[0], range[1]);
  }, [range, load]);

  return (
    <div>
      <div style={{ padding: 20 }}>
        <Flex align="center" justify="space-between" gap={12} wrap="wrap" style={{ marginBottom: 20 }}>
          <Flex gap={8} style={{ flexShrink: 0 }}>
            <YearCombobox
              value={year.year()}
              onChange={val => { handleModeSwitch('year'); handleYearChange(dayjs().year(val)); }}
              active={mode === 'year'}
              label="Theo năm"
            />
            <NeoRangePicker
              value={range}
              onChange={val => { handleModeSwitch('range'); setRange(val); }}
              active={mode === 'range'}
              label="Theo ngày"
            />
          </Flex>
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
