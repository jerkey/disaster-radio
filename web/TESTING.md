# Testing

## Why these tests?

The web app runs inside a captive portal on an ESP32 with no internet access. That makes it hard to debug: you can't open DevTools on a phone connected to the node's WiFi, and every bug fix requires reflashing all the devices over USB. A test suite that catches regressions before flashing saves a lot of pain.

The app also has some subtle failure modes that are hard to spot by eye:
- The Vite production build minifies class names, so code that relies on `this.constructor.name` (like ashnazg's state key) silently breaks in the bundle but works fine in the dev server.
- The WebSocket protocol uses a binary 2-byte message ID for ACKs. If that lookup fails, sent messages never appear in the chat — no error, just silence.
- The `<script>` tag is in `<head>` without `defer`, so any DOM access before `DOMContentLoaded` throws.

These are the kinds of bugs that only show up on the real device, not in local dev. Tests that simulate the same conditions catch them before they get flashed.

## What the tests cover

### `src/test/e2e/chat.spec.js` — end-to-end browser tests (Playwright)

Tests the full experience in a real Chromium browser against the dev server simulator. This is the tier that catches bugs that only appear in the browser — DOM timing issues, CSS injection, form submission on mobile, and anything that requires the WebSocket to be live.

Covers:
- Page loads with correct title and dark background (CSS injected by bundle.js)
- Chat input and Send button are visible
- WebSocket connects and incoming messages from the simulator appear
- Joining: enter a name and press Enter or click Send → status message appears, input clears
- Chatting: send a message → appears as "self" with username, input clears
- Whitespace-only message shows an error placeholder without sending
- Route table: node count and MAC/signal bars render after simulator broadcasts a route table

### `src/test/route_message.test.js` — pure functions

`signalBars(metricHex)` and `formatMac(mac)` are pure functions with no side effects. Tests verify the signal strength thresholds (0x40/0x80/0xc0 boundaries) and that MAC addresses are formatted with colons. If the thresholds or formatting ever drift, these fail immediately.

### `socket.test.js` — WebSocket protocol

Tests the binary message format the firmware expects: a 2-byte little-endian sequence number prepended to every message, namespace+pipe+content for the body, and the ACK format (`[id0][id1]!`). Key things tested:

- The URL is built correctly from `window.location`
- Sent messages have the right binary layout
- ACKs are matched back to the right pending callback
- Listener callbacks are dispatched when a matching namespace arrives
- Short messages (< 3 bytes) are safely ignored
- Attempting to send when disconnected calls the callback with an error

### `chat_integration.test.js` — action layer with simulated app state

Tests the chat actions (`showMessage`, `join`, `showRoutes`, `sendMessage`) against a minimal fake `app` object with `state` and `changeState`. This is the layer most likely to break when the global state shape changes.

Specifically covers:
- `showMessage` appends to `app.state.chat.messages` with the right type
- Multiple messages accumulate (not overwrite)
- `showRoutes` parses the binary route table hex string into route objects with `mac`, `hops`, and `metric` fields
- The join flow: first message sets username, sends `~ <name> joined the channel` as a status message
- The chat flow: subsequent messages are formatted as `<name> message` and shown as type `"self"`
- Whitespace-only messages are rejected before sending
- Socket errors from the send callback are surfaced to the caller
