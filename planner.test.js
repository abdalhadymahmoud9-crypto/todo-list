import { test } from "node:test";
import assert from "node:assert/strict";
import { HOURS, hourLabel, getDay, setHour, setGoal, setNotes, addDayTodo, toggleDayTodo, removeDayTodo, migrateLegacy, dayProgress, weekdayIndex, shiftDate, emptyDay } from "./planner.js";

test("hours run 04:00 to 22:00 in 24h format (no AM/PM mix)", () => {
  assert.equal(HOURS.length, 19);
  assert.equal(hourLabel(4), "04:00"); assert.equal(hourLabel(13), "13:00"); assert.equal(hourLabel(22), "22:00");
});
test("empty day has 4 goals and no hours", () => {
  const d = getDay({}, "2026-11-25");
  assert.equal(d.goals.length, 4); assert.deepEqual(d.hours, {}); assert.equal(d.notes, "");
  assert.throws(() => getDay({}, "25/11"));
});
test("agenda slots: write, tick done, clear removes slot, bad hour rejected", () => {
  let s = setHour({}, "2026-11-25", 9, { text: "Math past paper" });
  s = setHour(s, "2026-11-25", 9, { done: true });
  assert.deepEqual(getDay(s, "2026-11-25").hours[9], { text: "Math past paper", done: true });
  s = setHour(s, "2026-11-25", 9, { text: "", done: false });
  assert.equal(getDay(s, "2026-11-25").hours[9], undefined);
  assert.throws(() => setHour({}, "2026-11-25", 3, { text: "x" }));
  assert.throws(() => setHour({}, "2026-11-25", 23, { text: "x" }));
});
test("days are independent", () => {
  let s = setHour({}, "2026-11-25", 5, { text: "Gym" });
  assert.equal(getDay(s, "2026-11-26").hours[5], undefined);
});
test("goals: 4 max, edit and tick, index validated", () => {
  let s = setGoal({}, "2026-11-25", 3, { text: "Finish chapter", done: true });
  assert.deepEqual(getDay(s, "2026-11-25").goals[3], { text: "Finish chapter", done: true });
  assert.throws(() => setGoal({}, "2026-11-25", 4, { text: "x" }));
  assert.throws(() => setGoal({}, "2026-11-25", -1, { text: "x" }));
});
test("notes are stored and capped", () => {
  assert.equal(getDay(setNotes({}, "2026-11-25", "hello"), "2026-11-25").notes, "hello");
  assert.equal(getDay(setNotes({}, "2026-11-25", "x".repeat(5000)), "2026-11-25").notes.length, 2000);
});
test("checklist add/toggle/remove", () => {
  let s = addDayTodo({}, "2026-11-25", "  Buy pens ");
  const id = getDay(s, "2026-11-25").todos[0].id;
  assert.equal(getDay(s, "2026-11-25").todos[0].text, "Buy pens");
  s = toggleDayTodo(s, "2026-11-25", id); assert.equal(getDay(s, "2026-11-25").todos[0].done, true);
  s = removeDayTodo(s, "2026-11-25", id); assert.equal(getDay(s, "2026-11-25").todos.length, 0);
  assert.throws(() => addDayTodo({}, "2026-11-25", "  "));
});
test("legacy migration keeps old tasks and done state, and is idempotent", () => {
  const old = [{ id: "a1", text: "Old task", done: true }, { id: "b2", text: "Another", done: false }, { id: "c3", text: "  " }, null];
  let s = migrateLegacy({}, "2026-11-25", old);
  assert.deepEqual(getDay(s, "2026-11-25").todos, [{ id: "a1", text: "Old task", done: true }, { id: "b2", text: "Another", done: false }]);
  assert.equal(migrateLegacy(s, "2026-11-25", old), s);
  assert.deepEqual(migrateLegacy({}, "2026-11-25", "junk"), {});
});
test("progress counts", () => {
  let s = setHour({}, "2026-11-25", 8, { text: "A", done: true });
  s = setHour(s, "2026-11-25", 9, { text: "B" });
  s = setGoal(s, "2026-11-25", 0, { text: "G", done: true });
  const p = dayProgress(getDay(s, "2026-11-25"));
  assert.deepEqual([p.agendaDone, p.agendaTotal, p.goalsDone, p.goalsTotal], [1, 2, 1, 1]);
});
test("weekday and shift (2026-11-25 is Wednesday)", () => {
  assert.equal(weekdayIndex("2026-11-25"), 3); assert.equal(weekdayIndex("2026-11-22"), 0);
  assert.equal(shiftDate("2026-11-30", 1), "2026-12-01"); assert.equal(shiftDate("2026-03-01", -1), "2026-02-28");
});
