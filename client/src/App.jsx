import { useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import { I18nProvider } from './i18n/i18n-config.jsx';
import { ThemeProvider } from './theme/theme-context.jsx';
import AppLayout from './components/layout/app-layout.jsx';
import DashboardPage from './pages/dashboard-page.jsx';
import KpiPage from './pages/kpi-page.jsx';

export default function App() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleTasksCreated = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

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
          <BrowserRouter>
            <AppLayout>
              <Routes>
                <Route path="/" element={<DashboardPage refreshKey={refreshKey} onTasksCreated={handleTasksCreated} />} />
                <Route path="/kpi" element={<KpiPage />} />
              </Routes>
            </AppLayout>
          </BrowserRouter>
        </I18nProvider>
        </ThemeProvider>
      </AntApp>
    </ConfigProvider>
  );
}