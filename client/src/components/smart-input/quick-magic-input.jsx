import { useEffect, useState, useCallback, useMemo } from 'react';
import { Typography, message, Select, Input, Checkbox } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useI18n } from '../../i18n/i18n-config.jsx';
import { fetchRules, createTasksBatch, fetchTasks } from '../../api/task-api-client.js';
import dayjs from 'dayjs';

const { Text } = Typography;

const DRAFT_KEY = 'magic-input-draft-v2';
/* Column order: checkbox, name, est, project, type */
const COL_KEYS = ['name', 'est', 'project', 'type'];

function loadDraft() { try { return JSON.parse(localStorage.getItem(DRAFT_KEY)) || null; } catch { return null; } }
function saveDraft(d) { try { localStorage.setItem(DRAFT_KEY, JSON.stringify(d)); } catch {} }
function clearDraft() { try { localStorage.removeItem(DRAFT_KEY); } catch {} }

/* Create empty task row */
function emptyRow(project = '', type = '', rules = {}) {
  const est = rules.defaultEstTime || 1;
  const unit = rules.defaultEstUnit || 'd';
  const start = dayjs().format('YYYY-MM-DD');
  const days = unit === 'h' ? Math.ceil(est / 8) : est;
  const due = dayjs().add(days, 'day').format('YYYY-MM-DD');
  return { name: '', project, type, estTime: est, estUnit: unit, startDate: start, dueDate: due, status: 'todo' };
}

