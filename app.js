import { HOURS, hourLabel, WEEKDAYS, getDay, setHour, setGoal, setNotes, addDayTodo, toggleDayTodo, removeDayTodo, migrateLegacy, dayProgress, weekdayIndex, shiftDate } from "./planner.js";

const KEY = "daily-planner-v1", LEGACY = "todo-list-v1", MIGRATED = "daily-planner-migrated-v1";
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const todayStr = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

// Storage: local only for now. A cloud backend would replace these two functions.
let storeKey = KEY; // switches to a per-account cache key while signed in
const store = {
  load() { try { return JSON.parse(localStorage.getItem(storeKey)) || {}; } catch { return {}; } },
  save(d) { localStorage.setItem(storeKey, JSON.stringify(d)); },
};
let data = store.load(), date = todayStr();

// One-time move of the old todo list's saved tasks into today's checklist. The old key is left untouched.
if (!localStorage.getItem(MIGRATED)) {
  try {
    const old = JSON.parse(localStorage.getItem(LEGACY));
    if (Array.isArray(old) && old.length) { data = migrateLegacy(data, date, old); store.save(data); }
  } catch {}
  localStorage.setItem(MIGRATED, "1");
}
let cloud = null, uid = null, timers = {};
const commit = (next) => { data = next; store.save(data); paintProgress(); queueCloud(date); };
function queueCloud(d) {
  if (!cloud || !uid) return;
  const u = uid; clearTimeout(timers[d]); setStatus("Saving…");
  timers[d] = setTimeout(() => cloud.saveDay(u, d, getDay(data, d)).then(() => setStatus("Synced to your account."), (e) => setStatus("Not synced: " + (e.code || e.message))), 500);
}
function setStatus(t) { $("#sync").textContent = t; }

function paintWeekdays() {
  const w = weekdayIndex(date);
  $("#weekdays").innerHTML = WEEKDAYS.map((l, i) => `<span class="${i === w ? "on" : ""}" ${i === w ? 'aria-current="date"' : ""}>${l}</span>`).join("");
}
function paintProgress() {
  const p = dayProgress(getDay(data, date));
  const bits = [];
  if (p.agendaTotal) bits.push(`agenda ${p.agendaDone}/${p.agendaTotal}`);
  if (p.goalsTotal) bits.push(`goals ${p.goalsDone}/${p.goalsTotal}`);
  if (p.todosTotal) bits.push(`tasks ${p.todosDone}/${p.todosTotal}`);
  $("#progress").textContent = bits.length ? "Done: " + bits.join(" · ") : "Nothing planned yet.";
}
function render() {
  const day = getDay(data, date), nowH = date === todayStr() ? new Date().getHours() : -1;
  $("#date").value = date; paintWeekdays();
  $("#hours").innerHTML = HOURS.map((h) => {
    const s = day.hours[h] || { text: "", done: false };
    return `<li data-h="${h}" class="${s.done ? "done" : ""} ${h === nowH ? "now" : ""}"><time>${hourLabel(h)}</time><label class="hit"><input class="box" type="checkbox" ${s.done ? "checked" : ""} aria-label="${hourLabel(h)} done"></label><input type="text" value="${esc(s.text)}" maxlength="200" aria-label="Activity at ${hourLabel(h)}"></li>`;
  }).join("");
  $("#goals").innerHTML = day.goals.map((g, i) =>
    `<li data-i="${i}" class="${g.done ? "gdone" : ""}"><label class="hit"><input class="dot" type="checkbox" ${g.done ? "checked" : ""} aria-label="Goal ${i + 1} done"></label><input type="text" value="${esc(g.text)}" maxlength="120" placeholder="Goal ${i + 1}" aria-label="Goal ${i + 1}"></li>`).join("");
  $("#todos").innerHTML = day.todos.map((t) =>
    `<li data-id="${esc(t.id)}" class="${t.done ? "done" : ""}"><label class="hit"><input class="box" type="checkbox" ${t.done ? "checked" : ""} aria-label="Done: ${esc(t.text)}"></label><span>${esc(t.text)}</span><button class="x" aria-label="Delete ${esc(t.text)}">✕</button></li>`).join("") || "<li class='none'>No tasks for this day.</li>";
  $("#notes").value = day.notes;
  paintProgress();
}

