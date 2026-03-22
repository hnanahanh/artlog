import { useEffect, useState, useCallback, useMemo } from 'react';
import { Typography, message, Select, Input, Checkbox } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useI18n } from '../../i18n/i18n-config.jsx';
import { fetchRules, createTasksBatch, fetchTasks } from '../../api/task-api-client.js';
import dayjs from 'dayjs';

const { Text } = Typography;

const DRAFT_KEY = 'magic-input-draft-v2';
/* Column order: checkbox, name, est, project, type */
const COL_KEYS = ['name', 'est', 'game', 'project'];

function loadDraft() { try { return JSON.parse(localStorage.getItem(DRAFT_KEY)) || null; } catch { return null; } }
function saveDraft(d) { try { localStorage.setItem(DRAFT_KEY, JSON.stringify(d)); } catch {} }
function clearDraft() { try { localStorage.removeItem(DRAFT_KEY); } catch {} }

/* Create empty task row */
function emptyRow(game = '', project = '', rules = {}) {
  const est = rules.defaultEstTime || 1;
  const unit = rules.defaultEstUnit || 'd';
  const start = dayjs().format('YYYY-MM-DD');
  const days = unit === 'h' ? Math.ceil(est / 8) : est;
  const due = dayjs().add(days, 'day').format('YYYY-MM-DD');
  return { name: '', game, project, estTime: est, estUnit: unit, startDate: start, dueDate: due, status: 'todo' };
}

export default function QuickMagicInput({ onTasksCreated }) {
  const { t } = useI18n();
  const [rules, setRules] = useState({});
  const [tasks, setTasks] = useState(() => loadDraft()?.tasks || [emptyRow()]);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [existingGames, setExistingGames] = useState([]);
  const [existingProjects, setExistingProjects] = useState([]);

  useEffect(() => {
    fetchRules().then(setRules).catch(() => {});
    fetchTasks().then(all => {
      setExistingGames([...new Set(all.map(t => t.game).filter(Boolean))]);
      setExistingProjects([...new Set(all.map(t => t.project).filter(Boolean))]);
    }).catch(() => {});
  }, []);

  useEffect(() => { saveDraft({ tasks }); }, [tasks]);

  const gameOptions = useMemo(() =>
    [...new Set([...existingGames, ...tasks.map(t => t.game).filter(Boolean)])].map(v => ({ value: v, label: v })),
  [existingGames, tasks]);
  const projectOptions = useMemo(() =>
    [...new Set([...existingProjects, ...tasks.map(t => t.project).filter(Boolean)])].map(v => ({ value: v, label: v })),
  [existingProjects, tasks]);

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
    setTasks(prev => [...prev, emptyRow(last?.game || '', last?.project || '', rules)]);
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

  return (
    <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', height: '100%' }}>
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
              <th style={{ width: 85 }}>{t('table.game')}</th>
              <th style={{ width: 85 }}>{t('table.project')}</th>
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
                  <Input size="small" variant="borderless" value={`${task.estTime}${task.estUnit}`}
                    style={{ width: 40, textAlign: 'center' }}
                    onKeyDown={e => handleCellKeyDown(e, i, 'est')}
                    onChange={e => {
                      const m = e.target.value.match(/^(\d+(?:\.\d+)?)\s*(d|h)?$/i);
                      if (m) { updateTask(i, 'estTime', parseFloat(m[1])); if (m[2]) updateTask(i, 'estUnit', m[2].toLowerCase()); }
                    }} />
                </td>
                <td data-cell={`${i}-game`}>
                  <Select size="small" variant="borderless" value={task.game || undefined} placeholder="—"
                    onChange={v => updateTask(i, 'game', v)} style={{ width: '100%' }}
                    showSearch allowClear options={gameOptions} dropdownStyle={{ minWidth: 120 }}
                    filterOption={(input, opt) => opt.label.toLowerCase().includes(input.toLowerCase())} />
                </td>
                <td data-cell={`${i}-project`}>
                  <Select size="small" variant="borderless" value={task.project || undefined} placeholder="—"
                    onChange={v => updateTask(i, 'project', v)} style={{ width: '100%' }}
                    showSearch allowClear options={projectOptions} dropdownStyle={{ minWidth: 120 }}
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
              style={{ padding: '4px 10px', fontSize: 11, fontWeight: 700, background: 'var(--danger-bg)', color: '#fff' }}>
              <DeleteOutlined style={{ fontSize: 10 }} /> {selected.size}
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Text type="secondary" style={{ fontSize: 11 }}>
            {tasks.filter(t => t.name.trim()).length} task(s)
          </Text>
          <button className="neo-btn" onClick={handleSave} disabled={loading}
            style={{ background: 'var(--btn-add-bg)', color: '#222', fontWeight: 900, padding: '8px 20px', fontSize: 13 }}>
            {loading ? '...' : t('magic.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
