
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

`settings.js` configures the simulator's port and hostname. The defaults (port 8000, localhost) work for most people — you only need to edit it if you want to run the simulator on a different port or hostname.

# Developing

```
npm run dev
```

This starts both the WebSocket simulator (port 8000) and the Vite dev server (port 5173) with hot reload. Open http://localhost:5173/ while developing.

# Building for production / firmware upload

```
npm run build  # build the js and css into dist/
npm start      # serve the built files via the simulator (port 8000)
```

Then open http://localhost:8000/ in a browser. You only need this if you want to preview the production build locally, or before uploading to the device. See [Uploading to dev board](#uploading-to-dev-board) below.

# Websocket

The disaster.radio firmware opens up a websocket using [the ESPAsyncWebServer library](https://github.com/me-no-dev/ESPAsyncWebServer). Through this, client-side javascript can transmit and receive messages over the LoRa transceiver. If you'd like to build an application for disaster.radio, you could write a websocket client that sends and receives messages in the same format. Currently, the firmware expects websocket messages in the following format:   
`<msgID><msgType>|<msg>`  
where,
* `<msgID>` is a two-byte binary unsigned integer representing an arbitrary sequence number, this is sent back to the websocket client with an `!` appended to act as an acknowledgment and could be used for error-checking,  
* `<msgType>` is a single binary utf8 encoded character representing the application for which the message is intended, such 'c' for chat, 'm' for maps, or 'e' for events  
* `<msg>` is a binary utf8 encoded string of characters limited to 236 bytes, this can be treated as the body of the message and may be used to handle client-side concerns, such as intended recipient or requested map tile.    

An example message may appear as follows,
`0100c|<noffle>@juul did you feel that earthquake!`

Alternatively, you could write another Layer3 client as part of the disaster radio firmware and create your own Layer 4 message format. See more about our networking stack on our wiki, https://github.com/sudomesh/disaster-radio/wiki/Layered-Model.

# Audio alerts

The web app scans every chat message (sent and received) for trigger words and plays a short sound when it finds one. This is meant for terminals with speakers attached to the headphone jack: fun alerts come out the left channel and emergency alerts come out the right channel, so a mixer/soundsystem downstream can turn the fun channel up or down while leaving emergency alerts alone.

Trigger words match whole words, case-insensitively, with or without a leading `#` (so both `fire` and `#fire` match, but `backfired` does not):
* Fun (left channel): `duck`, `boom`, `wub`
* Emergency (right channel): `emergency`, `fire`

Sounds are currently synthesized with the Web Audio API — see `src/js/soundboard.js` — so no audio files are required. To use real sound files instead, replace the relevant synth function's body with buffer playback into the same destination node. The word list lives in `src/js/keywords.js`.

# Testing

```
npm test
```

This runs the unit and integration tests once and exits — good for CI. To run in watch mode while developing:

```
npm run test:watch
```

To run the end-to-end browser tests (Playwright):

```
npm run test:e2e
```

This automatically starts the WebSocket simulator and the Vite dev server, runs the browser tests, then shuts them down. You do not need to start anything first. If both servers are already running (port 8000 and port 5173), Playwright will reuse them instead of starting new ones.

Tests run automatically on GitHub Actions whenever files under `web/` change.

There are three test suites:
- `src/test/e2e/chat.spec.js` — end-to-end browser tests (Playwright)
- `src/test/route_message.test.js` — unit tests for pure functions
- `socket.test.js` and `chat_integration.test.js` — integration tests for the WebSocket protocol and chat actions

See [TESTING.md](TESTING.md) for why these tests exist and what each suite covers.

# Uploading to dev board 

Follow instruction in main [README.md](https://github.com/sudomesh/disaster-radio#building-web-app) to upload built web app.

