# JSON Beautifier — Project Context

## Tech Stack

- React 19 + TypeScript + Vite
- Tailwind CSS
- CodeMirror 6
- ESLint 10 + Prettier + Husky

## Known dependency rules

- ESLint 10 with TypeScript config → always install `jiti` as devDep
- CodeMirror 6 → needs @codemirror/state + @codemirror/view

## Before every git push

1. npm run lint
2. npm run typecheck
3. npm run build
   Only push if all three pass — no exceptions.

## Color tokens

- background: #1a1e2e
- primary: #6366f1
- success: #0d9488
- error: #ef4444
- border: #2d3250

## Phase 1 only — do not build yet

- Auth / user accounts
- Share links
- Large file support >1MB
- Schema validation

## Linear project

- Team: Engineering Team (JSO)
- Current: JSO-5 scaffold → JSO-6 Web Worker parser next
