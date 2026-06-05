const addtask = document.getElementById("add-task-btn");
const tasklist = [];

const audio = new Audio("./assets/sons/universfield-notification.mp3");
const startButton = document.getElementById("start-button");
const resetButton = document.getElementById("reset-button");

const timerDisplay = document.getElementById("timer-work");

const workIncreaseButton = document.getElementById("work-increase");
const workDecreaseButton = document.getElementById("work-decrease");

const breakIncreaseButton = document.getElementById("break-increase");
const breakDecreaseButton = document.getElementById("break-decrease");

const timeof = document.getElementById("timeof");

const workLabel = document.getElementById("work-label");
const breakLabel = document.getElementById("break-label");

const pausa_curta = document.getElementById("pausa_curta");
const pausa_longa = document.getElementById("pausa_longa");

const workCard = document.querySelector(".work-card");
const breakCard = document.querySelector(".break-card");
const timerBreakDisplay = document.getElementById("timer-break");

// Elementos para link personalizado
const playlistUrlInput = document.getElementById("playlist-url");
const loadPlaylistBtn = document.getElementById("load-playlist-btn");

/* =========================
   CONFIGURAÇÃO DO TIMER
========================= */

let workDurationDefault = 25 * 60;
let breakDurationDefault = 5 * 60;

let workDuration = workDurationDefault;
let breakDuration = breakDurationDefault;

let timerInterval = null;
let isRunning = false;
let isWorkTime = true;
let hasStarted = false;

/* =========================
   EXIBIÇÃO DOS CARDS
========================= */

function showWorkCard() {
  if (workCard) workCard.style.display = "block";
  if (breakCard) breakCard.style.display = "none";
}

function showBreakCard() {
  if (workCard) workCard.style.display = "none";
  if (breakCard) breakCard.style.display = "block";
}

/* =========================
   DISPLAY DO TIMER
========================= */

function updateMainDisplay() {
  const currentDuration = isWorkTime ? workDuration : breakDuration;
  const minutes = Math.floor(currentDuration / 60);
  const seconds = currentDuration % 60;
  const timeString = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  timerDisplay.textContent = timeString;
  if (timerBreakDisplay) {
    timerBreakDisplay.textContent = timeString;
  }
}

function updateModeDisplay() {
  timeof.textContent = isWorkTime ? "Trabalho" : "Pausa";
}

function updateButtonState() {
  if (isRunning) {
    startButton.innerHTML = "⏸ Pausar";
    return;
  }
  if (hasStarted) {
    startButton.innerHTML = "▶ Continuar";
  } else {
    startButton.innerHTML = "▶ Iniciar";
  }
}
/* =========================
   ADICIONAR TAREFA
========================= */
/*function addTask() {
  const taskText = prompt("Digite a tarefa:");
  if (taskText) {
    tasklist.push(taskText);
    document.getElementById("task-list").innerHTML = tasklist
      .map((task) => `<li id= "task"><input type="checkbox" /> ${task} </li>`)
      .join("");
  }
  updateMainDisplay();
  console.log(tasklist);
}

addtask.addEventListener("click", addTask);*/

function addTask() {
  const taskText = prompt("Digite a tarefa:");

  if (taskText) {
    tasklist.push({
      text: taskText,
      done: false,
    });
  }
}

// Supondo que sua lista comece assim:

function renderTasks() {
  document.getElementById("task-list").innerHTML = tasklist
    .map(
      (task, index) => `
        <li class="task-item">
          <input
            type="checkbox"
            data-index="${index}"
            ${task.done ? "checked disabled" : ""}
          />
          <span>${task.text}</span>
        </li>
      `,
    )
    .join("");
}

document.getElementById("task-list").addEventListener("change", (e) => {
  if (e.target.type === "checkbox") {
    const index = e.target.dataset.index;

    tasklist[index].done = true;

    renderTasks();
  }
});

function addTask() {
  const taskText = prompt("Digite a tarefa:");

  if (taskText) {
    tasklist.push({
      text: taskText,
      done: false,
    });

    renderTasks();
  }
}

// --- SEGUNDO EVENTO (Escutando as mudanças nos checkboxes) ---
const taskListContainer = document.getElementById("task-list");

