import { useEffect, useState } from 'react';
import { Button, Flex, Typography } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { fetchCalendarTasks } from '../api/task-api-client.js';
import { useI18n } from '../i18n/i18n-config.jsx';
import CalendarMonthGrid from '../components/calendar/calendar-month-grid.jsx';

const { Title } = Typography;

export default function CalendarPage({ refreshKey }) {
  const { t } = useI18n();
  const [current, setCurrent] = useState(dayjs());
  const [tasks, setTasks] = useState([]);

  const year = current.year();
  const month = current.month() + 1; // 1-based

  useEffect(() => {
    // Fetch tasks covering the full grid (may include prev/next month padding days)
    const from = current.startOf('month').startOf('week').format('YYYY-MM-DD');
    const to = current.endOf('month').endOf('week').format('YYYY-MM-DD');
    fetchCalendarTasks(from, to).then(r => setTasks(r.tasks || r)).catch(console.error);
  }, [year, month, refreshKey]);

  const goToday = () => setCurrent(dayjs());

  const titleBar = (
    <Flex align="center" justify="space-between">
      <Title level={5} style={{ margin: 0 }}>
        {t('calendar.month_format').replace('{month}', month).replace('{year}', year)}
      </Title>
      <Flex gap={8}>
        <Button icon={<LeftOutlined />} size="small" onClick={() => setCurrent(c => c.subtract(1, 'month'))} />
        <Button size="small" onClick={goToday}>{t('calendar.today')}</Button>
        <Button icon={<RightOutlined />} size="small" onClick={() => setCurrent(c => c.add(1, 'month'))} />
      </Flex>
    </Flex>
  );

  return (
    <div>
      <CalendarMonthGrid year={year} month={month} tasks={tasks} navBar={titleBar} />
    </div>
  );
}
