import { Layout } from 'antd';
import { useLocation } from 'react-router-dom';
import AppHeader from './app-header.jsx';
import QuickMagicInput from '../smart-input/quick-magic-input.jsx';

const { Content } = Layout;

export default function AppLayout({ children, onTasksCreated }) {
  const { pathname } = useLocation();
  const showSidebar = pathname === '/';

  return (
    <Layout style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg-primary)',
      padding: '24px',
      transition: 'background-color 0.3s',
    }}>
      <div style={{
        border: '3px solid var(--border-color)',
        borderRadius: '8px',
        backgroundColor: 'var(--bg-primary)',
        backgroundImage: `linear-gradient(var(--grid-line-color) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line-color) 1px, transparent 1px)`,
        backgroundSize: '20px 20px',
        padding: '20px',
        minHeight: 'calc(100vh - 48px)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'background-color 0.3s, border-color 0.3s',
      }}>
        <AppHeader />

        <div style={{
          marginTop: '20px',
          display: 'flex',
          gap: '20px',
          flex: 1,
          position: 'relative',
          zIndex: 2,
        }}>
          {showSidebar && (
            <div style={{ flex: 1, minWidth: 240, maxWidth: 320 }}>
              <div style={{ position: 'sticky', top: 20 }}>
                <QuickMagicInput onTasksCreated={onTasksCreated} />
              </div>
            </div>
          )}

          <Content style={{ flex: 2, minWidth: 0 }}>
            {children}
          </Content>
        </div>
      </div>
    </Layout>
  );
}
