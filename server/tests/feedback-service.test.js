import { test } from 'node:test';
import assert from 'node:assert';
import { setupTestData, teardownTestData, writeTestTasks, readTestTasks } from './test-setup.js';
import { addFeedback, deleteFeedback, updateFeedback } from '../src/services/feedback-service.js';

let testSetup = false;

test('feedback-service: setup', () => {
  if (!testSetup) {
    setupTestData();
    testSetup = true;
  }
  assert.ok(true);
});

test('feedback-service: addFeedback - creates feedback', () => {
  writeTestTasks([
    {
      id: 'task_1',
      title: 'Sample task',
      feedbacks: [],
      estTime: 2,
      estUnit: 'd',
      dueDate: '2025-03-20',
      startDate: '2025-03-15',
      status: 'todo',
      updatedAt: '2025-03-15T00:00:00Z',
    },
  ]);

  const result = addFeedback('task_1', 'fix shadow');

  assert.ok(result, 'should return result');
  assert.strictEqual(result.feedback.content, 'fix shadow');
  assert.strictEqual(result.extended, false);

  const updated = readTestTasks();
  assert.strictEqual(updated[0].feedbacks.length, 1);
});

test('feedback-service: addFeedback - extends with 1d estimate', () => {
  writeTestTasks([
    {
      id: 'task_1',
      feedbacks: [],
      estTime: 2,
      estUnit: 'd',
      startDate: '2025-03-15',
      dueDate: '2025-03-20',
      status: 'todo',
      updatedAt: '2025-03-15T00:00:00Z',
    },
  ]);

  const result = addFeedback('task_1', 'implement 1d');

  assert.ok(result);
  assert.strictEqual(result.extended, true);
  assert.strictEqual(result.task.estTime, 3);
});

test('feedback-service: addFeedback - parses 8hrs estimate', () => {
  writeTestTasks([
    {
      id: 'task_1',
      feedbacks: [],
      estTime: 8,
      estUnit: 'h',
      startDate: '2025-03-15',
      dueDate: '2025-03-20',
      status: 'todo',
      updatedAt: '2025-03-15T00:00:00Z',
    },
  ]);

  const result = addFeedback('task_1', 'review 8hrs');

  assert.strictEqual(result.extended, true);
  assert.strictEqual(result.task.estTime, 16);
});

test('feedback-service: addFeedback - parses 2.5days estimate', () => {
  writeTestTasks([
    {
      id: 'task_1',
      feedbacks: [],
      estTime: 1,
      estUnit: 'd',
      startDate: '2025-03-15',
      dueDate: '2025-03-20',
      status: 'todo',
      updatedAt: '2025-03-15T00:00:00Z',
    },
  ]);

  const result = addFeedback('task_1', 'fix api 2.5days');

  assert.strictEqual(result.extended, true);
  assert.strictEqual(result.task.estTime, 3.5);
});

test('feedback-service: addFeedback - invalid taskId returns null', () => {
  writeTestTasks([]);

  const result = addFeedback('nonexistent', 'feedback');

  assert.strictEqual(result, null);
});

test('feedback-service: addFeedback - no time estimate = extended false', () => {
  writeTestTasks([
    {
      id: 'task_1',
      feedbacks: [],
      estTime: 2,
      estUnit: 'd',
      startDate: '2025-03-15',
      dueDate: '2025-03-20',
      status: 'todo',
      updatedAt: '2025-03-15T00:00:00Z',
    },
  ]);

  const result = addFeedback('task_1', 'just a comment');

  assert.strictEqual(result.extended, false);
  assert.strictEqual(result.task.estTime, 2);
});

test('feedback-service: deleteFeedback - removes feedback', () => {
  writeTestTasks([
    {
      id: 'task_1',
      feedbacks: [
        { id: 'fb_001', content: 'fb 1' },
        { id: 'fb_002', content: 'fb 2' },
      ],
      status: 'todo',
      updatedAt: '2025-03-15T00:00:00Z',
    },
  ]);

  const result = deleteFeedback('task_1', 'fb_001');

  assert.ok(result);
  assert.strictEqual(result.task.feedbacks.length, 1);
  assert.strictEqual(result.task.feedbacks[0].id, 'fb_002');
});

test('feedback-service: deleteFeedback - invalid taskId returns null', () => {
  writeTestTasks([]);

  const result = deleteFeedback('nonexistent', 'fb_001');

  assert.strictEqual(result, null);
});

test('feedback-service: deleteFeedback - invalid fbId returns null', () => {
  writeTestTasks([
    {
      id: 'task_1',
      feedbacks: [{ id: 'fb_001', content: 'fb' }],
      status: 'todo',
      updatedAt: '2025-03-15T00:00:00Z',
    },
  ]);

  const result = deleteFeedback('task_1', 'fb_999');

  assert.strictEqual(result, null);
});

test('feedback-service: updateFeedback - updates content', () => {
  writeTestTasks([
    {
      id: 'task_1',
      feedbacks: [{ id: 'fb_001', content: 'old', createdAt: '2025-03-15' }],
      status: 'todo',
      updatedAt: '2025-03-15T00:00:00Z',
    },
  ]);

  const result = updateFeedback('task_1', 'fb_001', { content: 'new' });

  assert.ok(result);
  assert.strictEqual(result.feedback.content, 'new');
});

test('feedback-service: updateFeedback - updates createdAt', () => {
  writeTestTasks([
    {
      id: 'task_1',
      feedbacks: [{ id: 'fb_001', content: 'fb', createdAt: '2025-03-15' }],
      status: 'todo',
      updatedAt: '2025-03-15T00:00:00Z',
    },
  ]);

  const result = updateFeedback('task_1', 'fb_001', { createdAt: '2025-03-16' });

  assert.strictEqual(result.feedback.createdAt, '2025-03-16');
});

test('feedback-service: updateFeedback - invalid taskId returns null', () => {
  writeTestTasks([]);

  const result = updateFeedback('nonexistent', 'fb_001', { content: 'text' });

  assert.strictEqual(result, null);
});

test('feedback-service: updateFeedback - invalid fbId returns null', () => {
  writeTestTasks([
    {
      id: 'task_1',
      feedbacks: [],
      status: 'todo',
      updatedAt: '2025-03-15T00:00:00Z',
    },
  ]);

  const result = updateFeedback('task_1', 'fb_999', { content: 'text' });

  assert.strictEqual(result, null);
});

test('feedback-service: teardown', () => {
  teardownTestData();
  assert.ok(true);
});
