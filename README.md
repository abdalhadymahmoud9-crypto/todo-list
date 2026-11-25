# Daily Planner

A browser daily planner on cream paper with sage green: an hourly agenda from 04:00 to 22:00 (24-hour times) with a done checkbox per slot, the date and weekday, four goals for the day, a to-do checklist and notes. Move between days with the arrows or the date picker. No frameworks, no build step.

Live: https://abdalhadymahmoud9-crypto.github.io/todo-list/

## Data
Saved in the browser (localStorage key `daily-planner-v1`, one record per date). There is no account and no sync yet, so data stays on the device and browser you use. Tasks saved by the earlier version of this app (`todo-list-v1`) are copied once into today's checklist; the old data is left in place.

## Run
Serve the folder with any static server, for example `python3 -m http.server`, and open http://localhost:8000.

## Test
`npm test` (Node 18+). `planner.test.js` covers the day logic (hours, goals, notes, checklist, migration, dates) and `todo.test.js` covers the checklist helpers.

## Files
- `planner.js`: pure day logic, no DOM.
- `todo.js`: pure checklist helpers used by the planner.
- `app.js`: page wiring and storage.
- `index.html` / `style.css`: structure and look. The layout is inspired by a printable daily planner sheet; the icons and artwork are not copied.

## Credits
Built with AI assistance.
