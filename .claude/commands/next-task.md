---
description: Pick up the next priority issue from Linear and implement it end to end
---

Check the Engineering Team's current Linear cycle for the highest 
priority unstarted issue. Read its full description and acceptance 
criteria. Read CLAUDE.md for project rules. Create a branch named 
after the issue, implement it, then use the test-writer subagent to 
write tests. If it touches user input, URL fetching, or uploads, 
use the security-reviewer subagent before committing. Run lint, 
type-check, build, and test locally. Commit, push, and open a PR 
referencing the Linear issue number.

Stop after this one issue and report back what you did — 
don't automatically pick a second one.