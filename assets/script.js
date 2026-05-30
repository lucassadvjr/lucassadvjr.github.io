const startButton = document.getElementById("start-button");
const resetButton = document.getElementById("reset-button");

const timerDisplay = document.getElementById("timer-work");

const workIncreaseButton = document.getElementById("work-increase");
const workDecreaseButton = document.getElementById("work-decrease");

const breakIncreaseButton = document.getElementById("break-increase");
const breakDecreaseButton = document.getElementById("break-decrease");

const timeof = document.getElementById("timeof");

// Configuração inicial
let workDuration = 25 * 60;
let breakDuration = 5 * 60;

// Valores configurados pelo usuário
let workDurationDefault = workDuration;
let breakDurationDefault = breakDuration;

let timerInterval = null;
let isRunning = false;
let isWorkTime = true;

/* =========================
   DISPLAY
========================= */

function updateMainDisplay() {
  const duration = isWorkTime ? workDuration : breakDuration;

  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;

  timerDisplay.textContent = `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

function updateModeDisplay() {
  timeof.textContent = isWorkTime ? "Trabalho" : "Pausa";
}

function updateButtonState() {
  startButton.innerHTML = isRunning ? "⏸ Pausar" : "▶ Iniciar";
}

/* =========================
   TIMER
========================= */

function startTimer() {
  if (isRunning) return;

  isRunning = true;

  updateButtonState();
  updateModeDisplay();

  timerInterval = setInterval(() => {
    if (isWorkTime) {
      if (workDuration > 0) {
        workDuration--;
        updateMainDisplay();
      } else {
        isWorkTime = false;

        breakDuration = breakDurationDefault;

        updateModeDisplay();
        updateMainDisplay();

        alert("Hora da pausa!");
      }
    } else {
      if (breakDuration > 0) {
        breakDuration--;
        updateMainDisplay();
      } else {
        isWorkTime = true;

        workDuration = workDurationDefault;

        updateModeDisplay();
        updateMainDisplay();

        alert("Volte ao trabalho!");
      }
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);

  timerInterval = null;
  isRunning = false;

  updateButtonState();
}

function toggleTimer() {
  if (isRunning) {
    stopTimer();
  } else {
    startTimer();
  }
}

function resetTimer() {
  stopTimer();

  workDuration = workDurationDefault;
  breakDuration = breakDurationDefault;

  isWorkTime = true;

  timeof.textContent = "Trabalho";

  updateTimerDisplay();
  updateBreakTimerDisplay();
}

/* =========================
   AJUSTES DE TEMPO
========================= */

function increaseWorkDuration() {
  if (!isRunning) {
    workDuration += 60;
    workDurationDefault = workDuration;

    updateMainDisplay();
  }
}

function decreaseWorkDuration() {
  if (!isRunning && workDuration > 60) {
    workDuration -= 60;
    workDurationDefault = workDuration;

    updateMainDisplay();
  }
}

function increaseBreakDuration() {
  if (!isRunning) {
    breakDuration += 60;
    breakDurationDefault = breakDuration;

    if (!isWorkTime) {
      updateMainDisplay();
    }
  }
}

function decreaseBreakDuration() {
  if (!isRunning && breakDuration > 60) {
    breakDuration -= 60;
    breakDurationDefault = breakDuration;

    if (!isWorkTime) {
      updateMainDisplay();
    }
  }
}

/* =========================
   EVENTOS
========================= */

startButton.addEventListener("click", toggleTimer);

resetButton.addEventListener("click", resetTimer);

workIncreaseButton.addEventListener("click", increaseWorkDuration);
workDecreaseButton.addEventListener("click", decreaseWorkDuration);

breakIncreaseButton.addEventListener("click", increaseBreakDuration);
breakDecreaseButton.addEventListener("click", decreaseBreakDuration);

/* =========================
   INICIALIZAÇÃO
========================= */

updateMainDisplay();
updateModeDisplay();
updateButtonState();
