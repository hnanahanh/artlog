import { useState, useCallback, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import { I18nProvider } from './i18n/i18n-config.jsx';
import { ThemeProvider } from './theme/theme-context.jsx';
import AppLayout from './components/layout/app-layout.jsx';
import DashboardPage from './pages/dashboard-page.jsx';
import KpiPage from './pages/kpi-page.jsx';
import OverdueNotification from './components/shared/overdue-notification.jsx';
import { fetchTodayTasks } from './api/task-api-client.js';

/* Wrapper to provide useNavigate to OverdueNotification (must be inside BrowserRouter) */
function OverdueNotificationWrapper({ overdueCount }) {
  const navigate = useNavigate();
  return <OverdueNotification overdueCount={overdueCount} onNavigate={() => navigate('/')} />;
}

export default function App() {
  const [refreshKey, setRefreshKey] = useState(0);

  const [overdueCount, setOverdueCount] = useState(0);

  const handleTasksCreated = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  // Fetch overdue count for notification
  useEffect(() => {
    fetchTodayTasks().then(d => setOverdueCount(d.overdue?.length || 0)).catch(() => {});
  }, [refreshKey]);

  return (
    <ConfigProvider theme={{
      token: {
        colorPrimary: '#c47dff',
        borderRadius: 4,
        colorBgContainer: '#fffdf7',
        colorBorder: '#222222',
        colorText: '#222222',
        fontFamily: "'JetBrains Mono', -apple-system, sans-serif",
        boxShadow: '4px 4px 0px #222222',
        controlHeight: 36,
      },
      components: {
        Button: {
          borderWidth: 2,
          controlHeight: 36,
          primaryShadow: '4px 4px 0px #222222',
          defaultShadow: '3px 3px 0px #222222',
          dangerShadow: '3px 3px 0px #222222',
        },
        Menu: {
          itemFontWeight: 700,        
          activeBarHeight: 0,          
          itemSelectedColor: '#7623db',
          horizontalItemSelectedColor: '#7623db',
          backgroundColor: 'transparent',
        },
        Card: {
          borderRadiusLG: 4,
          boxShadowTertiary: '4px 4px 0px #222222',
        },
        Input: {
          borderWidth: 2,
          activeShadow: '0 0 0 2px rgba(255,107,53,0.2)',
        },
        Table: {
          borderColor: '#222222',
        },
      },
    }}>
      <AntApp>
        <ThemeProvider>
        <I18nProvider defaultLang="vi">
          <BrowserRouter basename={import.meta.env.BASE_URL}>
            <AppLayout>
              <Routes>
                <Route path="/" element={<DashboardPage refreshKey={refreshKey} onTasksCreated={handleTasksCreated} />} />
                <Route path="/kpi" element={<KpiPage />} />
              </Routes>
            </AppLayout>
            <OverdueNotificationWrapper overdueCount={overdueCount} />
          </BrowserRouter>
        </I18nProvider>
        </ThemeProvider>
      </AntApp>
    </ConfigProvider>
  );
}