import { findTriggers } from './keywords.js'

// Fun alerts come out the left channel, emergency alerts out the right.
// A terminal's headphone jack feeds a physical mixer/soundsystem, where
// the soundboi controls the fun (left) channel volume independently of
// the emergency (right) channel, which is expected to stay up.
var ctx = null
var funGain = null
var emergencyGain = null

function getAudioContextClass() {
  return (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) || null
}

function getContext() {
  if (ctx) return ctx

  var AudioContextClass = getAudioContextClass()
  if (!AudioContextClass) return null

  ctx = new AudioContextClass()

  var funPanner = ctx.createStereoPanner()
  funPanner.pan.value = -1
  funPanner.connect(ctx.destination)

  var emergencyPanner = ctx.createStereoPanner()
  emergencyPanner.pan.value = 1
  emergencyPanner.connect(ctx.destination)

  funGain = ctx.createGain()
  funGain.gain.value = 0.8
  funGain.connect(funPanner)

  emergencyGain = ctx.createGain()
  emergencyGain.gain.value = 0.8
  emergencyGain.connect(emergencyPanner)

  // Browsers start AudioContexts suspended until a user gesture; resume
  // on the first interaction anywhere on the page.
  ;['click', 'keydown', 'touchstart'].forEach(function(evt) {
    document.addEventListener(evt, function resume() {
      if (ctx.state === 'suspended') ctx.resume()
      document.removeEventListener(evt, resume)
    }, { passive: true })
  })

  return ctx
}

// short pitch-dropping quack
function playDuck(audioCtx, dest) {
  var now = audioCtx.currentTime
  var osc = audioCtx.createOscillator()
  var gain = audioCtx.createGain()
  osc.type = 'square'
  osc.frequency.setValueAtTime(900, now)
  osc.frequency.exponentialRampToValueAtTime(250, now + 0.15)
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(1, now + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18)
  osc.connect(gain)
  gain.connect(dest)
  osc.start(now)
  osc.stop(now + 0.2)
}

// low descending thump
function playBoom(audioCtx, dest) {
  var now = audioCtx.currentTime
  var osc = audioCtx.createOscillator()
  var gain = audioCtx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(150, now)
  osc.frequency.exponentialRampToValueAtTime(40, now + 0.35)
  gain.gain.setValueAtTime(1, now)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4)
  osc.connect(gain)
  gain.connect(dest)
  osc.start(now)
  osc.stop(now + 0.4)
}

// dubstep-style wobble bass
function playWub(audioCtx, dest) {
  var now = audioCtx.currentTime
  var duration = 0.6
  var osc = audioCtx.createOscillator()
  var filter = audioCtx.createBiquadFilter()
  var lfo = audioCtx.createOscillator()
  var lfoGain = audioCtx.createGain()
  var gain = audioCtx.createGain()

  osc.type = 'sawtooth'
  osc.frequency.value = 80

  filter.type = 'lowpass'
  filter.Q.value = 12
  filter.frequency.value = 400

  lfo.type = 'sine'
  lfo.frequency.value = 6
  lfoGain.gain.value = 800

  gain.gain.setValueAtTime(0.9, now)
  gain.gain.setValueAtTime(0.9, now + duration - 0.05)
  gain.gain.linearRampToValueAtTime(0.0001, now + duration)

  lfo.connect(lfoGain)
  lfoGain.connect(filter.frequency)
  osc.connect(filter)
  filter.connect(gain)
  gain.connect(dest)

  osc.start(now)
  lfo.start(now)
  osc.stop(now + duration)
  lfo.stop(now + duration)
}

// two-tone alarm wail
function playAlarm(audioCtx, dest) {
  var now = audioCtx.currentTime
  var duration = 1.0
  var osc = audioCtx.createOscillator()
  var gain = audioCtx.createGain()
  osc.type = 'square'
  osc.frequency.setValueAtTime(660, now)
  osc.frequency.setValueAtTime(880, now + 0.25)
  osc.frequency.setValueAtTime(660, now + 0.5)
  osc.frequency.setValueAtTime(880, now + 0.75)
  gain.gain.setValueAtTime(0.7, now)
  gain.gain.setValueAtTime(0.7, now + duration - 0.05)
  gain.gain.setValueAtTime(0.0001, now + duration)
  osc.connect(gain)
  gain.connect(dest)
  osc.start(now)
  osc.stop(now + duration)
}

// TODO: swap these synthesized placeholders for real sound files by
// replacing a synth function's body with buffer playback into `dest`.
var SYNTHS = {
  duck: playDuck,
  boom: playBoom,
  wub: playWub,
  fire: playAlarm,
  emergency: playAlarm,
}

function playTrigger(audioCtx, trigger) {
  var synth = SYNTHS[trigger.word]
  if (!synth) return
  var dest = trigger.category === 'emergency' ? emergencyGain : funGain
  synth(audioCtx, dest)
}

// Scans a chat message for trigger words and plays the matching alert(s).
// No-ops silently if Web Audio isn't available (e.g. in tests).
function handleMessage(text) {
  var audioCtx = getContext()
  if (!audioCtx) return

  var triggers = findTriggers(text)
  if (!triggers.length) return

  var seen = {}
  triggers.forEach(function(trigger) {
    var key = trigger.category + ':' + trigger.word
    if (seen[key]) return
    seen[key] = true
    playTrigger(audioCtx, trigger)
  })
}

export default { handleMessage }
