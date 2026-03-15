import { test } from 'node:test';
import assert from 'node:assert';
import { setupTestData, teardownTestData, writeTestTasks, readTestArchive, writeTestArchive } from './test-setup.js';
import { autoArchive } from '../src/services/task-archive-service.js';

let testSetup = false;

test('task-archive-service: setup', () => {
  if (!testSetup) {
    setupTestData();
    testSetup = true;
  }
  assert.ok(true);
});

test('task-archive-service: autoArchive - moves done tasks older than threshold', () => {
  const thirtyThreeDaysAgo = '2026-02-10'; // 33 days before 2026-03-15
  const sevenDaysAgo = '2026-03-08';        // 7 days before 2026-03-15

  writeTestTasks([
    {
      id: 'done_old',
      status: 'done',
      updatedAt: `${thirtyThreeDaysAgo}T10:00:00Z`,
      title: 'Old done task',
    },
    {
      id: 'done_recent',
      status: 'done',
      updatedAt: `${sevenDaysAgo}T10:00:00Z`,
      title: 'Recent done task',
    },
    {
      id: 'todo_old',
      status: 'todo',
      updatedAt: `${thirtyThreeDaysAgo}T10:00:00Z`,
      title: 'Old todo task',
    },
  ]);
  writeTestArchive([]);

  const result = autoArchive(30);

  assert.strictEqual(result.archived, 1);

  const archived = readTestArchive();
  assert.strictEqual(archived.length, 1);
  assert.strictEqual(archived[0].id, 'done_old');
});

test('task-archive-service: autoArchive - keeps non-done tasks', () => {
  const thirtyThreeDaysAgo = '2026-02-10';

  writeTestTasks([
    { id: 'todo', status: 'todo', updatedAt: `${thirtyThreeDaysAgo}T10:00:00Z`, title: 'Old todo' },
    { id: 'in_progress', status: 'in_progress', updatedAt: `${thirtyThreeDaysAgo}T10:00:00Z`, title: 'Old in progress' },
    { id: 'review', status: 'review', updatedAt: `${thirtyThreeDaysAgo}T10:00:00Z`, title: 'Old review' },
  ]);
  writeTestArchive([]);

  const result = autoArchive(30);

  assert.strictEqual(result.archived, 0);
});

test('task-archive-service: autoArchive - no-op when nothing to archive', () => {
  writeTestTasks([
    { id: 't1', status: 'todo', updatedAt: '2026-03-14T10:00:00Z', title: 'Recent' },
  ]);
  writeTestArchive([]);

  const result = autoArchive(30);

  assert.strictEqual(result.archived, 0);
});

test('task-archive-service: autoArchive - custom threshold', () => {
  const tenDaysAgo = '2026-03-05'; // 10 days before 2026-03-15, threshold=5

  writeTestTasks([
    { id: 'done', status: 'done', updatedAt: `${tenDaysAgo}T10:00:00Z`, title: 'Done task' },
  ]);
  writeTestArchive([]);

  const result = autoArchive(5);

  assert.strictEqual(result.archived, 1);

  const archived = readTestArchive();
  assert.strictEqual(archived.length, 1);
});

test('task-archive-service: autoArchive - preserves existing archive', () => {
  const thirtyThreeDaysAgo = '2026-02-10';

  writeTestTasks([
    { id: 'done_new', status: 'done', updatedAt: `${thirtyThreeDaysAgo}T10:00:00Z`, title: 'Done' },
  ]);
  writeTestArchive([
    { id: 'done_old_1', status: 'done', title: 'Previously archived' },
    { id: 'done_old_2', status: 'done', title: 'Previously archived' },
  ]);

  const result = autoArchive(30);

  assert.strictEqual(result.archived, 1);

  const archived = readTestArchive();
  assert.strictEqual(archived.length, 3);
  assert.ok(archived.some(t => t.id === 'done_old_1'));
  assert.ok(archived.some(t => t.id === 'done_old_2'));
  assert.ok(archived.some(t => t.id === 'done_new'));
});

test('task-archive-service: autoArchive - multiple done tasks', () => {
  const thirtyThreeDaysAgo = '2026-02-10'; // 33 days ago
  const fortyDaysAgo = '2026-02-03';       // 40 days ago
  const recentDoneDate = '2026-03-08T10:00:00Z'; // 7 days ago, < 30

  writeTestTasks([
    { id: 'd1', status: 'done', updatedAt: `${thirtyThreeDaysAgo}T10:00:00Z`, title: 'Done 1' },
    { id: 'd2', status: 'done', updatedAt: `${fortyDaysAgo}T10:00:00Z`, title: 'Done 2' },
    { id: 'd3', status: 'done', updatedAt: recentDoneDate, title: 'Done 3 (recent)' },
  ]);
  writeTestArchive([]);

  const result = autoArchive(30);

  assert.strictEqual(result.archived, 2);

  const archived = readTestArchive();
  assert.strictEqual(archived.length, 2);
  assert.ok(archived.some(t => t.id === 'd1'));
  assert.ok(archived.some(t => t.id === 'd2'));
});

test('task-archive-service: teardown', () => {
  teardownTestData();
  assert.ok(true);
});
