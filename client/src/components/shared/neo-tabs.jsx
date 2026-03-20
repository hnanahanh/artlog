import { useState } from 'react';

/**
 * NeoTabs — shadcn/ui Tabs pattern with neo-brutalism style
 * Includes its own Card container (border + shadow)
 * Usage:
 *   <NeoTabs defaultValue="kanban" items={[{ value, label, children }]} />
 */
export default function NeoTabs({ defaultValue, items = [], extra }) {
  const [active, setActive] = useState(defaultValue ?? items[0]?.value);

  return (
    <div>
      {/* TabsList row — tabs box + optional extra button */}
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 12 }}>
        <div style={{
          border: '3px solid var(--border-color)',
          borderRadius: 2,
          boxShadow: '4px 4px 0px var(--shadow-color)',
          background: 'var(--bg-header)',
          overflow: 'hidden',
          transition: 'background-color 0.3s, border-color 0.3s',
          display: 'flex',
          alignItems: 'stretch',
        }}>
          {items.map((item, i) => {
            const isActive = active === item.value;
            return (
              <button
                key={item.value}
                onClick={() => setActive(item.value)}
                style={{
                  padding: '8px 20px',
                  fontWeight: 700,
                  fontSize: 13,
                  fontFamily: "'Google Sans Code', monospace",
                  border: 'none',
                  borderRight: '2px solid var(--border-color)',
                  borderRadius: 0,
                  background: isActive ? 'var(--accent-active)' : 'transparent',
                  color: isActive ? '#222' : 'var(--text-primary)',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                  outline: 'none',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(0,0,0,0.08)'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
        {extra && <div style={{ marginLeft: 'auto' }}>{extra}</div>}
      </div>

      {/* TabsContent — outside the bordered container */}
      {items.map((item) => (
        <div
          key={item.value}
          style={{ display: active === item.value ? 'block' : 'none', paddingTop: 12 }}
        >
          {item.children}
        </div>
      ))}
    </div>
  );
}
