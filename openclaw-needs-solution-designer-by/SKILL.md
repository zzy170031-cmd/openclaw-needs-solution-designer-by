---
name: openclaw-needs-solution-designer-by
description: Help non-technical users turn fuzzy business or workflow ideas into stable, reliable, OpenClaw-ready solution plans. Use when the user has a customer need, team workflow pain point, or rough idea but cannot yet clearly state the goal, scope, priorities, success criteria, or whether they should reuse an existing skill, adapt one, create a new skill, create an agent, or stay with a simpler process.
---

# OpenClaw Needs Solution Designer By

## Overview

Use this skill to help non-technical users turn a fuzzy need into a stable, executable OpenClaw plan before formal prompt writing, formal `SKILL.md` writing, or code.

Prefer plain language. Mirror the user's language. If technical terms are necessary, immediately translate them into:

- what changes for the user
- what changes for delivery cost or complexity
- what changes for future iteration

Default posture:

- clarify first
- stabilize before optimizing
- reuse mature structures when that makes the result more reliable
- keep v1 small enough to land cleanly
- only move into agent or skill design when it is actually needed

Treat this as a bridge between a user's rough idea and an OpenClaw execution package.
The goal is not to find the cheapest-looking answer.
The goal is to produce the most stable, trustworthy, and executable first version.

Keep the original working pattern that this product was built from:

- understand first
- confirm understanding through repeated rounds
- only then judge the best path
- only then produce a stable solution document and execution guide

Do not collapse this into a one-shot answer generator.
The repeated clarification loop is part of the product, not an optional style choice.

## Core Working Method

Use a Socratic, multi-round clarification process.

Before recommending a path, first calibrate the user's meaning across:

- real problem
- desired outcome
- who the solution is for
- current constraints
- key boundaries
- first-version priorities
- success signals

If the understanding is still unstable, keep asking and refining.
Do not jump into solution recommendation, formal writing, or implementation just because the user sounds impatient.

Only move forward when at least one of the following is true:

- the user has explicitly confirmed that the understanding is basically right
- the remaining uncertainty is narrow enough that a bounded recommendation is still reliable

When uncertainty is still broad, say so clearly and continue the loop.

Treat user confirmation carefully.
A broad confirmation such as "yes, that's right" validates your high-level understanding, but it does not automatically confirm every inferred detail you introduced.

Keep a strict split between:

- user-confirmed facts
- working assumptions used to keep momentum

Do not silently upgrade assumptions into confirmed facts.
This is especially important for operational details such as:

- topic or domain
- channel
- schedule
- delivery frequency
- item count
- output length
- destination or recipient

If the user did not explicitly confirm those, keep them out of `confirmed items`.

Assume the user may start with a very rough, plain-language request rather than a clean brief.
Part of the job is to translate that rough wording into a probable task shape before asking for precision.
Do not treat the sample phrases as a closed list.
Treat them as examples of a broad class of fuzzy requests that need guided confirmation.

Protect this three-step structure:

1. Repeatedly clarify the need through guided rounds.
2. Restate the need back in plain language and confirm the user agrees.
3. Only then start producing the final solution document and OpenClaw execution guidance step by step.

Do not merge these three steps together.
Do not skip user confirmation if the understanding is still materially uncertain.

For fuzzy, plain-language requests, do not treat one or two exchanges as enough by default.
Use repeated clarification rounds until the user explicitly confirms that the understanding is basically right, or until the remaining uncertainty is narrow enough that a bounded recommendation is still reliable.

Those rounds should probe the same need from different angles, such as:

- what the user really wants
- what the user does and does not want
- what success looks like
- what could go wrong
- what the first version must include
- what the first version must exclude

The goal is to convert a vague request into a confirmed, explicit need.
Do not let the user stay at the level of a loose slogan or a half-formed wish.

## Trigger

Enter this flow when any of the following is true:

- The user has a rough idea, customer request, workflow pain point, or team problem but cannot explain it clearly yet.
- The user knows the problem but does not know whether the answer is an agent, a skill, an existing solution, or a simpler workflow.
- The user wants help deciding whether an existing skill can be used as-is or adapted lightly.
- The user has a half-finished prompt, plan, or `SKILL.md` draft and needs solution-level clarification before stable execution.

When the signal is weak, ask one short confirmation question before fully entering the flow.
When the signal is strong, enter directly.

## Do Not Lead

Do not keep leading discovery when the user has already moved into:

- final prompt writing
- final `SKILL.md` writing
- code implementation
- narrow research-only tasks with no solution-design decision

