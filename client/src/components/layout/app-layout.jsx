import { useState, useRef, useEffect } from 'react';
import { Layout } from 'antd';
import { useNavigate } from 'react-router-dom';
import AppHeader from './app-header.jsx';
import SplashOverlay from '../shared/splash-overlay.jsx';
import OverdueNotification from '../shared/overdue-notification.jsx';
import { useI18n } from '../../i18n/i18n-config';
import { fetchTodayTasks } from '../../api/task-api-client.js';

const { Content } = Layout;

const SIDEBAR_STYLE = {
  width: 68, minWidth: 48,
  background: 'var(--sidebar-bg)',
  borderRight: '3px solid var(--border-color)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  overflow: 'hidden',
};

const SIDEBAR_TEXT = {
  writingMode: 'vertical-rl',
  transform: 'rotate(180deg)',
  color: 'var(--logo-color)',
  fontWeight: 800,
  fontSize: 38,
  letterSpacing: 4,
  whiteSpace: 'nowrap',
  userSelect: 'none',
  WebkitTextStroke: '4px var(--border-color)',
  paintOrder: 'stroke fill',
  textShadow: '3px 3px 0 var(--shadow-color)',
  fontFamily: "JetBrains Mono",
};

export default function AppLayout({ children }) {
  const { lang, t } = useI18n();
  const navigate = useNavigate();
  const sidebarTitle = lang === 'vi' ? 'Nhật ký Hoạ Nô' : 'Artist Log';
  const [splashOpen, setSplashOpen] = useState(false);
  const [splashOrigin, setSplashOrigin] = useState({ x: '50%', y: '50%' });
  const [overdueCount, setOverdueCount] = useState(0);

  useEffect(() => {
    fetchTodayTasks().then(d => setOverdueCount(d.overdue?.length || 0)).catch(() => {});
  }, []);

  /* Calculate marquee duration based on track width — 50px/s constant speed */
  useEffect(() => {
    if (marqueeRef.current) {
      const w = marqueeRef.current.scrollWidth / 2; // half because content is duplicated
      setMarqueeDuration(Math.max(w / 50, 30)); // min 30s
    }
  }, [lang]);

  const wrapperRef = useRef(null);
  const marqueeRef = useRef(null);
  const [marqueeDuration, setMarqueeDuration] = useState(120);
  function openSplash(e) {
    const wrapper = wrapperRef.current || document.querySelector('.app-outer-wrapper');
    if (wrapper) {
      const rect = wrapper.getBoundingClientRect();
      setSplashOrigin({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    } else {
      setSplashOrigin({ x: e.clientX, y: e.clientY });
    }
    setSplashOpen(true);
  }

  return (
    <Layout className="app-outer-layout" style={{
      height: '100vh', overflow: 'hidden',
      backgroundColor: 'var(--bg-outer, #fff)',
      padding: '24px',
      transition: 'background-color 0.3s',
    }}>
      {/* Outer wrapper: flex-row — sidebar left (full height), then header+content column */}
      <div ref={wrapperRef} className="app-outer-wrapper" style={{
        display: 'flex', flexDirection: 'row',
        backgroundColor: 'var(--bg-primary)',
        border: '3px solid var(--border-color)',
        borderRadius: 4,
        boxShadow: '4px 4px 0px var(--shadow-color)',
        overflow: 'hidden',
        position: 'relative',
        height: '100%',
        transition: 'border-color 0.3s',
      }}>
        {/* Purple sidebar — full height, left */}
        <div className="app-sidebar" style={SIDEBAR_STYLE}>
          <span
            style={{ ...SIDEBAR_TEXT, cursor: 'pointer' }}
            onClick={openSplash}
            title="About"
          >
            {sidebarTitle}
          </span>
        </div>

        {/* Right column: header on top, content below, footer at bottom */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <AppHeader onSplashOpen={openSplash} />

          <Content className="app-content" style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            padding: 16, gap: 16, overflowY: 'auto',
            backgroundImage: `linear-gradient(var(--grid-line-color) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line-color) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}>
            {children}
          </Content>

          {/* Fixed marquee footer */}
          <style>{`
            @keyframes marquee-horizontal { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
            .marquee-footer { height: 60px; overflow: hidden; border-top: 4px solid #000; background-color: var(--footer-bg); display: flex; align-items: center; flex-shrink: 0; }
            .marquee-track { display: flex; flex-direction: row; width: max-content; }
            .marquee-item { height: 60px; display: flex; align-items: center; font-weight: 700; font-size: 18px; color: var(--text-primary); letter-spacing: 3px; white-space: nowrap; font-family: 'JetBrains Mono'; padding: 0 32px; }
          `}</style>
          <div className="marquee-footer">
            <div ref={marqueeRef} className="marquee-track" style={{ animation: `marquee-horizontal ${marqueeDuration}s linear infinite` }}>
              {Array.from({ length: 20 }, (_, i) => {
                const parts = (t('footer.marquee') || '').split('•').map(s => s.trim()).filter(Boolean);
                return (
                  <span key={i} className="marquee-item">
                    {parts.map((word, j) => (
                      <span key={j}>
                        <span style={{ color: 'var(--text-primary)' }}>{word}</span>
                        {j < parts.length - 1 && <span style={{ color: 'var(--text-primary)', margin: '0 8px' }}>•</span>}
                      </span>
                    ))}
                    <span style={{ color: 'var(--text-primary)', margin: '0 8px' }}>•</span>
                  </span>
                );
              })}
            </div>
          </div>
        </div>
        <SplashOverlay open={splashOpen} onClose={() => setSplashOpen(false)} clickOrigin={splashOrigin} />
        <OverdueNotification overdueCount={overdueCount} onNavigate={() => navigate('/')} />
      </div>
    </Layout>
  );
}
