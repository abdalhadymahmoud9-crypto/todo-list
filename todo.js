// Pure logic: no DOM here, so it is easy to test.
export function createTodo(text, now = Date.now()) {
  const clean = String(text).trim();
  if (!clean) throw new Error("Task text is empty");
  return { id: String(now) + Math.random().toString(36).slice(2, 6), text: clean, done: false };
}

export function addTodo(list, text) {
  return [...list, createTodo(text)];
}

export function toggleTodo(list, id) {
  return list.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
}

export function editTodo(list, id, text) {
  const clean = String(text).trim();
  if (!clean) return removeTodo(list, id);
  return list.map((t) => (t.id === id ? { ...t, text: clean } : t));
}

export function removeTodo(list, id) {
  return list.filter((t) => t.id !== id);
}

export function clearDone(list) {
  return list.filter((t) => !t.done);
}

export function filterTodos(list, filter) {
  if (filter === "active") return list.filter((t) => !t.done);
  if (filter === "done") return list.filter((t) => t.done);
  return list;
}

export function remaining(list) {
  return list.filter((t) => !t.done).length;
}
