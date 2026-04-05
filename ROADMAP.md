# Roadmap

This file describes the intended post-release evolution of `openclaw-needs-solution-designer-by`.

The roadmap follows one rule above all:

**do not trade reliability for speedy-looking output.**

The skill should keep helping non-technical users turn fuzzy needs into stable solution documents and OpenClaw execution guidance.

## Product Guardrails

Every future update should preserve these foundations:

- plain-language entry remains the default
- repeated clarification rounds remain part of the product
- confirmed facts stay separate from working assumptions
- reuse / adapt / build-new judgment stays explicit
- the final output must remain useful for real OpenClaw execution

## v1.0.x: Stabilize The First Public Release

Goal:

- validate that the public release behaves consistently in real usage

Focus:

- collect 5-10 real-world usage transcripts
- identify where clarification rounds are too long or too short
- improve confirmation-cue wording
- improve the quality of `Working assumptions`
- refine the OpenClaw execution package format

Success signal:

- users can reliably reach a clear solution document without being dragged into unnecessary technical wording

## v1.1: Stronger Reuse Judgment

Goal:

- make reuse / light adaptation / build-new decisions more stable

Focus:

- improve examples for existing-skill comparison
- add clearer comparison dimensions
- reduce false positives where a vaguely similar skill is suggested too early
- improve explanation quality when reuse is rejected

Success signal:

- the skill can explain *why* an existing solution should or should not be reused in a way non-technical users understand

## v1.2: Better Plain-Language Handling

Goal:

- make the skill better at receiving highly fuzzy requests

Focus:

- expand `samples.md` with more everyday-language openings
- improve task-shape normalization
- improve the first 1-2 clarification rounds for short, vague requests
- make it easier for the user to notice the confirmation moment

Success signal:

- a very rough sentence can still be turned into a useful clarification flow without confusing the user

## v1.3: Better Output Packages

Goal:

- make the final result more directly useful in OpenClaw

Focus:

- strengthen the final solution document structure
- strengthen the OpenClaw execution guidance format
- add stronger examples of execution-ready output
- improve boundary notes about what should not be asked of OpenClaw yet

Success signal:

- users can take the output package and continue with OpenClaw without needing to reinterpret the result

## v1.4: Real-World Example Library

Goal:

- make the repository more practical for new users

Focus:

- add example cases from different workflow types
- add before/after examples
- add cases showing:
  - direct reuse
  - light adaptation
  - build new
  - stay with a simpler workflow

Success signal:

- new users can understand how to use the skill by reading examples instead of only reading principles

## v2.0: Optional Domain Packs, Not Core Bloat

Goal:

- support richer usage without turning the core skill into a bloated general-purpose system

Possible additions:

- optional domain examples
- optional templates for common use cases
- optional add-on references for stronger execution packages

Not the goal:

- turning the core skill into a giant domain encyclopedia
- hiding fuzzy assumptions behind polished output
- replacing user confirmation with aggressive automation

## Practical Next Steps

Recommended next steps after release:

1. collect and save real usage transcripts
2. review where users hesitate or misunderstand
3. add only the smallest rules needed to improve reliability
4. prefer example growth before architecture growth

