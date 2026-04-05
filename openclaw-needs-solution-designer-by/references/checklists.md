# Checklists

Use this file when you need a tighter pass on clarity, reuse judgment, or handoff quality.

## Minimum-Clarity Check

Confirm all of the following before calling the need "clear enough":

- Enough clarification rounds have happened to move the user beyond vague slogans.
- Those rounds tested the need from different angles instead of repeating the exact same wording.
- The user's plain-language request has been translated into a probable task shape.
- The real problem is stated in plain language.
- The target user, team, or customer is named.
- The desired outcome is explicit.
- The current friction or waste is explicit.
- The must-haves and must-not-haves are visible.
- The first-version success signal is visible.
- Confirmed facts and temporary assumptions are clearly separated.
- The user has been given a clear confirmation cue, so they do not have to guess when to explicitly agree or correct the summary.

For recurring or notification-style requests, also confirm that operational details are either user-confirmed or still explicitly marked as assumptions:

- topic
- channel
- schedule
- frequency
- content volume

If the original wording is still extremely rough, do not force a full solution judgment yet.
First confirm the task shape with the user in plain language.
Do not assume rough-request examples are exhaustive.
Use them as pattern hints, then guide the user toward confirmation with the smallest set of useful questions.
Keep pulling on the same need from different directions until the user is no longer speaking only in vague slogans.

If the user gives an explicit confirmation that your current understanding is right and the remaining uncertainty is already low, it is acceptable to stop early rather than forcing extra rounds.
However, do not treat broad agreement as confirmation of every inferred detail.
Keep unverified specifics in an assumptions bucket until the user explicitly confirms them.
If any recommendation, path choice, or execution suggestion depends on temporary assumptions, those assumptions must be surfaced explicitly in the round output.
Do not hide them inside summaries or action recommendations.

## Premature-Execution Check

Stop and warn if any of the following happens:

- a broad confirmation is being treated as confirmation of detailed operational settings
- topic, channel, frequency, schedule, or count were inferred and then presented as confirmed
- an automation or recurring configuration is being generated before the operational fields are truly locked
- a recommendation depends on unstated assumptions that were never surfaced under `Working assumptions`

## Existing-Solution Scan Check

Only run a public or local skill scan after minimum clarification.

Ask:

- Is this a common pattern that likely already exists?
- Is the main uncertainty structural rather than domain-specific?
- Would 1-3 mature examples reduce avoidable design mistakes?

If yes, compare only:

- core job
- start boundary
- stop boundary
- trigger cases
- non-trigger cases
- scope size
- dependency weight
- handoff behavior

The purpose of this scan is to increase confidence and stability, not just to avoid work.
Use mature references to reduce avoidable mistakes, not to replace judgment.

## Reuse Decision Check

Choose only one primary recommendation:

- `use as-is`
- `adapt lightly`
- `build new`

Make the reason explicit.

Reject reuse if the closest match is:

- too broad
- too narrow
- too technical for the user
- too dependent on tools, data, or scripts
- misaligned on where the flow starts or stops

## Solution Blueprint Check

Before calling the solution blueprint usable, confirm:

- one-sentence problem definition
- target user or team
- recommended solution shape
- v1 scope
- out-of-scope items
- success signals
- blockers or open questions
- next recommended step

## OpenClaw Execution Check

Before calling the result ready to use, confirm:

- the solution document is clear enough for a non-technical user to understand
- the recommended path is explicit
- the v1 scope is explicit
- blockers are visible
- the user knows what to do next in OpenClaw
- the user knows what not to ask OpenClaw to do yet

## False-Completeness Check

Pause and warn if any of the following happens:

- The user is asking for a final prompt, but the problem is still vague.
- The user is asking for a final `SKILL.md`, but the reuse decision is still unclear.
- The draft sounds polished, but the v1 scope is still too broad.
- The draft sounds polished, but blockers are hidden instead of listed.
- The conversation starts sliding into implementation before the solution shape is stable.

## Handoff Check

Finalize the execution package only when all of the following are present:

- confirmed items
- open items
- blockers
- reuse decision
- why that decision was made
- OpenClaw execution recommendation
- a skeleton for the final execution artifact if needed
