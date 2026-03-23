import { useState, useCallback, useMemo } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import { I18nProvider } from './i18n/i18n-config.jsx';
import { ThemeProvider, useTheme } from './theme/theme-context.jsx';
import AppLayout from './components/layout/app-layout.jsx';
import DashboardPage from './pages/dashboard-page.jsx';
import KpiPage from './pages/kpi-page.jsx';

/* Read CSS variable values from computed styles */
function getCssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/* Generate Ant Design theme token from CSS variables */
function useAntTheme() {
  const { isDark } = useTheme();
  return useMemo(() => {
    /* Force re-read after data-theme attribute changes */
    const bg = getCssVar('--bg-card') || (isDark ? '#242424' : '#ffffff');
    const border = getCssVar('--border-color') || (isDark ? '#555555' : '#000000');
    const text = getCssVar('--text-primary') || (isDark ? '#e0e0e0' : '#000000');
    const shadow = getCssVar('--shadow-color') || (isDark ? '#111111' : '#000000');
    const accent = getCssVar('--accent-color') || '#a88bec';
    return {
      token: {
        colorPrimary: accent,
        borderRadius: 4,
        colorBgContainer: bg,
        colorBorder: border,
        colorText: text,
        fontFamily: "'JetBrains Mono', -apple-system, sans-serif",
        boxShadow: `4px 4px 0px ${shadow}`,
        controlHeight: 36,
      },
      components: {
        Button: { borderWidth: 2, controlHeight: 36, primaryShadow: `4px 4px 0px ${shadow}`, defaultShadow: `3px 3px 0px ${shadow}`, dangerShadow: `3px 3px 0px ${shadow}` },
        Menu: { itemFontWeight: 700, activeBarHeight: 0, itemSelectedColor: accent, horizontalItemSelectedColor: accent, backgroundColor: 'transparent' },
        Card: { borderRadiusLG: 4, boxShadowTertiary: `4px 4px 0px ${shadow}` },
        Input: { borderWidth: 2, activeShadow: '0 0 0 2px rgba(168,139,236,0.2)' },
        Table: { borderColor: border },
        Modal: { paddingLG: 0, paddingMD: 0, paddingContentHorizontalLG: 0 },
      },
    };
  }, [isDark]);
}

/* Inner app — reads theme context for ConfigProvider */
function AppInner() {
  const antTheme = useAntTheme();
  const [refreshKey, setRefreshKey] = useState(0);
  const handleTasksCreated = useCallback(() => setRefreshKey(k => k + 1), []);

  return (
    <ConfigProvider theme={antTheme}>
      <AntApp>
        <I18nProvider defaultLang="vi">
          <BrowserRouter basename={import.meta.env.BASE_URL}>
            <AppLayout>
              <Routes>
                <Route path="/" element={<DashboardPage refreshKey={refreshKey} onTasksCreated={handleTasksCreated} />} />
                <Route path="/kpi" element={<KpiPage />} />
              </Routes>
            </AppLayout>
          </BrowserRouter>
        </I18nProvider>
      </AntApp>
    </ConfigProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}