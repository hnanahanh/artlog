import { test } from 'node:test';
import assert from 'node:assert';
import { setupTestData, teardownTestData, writeTestTasks } from './test-setup.js';
import { getTasks, getTodayTasks, getTasksByDateRange } from '../src/services/task-query-service.js';

let testSetup = false;

test('task-query-service: setup', () => {
  if (!testSetup) {
    setupTestData();
    testSetup = true;
  }
  assert.ok(true);
});

test('task-query-service: getTasks - returns all tasks', () => {
  writeTestTasks([
    { id: 't1', title: 'Task 1', status: 'todo', estTime: 2, estUnit: 'd' },
    { id: 't2', title: 'Task 2', status: 'in_progress', estTime: 1, estUnit: 'd' },
    { id: 't3', title: 'Task 3', status: 'done', estTime: 3, estUnit: 'd' },
  ]);

  const result = getTasks();

  assert.strictEqual(result.length, 3);
  assert.ok(result.every(t => ['t1', 't2', 't3'].includes(t.id)));
});

test('task-query-service: getTasks - filters by status', () => {
  writeTestTasks([
    { id: 't1', title: 'Task 1', status: 'todo', estTime: 2, estUnit: 'd' },
    { id: 't2', title: 'Task 2', status: 'in_progress', estTime: 1, estUnit: 'd' },
    { id: 't3', title: 'Task 3', status: 'done', estTime: 3, estUnit: 'd' },
  ]);

  const result = getTasks({ status: 'todo' });

  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].id, 't1');
});

test('task-query-service: getTasks - filters by game (case insensitive)', () => {
  writeTestTasks([
    { id: 't1', title: 'Task 1', game: 'Elden Ring', status: 'todo', estTime: 2, estUnit: 'd' },
    { id: 't2', title: 'Task 2', game: 'Dark Souls', status: 'todo', estTime: 1, estUnit: 'd' },
    { id: 't3', title: 'Task 3', game: 'ELDEN RING', status: 'todo', estTime: 3, estUnit: 'd' },
  ]);

  const result = getTasks({ game: 'elden ring' });

  assert.strictEqual(result.length, 2);
  assert.ok(result.every(t => t.game.toLowerCase() === 'elden ring'));
});

test('task-query-service: getTasks - filters by project (case insensitive)', () => {
  writeTestTasks([
    { id: 't1', title: 'Task 1', project: 'Frontend', status: 'todo', estTime: 2, estUnit: 'd' },
    { id: 't2', title: 'Task 2', project: 'Backend', status: 'todo', estTime: 1, estUnit: 'd' },
    { id: 't3', title: 'Task 3', project: 'FRONTEND', status: 'todo', estTime: 3, estUnit: 'd' },
  ]);

  const result = getTasks({ project: 'frontend' });

  assert.strictEqual(result.length, 2);
  assert.ok(result.every(t => t.project.toLowerCase() === 'frontend'));
});

test('task-query-service: getTasks - returns sorted by priority', () => {
  writeTestTasks([
    { id: 't1', title: 'Task 1', status: 'todo', estTime: 2, estUnit: 'd' },
    { id: 't2', title: 'Task 2', status: 'todo', estTime: 4, estUnit: 'd' },
    { id: 't3', title: 'Task 3', status: 'todo', estTime: 1, estUnit: 'd' },
  ]);

  const result = getTasks();

  assert.strictEqual(result[0].id, 't2');
  assert.strictEqual(result[result.length - 1].id, 't3');
});

test('task-query-service: getTodayTasks - categorizes today/overdue/upcoming', () => {
  writeTestTasks([
    {
      id: 't_today_1',
      status: 'todo',
      startDate: '2026-03-10',
      dueDate: '2026-03-20',
      estTime: 1,
      estUnit: 'd',
    },
    {
      id: 't_overdue',
      status: 'in_progress',
      startDate: '2026-03-05',
      dueDate: '2026-03-10',
      estTime: 1,
      estUnit: 'd',
    },
    {
      id: 't_upcoming',
      status: 'todo',
      startDate: '2026-03-20',
      dueDate: '2026-03-25',
      estTime: 1,
      estUnit: 'd',
    },
    {
      id: 't_done',
      status: 'done',
      startDate: '2026-03-10',
      dueDate: '2026-03-20',
      estTime: 1,
      estUnit: 'd',
    },
  ]);

  const result = getTodayTasks();

  assert.ok(result.today.some(t => t.id === 't_today_1'), 'today should include t_today_1');
  assert.ok(result.overdue.some(t => t.id === 't_overdue'), 'overdue should include t_overdue');
  assert.ok(result.upcoming.some(t => t.id === 't_upcoming'), 'upcoming should include t_upcoming');
  assert.ok(!result.today.some(t => t.id === 't_done'), 'done tasks should be excluded');
});

test('task-query-service: getTodayTasks - limits upcoming to 10 items', () => {
  const upcoming = Array.from({ length: 15 }, (_, i) => ({
    id: `upcoming_${i}`,
    status: 'todo',
    startDate: `2026-04-${String(i + 1).padStart(2, '0')}`,
    dueDate: `2026-04-${String(i + 5).padStart(2, '0')}`,
    estTime: 1,
    estUnit: 'd',
  }));

  writeTestTasks(upcoming);

  const result = getTodayTasks();

  assert.strictEqual(result.upcoming.length, 10);
});

test('task-query-service: getTasksByDateRange - overlap logic', () => {
  writeTestTasks([
    {
      id: 't_overlap_1',
      startDate: '2025-03-10',
      dueDate: '2025-03-18',
      estTime: 1,
      estUnit: 'd',
    },
    {
      id: 't_overlap_2',
      startDate: '2025-03-15',
      dueDate: '2025-03-25',
      estTime: 1,
      estUnit: 'd',
    },
    {
      id: 't_no_overlap_1',
      startDate: '2025-03-05',
      dueDate: '2025-03-10',
      estTime: 1,
      estUnit: 'd',
    },
    {
      id: 't_no_overlap_2',
      startDate: '2025-03-25',
      dueDate: '2025-03-30',
      estTime: 1,
      estUnit: 'd',
    },
  ]);

  const result = getTasksByDateRange('2025-03-15', '2025-03-20');

  assert.strictEqual(result.length, 2);
  assert.ok(result.some(t => t.id === 't_overlap_1'));
  assert.ok(result.some(t => t.id === 't_overlap_2'));
  assert.ok(!result.some(t => t.id === 't_no_overlap_1'));
  assert.ok(!result.some(t => t.id === 't_no_overlap_2'));
});

test('task-query-service: getTasksByDateRange - no tasks in range', () => {
  writeTestTasks([
    { id: 't1', startDate: '2025-03-05', dueDate: '2025-03-10', estTime: 1, estUnit: 'd' },
    { id: 't2', startDate: '2025-03-25', dueDate: '2025-03-30', estTime: 1, estUnit: 'd' },
  ]);

  const result = getTasksByDateRange('2025-03-15', '2025-03-20');

  assert.strictEqual(result.length, 0);
});

test('task-query-service: teardown', () => {
  teardownTestData();
  assert.ok(true);
});
