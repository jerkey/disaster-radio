import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Buffer } from 'buffer'
import Socket from '../js/socket.js'

// Minimal WebSocket mock
function makeWsMock() {
  return {
    readyState: 1,
    binaryType: null,
    onopen: null,
    onerror: null,
    onclose: null,
    onmessage: null,
    send: vi.fn(),
  }
}

beforeEach(() => {
  global.WebSocket = vi.fn(() => makeWsMock())
  global.window = { location: { protocol: 'http:', host: '192.168.4.1' }, document: { location: { host: '192.168.4.1' } } }
})

describe('Socket', () => {
  it('constructs ws:// URL from window location', () => {
    const s = new Socket('/ws')
    expect(s.url).toBe('ws://192.168.4.1/ws')
  })

  it('sends binary message with 2-byte LE ID prefix', () => {
    const s = new Socket('/ws')
    s.connected = true
    const mockWs = makeWsMock()
    s.socket = mockWs

    s.send('c', 'hello', () => {})

    expect(mockWs.send).toHaveBeenCalledOnce()
    const sent = Buffer.from(mockWs.send.mock.calls[0][0])
    // First 2 bytes are the message ID (little-endian)
    expect(sent[0]).toBe(0)
    expect(sent[1]).toBe(0)
    // Rest is namespace|message
    expect(sent.slice(2).toString('utf8')).toBe('c|hello')
  })

  it('returns error to callback when not connected', () => {
    const s = new Socket('/ws')
    s.connected = false
    const cb = vi.fn()
    s.send('c', 'hello', cb)
    expect(cb).toHaveBeenCalledWith(expect.any(Error))
    expect(cb.mock.calls[0][0].message).toMatch(/not connected/i)
  })

  it('calls listener callback when matching message received', () => {
    const s = new Socket('/ws')
    const cb = vi.fn()
    s.addListener('c', cb)

    // Simulate incoming message: [id0][id1]c|hello
    const msg = Buffer.concat([Buffer.from([0x00, 0x00]), Buffer.from('c|hello', 'utf8')])
    s._gotMessage({ data: msg.buffer })

    expect(cb).toHaveBeenCalledOnce()
    const [namespace, data] = cb.mock.calls[0]
    expect(namespace.toString('utf8')).toBe('c')
    expect(data.toString('utf8')).toBe('hello')
  })

  it('resolves ACK and calls send callback', () => {
    const s = new Socket('/ws')
    s.connected = true
    const mockWs = makeWsMock()
    s.socket = mockWs

    const cb = vi.fn()
    s.send('c', 'hello', cb)

    // Simulate ACK: [id0][id1]!
    const ack = Buffer.from([0x00, 0x00, 0x21]) // 0x21 = '!'
    s._gotMessage({ data: ack.buffer })

    expect(cb).toHaveBeenCalledWith()  // called with no error
  })

  it('ignores messages shorter than 3 bytes', () => {
    const s = new Socket('/ws')
    const cb = vi.fn()
    s.addListener('c', cb)

    const short = Buffer.from([0x00, 0x00])
    s._gotMessage({ data: short.buffer })

    expect(cb).not.toHaveBeenCalled()
  })
})
