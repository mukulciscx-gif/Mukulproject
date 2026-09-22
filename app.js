const taskForm = document.querySelector("#task-form");
const taskInput = document.querySelector("#task-input");
const taskPriority = document.querySelector("#task-priority");
const taskDue = document.querySelector("#task-due");
const taskList = document.querySelector("#task-list");
const taskCount = document.querySelector("#task-count");
const progressFill = document.querySelector("#progress-fill");
const notes = document.querySelector("#notes");
const timer = document.querySelector("#timer");
const startTimer = document.querySelector("#start-timer");
const resetTimer = document.querySelector("#reset-timer");
const themeToggle = document.querySelector("#theme-toggle");

const taskKey = "mukul-focus-tasks";
const noteKey = "mukul-focus-notes";
const themeKey = "mukul-focus-theme";
let tasks = JSON.parse(localStorage.getItem(taskKey) || "[]");
let secondsLeft = 25 * 60;
let timerId = null;

const priorityLabels = { high: "High", medium: "Medium", low: "Low" };

const today = new Date();
document.querySelector("#weekday").textContent = today.toLocaleDateString("en-IN", {
  weekday: "long",
});
document.querySelector("#today").textContent = today.toLocaleDateString("en-IN", {
  day: "numeric",
  month: "short",
});

notes.value = localStorage.getItem(noteKey) || "";

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  themeToggle.textContent = theme === "dark" ? "Light mode" : "Dark mode";
}

applyTheme(localStorage.getItem(themeKey) || "light");

themeToggle.addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  localStorage.setItem(themeKey, next);
  applyTheme(next);
});

function saveTasks() {
  localStorage.setItem(taskKey, JSON.stringify(tasks));
}

function isOverdue(task) {
  if (!task.dueDate || task.done) return false;
  return new Date(`${task.dueDate}T23:59:59`) < new Date();
}

function formatDueDate(value) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

function renderTasks() {
  const openCount = tasks.filter((task) => !task.done).length;
  taskCount.textContent = `${openCount} open`;

  const percent = tasks.length
    ? Math.round((tasks.filter((task) => task.done).length / tasks.length) * 100)
    : 0;
  progressFill.style.width = `${percent}%`;

  if (!tasks.length) {
    taskList.innerHTML = '<li class="empty">No tasks yet. Add one above.</li>';
    return;
  }

  taskList.innerHTML = tasks
    .map((task) => {
      const priority = task.priority || "medium";
      const overdue = isOverdue(task);
      return `
    <li class="task-item" data-id="${task.id}">
      <button class="toggle" type="button" aria-label="Toggle task">
        ${task.done ? "OK" : ""}
      </button>
      <div class="task-info">
        <span class="task-title ${task.done ? "done" : ""}">${escapeHtml(task.title)}</span>
        <span class="task-meta">
          <span class="badge badge-${priority}">${priorityLabels[priority]}</span>
          ${task.dueDate ? `<span class="due ${overdue ? "overdue" : ""}">Due ${formatDueDate(task.dueDate)}</span>` : ""}
        </span>
      </div>
      <button class="delete" type="button" aria-label="Delete task">x</button>
    </li>
  `;
    })
    .join("");
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return map[char];
  });
}

function updateTimer() {
  const minutes = Math.floor(secondsLeft / 60).toString().padStart(2, "0");
  const seconds = (secondsLeft % 60).toString().padStart(2, "0");
  timer.textContent = `${minutes}:${seconds}`;
}

function playAlertSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.35].forEach((delay) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + 0.3);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(ctx.currentTime + delay);
      oscillator.stop(ctx.currentTime + delay + 0.3);
    });
  } catch (err) {
    // Web Audio unavailable; skip the sound silently.
  }
}

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = taskInput.value.trim();
  if (!title) return;

  tasks.unshift({
    id: crypto.randomUUID(),
    title,
    done: false,
    priority: taskPriority.value,
    dueDate: taskDue.value || null,
  });
  taskInput.value = "";
  taskDue.value = "";
  taskPriority.value = "medium";
  saveTasks();
  renderTasks();
});

taskList.addEventListener("click", (event) => {
  const item = event.target.closest(".task-item");
  if (!item) return;

  if (event.target.classList.contains("toggle")) {
    tasks = tasks.map((task) =>
      task.id === item.dataset.id ? { ...task, done: !task.done } : task,
    );
  }

  if (event.target.classList.contains("delete")) {
    tasks = tasks.filter((task) => task.id !== item.dataset.id);
  }

  saveTasks();
  renderTasks();
});

notes.addEventListener("input", () => {
  localStorage.setItem(noteKey, notes.value);
});

startTimer.addEventListener("click", () => {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
    startTimer.textContent = "Start";
    return;
  }

  startTimer.textContent = "Pause";
  timerId = setInterval(() => {
    secondsLeft -= 1;
    updateTimer();

    if (secondsLeft <= 0) {
      clearInterval(timerId);
      timerId = null;
      secondsLeft = 25 * 60;
      startTimer.textContent = "Start";
      updateTimer();
      playAlertSound();
    }
  }, 1000);
});

resetTimer.addEventListener("click", () => {
  clearInterval(timerId);
  timerId = null;
  secondsLeft = 25 * 60;
  startTimer.textContent = "Start";
  updateTimer();
});

renderTasks();
updateTimer();