$("#hours").addEventListener("input", (e) => {
  const li = e.target.closest("li"); if (!li) return;
  const h = Number(li.dataset.h);
  if (e.target.type === "checkbox") { commit(setHour(data, date, h, { done: e.target.checked })); li.classList.toggle("done", e.target.checked); }
  else commit(setHour(data, date, h, { text: e.target.value }));
});
$("#goals").addEventListener("input", (e) => {
  const li = e.target.closest("li"); if (!li) return;
  const i = Number(li.dataset.i);
  if (e.target.type === "checkbox") { commit(setGoal(data, date, i, { done: e.target.checked })); li.classList.toggle("gdone", e.target.checked); }
  else commit(setGoal(data, date, i, { text: e.target.value }));
});
$("#notes").addEventListener("input", (e) => commit(setNotes(data, date, e.target.value)));
$("#addtodo").onsubmit = (e) => {
  e.preventDefault();
  try { commit(addDayTodo(data, date, $("#newtodo").value)); $("#newtodo").value = ""; $("#err").textContent = ""; render(); $("#newtodo").focus(); }
  catch (err) { $("#err").textContent = err.message; }
};
$("#todos").addEventListener("click", (e) => {
  const li = e.target.closest("li[data-id]"); if (!li) return;
  if (e.target.matches(".x")) { commit(removeDayTodo(data, date, li.dataset.id)); render(); }
  else if (e.target.matches(".box")) { commit(toggleDayTodo(data, date, li.dataset.id)); render(); }
});
const go = (d) => { date = d; render(); };
$("#prev").onclick = () => go(shiftDate(date, -1));
$("#next").onclick = () => go(shiftDate(date, 1));
$("#today").onclick = () => go(todayStr());
$("#date").onchange = (e) => { if (/^\d{4}-\d{2}-\d{2}$/.test(e.target.value)) go(e.target.value); };
render();

// ---- Google sign-in + sync ----
const authBox = $("#auth");
function paintAuth(user) {
  authBox.innerHTML = user
    ? `<span class="who">${esc(user.displayName || user.email || "Signed in")}</span> <button id="out" type="button">Sign out</button>`
    : `<button id="in" type="button">Sign in with Google</button>`;
}
async function startCloud() {
  try { cloud = cloud || await import("./cloud.js"); } catch (e) { setStatus("Sync unavailable (offline?). Saved on this device only."); return; }
  let stop = null;
  await cloud.watchAuth(async (user) => {
    if (stop) { stop(); stop = null; }
    for (const k in timers) clearTimeout(timers[k]);
    paintAuth(user);
    if (!user) { uid = null; storeKey = KEY; data = store.load(); render(); localStorage.removeItem("planner-cloud-on"); setStatus("Saved on this device only. Sign in to sync."); return; }
    localStorage.setItem("planner-cloud-on", "1");
    uid = user.uid; storeKey = KEY + "-cloud-" + uid; data = store.load(); render(); setStatus("Syncing…");
    let first = true;
    stop = await cloud.watchDays(uid, (d, day, cached, ready) => {
      if (ready) {
        first = false;
        let dev = {}; try { dev = JSON.parse(localStorage.getItem(KEY)) || {}; } catch {}
        const IMP = "planner-imported-" + uid;
        const add = Object.keys(dev).filter((k) => /^\d{4}-\d{2}-\d{2}$/.test(k) && !ready.includes(k));
        if (add.length && !cached && !localStorage.getItem(IMP)) {
          localStorage.setItem(IMP, "1");
          if (confirm(`Add ${add.length} day(s) saved on this device to your account?\nDays your account already has are NOT touched. This device's copy stays as it is.`)) {
            data = { ...data }; add.forEach((k) => { data[k] = dev[k]; cloud.saveDay(uid, k, getDay(data, k)); }); store.save(data); render(); setStatus("Added this device's days to your account.");
            return;
          }
        }
        setStatus(cached ? "Offline, showing saved copy." : "Synced to your account."); return;
      }
      if (day) { data = { ...data, [d]: day }; } else { const n = { ...data }; delete n[d]; data = n; }
      store.save(data);
      const typing = document.activeElement && document.activeElement.closest && document.activeElement.closest("main, .sheet") && /INPUT|TEXTAREA/.test(document.activeElement.tagName);
      if (d === date && !typing) render(); else paintProgress();
      if (first) { first = false; setStatus(cached ? "Offline, showing saved copy." : "Synced to your account."); }
    }, (e) => setStatus("Not synced: " + (e.code || e.message)));
  });
}
authBox.addEventListener("click", async (e) => {
  if (e.target.id === "in") { await startCloud(); try { await cloud.signIn(); } catch (err) { setStatus("Sign-in failed: " + (err.code || err.message)); } }
  if (e.target.id === "out") { await cloud.signOut(); }
});
paintAuth(null);
if (localStorage.getItem("planner-cloud-on")) startCloud();
