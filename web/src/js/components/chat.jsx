import { h } from 'preact'
import { Component } from '../component.js'
import ChatMessage from './chat_message.jsx'
import RouteMessage from './route_message.jsx'

export default class Chat extends Component {
  constructor(props) {
    super(props)
    this.setState({ messages: [], routes: [] })
    this.send = this.send.bind(this)
    this.handleKey = this.handleKey.bind(this)
    app.socket.addListener('c', this.receive)
    app.socket.addListener('r', this.receiveRoutes)
  }

  scrollBottom() {
    var chat = document.getElementById('chat')
    chat.scrollTop = chat.scrollHeight
  }

  receive(namespace, data) {
    app.actions.chat.showMessage(data.toString('utf8'))
  }

  receiveRoutes(namespace, data) {
    var dataStr = ''
    for(var i = 0; i < data.length; i++) {
      var firstHalf = data[i] >> 4
      var secondHalf = data[i] & parseInt(1111, 2)
      dataStr += firstHalf.toString(16) + secondHalf.toString(16)
    }
    app.actions.chat.showRoutes(dataStr)
  }

  send(e) {
    e.preventDefault()
    var inp = document.getElementById('chatInput')
    app.actions.chat.sendMessage(inp.value, function(err) {
      if(err) {
        inp.placeholder = err.message
        return
      }
      inp.value = ''
      inp.placeholder = ''
    })
  }

  handleKey(e) {
    if(e.keyCode === 13) this.send(e)
  }

  componentDidUpdate() {
    this.scrollBottom()
  }

  render() {
    var messages = this.state.messages.map(function(o) {
      return <ChatMessage txt={o.txt} type={o.type} />
    }, this)

    var routes = this.state.routes.map(function(o) {
      return <RouteMessage rts={o} />
    }, this)

    return <div id="chatWrapper">
      <form id="chatForm" action="/chat" method="POST" onsubmit={this.send}>
        <div id="chat">
          {messages}
        </div>
        <div id="routes">
          <div class="routes-header">{routes.length} {routes.length === 1 ? 'node' : 'nodes'} nearby</div>
          {routes}
        </div>
        <div id="chatInputRow">
          <input id="chatInput" type="text" name="msg" placeholder="Enter your name or alias" autofocus onkeydown={this.handleKey} />
          <button type="submit" id="chatSend">&#x2191;</button>
        </div>
      </form>
    </div>
  }
}
