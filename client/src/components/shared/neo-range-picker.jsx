import { useState, useRef, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import dayjs from 'dayjs';
import 'react-day-picker/dist/style.css';

/* Neo-brutalism styles for react-day-picker */
const NEO_CSS = `
.neo-rdp .rdp-root { --rdp-accent-color: var(--accent-color, #ff6b35); --rdp-accent-background-color: rgba(255,107,53,0.15); }
.neo-rdp { background: var(--bg-card); font-family: 'Google Sans Code', monospace; }
.neo-rdp .rdp-month_caption { font-weight: 900; font-size: 14px; color: var(--text-primary); padding: 8px 12px; background: var(--bg-header); border-bottom: 2px solid var(--border-color); }
.neo-rdp .rdp-weekdays { border-bottom: 2px solid var(--border-color); }
.neo-rdp .rdp-weekday { font-weight: 900; font-size: 11px; color: var(--text-secondary); padding: 6px 0; }
.neo-rdp .rdp-day { font-weight: 600; font-size: 12px; color: var(--text-primary); border-radius: 2px !important; }
.neo-rdp .rdp-day_button { border-radius: 2px !important; width: 32px; height: 32px; font-weight: 600; color: var(--text-primary); }
.neo-rdp .rdp-day_button:hover { background: var(--bg-secondary) !important; border: 2px solid var(--border-color) !important; }
.neo-rdp .rdp-selected .rdp-day_button { background: var(--accent-color, #ff6b35) !important; color: #fff !important; border: 2px solid var(--border-color) !important; font-weight: 900; }
.neo-rdp .rdp-range_start .rdp-day_button, .neo-rdp .rdp-range_end .rdp-day_button { background: var(--accent-color, #ff6b35) !important; color: #fff !important; border: 2px solid var(--border-color) !important; font-weight: 900; }
.neo-rdp .rdp-range_middle .rdp-day_button { background: rgba(255,107,53,0.15) !important; border-radius: 0 !important; }
.neo-rdp .rdp-today .rdp-day_button { border: 2px solid var(--border-color) !important; font-weight: 900; }
.neo-rdp .rdp-outside .rdp-day_button { opacity: 0.35; }
.neo-rdp .rdp-nav { gap: 4px; }
.neo-rdp .rdp-button_previous, .neo-rdp .rdp-button_next { border: 2px solid var(--border-color) !important; border-radius: 2px !important; background: var(--bg-card) !important; width: 28px; height: 28px; font-weight: 900; color: var(--text-primary) !important; }
.neo-rdp .rdp-button_previous:hover, .neo-rdp .rdp-button_next:hover { background: var(--bg-secondary) !important; box-shadow: 2px 2px 0 var(--shadow-color) !important; }
`;

/**
 * NeoRangePicker — drop-in replacement for antd DatePicker.RangePicker
 * value: [dayjs, dayjs] | null
 * onChange: ([dayjs, dayjs]) => void
 */
export default function NeoRangePicker({ value, onChange, style, placeholder = 'Select range', numberOfMonths = 2 }) {
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState(null);
  const containerRef = useRef(null);

  // Sync value prop → internal range
  useEffect(() => {
    if (value?.[0] && value?.[1]) {
      setRange({ from: value[0].toDate(), to: value[1].toDate() });
    } else {
      setRange(null);
    }
  }, [value?.[0]?.toString(), value?.[1]?.toString()]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleSelect = (r) => {
    setRange(r);
    if (r?.from && r?.to) {
      onChange?.([dayjs(r.from), dayjs(r.to)]);
      setOpen(false);
    }
  };

  const display = range?.from && range?.to
    ? `${dayjs(range.from).format('MM-DD')} → ${dayjs(range.to).format('MM-DD')}`
    : placeholder;

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block', ...style }}>
      <style>{NEO_CSS}</style>

      {/* Trigger button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', padding: '3px 8px', fontSize: 13, fontWeight: 600,
          fontFamily: "'Google Sans Code', monospace",
          border: '2px solid var(--border-color)',
          borderRadius: 2, background: 'var(--bg-card)',
          color: range ? 'var(--text-primary)' : 'var(--text-secondary)',
          cursor: 'pointer', whiteSpace: 'nowrap',
          boxShadow: open ? '0 0 0' : '2px 2px 0 var(--shadow-color)',
          transform: open ? 'translate(2px,2px)' : 'none',
          transition: 'all 0.1s',
        }}
      >
        📅 {display}
      </button>

      {/* Calendar popup */}
      {open && (
        <div style={{
          position: 'absolute', zIndex: 1050, top: 'calc(100% + 4px)', left: 0,
          border: '3px solid var(--border-color)', borderRadius: 2,
          boxShadow: '6px 6px 0 var(--shadow-color)',
          background: 'var(--bg-card)', overflow: 'hidden',
        }}>
          <DayPicker
            className="neo-rdp"
            mode="range"
            selected={range}
            onSelect={handleSelect}
            numberOfMonths={numberOfMonths}
            defaultMonth={range?.from}
          />
        </div>
      )}
    </div>
  );
}