taskListContainer.addEventListener("change", function (event) {
  // Verifica se o elemento que mudou de estado é um checkbox
  if (event.target.type === "checkbox") {
    const checkbox = event.target;
    const taskTextElement = checkbox.nextElementSibling; // Pega o <span> com o texto

    if (checkbox.checked) {
      console.log("Tarefa marcada como concluída!");
      taskTextElement.style.textDecoration = "line-through"; // Risca o texto (opcional)
      taskTextElement.style.color = "gray";
    } else {
      console.log("Tarefa desmarcada!");
      taskTextElement.style.textDecoration = "none";
      taskTextElement.style.color = "black";
    }

    // Se precisar rodar a sua função de atualização aqui também:
    updateMainDisplay();
  }
});

// Evento do botão de adicionar
addtask.addEventListener("click", addTask);
/* =========================
   TROCA DE CICLO
========================= */

function switchToBreak() {
  isWorkTime = false;

  breakDuration = breakDurationDefault;
  updateModeDisplay();
  updateMainDisplay();
  showBreakCard();

  timerDisplay.style.animation = "pulse 0.5s ease";
  if (timerBreakDisplay) {
    timerBreakDisplay.style.animation = "pulse 0.5s ease";
  }
  setTimeout(() => {
    timerDisplay.style.animation = "";
    if (timerBreakDisplay) {
      timerBreakDisplay.style.animation = "";
    }
  }, 500);
}

function switchToWork() {
  isWorkTime = true;

  workDuration = workDurationDefault;

  updateModeDisplay();
  updateMainDisplay();
  showWorkCard();

  timerDisplay.style.animation = "pulse 0.5s ease";
  if (timerBreakDisplay) {
    timerBreakDisplay.style.animation = "pulse 0.5s ease";
  }
  setTimeout(() => {
    timerDisplay.style.animation = "";
    if (timerBreakDisplay) {
      timerBreakDisplay.style.animation = "";
    }
  }, 500);
}

/* =========================
   TIMER PRINCIPAL
========================= */

