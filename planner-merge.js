// Three-way merge of one planner day so two devices never silently overwrite each other.
// base = last state this device and the account agreed on, local = this device now, remote = the account now.
// Records (todos) merge by id. Text fields that BOTH sides changed differently keep both versions.
import { mergeValue } from "./merge.js";
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
export function mergeDay(base, local, remote) {
  let conflicts = 0;
  const b = base || {}, l = local || {}, r = remote || {};
  const text = (bv, lv, rv, sep) => {
    if (eq(lv, rv)) return lv;
    if (eq(lv, bv)) return rv;
    if (eq(rv, bv)) return lv;
    if (typeof lv === "string" && typeof rv === "string" && lv && rv) { conflicts++; return lv + sep + rv; }
    conflicts++; return lv || rv;
  };
  const hours = {};
  for (const k of new Set([...Object.keys(l.hours || {}), ...Object.keys(r.hours || {})])) {
    const v = text((b.hours || {})[k], (l.hours || {})[k], (r.hours || {})[k], " | ");
    if (v) hours[k] = v;
  }
  const n = Math.max((l.goals || []).length, (r.goals || []).length, 4), goals = [];
  for (let i = 0; i < n; i++) {
    const bg = (b.goals || [])[i] || { text: "", done: false }, lg = (l.goals || [])[i] || { text: "", done: false }, rg = (r.goals || [])[i] || { text: "", done: false };
    goals.push({ text: text(bg.text, lg.text, rg.text, " | "), done: eq(lg.done, bg.done) ? rg.done : lg.done });
  }
  const todos = mergeValue(b.todos || [], l.todos || [], r.todos || []);
  const notes = text(b.notes, l.notes, r.notes, "\n--- other device ---\n");
  return { day: { hours, goals, todos, notes }, conflicts };
}
