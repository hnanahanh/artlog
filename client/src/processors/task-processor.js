// === PROCESSOR: Xu ly du lieu task ===
// File nay KHONG import bat ky UI component nao
// Chi chua pure functions, co the test doc lap voi du lieu gia lap

/**
 * Kiem tra task co qua han khong (dueDate < hom nay va chua done)
 */
export function isOverdue(task) {
  if (task.status === 'done') return false;
  const today = new Date().toISOString().slice(0, 10);
  return task.dueDate < today;
}

/**
 * Nhom danh sach tasks theo status → { todo: [], in_progress: [], review: [], done: [] }
 */
export function groupByStatus(tasks) {
  const grouped = { todo: [], in_progress: [], review: [], done: [] };
  tasks.forEach(task => {
    if (grouped[task.status]) grouped[task.status].push(task);
  });
  return grouped;
}

/**
 * Phan loai tasks theo ngay: overdue, today, upcoming
 * Dung cho dashboard reminder panel
 */
export function categorizeByDueDate(data) {
  const overdue = (data.overdue || [])
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .map(t => ({ ...t, _type: 'overdue' }));

  const today = (data.today || []).map(t => ({ ...t, _type: 'today' }));

  const upcoming = (data.upcoming || [])
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  return {
    urgentList: [...overdue, ...today],
    upcomingList: upcoming,
  };
}

/**
 * Lay danh sach gia tri duy nhat tu mot truong (dung cho filter cot trong bang)
 * Tra ve format Ant Design: [{ text, value }]
 */
export function extractUniqueValues(tasks, key) {
  return [...new Set(tasks.map(t => t[key]).filter(Boolean))]
    .map(v => ({ text: v, value: v }));
}

/**
 * Chuyen doi thoi gian uoc tinh sang gio (1d = 8h)
 */
export function toHours(task) {
  return task.estUnit === 'd' ? task.estTime * 8 : task.estTime;
}
