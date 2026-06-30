---
description: Pick up the next priority issue from Linear and implement it end to end
---

Check the Engineering Team's current Linear cycle for the highest-priority unstarted issue.

Read:

- Full Linear issue description
- Acceptance criteria
- CLAUDE.md project rules

Before making code changes:

1. Run git branch --show-current
2. Run git status --short
3. Run git fetch origin
4. Confirm the correct base branch from CLAUDE.md or repository rules
5. If there are uncommitted changes, stop and ask me
6. Create a new branch from the correct base branch

Branch format:
<linear-issue-id-lowercase>-short-title

Example:
jso-32-appshell-component

Do not prefix the branch with a username.
Do not create branches like:
elango/jso-32-appshell-component

After creating the branch, verify:

- Linear issue ID
- Current git branch
- Planned files to inspect
- Implementation approach

Implement only this one issue.

Rules:

- Do not touch unrelated files.
- Preserve existing JSON parsing, formatting, validation, and storage logic unless the issue explicitly requires changing it.
- Read only relevant files.
- Do not run a broad project audit.
- Do not pick a second issue.

Testing:

- Use the test-writer subagent after implementation.
- If the issue touches user input, URL fetching, uploads, localStorage, clipboard, parsing, or security-sensitive behavior, use the security-reviewer subagent before committing.
- Run lint, type-check, build, and test locally.

If a script does not exist, report it clearly and use the closest available package.json script.

Before commit:

- Show git diff summary.
- Confirm tests/build status.
- Commit with message:
  <ISSUE-ID>: <short description>

Push the branch and open a PR referencing the Linear issue number.

Stop after this one issue and report:

- Linear issue completed
- Branch name
- Files changed
- Tests run
- PR link
