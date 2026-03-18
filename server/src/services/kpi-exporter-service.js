import * as XLSX from 'xlsx';
import { readTasks, readArchive, readRules } from '../storage/json-storage-adapter.js';

// Generate KPI summary for a date range
export function generateKPI(from, to) {
  const tasks = [...readTasks(), ...readArchive()];

  // Filter tasks completed within the date range
  const inRange = tasks.filter(t => {
    if (!t.updatedAt) return false;
    const updated = t.updatedAt.substring(0, 10);
    return updated >= from && updated <= to;
  });

  const today = new Date().toISOString().substring(0, 10);
  const completed = inRange.filter(t => t.status === 'done');
  const overdue = inRange.filter(t => t.status !== 'done' && t.dueDate && t.dueDate < today);
  const totalEstDays = completed.reduce((sum, t) => {
    return sum + (t.estUnit === 'h' ? t.estTime / 8 : t.estTime);
  }, 0);

  // Group all tasks by game, project, and collect details
  const byGame = {};
  const byProject = {};
  const byGameTasks = {};
  const completedDetails = [];
  for (const t of inRange) {
    const game = t.game || 'Unknown';
    const project = t.project || 'Unknown';
    byGame[game] = (byGame[game] || 0) + 1;
    byProject[project] = (byProject[project] || 0) + 1;
    if (t.status === 'done') {
      if (!byGameTasks[game]) byGameTasks[game] = [];
      byGameTasks[game].push(t.name);
      completedDetails.push({
        name: t.name, game, project: t.project || '',
        estTime: t.estTime || 0, estUnit: t.estUnit || 'd',
      });
    }
  }

  // Group by status (all tasks in range)
  const byStatus = {};
  for (const t of inRange) {
    byStatus[t.status] = (byStatus[t.status] || 0) + 1;
  }

  const feedbackCount = completed.reduce((sum, t) => sum + (t.feedbacks?.length || 0), 0);
  const overdueRate = inRange.length > 0
    ? Math.round((overdue.length / inRange.length) * 1000) / 10 : 0;

  return {
    period: { from, to },
    summary: {
      totalTasks: inRange.length,
      completed: completed.length,
      overdueCount: overdue.length,
      overdueRate,
      completionRate: inRange.length > 0
        ? Math.round((completed.length / inRange.length) * 1000) / 10
        : 0,
      totalEstDays: Math.round(totalEstDays * 10) / 10,
      feedbackCount,
      byGame,
      byProject,
      byGameTasks,
      byStatus,
      completedDetails,
    },
  };
}

// --- Border helper ---
const BORDER = {
  top: { style: 'thin' }, bottom: { style: 'thin' },
  left: { style: 'thin' }, right: { style: 'thin' },
};
const HEADER_FILL = { fgColor: { rgb: 'D9D9D9' }, patternType: 'solid' };
const ACCENT_FILL = { fgColor: { rgb: 'C47DFF' }, patternType: 'solid' };

function cellStyle(bold = false, fill = null, align = 'left') {
  return {
    font: { bold, name: 'Arial', sz: 11 },
    border: BORDER,
    fill: fill || { patternType: 'none' },
    alignment: { horizontal: align, vertical: 'center', wrapText: true },
  };
}

function setCell(ws, col, row, value, style) {
  const ref = XLSX.utils.encode_cell({ c: col, r: row });
  ws[ref] = { v: value, t: typeof value === 'number' ? 'n' : 's', s: style };
}

function setRange(ws, r1c1, r2c2) {
  if (!ws['!ref']) {
    ws['!ref'] = XLSX.utils.encode_range(r1c1, r2c2);
  } else {
    const cur = XLSX.utils.decode_range(ws['!ref']);
    const ext = { s: r1c1, e: r2c2 };
    ws['!ref'] = XLSX.utils.encode_range({
      s: { r: Math.min(cur.s.r, ext.s.r), c: Math.min(cur.s.c, ext.s.c) },
      e: { r: Math.max(cur.e.r, ext.e.r), c: Math.max(cur.e.c, ext.e.c) },
    });
  }
}

