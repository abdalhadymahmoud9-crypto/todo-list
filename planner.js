// Pure logic for the daily planner. One "day" object per date (YYYY-MM-DD).
import { addTodo, toggleTodo, editTodo, removeTodo } from "./todo.js";

export const FIRST_HOUR = 4, LAST_HOUR = 22, GOAL_COUNT = 4;
export const HOURS = Array.from({ length: LAST_HOUR - FIRST_HOUR + 1 }, (_, i) => FIRST_HOUR + i);
export const hourLabel = (h) => `${String(h).padStart(2, "0")}:00`;
export const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function emptyDay() {
  return {
    hours: {},
    goals: Array.from({ length: GOAL_COUNT }, () => ({ text: "", done: false })),
    todos: [],
    notes: "",
  };
}

export function getDay(data, date) {
  if (!DATE_RE.test(date)) throw new Error("Bad date");
  const d = data[date];
  if (!d) return emptyDay();
  return { ...emptyDay(), ...d, goals: Array.from({ length: GOAL_COUNT }, (_, i) => d.goals?.[i] || { text: "", done: false }) };
}
const put = (data, date, day) => ({ ...data, [date]: day });
const clamp = (s, n) => String(s ?? "").slice(0, n);

export function setHour(data, date, hour, patch) {
  if (!HOURS.includes(hour)) throw new Error("Hour must be 4-22");
  const day = getDay(data, date), cur = day.hours[hour] || { text: "", done: false };
  const next = { text: patch.text !== undefined ? clamp(patch.text, 200) : cur.text, done: patch.done !== undefined ? !!patch.done : cur.done };
  const hours = { ...day.hours };
  if (!next.text && !next.done) delete hours[hour]; else hours[hour] = next;
  return put(data, date, { ...day, hours });
}

export function setGoal(data, date, i, patch) {
  if (!Number.isInteger(i) || i < 0 || i >= GOAL_COUNT) throw new Error("Goal index out of range");
  const day = getDay(data, date), goals = day.goals.map((g) => ({ ...g }));
  if (patch.text !== undefined) goals[i].text = clamp(patch.text, 120);
  if (patch.done !== undefined) goals[i].done = !!patch.done;
  return put(data, date, { ...day, goals });
}

export function setNotes(data, date, notes) {
  return put(data, date, { ...getDay(data, date), notes: clamp(notes, 2000) });
}

export function addDayTodo(data, date, text) {
  const day = getDay(data, date);
  return put(data, date, { ...day, todos: addTodo(day.todos, text) });
}
export function toggleDayTodo(data, date, id) {
  const day = getDay(data, date);
  return put(data, date, { ...day, todos: toggleTodo(day.todos, id) });
}
export function removeDayTodo(data, date, id) {
  const day = getDay(data, date);
  return put(data, date, { ...day, todos: removeTodo(day.todos, id) });
}
export function editDayTodo(data, date, id, text) {
  const day = getDay(data, date);
  return put(data, date, { ...day, todos: editTodo(day.todos, id, text) });
}

// Moves tasks from the old single-list todo app (key todo-list-v1) into one day's checklist.
// Skips ids already present so running it twice never duplicates tasks.
export function migrateLegacy(data, date, legacy) {
  if (!Array.isArray(legacy)) return data;
  const day = getDay(data, date), have = new Set(day.todos.map((t) => t.id));
  const add = legacy.filter((t) => t && typeof t.text === "string" && t.text.trim() && !have.has(t.id))
    .map((t) => ({ id: String(t.id), text: t.text.trim(), done: !!t.done }));
  return add.length ? put(data, date, { ...day, todos: [...day.todos, ...add] }) : data;
}

export function dayProgress(day) {
  const slots = Object.values(day.hours).filter((h) => h.text);
  return { agendaDone: slots.filter((h) => h.done).length, agendaTotal: slots.length,
    goalsDone: day.goals.filter((g) => g.done && g.text).length, goalsTotal: day.goals.filter((g) => g.text).length,
    todosDone: day.todos.filter((t) => t.done).length, todosTotal: day.todos.length };
}

export function weekdayIndex(date) { return new Date(date + "T12:00:00Z").getUTCDay(); }
export function shiftDate(date, days) {
  const d = new Date(date + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10);
}
