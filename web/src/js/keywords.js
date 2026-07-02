// Words that trigger audio alerts when seen in chat messages, e.g. "#fire" or "fire".
export const FUN_WORDS = ['duck', 'boom', 'wub']
export const EMERGENCY_WORDS = ['emergency', 'fire']

function escapeRegExp(word) {
  return word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function buildRegex(words) {
  return new RegExp('#(' + words.map(escapeRegExp).join('|') + ')\\b', 'gi')
}

const funRe = buildRegex(FUN_WORDS)
const emergencyRe = buildRegex(EMERGENCY_WORDS)

// Returns [{ word, category }] for every trigger word found in text.
// Only matches hashtagged words (e.g. "#fire"), not bare "fire".
export function findTriggers(text) {
  if (!text) return []
  var triggers = []

  funRe.lastIndex = 0
  var m
  while ((m = funRe.exec(text))) {
    triggers.push({ word: m[1].toLowerCase(), category: 'fun' })
  }

  emergencyRe.lastIndex = 0
  while ((m = emergencyRe.exec(text))) {
    triggers.push({ word: m[1].toLowerCase(), category: 'emergency' })
  }

  return triggers
}