export default function QuickMagicInput({ onTasksCreated }) {
  const { t } = useI18n();
  const [rules, setRules] = useState({});
  const [tasks, setTasks] = useState(() => loadDraft()?.tasks || [emptyRow()]);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [existingProjects, setExistingProjects] = useState([]);
  const [existingTypes, setExistingTypes] = useState([]);

  useEffect(() => {
    fetchRules().then(setRules).catch(() => {});
    fetchTasks().then(all => {
      setExistingProjects([...new Set(all.map(t => t.project).filter(Boolean))]);
      setExistingTypes([...new Set(all.map(t => t.type).filter(Boolean))]);
    }).catch(() => {});
  }, []);

  useEffect(() => { saveDraft({ tasks }); }, [tasks]);

  const projectOptions = useMemo(() =>
    [...new Set([...existingProjects, ...tasks.map(t => t.project).filter(Boolean)])].map(v => ({ value: v, label: v })),
  [existingProjects, tasks]);
  const typeOptions = useMemo(() =>
    [...new Set([...existingTypes, ...tasks.map(t => t.type).filter(Boolean)])].map(v => ({ value: v, label: v })),
  [existingTypes, tasks]);

  const updateTask = useCallback((idx, field, value) => {
    setTasks(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      // Auto-calc dueDate when estTime changes
      if (field === 'estTime' || field === 'estUnit') {
        const row = next[idx];
        const days = row.estUnit === 'h' ? Math.ceil(row.estTime / 8) : row.estTime;
        next[idx].dueDate = dayjs(row.startDate).add(days, 'day').format('YYYY-MM-DD');
      }
      return next;
    });
  }, []);

  const addRow = useCallback(() => {
    const last = tasks[tasks.length - 1];
    setTasks(prev => [...prev, emptyRow(last?.project || '', last?.type || '', rules)]);
  }, [tasks, rules]);

  const removeRow = useCallback((idx) => {
    setTasks(prev => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev);
  }, []);

  const removeSelected = useCallback(() => {
    if (selected.size === 0) return;
    setTasks(prev => {
      const next = prev.filter((_, i) => !selected.has(i));
      return next.length > 0 ? next : [emptyRow('', '', rules)];
    });
    setSelected(new Set());
  }, [selected, rules]);

  const toggleSelect = (idx) => {
    setSelected(prev => { const n = new Set(prev); n.has(idx) ? n.delete(idx) : n.add(idx); return n; });
  };
  const toggleSelectAll = () => {
    setSelected(prev => prev.size === tasks.length ? new Set() : new Set(tasks.map((_, i) => i)));
  };

  /* Keyboard navigation: Arrow/Tab/Enter between cells, Enter on last row = add row */
  const focusCell = (row, col) => {
    setTimeout(() => {
      const cell = document.querySelector(`[data-cell="${row}-${COL_KEYS[col]}"]`);
      if (!cell) return;
      // Try input first, then Select's search input, then open Select
      const input = cell.querySelector('input');
      if (input) { input.focus(); return; }
      const select = cell.querySelector('.ant-select-selector');
      if (select) select.click();
    }, 30);
  };

  const handleCellKeyDown = useCallback((e, rowIdx, colKey) => {
    const colIdx = COL_KEYS.indexOf(colKey);
    if (colIdx < 0) return;

    let nextRow = rowIdx, nextCol = colIdx;

    // Backspace on empty name = remove row; Delete always removes row
    if (tasks.length > 1) {
      const isEmpty = !tasks[rowIdx].name.trim();
      if ((e.key === 'Backspace' && isEmpty && colKey === 'name') || (e.key === 'Delete' && e.shiftKey)) {
        e.preventDefault();
        const nextFocus = Math.min(rowIdx, tasks.length - 2);
        removeRow(rowIdx);
        focusCell(nextFocus, colIdx);
        return;
      }
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (rowIdx === tasks.length - 1) {
        addRow();
        focusCell(tasks.length, 0);
      } else {
        focusCell(rowIdx + 1, colIdx);
      }
      return;
    }
    if (e.key === 'ArrowDown') { nextRow = Math.min(rowIdx + 1, tasks.length - 1); }
    else if (e.key === 'ArrowUp') { nextRow = Math.max(rowIdx - 1, 0); }
    else if (e.key === 'ArrowRight' && e.target.selectionStart === e.target.value?.length) {
      nextCol = Math.min(colIdx + 1, COL_KEYS.length - 1);
    } else if (e.key === 'ArrowLeft' && e.target.selectionStart === 0) {
      nextCol = Math.max(colIdx - 1, 0);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) { nextCol = colIdx - 1; if (nextCol < 0) { nextCol = COL_KEYS.length - 1; nextRow = rowIdx - 1; } }
      else { nextCol = colIdx + 1; if (nextCol >= COL_KEYS.length) { nextCol = 0; nextRow = rowIdx + 1; } }
    } else return;

    if (nextRow === rowIdx && nextCol === colIdx) return;
    if (nextRow < 0 || nextRow >= tasks.length) return;
    e.preventDefault();
    focusCell(nextRow, nextCol);
  }, [tasks, addRow, removeRow]);

  const handleSave = async () => {
    const valid = tasks.filter(t => t.name.trim());
    if (!valid.length) { message.warning('No tasks to save'); return; }
    setLoading(true);
    try {
      await createTasksBatch(valid);
      message.success(`${valid.length} task(s) saved`);
      setTasks([emptyRow('', '', rules)]);
      setSelected(new Set());
      clearDraft();
      onTasksCreated?.();
    } catch (err) {
      message.error('Save failed: ' + (err.response?.data?.error || err.message));
    } finally { setLoading(false); }
  };

  const [rawText, setRawText] = useState('');

  /* Parse raw text into structured rows */
  const parsedPreview = useMemo(() => {
    const lines = rawText.split('\n').filter(l => l.trim());
    if (!lines.length) return { project: '', type: '', items: [] };
    let project = '', type = '', startIdx = 0;
    const ctxMatch = lines[0].match(/^(.+?)\s*[-–]\s*(.+)$/);
    if (ctxMatch && !lines[0].match(/\d+[dh]\s*$/i)) {
      project = ctxMatch[1].trim(); type = ctxMatch[2].trim(); startIdx = 1;
    }
    const items = lines.slice(startIdx).map(line => {
      const m = line.match(/^(.+?)\s+(\d+(?:\.\d+)?)\s*(d|h)\s*$/i);
      if (m) return { name: m[1].trim(), est: `${m[2]}${m[3].toLowerCase()}`, valid: true };
      return { name: line.trim(), est: '', valid: false };
    });
    return { project, type, items };
  }, [rawText]);

  /* Commit parsed text to table */
  const commitRawText = useCallback(() => {
    const { project, type, items } = parsedPreview;
    if (!items.length) return;
    const parsed = items.map(item => {
      const m = item.est.match(/^(\d+(?:\.\d+)?)(d|h)$/i);
      if (m) return { ...emptyRow(project, type, rules), name: item.name, estTime: parseFloat(m[1]), estUnit: m[2].toLowerCase() };
      return { ...emptyRow(project, type, rules), name: item.name };
    });
    setTasks(prev => [...prev.filter(t => t.name.trim()), ...parsed, emptyRow(project, type, rules)]);
    setRawText('');
  }, [parsedPreview, rules]);

  /* Build highlighted HTML for overlay */
  const highlightedHtml = useMemo(() => {
    if (!rawText) return '';
    const lines = rawText.split('\n');
    return lines.map((line, i) => {
      if (!line.trim()) return '<br/>';
      const ctxMatch = line.match(/^(.+?)\s*([-–])\s*(.+)$/);
      if (i === 0 && ctxMatch && !line.match(/\d+[dh]\s*$/i)) {
        return `<span style="color:var(--accent-color);font-weight:900">${ctxMatch[1]}</span><span style="color:var(--text-muted)"> ${ctxMatch[2]} </span><span style="color:var(--highlight-duration);font-weight:700">${ctxMatch[3]}</span>`;
      }
      const m = line.match(/^(.+?)\s+(\d+(?:\.\d+)?)\s*(d|h)\s*$/i);
      if (m) return `<span style="color:var(--text-primary)">${m[1]}</span> <span style="color:var(--highlight-duration);font-weight:900">${m[2]}${m[3]}</span>`;
      return `<span style="color:var(--text-primary)">${line}</span>`;
    }).join('\n');
  }, [rawText]);

  return (
    <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* Magic text area with highlight overlay */}
      <div style={{ position: 'relative', marginBottom: 8, flexShrink: 0 }}>
        <div
          aria-hidden style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, padding: '8px 10px',
            fontFamily: "'JetBrains Mono'", fontSize: 13, lineHeight: '1.5',
            whiteSpace: 'pre-wrap', wordWrap: 'break-word', pointerEvents: 'none',
            border: '2px solid transparent', overflow: 'hidden',
          }}
          dangerouslySetInnerHTML={{ __html: highlightedHtml }}
        />
        <textarea
          rows={10} value={rawText}
          onChange={e => setRawText(e.target.value)}
          placeholder={t('magic.placeholder') || 'Project - Type\nTask A 3d\nTask B 1d'}
          style={{
            width: '100%', fontFamily: "'JetBrains Mono'", fontSize: 13, padding: '8px 10px',
            border: '2px solid var(--border-color)', borderRadius: 2,
            background: rawText ? 'transparent' : 'var(--bg-card)',
            color: rawText ? 'transparent' : 'var(--text-primary)',
            caretColor: 'var(--text-primary)', resize: 'vertical', boxSizing: 'border-box',
            lineHeight: '1.5', position: 'relative', zIndex: 1,
          }}
          onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); commitRawText(); } }}
        />
      </div>
      {/* Live preview of parsed tasks */}
      {parsedPreview.items.length > 0 && (
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6, flexShrink: 0, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {parsedPreview.project && <span style={{ fontWeight: 700, color: 'var(--accent-color)' }}>{parsedPreview.project}</span>}
          {parsedPreview.type && <span style={{ fontWeight: 700, color: 'var(--highlight-duration)' }}>{parsedPreview.type}</span>}
          <span>{parsedPreview.items.length} task(s)</span>
          <span style={{ color: 'var(--text-muted)' }}>Ctrl+Enter to add</span>
        </div>
      )}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <style>{`
          .quick-table { width: 100%; border-collapse: collapse; }
          .quick-table th { background: var(--bg-header); border: 2px solid var(--border-color); padding: 4px 6px; font-weight: 700; font-size: 11px; text-align: left; white-space: nowrap; }
          .quick-table td { border: 2px solid var(--border-color); padding: 2px 4px; vertical-align: middle; }
          .quick-table tr:hover td { background: var(--bg-secondary); }
          .quick-table input, .quick-table .ant-select { font-size: 13px !important; }
          .quick-table .ant-input { border: none !important; box-shadow: none !important; background: transparent !important; outline: none !important; }
          .quick-table .ant-input:focus, .quick-table .ant-input:hover, .quick-table .ant-input-focused { box-shadow: none !important; border: none !important; }
          .quick-table .ant-select-selector { border: none !important; box-shadow: none !important; padding: 0 4px !important; background: transparent !important; min-height: 24px !important; height: 24px !important; }
          .quick-table .ant-select-selection-item { line-height: 24px !important; }
        `}</style>
        <table className="quick-table" style={{
          border: '3px solid var(--border-color)', borderRadius: 2,
          boxShadow: '4px 4px 0px var(--shadow-color)',
        }}>
          <thead>
            <tr>
              <th style={{ width: 28, textAlign: 'center' }}>
                <Checkbox checked={selected.size === tasks.length && tasks.length > 0}
                  indeterminate={selected.size > 0 && selected.size < tasks.length}
                  onChange={toggleSelectAll} />
              </th>
              <th>{t('table.name')}</th>
              <th style={{ width: 45 }}>{t('table.est')}</th>
              <th style={{ width: 85 }}>{t('table.project')}</th>
              <th style={{ width: 85 }}>{t('table.type')}</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task, i) => (
              <tr key={i}>
                <td style={{ textAlign: 'center' }}>
                  <Checkbox checked={selected.has(i)} onChange={() => toggleSelect(i)} />
                </td>
                <td data-cell={`${i}-name`}>
                  <Input size="small" variant="borderless" value={task.name} placeholder="Task name..."
                    onChange={e => updateTask(i, 'name', e.target.value)}
                    onKeyDown={e => handleCellKeyDown(e, i, 'name')}
                    />
                </td>
                <td data-cell={`${i}-est`}>
                  <Input size="small" variant="borderless" defaultValue={`${task.estTime}${task.estUnit}`}
                    key={`${i}-est-${task.estTime}${task.estUnit}`}
                    style={{ width: 50, textAlign: 'center' }}
                    onKeyDown={e => handleCellKeyDown(e, i, 'est')}
                    onBlur={e => {
                      const m = e.target.value.match(/^(\d+(?:\.\d+)?)\s*(d|h)?$/i);
                      if (m) { updateTask(i, 'estTime', parseFloat(m[1])); if (m[2]) updateTask(i, 'estUnit', m[2].toLowerCase()); }
                    }} />
                </td>
                <td data-cell={`${i}-project`}>
                  <Select size="small" variant="borderless" value={task.project || undefined} placeholder="—"
                    onChange={v => updateTask(i, 'project', v)} style={{ width: '100%' }}
                    showSearch allowClear options={projectOptions} dropdownStyle={{ minWidth: 120 }}
                    filterOption={(input, opt) => opt.label.toLowerCase().includes(input.toLowerCase())} />
                </td>
                <td data-cell={`${i}-type`}>
                  <Select size="small" variant="borderless" value={task.type || undefined} placeholder="—"
                    onChange={v => updateTask(i, 'type', v)} style={{ width: '100%' }}
                    showSearch allowClear options={typeOptions} dropdownStyle={{ minWidth: 120 }}
                    filterOption={(input, opt) => opt.label.toLowerCase().includes(input.toLowerCase())} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Hint — always visible */}
      <Text type="secondary" style={{ fontSize: 12, marginTop: 6, textAlign: 'center', flexShrink: 0 }}>
        {t('magic.keyboard_hint')}
      </Text>

      {/* Actions — fixed bottom */}
      <div style={{
        margin: '0 -12px', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderTop: '2px solid var(--border-color)', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {selected.size > 0 && (
            <button className="neo-btn" onClick={removeSelected}
              style={{ padding: '4px 10px', fontSize: 11, fontWeight: 700, background: 'var(--danger-bg)', color: 'var(--nav-active-text)' }}>
              <DeleteOutlined style={{ fontSize: 10 }} /> {selected.size}
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Text type="secondary" style={{ fontSize: 14, fontWeight: 700 }}>
            {tasks.filter(t => t.name.trim()).length} task(s)
          </Text>
          <button className="neo-btn" onClick={handleSave} disabled={loading}
            style={{ background: 'var(--btn-add-bg)', color: 'var(--text-on-accent)', fontWeight: 900, padding: '8px 20px', fontSize: 13 }}>
            {loading ? '...' : t('magic.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
