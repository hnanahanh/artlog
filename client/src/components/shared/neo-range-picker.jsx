import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { DayPicker } from 'react-day-picker';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import 'react-day-picker/dist/style.css';

dayjs.extend(customParseFormat);

/* ── Color palette for multi-range (task=0, fb1=1, fb2=2, fb3=3, cycles) ── */
const RANGE_COLORS = [
  { hex: '#ff6b35', bg: 'rgba(255,107,53,0.15)' },
  { hex: '#e9a13d', bg: 'rgba(233,161,61,0.15)' },
  { hex: '#13c2c2', bg: 'rgba(19,194,194,0.15)' },
  { hex: '#eb2f96', bg: 'rgba(235,47,150,0.15)' },
];

/* ── Shared CSS ── */
const NEO_CSS = `
.neo-rdp .rdp-root, .rdp-root.neo-rdp { --rdp-accent-color: var(--accent-color, #ff6b35); --rdp-accent-background-color: rgba(255,107,53,0.15); position: relative; width: 100% !important; max-width: 100% !important; display: block !important; }
.neo-rdp { background: var(--bg-card); font-family: 'JetBrains Mono'; }
.neo-rdp, .neo-rdp .rdp-root { max-width: 100% !important; overflow: hidden !important; }
.neo-rdp .rdp-months, .neo-rdp .rdp-root .rdp-months { display: flex !important; flex-direction: column !important; flex-wrap: nowrap !important; gap: 0 !important; max-height: 300px; overflow-y: auto; overflow-x: hidden; scroll-behavior: smooth; position: relative; width: 100% !important; }
.neo-rdp .rdp-months::-webkit-scrollbar { width: 6px; }
.neo-rdp .rdp-months::-webkit-scrollbar-track { background: var(--bg-secondary); }
.neo-rdp .rdp-months::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 0; }
.neo-rdp .rdp-month { flex-shrink: 0; width: 100% !important; }
.neo-rdp .rdp-month + .rdp-month { border-top: 2px solid var(--border-color); }
.neo-rdp .rdp-nav { position: absolute; top: 0; left: 0; right: 0; display: flex; justify-content: space-between; align-items: center; pointer-events: none; z-index: 2; height: 40px; padding: 0 6px; }
.neo-rdp .rdp-chevron { fill: var(--text-primary); }
.neo-rdp .rdp-button_previous, .neo-rdp .rdp-button_next { pointer-events: all; border: 2px solid var(--border-color) !important; border-radius: 2px !important; background: var(--bg-card) !important; width: 28px; height: 28px; font-weight: 900; color: var(--text-primary) !important; box-shadow: 2px 2px 0 var(--shadow-color); transition: transform 0.1s, box-shadow 0.1s; }
.neo-rdp .rdp-button_previous:hover, .neo-rdp .rdp-button_next:hover { transform: translate(2px, 2px); box-shadow: none !important; }
.neo-rdp .rdp-month_caption { font-weight: 900; font-size: 14px; color: var(--text-primary); padding: 8px 36px; background: var(--bg-header); border-bottom: 2px solid var(--border-color); text-align: center; height: 40px; display: flex; align-items: center; justify-content: center; }
.neo-rdp .rdp-caption_label { display: block; text-align: center; flex: 1; }
.neo-rdp .rdp-weekdays { border-bottom: 2px solid var(--border-color); }
.neo-rdp .rdp-weekday { font-weight: 900; font-size: 11px; color: var(--text-secondary); padding: 6px 0; }
.neo-rdp .rdp-day { font-weight: 600; font-size: 12px; color: var(--text-primary); border-radius: 2px !important; position: relative; }
.neo-rdp .rdp-day_button { border-radius: 2px !important; width: 32px; height: 32px; font-weight: 600; color: var(--text-primary); }
.neo-rdp .rdp-day_button:hover { background: var(--bg-secondary) !important; border: 2px solid var(--border-color) !important; }
.neo-rdp .rdp-today .rdp-day_button { border: 2px solid var(--border-color) !important; font-weight: 900; }
.neo-rdp .rdp-outside .rdp-day_button { opacity: 0.35; }

/* Single-range highlight classes */
.neo-rdp .rdp-range_start .rdp-day_button, .neo-rdp .rdp-range_end .rdp-day_button { background: var(--accent-color, #ff6b35) !important; color: #fff !important; border: 2px solid var(--border-color) !important; font-weight: 900; }
.neo-rdp .rdp-range_middle .rdp-day_button { background: rgba(255,107,53,0.15) !important; border-radius: 0 !important; }
.neo-rdp .rdp-selected .rdp-day_button { background: var(--accent-color, #ff6b35) !important; color: #fff !important; border: 2px solid var(--border-color) !important; font-weight: 900; }

/* Multi-range highlight classes (r0=task orange, r1=fb purple, r2=fb teal, r3=fb pink) */
${RANGE_COLORS.map((c, i) => `
.neo-rdp .rdp-r${i}s .rdp-day_button, .neo-rdp .rdp-r${i}e .rdp-day_button { background: ${c.hex} !important; color: #fff !important; border: 2px solid var(--border-color) !important; font-weight: 900; }
.neo-rdp .rdp-r${i}m .rdp-day_button { background: ${c.bg} !important; border-radius: 0 !important; }
`).join('')}

/* Header */
.neo-rdp-header { display: flex; flex-direction: column; gap: 6px; padding: 8px 10px; border-bottom: 2px solid var(--border-color); max-height: 120px; overflow-y: auto; overflow-x: hidden; box-sizing: border-box; width: 100%; }
.neo-rdp-header::-webkit-scrollbar { width: 6px; }
.neo-rdp-header::-webkit-scrollbar-track { background: var(--bg-secondary); border-left: 2px solid var(--border-color); }
.neo-rdp-header::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 0; }
.neo-rdp-row { display: flex; align-items: center; gap: 8px; }
.neo-rdp-field { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.neo-rdp-field label { font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-secondary); }
.neo-rdp-field input {
  width: 100%; padding: 4px 6px; font-size: 12px; font-weight: 600;
  font-family: 'JetBrains Mono';
  border: 2px solid var(--border-color); border-radius: 2px;
  background: var(--bg-card); color: var(--text-primary);
  outline: none; transition: all 0.15s;
}
.neo-rdp-field input:focus { border-color: var(--accent-color, #ff6b35); }
.neo-rdp-field--active input { border-color: var(--accent-color, #ff6b35) !important; background: rgba(255,107,53,0.08) !important; font-weight: 900; }
.neo-rdp-toggle { display: flex; align-items: center; gap: 4px; cursor: pointer; white-space: nowrap; }
.neo-rdp-toggle input[type="checkbox"] { accent-color: var(--accent-color, #ff6b35); width: 14px; height: 14px; cursor: pointer; }
.neo-rdp-toggle span { font-size: 10px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.3px; }

/* Multi-range row */
.neo-rdp-range-row { display: flex; align-items: center; gap: 6px; padding: 4px 6px; border: 2px solid transparent; border-radius: 2px; cursor: pointer; transition: all 0.15s; }
.neo-rdp-range-row:hover { background: var(--bg-secondary); }
.neo-rdp-range-row--active { border-color: var(--border-color); background: var(--bg-secondary); }
.neo-rdp-dot { width: 10px; height: 10px; border-radius: 2px; border: 2px solid var(--border-color); flex-shrink: 0; }
.neo-rdp-range-label { font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.3px; color: var(--text-secondary); width: 36px; flex-shrink: 0; }
.neo-rdp-range-dates { display: flex; align-items: center; gap: 4px; flex: 1; }
.neo-rdp-range-dates input {
  width: 82px; padding: 2px 4px; font-size: 11px; font-weight: 600;
  font-family: 'JetBrains Mono';
  border: 2px solid var(--border-color); border-radius: 2px;
  background: var(--bg-card); color: var(--text-primary);
  outline: none; transition: all 0.15s;
}
.neo-rdp-range-dates input:focus { border-color: currentColor; }
.neo-rdp-range-dates .neo-rdp-arrow { font-size: 11px; font-weight: 900; color: var(--text-secondary); }
`;

const DATE_FMT = 'YYYY-MM-DD';
const DISPLAY_FMT = 'MM/DD/YYYY';
const INPUT_FORMATS = ['MM/DD/YYYY', 'YYYY-MM-DD', 'M/D/YYYY', 'MM-DD-YYYY'];

/** Parse user-typed date string into a Date, or null if invalid */
function parseInput(str) {
  if (!str?.trim()) return null;
  const d = dayjs(str.trim(), INPUT_FORMATS, true);
  return d.isValid() ? d.toDate() : null;
}

/** Generate middle dates between start and end (exclusive) */
function getMiddleDates(start, end) {
  const mid = [];
  let cur = dayjs(start).add(1, 'day');
  const endDay = dayjs(end);
  while (cur.isBefore(endDay, 'day')) {
    mid.push(cur.toDate());
    cur = cur.add(1, 'day');
  }
  return mid;
}

/** Find which range index contains a given day, or -1 */
function detectRange(day, rangesState, activeIdx) {
  const d = dayjs(day);
  // Prefer active range if it contains the day
  const ar = rangesState[activeIdx];
  if (ar?.start && ar?.end && !d.isBefore(dayjs(ar.start), 'day') && !d.isAfter(dayjs(ar.end), 'day')) {
    return activeIdx;
  }
  for (let i = 0; i < rangesState.length; i++) {
    const r = rangesState[i];
    if (r.start && r.end && !d.isBefore(dayjs(r.start), 'day') && !d.isAfter(dayjs(r.end), 'day')) {
      return i;
    }
  }
  return -1;
}

/**
 * NeoRangePicker — Notion-like date picker with neo-brutalism style.
 *
 * Single-range mode: value/onChange (backward compat)
 * Multi-range mode: ranges/onRangeChange (task + feedbacks on one calendar)
 */
export default function NeoRangePicker({
  value, onChange, ranges, onRangeChange,
  style, placeholder = 'Select date', numberOfMonths = 2,
  active = false, label,
}) {
  const isMultiRange = !!ranges?.length;
  const [open, setOpen] = useState(false);
  const [popupPos, setPopupPos] = useState({ top: 0, left: 0 });
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const popupRef = useRef(null);
  const openRef = useRef(open);
  openRef.current = open;

  /* ════════════════════════════════════════════════════════════════════════
   *  SINGLE-RANGE MODE (existing behavior)
   * ════════════════════════════════════════════════════════════════════ */
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [activeField, setActiveField] = useState('start');
  const endDateEnabled = true; // Always enabled — double-click same day for single day
  const [startText, setStartText] = useState('');
  const [endText, setEndText] = useState('');

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onRangeChangeRef = useRef(onRangeChange);
  onRangeChangeRef.current = onRangeChange;

  // Sync value → single-range state when picker closed
  useEffect(() => {
    if (isMultiRange || openRef.current) return;
    if (value?.[0] && value?.[1]) {
      const s = value[0].toDate(), e = value[1].toDate();
      setStartDate(s); setEndDate(e);
      setStartText(dayjs(s).format(DISPLAY_FMT));
      setEndText(dayjs(e).format(DISPLAY_FMT));
    } else {
      setStartDate(null); setEndDate(null); setStartText(''); setEndText('');
    }
  }, [isMultiRange, value?.[0]?.valueOf(), value?.[1]?.valueOf()]);

  useEffect(() => {
    if (isMultiRange) return;
    if (!open && value?.[0] && value?.[1]) {
      const s = value[0].toDate(), e = value[1].toDate();
      setStartDate(s); setEndDate(e);
      setStartText(dayjs(s).format(DISPLAY_FMT));
      setEndText(dayjs(e).format(DISPLAY_FMT));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isMultiRange]);

  const fireChange = useCallback((s, e) => {
    if (!s) return;
    onChangeRef.current?.([dayjs(s), dayjs(e || s)]);
  }, []);

  /* ════════════════════════════════════════════════════════════════════════
   *  MULTI-RANGE MODE
   * ════════════════════════════════════════════════════════════════════ */
  const [mRanges, setMRanges] = useState([]); // [{key, label, color, start:Date, end:Date, startText, endText}]
  const [activeRangeIdx, setActiveRangeIdx] = useState(0);
  const [mActiveField, setMActiveField] = useState('start');

  // Sync ranges prop → internal mRanges state when picker closed
  useEffect(() => {
    if (!isMultiRange || openRef.current) return;
    setMRanges(ranges.map((r, i) => {
      const c = RANGE_COLORS[i % RANGE_COLORS.length];
      const s = r.value?.[0]?.toDate() ?? null;
      const e = r.value?.[1]?.toDate() ?? null;
      return {
        key: r.key, label: r.label, color: c.hex, bg: c.bg,
        start: s, end: e,
        startText: s ? dayjs(s).format(DISPLAY_FMT) : '',
        endText: e ? dayjs(e).format(DISPLAY_FMT) : '',
      };
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMultiRange, ranges?.map(r => `${r.key}:${r.value?.[0]?.valueOf()}:${r.value?.[1]?.valueOf()}`).join(',')]);

  useEffect(() => {
    if (!isMultiRange) return;
    if (!open && ranges?.length) {
      setMRanges(ranges.map((r, i) => {
        const c = RANGE_COLORS[i % RANGE_COLORS.length];
        const s = r.value?.[0]?.toDate() ?? null;
        const e = r.value?.[1]?.toDate() ?? null;
        return {
          key: r.key, label: r.label, color: c.hex, bg: c.bg,
          start: s, end: e,
          startText: s ? dayjs(s).format(DISPLAY_FMT) : '',
          endText: e ? dayjs(e).format(DISPLAY_FMT) : '',
        };
      }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isMultiRange]);

  // Track which range index was last changed, fire onRangeChange via effect
  const [pendingChangeIdx, setPendingChangeIdx] = useState(-1);

  useEffect(() => {
    if (pendingChangeIdx < 0) return;
    const r = mRanges[pendingChangeIdx];
    if (r?.start) {
      onRangeChangeRef.current?.(r.key, [dayjs(r.start), dayjs(r.end || r.start)]);
    }
    setPendingChangeIdx(-1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingChangeIdx]);

  /* ════════════════════════════════════════════════════════════════════════
   *  SHARED: open/close, outside click
   * ════════════════════════════════════════════════════════════════════ */
  const openPicker = useCallback(() => {
    setOpen(prev => {
      if (!prev) {
        if (isMultiRange) { setActiveRangeIdx(0); setMActiveField('start'); }
        else setActiveField('start');
        // Calculate fixed position, clamp to viewport
        requestAnimationFrame(() => {
          if (!containerRef.current) return;
          const rect = containerRef.current.getBoundingClientRect();
          const popupW = 280, popupH = 400;
          let top = rect.bottom + 4;
          let left = rect.left;
          // If overflows bottom, show above trigger
          if (top + popupH > window.innerHeight) top = rect.top - popupH - 4;
          // If overflows right, align to right edge
          if (left + popupW > window.innerWidth) left = window.innerWidth - popupW - 8;
          // Clamp
          if (top < 4) top = 4;
          if (left < 4) left = 4;
          setPopupPos({ top, left });
        });
      }
      return !prev;
    });
  }, [isMultiRange]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (triggerRef.current?.contains(e.target)) return;
      if (popupRef.current?.contains(e.target)) return;
      // Confirm current selection on outside click
      if (!isMultiRange && startDate) {
        fireChange(startDate, endDateEnabled ? endDate : startDate);
      }
      // Multi-range: changes are already fired on each click, just close
      setOpen(false);
    };
    document.addEventListener('pointerdown', handler, true);
    return () => document.removeEventListener('pointerdown', handler, true);
  }, [open, isMultiRange, startDate, endDate, endDateEnabled, fireChange]);

  /* ════════════════════════════════════════════════════════════════════════
   *  SINGLE-RANGE handlers
   * ════════════════════════════════════════════════════════════════════ */
  const handleDayClick = useCallback((day) => {
    // Double-click same day = select single day (start = end)
    if (startDate && dayjs(day).isSame(dayjs(startDate), 'day') && activeField === 'end') {
      setEndDate(day); setEndText(dayjs(day).format(DISPLAY_FMT));
      fireChange(day, day);
      return;
    }
    if (activeField === 'start') {
      setStartDate(day); setStartText(dayjs(day).format(DISPLAY_FMT));
      if (endDate && day > endDate) {
        setEndDate(day); setEndText(dayjs(day).format(DISPLAY_FMT));
      }
      setActiveField('end');
      fireChange(day, endDate && day <= endDate ? endDate : day);
    } else {
      const finalEnd = startDate && day < startDate ? startDate : day;
      setEndDate(finalEnd); setEndText(dayjs(finalEnd).format(DISPLAY_FMT));
      fireChange(startDate, finalEnd);
    }
  }, [activeField, startDate, endDate, fireChange]);

  const commitStartText = useCallback(() => {
    const d = parseInput(startText);
    if (d) {
      setStartDate(d); setStartText(dayjs(d).format(DISPLAY_FMT));
      if (endDateEnabled && endDate && d > endDate) { setEndDate(d); setEndText(dayjs(d).format(DISPLAY_FMT)); fireChange(d, d); }
      else fireChange(d, endDateEnabled ? endDate : d);
    } else if (startDate) setStartText(dayjs(startDate).format(DISPLAY_FMT));
  }, [startText, startDate, endDate, endDateEnabled, fireChange]);

  const commitEndText = useCallback(() => {
    const d = parseInput(endText);
    if (d) {
      const finalEnd = startDate && d < startDate ? startDate : d;
      setEndDate(finalEnd); setEndText(dayjs(finalEnd).format(DISPLAY_FMT));
      fireChange(startDate, finalEnd);
    } else if (endDate) setEndText(dayjs(endDate).format(DISPLAY_FMT));
  }, [endText, startDate, endDate, fireChange]);

  // handleToggleEnd removed — end always enabled, double-click same day for single day

  /* ════════════════════════════════════════════════════════════════════════
   *  MULTI-RANGE handlers
   * ════════════════════════════════════════════════════════════════════ */
  const handleMDayClick = useCallback((day) => {
    // Auto-detect: which range contains this day?
    let idx = detectRange(day, mRanges, activeRangeIdx);
    if (idx === -1) idx = activeRangeIdx; // keep current if outside all ranges

    const r = mRanges[idx];
    if (!r) return;

    // Determine field: closer to start or end?
    let field = mActiveField;
    if (idx !== activeRangeIdx) {
      // Switching range: pick closer boundary
      if (r.start && r.end) {
        const dStart = Math.abs(dayjs(day).diff(dayjs(r.start), 'day'));
        const dEnd = Math.abs(dayjs(day).diff(dayjs(r.end), 'day'));
        field = dStart <= dEnd ? 'start' : 'end';
      } else {
        field = 'start';
      }
      setActiveRangeIdx(idx);
    }

    setMRanges(prev => {
      const updated = [...prev];
      const cur = { ...updated[idx] };
      if (field === 'start') {
        cur.start = day;
        cur.startText = dayjs(day).format(DISPLAY_FMT);
        if (cur.end && day > cur.end) { cur.end = day; cur.endText = dayjs(day).format(DISPLAY_FMT); }
      } else {
        const finalEnd = cur.start && day < cur.start ? cur.start : day;
        cur.end = finalEnd;
        cur.endText = dayjs(finalEnd).format(DISPLAY_FMT);
      }
      updated[idx] = cur;
      return updated;
    });

    // Auto-shift to end field after setting start
    if (field === 'start') setMActiveField('end');

    // Schedule firing onRangeChange via effect (avoids setState-during-render)
    setPendingChangeIdx(idx);
  }, [mRanges, activeRangeIdx, mActiveField]);

  const commitMText = useCallback((idx, field) => {
    let shouldFire = false;
    setMRanges(prev => {
      const updated = [...prev];
      const r = { ...updated[idx] };
      const text = field === 'start' ? r.startText : r.endText;
      const d = parseInput(text);
      if (d) {
        if (field === 'start') {
          r.start = d; r.startText = dayjs(d).format(DISPLAY_FMT);
          if (r.end && d > r.end) { r.end = d; r.endText = dayjs(d).format(DISPLAY_FMT); }
        } else {
          const finalEnd = r.start && d < r.start ? r.start : d;
          r.end = finalEnd; r.endText = dayjs(finalEnd).format(DISPLAY_FMT);
        }
        shouldFire = true;
      } else {
        if (field === 'start' && r.start) r.startText = dayjs(r.start).format(DISPLAY_FMT);
        if (field === 'end' && r.end) r.endText = dayjs(r.end).format(DISPLAY_FMT);
      }
      updated[idx] = r;
      return updated;
    });
    if (shouldFire) setPendingChangeIdx(idx);
  }, []);

  /* ════════════════════════════════════════════════════════════════════════
   *  MODIFIERS (calendar highlight)
   * ════════════════════════════════════════════════════════════════════ */
  const { modifiers, modifiersClassNames } = useMemo(() => {
    if (isMultiRange) {
      const mods = {};
      const cls = {};
      mRanges.forEach((r, i) => {
        if (!r.start) return;
        mods[`r${i}s`] = r.start;
        cls[`r${i}s`] = `rdp-r${i}s`;
        if (r.end && dayjs(r.end).isAfter(dayjs(r.start), 'day')) {
          mods[`r${i}e`] = r.end;
          cls[`r${i}e`] = `rdp-r${i}e`;
          const mid = getMiddleDates(r.start, r.end);
          if (mid.length) { mods[`r${i}m`] = mid; cls[`r${i}m`] = `rdp-r${i}m`; }
        }
      });
      return { modifiers: mods, modifiersClassNames: cls };
    }
    // Single-range modifiers
    const mods = {};
    if (startDate) {
      mods.rangeStart = startDate;
      if (endDateEnabled && endDate && dayjs(endDate).isAfter(dayjs(startDate), 'day')) {
        mods.rangeEnd = endDate;
        const mid = getMiddleDates(startDate, endDate);
        if (mid.length) mods.rangeMiddle = mid;
      }
    }
    return {
      modifiers: mods,
      modifiersClassNames: {
        rangeStart: 'rdp-range_start rdp-selected',
        rangeEnd: 'rdp-range_end rdp-selected',
        rangeMiddle: 'rdp-range_middle rdp-selected',
      },
    };
  }, [isMultiRange, mRanges, startDate, endDate, endDateEnabled]);

  /* ════════════════════════════════════════════════════════════════════════
   *  TRIGGER BUTTON DISPLAY
   * ════════════════════════════════════════════════════════════════════ */
  const display = useMemo(() => {
    if (isMultiRange) {
      const first = ranges?.[0];
      if (!first?.value?.[0]) return placeholder;
      const s = first.value[0].format('MM-DD');
      const last = ranges[ranges.length - 1];
      const e = last?.value?.[1]?.format('MM-DD');
      return e && e !== s ? `${s} → ${e}` : s;
    }
    if (!startDate) return placeholder;
    if (endDateEnabled && endDate && dayjs(startDate).format(DATE_FMT) !== dayjs(endDate).format(DATE_FMT)) {
      return `${dayjs(startDate).format('MM-DD')} → ${dayjs(endDate).format('MM-DD')}`;
    }
    return dayjs(startDate).format('MM-DD');
  }, [isMultiRange, ranges, startDate, endDate, endDateEnabled, placeholder]);

  // Controlled month — auto-scroll when selecting date near end of month
  const [calMonth, setCalMonth] = useState(() => {
    const d = isMultiRange ? mRanges[0]?.start : startDate;
    return d ? dayjs(d).startOf('month').toDate() : new Date();
  });

  // Auto-scroll: picking date near end of month → scroll to show transition zone
  const monthsRef = useRef(null);

  const scrollToTransition = useCallback(() => {
    const el = monthsRef.current;
    if (!el) return;
    // Find second month element (the next month)
    const months = el.querySelectorAll('.rdp-month');
    if (months.length < 2) return;
    // Scroll so that ~last 2 rows of month1 + caption of month2 are visible
    const secondMonth = months[1];
    const targetScroll = secondMonth.offsetTop - 160; // show transition zone
    el.scrollTo({ top: Math.max(0, targetScroll), behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const d = activeField === 'end' ? (endDate || startDate) : startDate;
    if (!d) return;
    const day = dayjs(d);
    setCalMonth(day.startOf('month').toDate());
    // If day >= 15, scroll to show transition between months
    if (day.date() >= 15) {
      setTimeout(scrollToTransition, 100);
    } else {
      // Scroll to top
      setTimeout(() => { if (monthsRef.current) monthsRef.current.scrollTop = 0; }, 50);
    }
  }, [startDate, endDate, activeField, scrollToTransition]);

  // Attach ref to rdp-months container after render
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      const el = popupRef.current?.querySelector('.rdp-months');
      if (el) monthsRef.current = el;
    }, 50);
    return () => clearTimeout(timer);
  }, [open]);

  /* ════════════════════════════════════════════════════════════════════════
   *  RENDER
   * ════════════════════════════════════════════════════════════════════ */
  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block', ...style }}>
      <style>{NEO_CSS}</style>

      <button
        className="neo-btn"
        ref={triggerRef} onClick={openPicker} type="button"
        style={{
          width: '100%', padding: '8px 24px', fontSize: 14, fontWeight: active ? 900 : 700,
          background: active ? 'var(--nav-active-bg)' : 'var(--bg-card)',
          color: active ? 'var(--nav-active-text)' : ((isMultiRange ? ranges?.[0]?.value?.[0] : startDate) ? 'var(--text-primary)' : 'var(--text-secondary)'),
          whiteSpace: 'nowrap',
          transform: open ? 'translate(3px,3px)' : 'none',
          boxShadow: open ? 'none' : undefined,
        }}
      >
        {active ? display : (label || display)}
      </button>

      {open && (
        <div
          ref={popupRef}
          style={{
            position: 'fixed', zIndex: 9999,
            top: popupPos.top, left: popupPos.left,
            border: '3px solid var(--border-color)', borderRadius: 2,
            boxShadow: '6px 6px 0 var(--shadow-color)',
            background: 'var(--bg-card)', overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
            maxHeight: 'calc(100vh - 20px)', width: 320,
          }}
        >
          {/* ── HEADER ── */}
          {isMultiRange ? (
            <div className="neo-rdp-header">
              {mRanges.map((r, i) => (
                <div
                  key={r.key}
                  className={`neo-rdp-range-row ${i === activeRangeIdx ? 'neo-rdp-range-row--active' : ''}`}
                  onClick={() => { setActiveRangeIdx(i); setMActiveField('start'); }}
                >
                  <div className="neo-rdp-dot" style={{ background: r.color }} />
                  <span className="neo-rdp-range-label">{r.label}</span>
                  <div className="neo-rdp-range-dates" style={{ '--accent-color': r.color }}>
                    <input
                      value={r.startText} placeholder="MM/DD/YYYY"
                      style={i === activeRangeIdx && mActiveField === 'start'
                        ? { borderColor: r.color, background: r.bg, fontWeight: 900 } : {}}
                      onChange={e => setMRanges(prev => {
                        const u = [...prev]; u[i] = { ...u[i], startText: e.target.value }; return u;
                      })}
                      onBlur={() => commitMText(i, 'start')}
                      onKeyDown={e => { if (e.key === 'Enter') commitMText(i, 'start'); }}
                      onFocus={() => { setActiveRangeIdx(i); setMActiveField('start'); }}
                    />
                    <span className="neo-rdp-arrow">→</span>
                    <input
                      value={r.endText} placeholder="MM/DD/YYYY"
                      style={i === activeRangeIdx && mActiveField === 'end'
                        ? { borderColor: r.color, background: r.bg, fontWeight: 900 } : {}}
                      onChange={e => setMRanges(prev => {
                        const u = [...prev]; u[i] = { ...u[i], endText: e.target.value }; return u;
                      })}
                      onBlur={() => commitMText(i, 'end')}
                      onKeyDown={e => { if (e.key === 'Enter') commitMText(i, 'end'); }}
                      onFocus={() => { setActiveRangeIdx(i); setMActiveField('end'); }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="neo-rdp-header">
              <div className="neo-rdp-row">
                <div
                  className={`neo-rdp-field ${activeField === 'start' ? 'neo-rdp-field--active' : ''}`}
                  onClick={() => setActiveField('start')}
                >
                  <input
                    value={startText} placeholder="Start"
                    onChange={e => setStartText(e.target.value)}
                    onBlur={commitStartText}
                    onKeyDown={e => { if (e.key === 'Enter') commitStartText(); }}
                    onFocus={() => setActiveField('start')}
                  />
                </div>
                <div
                  className={`neo-rdp-field ${activeField === 'end' ? 'neo-rdp-field--active' : ''}`}
                  onClick={() => setActiveField('end')}
                >
                  <input
                    value={endText} placeholder="End"
                    onChange={e => setEndText(e.target.value)}
                    onBlur={commitEndText}
                    onKeyDown={e => { if (e.key === 'Enter') commitEndText(); }}
                    onFocus={() => setActiveField('end')}
                  />
                </div>
              </div>
            </div>
          )}

          <DayPicker
            className="neo-rdp"
            modifiers={modifiers}
            modifiersClassNames={modifiersClassNames}
            onDayClick={isMultiRange ? handleMDayClick : handleDayClick}
            numberOfMonths={numberOfMonths}
            pagedNavigation
            month={calMonth}
            onMonthChange={setCalMonth}
          />
        </div>
      )}
    </div>
  );
}