// Build .xlsx workbook mirroring KPI dashboard layout
export function kpiToExcel(kpiData) {
  const { summary, period } = kpiData;
  const rules = readRules();
  const mapping = rules.objectiveMapping || {};
  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Summary ──────────────────────────────────────────────
  const ws1 = { '!cols': [{ wch: 28 }, { wch: 18 }] };
  let r = 0;

  // Title row
  setCell(ws1, 0, r, `KPI Report: ${period.from} → ${period.to}`,
    { font: { bold: true, sz: 14 }, alignment: { horizontal: 'left' } });
  r++;

  // Stat cards (mirroring dashboard)
  const stats = [
    ['Tổng task', summary.totalTasks],
    ['Hoàn thành', summary.completed],
    ['Tỷ lệ hoàn thành (%)', summary.completionRate],
    ['Quá hạn', summary.overdueCount],
    ['Tỷ lệ quá hạn (%)', summary.overdueRate],
    ['Ngày ước tính', summary.totalEstDays],
    ['Feedback', summary.feedbackCount],
  ];
  setCell(ws1, 0, r, 'Chỉ số', cellStyle(true, HEADER_FILL, 'center'));
  setCell(ws1, 1, r, 'Giá trị', cellStyle(true, HEADER_FILL, 'center'));
  r++;
  for (const [label, val] of stats) {
    setCell(ws1, 0, r, label, cellStyle(false));
    setCell(ws1, 1, r, val, cellStyle(true, null, 'center'));
    r++;
  }

  r++;
  // By Game
  setCell(ws1, 0, r, 'Theo Game', cellStyle(true, HEADER_FILL));
  setCell(ws1, 1, r, 'Số task', cellStyle(true, HEADER_FILL, 'center'));
  r++;
  for (const [game, count] of Object.entries(summary.byGame || {})) {
    setCell(ws1, 0, r, game, cellStyle(false));
    setCell(ws1, 1, r, count, cellStyle(false, null, 'center'));
    r++;
  }

  r++;
  // By Project
  setCell(ws1, 0, r, 'Theo Project', cellStyle(true, HEADER_FILL));
  setCell(ws1, 1, r, 'Số task', cellStyle(true, HEADER_FILL, 'center'));
  r++;
  for (const [proj, count] of Object.entries(summary.byProject || {})) {
    setCell(ws1, 0, r, proj, cellStyle(false));
    setCell(ws1, 1, r, count, cellStyle(false, null, 'center'));
    r++;
  }

  setRange(ws1, { r: 0, c: 0 }, { r: r - 1, c: 1 });
  XLSX.utils.book_append_sheet(wb, ws1, 'Summary');

    // ── Sheet 2: Completed Tasks — mirrors KPI dashboard table ────────
  const ws2 = {
    '!cols': [{ wch: 18 }, { wch: 8 }, { wch: 20 }, { wch: 40 }, { wch: 8 }],
  };

  // Sort by game to group rows
  const sortedDetails = [...(summary.completedDetails || [])].sort((a, b) =>
    (a.game || '').localeCompare(b.game || ''),
  );

  // Largest remainder KPI% per game (same logic as dashboard)
  const games2 = [...new Set(sortedDetails.map(r => r.game).filter(Boolean))];
  const exact2 = 100 / (games2.length || 1);
  const floors2 = games2.map(() => Math.floor(exact2));
  const leftover2 = 100 - floors2.reduce((s, v) => s + v, 0);
  games2.map((_, i) => ({ i, r: exact2 - floors2[i] }))
    .sort((a, b) => b.r - a.r).slice(0, leftover2).forEach(({ i }) => floors2[i]++);
  const kpiMap2 = Object.fromEntries(games2.map((g, i) => [g, floors2[i]]));

  // Compute row spans for game column
  const gameSpans = sortedDetails.map((row, i) => {
    if (i > 0 && row.game === sortedDetails[i - 1].game) return 0;
    let span = 1;
    while (i + span < sortedDetails.length && sortedDetails[i + span].game === row.game) span++;
    return span;
  });

  // Columns: Game | KPI% | Project | Tên Task | Est.
  const GAME_FILL = { fgColor: { rgb: 'F3E6FF' }, patternType: 'solid' };
  const headers2 = ['Game', 'KPI %', 'Project', 'Tên Task', 'Est.'];
  headers2.forEach((h, c) => setCell(ws2, c, 0, h, cellStyle(true, HEADER_FILL, 'center')));

  const merges2 = [];
  sortedDetails.forEach((t, i) => {
    const row = i + 1;
    const span = gameSpans[i];
    if (span > 0) {
      setCell(ws2, 0, row, t.game || '', cellStyle(true, GAME_FILL, 'center'));
      setCell(ws2, 1, row, `${kpiMap2[t.game] ?? 0}%`, cellStyle(true, GAME_FILL, 'center'));
      if (span > 1) {
        merges2.push({ s: { r: row, c: 0 }, e: { r: row + span - 1, c: 0 } });
        merges2.push({ s: { r: row, c: 1 }, e: { r: row + span - 1, c: 1 } });
      }
    }
    setCell(ws2, 2, row, t.project || '', cellStyle(false));
    setCell(ws2, 3, row, t.name, cellStyle(false));
    const estStr = t.estTime ? (t.estUnit === 'h' ? `${t.estTime}h` : `${t.estTime}d`) : '—';
    setCell(ws2, 4, row, estStr, cellStyle(false, null, 'center'));
  });

  ws2['!merges'] = merges2;
  setRange(ws2, { r: 0, c: 0 }, { r: sortedDetails.length, c: 4 });
  XLSX.utils.book_append_sheet(wb, ws2, 'Completed Tasks');

  // ── Sheet 3: Objectives (KPI template) ────────────────────────────
  const ws3 = {
    '!cols': [{ wch: 40 }, { wch: 12 }, { wch: 30 }, { wch: 12 }, { wch: 24 }, { wch: 16 }],
  };
  const headers3 = ['Objective (*)', 'Tỷ trọng OBJ (%)', 'KPI (*)', 'Tỷ trọng KPI (%)', 'Nhân viên tự nhận xét (*)', 'Nhân viên đánh giá (*)'];
  headers3.forEach((h, c) => setCell(ws3, c, 0, h, cellStyle(true, ACCENT_FILL, 'center')));
  Object.entries(summary.byGameTasks || {}).forEach(([game, tasks], i) => {
    const label = mapping[game] || game;
    setCell(ws3, 0, i + 1, `${label} — ${tasks.join(', ')}`, cellStyle(false));
    for (let c = 1; c < 6; c++) setCell(ws3, c, i + 1, '', cellStyle(false));
  });
  const objLen = Object.keys(summary.byGameTasks || {}).length;
  setRange(ws3, { r: 0, c: 0 }, { r: objLen, c: 5 });
  XLSX.utils.book_append_sheet(wb, ws3, 'Objectives');

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx', cellStyles: true });
}

