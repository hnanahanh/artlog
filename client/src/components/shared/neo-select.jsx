import { useState, useRef, useEffect } from 'react';

/**
 * NeoSelect — single-value creatable select styled like NeoRangePicker.
 * Props:
 *   value: string | null
 *   options: string[]        — existing choices
 *   onChange: (value) => void
 *   placeholder: string
 *   allowClear: boolean
 */
export default function NeoSelect({ value, options = [], onChange, placeholder = 'Select…', allowClear = true }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = e => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase()));
  const canCreate = search.trim() && !options.some(o => o.toLowerCase() === search.trim().toLowerCase());

  const select = val => {
    onChange?.(val);
    setOpen(false);
    setSearch('');
  };

  const clear = e => {
    e.stopPropagation();
    onChange?.('');
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
      {/* Trigger button — same style as NeoRangePicker */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', padding: '4px 8px', fontSize: 13, fontWeight: 600,
          fontFamily: "'Google Sans Code', monospace",
          border: '2px solid var(--border-color)',
          borderRadius: 2, background: 'var(--bg-card)',
          color: value ? 'var(--text-primary)' : 'var(--text-secondary)',
          cursor: 'pointer', whiteSpace: 'nowrap', textAlign: 'left',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: open ? 'none' : '2px 2px 0 var(--shadow-color)',
          transform: open ? 'translate(2px,2px)' : 'none',
          transition: 'all 0.1s',
        }}
      >
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {value || placeholder}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          {allowClear && value && (
            <span
              onClick={clear}
              style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1, padding: '0 2px' }}
            >✕</span>
          )}
          <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{open ? '▲' : '▼'}</span>
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', zIndex: 1050, top: 'calc(100% + 2px)', left: 0, right: 0,
          border: '2px solid var(--border-color)', borderRadius: 2,
          boxShadow: '4px 4px 0 var(--shadow-color)',
          background: 'var(--bg-card)', overflow: 'hidden',
        }}>
          {/* Search/create input */}
          <div style={{ borderBottom: '2px solid var(--border-color)', padding: 4 }}>
            <input
              ref={inputRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && canCreate) select(search.trim());
                if (e.key === 'Escape') { setOpen(false); setSearch(''); }
              }}
              placeholder="Search or type new…"
              style={{
                width: '100%', border: 'none', outline: 'none', background: 'transparent',
                fontFamily: "'Google Sans Code', monospace", fontSize: 12, fontWeight: 600,
                color: 'var(--text-primary)', padding: '2px 4px',
              }}
            />
          </div>

          {/* Options list */}
          <div style={{ maxHeight: 180, overflowY: 'auto' }}>
            {filtered.map(opt => (
              <div
                key={opt}
                onMouseDown={() => select(opt)}
                style={{
                  padding: '5px 10px', fontSize: 12, fontWeight: opt === value ? 900 : 600,
                  fontFamily: "'Google Sans Code', monospace",
                  background: opt === value ? 'var(--accent-color, #ff6b35)' : 'transparent',
                  color: opt === value ? '#fff' : 'var(--text-primary)',
                  cursor: 'pointer', borderBottom: '1px solid var(--border-color)',
                }}
                onMouseEnter={e => { if (opt !== value) e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                onMouseLeave={e => { if (opt !== value) e.currentTarget.style.background = 'transparent'; }}
              >
                {opt}
              </div>
            ))}

            {/* Create new option */}
            {canCreate && (
              <div
                onMouseDown={() => select(search.trim())}
                style={{
                  padding: '5px 10px', fontSize: 12, fontWeight: 700,
                  fontFamily: "'Google Sans Code', monospace",
                  color: 'var(--accent-color, #ff6b35)',
                  cursor: 'pointer', borderTop: '1px dashed var(--border-color)',
                }}
              >
                + Create "{search.trim()}"
              </div>
            )}

            {filtered.length === 0 && !canCreate && (
              <div style={{ padding: '8px 10px', fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                No options
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
