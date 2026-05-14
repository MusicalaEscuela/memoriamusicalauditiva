const pads = [...document.querySelectorAll(".pad")]
const startBtn = document.getElementById("startBtn")
const repeatBtn = document.getElementById("repeatBtn")
const levelText = document.getElementById("level")
const bestScoreText = document.getElementById("bestScore")
const message = document.getElementById("message")

const BEST_SCORE_KEY = "musicala-memoria-musical-best-score"
const NOTE_DURATION = 430
const NOTE_GAP = 250

const notes = {
  C: { frequency: 261.63, label: "Do" },
  D: { frequency: 293.66, label: "Re" },
  E: { frequency: 329.63, label: "Mi" },
  G: { frequency: 392.0, label: "Sol" }
}

let audioCtx = null
let sequence = []
let playerSequence = []
let level = 0
let bestScore = Number(localStorage.getItem(BEST_SCORE_KEY)) || 0
let isPlayingSequence = false
let isGameStarted = false

bestScoreText.textContent = bestScore
setPadsDisabled(true)

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  }

  if (audioCtx.state === "suspended") {
    audioCtx.resume()
  }

  return audioCtx
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function setMessage(text, type = "") {
  message.textContent = text
  message.className = `message-box ${type}`.trim()
}

function setPadsDisabled(disabled) {
  pads.forEach(pad => {
    pad.disabled = disabled
  })
}

function playTone(noteKey, duration = NOTE_DURATION) {
  const note = notes[noteKey]
  if (!note) return

  const ctx = getAudioContext()
  const now = ctx.currentTime

  const mainOsc = ctx.createOscillator()
  const softOsc = ctx.createOscillator()
  const gain = ctx.createGain()

  mainOsc.type = "sine"
  softOsc.type = "triangle"

  mainOsc.frequency.setValueAtTime(note.frequency, now)
  softOsc.frequency.setValueAtTime(note.frequency * 2, now)

  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(0.26, now + 0.035)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration / 1000)

  mainOsc.connect(gain)
  softOsc.connect(gain)
  gain.connect(ctx.destination)

  mainOsc.start(now)
  softOsc.start(now)
  mainOsc.stop(now + duration / 1000 + 0.04)
  softOsc.stop(now + duration / 1000 + 0.04)
}

function playFeedback(type) {
  const ctx = getAudioContext()
  const now = ctx.currentTime
  const gain = ctx.createGain()

  gain.connect(ctx.destination)
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(0.18, now + 0.03)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55)

  const pattern = type === "success"
    ? [523.25, 659.25, 783.99]
    : [220, 185, 146.83]

  pattern.forEach((frequency, index) => {
    const osc = ctx.createOscillator()
    osc.type = type === "success" ? "triangle" : "sawtooth"
    osc.frequency.setValueAtTime(frequency, now + index * 0.12)
    osc.connect(gain)
    osc.start(now + index * 0.12)
    osc.stop(now + index * 0.12 + 0.16)
  })
}

async function flashPad(pad, duration = NOTE_DURATION) {
  pad.classList.add("active")
  playTone(pad.dataset.note, duration)
  await sleep(duration)
  pad.classList.remove("active")
}

function getRandomPad() {
  return pads[Math.floor(Math.random() * pads.length)]
}

function updateBestScore() {
  if (level <= bestScore) return

  bestScore = level
  localStorage.setItem(BEST_SCORE_KEY, String(bestScore))
  bestScoreText.textContent = bestScore
}

function resetGameState() {
  sequence = []
  playerSequence = []
  level = 0
  levelText.textContent = level
}

async function playSequence() {
  isPlayingSequence = true
  setPadsDisabled(true)
  startBtn.disabled = true
  repeatBtn.disabled = true
  setMessage("Escucha con atención… el botón no va a juzgarte, pero yo sí un poquito.", "listening")

  await sleep(360)

  for (const pad of sequence) {
    await flashPad(pad)
    await sleep(NOTE_GAP)
  }

  isPlayingSequence = false
  setPadsDisabled(false)
  startBtn.disabled = false
  repeatBtn.disabled = false
  startBtn.textContent = "Reiniciar juego"
  setMessage("Tu turno: repite la secuencia en el mismo orden.")
}

async function nextRound() {
  playerSequence = []
  level++
  updateBestScore()
  levelText.textContent = level
  sequence.push(getRandomPad())
  await playSequence()
}

async function startGame() {
  getAudioContext()
  isGameStarted = true
  resetGameState()
  setMessage("Nueva partida. A ver si el oído vino desayunado.", "listening")
  await sleep(260)
  await nextRound()
}

async function repeatSequence() {
  if (!isGameStarted || isPlayingSequence || sequence.length === 0) return
  playerSequence = []
  await playSequence()
}

async function handlePadClick(pad) {
  if (!isGameStarted || isPlayingSequence) return

  await flashPad(pad, 300)
  playerSequence.push(pad)
  checkInput()
}

function checkInput() {
  const currentIndex = playerSequence.length - 1
  const currentPad = playerSequence[currentIndex]
  const expectedPad = sequence[currentIndex]

  if (currentPad !== expectedPad) {
    playFeedback("error")
    setMessage(`Fallaste 😅 Era ${notes[expectedPad.dataset.note].label}. Reinicia y salva el honor auditivo.`, "error")
    isGameStarted = false
    setPadsDisabled(true)
    repeatBtn.disabled = true
    startBtn.textContent = "Intentar otra vez"
    return
  }

  if (playerSequence.length === sequence.length) {
    playFeedback("success")
    setPadsDisabled(true)
    repeatBtn.disabled = true
    setMessage("¡Bien! Subes de nivel. La humanidad conserva una pequeña esperanza.", "success")

    setTimeout(() => {
      nextRound()
    }, 900)
  }
}

pads.forEach(pad => {
  pad.addEventListener("click", () => handlePadClick(pad))
})

startBtn.addEventListener("click", startGame)
repeatBtn.addEventListener("click", repeatSequence)
