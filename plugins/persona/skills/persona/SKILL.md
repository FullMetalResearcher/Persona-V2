---
name: persona
description: Pressure-test a startup, product, SaaS, marketplace, or side-project idea before building it. Use when a builder asks whether an idea is worth building, wants brutally specific objections, requests idea validation or a go/no-go recommendation, or asks for a Persona decision report. Produces grounded local JSON and HTML artifacts with adversarial Halton coverage and a Build, Test first, or Do not build verdict.
---

# Persona

Produce one pre-build decision memo, save it locally, and stop.

Persona is not market research and does not predict success. It differs from a
normal chatbot critique by neutralizing founder framing, grounding claims, and
forcing 12 distinct adversarial positions before reaching a recommendation.
Treat sampled positions as reasoning instruments, never customers, market shares,
purchase probabilities, or votes.

Resolve every bundled path from the directory containing this `SKILL.md`. Write
reports in the user's current working directory, never in the installed plugin.

## Output Contract

Create matching artifacts:

```text
reports/<english-slug>-YYYY-MM-DD.json
reports/<english-slug>-YYYY-MM-DD.html
```

If the pair exists, append `-2`, `-3`, and so on. Detect the report language from
the user's input. Keep these product terms in English in every language:

- `Hard No`
- `Halton sequence`
- `web-grounded`
- `user-provided`
- `ungrounded`
- `Build`
- `Test first`
- `Do not build`

The structured JSON is the source of truth. Generate HTML mechanically from it.
Do not continue into coaching, implementation, or a second artifact unless the
user separately asks after receiving the report.

## Workflow

### 1. Intake

Extract:

- idea
- first target user or buyer
- use moment
- current alternative, including doing nothing
- optional price and links
- user evidence such as interviews, usage, commitments, revenue, or failed tests

If target user and use moment are clear, proceed without questions. If either is
missing, ask at most two concise questions in one message. Never block on price.
Infer the current alternative when necessary and record the uncertainty.

Classify the idea as `B2B`, `B2C`, or `marketplace/platform` based on the first
user and value exchange.

### 2. Normalize the Pitch

Write `normalized_idea` before research or objections:

- remove promotional adjectives and inevitability claims
- separate observations from assumptions
- state the user, job, current alternative, and proposed switching reason plainly
- preserve real constraints and user evidence

Reason from this normalized statement, not the founder's enthusiasm. Do not make
the verdict harsher or softer because the input sounds confident.

### 3. Ground the Decision

Default to `web-grounded` when search is available. Use generalized search terms
when the idea appears private or proprietary. Search no more than four lanes:

1. current alternatives and observed behavior
2. direct buyer complaints or first-person language
3. switching, trust, regulatory, or distribution barriers
4. pricing only when it changes the decision

Stop after 3-5 strong evidence items. Expand to at most seven for regulated or
high-stakes ideas. Prefer direct buyer language, reviews, community discussions,
official documents, and primary product material. A vendor feature claim can
prove an alternative exists; it cannot prove demand for this idea.

Use `user-provided` when browsing is unavailable but the user supplied evidence.
Use `ungrounded` otherwise, set confidence to `low`, and label objections as
hypotheses.

For every evidence item, distinguish the observation from Persona's implication.
Use sequential IDs `E01`, `E02`, and so on. Follow the bundled schema.

### 4. Derive Adversarial Dimensions

Create exactly six dimensions for this specific domain. Each dimension must:

- materially change adoption, refusal, or objection severity
- describe a real constraint or decision condition
- contain 3-6 ordered, unique buckets
- include a concise rationale

Cover status quo dependence, pain or urgency, trust or risk, and decision access
when they matter, but express them in domain language. Do not reuse the legacy
generic B2B, B2C, or marketplace grids.

### 5. Generate Halton Coverage

Create an initial report JSON containing `adversarial_dimensions` and an empty
`adversarial_positions` array. Run:

```bash
node <persona-skill-dir>/scripts/halton-sampler.mjs \
  reports/<english-slug>-YYYY-MM-DD.json --apply
```

The bundled dependency-free sampler creates `A01` through `A12`, assigns one
bucket per dimension, and records exact coordinates. Never hand-edit sampled
dimension values or coordinates.

### 6. Write the 12 Counterpositions

Read each sampled condition and add:

