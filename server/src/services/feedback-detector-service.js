import { readRules, readTasks } from '../storage/json-storage-adapter.js';
import { diceSimilarity, containsMatch } from '../utils/string-similarity-utils.js';

// Detect if input text is feedback for an existing task
// Prioritizes non-Done tasks as per requirement
export function detectFeedback(inputText) {
  const rules = readRules();
  const keywords = rules?.feedbackKeywords || [];
  const threshold = rules?.similarityThreshold || 0.6;

  const inputLower = inputText.toLowerCase().trim();

  // Step 1: Check for feedback keyword
  const matchedKeyword = keywords.find(kw => inputLower.includes(kw.toLowerCase()));
  if (!matchedKeyword) {
    return { isFeedback: false };
  }

  // Step 2: Extract task reference by removing keyword
  let taskRef = inputLower.replace(matchedKeyword.toLowerCase(), '').trim();
  // Remove common separators/prepositions
  taskRef = taskRef.replace(/^[\s/\-:]+/, '').trim();

  if (!taskRef) {
    return { isFeedback: false };
  }

  // Step 3: Search existing tasks, prioritize non-Done
  const allTasks = readTasks();
  const activeTasks = allTasks.filter(t => t.status !== 'done');
  const doneTasks = allTasks.filter(t => t.status === 'done');

  // Search active tasks first
  let result = findBestMatch(taskRef, activeTasks, threshold);
  if (!result.match) {
    // Fallback to done tasks
    result = findBestMatch(taskRef, doneTasks, threshold);
  }

  if (result.match) {
    return {
      isFeedback: true,
      targetTask: {
        id: result.match.id,
        name: result.match.name,
        status: result.match.status,
        game: result.match.game,
        project: result.match.project,
      },
      confidence: result.score,
      feedbackContent: inputText,
    };
  }

  return {
    isFeedback: false,
    suggestion: result.closest
      ? { id: result.closest.id, name: result.closest.name }
      : null,
    confidence: result.closestScore || 0,
  };
}

function findBestMatch(taskRef, tasks, threshold) {
  let bestMatch = null;
  let bestScore = 0;
  let closest = null;
  let closestScore = 0;

  for (const task of tasks) {
    // Combine dice + contains for better accuracy
    const dice = diceSimilarity(taskRef, task.name);
    const bonus = containsMatch(taskRef, task.name) ? 0.2 : 0;
    const score = Math.min(dice + bonus, 1);

    if (score > closestScore) {
      closestScore = score;
      closest = task;
    }
    if (score >= threshold && score > bestScore) {
      bestScore = score;
      bestMatch = task;
    }
  }

  return { match: bestMatch, score: bestScore, closest, closestScore };
}
