const taskForm = document.querySelector("#task-form");
const taskInput = document.querySelector("#task-input");
const taskList = document.querySelector("#task-list");
const taskCount = document.querySelector("#task-count");
const notes = document.querySelector("#notes");
const timer = document.querySelector("#timer");
const startTimer = document.querySelector("#start-timer");
const resetTimer = document.querySelector("#reset-timer");

const taskKey = "mukul-focus-tasks";
const noteKey = "mukul-focus-notes";
let tasks = JSON.parse(localStorage.getItem(taskKey) || "[]");
let secondsLeft = 25 * 60;
let timerId = null;

const today = new Date();
document.querySelector("#weekday").textContent = today.toLocaleDateString("en-IN", {
  weekday: "long",
});
document.querySelector("#today").textContent = today.toLocaleDateString("en-IN", {
  day: "numeric",
  month: "short",
});

notes.value = localStorage.getItem(noteKey) || "";

function saveTasks() {
  localStorage.setItem(taskKey, JSON.stringify(tasks));
}

function renderTasks() {
  const openCount = tasks.filter((task) => !task.done).length;
  taskCount.textContent = `${openCount} open`;

  if (!tasks.length) {
    taskList.innerHTML = '<li class="empty">No tasks yet. Add one above.</li>';
    return;
  }

  taskList.innerHTML = tasks
    .map(
      (task) => `
        <li class="task-item ${task.done ? "done" : ""}" data-id="${task.id}">
          <button class="toggle" type="button" aria-label="Toggle task">
            ${task.done ? "OK" : ""}
          </button>
          <span>${escapeHtml(task.title)}</span>
          <button class="delete" type="button" aria-label="Delete task">x</button>
        </li>
      `,
    )
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

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = taskInput.value.trim();
  if (!title) return;

  tasks.unshift({
    id: crypto.randomUUID(),
    title,
    done: false,
  });
  taskInput.value = "";
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
