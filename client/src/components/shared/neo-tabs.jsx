import { useState } from 'react';
import { PlusOutlined, DownOutlined, CloseOutlined } from '@ant-design/icons';

/**
 * NeoTabs — neo-brutalism tabs with add/remove, mobile dropdown
 * Props:
 *   defaultValue: initial active tab
 *   items: [{ value, label, children }]
 *   extra: ReactNode (right-aligned action button)
 *   defaultVisible: array of tab values visible on mount (default: [defaultValue])
 */
export default function NeoTabs({ defaultValue, items = [], extra, defaultVisible }) {
  const [active, setActive] = useState(defaultValue ?? items[0]?.value);
  const [visibleKeys, setVisibleKeys] = useState(() => {
    if (defaultVisible) return defaultVisible;
    return [defaultValue ?? items[0]?.value].filter(Boolean);
  });
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [mobileDropOpen, setMobileDropOpen] = useState(false);

  const visibleItems = items.filter(i => visibleKeys.includes(i.value));
  const hiddenItems = items.filter(i => !visibleKeys.includes(i.value));
  const activeItem = items.find(i => i.value === active);

  const addTab = (value) => {
    setVisibleKeys(prev => [...prev, value]);
    setActive(value);
    setAddMenuOpen(false);
  };

  const removeTab = (value, e) => {
    e.stopPropagation();
    setVisibleKeys(prev => {
      const next = prev.filter(k => k !== value);
      // If removing active tab, switch to first remaining
      if (active === value && next.length > 0) setActive(next[0]);
      return next;
    });
  };

  // Shared button style
  const btnStyle = (isActive) => ({
    padding: '8px 16px',
    fontWeight: 700,
    fontSize: 13,
    fontFamily: "'Google Sans Code', monospace",
    border: 'none',
    borderRadius: 0,
    background: isActive ? 'var(--accent-active)' : 'transparent',
    color: isActive ? '#222' : 'var(--text-primary)',
    cursor: 'pointer',
    transition: 'background 0.15s',
    outline: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    whiteSpace: 'nowrap',
  });

  return (
    <div>
      {/* ---- Desktop tabs row (>768px) ---- */}
      <div className="neo-tabs-desktop" style={{ display: 'flex', alignItems: 'stretch', gap: 8 }}>
        <div style={{
          display: 'flex',
          border: '3px solid var(--border-color)',
          borderRadius: 2,
          boxShadow: '4px 4px 0px var(--shadow-color)',
          background: 'var(--bg-header)',
          overflow: 'visible',
          transition: 'background-color 0.3s, border-color 0.3s',
          flexShrink: 0,
        }}>
          {visibleItems.map((item, i) => {
            const isActive = active === item.value;
            const isLast = i === visibleItems.length - 1 && hiddenItems.length === 0;
            return (
              <button
                key={item.value}
                onClick={() => setActive(item.value)}
                style={{
                  ...btnStyle(isActive),
                  borderRight: isLast ? 'none' : '2px solid var(--border-color)',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(0,0,0,0.08)'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = isActive ? 'var(--accent-active)' : 'transparent'; }}
              >
                {item.label}
                {/* Close button — only if more than 1 tab visible */}
                {visibleItems.length > 1 && (
                  <CloseOutlined
                    onClick={(e) => removeTab(item.value, e)}
                    style={{ fontSize: 9, opacity: 0.5, marginLeft: 2 }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = '1'; }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = '0.5'; }}
                  />
                )}
              </button>
            );
          })}

          {/* "+" button to add hidden tabs */}
          {hiddenItems.length > 0 && (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setAddMenuOpen(!addMenuOpen)}
                style={{
                  ...btnStyle(false),
                  padding: '8px 12px',
                  borderLeft: visibleItems.length > 0 ? '2px solid var(--border-color)' : 'none',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                <PlusOutlined style={{ fontSize: 12 }} />
              </button>

              {/* Dropdown menu */}
              {addMenuOpen && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setAddMenuOpen(false)} />
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, zIndex: 100,
                    marginTop: 4,
                    border: '3px solid var(--border-color)',
                    boxShadow: '4px 4px 0px var(--shadow-color)',
                    background: 'var(--bg-card)',
                    minWidth: 120,
                  }}>
                    {hiddenItems.map(item => (
                      <button
                        key={item.value}
                        onClick={() => addTab(item.value)}
                        style={{
                          display: 'block', width: '100%', textAlign: 'left',
                          padding: '8px 16px', border: 'none', background: 'transparent',
                          fontWeight: 700, fontSize: 13, fontFamily: "'Google Sans Code', monospace",
                          color: 'var(--text-primary)', cursor: 'pointer',
                          borderBottom: '2px solid var(--border-color)',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-header)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Spacer pushes extra to right */}
        <div style={{ flex: 1 }} />
        {extra && <div style={{ display: 'flex', alignItems: 'center' }}>{extra}</div>}
      </div>

      {/* ---- Mobile dropdown (≤768px) ---- */}
      <div className="neo-tabs-mobile" style={{ display: 'none', gap: 8, alignItems: 'stretch' }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={() => setMobileDropOpen(!mobileDropOpen)}
            style={{
              ...btnStyle(true),
              border: '3px solid var(--border-color)',
              boxShadow: '3px 3px 0px var(--shadow-color)',
              padding: '6px 14px',
              gap: 8,
            }}
          >
            {activeItem?.label || '—'}
            <DownOutlined style={{ fontSize: 10 }} />
          </button>

          {mobileDropOpen && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setMobileDropOpen(false)} />
              <div style={{
                position: 'absolute', top: '100%', left: 0, zIndex: 100,
                marginTop: 4,
                border: '3px solid var(--border-color)',
                boxShadow: '4px 4px 0px var(--shadow-color)',
                background: 'var(--bg-card)',
                minWidth: 140,
              }}>
                {items.map(item => (
                  <button
                    key={item.value}
                    onClick={() => {
                      setActive(item.value);
                      if (!visibleKeys.includes(item.value)) setVisibleKeys(prev => [...prev, item.value]);
                      setMobileDropOpen(false);
                    }}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      padding: '8px 16px', border: 'none',
                      background: active === item.value ? 'var(--accent-active)' : 'transparent',
                      fontWeight: 700, fontSize: 13, fontFamily: "'Google Sans Code', monospace",
                      color: active === item.value ? '#222' : 'var(--text-primary)',
                      cursor: 'pointer',
                      borderBottom: '2px solid var(--border-color)',
                    }}
                    onMouseEnter={e => { if (active !== item.value) e.currentTarget.style.background = 'var(--bg-header)'; }}
                    onMouseLeave={e => { if (active !== item.value) e.currentTarget.style.background = 'transparent'; }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div style={{ flex: 1 }} />
        {extra && <div style={{ display: 'flex', alignItems: 'center' }}>{extra}</div>}
      </div>

      {/* ---- Responsive CSS ---- */}
      <style>{`
        @media (min-width: 769px) { .neo-tabs-mobile { display: none !important; } }
        @media (max-width: 768px) { .neo-tabs-desktop { display: none !important; } .neo-tabs-mobile { display: flex !important; } }
      `}</style>

      {/* TabsContent */}
      {items.map((item) => (
        <div
          key={item.value}
          style={{ display: active === item.value ? 'block' : 'none', marginTop: 12 }}
        >
          {item.children}
        </div>
      ))}
    </div>
  );
}
