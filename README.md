# OpenClaw Needs Solution Designer By

[简体中文说明](README.zh-CN.md)

`openclaw-needs-solution-designer-by` is a user-facing skill for people who do not code but still want to use OpenClaw well.

Its job is not to jump straight into code, a final prompt, or a final `SKILL.md`.
Its job is to take a fuzzy idea, customer request, or workflow pain point and turn it into a clear, stable, OpenClaw-ready solution document and execution direction.

## What This Skill Is For

Use this skill when someone says things like:

- "I have an idea, but I cannot explain it clearly yet."
- "I know the problem, but I do not know whether I need an agent, a skill, or something simpler."
- "I think something like this may already exist on GitHub, ClawHub, or SkillHub. Help me judge before we rebuild it."
- "I already have a rough draft, but I need the problem, scope, and next step cleaned up first."

## Core Product Principles

- Plain language first
- Multi-round clarification before solution recommendation
- Restate the need in plain language and confirm before final production
- Stable landing before shortcut chasing
- Reuse mature structures when that makes the result more reliable
- Keep v1 small enough to land cleanly
- Do not force agent/skill terminology too early
- Do not let the user do the filtering work
- Only move into formal writing when the design is stable enough

This product keeps the original backbone from the first prompt architecture:

- repeated rounds of clarification
- explicit restatement before solutioning
- staged progression instead of one-shot output
- final delivery only after understanding is stable enough

That repeated polling loop is a core mechanism, not a stylistic preference.

## Core Flow

The core experience should follow three steps:

1. Clarify the need through repeated rounds.
2. Explain the clarified understanding back to the user in plain language and confirm it is right.
3. Only then produce the final solution document and OpenClaw usage guidance step by step.

This matters because most real users will speak in everyday language, not in technical product language.
The skill must be good at translating rough wording into a stable understanding before it starts producing structured output.

For highly fuzzy needs, the default expectation is multiple clarification rounds.
Those rounds should not be shallow repetition. They should pull on the same need from different angles until the request becomes explicit enough to trust.

If the user clearly confirms the understanding early and the remaining uncertainty is already low, the skill should not force extra rounds just to satisfy a round count.

## Expected Output

The skill should help the user leave with:

- a clearer problem statement
- a clearer desired outcome
- a reuse decision:
  - use as-is
  - adapt lightly
  - build new
- a first-version scope
- blockers and open questions
- an OpenClaw-ready execution guide

## Repository Structure

```text
openclaw-needs-solution-designer-by/
  README.md
  .gitignore
  examples/
    customer-needs-reuse-first-example.md
    client-needs-triage-v1-handoff.md
  openclaw-needs-solution-designer-by/
    SKILL.md
    agents/
      openai.yaml
    references/
      checklists.md
      samples.md
```

## Install

Copy the inner skill folder below into your Codex skills directory:

```text
openclaw-needs-solution-designer-by/
```

Typical Windows target path:

```text
C:\Users\Administrator\.codex\skills\openclaw-needs-solution-designer-by\
```

## Current Status

This is a first outward-facing draft.

It is already aligned with the intended product direction:

- for non-technical users
- focused on needs clarification and solution shaping
- includes a reuse-first stage for existing skills
- optimized for stable landing, not just fast answers

The repository also now includes a downstream handoff example for a narrow client-needs-triage skill so the bridge from fuzzy need -> stable plan -> formal design is visible.

It has not yet gone through the same full manual test loop as the internal design meta-skill.

## Language Strategy

- Human-facing repository documentation should be bilingual: English and Simplified Chinese.
- The skill bundle itself remains English-first for trigger clarity and execution stability.
- User-facing examples can have both English and Chinese companion files when they are important for adoption.

## Release Readiness

- License: [MIT](LICENSE)
- Publish checklist: [publish-checklist.md](publish-checklist.md)
- Main public docs:
  - [README.md](README.md)
  - [README.zh-CN.md](README.zh-CN.md)

## Suggested Public Positioning

`A reuse-first OpenClaw skill that helps non-technical users turn fuzzy needs into stable, reliable, executable solution documents and clear OpenClaw usage guidance before prompt writing, SKILL.md writing, or implementation.`
