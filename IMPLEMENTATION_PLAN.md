# Persona Implementation Plan

Last updated: 2026-07-05

This document turns the output-first Persona plan into implementation prompts for coding sessions. It is meant to be handed to Codex or Claude Code one session at a time.

Persona v1 is a local-first, open-source, agent-native pressure-testing tool for startup and product ideas. It should produce real reports quickly so we can iterate on output quality.

## Core Direction

Build a Codex skill plus tiny local renderer first.

Do not build:

- web app
- hosted API
- database
- auth
- payments
- queues
- analytics
- dashboards
- credit ledger
- account system

Persona should feel like an editor with a knife: short, skeptical, grounded, useful.

## V1 Workflow

```text
User idea
  -> intake and clarification
  -> language detection
  -> idea type classification
  -> evidence gathering
  -> sampling dimension selection
  -> 12 sampled market positions
  -> verdict reactions
  -> structured report JSON
  -> SVG sampling map
  -> Markdown report
  -> saved local artifacts
```

## Stable Product Rules

- Default grounding mode: `web-grounded`.
- Fallback grounding modes: `user-provided`, `ungrounded`.
- Auto-detect report language from user input.
- Keep these terms in English in every language:
  - `Hard No`
  - `Sobol sampling`
  - `Halton sequence`
  - `web-grounded`
  - `user-provided`
  - `ungrounded`
  - `WOULD_PAY`
  - `NEEDS_PROOF`
  - `HARD_NO`
- Save files with English slugs even when report text is not English.
- Price is optional and must never block a run.
- Ask at most 1-2 clarification questions.
- V1 has only `standard` mode.
- Do not claim to predict the market.
- Do not use "simulated personalities" framing.
- Do not write generic praise like "interesting idea."

## Target File Layout

Create this layout only as each session needs it.

```text
.
├── AGENTS.md
├── IMPLEMENTATION_PLAN.md
├── SESSION_SCHEDULE.md
├── README.md
├── LICENSE
├── skills/
│   ├── codex/
│   │   └── persona/
│   │       └── SKILL.md
│   └── claude/
│       └── persona/
│           └── SKILL.md
├── renderer/
│   ├── halton-sampler.mjs
│   ├── render-map.mjs
│   └── README.md
├── examples/
│   ├── sample-inputs.md
│   └── golden-report.md
├── schema/
│   └── persona-report.schema.json
└── reports/
    └── .gitkeep
```

Keep this simple. Do not add package scaffolding until a script needs it.

## Canonical Sample Idea

Use this idea for early tests:

```text
An AI landing page critique tool for indie founders before launch.
It reviews landing page copy and tells the founder why visitors probably will not convert.
The target user is a solo founder preparing a Product Hunt, X, or Hacker News launch.
Price is not decided.
```

Expected classification: `B2B`.

## Report Shape

Every Markdown report must use this order:

1. Product Snapshot
2. Verdict Metrics
3. Hard Nos
4. Persona Sampling Map
5. Persona Reactions
6. Objections To Beat
7. Next Experiment

Grounding mode must appear near the top.

## Structured Report Contract

The structured object should stay small and readable.

Required top-level fields:

```json
{
  "title": "",
  "slug": "",
  "created_at": "",
  "language": "",
  "idea_type": "B2B",
  "grounding_mode": "web-grounded",
  "sampling_method": "halton",
  "input": {},
  "evidence_packet": [],
  "sampling_dimensions": [],
  "personas": [],
  "verdict_metrics": [],
  "hard_nos": [],
  "objections_to_beat": [],
  "next_experiment": {}
}
```

Halton sampler fields:

```json
{
  "sampling_method": "halton",
  "personas": [
    {
      "sampling_coordinates": {},
      "map_position": { "x": 0.0, "y": 0.0 }
    }
  ]
}
```

Allowed `idea_type` values:

```text
B2B
B2C
marketplace/platform
```

Allowed verdict values:

```text
WOULD_PAY
NEEDS_PROOF
HARD_NO
```

## Sampling Dimensions

Use 12 sampled perspectives in v1.

## Sampling Algorithm

Persona will use a dependency-free `Halton sequence` sampler for v1.

Persona v1 uses the small local Halton sampler in `renderer/halton-sampler.mjs`. The sampler:

- generates 12 deterministic low-discrepancy points for the six selected sampling dimensions
- uses prime bases `[2, 3, 5, 7, 11, 13]`
- maps each coordinate in `[0, 1)` to predefined buckets for the selected idea type
- stores the raw Halton coordinates and map position in each persona object
- records `sampling_method: "halton"` in the structured report JSON
- keeps output deterministic for tests
- avoids package dependencies

Keep `Sobol sampling` as a stable product term only when describing the broad-coverage intent or legacy wording. Do not claim true Sobol generation unless a Sobol generator is actually implemented.

### B2B

- company size
- buyer role
- budget authority
- urgency
- switching pain
- trust/compliance barrier

