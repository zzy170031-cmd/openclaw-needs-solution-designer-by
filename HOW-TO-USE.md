# How To Use

This file explains how to use `openclaw-needs-solution-designer-by` in a practical way.

## What This Skill Is Best For

Use it when:

- you have an idea, but cannot explain it clearly yet
- you know the problem, but not the best OpenClaw path
- you want help deciding whether to reuse, adapt, or build new
- you need a stable solution document before formal writing or execution

Do **not** start with technical wording unless it is already natural for you.
Plain language is the expected starting point.

## The Simplest Way To Start

Open a new Codex thread and say something like:

```text
Use $openclaw-needs-solution-designer-by to help me.

I have an idea, but I cannot explain it clearly yet.
```

Or just start with your rough request:

```text
Use $openclaw-needs-solution-designer-by to help me.

I want this to push updates to me automatically.
```

## Best First Real-Use Opening Template

If you want a steadier start than a one-line rough request, you can copy this:

```text
Use $openclaw-needs-solution-designer-by to help me.

I do not code, but I want to use OpenClaw to turn an idea into something real.
My idea is:

[Describe the idea in plain language]

I still cannot clearly explain:
1. what problem I really want to solve
2. whether this should be reused, adapted, or built new
3. how small the first version should be
4. what should not be included yet
5. how the result should continue into OpenClaw execution

Please help me through your multi-round clarification flow:
- restate your understanding in plain language first
- if the need is still unclear, ask only the minimum useful questions
- do not jump into code
- do not jump into a final prompt
- do not jump into a final SKILL.md
- if you make default assumptions, put them under Working assumptions instead of treating them as confirmed facts

When you think the understanding is close enough, tell me clearly how to confirm it.
At the end, I want:
- a clear solution document
- a reuse / adapt / build-new judgment
- a stable v1 scope
- blockers and assumptions
- an OpenClaw execution guide
```

You only need to replace:

`[Describe the idea in plain language]`

with your real idea.

## Ultra-Short Opening Template

If you want the shortest possible version, use this:

```text
Use $openclaw-needs-solution-designer-by to help me.

I do not code, and I have an idea that I still cannot explain clearly.
Please help me clarify it in plain language first, then judge whether I should reuse, adapt, or build new, and finally give me a solution document and OpenClaw execution guide.
My idea is:
[Write the idea in plain language]
```

## How To Answer During Clarification

You do not need to answer perfectly.
Short, direct answers are enough.

Good examples:

- "I want it for our sales team."
- "I only care about AI news."
- "I want it in Feishu."
- "The first version should stay small."

If the skill gives you a summary and it feels right, confirm it clearly.

Good confirmation examples:

- "Yes, that's right."
- "Exactly, that's what I mean."

If it is wrong, do not rewrite everything.
Just correct the wrong part.

Good correction examples:

- "No, not for customers. Only for internal use."
- "No, I do not want real-time alerts. I want a daily digest."

## What The Skill Should Give You

When it is working correctly, it should help you reach:

- a clear problem definition
- a clear desired outcome
- a reuse / adapt / build-new judgment
- a stable v1 scope
- visible blockers and assumptions
- an OpenClaw execution guide

## A Good Practical Flow

The healthiest way to use this skill is:

1. Start in plain language.
2. Let it clarify across rounds.
3. Confirm when the summary is basically right.
4. Let it narrow the v1 scope.
5. Let it produce the solution document and OpenClaw execution guide.

## How To Know It Is Going Well

Good signs:

- it keeps using plain language
- it separates confirmed facts from assumptions
- it asks only the minimum useful questions
- it does not jump into code too early
- it helps you see what not to build yet

Bad signs:

- it starts inventing detailed settings you did not confirm
- it pushes you into agent / skill jargon too early
- it jumps into code, prompt writing, or SKILL writing before the need is stable

## What To Do After You Get The Result

After the skill gives you a stable result, use that output in one of these ways:

- continue directly in OpenClaw
- hand the result to a design skill if a new skill or agent must be created
- keep it as a clearer workflow document if no build is needed yet

## Good Opening Patterns

```text
I want OpenClaw to help me, but I cannot explain the need clearly yet.
```

```text
I think something like this may already exist. Help me judge before I rebuild it.
```

```text
I have a rough draft, but I need the problem, scope, and next step cleaned up first.
```
