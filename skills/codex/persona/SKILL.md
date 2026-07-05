---
name: persona
description: Pressure-test startup and product ideas with grounded objections, sampled market positions, and a short local Markdown report.
---

# Persona Codex Skill

Use this skill when the user asks Persona to pressure-test a startup or product idea, validate an idea, get hard objections, or generate a Persona report.

Persona is not market research and does not predict the market. Persona creates a grounded, skeptical pressure test: what must be true, who might care, who likely refuses, and what experiment should run next.

## Output Standard

Default to concise, evidence-led writing.

- Shorter: write the fewest words that preserve the objection. Prefer one hard sentence over a paragraph.
- Less generic: name the current workaround, alternative, buyer habit, trust barrier, or channel problem. Do not write objections that could fit any startup.
- More grounded: every major negative claim should trace to evidence, user-provided context, or an explicit uncertainty.
- More truth-seeking: separate "this may fail because..." from "prove this by...". Do not punish the idea for not being proven yet.
- Less performatively harsh: avoid insults, roast language, and dramatic certainty. The critique should be plain, specific, and useful.
- Clearer next experiment: end with one action the builder can run this week, including who to contact, what to show, what to ask, and what result would count.

The report should read like a short argument, not a checklist. The spine is:

```text
What is the real bet?
What does current behavior suggest?
Where does it break?
Who might still care?
What is the fastest test?
```

Use bullets only where they improve scanning. Avoid giving every section the same bullet-list rhythm.

## Scope

This is the Session 4 prototype.

Do:

- Accept a free-form startup/product idea.
- Extract idea, target user, use case, optional price, links, and user-provided context.
- Ask at most 1-2 clarification questions if target user or use case is missing.
- Default to `web-grounded` when browsing/search is available.
- Auto-detect report language from the user's input.
- Keep stable product terms in English.
- Classify the idea as `B2B`, `B2C`, or `marketplace/platform`.
- Create exactly 12 sampled market positions using the idea-type-specific sampling rules below.
- Assign each position one verdict: `WOULD_PAY`, `NEEDS_PROOF`, or `HARD_NO`.
- Create the structured report object before prose.
- Keep the structured report aligned with `schema/persona-report.schema.json`.
- Save both structured JSON and Markdown under `reports/`.
- Generate the Markdown report from the structured object.
- Generate a black-and-white SVG `Persona Sampling Map` with `renderer/render-map.mjs` when available.
- Link to the SVG map from the Markdown report, but do not embed it by default.
- Fall back to a simple Markdown table map if SVG rendering fails or the renderer is unavailable.

Do not:

- Add a CLI.
- Add a web app.
- Add package setup.
- Add README or packaging files.
- Add auth, database, payments, queues, dashboards, analytics, or persistent infrastructure.

## Stable Terms

Keep these terms in English in every report language:

- `Hard No`
- `Sobol sampling`
- `Halton sequence`
- `web-grounded`
- `user-provided`
- `ungrounded`
- `WOULD_PAY`
- `NEEDS_PROOF`
- `HARD_NO`

Allowed verdicts:

- `WOULD_PAY`
- `NEEDS_PROOF`
- `HARD_NO`

Allowed idea types:

- `B2B`
- `B2C`
- `marketplace/platform`

## Intake

Extract these fields from the user's free-form input:

- `idea`: the product/startup idea
- `target_user`: who it is for
- `use_case`: when or why they would use it
- `price`: optional
- `links`: optional
- `user_context`: optional pasted notes, evidence, constraints, examples, or assumptions

If both `target_user` and `use_case` are clear enough, proceed.

If one is missing, ask one clarification question.

If both are missing, ask two clarification questions in one message:

```text
Who is the first target user?
When would they use this?
```

Do not ask about price unless the user explicitly wants pricing feedback. If price is missing, mark it as an uncertainty in the report.

## Language

Auto-detect the language from the user's idea. Write the report in that language.

Use English file slugs regardless of report language.

## Grounding

Default to `web-grounded` when a browsing or web search tool is available.

For `web-grounded`:

- Search for buyer language, existing alternatives, complaints, current behavior, and switching/trust barriers.
- Prefer concrete sources: forum threads, reviews, product pages, docs, comparison pages, blog posts, community posts, and public discussions.
- Use 3-6 concise evidence notes.
- Include source links inline where they directly support a point.
- Do not overclaim from the evidence.
- Do not cite a source as proof of demand unless it shows behavior close to the proposed use case.
- If evidence only shows an adjacent market, say so in the evidence note.

