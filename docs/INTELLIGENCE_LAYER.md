# Intelligence Layer

## Messy Inputs
Task descriptions entered free-form by finance staff — varying length, terminology, sometimes missing due dates or unclear priority.

## Auto-Structure Schema (AI priority suggestion)
```json
{
  "task_id": "uuid",
  "ai_suggested_priority": "high",
  "ai_priority_source": "rule-based-v1",
  "ai_priority_confidence": 0.82,
  "ai_priority_review_status": "unreviewed",
  "reasoning": "Due in 2 days, amount > 50k, category=Payment"
}
```

## Events to Track
- task.created, task.status_changed, task.updated, task.completed

## Scoring Rules (v1 — rule-based, no model call)
| Rule | Score |
|------|-------|
| due_date < today | +0.40 (overdue boost) |
| due_date within 3 days | +0.25 |
| amount > 50,000 | +0.20 |
| category = Payment or Audit | +0.15 |
| score ≥ 0.50 → suggested high; 0.30–0.49 → medium; <0.30 → low |

## What Gets Ranked
Tasks within each category card ranked by: priority (high→low), then due_date (earliest first).

## v1 vs Later
- **v1:** Rule-based priority suggestion shown as a badge; user-set priority always wins.
- **Later:** LLM-assisted description categorisation, natural-language task entry, smart reminders.
