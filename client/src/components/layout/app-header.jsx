import { useState, useRef, useEffect } from 'react';
import { SettingOutlined, SunOutlined, MoonOutlined, DownOutlined } from '@ant-design/icons';
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

/* Neo-brutalism logo box */
const LOGO_STYLE = {
  width: 40, height: 40,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'var(--accent-color)',
  border: '3px solid var(--border-color)',
  flexShrink: 0, overflow: 'visible',
  margin: '4px 0 4px 4px',
  borderRadius: 2,
  cursor: 'pointer',
};
/* Logo letter style — Courier Prime Bold Italic, yellow, 2-layer stroke */
const LOGO_LETTER = {
  fontFamily: "'Courier Prime', monospace",
  fontWeight: 700,
  fontStyle: 'italic',
  fontSize: 36,
  color: 'var(--logo-color)',
  display: 'inline-block',
  lineHeight: 1,
  position: 'relative',
  zIndex: 1,
};

export default function AppHeader({ onSplashOpen }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, lang, toggleLang } = useI18n();
  const { isDark, toggleTheme } = useTheme();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const dropdownRef = useRef(null);

  const navItems = [
    { key: '/', label: t('nav.home') },
    { key: '/kpi', label: t('nav.kpi') },
  ];

  const activeNav = navItems.find(n => n.key === location.pathname) || navItems[0];

  /* Close dropdown on outside click */
  useEffect(() => {
    if (!mobileNavOpen) return;
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setMobileNavOpen(false);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('touchstart', handler); };
  }, [mobileNavOpen]);

  return (
    <>
      <div className="app-header-bar" style={{
        display: 'flex', justifyContent: 'flex-start', alignItems: 'stretch', gap: 0,
        background: 'var(--bg-app-header)',
        height: HEADER_HEIGHT,
        borderBottom: '3px solid var(--border-color)',
      }}>
        {/* Mobile: Logo "A" + dropdown nav */}
        <div className="mobile-nav-wrapper mobile-only" ref={dropdownRef} style={{ display: 'none', alignItems: 'center', flex: '1 1 0', position: 'relative' }}>
          {/* Logo with right border — shake on letter hover only */}
          <div
            style={{ ...LOGO_STYLE, borderRight: '3px solid var(--border-color)', borderRadius: 0, margin: 0, width: HEADER_HEIGHT, height: '100%', flexShrink: 0 }}
            onClick={onSplashOpen}
          >
            <span className="neo-logo-letter" data-letter="A" style={LOGO_LETTER}>A</span>
          </div>
          {/* Current page name + dropdown trigger with right border */}
          <div
            onClick={() => setMobileNavOpen(v => !v)}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              cursor: 'pointer', fontFamily: "'JetBrains Mono'", fontWeight: 900, fontSize: 14,
              color: 'var(--text-primary)', userSelect: 'none', height: '100%',
              borderRight: '3px solid var(--border-color)',
            }}
          >
            {activeNav.label}
            <DownOutlined style={{ fontSize: 10, transition: 'transform 0.2s', transform: mobileNavOpen ? 'rotate(180deg)' : 'none' }} />
          </div>
          {/* Dropdown menu — accordion-like slide */}
          <div className="mobile-nav-dropdown" style={{
            position: 'absolute', top: '100%', left: HEADER_HEIGHT, right: 0, zIndex: 50,
            border: '3px solid var(--border-color)', borderTop: 'none',
            boxShadow: '4px 4px 0 var(--shadow-color)',
            background: 'var(--bg-card)',
            overflow: 'hidden',
            maxHeight: mobileNavOpen ? 200 : 0,
            opacity: mobileNavOpen ? 1 : 0,
            transition: 'max-height 0.25s ease, opacity 0.2s ease',
            pointerEvents: mobileNavOpen ? 'auto' : 'none',
            borderWidth: mobileNavOpen ? 3 : 0,
          }}>
              {navItems.map(item => {
                const isActive = location.pathname === item.key;
                return (
                  <div
                    key={item.key}
                    onClick={() => { navigate(item.key); setMobileNavOpen(false); }}
                    style={{
                      padding: '10px 16px',
                      fontFamily: "'JetBrains Mono'", fontWeight: 900, fontSize: 14,
                      cursor: 'pointer',
                      background: isActive ? 'var(--nav-active-bg)' : 'transparent',
                      color: isActive ? 'var(--nav-active-text)' : 'var(--text-primary)',
                      borderBottom: '2px solid var(--border-color)',
                    }}
                  >
                    {item.label}
                  </div>
                );
              })}
            </div>
        </div>

        {/* Desktop: Nav buttons */}
        {navItems.map((item) => {
          const isActive = location.pathname === item.key;
          return (
            <div
              key={item.key}
              className="nav-btn desktop-only"
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

        {/* Lang & theme buttons — desktop only */}
        <div className="action-btn desktop-only" onClick={toggleLang} style={ACTION_BTN} title={lang === 'vi' ? 'English' : 'Tiếng Việt'}>
          <span style={{ fontSize: 13, fontWeight: 900 }}>{lang === 'vi' ? 'VI' : 'EN'}</span>
        </div>
        <div className="action-btn desktop-only" onClick={toggleTheme} style={ACTION_BTN} title={isDark ? 'Light Mode' : 'Dark Mode'}>
          {isDark ? <SunOutlined style={{ fontSize: 18 }} /> : <MoonOutlined style={{ fontSize: 18 }} />}
        </div>

        {/* Settings button */}
        <div className="action-btn" onClick={() => setSettingsOpen(true)} style={{ ...ACTION_BTN, borderRight: 'none' }} title={t('nav.settings')}>
          <SettingOutlined style={{ fontSize: 18 }} />
        </div>
      </div>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)}
        lang={lang} toggleLang={toggleLang} isDark={isDark} toggleTheme={toggleTheme} />
    </>
  );
}
