
This is the web app served up by the Disaster Radio firmware + the simulator web server.

# Dependencies

This web app uses [Vite](https://vite.dev/) for building. It requires Node.js 22 LTS. It is recommended to use [nvm](https://github.com/nvm-sh/nvm#installing-and-updating) to manage your Node version.

If you have `nvm` installed:
```
nvm install 22
nvm use 22
```

# Setup

```
npm install
cp settings.js.example settings.js
```

# Building and running

```
npm run build  # build the js and css
npm start      # run the simulator server
```

Then open http://localhost:8000/ in a browser.

# Developing

```
npm run dev
```

This starts both the WebSocket simulator (port 8000) and the Vite dev server (port 5173) with hot reload. Open http://localhost:5173/ while developing.

# Websocket

The disaster.radio firmware opens up a websocket using [the ESPAsyncWebServer library](https://github.com/me-no-dev/ESPAsyncWebServer). Through this, client-side javascript can transmit and receive messages over the LoRa tranceiver. If you'd like to build an application for disaster.radio, you could write a websocket client that sends and receives messages in the same format. Currently, the firmware expects websocket messages in the following format:   
`<msgID><msgType>|<msg>`  
where,
* `<msgID>` is a two-byte binary unsigned integer representing an abitrary sequence number, this is sent back to the websocket client with an `!` appended to act as an acknowledgment and could be used for error-checking,  
* `<msgType>` is a single binary utf8 encoded character representing the application for which the message is intended, such 'c' for chat, 'm' for maps, or 'e' for events  
* `<msg>` is a binary utf8 encoded string of characters limited to 236 bytes, this can be treated as the body of the message and may be used to handle client-side concerns, such as intended recipient or requested map tile.    

An example messge may appear as follows,
`0100c|<noffle>@juul did you feel that earthquake!`

Alternatively, you could write another Layer3 client for as part of the disater radio firmware and create your own Layer 4 message format. See more about our networkng stack on our wiki, https://github.com/sudomesh/disaster-radio/wiki/Layered-Model.

# Testing

## Running the tests

```
npm test
```

This runs all tests once and exits — good for CI. To run in watch mode while developing:

```
npm run test:watch
```

Tests run automatically on GitHub Actions whenever files under `web/` change.

## Why these tests?

The web app runs inside a captive portal on an ESP32 with no internet access. That makes it hard to debug: you can't open DevTools on a phone connected to the node's WiFi, and every bug fix requires reflashing all the devices over USB. A test suite that catches regressions before flashing saves a lot of pain.

The app also has some subtle failure modes that are hard to spot by eye:
- The Vite production build minifies class names, so code that relies on `this.constructor.name` (like ashnazg's state key) silently breaks in the bundle but works fine in the dev server.
- The WebSocket protocol uses a binary 2-byte message ID for ACKs. If that lookup fails, sent messages never appear in the chat — no error, just silence.
- The `<script>` tag is in `<head>` without `defer`, so any DOM access before `DOMContentLoaded` throws.

These are the kinds of bugs that only show up on the real device, not in local dev. Tests that simulate the same conditions catch them before they get flashed.

## What the tests cover

### `route_message.test.js` — pure functions

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

# Uploading to dev board 

Follow instruction in main [README.md](https://github.com/sudomesh/disaster-radio#building-web-app) to upload built web app.