function startTimer() {
  if (isRunning) return;

  isRunning = true;
  hasStarted = true;
  updateButtonState();

  timerInterval = setInterval(() => {
    if (isWorkTime) {
      if (workDuration > 0) {
        workDuration--;
        updateMainDisplay();
      } else {
        clearInterval(timerInterval);
        timerInterval = null;
        isRunning = false;
        audio.play();
        switchToBreak();
        startTimer();
      }
    } else {
      if (breakDuration > 0) {
        breakDuration--;
        updateMainDisplay();
      } else {
        clearInterval(timerInterval);
        timerInterval = null;
        isRunning = false;
        audio.play();
        switchToWork();
        startTimer();
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
  hasStarted = false;

  updateModeDisplay();
  updateMainDisplay();
  updateButtonState();
  showWorkCard();
}

/* =========================
   AJUSTE TEMPO TRABALHO
========================= */

// Função para resetar os botões de pausa
function resetPauseButtons() {
  pausa_curta.classList.remove("active");
  pausa_longa.classList.remove("active");
}

// Função para definir qual pausa está ativa
function updateActivePauseButton() {
  resetPauseButtons();

  if (breakDurationDefault === 5 * 60) {
    pausa_curta.classList.add("active");
  } else if (breakDurationDefault === 10 * 60) {
    pausa_longa.classList.add("active");
  }
}

// Função para selecionar Pausa Curta (sem duplicação)
function selecionarPausaCurta() {
  // Remove active da pausa longa e adiciona na pausa curta
  pausa_longa.classList.remove("active");
  pausa_curta.classList.add("active");

  // Efeito visual de clique
  pausa_curta.style.transform = "scale(0.95)";
  setTimeout(() => {
    pausa_curta.style.transform = "";
  }, 200);

  if (isRunning) return;
  breakDurationDefault = 5 * 60;
  if (!isWorkTime) {
    breakDuration = breakDurationDefault;
    updateMainDisplay();
  }
}

// Função para selecionar Pausa Longa (sem duplicação)
function selecionarPausaLonga() {
  // Remove active da pausa curta e adiciona na pausa longa
  pausa_curta.classList.remove("active");
  pausa_longa.classList.add("active");

  // Efeito visual de clique
  pausa_longa.style.transform = "scale(0.95)";
  setTimeout(() => {
    pausa_longa.style.transform = "";
  }, 200);

  if (isRunning) return;
  breakDurationDefault = 10 * 60;
  if (!isWorkTime) {
    breakDuration = breakDurationDefault;
    updateMainDisplay();
  }
}

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
   YOUTUBE PLAYER - VERSÃO ESTÁVEL
========================= */

// Função para extrair ID do vídeo de qualquer URL do YouTube
function extractVideoId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([^&]+)/,
    /(?:youtu\.be\/)([^?]+)/,
    /(?:youtube\.com\/embed\/)([^?]+)/,
    /(?:youtube\.com\/v\/)([^?]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Função para extrair ID da playlist
function extractPlaylistId(url) {
  const match = url.match(/[&?]list=([^&]+)/);
  return match ? match[1] : null;
}

// Função principal para carregar vídeo/playlist
function loadYouTubeContent(url, isCustom = false, categoryName = null) {
  const container = document.getElementById("youtube-player");
  if (!container) return false;

  let embedUrl = null;
  let displayName = "";

  const playlistId = extractPlaylistId(url);

  if (playlistId) {
    embedUrl = `https://www.youtube.com/embed/videoseries?list=${playlistId}&autoplay=1&loop=1&playlist=${playlistId}&enablejsapi=1`;
    displayName = "Playlist Personalizada";
  } else {
    let videoId = extractVideoId(url);

    if (!videoId && url.length === 11) {
      videoId = url;
    }

    if (videoId) {
      embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}`;
      displayName = `Vídeo: ${videoId}`;
    } else {
      if (url.includes("youtube.com") || url.includes("youtu.be")) {
        embedUrl = url
          .replace("watch?v=", "embed/")
          .replace("youtu.be/", "youtube.com/embed/");
        if (!embedUrl.includes("autoplay")) {
          embedUrl +=
            (embedUrl.includes("?") ? "&" : "?") + "autoplay=1&loop=1";
        }
        displayName = "Conteúdo do YouTube";
      } else {
        alert("URL inválida! Use um link do YouTube válido.");
        return false;
      }
    }
  }

  if (!embedUrl.includes("enablejsapi")) {
    embedUrl += "&enablejsapi=1";
  }
  if (!embedUrl.includes("origin")) {
    embedUrl += `&origin=${window.location.origin}`;
  }

  container.innerHTML = `
        <iframe 
            width="100%" 
            height="100%" 
            src="${embedUrl}"
            frameborder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowfullscreen>
        </iframe>
    `;

  const playlistInfo = document.getElementById("current-playlist");
  if (playlistInfo) {
    if (categoryName) {
      playlistInfo.textContent = `🎵 Tocando: ${categoryName}`;
    } else {
      playlistInfo.textContent = `🎵 Tocando: ${displayName}`;
    }
  }

  return true;
}

// Carregar playlist personalizada
function loadCustomPlaylist() {
  let url = playlistUrlInput.value.trim();

  if (!url) {
    alert("Por favor, cole um link do YouTube!");
    return;
  }

  const success = loadYouTubeContent(url, true);

  if (success) {
    document.querySelectorAll(".category-btn").forEach((btn) => {
      btn.classList.remove("active");
    });
    playlistUrlInput.value = "";
  }
}

// Fallback
//adicionar apenas caso a função de carregar o vídeo falhe, para evitar que o usuário fique com um container vazio sem entender o motivo
function fallbackAudio() {
  const container = document.getElementById("youtube-player");
  if (loadYouTubeContent() === false) {
    container.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; background: #1a1a1a; border-radius: 12px; padding: 20px;">
                <p style="color: #ff4757; margin-bottom: 10px;">⚠️ Não foi possível carregar o vídeo</p>
                <p style="color: #aaa; font-size: 0.8rem;">Tente colar outro link do YouTube</p>
                <p style="color: #666; font-size: 0.7rem; margin-top: 10px;">Dica: Use links de vídeos públicos</p>
            </div>
        `;
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
pausa_curta.addEventListener("click", selecionarPausaCurta);
pausa_longa.addEventListener("click", selecionarPausaLonga);

if (loadPlaylistBtn) {
  loadPlaylistBtn.addEventListener("click", loadCustomPlaylist);
}

if (playlistUrlInput) {
  playlistUrlInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      loadCustomPlaylist();
    }
  });
}

/* =========================
   INICIALIZAÇÃO
========================= */

function init() {
  updateMainDisplay();
  updateModeDisplay();
  updateButtonState();

  showWorkCard();

  // Garantir que Pausa Curta seja o padrão (ativa e vermelha)
  pausa_curta.classList.add("active");
  pausa_longa.classList.remove("active");

  setTimeout(() => {}, 500);

  setTimeout(fallbackAudio, 5000);
}

document.addEventListener("DOMContentLoaded", init);
