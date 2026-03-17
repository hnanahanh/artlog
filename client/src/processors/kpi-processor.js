// === PROCESSOR: Chuyen doi du lieu KPI cho hien thi ===
// File nay KHONG import bat ky UI component nao
// Chi chua pure functions, co the test doc lap

/**
 * Chuyen doi du lieu byGame tu object → array cho Ant Design Table
 * Input: { "Pusoy": 5, "Poker": 3 }
 * Output: [{ key: "Pusoy", game: "Pusoy", count: 5 }, ...]
 */
export function transformGameData(byGame) {
  return Object.entries(byGame).map(([game, count]) => ({ key: game, game, count }));
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
 * Flatten byGameTasks → array cho completed tasks table
 * Input: { "Pusoy": ["icon", "anim"], "Poker": ["bg"] }
 * Output: [{ key: "Pusoy-0", name: "icon", game: "Pusoy" }, ...]
 */
export function transformGameTaskList(byGameTasks) {
  const result = [];
  Object.entries(byGameTasks || {}).forEach(([game, tasks]) => {
    tasks.forEach((name, i) => {
      result.push({ key: `${game}-${i}`, name, game });
    });
  });
  return result;
}
