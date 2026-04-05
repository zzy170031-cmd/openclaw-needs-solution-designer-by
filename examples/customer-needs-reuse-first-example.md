# Customer Needs Reuse-First Example

This example shows the kind of outcome the skill should produce.

It is not a final prompt and not a final `SKILL.md`.
It is a solution-shaping artifact.

## Example Input

`我想让 OpenClaw 帮我们团队处理客户需求，但我说不清到底是做一个 agent、一个 skill，还是直接找现成的东西来改。`

## What The Skill Should Clarify

- What problem is really being solved
- Who the users are
- What "good enough" looks like for v1
- Whether an existing skill may already cover most of the need
- Whether the next step should be:
  - direct reuse
  - light adaptation
  - a new build

## Example Good Outcome

### Real problem

- The team is losing time because customer requests arrive in inconsistent formats.
- People keep rewriting the same clarification questions.

### Desired outcome

- Turn a raw customer request into a cleaner intake package the team can act on.

### Reuse-first judgment

- First scan for existing intake, triage, or request-normalization skills.
- If a mature skill already covers:
  - intake cleanup
  - required-field checks
  - next-step recommendations
  then adapt it lightly instead of starting from zero.

### V1 scope

- One team
- One request type
- No external system integration
- No code generation

### Next step

- If a close existing skill is found, compare:
  - trigger
  - non-trigger
  - inputs
  - outputs
  - dependencies
- If no close match is found, hand off into agent/skill design.
