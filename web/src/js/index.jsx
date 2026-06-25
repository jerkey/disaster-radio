import '../css/index.scss'
import { h, render } from 'preact'
import Socket from './socket.js'
import cipher from './cipher.js'
import actions from './actions/index.js'
import Chat from './components/chat.jsx'

function renderAll() {
  var container = document.getElementById('container')
  var replace = container.children.length ? container.children[0] : undefined
  render(<Chat state />, container, replace)
}

function init() {
  app.socket = new Socket('/ws', { debug: true })

  app.socket.connect(function(err, isConnected) {
    if(err) console.error(err)
    console.log("connected:", isConnected)
  })

  app.actions = actions

  renderAll()

  try {
    cipher.init()
  } catch(e) {
    console.error(e)
    alert("Fatal error:", e)
  }
}

init()
