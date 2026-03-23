import { useState, useEffect } from 'react';
import { useI18n } from '../../i18n/i18n-config.jsx';

/* Simple skull icon */
const SkullIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <circle cx="9" cy="12" r="1" fill="currentColor"/>
    <circle cx="15" cy="12" r="1" fill="currentColor"/>
    <path d="M8 20v-4a8 8 0 0 1 0-12h8a8 8 0 0 1 0 12v4"/>
    <path d="M12 20v-4"/>
  </svg>
);

/**
 * Bottom-right notification for overdue tasks.
 * Skull tab on edge, click to expand/collapse. Click content → navigate to calendar.
 * Uses portal to render outside layout constraints.
 */
export default function OverdueNotification({ overdueCount = 0, onNavigate }) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (overdueCount <= 0 || dismissed) return;
    const timer = setTimeout(() => { setExpanded(true); setInitialized(true); }, 2000);
    return () => clearTimeout(timer);
  }, [overdueCount, dismissed]);

  if (overdueCount <= 0) return null;

  const handleContentClick = () => {
    setExpanded(false);
    setDismissed(true);
    if (onNavigate) onNavigate();
  };

  return (
    <div className="overdue-noti" style={{
      position: 'absolute', bottom: 70, right: 4, zIndex: 30,
      transform: expanded ? 'translateX(0)' : 'translateX(calc(100% - 36px))',
      transition: initialized ? 'transform 0.3s ease' : 'none',
      display: 'flex', alignItems: 'stretch',
      fontFamily: "'JetBrains Mono'",
      border: '3px solid var(--danger-color)',
      borderRadius: 4,
      boxShadow: '4px 4px 0px var(--danger-color)',
      background: 'var(--overdue-panel-bg)',
      cursor: 'pointer',
      overflow: 'hidden',
    }}>
      {/* Skull tab */}
      <button
        onClick={(e) => { e.stopPropagation(); setExpanded(prev => { if (prev) setDismissed(true); return !prev; }); }}
        style={{
          width: 48, border: 'none',
          borderRight: expanded ? '2px solid var(--danger-color)' : 'none',
          borderRadius: 0,
          background: 'var(--overdue-btn-bg)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 48, padding: 4, flexShrink: 0, color: '#fff',
        }}
      ><SkullIcon size={40} /></button>

      {/* Content panel — click to navigate */}
      <div
        onClick={handleContentClick}
        style={{
          border: 'none', borderRadius: 0,
          background: 'transparent', padding: '10px 14px',
          maxWidth: 280, minWidth: 200,
          cursor: 'pointer',
        }}
      >
        <div style={{ fontWeight: 900, fontSize: 15, color: 'var(--danger-text)', marginBottom: 4 }}>
          {t('overdue.title')}
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--danger-text)' }}>
          {(t('overdue.message') || '').replace('{count}', overdueCount)}
        </div>
      </div>
    </div>
  );
}
