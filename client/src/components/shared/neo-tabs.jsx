import { useState } from 'react';

/**
 * NeoTabs — shadcn/ui Tabs pattern with neo-brutalism style
 * Includes its own Card container (border + shadow)
 * Usage:
 *   <NeoTabs defaultValue="kanban" items={[{ value, label, children }]} />
 */
export default function NeoTabs({ defaultValue, items = [] }) {
  const [active, setActive] = useState(defaultValue ?? items[0]?.value);

  return (
    <div style={{
      border: '3px solid var(--border-color)',
      borderRadius: 2,
      boxShadow: '4px 4px 0px var(--shadow-color)',
      background: 'var(--bg-card)',
      overflow: 'hidden',
      transition: 'background-color 0.3s, border-color 0.3s',
    }}>
      {/* TabsList — equal-width grid of triggers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${items.length}, 1fr)`,
        background: 'var(--bg-header)',
        borderBottom: '2px solid var(--border-color)',
      }}>
        {items.map((item, i) => {
          const isActive = active === item.value;
          const isLast = i === items.length - 1;
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
                borderRight: isLast ? 'none' : '2px solid var(--border-color)',
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

      {/* TabsContent — only active panel shown */}
      {items.map((item) => (
        <div
          key={item.value}
          style={{ display: active === item.value ? 'block' : 'none', padding: '12px 16px' }}
        >
          {item.children}
        </div>
      ))}
    </div>
  );
}
