import { useState } from 'react';
import { Tooltip } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useI18n } from '../../i18n/i18n-config';
import { useTheme } from '../../theme/theme-context';
import SettingsModal from '../settings/settings-modal.jsx';

const HEADER_HEIGHT = 48;

const BTN_BASE = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  borderRight: '3px solid var(--border-color)',
  flex: '0 0 auto',
  cursor: 'pointer', userSelect: 'none',
  color: 'var(--text-primary)',
  transition: 'background-color 0.15s',
  fontFamily: "JetBrains Mono",
  boxSizing: 'border-box',
};

const NAV_BTN = {
  ...BTN_BASE,
  padding: '0 24px',
  fontWeight: 900, fontSize: 16,
  whiteSpace: 'nowrap',
};

const ACTION_BTN = {
  ...BTN_BASE,
  width: HEADER_HEIGHT, minWidth: HEADER_HEIGHT,
  height: '100%',
};

export default function AppHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, lang, toggleLang } = useI18n();
  const { isDark, toggleTheme } = useTheme();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const navItems = [
    { key: '/', label: t('nav.home') },
    { key: '/kpi', label: t('nav.kpi') },
  ];

  return (
    <>
      <div className="app-header-bar" style={{
        display: 'flex', justifyContent: 'flex-start', alignItems: 'stretch', gap: 0,
        background: 'var(--bg-app-header)',
        minHeight: HEADER_HEIGHT,
        borderBottom: '3px solid var(--border-color)',
      }}>
        {/* Nav items — flex:1 on last nav item pushes actions right */}
        {navItems.map((item) => {
          const isActive = location.pathname === item.key;
          return (
            <div
              key={item.key}
              className="nav-btn"
              onClick={() => navigate(item.key)}
              style={{
                ...NAV_BTN,
                flex: '1 1 0',
                justifyContent: 'center',
                background: isActive ? 'var(--nav-active-bg)' : 'transparent',
                color: isActive ? 'var(--nav-active-text)' : 'var(--text-primary)',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg-secondary)'; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
            >
              {item.label}
            </div>
          );
        })}

        {/* Settings button only — lang & theme moved to settings modal */}
        <Tooltip title={t('nav.settings')}>
          <div className="action-btn" onClick={() => setSettingsOpen(true)} style={{ ...ACTION_BTN, borderRight: 'none' }}>
            <SettingOutlined style={{ fontSize: 18 }} />
          </div>
        </Tooltip>
      </div>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)}
        lang={lang} toggleLang={toggleLang} isDark={isDark} toggleTheme={toggleTheme} />
    </>
  );
}
