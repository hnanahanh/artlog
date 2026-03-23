import { useEffect, useRef } from 'react';
import { useI18n } from '../../i18n/i18n-config';

/* Paint bucket SVG — inline, ~80px, yellow fill + black stroke */
/* Palette (bảng vẽ) SVG icon — white fill + black stroke */
const PaletteIcon = () => (
  <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M40 8C22.3 8 8 22.3 8 40c0 17.7 14.3 32 32 32 3 0 5.4-2.4 5.4-5.4 0-1.4-.5-2.6-1.4-3.6-.8-.9-1.3-2.1-1.3-3.6 0-3 2.4-5.4 5.4-5.4H54c9.9 0 18-8.1 18-18C72 20.2 58.2 8 40 8z"
      fill="#fff" stroke="#000" strokeWidth="3"/>
    <circle cx="24" cy="34" r="5" fill="#c47dff" stroke="#000" strokeWidth="2"/>
    <circle cx="36" cy="22" r="5" fill="#52c41a" stroke="#000" strokeWidth="2"/>
    <circle cx="52" cy="24" r="5" fill="#d4a800" stroke="#000" strokeWidth="2"/>
    <circle cx="58" cy="40" r="5" fill="#ff4d4f" stroke="#000" strokeWidth="2"/>
  </svg>
);

export default function SplashOverlay({ open, onClose, clickOrigin }) {
  const { t } = useI18n();
  const overlayRef = useRef(null);
  const isClosingRef = useRef(false);

  /* ESC to close */
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') handleClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  /* Reset closing flag when overlay opens */
  useEffect(() => {
    if (open) isClosingRef.current = false;
  }, [open]);

  function handleClose() {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    const el = overlayRef.current;
    if (!el) { onClose(); return; }
    el.style.animation = 'splash-close 0.45s ease-in forwards';
    setTimeout(onClose, 440);
  }

  if (!open) return null;

  const cx = clickOrigin?.x ?? '50%';
  const cy = clickOrigin?.y ?? '50%';
  /* Use pixel values directly — clip-path accepts px within absolute-positioned element */
  const cxVal = typeof cx === 'number' ? `${cx}px` : cx;
  const cyVal = typeof cy === 'number' ? `${cy}px` : cy;

  return (
    <div
      ref={overlayRef}
      onClick={handleClose}
      className="splash-overlay"
      style={{
        '--cx': cxVal,
        '--cy': cyVal,
        position: 'absolute', inset: 0, zIndex: 50,
        background: 'var(--sidebar-bg)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 24,
        animation: 'splash-fill 0.6s ease-out forwards',
        cursor: 'pointer',
      }}
    >
      <div className="splash-content" style={{ animation: 'splash-content-in 0.3s 0.55s ease both', marginBottom: 8 }}>
        <PaletteIcon />
      </div>
      <div className="splash-content" style={{ animation: 'splash-content-in 0.3s 0.6s ease both', textAlign: 'center' }}>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontWeight: 900,
          fontSize: 'clamp(22px, 5vw, 42px)',
          color: '#ffffff',
          WebkitTextStroke: '2px #000',
          paintOrder: 'stroke fill',
          textShadow: '4px 4px 0 #000',
          letterSpacing: 2,
          lineHeight: 1.2,
        }}>
          {t('splash.quote')}
        </div>
      </div>
      <div className="splash-content" style={{
        animation: 'splash-content-in 0.3s 0.65s ease both',
        position: 'absolute', bottom: 24,
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 13, fontWeight: 900,
        color: '#ffffff',
        letterSpacing: 2,
      }}>
        made by AnhHN2
      </div>
    </div>
  );
}
