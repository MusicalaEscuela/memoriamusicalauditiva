const pads = document.querySelectorAll(".pad")
const startBtn = document.getElementById("startBtn")
const levelText = document.getElementById("level")
const message = document.getElementById("message")

let sequence = []
let playerSequence = []
let level = 0
let playing = false

const notes = {
  C: 261.63,
  D: 293.66,
  E: 329.63,
  G: 392
}

function playSound(freq) {
  
  const ctx = new(window.AudioContext || window.webkitAudioContext)()
  
  const osc = ctx.createOscillator()
  
  osc.frequency.value = freq
  osc.type = "sine"
  
  osc.connect(ctx.destination)
  
  osc.start()
  
  setTimeout(() => {
    osc.stop()
  }, 400)
  
}

function flashPad(pad) {
  
  pad.classList.add("active")
  
  playSound(notes[pad.dataset.note])
  
  setTimeout(() => {
    pad.classList.remove("active")
  }, 300)
  
}

function nextRound() {
  
  playerSequence = []
  level++
  
  levelText.textContent = level
  message.textContent = "Escucha la secuencia"
  
  const randomPad = pads[Math.floor(Math.random() * pads.length)]
  
  sequence.push(randomPad)
  
  playSequence()
  
}

function playSequence() {
  
  let i = 0
  
  playing = true
  
  const interval = setInterval(() => {
    
    flashPad(sequence[i])
    
    i++
    
    if (i >= sequence.length) {
      
      clearInterval(interval)
      
      playing = false
      message.textContent = "Tu turno"
      
    }
    
  }, 700)
  
}

pads.forEach(pad => {
  
  pad.addEventListener("click", () => {
    
    if (playing) return
    
    flashPad(pad)
    
    playerSequence.push(pad)
    
    checkInput()
    
  })
  
})

function checkInput() {
  
  const currentIndex = playerSequence.length - 1
  
  if (playerSequence[currentIndex] !== sequence[currentIndex]) {
    
    message.textContent = "Fallaste 😅"
    sequence = []
    level = 0
    
    return
    
  }
  
  if (playerSequence.length === sequence.length) {
    
    message.textContent = "¡Bien! siguiente nivel"
    
    setTimeout(() => {
      nextRound()
    }, 1000)
    
  }
  
}

startBtn.addEventListener("click", () => {
  
  sequence = []
  level = 0
  
  nextRound()
  
})