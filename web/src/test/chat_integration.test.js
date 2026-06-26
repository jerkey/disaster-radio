import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Buffer } from 'buffer'

// Set up the global app object the same way ashnazg does,
// so we can test actions without rendering the full component tree.
function makeApp() {
  const app = {
    state: { chat: { messages: [], routes: [] }, user: {} },
    changeState: vi.fn(function(patch) {
      // Simple deep merge for testing
      for (const key of Object.keys(patch)) {
        app.state[key] = Object.assign({}, app.state[key], patch[key])
      }
    }),
  }
  global.app = app
  return app
}

describe('chat actions', () => {
  let app
  let actions

  beforeEach(async () => {
    app = makeApp()
    // Re-import fresh each time so module state doesn't leak
    vi.resetModules()
    const cipher = await import('../js/cipher.js')
    vi.spyOn(cipher.default, 'sign').mockReturnValue(new Uint8Array(64))
    actions = (await import('../js/actions/chat.js')).default
  })

  describe('showMessage', () => {
    it('appends a message with type "remote" by default', () => {
      actions.showMessage('hello from afar')
      expect(app.changeState).toHaveBeenCalledWith({
        chat: { messages: [{ txt: 'hello from afar', type: 'remote' }] }
      })
    })

    it('appends a message with specified type', () => {
      actions.showMessage('you joined', 'status')
      expect(app.changeState).toHaveBeenCalledWith({
        chat: { messages: [{ txt: 'you joined', type: 'status' }] }
      })
    })

    it('accumulates multiple messages', () => {
      actions.showMessage('first')
      actions.showMessage('second')
      expect(app.state.chat.messages).toHaveLength(2)
      expect(app.state.chat.messages[1].txt).toBe('second')
    })
  })

  describe('join', () => {
    it('sets user name in state', () => {
      actions.join('judy')
      expect(app.changeState).toHaveBeenCalledWith({ user: { name: 'judy' } })
    })
  })

  describe('showRoutes', () => {
    it('parses route table hex string into route objects', () => {
      // Two routes: d8a01d69 (mac) + bd4c (hops/metric) + 01ffd8a0 (mac) + 1d69 (hops/metric)
      // Each route is 6 bytes = 12 hex chars
      const dataStr = 'd8a01d69bd4c01ffd8a01d69'
      actions.showRoutes(dataStr)
      const routes = app.changeState.mock.calls[0][0].chat.routes
      expect(routes).toHaveLength(2)
      expect(routes[0].mac).toBe('d8a01d69')
      expect(routes[0].hops).toBe('bd')
      expect(routes[0].metric).toBe('4c')
      expect(routes[1].mac).toBe('01ffd8a0')
    })
  })

  describe('sendMessage', () => {
    beforeEach(() => {
      app.socket = {
        connected: true,
        send: vi.fn((ns, msg, cb) => cb()),  // immediately ACK
      }
    })

    it('sends join message and shows status on first message', async () => {
      await new Promise(resolve => {
        actions.sendMessage('judy', resolve)
      })
      expect(app.state.user.name).toBe('judy')
      expect(app.state.chat.messages[0].type).toBe('status')
      expect(app.state.chat.messages[0].txt).toContain('judy')
    })

    it('sends chat message and shows it as "self" after join', async () => {
      app.state.user = { name: 'judy' }
      await new Promise(resolve => {
        actions.sendMessage('hello everyone', resolve)
      })
      const msgs = app.state.chat.messages
      expect(msgs[0].type).toBe('self')
      expect(msgs[0].txt).toContain('judy')
      expect(msgs[0].txt).toContain('hello everyone')
    })

    it('returns error for whitespace-only message', async () => {
      const err = await new Promise(resolve => {
        actions.sendMessage('   ', resolve)
      })
      expect(err).toBeInstanceOf(Error)
    })

    it('returns socket error when send fails', async () => {
      app.socket.send = vi.fn((ns, msg, cb) => cb(new Error('Not connected')))
      const err = await new Promise(resolve => {
        actions.sendMessage('hello', resolve)
      })
      expect(err.message).toBe('Not connected')
    })
  })
})
