import { useState, useEffect } from 'react';
import { useI18n } from '../../i18n/i18n-config.jsx';

/* SVG skull icon */
const SkullIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="var(--danger-text)" style={{ flexShrink: 0 }}>
    <path d="M12 2C6.48 2 2 6.48 2 12c0 3.04 1.36 5.76 3.5 7.59V22h3v-2h3v2h3v-2h3v2h3v-2.41C20.64 17.76 22 15.04 22 12c0-5.52-4.48-10-10-10zM8.5 14c-.83 0-1.5-.67-1.5-1.5S7.67 11 8.5 11s1.5.67 1.5 1.5S9.33 14 8.5 14zm7 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
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
    if (onNavigate) onNavigate();
  };

  return (
    <div className="overdue-noti" style={{
      position: 'absolute', bottom: 70, right: 4, zIndex: 30,
      transform: expanded ? 'translateX(0)' : 'translateX(calc(100% - 36px))',
      transition: initialized ? 'transform 0.3s ease' : 'none',
      display: 'flex', alignItems: 'stretch',
      fontFamily: "'JetBrains Mono'",
      border: '3px solid var(--border-color)',
      borderRadius: 4,
      boxShadow: '4px 4px 0px var(--shadow-color)',
      background: 'var(--danger-bg)',
      cursor: 'pointer',
      overflow: 'hidden',
    }}>
      {/* Skull tab */}
      <button
        onClick={() => { setExpanded(e => !e); if (expanded) setDismissed(true); }}
        style={{
          width: 36, border: 'none',
          borderRight: expanded ? '2px solid var(--border-color)' : 'none',
          borderRadius: 0,
          background: 'transparent', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, padding: 0, flexShrink: 0,
        }}
      ><SkullIcon /></button>

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
        <div style={{ fontWeight: 900, fontSize: 13, color: 'var(--danger-text)', marginBottom: 4 }}>
          {t('overdue.title')}
        </div>
        <div style={{ fontSize: 12, color: 'var(--danger-text)', opacity: 0.9, textDecoration: 'underline', textUnderlineOffset: 2 }}>
          {(t('overdue.message') || '').replace('{count}', overdueCount)}
        </div>
      </div>
    </div>
  );
}