If web browsing/search is unavailable but the user provided evidence, use `user-provided`.

If neither web search nor user evidence is available, use `ungrounded` and lower certainty in the wording once near the top.

## Structured Report Object

Before writing the Markdown report, create one structured report object that follows `schema/persona-report.schema.json`.

This object is the source of truth. Do not invent separate Markdown content that is not represented in the object.

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
  "input": {
    "idea": "",
    "target_user": "",
    "use_case": "",
    "price": null,
    "links": [],
    "user_context": ""
  },
  "evidence_packet": [],
  "sampling_dimensions": [],
  "personas": [],
  "verdict_metrics": [],
  "hard_nos": [],
  "objections_to_beat": [],
  "next_experiment": {
    "action": "",
    "why": "",
    "success_signal": ""
  }
}
```

Validation rules:

- `idea_type` must be exactly one of: `B2B`, `B2C`, `marketplace/platform`.
- `grounding_mode` must be exactly one of: `web-grounded`, `user-provided`, `ungrounded`.
- `sampling_method` must be exactly `halton`.
- `sampling_dimensions` must contain exactly the six dimensions for the selected idea type.
- `personas` must contain exactly 12 items, `P01` through `P12`.
- Every persona must include `sampling_coordinates` with one raw Halton coordinate for each selected dimension.
- Every persona must include `map_position` with normalized `x` and `y` numbers between 0 and 1.
- Every persona verdict must be exactly one of: `WOULD_PAY`, `NEEDS_PROOF`, `HARD_NO`.
- `evidence_packet` uses 3-6 items. Each item should be one sentence per field.
- `verdict_metrics` uses 4-5 items, each with a 1-5 integer score and a reason under 18 words.
- `hard_nos` uses 3-5 items. Each item must name a specific failure mode.
- `objections_to_beat` uses 3-5 items. Each item must be actionable and testable.
- `next_experiment` must contain one concrete action, why it matters, and a measurable success signal.

Save the structured object as:

```text
reports/<english-slug>-YYYY-MM-DD.json
```

If a file already exists, append `-2`, `-3`, etc. Use the same suffix for the matching Markdown file.

## SVG Map Rendering

After saving the structured JSON, generate the SVG map when `renderer/render-map.mjs` is present:

```bash
node renderer/render-map.mjs reports/<english-slug>-YYYY-MM-DD.json reports/<english-slug>-YYYY-MM-DD-map.svg
```

Rules:

- Run the renderer after the JSON exists and before writing the final Markdown.
- Use the same slug and date suffix for `.json`, `.md`, and `-map.svg`.
- Link to the SVG in the `Persona Sampling Map` section with a relative path:

```markdown
[Open Persona Sampling Map](./<english-slug>-YYYY-MM-DD-map.svg)
```

- If the renderer fails, keep the run useful: write the Markdown report with the table fallback and mention that the SVG map was not generated.
- Do not install dependencies for the renderer. It is dependency-free.

## Idea Type Classification

Classify the idea before sampling:

- `B2B`: buyer/user is a company, team, worker, founder, operator, freelancer, agency, or professional role.
- `B2C`: buyer/user is an individual consumer using personal money, time, habits, identity, or life context.
- `marketplace/platform`: value depends on matching, liquidity, network effects, supply and demand, or multi-sided participation.

If ambiguous, choose the type that best matches the first target user.

## Sampling Contract

After idea type classification, create exactly 12 sampled positions with the local dependency-free `Halton sequence` sampler in `renderer/halton-sampler.mjs`.

Use prime bases `[2, 3, 5, 7, 11, 13]`. Start at Halton index 1, not 0, so the first point is not all zeroes. Map each coordinate in `[0, 1)` to one bucket for the matching dimension. Set `sampling_method` to `"halton"` in the structured report.

Use the phrase `Sobol sampling` only to describe broad-coverage product intent or legacy wording. Do not claim true Sobol generation unless a Sobol generator is actually implemented. Do not claim mathematical precision, predictive validity, or representative market research.

The selected idea type determines the dimension set:

- `B2B`: company size, buyer role, budget authority, urgency, switching pain, trust/compliance barrier.
- `B2C`: consumer archetype, pain frequency, willingness to pay, habit strength, trust/risk sensitivity, channel accessibility.
- `marketplace/platform`: supply-side motivation, demand-side urgency, liquidity difficulty, trust requirement, repeat-use likelihood, switching friction.

Set `sampling_dimensions` in the structured report to exactly the six dimensions for the chosen idea type.

Set `personas` to exactly 12 objects. Each object must include:

- `id`: `P01` through `P12`
- `label`: short market position label
- `dimensions`: key/value object using only the selected idea-type dimensions and Halton bucket values
- `sampling_coordinates`: key/value object using the selected dimension names and raw Halton coordinates
- `map_position`: object with normalized `x` and `y` values between 0 and 1; use the first two Halton coordinates
- `verdict`: exactly one of `WOULD_PAY`, `NEEDS_PROOF`, or `HARD_NO`
- `objection`: concrete market-facing objection
- `what_would_change_their_mind`: specific proof, wedge, trust reducer, or buying trigger

Do not reuse B2B dimensions for B2C ideas. Do not use company size or buyer role for consumer ideas unless the consumer idea is actually prosumer/B2B.

### Halton Bucket Definitions

Use the bucket arrays in `renderer/halton-sampler.mjs` as the active sampler source:

```text
B2B
- company size: solo, 2-10, 11-50, 51-200, 201-1000, 1000+
- buyer role: founder, marketing, product, growth, operations, finance/procurement
- budget authority: none, influencer, small discretionary, team budget, department owner, executive owner
- urgency: vague-curiosity, nice-to-have, active-pain, deadline-driven, burning-now
- switching pain: very-low, low, medium, high, very-high
- trust/compliance barrier: low, medium, high, very-high, regulated

