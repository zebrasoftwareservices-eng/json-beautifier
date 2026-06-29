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
2. npm run type-check
3. npm run build
   Only push if all three pass — no exceptions.

## Color tokens (three-surface dark mode design system — JSO-15)

Surface layers:

- `--surface-base`: #0f1117 (page background, outermost shell)
- `--surface-panel`: #161b27 (editor, tree view, primary content)
- `--surface-elevated`: #1e2535 (toolbar, nav, inputs, modals)
- `--border`: #252d3d

Text:

- `--text-primary`: #e2e8f0
- `--text-secondary`: #94a3b8
- `--text-muted`: #475569

Accent / semantic:

- `--accent`: #6366f1
- `--accent-muted`: #a78bfa
- `--accent-bg`: rgba(99,102,241,0.1/0.15 in dark) — hover/subtle tint
- `--accent-bg-strong`: rgba(99,102,241,0.3/0.35 in dark) — highlights
- `--accent-border`: rgba(99,102,241,0.4) — outline rings
- `--success`: #0d9488
- `--warning`: #d97706
- `--error`: #ef4444
- `--error-bg`: rgba(239,68,68,0.08) — error banner fill
- `--error-border-subtle`: rgba(239,68,68,0.2) — snippet border
- `--warning-bg`: rgba(234,179,8,0.08) — warning banner fill
- `--text-on-accent`: #fff — text on accent/success backgrounds

Component surfaces:

- `--code-bg`: code block background (maps to surface-elevated in dark)
- `--social-bg`: social proof card background
- `--shadow`: box-shadow definition

Fonts:

- UI chrome: `Inter` (var(--sans))
- Code content: `JetBrains Mono` (var(--mono))

## Phase 1 only — do not build yet

- Auth / user accounts
- Share links
- Large file support >1MB
- Schema validation

## Linear project

- Team: Engineering Team (JSO)
- Current: JSO-5 scaffold → JSO-6 Web Worker parser next

## Testing workflow

After implementing any new feature or fixing a bug, run the
test-writer subagent BEFORE opening a PR — not after merge.

Example: "Use the test-writer subagent to write tests for [feature]."

This is mandatory for any change touching:

- Parsing/formatting logic (beautify, minify, validate, repair)
- User input handling (paste, upload, URL load)
- Any function with edge cases (empty input, malformed data, large files)
