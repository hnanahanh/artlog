// === PROCESSOR: Xu ly raw input → parsed tasks ===
// File nay KHONG import bat ky UI component nao
// Chi chua pure functions tach feedback va validate

/**
 * Tach parsed tasks thanh 2 nhom: tasks moi va feedbacks can append
 * @param {Array} parsedTasks - Danh sach tasks da parse
 * @param {Array} feedbackItems - Danh sach feedback detection [{index, detection}]
 * @returns {{ newTasks: Array, feedbacksToAppend: Array }}
 */
export function separateFeedbacks(parsedTasks, feedbackItems) {
  const feedbackIndexes = new Set(feedbackItems.map(fb => fb.index));
  const newTasks = parsedTasks.filter((_, i) => !feedbackIndexes.has(i));
  const feedbacksToAppend = feedbackItems.map(fb => ({
    taskId: fb.detection.targetTask.id,
    content: fb.detection.feedbackContent,
  }));
  return { newTasks, feedbacksToAppend };
}

/**
 * Tao thong bao ket qua sau khi luu
 * @returns {string} Message text
 */
export function buildSaveResultMessage(newTasksCount, feedbacksCount) {
  let msg = `${newTasksCount} task(s) created`;
  if (feedbacksCount > 0) msg += `, ${feedbacksCount} feedback(s) appended`;
  return msg;
}
