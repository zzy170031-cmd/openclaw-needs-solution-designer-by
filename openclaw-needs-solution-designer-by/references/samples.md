# Samples

Use this file when you need examples for triggering, non-triggering, or reuse-first judgment.

## Suggested Opening Inputs

```text
我有一个想法，想让 OpenClaw 帮我做点事，但我现在还说不清到底应该做成 agent、skill，还是先找现成方案来改。
先别写代码，帮我把问题和方案理清。
```

```text
我怀疑 GitHub、ClawHub 或 SkillHub 上已经有类似的 skill。
先不要让我从零开始，帮我判断是直接用、轻改，还是值得新做。
```

```text
I have a workflow problem and I think OpenClaw could help, but I do not know whether I need an agent, a skill, or an existing solution.
Help me clarify the problem and the best OpenClaw execution path before formal writing.
```

## Natural-Language Rough Requests

These are especially important because many real users will start here instead of with a structured brief.

- 我想自动抓取个热点。
- 我想让你帮我推送信息。
- 我想做个自动提醒。
- 我想把客户需求先整理清楚。
- 我想每天收到一份总结。
- I want something that watches trends for me.
- I want this to push updates to me automatically.
- I want help turning messy requests into something usable.

These are examples, not a closed list.
Real users may say many other fuzzy things with the same shape.

When the input looks like this:

- first translate it into a probable task shape
- then ask only the minimum questions needed to clarify source, frequency, output form, audience, or stopping point
- do not force the user to define agent, skill, workflow, or trigger language up front
- actively guide the user toward confirmation instead of waiting for them to self-structure the request

## Trigger Examples

- 我想做一个客户需求整理助手，但我说不清第一版到底应该做什么。
- 我们团队总在重复做同一类流程判断，想看看 OpenClaw 能不能帮忙，但我不知道是不是已经有现成 skill。
- 我已经有一版 prompt 草稿了，但现在不确定它是在解决真实问题，还是只是把流程写复杂了。
- Help me decide whether this should stay a checklist, become a skill, or grow into an agent.
- I have a rough workflow idea, but I need help narrowing scope before building anything.

## Non-Trigger Examples

- 直接帮我写最终 prompt。
- 直接帮我写最终 `SKILL.md`。
- 不要分析了，直接开始写代码。
- 帮我查一下这个行业今天最新的法规。
- 随便陪我脑暴几个名字就行，不用收敛成方案。

## Ambiguous Examples

### Example 1

`我想做个自动化助手。`

Why ambiguous:

- It may be a real solution-design request.
- It may also be a very early casual idea.
- First ask what problem it should actually solve.

### Example 2

`我已经找了几个 GitHub skill，你帮我看看。`

Why ambiguous:

- It may be a reuse decision.
- It may also already be close to formal design review.
- First confirm whether the user wants reuse judgment, adaptation planning, or final writing.

### Example 3

`I want something to make our team more efficient.`

Why ambiguous:

- The goal is real, but still too broad.
- First narrow the user, workflow, and desired outcome.

## Good Output Signals

When this skill is working well, the user should leave with:

- a clearer problem statement
- a clearer desired outcome
- a reuse decision
- a smaller v1 scope
- visible blockers
- a practical OpenClaw execution guide

## Confirmation Boundary Example

If the user says:

`对，没错，我就是想这样。`

that confirms the high-level direction.
It does not automatically confirm operational details that the assistant introduced unless the user also explicitly agrees to those details.

Good behavior after broad confirmation:

- keep confirmed facts narrow
- move unverified specifics into assumptions
- ask only the remaining minimal questions if needed
- do not jump straight into automation setup with invented details

## Confirmation Cue Example

When a round is ready for user confirmation, make that moment explicit instead of leaving it implicit.

Good example:

- "如果我现在理解对了，你可以直接回复：'对，就是这个意思。'"
- "如果还不对，请直接告诉我哪一句不对，我继续改。"

English equivalent:

- "If this is basically right, you can reply: 'Yes, that's what I mean.'"
- "If not, tell me which sentence is off and I'll keep refining it."