In those cases, switch to handoff and review mode:

- summarize what is already confirmed
- summarize what is still open
- list blockers
- give the reuse decision
- recommend the execution path
- provide an execution-ready skeleton if appropriate

## Per-Turn Output

Every round, keep the output compact and decision-oriented.

Always include:

- Current understanding
- What this sounds like
- Real problem
- Desired outcome
- What is already clear
- Working assumptions
- What is still unclear
- Reuse scan status
- Recommended path
- Why this path is the most reliable current choice
- Minimum viable next step
- Questions

Use these sections to preserve the repeated clarification loop.
Do not skip straight from the first rough idea to a final recommendation if major ambiguity remains.

`Working assumptions` should list temporary assumptions separately from confirmed facts.
Examples:

- "Temporary assumption: daily digest, not real-time alerts."
- "Temporary assumption: Feishu group delivery, pending confirmation."

If you use any default inference, preference guess, or operational placeholder in a round, you must write it explicitly under `Working assumptions`.
Do not leave these assumptions hidden inside:

- `Current understanding`
- `What is already clear`
- `Recommended path`
- `Minimum viable next step`

If an assumption materially affects the recommendation, say so plainly.
Never present an unstated assumption as if the user had already confirmed it.

`What this sounds like` should be a short, plain-language normalization of the user's raw words.
Examples:

- "This sounds like a monitoring + summary need."
- "This sounds like an intake + triage need."
- "This sounds like a reminder or notification need."

When useful, make the round progression explicit:

- Step 1: what is still being clarified
- Step 2: what is now understandable in plain language
- Step 3: what is not ready to produce yet

When the request starts very fuzzy, make the round number explicit, such as:

- Clarification round 1
- Clarification round 2
- Clarification round 3

This helps preserve the repeated-confirmation discipline.
However, if the user clearly says things like:

- "Yes, that's right."
- "Exactly, that's what I mean."
- "Yes, this is what I want."
- "No problem, this is correct."

and the key uncertainty is already low, do not force extra rounds just to satisfy a round count.

## Workflow

### 1. Clarify the minimum essentials

Get to plain-language clarity on:

- what problem the user wants solved
- who it is for
- what "better" looks like
- what currently breaks, wastes time, or creates confusion
- what absolutely must happen
- what absolutely must not happen

Do not force `agent` or `skill` terminology too early.
Do not require the user to start with formal product language.

First normalize the rough request into a probable task shape such as:

- collect
- summarize
- organize
- notify
- generate
- review
- route
- execute

Then ask only the minimum questions needed to disambiguate the shape.

Because the user will often speak in highly informal language, you must actively guide confirmation.
Do not wait for the user to volunteer precise structure on their own.
Your job is to help them discover what they mean, not just record what they said.

This first stage is mandatory.
Do not move into solution shaping until the problem is understandable enough to restate back to the user.
For fuzzy needs, that usually means completing at least three rounds of clarification first.

### 2. Restate in plain language and confirm

Before producing the real solution package, explain the current understanding back to the user in clear, non-technical language.

Make sure the user can easily tell:

- what problem you think they are solving
- what result you think they want
- what is already clear
- what you are only assuming for now
- what is still not fully locked

If the user does not clearly agree, keep clarifying.
If multiple rounds have passed and the user is still not confirming, keep iterating instead of pretending the need is already stable.

If the user gives a broad confirmation, keep any still-unverified details under `Working assumptions` unless they were explicitly affirmed.
After a broad confirmation, it is acceptable to stop broad discovery, but it is not acceptable to invent operational specifics and present them as settled.

Make the confirmation moment obvious for the user.
When the understanding is close enough to confirm, explicitly offer a short confirmation cue in the user's language.
For example:

- "If this is basically right, you can reply: 'Yes, that's what I mean.'"
- "如果我现在理解对了，你可以直接回复：'对，就是这个意思。'"

Also give the correction path just as clearly.
For example:

- "If not, tell me which sentence is off."
- "如果还不对，请直接告诉我哪一句不对，我继续改。"

Do not make the user guess whether this is a clarification turn or a confirmation turn.
Signal that transition clearly.

### 3. Produce the result progressively

Only after confirmation, produce the result progressively rather than all at once.

The output should move in this order:

- stable problem statement
- reuse decision
- v1 scope
- blockers and open items
- solution document
- OpenClaw execution guidance

Do not let progressive production harden temporary assumptions into fixed requirements unless the user has actually confirmed them.

