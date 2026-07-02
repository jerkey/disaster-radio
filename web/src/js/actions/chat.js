import cipher from '../cipher.js'
import soundboard from '../soundboard.js'

var self = {

  showMessage: function(txt, type) {
    if(!type) type = 'remote'
    var msgs = app.state.chat.messages ? app.state.chat.messages.slice(0) : []
    msgs.push({ txt, type })
    app.changeState({ chat: { messages: msgs } })
    // Skip the "<nick> " prefix so a nickname like "#duck" doesn't
    // re-trigger the duck sound on every message that nick sends.
    // Status messages (e.g. "~ nick joined the channel") aren't scanned at all.
    if(type !== 'status') {
      soundboard.handleMessage(txt.replace(/^<[^>]*>\s?/, ''))
    }
  },

  join: function(nick) {
    app.changeState({ user: { name: nick } })
  },

  showRoutes: function(data) {
    var length = data.length
    var routeTable = []
    for(var i = 0; i < Math.floor(length / 12); i++) {
      routeTable[i] = {
        mac: data.slice(i * 12, (i * 12) + 8),
        hops: data.slice((i * 12) + 8, (i * 12) + 10),
        metric: data.slice((i * 12) + 10, (i * 12) + 12),
      }
    }
    app.changeState({ chat: { routes: routeTable } })
  },

  sendMessage: function(msg, cb) {
    if(!msg.trim()) return cb(new Error("You must supply a (non-whitespace) message/nick"))

    var type = 'self'

    if(!app.state.user || !app.state.user.name) {
      self.join(msg)
      msg = '~ ' + msg + ' joined the channel'
      type = 'status'
    } else {
      msg = '<' + app.state.user.name + '> ' + msg
    }

    var signature = cipher.sign(msg)
    console.log("Signature:", signature)

    app.socket.send('c', msg, function(err) {
      if(err) {
        console.error("Failed to send:", err)
        return cb(err)
      }
      self.showMessage(msg, type)
      cb()
    })
  }
}

export default self
