import { Layout, Menu, Button, Space, Typography, Tooltip } from 'antd';
import { SettingOutlined, SunOutlined, MoonOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useI18n } from '../../i18n/i18n-config';
import { useTheme } from '../../theme/theme-context';

const { Title } = Typography;

/* Shared style for 3 square action buttons */
const ACTION_BTN = {
  width: 42, height: 42, minWidth: 42, padding: 0,
  border: '2px solid var(--border-color)',
  boxShadow: '3px 3px 0px var(--shadow-color)',
  fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center',
};

export default function AppHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, lang, toggleLang } = useI18n();
  const { isDark, toggleTheme } = useTheme();

  const menuItems = [
    { key: '/', label: t('nav.home') },
    { key: '/kpi', label: t('nav.kpi') },
  ];

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexWrap: 'wrap', padding: '12px 24px',
      background: 'var(--bg-header)', border: '3px solid var(--border-color)',
      borderRadius: '2px', boxShadow: '4px 4px 0px var(--shadow-color)',
      minHeight: '70px', position: 'relative', zIndex: 100, gap: '12px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0, fontWeight: '600', fontSize: '24px', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>
          🎨 {t('app.title')}
        </Title>
      </div>

      <style>{`
        .ant-menu-item {
          transition: transform 0.2s ease !important;
          font-size: 20px !important; font-weight: 600 !important;
        }
        .ant-menu-item:hover { transform: translateY(-4px); color: var(--text-primary) !important; }
        .ant-menu-item-selected { color: #a855f7 !important; background-color: transparent !important; }
        .ant-menu-horizontal { border-bottom: none !important; line-height: 46px !important; }
        .ant-menu-item::after, .ant-menu-item-selected::after { display: none !important; }
        @media (max-width: 768px) {
          .ant-menu { flex: 1 1 100%; order: 3; justify-content: center; }
          .header-actions { order: 2; }
        }
      `}</style>

      <Menu
        mode="horizontal"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={({ key }) => navigate(key)}
        style={{ flex: 1, border: 'none', backgroundColor: 'transparent', minWidth: '200px' }}
      />

      {/* Global Actions: 3 square buttons */}
      <Space size={8} className="header-actions">
        <Tooltip title={lang === 'vi' ? 'English' : 'Tiếng Việt'}>
          <Button onClick={toggleLang} style={ACTION_BTN}>
            {lang.toUpperCase()}
          </Button>
        </Tooltip>
        <Tooltip title={t('nav.settings')}>
          <Button onClick={() => navigate('/settings')} style={ACTION_BTN} icon={<SettingOutlined style={{ fontSize: 20 }} />} />
        </Tooltip>
        <Tooltip title={isDark ? t('nav.light_mode') : t('nav.dark_mode')}>
          <Button onClick={toggleTheme} style={ACTION_BTN}
            icon={isDark ? <SunOutlined style={{ fontSize: 20 }} /> : <MoonOutlined style={{ fontSize: 20 }} />} />
        </Tooltip>
      </Space>
    </div>
  );
}
