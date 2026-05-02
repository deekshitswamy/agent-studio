# Agent Runner v2 Task Queue Retrospective

## What Worked
- The v2 queue scope stayed small and file-based.
- `tasks.json` was enough to support basic queue state without introducing unnecessary complexity.
- Explicit queue commands kept queue management separate from normal agent execution.
- Human-in-the-loop task selection remained intact.
- Existing Agent Runner v1 behavior stayed stable while v2 queue features were added.

## What Drifted
- The first v2 planning chain stopped early because the Architect output mentioned out-of-scope concepts in explanatory text, which triggered the lightweight quality checker.
- Task Planner initially recommended a selected task file, but the file itself had to be filled in afterward before Dev execution could proceed cleanly.
- Some continuity lived in logs before it was promoted into more durable state and release docs.

## What Was Intentionally Avoided
- No automation loop
- No auto task execution
- No dependency resolver
- No priority system
- No UI
- No database
- No async/background worker
- No chain expansion beyond the current bounded model
- No coupling between queue state changes and Dev `--task` execution

## Next Recommended Milestone
- Add empty task file warnings or improve task lifecycle/operator docs, while keeping queue validation read-only and the workflow human-in-the-loop.
