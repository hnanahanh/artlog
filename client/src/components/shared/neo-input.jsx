import { forwardRef } from 'react';

const neoInputStyle = {
  width: '100%',
  padding: '4px 8px',
  fontSize: 13,
  fontWeight: 600,
  fontFamily: "'Google Sans Code', monospace",
  border: '2px solid var(--border-color)',
  borderRadius: 2,
  background: 'var(--bg-card)',
  color: 'var(--text-primary)',
  boxShadow: '2px 2px 0 var(--shadow-color)',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'box-shadow 0.1s, transform 0.1s',
};

/**
 * NeoInput — styled <input> matching NeoRangePicker/NeoSelect look.
 * Accepts all standard input props.
 */
const NeoInput = forwardRef(({ style, onFocus, onBlur, ...props }, ref) => {
  return (
    <input
      ref={ref}
      {...props}
      style={{ ...neoInputStyle, ...style }}
      onFocus={e => {
        e.currentTarget.style.boxShadow = '3px 3px 0 rgba(255,107,53,0.4)';
        e.currentTarget.style.transform = 'none';
        onFocus?.(e);
      }}
      onBlur={e => {
        e.currentTarget.style.boxShadow = '2px 2px 0 var(--shadow-color)';
        e.currentTarget.style.transform = '';
        onBlur?.(e);
      }}
      onMouseEnter={e => {
        if (document.activeElement !== e.currentTarget) {
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.transform = 'translate(2px, 2px)';
        }
      }}
      onMouseLeave={e => {
        if (document.activeElement !== e.currentTarget) {
          e.currentTarget.style.boxShadow = '2px 2px 0 var(--shadow-color)';
          e.currentTarget.style.transform = '';
        }
      }}
    />
  );
});

NeoInput.displayName = 'NeoInput';
export default NeoInput;
