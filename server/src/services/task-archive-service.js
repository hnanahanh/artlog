import { readTasks, writeTasks, readArchive, writeArchive } from '../storage/json-storage-adapter.js';
import { today, daysBetween } from '../utils/date-utils.js';

// Auto-archive: move Done tasks older than N days to archive.json
export function autoArchive(daysThreshold = 30) {
  const tasks = readTasks();
  const archive = readArchive();
  const todayStr = today();

  const toArchive = [];
  const remaining = [];

  for (const task of tasks) {
    if (task.status === 'done' && daysBetween(task.updatedAt, todayStr) >= daysThreshold) {
      toArchive.push(task);
    } else {
      remaining.push(task);
    }
  }

  if (toArchive.length > 0) {
    writeArchive([...archive, ...toArchive]);
    writeTasks(remaining);
  }

  return { archived: toArchive.length };
}
