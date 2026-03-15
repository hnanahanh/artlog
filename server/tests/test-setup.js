import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', '..', 'data');
const backupDir = path.join(__dirname, '..', '.test-backup');

const files = ['tasks.json', 'archive.json', 'rules.json', 'settings.json'];

export function setupTestData() {
  // Create backup directory only once
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });

    // Backup real data only once
    for (const file of files) {
      const src = path.join(dataDir, file);
      const dst = path.join(backupDir, file);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dst);
      }
    }
  }

  // Initialize test data each time
  initializeTestFiles();
}

export function teardownTestData() {
  // Restore backup (run only once at the very end)
  for (const file of files) {
    const src = path.join(backupDir, file);
    const dst = path.join(dataDir, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dst);
    }
  }

  // Clean up backup
  if (fs.existsSync(backupDir)) {
    fs.rmSync(backupDir, { recursive: true });
  }
}

export function initializeTestFiles() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const tasksFile = path.join(dataDir, 'tasks.json');
  const archiveFile = path.join(dataDir, 'archive.json');
  const rulesFile = path.join(dataDir, 'rules.json');
  const settingsFile = path.join(dataDir, 'settings.json');

  fs.writeFileSync(tasksFile, JSON.stringify({ tasks: [] }, null, 2));
  fs.writeFileSync(archiveFile, JSON.stringify({ tasks: [] }, null, 2));
  fs.writeFileSync(rulesFile, JSON.stringify({
    workingDays: [1, 2, 3, 4, 5],
    priorityRules: [],
    prioritySortFallback: 'estTime_desc',
  }, null, 2));
  fs.writeFileSync(settingsFile, JSON.stringify({ hoursPerDay: 8 }, null, 2));
}

export function writeTestTasks(tasks) {
  const tasksFile = path.join(dataDir, 'tasks.json');
  fs.writeFileSync(tasksFile, JSON.stringify({ tasks }, null, 2));
}

export function readTestTasks() {
  const tasksFile = path.join(dataDir, 'tasks.json');
  if (!fs.existsSync(tasksFile)) return [];
  const content = fs.readFileSync(tasksFile, 'utf-8');
  return JSON.parse(content).tasks || [];
}

export function readTestArchive() {
  const archiveFile = path.join(dataDir, 'archive.json');
  if (!fs.existsSync(archiveFile)) return [];
  const content = fs.readFileSync(archiveFile, 'utf-8');
  return JSON.parse(content).tasks || [];
}

export function writeTestArchive(tasks) {
  const archiveFile = path.join(dataDir, 'archive.json');
  fs.writeFileSync(archiveFile, JSON.stringify({ tasks }, null, 2));
}
