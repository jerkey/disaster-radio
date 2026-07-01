// Words that trigger audio alerts when seen in chat messages, e.g. "#fire" or "fire".
export const FUN_WORDS = ['duck', 'boom', 'wub']
export const EMERGENCY_WORDS = ['emergency', 'fire']

function escapeRegExp(word) {
  return word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function buildRegex(words) {
  return new RegExp('\\b(' + words.map(escapeRegExp).join('|') + ')\\b', 'gi')
}

const funRe = buildRegex(FUN_WORDS)
const emergencyRe = buildRegex(EMERGENCY_WORDS)

// Returns [{ word, category }] for every trigger word found in text.
// Matches whole words only (so "backfire" doesn't match "fire"), and
// ignores a leading "#" so both "fire" and "#fire" match.
export function findTriggers(text) {
  if (!text) return []
  var stripped = text.replace(/#/g, '')
  var triggers = []

  funRe.lastIndex = 0
  var m
  while ((m = funRe.exec(stripped))) {
    triggers.push({ word: m[1].toLowerCase(), category: 'fun' })
  }

  emergencyRe.lastIndex = 0
  while ((m = emergencyRe.exec(stripped))) {
    triggers.push({ word: m[1].toLowerCase(), category: 'emergency' })
  }

  return triggers
}
