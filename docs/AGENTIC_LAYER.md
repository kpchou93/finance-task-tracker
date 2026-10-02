# Agentic Layer

## Draftable Actions (low risk — auto)
- Suggest priority on task create/update → writes `ai_suggested_priority` + confidence. User reviews; no status change.
- Tag task with risk level (overdue / approaching deadline) → display-only badge.

## Executable After Approval (medium risk)
- Update task status to `in_progress` (agent drafts, user confirms)
- Bulk mark overdue tasks as `in_progress` (agent proposes batch, user approves)

## Human-Only Actions (critical)
- Delete a task — always requires human click; agent never deletes.
- Edit amount or remarks — always human; agent may suggest corrections but never writes.
- Change due_date — always human.

## Named Tools
| Tool | Risk | Trigger |
|------|------|--------|
| `suggest_priority` | low | task.create / task.update |
| `propose_status_update` | medium | user requests or scheduled check |
| `flag_overdue_batch` | medium | daily scheduled run (later) |

## Audit-Log Fields
action, actor (user_id or 'system'), target_table, target_id, before_value, after_value, timestamp.

## v1 vs Later
- **v1:** `suggest_priority` only (rule-based, no external model).
- **Later:** `propose_status_update`, `flag_overdue_batch`, full audit logging, scheduled runs.
