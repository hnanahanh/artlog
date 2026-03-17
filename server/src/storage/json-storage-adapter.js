import { readFileSync, writeFileSync, renameSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', '..', '..', 'data');

export function readJSON(filename) {
  const filepath = join(DATA_DIR, filename);
  if (!existsSync(filepath)) return null;
  const raw = readFileSync(filepath, 'utf-8').trim();
  if (!raw) return null;
  return JSON.parse(raw);
}

export function writeJSON(filename, data) {
  const filepath = join(DATA_DIR, filename);
  // Write to temp file first, then rename for atomic write
  const tmpPath = filepath + '.tmp';
  writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
  renameSync(tmpPath, filepath);
}

export function readTasks() {
  return readJSON('tasks.json')?.tasks || [];
}

export function writeTasks(tasks) {
  writeJSON('tasks.json', { tasks });
}

export function readArchive() {
  return readJSON('archive.json')?.tasks || [];
}

export function writeArchive(tasks) {
  writeJSON('archive.json', { tasks });
}

export function readRules() {
  return readJSON('rules.json');
}

export function writeRules(rules) {
  writeJSON('rules.json', rules);
}

export function readSettings() {
  return readJSON('settings.json');
}

export function writeSettings(settings) {
  writeJSON('settings.json', settings);
}
