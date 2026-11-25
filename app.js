// UI layer: reads/writes the DOM and localStorage, calls todo.js for all logic.
import { addTodo, toggleTodo, editTodo, removeTodo, clearDone, filterTodos, remaining } from "./todo.js";

const KEY = "todo-list-v1";
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
let todos = load();
let filter = "all";

const $ = (s) => document.querySelector(s);
const listEl = $("#list"), form = $("#form"), input = $("#input"), countEl = $("#count");

function save() { localStorage.setItem(KEY, JSON.stringify(todos)); }
function update(next) { todos = next; save(); render(); }

function render() {
  listEl.innerHTML = "";
  const shown = filterTodos(todos, filter);
  for (const t of shown) {
    const li = document.createElement("li");
    li.className = t.done ? "done" : "";
    const cb = document.createElement("input");
    cb.type = "checkbox"; cb.checked = t.done; cb.ariaLabel = "Mark done";
    cb.onchange = () => update(toggleTodo(todos, t.id));
    const span = document.createElement("span");
    span.textContent = t.text;
    span.ondblclick = () => {
      const v = prompt("Edit task", t.text);
      if (v !== null) update(editTodo(todos, t.id, v));
    };
    const del = document.createElement("button");
    del.textContent = "✕"; del.ariaLabel = "Delete"; del.className = "del";
    del.onclick = () => update(removeTodo(todos, t.id));
    li.append(cb, span, del);
    listEl.append(li);
  }
  if (!shown.length) {
    const li = document.createElement("li");
    li.className = "empty"; li.textContent = "Nothing here yet.";
    listEl.append(li);
  }
  const n = remaining(todos);
  countEl.textContent = `${n} task${n === 1 ? "" : "s"} left`;
  document.querySelectorAll("[data-filter]").forEach((b) =>
    b.classList.toggle("active", b.dataset.filter === filter));
}

form.onsubmit = (e) => {
  e.preventDefault();
  if (!input.value.trim()) return;
  update(addTodo(todos, input.value));
  input.value = "";
};
document.querySelectorAll("[data-filter]").forEach((b) => (b.onclick = () => { filter = b.dataset.filter; render(); }));
$("#clear").onclick = () => update(clearDone(todos));
render();
