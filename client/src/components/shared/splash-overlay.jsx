import { useEffect, useRef } from 'react';
import { useI18n } from '../../i18n/i18n-config';

/* Paint bucket SVG — inline, ~80px, yellow fill + black stroke */
const PaintBucketIcon = () => (
  <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="8" width="36" height="10" rx="2" fill="#f9e764" stroke="#000" strokeWidth="3"/>
    <rect x="14" y="16" width="28" height="34" rx="2" fill="#f9e764" stroke="#000" strokeWidth="3"/>
    <path d="M14 50 L16 62 H32 L34 50 Z" fill="#f9e764" stroke="#000" strokeWidth="3" strokeLinejoin="round"/>
    <circle cx="61" cy="58" r="12" fill="#f9e764" stroke="#000" strokeWidth="3"/>
    <path d="M61 46 L53 34" stroke="#000" strokeWidth="3" strokeLinecap="round"/>
    <rect x="20" y="22" width="8" height="3" rx="1" fill="#000" opacity="0.3"/>
    <rect x="20" y="29" width="8" height="3" rx="1" fill="#000" opacity="0.3"/>
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
        <PaintBucketIcon />
      </div>
      <div className="splash-content" style={{ animation: 'splash-content-in 0.3s 0.6s ease both', textAlign: 'center' }}>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontWeight: 900,
          fontSize: 'clamp(22px, 5vw, 42px)',
          color: '#f9e764',
          WebkitTextStroke: '2px #000',
          paintOrder: 'stroke fill',
          textShadow: '4px 4px 0 #000',
          letterSpacing: 2,
          lineHeight: 1.2,
        }}>
          {t('splash.quote')}
        </div>
        <div style={{
          marginTop: 12,
          fontFamily: 'JetBrains Mono, monospace',
          fontWeight: 700,
          fontSize: 'clamp(13px, 2.5vw, 20px)',
          color: '#f9e764',
          opacity: 0.85,
          letterSpacing: 1,
        }}>
          {t('splash.subtitle')}
        </div>
      </div>
      <div className="splash-content" style={{
        animation: 'splash-content-in 0.3s 0.65s ease both',
        marginTop: 16,
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 12,
        color: 'rgba(249,231,100,0.5)',
        letterSpacing: 2,
      }}>
        made by AnhHN2
      </div>
    </div>
  );
}
