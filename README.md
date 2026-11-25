# Todo List

A small browser todo app: add, complete, edit, delete, filter and clear tasks. Data is saved in the browser (localStorage). No frameworks, no build step.

## Run
Open `index.html` through any static server, for example `python3 -m http.server` and visit http://localhost:8000.

## Test
`npm test` (Node 18+). Tests (`todo.test.js`) cover the logic in `todo.js`.

## How it works
- `todo.js`: pure functions that take a list and return a new list. No DOM, so they are easy to test.
- `app.js`: connects the page to those functions, redraws the list, saves to localStorage.
- `index.html` / `style.css`: structure and look.

## Ideas to extend
Due dates, categories, drag to reorder, dark mode, sync with a backend.

## Credits
Built with AI assistance (an AI assistant wrote the first version for the owner of this repository, who reviews, runs and extends it).
