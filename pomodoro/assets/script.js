'use strict';
const $ = (id) => document.getElementById(id);
const modes = { focus: { minutes: 25, caption: 'HORA DE FOCAR', message: 'Você só precisa começar.' }, short: { minutes: 5, caption: 'RESPIRE UM POUCO', message: 'Uma pausa também é progresso.' }, long: { minutes: 10, caption: 'RECARREGUE AS ENERGIAS', message: 'Descanse. Você merece esse tempo.' } };
const readStored = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const saveStored = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* The app also works without browser storage. */ } };
const localDay = () => { const now = new Date(); return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`; };
let tasks = readStored('pomodoro-tasks', []);
if (!Array.isArray(tasks)) tasks = [];
tasks = tasks.filter(task => task && typeof task.text === 'string').map(task => ({ text: task.text.slice(0, 180), done: Boolean(task.done) }));
let stats = readStored('pomodoro-stats', { day: localDay(), count: 0 });
if (!stats || stats.day !== localDay() || !Number.isInteger(stats.count) || stats.count < 0) stats = { day: localDay(), count: 0 };
let mode = 'focus', remaining = modes.focus.minutes * 60, running = false, started = false, deadline = 0, interval = null, cycleCount = 0, toastTimeout;
const audio = new Audio('./assets/sons/universfield-notification.mp3');
function notify(message) { $('toast').textContent = message; $('toast').classList.add('visible'); clearTimeout(toastTimeout); toastTimeout = setTimeout(() => $('toast').classList.remove('visible'), 3500); }
function renderStats() { if (stats.day !== localDay()) { stats = { day: localDay(), count: 0 }; saveStored('pomodoro-stats', stats); } $('completed-sessions').textContent = `${stats.count} ${stats.count === 1 ? 'sessão' : 'sessões'}`; }
function renderTimer() {
  const time = `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`;
  $('timer-work').textContent = time;
  document.title = `${time} · ${mode === 'focus' ? 'Foco' : 'Pausa'} — Pomodoro`;
  $('ring-progress').style.strokeDashoffset = String(917.346 * (1 - remaining / (modes[mode].minutes * 60)));
  $('mode-caption').textContent = modes[mode].caption;
  $('timer-message').textContent = modes[mode].message;
  $('duration-label').textContent = `${modes[mode].minutes} ${modes[mode].minutes === 1 ? 'minuto' : 'minutos'} por sessão`;
  $('start-button').textContent = running ? 'Ⅱ Pausar' : started ? '▶ Continuar' : mode === 'focus' ? '▶ Iniciar foco' : '▶ Iniciar pausa';
  $('status-badge').textContent = running ? mode === 'focus' ? 'Foco em andamento' : 'Hora de descansar' : started ? 'Temporizador pausado' : 'Pronto para começar';
  document.body.dataset.mode = mode;
  document.body.classList.toggle('running', running);
  document.querySelectorAll('[data-mode]').forEach(button => { const active = button.dataset.mode === mode; button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active)); });
  $('duration-decrease').disabled = running || started || modes[mode].minutes <= 1;
  $('duration-increase').disabled = running || started || modes[mode].minutes >= 120;
  $('session-label').textContent = `Sessão ${cycleCount % 4 + 1} de 4`;
  document.querySelectorAll('.session-dots i').forEach((dot, index) => { dot.classList.toggle('complete', index < cycleCount % 4); dot.classList.toggle('current', index === cycleCount % 4); });
}
function pause() { clearInterval(interval); interval = null; running = false; }
function setMode(next) { pause(); mode = next; remaining = modes[mode].minutes * 60; started = false; const stage = document.querySelector('.timer-stage'); stage.classList.remove('mode-change'); void stage.offsetWidth; stage.classList.add('mode-change'); renderTimer(); }
function tick() {
  remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
  if (remaining === 0) {
    const finished = mode;
    pause();
    audio.currentTime = 0; audio.play().catch(() => {});
    if (finished === 'focus') { renderStats(); stats.count++; cycleCount++; saveStored('pomodoro-stats', stats); renderStats(); setMode(cycleCount % 4 === 0 ? 'long' : 'short'); notify('Foco concluído! Sua pausa começou.'); }
    else { setMode('focus'); notify('Pausa concluída. Vamos para o próximo foco!'); }
    start();
  } else renderTimer();
}
function start() { if (running) return; running = true; started = true; deadline = Date.now() + remaining * 1000; interval = setInterval(tick, 250); renderTimer(); }
function toggle() { if (running) { remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000)); pause(); renderTimer(); } else start(); }
$('start-button').addEventListener('click', toggle);
$('reset-button').addEventListener('click', () => { setMode(mode); notify('Temporizador reiniciado. Um novo começo.'); });
document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => { if (button.dataset.mode !== mode) setMode(button.dataset.mode); }));
for (const [id, delta] of [['duration-decrease', -1], ['duration-increase', 1]]) $(id).addEventListener('click', () => { if (running || started) return; modes[mode].minutes = Math.min(120, Math.max(1, modes[mode].minutes + delta)); remaining = modes[mode].minutes * 60; renderTimer(); });
document.addEventListener('keydown', event => { if (event.code === 'Space' && !event.repeat && !event.ctrlKey && !event.metaKey && !event.altKey && !event.target.closest('input, textarea, button, a, [contenteditable]')) { event.preventDefault(); toggle(); } });
document.addEventListener('visibilitychange', () => { if (!document.hidden && running) tick(); renderStats(); });
$('focus-view').addEventListener('click', () => { const active = document.body.classList.toggle('immersive'); $('focus-view').setAttribute('aria-pressed', String(active)); $('focus-view').querySelector('span').textContent = active ? 'Sair da imersão' : 'Modo imersivo'; });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && document.body.classList.contains('immersive')) $('focus-view').click(); });
function renderTasks() {
  const list = $('task-list'); list.replaceChildren();
  tasks.forEach((task, index) => {
    const item = document.createElement('li'); item.className = `task-item${task.done ? ' done' : ''}`;
    const label = document.createElement('label'); const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.checked = task.done;
    const text = document.createElement('span'); text.textContent = task.text;
    checkbox.addEventListener('change', () => { task.done = checkbox.checked; item.classList.toggle('done', task.done); saveStored('pomodoro-tasks', tasks); updateTaskSummary(); if (task.done) notify('Mais um passo concluído. Boa!'); });
    const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'delete-task'; remove.textContent = '×'; remove.setAttribute('aria-label', `Excluir tarefa: ${task.text}`);
    remove.addEventListener('click', () => { tasks.splice(index, 1); saveStored('pomodoro-tasks', tasks); renderTasks(); $('task-input').focus(); });
    label.append(checkbox, text); item.append(label, remove); list.append(item);
  }); updateTaskSummary();
}
function updateTaskSummary() { const done = tasks.filter(task => task.done).length; $('task-count').textContent = `${done}/${tasks.length}`; $('tasks-empty').hidden = tasks.length > 0; $('task-progress-bar').style.width = `${tasks.length ? done / tasks.length * 100 : 0}%`; $('task-summary').textContent = tasks.length ? `${done} de ${tasks.length} ${tasks.length === 1 ? 'tarefa concluída' : 'tarefas concluídas'}${done === tasks.length ? '. Tudo feito por aqui!' : '. Um passo de cada vez.'}` : 'Cada pequeno passo conta.'; }
$('task-form').addEventListener('submit', event => { event.preventDefault(); const text = $('task-input').value.trim(); if (!text) return; tasks.push({ text, done: false }); saveStored('pomodoro-tasks', tasks); renderTasks(); $('task-input').value = ''; $('task-input').focus(); });
function youtubeEmbed(value) {
  let url; try { url = new URL(value); } catch { return null; }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  const host = url.hostname.toLowerCase();
  if (!['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtu.be', 'www.youtu.be'].includes(host)) return null;
  const playlist = url.searchParams.get('list');
  if (playlist && /^[a-zA-Z0-9_-]{10,100}$/.test(playlist)) return `https://www.youtube-nocookie.com/embed/videoseries?list=${encodeURIComponent(playlist)}`;
  const parts = url.pathname.split('/').filter(Boolean);
  const video = host.endsWith('youtu.be') ? parts[0] : url.searchParams.get('v') || (['embed', 'shorts', 'live', 'v'].includes(parts[0]) ? parts[1] : null);
  return video && /^[a-zA-Z0-9_-]{11}$/.test(video) ? `https://www.youtube-nocookie.com/embed/${video}` : null;
}
$('playlist-form').addEventListener('submit', event => {
  event.preventDefault(); const value = $('playlist-url').value.trim(); const embed = youtubeEmbed(value); const feedback = $('playlist-feedback'); feedback.classList.toggle('error', !embed);
  if (!embed) { feedback.textContent = 'Use um link válido de vídeo ou playlist do YouTube.'; return; }
  const iframe = document.createElement('iframe'); iframe.src = embed; iframe.title = 'Player do YouTube — sua trilha de foco'; iframe.allow = 'encrypted-media; picture-in-picture; fullscreen'; iframe.allowFullscreen = true; iframe.referrerPolicy = 'strict-origin-when-cross-origin';
  $('youtube-player').classList.remove('player-placeholder'); $('youtube-player').replaceChildren(iframe); $('youtube-external').href = value; $('youtube-external').hidden = false;
  feedback.textContent = 'Dê play quando quiser. Se o vídeo bloquear a reprodução, abra no YouTube.';
});
$('today').textContent = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
renderTimer(); renderTasks(); renderStats();
