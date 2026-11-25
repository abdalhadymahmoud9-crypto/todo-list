import { test } from "node:test";
import assert from "node:assert/strict";
import { addTodo, toggleTodo, editTodo, removeTodo, clearDone, filterTodos, remaining, createTodo } from "./todo.js";

test("adds a trimmed task", () => {
  const l = addTodo([], "  buy milk ");
  assert.equal(l.length, 1);
  assert.equal(l[0].text, "buy milk");
  assert.equal(l[0].done, false);
});
test("rejects empty text", () => assert.throws(() => createTodo("   ")));
test("toggles done", () => {
  const l = addTodo([], "a");
  assert.equal(toggleTodo(l, l[0].id)[0].done, true);
});
test("edits and removes on empty edit", () => {
  const l = addTodo([], "a");
  assert.equal(editTodo(l, l[0].id, "b")[0].text, "b");
  assert.equal(editTodo(l, l[0].id, " ").length, 0);
});
test("removes, filters, counts, clears", () => {
  let l = addTodo(addTodo([], "a"), "b");
  l = toggleTodo(l, l[0].id);
  assert.equal(remaining(l), 1);
  assert.equal(filterTodos(l, "done").length, 1);
  assert.equal(filterTodos(l, "active").length, 1);
  assert.equal(filterTodos(l, "all").length, 2);
  assert.equal(clearDone(l).length, 1);
  assert.equal(removeTodo(l, l[1].id).length, 1);
});
test("does not mutate input", () => {
  const l = addTodo([], "a"); const copy = JSON.stringify(l);
  toggleTodo(l, l[0].id); removeTodo(l, l[0].id);
  assert.equal(JSON.stringify(l), copy);
});