### B2C

- consumer archetype
- pain frequency
- willingness to pay
- habit strength
- trust/risk sensitivity
- channel accessibility

### Marketplace / Platform

- supply-side motivation
- demand-side urgency
- liquidity difficulty
- trust requirement
- repeat-use likelihood
- switching friction

## Saved Artifacts

Each completed run should save:

```text
reports/<english-slug>-YYYY-MM-DD.md
reports/<english-slug>-YYYY-MM-DD.json
reports/<english-slug>-YYYY-MM-DD-map.svg
```

The Markdown report should link to the SVG audit artifact rather than embed it by default:

```md
[Open Persona Sampling Map](./<english-slug>-YYYY-MM-DD-map.svg)
```

## Session 1 Prompt: Codex Report Prototype

Goal: create the first runnable Codex skill that produces a real Markdown report.

Prompt for coding agent:

```text
Create the first Persona Codex skill prototype.

Requirements:
- Add `skills/codex/persona/SKILL.md`.
- The skill accepts a free-form startup/product idea.
- It extracts idea, target user, use case, optional price, links, and user-provided context.
- It asks at most 1-2 clarification questions if target user or use case is missing.
- It defaults to `web-grounded` when browsing is available.
- It auto-detects report language from the user's input.
- It keeps stable terms in English.
- It classifies the idea as `B2B`, `B2C`, or `marketplace/platform`.
- It creates 12 sampled market positions using a simple deterministic placeholder if needed.
- It assigns each position one verdict: `WOULD_PAY`, `NEEDS_PROOF`, or `HARD_NO`.
- It writes a Markdown report under `reports/` using the approved report order.
- Use a simple Markdown table as the Persona Sampling Map placeholder.

Do not build a renderer, schema file, CLI, web app, package setup, or README yet.
```

Acceptance criteria:

- One manual run can produce a report for the canonical sample idea.
- The report includes all seven required sections.
- Hard critique appears before persona reactions.
- Grounding mode is explicit.
- The output does not claim market prediction.

## Session 2 Prompt: Structured Output Contract

Goal: make structured JSON the source of truth before prose.

Prompt for coding agent:

```text
Add Persona's structured output contract.

Requirements:
- Add `schema/persona-report.schema.json`.
- Update the Codex skill instructions so every run first creates the structured report object.
- The Markdown report must be generated from that object.
- Each run should save both `.json` and `.md` under `reports/`.
- Keep the schema small, readable, and aligned with IMPLEMENTATION_PLAN.md.
- Validate enum values in instructions: idea type and verdicts must match allowed values.

Do not add renderer code yet.
```

Acceptance criteria:

- A sample report has matching `.json` and `.md` files.
- The Markdown order follows the structured object.
- Invalid verdict labels are not allowed by the skill instructions.

## Session 3 Prompt: Sampling Rules

Goal: lock sampling behavior across B2B, B2C, and marketplace/platform ideas.

Prompt for coding agent:

```text
Implement Persona's sampling rules in the Codex skill instructions.

Requirements:
- Define the B2B, B2C, and marketplace/platform dimension sets.
- Use 12 sampled positions for each run.
- Use honest broad-coverage sampling language. Do not claim true `Sobol sampling` unless a Sobol generator exists.
- Make the dimensions differ by idea type.
- Ensure every sampled position has:
  - id
  - label
  - dimension values
  - verdict
  - objection
  - what would change their mind

Do not add new infrastructure.
```

Acceptance criteria:

- One B2B, one B2C, and one marketplace/platform sample produce different dimension sets.
- All 12 reactions use valid verdicts.
- Persona reactions stay short.

## Session 4 Prompt: SVG Renderer

Goal: render the black silhouette sampling map from JSON.

Prompt for coding agent:

```text
Build the tiny local Persona map renderer.

Requirements:
- Add `renderer/render-map.mjs`.
- The script accepts a Persona report JSON path and writes an SVG path.
- It renders 12 black silhouette marks.
- It visually distinguishes `WOULD_PAY`, `NEEDS_PROOF`, and `HARD_NO` without using color as the only signal.
- It includes compact labels or ids that match report personas.
- It is deterministic.
- Update the Codex skill instructions so the Markdown report links to the SVG audit artifact when available.

Keep the renderer dependency-free if practical. If a dependency is needed, justify it in the renderer README.
```

Acceptance criteria:

- Running the renderer on sample JSON creates an SVG.
- The SVG is linked from the report.
- The renderer works without network access.

## Session 5 Prompt: Output Iteration Batch

Goal: improve the actual output by testing real reports.

Prompt for coding agent:

```text
Run Persona on three ideas and tighten the output.

Use:
1. B2B: AI landing page critique tool for indie founders.
2. B2C: AI accountability coach for people trying to finish side projects.
3. Marketplace/platform: marketplace matching indie founders with launch reviewers.

Review the generated reports and update the skill instructions so output is:
- shorter
- less generic
- more grounded
- more truth-seeking
- less performatively harsh
- clearer about the next experiment

Do not change the report structure unless a section is clearly failing.
```

