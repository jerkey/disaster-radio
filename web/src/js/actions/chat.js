import cipher from '../cipher.js'

var self = {

  showMessage: function(txt, type) {
    if(!type) type = 'remote'
    var msgs = app.state.chat.messages ? app.state.chat.messages.slice(0) : []
    msgs.push({ txt, type })
    app.changeState({ chat: { messages: msgs } })
  },

  join: function(nick) {
    app.changeState({ user: { name: nick } })
  },

  showRoutes: function(data) {
    var length = data.length
    var routeTable = []
    for(var i = 0; i < length * (1 / 16); i++) {
      routeTable[i] = {
        mac: data.slice(i * 16, (i * 16) + 12),
        hops: data.slice((i * 16) + 12, (i * 16) + 14),
        metric: data.slice((i * 16) + 14, (i * 16) + 16),
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