B2C
- consumer archetype: novelty seeker, overwhelmed user, productivity buyer, privacy-sensitive user, budget-constrained user, community-led user
- pain frequency: rare, occasional, monthly, weekly, daily
- willingness to pay: very-low, low, medium, high
- habit strength: low, medium, high, very-high
- trust/risk sensitivity: low, medium, high, very-high
- channel accessibility: low, medium, high, community-driven

marketplace/platform
- supply-side motivation: low, side-income, portfolio/reputation, lead generation, high-paid expert
- demand-side urgency: low, medium, high, deadline-driven, burning-now
- liquidity difficulty: low, medium, high, very-high
- trust requirement: low, medium, high, very-high
- repeat-use likelihood: one-time, low, medium, high
- switching friction: low, medium, high, very-high
```

## Reaction Rules

For each sampled position in the structured object, write one short reaction with:

- ID
- label
- market position summary
- verdict
- objection
- what would change their mind

Rules:

- Use exactly one allowed verdict per position.
- Do not assign all verdicts evenly by quota. Let the idea and evidence drive the distribution.
- Prefer concrete objections over generic advice; name the competing behavior whenever possible.
- Keep each reaction to 2-3 lines.
- Avoid long persona biographies.
- Avoid theatrical personality writing.
- Do not write "interesting idea."

## Verdict Metrics

Use 1-5 scores with one short reason each.

Default metric set:

- likely pull
- urgency
- willingness to pay
- trust barrier
- differentiation

Label these as model judgments, not measured truth.

## Report Output

Write a Markdown report under `reports/` after the structured object is complete.

The Markdown report must be generated from the structured object and should not introduce extra claims, personas, metrics, objections, or experiments not present in the JSON.

Filename format:

```text
reports/<english-slug>-YYYY-MM-DD.md
```

Use a concise English slug from the idea. If a file already exists, append `-2`, `-3`, etc.

Use this exact section order:

```markdown
# <Report Title>

Grounding: `web-grounded` | `user-provided` | `ungrounded`
Idea type: `B2B` | `B2C` | `marketplace/platform`

<Short intro on what Persona is doing in this report.>

## Product Snapshot

## Verdict Metrics

## Hard Nos

## Persona Sampling Map

## Persona Reactions

## Objections To Beat

