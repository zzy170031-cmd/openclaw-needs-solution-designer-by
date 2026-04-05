# Client Needs Triage V1 Handoff

This handoff captures the corrected v1 direction for a downstream skill idea derived from the outward-facing needs-clarification flow.

It is intentionally narrow.
It is not a sales tool, not a quoting tool, and not a customer-reply automation tool.

## Core Problem

The real job is:

- take a messy customer request
- make it understandable
- show what is already known
- show what is still missing
- show what looks risky or contradictory
- produce a stable, structured result that a human can continue from

## What This Skill Is

V1 should be:

- a client-needs triage skill
- a structured clarification and output skill
- a single-input, single-result workflow

V1 should not be:

- a sales assistant
- a quoting system
- a CRM updater
- an auto-reply tool
- a task-creation agent

## Recommended V1 Input

- customer text
- or already-transcribed voice text

V1 should not depend on:

- live audio processing
- external systems
- customer history
- pricing logic
- business approval logic

## Recommended V1 Output

Keep the output fixed to 6 fields:

1. Customer request in one sentence
2. Known information
3. Missing information
4. Risks or contradictions
5. Suggested follow-up questions
6. Next-step category

## Corrected Next-Step Categories

Use only one primary category per result:

1. `Needs more information`
2. `Ready for internal processing`
3. `Risk requires human judgment`

Add at most one short reason line after the category.

Do not output:

- a price
- a quote recommendation
- a business approval
- a task breakdown
- a customer-facing reply

## Why These Categories

These three categories keep v1 stable:

- `Needs more information` keeps the skill honest when input is incomplete
- `Ready for internal processing` allows a clean handoff without pretending execution has started
- `Risk requires human judgment` prevents the skill from faking certainty on ambiguous or sensitive requests

They also prevent the skill from drifting into:

- sales judgment
- workflow orchestration
- execution approval

## Explicit V1 Stop Boundary

Stop after producing a clean triage result.

Do not:

- reply to the customer
- quote or estimate
- create tasks
- call systems
- make final business decisions

## Open Writing Notes

When this becomes a formal `SKILL.md`, reinforce these rules:

- all conclusions are based only on the current input
- `Ready for internal processing` does not mean approved for execution
- the skill organizes and clarifies
- the human still decides what happens next
