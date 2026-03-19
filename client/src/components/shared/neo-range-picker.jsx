import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { DayPicker } from 'react-day-picker';
import dayjs from 'dayjs';
import 'react-day-picker/dist/style.css';

/* Neo-brutalism styles for react-day-picker */
const NEO_CSS = `
.neo-rdp .rdp-root { --rdp-accent-color: var(--accent-color, #ff6b35); --rdp-accent-background-color: rgba(255,107,53,0.15); position: relative; }
.neo-rdp { background: var(--bg-card); font-family: 'Google Sans Code', monospace; }

/* 2 months side by side */
.neo-rdp .rdp-months { display: flex; flex-direction: row; gap: 0; }
.neo-rdp .rdp-month { flex: 1; }
.neo-rdp .rdp-month + .rdp-month { border-left: 2px solid var(--border-color); }

/* Nav: left arrow far-left, right arrow far-right, spanning both months */
.neo-rdp .rdp-nav { position: absolute; top: 8px; left: 8px; right: 8px; display: flex; justify-content: space-between; pointer-events: none; z-index: 2; }
.neo-rdp .rdp-button_previous, .neo-rdp .rdp-button_next { pointer-events: all; border: 2px solid var(--border-color) !important; border-radius: 2px !important; background: var(--bg-card) !important; width: 28px; height: 28px; font-weight: 900; color: var(--text-primary) !important; }
.neo-rdp .rdp-button_previous:hover, .neo-rdp .rdp-button_next:hover { background: var(--bg-secondary) !important; box-shadow: 2px 2px 0 var(--shadow-color) !important; }

/* Caption centered, leave room for arrows */
.neo-rdp .rdp-month_caption { font-weight: 900; font-size: 14px; color: var(--text-primary); padding: 8px 36px; background: var(--bg-header); border-bottom: 2px solid var(--border-color); text-align: center; }
.neo-rdp .rdp-caption_label { display: block; text-align: center; }

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
`;

/**
 * NeoRangePicker — Notion-like date range picker with neo-brutalism style.
 * Uses backdrop overlay for outside-click (no document event listeners).
 * value: [dayjs, dayjs] | null
 * onChange: ([dayjs, dayjs]) => void
 */
export default function NeoRangePicker({ value, onChange, style, placeholder = 'Select range', numberOfMonths = 2 }) {
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState(null);
  const [popupPos, setPopupPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);

  // Ref for always-fresh onChange (avoids stale closure)
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Sync value prop → internal range ONLY when picker is closed
  const openRef = useRef(open);
  openRef.current = open;

  useEffect(() => {
    if (openRef.current) return;
    if (value?.[0] && value?.[1]) {
      setRange({ from: value[0].toDate(), to: value[1].toDate() });
    } else {
      setRange(null);
    }
  }, [value?.[0]?.valueOf(), value?.[1]?.valueOf()]);

  // Sync when picker closes (pick up parent changes that happened while open)
  useEffect(() => {
    if (!open && value?.[0] && value?.[1]) {
      setRange({ from: value[0].toDate(), to: value[1].toDate() });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const openPicker = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPopupPos({ top: rect.bottom + 4, left: rect.left });
    }
    setOpen(prev => !prev);
  }, []);

  // Backdrop click = outside click → confirm partial selection + close
  const handleBackdropClick = useCallback(() => {
    // Read fresh range via setState callback to avoid stale closure
    setRange(currentRange => {
      if (currentRange?.from) {
        const from = currentRange.from;
        const to = currentRange.to ?? from;
        onChangeRef.current?.([dayjs(from), dayjs(to)]);
      }
      return currentRange;
    });
    setOpen(false);
  }, []);

  // DayPicker onSelect (react-day-picker v9 range mode):
  // 1st click → {from: date, to: undefined} → stay open, highlight on button
  // 2nd click → {from: d1, to: d2} → confirm + close
  const handleSelect = useCallback((newRange) => {
    if (!newRange) {
      setRange(null);
      return;
    }
    setRange(newRange);
    if (newRange.from && newRange.to) {
      onChangeRef.current?.([dayjs(newRange.from), dayjs(newRange.to)]);
      setOpen(false);
    }
  }, []);

  // Visual states for trigger button
  const picking = open && range?.from && !range?.to;
  const display = range?.from
    ? range.to
      ? `${dayjs(range.from).format('MM-DD')} → ${dayjs(range.to).format('MM-DD')}`
      : `${dayjs(range.from).format('MM-DD')} → …`
    : placeholder;

  return (
    <div style={{ position: 'relative', display: 'inline-block', ...style }}>
      <style>{NEO_CSS}</style>

      {/* Trigger button */}
      <button
        ref={triggerRef}
        onClick={openPicker}
        type="button"
        style={{
          width: '100%', padding: '3px 8px', fontSize: 13, fontWeight: 600,
          fontFamily: "'Google Sans Code', monospace",
          border: `2px solid ${picking ? '#f0a500' : 'var(--border-color)'}`,
          borderRadius: 2,
          background: picking ? '#fff9e6' : 'var(--bg-card)',
          color: range?.from ? 'var(--text-primary)' : 'var(--text-secondary)',
          cursor: 'pointer', whiteSpace: 'nowrap',
          boxShadow: open ? '0 0 0' : '2px 2px 0 var(--shadow-color)',
          transform: open ? 'translate(2px,2px)' : 'none',
          transition: 'all 0.1s',
        }}
      >
        {display}
      </button>

      {/* Portal: backdrop + popup rendered to body (escapes Modal overflow + z-index) */}
      {open && createPortal(
        <>
          {/* Transparent backdrop — catches all outside clicks without event propagation issues */}
          <div
            onClick={handleBackdropClick}
            style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
          />
          {/* Calendar popup */}
          <div
            style={{
              position: 'fixed', zIndex: 9999,
              top: popupPos.top, left: popupPos.left,
              border: '3px solid var(--border-color)', borderRadius: 2,
              boxShadow: '6px 6px 0 var(--shadow-color)',
              background: 'var(--bg-card)', overflow: 'hidden',
            }}
          >
            <DayPicker
              className="neo-rdp"
              mode="range"
              selected={range}
              onSelect={handleSelect}
              numberOfMonths={numberOfMonths}
              pagedNavigation
              defaultMonth={range?.from}
            />
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