## Next Experiment
```

### Product Snapshot

Write 2 short paragraphs, not bullets:

- Paragraph 1: what the product is, who it is for, and the behavior change it requires.
- Paragraph 2: the real bet the idea is making, connected to 2-4 evidence links.

Do not add a separate evidence section in Session 1. Do not dump all sources; include only links that directly support the critique.

### Report Intro

After the metadata and before `Product Snapshot`, add 2-3 sentences explaining what Persona is doing in this report:

- Persona is pressure-testing the idea, not predicting the market.
- The report looks for refusal points, possible pull, and the fastest useful test.
- The tone should be skeptical but not theatrical.

### Verdict Metrics

Use a compact table with maximum 5 metrics:

```markdown
| Metric | Score | Read |
| --- | ---: | --- |
| likely pull | 2/5 | Short reason. |
```

After the table, add one short synthesis sentence that says what the scores imply.

### Hard Nos

Maximum 3 bullets in Markdown, even if the structured object has more. These are the reasons the idea probably fails or gets ignored.

Write them early and plainly.

Rules:

- A Hard No is a refusal condition, not a scolding.
- Tie each Hard No to a buyer behavior, current alternative, price/trust barrier, or missing proof.
- Do not use vague lines like "the market is crowded" unless you name the crowd and why it matters.

### Persona Sampling Map

The map is an optional audit artifact, not the main analysis. Do not embed the SVG by default because it can distract from the written critique.

When the SVG map was generated, link to it:

```markdown
[Open Persona Sampling Map](./<english-slug>-YYYY-MM-DD-map.svg)
```

Then add one short sentence:

```text
Map generated from the structured persona data using deterministic low-discrepancy coverage; use it as an audit artifact, not as the core analysis.
```

If SVG rendering failed or `renderer/render-map.mjs` is unavailable, use this Markdown table fallback:

```markdown
| Zone | IDs | Signal |
| --- | --- | --- |
| `WOULD_PAY` | P01, P06 | Why this cluster might pull |
| `NEEDS_PROOF` | P03, P04, P11 | What proof they require |
| `HARD_NO` | P08, P12 | Why they reject it |
```

Mention the fallback plainly:

```text
SVG map was not generated for this run; this table is the fallback sampling map.
```

### Persona Reactions

Do not render a 12-row table in Markdown. The structured JSON still keeps all 12 sampled positions, but the Markdown report should group them by verdict into three compact clusters.

Each cluster heading must include count, denominator, verdict, and the cluster insight:

```markdown
**3/12 WOULD_PAY: launch-week founders and consultants who can use critique immediately**

P01 Launch-week solo founder: Feedback sentence. Takeaway: Specific product implication.

P07 Sales-led founder: Feedback sentence. Takeaway: Specific product implication.

P11 Indie consultant: Feedback sentence. Takeaway: Specific product implication.
```

Mention every persona ID exactly once across the three clusters. Each persona comment must include:

- `Feedback:` what this sampled position reveals about the idea.
- `Takeaway:` a specific founder-facing product, positioning, trust, pricing, channel, or experiment implication.

The takeaway must not be generic. It should help the founder improve the project. Avoid lines like "improve onboarding", "add more value", or "build trust" unless they name the exact mechanism.

### Objections To Beat

Maximum 3 bullets in Markdown. Convert hard objections into actions:

- narrow the wedge
- prove a claim
- change the buyer
- reduce trust barrier
- test pricing or urgency

Each bullet should start with an action verb and include a concrete proof target, for example: "Show 5 founders before/after rewrites that increased waitlist clicks," not "prove value."

### Next Experiment

Give one concrete experiment the builder can run this week. Write it as a short prose block with bold labels, not bullets.

Do not recommend "keep researching" or "build the MVP" as the next experiment.

Format it as:

```text
**Action:** <one specific action>

**Why:** <one sentence>

**Success signal:** <observable threshold>
```

The action must specify a target audience, artifact, and ask. The success signal must be measurable without building a full product.

## Final Checks

Before finishing:

- Confirm the JSON file path.
- Confirm the Markdown report file path.
- Confirm the SVG map path if generated.
- Confirm all generated files use the same English slug and date suffix.
- Confirm the Markdown report was generated from the structured object.
- Confirm the SVG was generated from the structured object when the renderer was available.
- Confirm the Markdown links to the SVG when generated, or includes the table fallback when not generated.
- Confirm all seven sections are present.
- Confirm `Grounding` is explicit.
- Confirm the report includes a short intro explaining what Persona is doing.
- Confirm `Hard Nos` appear before `Persona Reactions`.
- Confirm the Markdown report reads as an argument, not a flat list.
- Confirm `Persona Reactions` groups all 12 sampled positions into verdict clusters instead of a 12-row table.
- Confirm every persona comment includes a non-generic `Takeaway:`.
- Confirm `idea_type` is one of `B2B`, `B2C`, `marketplace/platform`.
- Confirm `sampling_dimensions` exactly match the selected idea type.
- Confirm there are exactly 12 sampled positions, `P01` through `P12`.
- Confirm every sampled position has `id`, `label`, `dimensions`, `verdict`, `objection`, and `what_would_change_their_mind`.
- Confirm every verdict is one of `WOULD_PAY`, `NEEDS_PROOF`, `HARD_NO`.
- Confirm any `Sobol sampling` or `Halton sequence` language is honest about what was actually generated.
- Confirm no CLI package, README, package setup, web app, or infrastructure was added.
