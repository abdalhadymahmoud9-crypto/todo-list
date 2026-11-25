// Firebase Auth (Google) + Firestore. Data lives at users/{uid}/days/{YYYY-MM-DD}.
// Security is enforced by Firestore rules (only the signed-in owner can read or write), not by this code.
import { firebaseConfig } from "./firebase-config.js";
const V = "11.0.2", B = `https://www.gstatic.com/firebasejs/${V}/`;
let mods;
async function load() {
  if (mods) return mods;
  const [app, auth, fs] = await Promise.all([import(B + "firebase-app.js"), import(B + "firebase-auth.js"), import(B + "firebase-firestore.js")]);
  const a = app.initializeApp(firebaseConfig);
  mods = { app, auth, fs, a, au: auth.getAuth(a), db: fs.getFirestore(a) };
  return mods;
}
export async function watchAuth(cb) { const m = await load(); return m.auth.onAuthStateChanged(m.au, cb); }
export async function signIn() { const m = await load(); await m.auth.signInWithPopup(m.au, new m.auth.GoogleAuthProvider()); }
export async function signOut() { const m = await load(); await m.auth.signOut(m.au); }
// Calls onDay(date, dayObj|null, fromServerOrOtherSession) for every remote change. Returns unsubscribe.
export async function watchDays(uid, onDay, onError) {
  const m = await load(), { collection, onSnapshot } = m.fs;
  let ready = false;
  return onSnapshot(collection(m.db, "users", uid, "days"), (snap) => {
    if (!ready) { ready = true; onDay("", null, snap.metadata.fromCache, snap.size + 1); }
    snap.docChanges().forEach((c) => {
      if (c.doc.metadata.hasPendingWrites) return; // our own unsent write
      let day = null; try { day = JSON.parse(c.doc.data().json); } catch {}
      onDay(c.doc.id, c.type === "removed" ? null : day, snap.metadata.fromCache);
    });
  }, onError);
}
export async function saveDay(uid, date, day) {
  const m = await load(), { doc, setDoc } = m.fs;
  await setDoc(doc(m.db, "users", uid, "days", date), { json: JSON.stringify(day), updatedAt: Date.now() });
}
export async function probeOther(uid) { // used by isolation tests: try reading another user's data
  const m = await load(), { collection, getDocs } = m.fs;
  return getDocs(collection(m.db, "users", uid, "days"));
}
export const exposeForTests = async () => (await load());