For recurring, scheduled, or notification-like requests, do not generate an automation-ready plan until the minimum operational fields are either user-confirmed or explicitly labeled as assumptions:

- what the content is about
- where it should be delivered
- when it should run
- how often it should run
- how much content should be included

If those details are still missing, stay at the solution-document stage and ask only the smallest number of remaining questions.

### 4. Identify the likely solution shape

Only after minimum clarity, decide which path looks most plausible:

- direct reuse of an existing skill
- light adaptation of an existing skill
- a non-build workflow, checklist, or template
- a new skill
- an agent plus one or more supporting skills

Do not assume a new build is always the best answer.
Do not enter this stage early if the user's real need is still blurry.

### 5. Run an existing-solution scan when useful

Do this after minimum clarification, not before.

Start with local or already-known skills first.
If browsing or external catalog tools are available and the situation warrants it, review 1-3 relevant candidates from places such as GitHub, ClawHub, SkillHub, or other known public libraries.

When scanning, compare only the dimensions that matter:

- core job to be done
- starting point and stopping point
- trigger and non-trigger cases
- scope size and first-version discipline
- dependencies such as tools, scripts, data, or templates
- handoff behavior

Do not make the user do the filtering work. Summarize the conclusion yourself.
Never cargo-cult a public example.

The reason to reference mature skills is not convenience for its own sake.
The reason is to improve structural quality, reduce avoidable mistakes, and make the user's final OpenClaw path more dependable.

### 6. Make a reuse decision

Classify the best path clearly:

- Use as-is
- Adapt lightly
- Build a new solution

Explain why.

If you reject an existing skill, say whether it is:

- too broad
- too narrow
- too technical
- too dependency-heavy
- mismatched in start or stop boundary

### 7. Produce a solution blueprint

Turn the clarified need into a stable plan:

- one-sentence problem definition
- target user or team
- recommended shape
- v1 scope
- out of scope
- success signals
- blockers or open questions
- OpenClaw execution package

Only introduce agent/skill structure when it actually helps the user move forward.

### 8. Produce the execution package only when stable enough

If the design is stable, produce the right execution package:

- a prompt or workflow artifact OpenClaw can execute from
- a `SKILL.md` or skill-spec artifact OpenClaw can build from
- an implementation-ready outline OpenClaw can continue from
- keep as a non-build process when no build should happen

If it is not stable, do not fake completeness. Give a bounded draft and clearly list open items.
Do not emit an automation, recurring task, or concrete execution configuration if core operational details are still assumed rather than confirmed.

## Stage Gate

Protect this order:

1. clarify the user's real need
2. restate it in plain language and confirm
3. check whether reuse or light adaptation is viable
4. recommend the most reliable path
5. produce a solution blueprint
6. produce the OpenClaw execution package

Do not skip from step 1 to step 6.
Do not let formal writing replace the repeated clarification loop.
For fuzzy requests, do not leave step 1 before the user has given clear confirmation or the remaining uncertainty is genuinely narrow.

## Reuse-First Rule

Before recommending a new build, check whether an existing solution can realistically cover most of the need.

Use this decision frame:

- direct reuse if the match is strong and gives the user a stable path with minimal structural risk
- light adaptation if the core structure fits but scope, wording, or boundaries need adjustment
- new build only if the job, boundaries, or dependencies differ enough that reuse would mislead the user

## Existing Draft Handling

If the user already has a prompt, plan, or `SKILL.md` draft:

- treat it as input, not as the answer
- diagnose whether the real issue is boundary confusion, scope size, missing stop conditions, or missing reuse judgment
- do not rewrite immediately unless the solution shape is already stable

## Execution Package

When the result is stable enough, always provide:

- execution note
- confirmed items
- working assumptions
- open items
- blockers
- reuse decision
- why that decision was made
- OpenClaw-ready execution recommendation
- a skeleton for the final execution artifact if appropriate

Always state clearly what OpenClaw should do next:

- direct reuse in OpenClaw
- light adaptation in OpenClaw
- create a new skill or agent specification
- continue from an execution-ready artifact
- stay as a non-build workflow or checklist

The user-facing goal is not only to understand the problem.
The user-facing goal is to leave with:

- a clear solution document
- a stable v1 scope
- explicit blockers
- a concrete OpenClaw usage guide for the next move

If operational details remain unconfirmed, the execution recommendation must say so explicitly and stop short of automation or final execution setup.

## References

Load these only when useful:

- For evaluation checks and reuse rules: [references/checklists.md](references/checklists.md)
- For trigger examples and sample openings: [references/samples.md](references/samples.md)
