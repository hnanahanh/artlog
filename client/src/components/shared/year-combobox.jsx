import { useState, useRef, useEffect } from 'react';
import dayjs from 'dayjs';

const YEARS = Array.from({ length: 10 }, (_, i) => dayjs().year() - 5 + i);

/** Year picker — plain button + dropdown, style matches NeoRangePicker trigger */
export default function YearCombobox({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const triggerStyle = {
    padding: '3px 8px', fontSize: 13, fontWeight: 600,
    fontFamily: "'Google Sans Code', monospace",
    border: '2px solid var(--border-color)', borderRadius: 2,
    background: 'var(--bg-card)', color: 'var(--text-primary)',
    cursor: 'pointer', whiteSpace: 'nowrap',
    boxShadow: open ? '0 0 0' : '2px 2px 0 var(--shadow-color)',
    transform: open ? 'translate(2px,2px)' : 'none',
    transition: 'all 0.1s',
  };

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button style={triggerStyle} onClick={() => setOpen(o => !o)}>
        {value} ▾
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0,
          border: '2px solid var(--border-color)', borderRadius: 2,
          boxShadow: '4px 4px 0 var(--shadow-color)',
          background: 'var(--bg-card)', zIndex: 1050,
          minWidth: 80, overflow: 'hidden',
        }}>
          {YEARS.map(y => (
            <div
              key={y}
              onClick={() => { onChange(y); setOpen(false); }}
              style={{
                padding: '5px 12px', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: "'Google Sans Code', monospace",
                background: y === value ? 'var(--accent-color)' : 'transparent',
                color: y === value ? '#fff' : 'var(--text-primary)',
                borderBottom: '1px solid var(--border-color)',
              }}
              onMouseEnter={e => { if (y !== value) e.currentTarget.style.background = 'var(--bg-secondary)'; }}
              onMouseLeave={e => { if (y !== value) e.currentTarget.style.background = 'transparent'; }}
            >
              {y}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