Acceptance criteria:

- Three reports exist under `reports/`.
- Each report has explicit grounding mode.
- Each report has actionable `Objections To Beat`.
- Each report ends with one concrete next experiment, not broad advice.

## Session 6 Prompt: Halton Sampler

Goal: replace the deterministic sampling-table placeholder with a small dependency-free Halton sampler.

Prompt for coding agent:

```text
Implement Persona's v1 Halton sampler.

Requirements:
- Add a tiny local sampler module or script in the simplest existing location; do not add package scaffolding.
- Use a deterministic `Halton sequence` with prime bases `[2, 3, 5, 7, 11, 13]`.
- Generate exactly 12 points for each Persona run.
- Keep the six dimensions selected by idea type:
  - B2B: company size, buyer role, budget authority, urgency, switching pain, trust/compliance barrier.
  - B2C: consumer archetype, pain frequency, willingness to pay, habit strength, trust/risk sensitivity, channel accessibility.
  - Marketplace/platform: supply-side motivation, demand-side urgency, liquidity difficulty, trust requirement, repeat-use likelihood, switching friction.
- Define explicit bucket arrays for each dimension and map each Halton coordinate to one bucket.
- Add `sampling_method: "halton"` to the structured report.
- Add each persona's raw coordinates as `sampling_coordinates`, keyed by dimension name.
- Add each persona's `map_position` with normalized `x` and `y` values so `renderer/render-map.mjs` can place points spatially.
- Update `schema/persona-report.schema.json` to validate the new fields while keeping the schema small.
- Update `skills/codex/persona/SKILL.md` so it no longer describes the fixed tables as the active sampler.
- Keep `Sobol sampling` only as product/legacy wording for broad-coverage intent; do not claim true Sobol generation.
- Regenerate the three existing reports or add one fresh sample report that proves the Halton fields are present.
- Run the renderer against the generated JSON and confirm it uses `map_position`.

Do not add dependencies, a CLI, a web app, package setup, databases, queues, or infrastructure.
```

Acceptance criteria:

- The same idea produces the same 12 sampled positions across repeated runs.
- JSON includes `sampling_method: "halton"`.
- Every persona includes `sampling_coordinates` for all six selected dimensions.
- Every persona includes `map_position.x` and `map_position.y` between 0 and 1.
- The renderer places points from `map_position` when present.
- Reports still include explicit grounding mode, all seven sections, and one concrete next experiment.

## Session 7 Prompt: Claude Code Skill

Goal: create a Claude Code skill with matching behavior.

Prompt for coding agent:

```text
Create the Claude Code Persona skill.

Requirements:
- Add `skills/claude/persona/SKILL.md`.
- Match the Codex skill's behavior, terms, report shape, schema expectations, Halton sampling behavior, and renderer input.
- Keep reports interchangeable between Codex and Claude Code.
- Document any host-specific differences inside the Claude skill file.

Do not fork product behavior.
```

Acceptance criteria:

- Claude skill produces the same seven-section report shape.
- Claude skill uses the same structured JSON fields.
- Claude skill uses the same Halton sampling contract.
- Claude skill can use the same renderer.

## Session 8 Prompt: Packaging

Goal: make the repo understandable to a new user.

Prompt for coding agent:

```text
Package Persona v1 for open-source use.

Requirements:
- Add `README.md`.
- Add `LICENSE` using MIT.
- Add `examples/sample-inputs.md`.
- Add one strong example report under `examples/`.
- Add install/use instructions for Codex and Claude Code.
- Add a short release checklist.

Keep README short, direct, and example-led.
Do not add marketing fluff.
```

Acceptance criteria:

- A new user can understand what Persona does in under one minute.
- README explains how to run a report.
- README states that Persona does not predict the market.
- Example output shows the product's edge.

## Quality Checklist

Use this after every report-generating session.

- [ ] Report starts with the product, not methodology.
- [ ] Grounding mode is explicit.
- [ ] Hard Nos appear before persona reactions.
- [ ] Verdict metrics have 1-5 scores with short reasons.
- [ ] Persona reactions are short.
- [ ] Objections are concrete.
- [ ] Next experiment is doable this week.
- [ ] No "interesting idea."
- [ ] No market prediction claims.
- [ ] No decorative persona theater.
- [ ] No extra infrastructure was added.

## First Test Command For Human Review

Once Session 1 exists, test with this prompt:

```text
/persona

An AI landing page critique tool for indie founders before launch.
It reviews landing page copy and tells the founder why visitors probably will not convert.
The target user is a solo founder preparing a Product Hunt, X, or Hacker News launch.
Price is not decided.
```

The expected outcome is not perfection. The expected outcome is a real report we can dislike precisely.
