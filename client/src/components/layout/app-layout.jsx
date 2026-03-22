import { Layout } from 'antd';
import AppHeader from './app-header.jsx';
import { useI18n } from '../../i18n/i18n-config';

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
  color: '#222',
  fontWeight: 800,
  fontSize: 38,
  letterSpacing: 4,
  whiteSpace: 'nowrap',
  userSelect: 'none',
  fontFamily: "JetBrains Mono",
};

export default function AppLayout({ children }) {
  const { lang, t } = useI18n();
  const sidebarTitle = lang === 'vi' ? 'Nhật ký Hoạ Nô' : 'Artist Log';

  return (
    <Layout className="app-outer-layout" style={{
      height: '100vh', overflow: 'hidden',
      backgroundColor: 'var(--bg-outer, #fff)',
      padding: '24px',
      transition: 'background-color 0.3s',
    }}>
      {/* Outer wrapper: flex-row — sidebar left (full height), then header+content column */}
      <div className="app-outer-wrapper" style={{
        display: 'flex', flexDirection: 'row',
        backgroundColor: 'var(--bg-primary)',
        border: '3px solid var(--border-color)',
        borderRadius: 4,
        boxShadow: '4px 4px 0px var(--shadow-color)',
        overflow: 'hidden',
        height: '100%',
        transition: 'border-color 0.3s',
      }}>
        {/* Purple sidebar — full height, left */}
        <div className="app-sidebar" style={SIDEBAR_STYLE}>
          <span style={SIDEBAR_TEXT}>{sidebarTitle}</span>
        </div>

        {/* Right column: header on top, content below, footer at bottom */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <AppHeader />

          <Content className="app-content" style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            padding: 16, gap: 16, overflowY: 'auto',
            backgroundImage: `linear-gradient(var(--grid-line-color) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line-color) 1px, transparent 1px)`,
            backgroundSize: '20px 20px',
          }}>
            {children}
          </Content>

          {/* Fixed marquee footer */}
          <style>{`
            @keyframes marquee-horizontal { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
            .marquee-footer { height: 60px; overflow: hidden; border-top: 4px solid #000; background color: #869f79; display: flex; align-items: center; flex-shrink: 0; }
            .marquee-track { display: flex; flex-direction: row; width: max-content; animation: marquee-horizontal 60s linear infinite; }
            .marquee-item { height: 60px; display: flex; align-items: center; font-weight: 900; font-size: 18px; text-transform: uppercase; color: var(--text-primary); letter-spacing: 3px; white-space: nowrap; font-family: 'JetBrains Mono'; padding: 0 32px; }
          `}</style>
          <div className="marquee-footer">
            <div className="marquee-track">
              {Array.from({ length: 20 }, (_, i) => (
                <span key={i} className="marquee-item">{t('footer.marquee')}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
