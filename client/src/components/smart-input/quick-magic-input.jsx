import { useEffect, useState, useRef, useCallback } from 'react';
import { Input, Button, Space, Typography } from 'antd';
import { useI18n } from '../../i18n/i18n-config.jsx';
import { fetchRules } from '../../api/task-api-client.js';
import ParsedTaskPreviewTable from './parsed-task-preview-table.jsx';
import { useMagicInput } from './use-magic-input.js';

const { Text } = Typography;

/* Highlight first line (project) in purple, duration patterns in green */
function highlightText(text) {
  if (!text) return '';
  const lines = text.split('\n');
  return lines.map((line, i) => {
    if (i === 0) return `<span style="color:var(--accent-color);font-weight:700">${escapeHtml(line)}</span>`;
    return escapeHtml(line).replace(
      /(\d+(?:\.\d+)?)(d|h)/g,
      '<span style="color:var(--highlight-duration);font-weight:700">$1$2</span>'
    );
  }).join('\n');
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const SHARED_FONT = {
  fontFamily: "Google Sans Code", fontSize: 14, lineHeight: '1.6',
  padding: '8px 12px', whiteSpace: 'pre-wrap', wordWrap: 'break-word',
};

export default function QuickMagicInput({ onTasksCreated }) {
  const { t } = useI18n();
  const [customPlaceholder, setCustomPlaceholder] = useState('');
  const textareaRef = useRef(null);
  const highlightRef = useRef(null);
  const {
    rawText, setRawText,
    parsedTasks, feedbackItems, warnings,
    loading, parsed, setParsed,
    handleClose, handleParse, handleTaskEdit,
    handleSave, handleDismissFeedback,
  } = useMagicInput({ onClose: () => {}, onTasksCreated });

  useEffect(() => {
    fetchRules().then(r => setCustomPlaceholder(r.magicPlaceholder || '')).catch(() => {});
  }, []);

  /* Sync scroll between textarea and highlight overlay */
  const handleScroll = useCallback(() => {
    if (highlightRef.current && textareaRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.resizableTextArea?.textArea?.scrollTop || 0;
    }
  }, []);

  const handleKeyDown = (e) => {
    if (e.ctrlKey && e.key === 'Enter') { e.preventDefault(); handleParse(); }
  };

  return (
    <div style={{
      padding: '12px 16px',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 12, color: 'var(--text-primary)', fontFamily: "Google Sans Code" }}>
        {t('magic.title')}
      </Text>

      {/* Syntax-highlighted TextArea */}
      <div style={{ position: 'relative', marginBottom: 12 }}>
        {/* Highlight overlay */}
        <div ref={highlightRef} style={{
          ...SHARED_FONT, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          pointerEvents: 'none', overflow: 'hidden', zIndex: 1,
          border: '2px solid transparent', borderRadius: 4,
          color: 'var(--text-primary)',
        }} dangerouslySetInnerHTML={{ __html: highlightText(rawText) || '&nbsp;' }} />
        {/* Textarea on top — transparent text, visible caret */}
        <textarea
          rows={8}
          value={rawText}
          onChange={e => { setRawText(e.target.value); setParsed(false); }}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          placeholder={customPlaceholder || t('magic.placeholder')}
          style={{
            ...SHARED_FONT, width: '100%', resize: 'vertical',
            border: '2px solid var(--border-color)', borderRadius: 4,
            background: 'transparent', color: 'transparent', caretColor: 'var(--text-primary)',
            position: 'relative', zIndex: 2, outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Parse button + count + hint */}
      <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {parsed && parsedTasks.length > 0 ? (
          <Text type="secondary">{parsedTasks.length} task(s) | {feedbackItems.length} feedback(s)</Text>
        ) : <span />}
        <Button type="primary" onClick={handleParse} loading={loading}
          style={{ border: '2px solid var(--border-color)', boxShadow: '3px 3px 0px var(--shadow-color)', borderRadius: 4, fontWeight: 700 }}>
          {t('magic.parse')}
        </Button>
      </div>
      <Text type="secondary" style={{ fontSize: 11, textAlign: 'right', display: 'block', marginBottom: 12 }}>
        {t('magic.hint_shortcut')}
      </Text>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          {warnings.map((w, i) => <Text key={i} type="warning" style={{ display: 'block' }}>{w}</Text>)}
        </div>
      )}

      {/* Preview + Save */}
      {parsed && parsedTasks.length > 0 && (
        <div style={{ flex: 1, overflow: 'auto' }}>
          <ParsedTaskPreviewTable tasks={parsedTasks} feedbackItems={feedbackItems}
            onEditTask={handleTaskEdit} onDismissFeedback={handleDismissFeedback} />
          <div style={{ marginTop: 12, textAlign: 'right' }}>
            <Space>
              <Button onClick={handleClose}
                style={{ border: '2px solid var(--border-color)', borderRadius: 4, fontWeight: 700 }}>
                {t('magic.cancel')}
              </Button>
              <Button type="primary" onClick={handleSave} loading={loading}
                style={{ border: '2px solid var(--border-color)', boxShadow: '3px 3px 0px var(--shadow-color)', borderRadius: 4, fontWeight: 700 }}>
                {t('magic.save')}
              </Button>
            </Space>
          </div>
        </div>
      )}

      {parsed && parsedTasks.length === 0 && (
        <Text type="secondary">{t('magic.no_tasks')}</Text>
      )}
    </div>
  );
}