// Escape CSV value (handle commas, quotes, newlines)
function escapeCSV(val) {
  if (!val) return '';
  const str = String(val);
  return (str.includes(',') || str.includes('"') || str.includes('\n'))
    ? `"${str.replace(/"/g, '""')}"` : str;
}

// Convert KPI to CSV string — 6-column evaluation template
export function kpiToCSV(kpiData) {
  const { summary, period } = kpiData;
  const rules = readRules();
  const mapping = rules.objectiveMapping || {};

  const headers = [
    'Objective (*)',
    'Tỷ trọng Objective (%)*',
    'KPI (*)',
    'Tỷ trọng KPI (%)*',
    'Nhân viên tự nhận xét (*)',
    'Nhân viên đánh giá (*)',
  ];

  const rows = [headers.join(',')];

  // Each game = 1 row
  for (const [game, tasks] of Object.entries(summary.byGameTasks || {})) {
    const label = mapping[game] || game;
    const objective = `${label} - ${tasks.join(', ')}`;
    rows.push([escapeCSV(objective), '', '', '', '', ''].join(','));
  }

  // Summary footer
  rows.push('');
  rows.push(`Period: ${period.from} → ${period.to}`);
  rows.push(`Total: ${summary.totalTasks} tasks | Completed: ${summary.completed} | Rate: ${summary.completionRate}%`);

  return rows.join('\n');
}
