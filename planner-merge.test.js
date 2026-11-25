import test from "node:test";
import assert from "node:assert/strict";
import { mergeDay } from "./planner-merge.js";
const day = (o = {}) => ({ hours: {}, goals: [{ text: "", done: false }, { text: "", done: false }, { text: "", done: false }, { text: "", done: false }], todos: [], notes: "", ...o });
test("todo added on each device: both kept", () => {
  const base = day(), local = day({ todos: [{ id: "a", text: "A", done: false }] }), remote = day({ todos: [{ id: "b", text: "B", done: false }] });
  assert.deepEqual(mergeDay(base, local, remote).day.todos.map((t) => t.id).sort(), ["a", "b"]);
});
test("different hours edited: both kept, no conflict", () => {
  const r = mergeDay(day(), day({ hours: { 9: "gym" } }), day({ hours: { 10: "study" } }));
  assert.deepEqual(r.day.hours, { 9: "gym", 10: "study" }); assert.equal(r.conflicts, 0);
});
test("same hour edited differently: both versions kept and counted", () => {
  const r = mergeDay(day({ hours: { 9: "x" } }), day({ hours: { 9: "gym" } }), day({ hours: { 9: "study" } }));
  assert.equal(r.day.hours[9], "gym | study"); assert.equal(r.conflicts, 1);
});
test("todo ticked here, another added there", () => {
  const t = { id: "a", text: "A", done: false }, base = day({ todos: [t] });
  const r = mergeDay(base, day({ todos: [{ ...t, done: true }] }), day({ todos: [t, { id: "b", text: "B", done: false }] }));
  assert.equal(r.day.todos.find((x) => x.id === "a").done, true); assert.equal(r.day.todos.length, 2);
});
test("notes edited on both: both kept", () => {
  const r = mergeDay(day(), day({ notes: "mine" }), day({ notes: "theirs" }));
  assert.ok(r.day.notes.includes("mine") && r.day.notes.includes("theirs"));
});
test("unchanged here: remote wins", () => {
  const base = day({ notes: "a" }); assert.equal(mergeDay(base, base, day({ notes: "b" })).day.notes, "b");
});
