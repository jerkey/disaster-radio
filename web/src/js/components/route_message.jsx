import { h } from 'preact'
import { Component } from '../component.js'

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

export default class RouteMessage extends Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  render() {
    var rts = this.props.rts
    var hops = parseInt(rts.hops, 16)
    var hopLabel = hops === 1 ? '1 hop' : hops + ' hops'

    return <div class="route-entry">
      <span class="route-mac">{formatMac(rts.mac)}</span>
      <span class="route-signal">{signalBars(rts.metric)}</span>
      <span class="route-hops">{hopLabel}</span>
    </div>
  }
}
