import { h } from 'preact'
import { Component } from '../component.js'

export default class ChatMessage extends Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  render() {
    return <div class={this.props.type}>
      <span>{this.props.txt}</span>
    </div>
  }
}
