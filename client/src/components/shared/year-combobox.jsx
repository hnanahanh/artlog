import { useState, useRef, useEffect } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';

/* Trigger button style matching NeoRangePicker */
const triggerStyle = (open) => ({
  padding: '3px 8px', fontSize: 13, fontWeight: 600,
  fontFamily: "'Google Sans Code', monospace",
  border: '2px solid var(--border-color)',
  borderRadius: 2, background: 'var(--bg-card)',
  color: 'var(--text-primary)',
  cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4,
  boxShadow: open ? '0 0 0' : '2px 2px 0 var(--shadow-color)',
  transform: open ? 'translate(2px,2px)' : 'none',
  transition: 'all 0.1s',
});

const dropdownStyle = {
  position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 1000,
  background: 'var(--bg-card)', border: '2px solid var(--border-color)',
  borderRadius: 2, boxShadow: '4px 4px 0 var(--shadow-color)',
  minWidth: 110, overflow: 'hidden',
};

/**
 * YearCombobox — year selector matching NeoRangePicker style
 * value: number (year)
 * onChange: (year: number) => void
 * range: years back/forward from current (default 3)
 */
export default function YearCombobox({ value, onChange, range = 3 }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: range * 2 }, (_, i) => currentYear - range + 1 + i);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button style={triggerStyle(open)} onClick={() => setOpen(o => !o)}>
        {value ?? 'Năm...'}
        <ChevronsUpDown size={14} style={{ opacity: 0.5 }} />
      </button>

      {open && (
        <div style={dropdownStyle}>
          {years.map(y => (
            <div
              key={y}
              onClick={() => { onChange?.(y); setOpen(false); }}
              style={{
                padding: '6px 10px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                fontFamily: "'Google Sans Code', monospace",
                borderBottom: '1px solid var(--border-color)',
                background: y === value ? 'var(--bg-secondary)' : 'transparent',
                color: 'var(--text-primary)',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
              onMouseLeave={e => e.currentTarget.style.background = y === value ? 'var(--bg-secondary)' : 'transparent'}
            >
              {y}
              {y === value && <Check size={12} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
