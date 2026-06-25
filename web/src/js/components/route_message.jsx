import { h } from 'preact'
import { Component } from '../component.js'

export default class RouteMessage extends Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  render() {
    return <div class={this.props.type}>
      {this.props.rts.mac} | {this.props.rts.hops} | {this.props.rts.metric}
    </div>
  }
}
