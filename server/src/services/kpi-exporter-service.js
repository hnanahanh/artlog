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

  const completed = inRange.filter(t => t.status === 'done');
  const totalEstDays = completed.reduce((sum, t) => {
    return sum + (t.estUnit === 'h' ? t.estTime / 8 : t.estTime);
  }, 0);

  // Group by game (count + task names)
  const byGame = {};
  const byGameTasks = {};
  for (const t of completed) {
    const game = t.game || 'Unknown';
    byGame[game] = (byGame[game] || 0) + 1;
    if (!byGameTasks[game]) byGameTasks[game] = [];
    byGameTasks[game].push(t.name);
  }

  // Group by status (all tasks in range)
  const byStatus = {};
  for (const t of inRange) {
    byStatus[t.status] = (byStatus[t.status] || 0) + 1;
  }

  const feedbackCount = completed.reduce((sum, t) => sum + (t.feedbacks?.length || 0), 0);

  return {
    period: { from, to },
    summary: {
      totalTasks: inRange.length,
      completed: completed.length,
      completionRate: inRange.length > 0
        ? Math.round((completed.length / inRange.length) * 1000) / 10
        : 0,
      totalEstDays: Math.round(totalEstDays * 10) / 10,
      feedbackCount,
      byGame,
      byGameTasks,
      byStatus,
    },
  };
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