- a short label grounded in the six dimension values
- stance: `reject`, `conditional`, or `support`
- the strongest specific objection from that position
- one observable proof trigger that would overcome it
- relevant evidence IDs

Every position, including `support`, must state a remaining objection. Avoid
biographies, names, demographic decoration, theatrical voices, and generic lines
such as "the market is crowded." An objection fails if it can be pasted into an
unrelated report unchanged.

Run the sampler with `--apply` again after enriching positions. It preserves the
analysis fields while restoring deterministic sampled values.

### 7. Synthesize Without Voting

Do not count stances or write ratios such as `7/12`. Twelve model-generated
positions are not twelve customers.

Cluster overlapping objections, rank them by evidence strength and structural
severity, and promote the strongest 3-5 into `hard_nos`. Each `Hard No` must cite
evidence IDs and position IDs, state why it matters, assign `fatal`, `major`, or
`manageable`, and name the concrete response available to the builder.

Create 3-7 decision factors using `supported`, `uncertain`, or `contradicted`.
Then apply these rules:

- `Build`: require a reachable first user, repeated costly behavior, an existing
  attempt to solve the problem, a credible switching reason, and no unresolved
  fatal condition. Prefer direct user or strong behavior evidence.
- `Test first`: use when the idea is plausible but a decisive assumption remains
  unproven. This is the default for early ideas with incomplete evidence.
- `Do not build`: require a structural failure, a contradicted central premise,
  or an evidence-backed fatal `Hard No`. Competition or missing proof alone is
  insufficient.

Set confidence separately:

- `low`: ungrounded, adjacent evidence, or major unknowns
- `medium`: several relevant sources or credible supplied facts agree
- `high`: direct behavior evidence and independent sources support the decisive
  conclusion

After deciding the verdict, write `tldr` in the report language as 2-4 plain
sentences. State what was evaluated, the verdict, the decisive reason, and the
immediate next step. Do not use method jargon such as "Halton", "adversarial",
"counterposition", or "grounded".

State at least one evidence limit and one item of reversal evidence. Add 3-5
idea-specific mistakes to avoid if the builder proceeds anyway.

### 8. End With One Action

End the report with `next_action`:

- `action`: one task that can begin this week
- `why_now`: the assumption it resolves
- `success_threshold`: an observable result chosen before the test
- `kill_threshold`: the result that should stop or materially redirect the idea

For `Build`, make this the narrowest implementation or paid-pilot action. For
`Test first`, test the decisive uncertainty without a full product. For `Do not
build`, stop the proposed wedge and test only a materially different premise if
one exists.

## Structured Report

Use the bundled `schema/persona-report.schema.json`. Required top-level fields:

```text
title, slug, created_at, language, idea_type, grounding_mode,
input, normalized_idea, tldr, evidence, adversarial_dimensions, sampling_method,
adversarial_positions, decision_factors, hard_nos, recommendation,
mistakes_to_avoid, next_action
```

Before rendering, confirm:

- exactly six dimensions and 12 positions exist
- position IDs are `A01` through `A12`
- every dimension value and coordinate matches the sampler
- evidence and position references resolve
- no old persona, purchase-verdict, numeric-score, or map fields remain

## Render and Validate

Run the bundled scripts from the skill directory:

```bash
node <persona-skill-dir>/scripts/report-html-renderer.mjs \
  reports/<english-slug>-YYYY-MM-DD.json \
  reports/<english-slug>-YYYY-MM-DD.html

node <persona-skill-dir>/scripts/check-report.mjs \
  reports/<english-slug>-YYYY-MM-DD.json \
  reports/<english-slug>-YYYY-MM-DD.html
```

Fix every validation error. Do not hand-write an alternate HTML report when the
renderer fails; fix the structured object or bundled tool path.

The HTML sections must appear in this order:

1. TL;DR
2. Product Snapshot
3. Decision
4. Hard Nos
5. Evidence and Limits
6. Adversarial Coverage
7. What Would Change the Decision
8. Building Anyway? Avoid These Mistakes
9. Do This Now

## Final Response

Tell the user:

- the recommendation and confidence
- the decisive reason in one sentence
- the JSON and HTML paths
- any material evidence limitation
- that the report opens with a shareable verdict snippet

Do not repeat the full report in chat.
