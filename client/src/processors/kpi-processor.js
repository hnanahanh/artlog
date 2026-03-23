// === PROCESSOR: Chuyen doi du lieu KPI cho hien thi ===
// File nay KHONG import bat ky UI component nao
// Chi chua pure functions, co the test doc lap

/**
 * Chuyen doi du lieu byProject tu object → array cho Ant Design Table
 * Input: { "Pusoy": 5, "Poker": 3 }
 * Output: [{ key: "Pusoy", project: "Pusoy", count: 5 }, ...]
 */
export function transformProjectData(byProject) {
  return Object.entries(byProject).map(([project, count]) => ({ key: project, project, count }));
}

/**
 * Chuyen doi du lieu byStatus tu object → array cho Ant Design Table
 * Input: { "done": 5, "in_progress": 3 }
 * Output: [{ key: "done", status: "done", count: 5 }, ...]
 */
export function transformStatusData(byStatus) {
  return Object.entries(byStatus).map(([status, count]) => ({ key: status, status, count }));
}

/**
 * Flatten byProjectTasks → array cho completed tasks table
 * Input: { "Pusoy": ["icon", "anim"], "Poker": ["bg"] }
 * Output: [{ key: "Pusoy-0", name: "icon", project: "Pusoy", type: "" }, ...]
 */
export function transformProjectTaskList(byProjectTasks) {
  const result = [];
  Object.entries(byProjectTasks || {}).forEach(([project, tasks]) => {
    tasks.forEach((name, i) => {
      result.push({ key: `${project}-${i}`, name, project, type: '' });
    });
  });
  return result;
}
