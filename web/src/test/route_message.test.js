import { describe, it, expect } from 'vitest'

// Extracted from route_message.jsx for testing
function signalBars(metricHex) {
  var m = parseInt(metricHex, 16)
  if (m >= 0xc0) return '[####]'
  if (m >= 0x80) return '[###.]'
  if (m >= 0x40) return '[##..]'
  return '[#...]'
}

function formatMac(mac) {
  return mac.match(/.{2}/g).join(':')
}

describe('signalBars', () => {
  it('returns 4 bars for metric >= 0xc0', () => {
    expect(signalBars('c0')).toBe('[####]')
    expect(signalBars('ff')).toBe('[####]')
  })

  it('returns 3 bars for metric >= 0x80', () => {
    expect(signalBars('80')).toBe('[###.]')
    expect(signalBars('bf')).toBe('[###.]')
  })

  it('returns 2 bars for metric >= 0x40', () => {
    expect(signalBars('40')).toBe('[##..]')
    expect(signalBars('7f')).toBe('[##..]')
  })

  it('returns 1 bar for metric < 0x40', () => {
    expect(signalBars('00')).toBe('[#...]')
    expect(signalBars('3f')).toBe('[#...]')
  })
})

describe('formatMac', () => {
  it('inserts colons between each byte pair', () => {
    expect(formatMac('d8a01d69')).toBe('d8:a0:1d:69')
    expect(formatMac('01ffd8a0')).toBe('01:ff:d8:a0')
  })
})
