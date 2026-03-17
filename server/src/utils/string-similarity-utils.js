// Dice coefficient (bigram similarity) - good for multi-word phrase matching
export function diceSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  if (s1 === s2) return 1;
  if (s1.length < 2 || s2.length < 2) return 0;

  const bigrams1 = getBigrams(s1);
  const bigrams2 = getBigrams(s2);
  const set2 = new Set(bigrams2);

  let intersect = 0;
  for (const b of bigrams1) {
    if (set2.has(b)) intersect++;
  }
  return (2 * intersect) / (bigrams1.length + bigrams2.length);
}

function getBigrams(str) {
  const bigrams = [];
  for (let i = 0; i < str.length - 1; i++) {
    bigrams.push(str.substring(i, i + 2));
  }
  return bigrams;
}

// Also check if str2 is fully contained in str1 (or vice versa)
export function containsMatch(input, taskName) {
  const a = input.toLowerCase().trim();
  const b = taskName.toLowerCase().trim();
  return a.includes(b) || b.includes(a);
}
