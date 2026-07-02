import { describe, it, expect } from 'vitest'
import { findTriggers } from '../js/keywords.js'

describe('findTriggers', () => {
  it('matches a hashtagged fun word', () => {
    expect(findTriggers('somebody say #boom')).toEqual([{ word: 'boom', category: 'fun' }])
  })

  it('matches a hashtagged emergency word', () => {
    expect(findTriggers('there is a #fire near stage 2')).toEqual([{ word: 'fire', category: 'emergency' }])
  })

  it('does not match a bare word without a hashtag', () => {
    expect(findTriggers('somebody say boom')).toEqual([])
    expect(findTriggers('there is a fire near stage 2')).toEqual([])
  })

  it('is case-insensitive', () => {
    expect(findTriggers('#DUCK #duck #DuCk')).toEqual([
      { word: 'duck', category: 'fun' },
      { word: 'duck', category: 'fun' },
      { word: 'duck', category: 'fun' },
    ])
  })

  it('does not match trigger words as substrings of other hashtags', () => {
    expect(findTriggers('#backfire')).toEqual([])
  })

  it('finds multiple distinct triggers in one message', () => {
    expect(findTriggers('#emergency there is also a #wub going on')).toEqual([
      { word: 'wub', category: 'fun' },
      { word: 'emergency', category: 'emergency' },
    ])
  })

  it('returns an empty array for messages with no triggers', () => {
    expect(findTriggers('<judy> hello everyone')).toEqual([])
  })

  it('returns an empty array for empty/undefined input', () => {
    expect(findTriggers('')).toEqual([])
    expect(findTriggers(undefined)).toEqual([])
  })
})
