import { useState } from 'react';
import { Tooltip } from 'antd';
import { SettingOutlined, SunOutlined, MoonOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useI18n } from '../../i18n/i18n-config';
import { useTheme } from '../../theme/theme-context';
import SettingsModal from '../settings/settings-modal.jsx';

const HEADER_HEIGHT = 48;

const BTN_BASE = {
  height: HEADER_HEIGHT,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  borderRight: '3px solid var(--border-color)',
  flex: '0 0 auto',
  cursor: 'pointer', userSelect: 'none',
  color: 'var(--text-primary)',
  transition: 'background-color 0.15s',
  fontFamily: "Google Sans Code",
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
        display: 'flex', justifyContent: 'flex-start', gap: 0,
        background: 'var(--bg-header)',
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
                background: isActive ? 'var(--accent-color)' : 'transparent',
                color: isActive ? '#222' : 'var(--text-primary)',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg-secondary)'; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
            >
              {item.label}
            </div>
          );
        })}

        {/* Action buttons */}
        <Tooltip title={lang === 'vi' ? 'English' : 'Tiếng Việt'}>
          <div className="action-btn" onClick={toggleLang} style={ACTION_BTN}>
            <span style={{ fontWeight: 800, fontSize: 14 }}>{lang.toUpperCase()}</span>
          </div>
        </Tooltip>

        <Tooltip title={t('nav.settings')}>
          <div className="action-btn" onClick={() => setSettingsOpen(true)} style={ACTION_BTN}>
            <SettingOutlined style={{ fontSize: 18 }} />
          </div>
        </Tooltip>

        <Tooltip title={isDark ? t('nav.light_mode') : t('nav.dark_mode')}>
          <div className="action-btn" onClick={toggleTheme} style={{ ...ACTION_BTN, borderRight: 'none' }}>
            {isDark
              ? <SunOutlined style={{ fontSize: 18 }} />
              : <MoonOutlined style={{ fontSize: 18 }} />}
          </div>
        </Tooltip>
      </div>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
