# Persona V1 Implementation Plan

Last updated: 2026-07-11

This is the active implementation source for Persona. Execute one session at a
time. A new agent should read `AGENTS.md` and this file before changing code.
Historical documents under `docs/archive/` are context only and must not drive
implementation.

## Objective

Make Persona a useful, open-source Codex plugin for indie hackers and builders
who need a credible answer to one question:

> Should I build this, test it first, or stop?

Persona produces one local decision report and stops. The report must expose the
strongest market-facing objections, make a calibrated recommendation, explain
what evidence could reverse it, warn builders who proceed anyway, and end with
one practical action.

Persona's core anti-sycophancy mechanism is adversarial coverage: it derives
domain-specific opposition dimensions from the idea and evidence, uses a
deterministic `Halton sequence` to select 12 distinct market positions, and
forces each position to articulate a refusal point and proof trigger before the
final recommendation is written.

Persona does not validate a market, predict startup success, or replace customer
research. It pressure-tests the decision to spend time building.

## Product Position

```text
ChatGPT flatters your idea. Persona pressure-tests it.
```

The idea-validation category is crowded with long AI reports, many-agent
workflows, SWOT analysis, market-size estimates, and opaque scores. Persona must
take the opposite position:

- fewer claims
- stronger objections
- visible evidence limits
- systematic adversarial coverage
- an explicit decision rule
- one action at the end

"Brutally honest" is not enough to differentiate Persona. The advantage must be
decision credibility: a reader should understand why Persona reached its
recommendation and what new evidence would change it.

The product is not "ChatGPT with a harsher prompt." ChatGPT normally produces
one conversational judgment influenced by the user's framing. Persona
normalizes the pitch, gathers evidence, deliberately covers conflicting market
positions, and only then synthesizes a recommendation.

Useful landscape references:

- Codex plugin structure: <https://developers.openai.com/codex/plugins/build>
- Broad multi-agent validation: <https://trendidea.eu/>
- Evidence-readiness approach: <https://foundable.com/tools/idea-validator>
- Existing open-source startup skill: <https://github.com/ferdinandobons/startup-skill>

## Locked V1 Decisions

1. Persona is a pre-build decision memo, not an AI market validator.
2. Persona retains exactly 12 Halton-sampled adversarial positions as its core
   anti-sycophancy mechanism.
3. Sampling dimensions are derived for the specific domain; fixed generic B2B,
   B2C, or marketplace role grids are prohibited.
4. Sampled positions are reasoning instruments, not simulated customers,
   representative research, or votes.
5. The first release produces one report and does not continue into coaching.
6. Recommendations are exactly `Build`, `Test first`, or `Do not build`.
7. `Do not build` requires a structural failure or strong contradictory evidence.
8. Weak or missing evidence normally produces `Test first`, not fake certainty.
9. Every recommendation states confidence, decisive reasons, evidence limits,
   and reversal evidence.
10. Every report contains 3-5 specific `Hard Nos` tied to the proposed market.
11. Builders who proceed receive a short list of mistakes to avoid.
12. The final report section is one practical action with success and kill
   thresholds.
13. Structured JSON remains the source of truth; HTML remains the readable local
    artifact.
14. Persona is packaged as a minimal Codex plugin with no MCP server, connector,
    app, hook, service, account, or remote dependency.
15. Builder feedback after release should guide later versions. V1 does not
    pre-build a feedback dashboard or telemetry system.

## Explicit Non-Goals

Do not add these in v1:

- web app or hosted API
- database, auth, accounts, payments, or credits
- queues, analytics, telemetry, or dashboards
- background workers or subagent orchestration
- MCP server, app connector, or lifecycle hooks
- CLI or package-manager scaffolding
- PDF generation
- market-size forecasts or financial projections
- SWOT, Lean Canvas, pitch deck, or business-plan generation
- ongoing coaching after the report
- Claude Code parity before the Codex plugin is validated
- claims that sampled positions are customers, personalities, market shares,
  purchase probabilities, representative research, or market simulation
- fixed generic sampling axes reused across unrelated domains

## V1 User Workflow

```text
Free-form product idea
  -> extract target user, use case, current alternative, evidence, and optional price
  -> ask at most 1-2 questions only when target user or use case is missing
  -> normalize the idea without founder pitch language
  -> choose grounding mode
  -> gather a bounded evidence packet
  -> derive six domain-specific adversarial dimensions
  -> generate 12 deterministic Halton positions
  -> force one objection and proof trigger from each position
  -> consolidate the strongest objections into 3-5 Hard Nos
  -> apply the recommendation rules
  -> create structured JSON
  -> render self-contained HTML
  -> validate both artifacts
  -> stop
```

Reports are written into the user's current project:

```text
reports/<english-slug>-YYYY-MM-DD.json
reports/<english-slug>-YYYY-MM-DD.html
```

If a filename exists, append `-2`, `-3`, and so on. Report language follows the
input language; filenames always use English slugs.

## Intake Contract

Extract:

- `idea`: the proposed product or business
- `target_user`: the first specific user or buyer
- `use_case`: the moment and job for which they would use it
- `current_alternative`: what they do today, including doing nothing
- `price`: optional and never blocking
- `links`: optional
- `user_evidence`: optional interviews, behavior, revenue, commitments, usage,
  failed attempts, or other supplied facts

If `target_user` and `use_case` are clear, do not ask questions. If either is
missing, ask no more than two concise questions in one turn.

## Grounding Contract

Allowed grounding modes remain:

- `web-grounded`
- `user-provided`
- `ungrounded`

Use `web-grounded` when browsing is available. Search at most four lanes:

1. current alternatives and incumbent behavior
2. buyer complaints and first-person language
3. switching, trust, regulatory, or distribution barriers
4. pricing or category behavior only when it changes the recommendation

Target 3-5 strong evidence notes. Prefer direct buyer language, product reviews,
community discussions, official documents, and primary product material. Do not
use a vendor claim as proof of demand. Distinguish observed behavior from an
inference made by Persona.

For regulated or high-stakes ideas, expand to 4-7 notes when needed. Otherwise,
stop once the decisive current behavior, alternative, and adoption barrier are
supported.

Each evidence note has:

```json
{
  "id": "E01",
  "source": "",
  "url": "",
  "observation": "",
  "type": "buyer-language",
  "strength": "strong",
  "implication": ""
}
```

Allowed `type` values:

- `buyer-language`
- `current-behavior`
- `alternative`
- `switching-barrier`
- `regulation`
- `pricing`
- `user-provided`

Allowed `strength` values:

- `strong`
- `mixed`
- `weak`

With `ungrounded`, confidence must be `low` and the report must state that its
objections are hypotheses rather than findings.

## Adversarial Coverage Contract

Sampling exists to reduce reasoning blind spots and duplicated objections. It
does not make Persona representative of a market and does not turn model output
into customer evidence.

### Normalize Before Sampling

Before deriving positions, rewrite the input into a neutral internal statement:

- remove adjectives such as "revolutionary," "easy," "unique," or "AI-native"
- separate observed facts from founder assumptions
- state the proposed user, job, current alternative, and switching claim plainly
- preserve constraints and user-provided evidence

The adversarial positions reason from this normalized statement and the evidence
packet, not from the founder's promotional phrasing.

### Derive Six Domain-Specific Dimensions

Choose exactly six dimensions that create materially different reasons to
accept, resist, or reject this specific idea. Each dimension must:

- change likely adoption behavior or the severity of an objection
- be relevant to the actual domain and buying or usage context
- have 3-6 ordered buckets
- include a one-sentence rationale
- avoid fictional demographic detail that does not affect the decision

Example for Italian condominium-management software:

- portfolio size
- daily resident-message volume
- incumbent-software dependence
- building-data readiness
- tolerance for legal and privacy liability
- authority and willingness to approve a pilot

Do not reuse generic dimensions such as `marketing`, `product`, or company size
when those labels do not describe real actors or constraints in the market.

### Generate 12 Positions With Halton

Use the dependency-free sampler with prime bases `[2, 3, 5, 7, 11, 13]` and
indices 1-12. Map each coordinate to one bucket in its corresponding dynamic
dimension. Store the raw coordinates so deterministic coverage remains
auditable.

Every position contains:

```json
{
  "id": "A01",
  "label": "High-volume studio locked into an incumbent suite",
  "dimension_values": {},
  "sampling_coordinates": {},
  "stance": "reject",
  "objection": "",
  "proof_trigger": "",
  "evidence_ids": ["E01"]
}
```

Allowed `stance` values:

- `reject`
- `conditional`
- `support`

The stance summarizes the position's reaction; it is not a purchase prediction.
Every position, including `support`, must name its strongest remaining objection.
Every objection must include a concrete proof trigger that could overcome it.

### Synthesize Without Voting

Do not count positions to determine the recommendation. Twelve model-generated
stances are not twelve customers.

Instead:

1. cluster overlapping objections
2. rank them by structural severity and evidence strength
3. promote the strongest 3-5 into `Hard Nos`
4. apply the separate decision contract below

A single evidence-backed fatal objection can outweigh several supportive
positions. Several unsupported rejections should not outweigh direct demand
evidence.

## Decision Contract

### Recommendation Values

- `Build`
- `Test first`
- `Do not build`

### Build

Use `Build` only when all of these are supported:

- a specific first user is identifiable and reachable
- the problem causes repeated cost, delay, risk, or frustration
- current behavior shows that people already try to solve it
- the proposed wedge offers a credible reason to switch or pay
- no unresolved structural `Hard No` blocks the first version

Real user behavior or user-provided demand evidence is normally required. Search
interest, market growth, waitlists, and generic enthusiasm are not enough.

### Test First

Use `Test first` when the idea is plausible but one or more decisive assumptions
remain unproven. This is the default for early ideas with incomplete evidence.
The report must name the single assumption that the final action tests.

### Do Not Build

Reserve `Do not build` for at least one structural failure or strong negative
evidence, such as:

- the stated user has no meaningful problem or existing response to it
- the builder cannot identify or reach the buyer or user
- the proposed value is already available with no credible switching reason
- required economics, liquidity, trust, legality, or distribution are broken
  for the proposed wedge
- evidence directly contradicts the central premise

Competition alone is not a reason to stop. Missing proof alone is not a reason to
stop. In both cases the likely recommendation is `Test first`.

### Confidence

Allowed values:

- `low`
- `medium`
- `high`

Confidence describes the evidence behind the recommendation, not confidence that
the startup will succeed.

- `low`: ungrounded, adjacent evidence only, or major unknowns
- `medium`: several relevant sources or credible user-provided facts agree
- `high`: direct behavior evidence and multiple independent sources support the
  decisive conclusion

## Hard No Contract

Each report contains 3-5 `Hard Nos`. A `Hard No` is a concrete refusal point, not
a generic startup risk.

Each item must include:

```json
{
  "title": "",
  "objection": "",
  "why_it_matters": "",
  "evidence_ids": ["E01"],
  "position_ids": ["A01", "A07"],
  "severity": "fatal",
  "response": ""
}
```

Allowed severity values:

- `fatal`: independently supports `Do not build` for the proposed wedge
- `major`: must be tested or designed around before meaningful implementation
- `manageable`: real but addressable with a clear product or go-to-market choice

Quality rule: an objection fails review if it could be pasted unchanged into an
unrelated startup report.

## Report Shape

Use this order:

1. **Product Snapshot**
   The real bet, first user, use moment, current alternative, optional price, and
   grounding mode.
2. **Decision**
   `Build`, `Test first`, or `Do not build`; confidence; one decisive reason.
3. **Hard Nos**
   Three to five evidence-linked, market-specific refusal points.
4. **Evidence and Limits**
   The few observations that drove the decision and what is still unknown.
5. **Adversarial Coverage**
   A compact audit of the 12 domain-specific positions, objections, and proof
   triggers. Present it as reasoning coverage, never simulated demand.
6. **What Would Change the Decision**
   Concrete reversal evidence, not generic encouragement.
7. **Building Anyway? Avoid These Mistakes**
   Three to five errors specific to the idea and recommendation.
8. **Do This Now**
   One action, why it is decisive, a success threshold, and a kill threshold.

The decision appears near the top because users asked Persona whether to build.
The report still ends with practical action rather than a repeated conclusion.

## Structured JSON Contract

Keep the object compact enough to inspect by hand. Arrays are abbreviated in
this structural example; generated reports must satisfy the exact counts below.

```json
{
  "title": "",
  "slug": "",
  "created_at": "",
  "language": "en",
  "idea_type": "B2B",
  "grounding_mode": "web-grounded",
  "input": {
    "idea": "",
    "target_user": "",
    "use_case": "",
    "current_alternative": "",
    "price": null,
    "links": [],
    "user_evidence": ""
  },
  "evidence": [],
  "adversarial_dimensions": [
    {
      "name": "incumbent-software dependence",
      "rationale": "Integration depth changes willingness to add another tool.",
      "buckets": ["low", "medium", "high"]
    }
  ],
  "sampling_method": "halton",
  "adversarial_positions": [],
  "decision_factors": [
    {
      "name": "problem behavior",
      "status": "supported",
      "reason": "",
      "evidence_ids": ["E01"]
    }
  ],
  "hard_nos": [],
  "recommendation": {
    "verdict": "Test first",
    "confidence": "medium",
    "decisive_reason": "",
    "evidence_limits": [],
    "reversal_evidence": []
  },
  "mistakes_to_avoid": [],
  "next_action": {
    "action": "",
    "why_now": "",
    "success_threshold": "",
    "kill_threshold": ""
  }
}
```

Allowed `idea_type` values remain:

- `B2B`
- `B2C`
- `marketplace/platform`

Allowed decision-factor statuses:

- `supported`
- `uncertain`
- `contradicted`

Sampling validation rules:

- `sampling_method` is exactly `halton`
- `adversarial_dimensions` contains exactly six domain-specific dimensions
- each dimension defines 3-6 buckets and a rationale
- `adversarial_positions` contains exactly 12 items, `A01` through `A12`
- each position has one value and one coordinate for every selected dimension
- every position has a stance, objection, proof trigger, and evidence references
- position counts and stances never appear as market percentages or vote totals

Do not include persona arrays, map positions, numeric verdict scores, synthetic
purchase verdicts, or any claim that sampling coordinates represent market
probability. Raw `sampling_coordinates` are allowed only inside adversarial
positions to make deterministic coverage auditable.

## HTML Contract

The HTML report is generated mechanically from the JSON object and must be:

- a complete self-contained document
- inline CSS only
- no JavaScript
- no external fonts, images, CSS, or other assets
- accessible semantic HTML
- usable on mobile and desktop
- printable through the browser
- explicit about grounding mode and evidence confidence
- linked to sources where URLs exist
- concise enough to scan in roughly five minutes

The renderer must not invent prose absent from JSON.

## Plugin-First Target Layout

`plugins/persona/` is the only runtime source of truth:

```text
.
|-- AGENTS.md
|-- IMPLEMENTATION_PLAN.md
|-- README.md
|-- LICENSE
|-- .agents/
|   `-- plugins/
|       `-- marketplace.json
|-- plugins/
|   `-- persona/
|       |-- .codex-plugin/
|       |   `-- plugin.json
|       `-- skills/
|           `-- persona/
|               |-- SKILL.md
|               |-- scripts/
|               |   |-- halton-sampler.mjs
|               |   |-- report-html-renderer.mjs
|               |   `-- check-report.mjs
|               `-- schema/
|                   `-- persona-report.schema.json
|-- examples/
|   |-- sample-inputs.md
|   |-- golden-report.json
|   `-- golden-report.html
|-- reports/
|   `-- .gitkeep
`-- docs/
    `-- archive/
```

The plugin manifest should start with:

- name: `persona`
- version: `0.1.0`
- license: `MIT`
- skills path: `./skills/`
- category: `Productivity`
- no `apps`, `mcpServers`, or `hooks`

The marketplace entry points to `./plugins/persona`, uses installation policy
`AVAILABLE`, and contains the metadata required by current Codex plugin tooling.

Runtime reports belong to the user's current repository, never inside the
installed plugin directory.

## Files to Keep, Move, Rewrite, and Delete

### Keep

- `AGENTS.md`, updated to the new contract
- `README.md`, rewritten for plugin installation and the decision-report promise
- `LICENSE`
- `examples/sample-inputs.md`, updated
- `docs/archive/`, as historical context only

### Move Into the Plugin and Rewrite

- `skills/codex/persona/SKILL.md`
  -> `plugins/persona/skills/persona/SKILL.md`
- `renderer/report-html-renderer.mjs`
  -> `plugins/persona/skills/persona/scripts/report-html-renderer.mjs`
- `renderer/check-report.mjs`
  -> `plugins/persona/skills/persona/scripts/check-report.mjs`
- `renderer/halton-sampler.mjs`
  -> `plugins/persona/skills/persona/scripts/halton-sampler.mjs`
- `schema/persona-report.schema.json`
  -> `plugins/persona/skills/persona/schema/persona-report.schema.json`

### Regenerate

- `examples/golden-report.json`
- `examples/golden-report.html`

### Delete From Active V1

- the old `renderer/` directory after all three useful scripts move
- the old `skills/codex/` directory after the skill moves
- the old root `schema/` directory after the schema moves
- all active sampling map, Markdown report, and stale generated report artifacts
  under `reports/`; retain only `.gitkeep`
- `docs/next-agent-steps.md` after its useful instructions are incorporated here
- `docs/post-session-checks.md` after its useful checks are incorporated here

Do not bulk-delete `docs/archive/` during this work. It is excluded from active
implementation and can be pruned in a separate explicit repository-history task.

## Execution Sessions

Complete and verify each session before starting the next. Do not create files
for future sessions early.

### Session 1: Establish the Plugin Package

Goal: make `plugins/persona/` the canonical runtime location without changing
report behavior yet.

Tasks:

1. Create the minimal plugin manifest.
2. Create the repo marketplace entry.
3. Move the current skill, Halton sampler, renderer, checker, and schema into the
   target plugin layout.
4. Update paths inside the skill so it can find its bundled schema and scripts
   from an installed plugin.
5. Update `AGENTS.md` to identify the plugin directory as product source and make
   `.agents/plugins/marketplace.json` the one exception to the generated-tooling
   rule.
6. Do not remove sampling behavior yet; preserve a working baseline during the
   move.

Acceptance criteria:

- plugin validation passes
- skill validation passes
- existing JSON-to-HTML behavior runs from the new paths
- only one runtime copy of each moved file remains
- no app, MCP, hook, dependency, or package setup is added

### Session 2: Replace the Data and Sampling Contract

Goal: replace generic synthetic personas with domain-specific adversarial
positions and define the evidence-linked decision object.

Tasks:

1. Rewrite the schema to match the JSON contract in this plan.
2. Update the sampler to accept six runtime dimension definitions and preserve
   deterministic Halton coordinates.
3. Rewrite the checker for the eight-section report.
4. Validate recommendation, confidence, evidence IDs, position IDs, Hard No
   severity, decision factors, mistakes, and action thresholds.
5. Validate exactly six dimensions and 12 positions with matching buckets and
   coordinates.
6. Reject old generic persona, purchase-verdict, and map fields.
7. Add focused checker fixtures or inline test objects only if they reduce real
   regression risk without adding a framework.

Acceptance criteria:

- a valid new report passes
- missing recommendation, evidence limits, success threshold, or kill threshold
  fails clearly
- orphaned evidence or position IDs fail clearly
- the same dimensions produce the same 12 positions on repeat runs
- different domain dimensions produce different position labels and objections
- old persona, purchase-verdict, and map fields fail clearly
- the checker output identifies the exact broken field

### Session 3: Rewrite the Persona Skill

Goal: make the skill generate credible decisions rather than persona theater.

Tasks:

1. Rewrite intake and bounded grounding instructions.
2. Encode the `Build`, `Test first`, and `Do not build` rules.
3. Encode confidence rules separately from recommendation rules.
4. Require evidence-linked Hard Nos and market-specific mistakes.
5. Require one final action with success and kill thresholds.
6. Require the structured object before HTML.
7. Add neutral idea normalization before adversarial reasoning.
8. Require six domain-specific dimensions and 12 Halton positions.
9. Require one objection and proof trigger from every position.
10. Forbid vote counting or market-representation claims during synthesis.
11. Remove fixed generic dimensions, synthetic purchase verdicts, decorative
    persona language, and subagent paths.
12. Keep output concise and auto-detect the input language.

Acceptance criteria:

- active sampling language describes reasoning coverage, not customers or demand
- dimensions are specific to the idea and evidence
- all 12 positions expose an objection and proof trigger
- weak evidence defaults to `Test first`
- `Do not build` requires a stated structural reason or contradictory evidence
- objections cannot be generic startup advice
- the skill stops after saving and checking the report

### Session 4: Rewrite the Renderer and Golden Example

Goal: produce a short, trustworthy decision report from the new JSON.

Tasks:

1. Rewrite the renderer for the eight approved sections.
2. Keep sources clickable and evidence limits conspicuous.
3. Make the decision immediately scannable without turning the report into a
   decorative dashboard.
4. Regenerate a matching golden JSON/HTML pair.
5. Use the Italian property-management idea as the first hard example because it
   exposes domain-role mismatch, regulation, trust, and incumbent integration.
6. Render adversarial positions as a compact coverage audit, not a persona map or
   vote visualization.
7. Make its next action easier than requesting large sensitive datasets from five
   prospects on first contact.

Acceptance criteria:

- golden JSON and HTML pass the checker
- HTML contains exactly the eight sections in order
- no numeric score, persona map, fake buyer role, or vote total appears
- all 12 domain-specific positions remain inspectable without dominating the report
- report is readable at mobile and desktop widths
- print output remains usable
- renderer does not add claims absent from JSON

### Session 5: Remove Obsolete V1 Components

Goal: leave no active code or documentation that teaches the old product.

Tasks:

1. Remove stale active reports, Markdown reports, and SVG maps from `reports/`.
2. Remove old source directories after confirming the plugin copies work.
3. Remove every fixed generic sampling dimension table and obsolete purchase
   verdict contract while retaining the dynamic Halton sampler.
4. Delete superseded next-agent and post-session documents after incorporating
   any still-relevant checks.
5. Update README, sample inputs, `.gitignore`, and active AGENTS instructions.
6. Search active files for obsolete terms.

Acceptance criteria:

- `reports/` contains only `.gitkeep`
- active product files contain no `map_position`, `Persona Sampling Map`,
  `WOULD_PAY`, `NEEDS_PROOF`, fixed generic role grids, simulated-customer
  claims, or persona theater
- active `Halton sequence` and `sampling_coordinates` language is limited to
  deterministic adversarial coverage
- historical matches under `docs/archive/` are allowed
- root remains clean and contains no new active Markdown file beyond the approved
  root documents

### Session 6: Evaluate Decision Quality

Goal: verify that the recommendation system behaves differently when evidence
changes and remains stable when founder enthusiasm changes.

Run at least three cases:

1. **Test first:** the property-management idea with relevant market evidence but
   no direct buyer commitment.
2. **Do not build:** an idea with a structural distribution, economics, legal, or
   behavior contradiction supported by evidence.
3. **Build:** an idea with a specific user, costly current behavior, direct demand
   evidence, a reachable channel, and a narrow first wedge.

For each case, run two semantically equivalent framings:

- a promotional founder pitch using confident, enthusiastic language
- a neutral description containing the same facts

The normalized idea, material Hard Nos, and recommendation class should remain
stable. Material differences indicate residual sycophancy or framing bias.

Score each report manually from 1-5 on:

- objection specificity
- adversarial coverage diversity
- domain relevance of dimensions
- evidence traceability
- recommendation calibration
- reversal clarity
- mistake usefulness
- actionability
- concision

Any dimension below 4 requires a skill or renderer revision before packaging.
Do not average away a weak dimension.

Acceptance criteria:

- the same evidence state leads to the same recommendation class on repeat runs,
  allowing wording variation
- promotional and neutral framings lead to the same recommendation class
- the 12 positions cover distinct refusal conditions rather than paraphrasing one
  objection
- changing decisive evidence can change the recommendation
- no report claims market validation or prediction
- each report ends with one action that can be started this week

### Session 7: Validate Installation and Distribution

Goal: prove a new Codex user can discover, install, run, and update Persona.

Tasks:

1. Run the installed plugin and skill validators.
2. Add the repository as a local marketplace using the current official Codex
   flow. Request approval before writing outside the workspace.
3. Restart or refresh the relevant Codex surface as required.
4. Install Persona from the local marketplace.
5. Open a fresh task and run a report from a different repository.
6. Confirm reports are written to that repository rather than the plugin source.
7. Verify the update path after a small version bump or cache-buster change.
8. Document the shortest verified install and update instructions in README.

Acceptance criteria:

- plugin appears in the plugin directory
- installation succeeds from the repository marketplace
- a fresh task can invoke Persona
- bundled scripts and schema resolve correctly after installation
- report artifacts land in the caller's repository
- README commands exactly match the tested flow

### Session 8: Release Candidate

Goal: prepare the smallest credible public v1.

Tasks:

1. Set version `0.1.0` consistently.
2. Run all validation commands and the three evaluation cases.
3. Review README in under one minute from a new user's perspective.
4. Include one strong screenshot only if the plugin directory benefits from it;
   do not create an asset suite for v1.
5. Provide a GitHub issue template or a single documented feedback route asking:
   - Which objection was generic or wrong?
   - Did the recommendation change your decision?
   - Was the final action practical?
6. Review the final diff for obsolete files and accidental scope expansion.

Acceptance criteria:

- one command or documented marketplace action installs Persona
- one example shows the complete report and decision quality
- there is one obvious feedback route
- no unused v1 component remains
- no unverified market or predictive claim appears in README or examples

## Verification Commands

Paths may change slightly during Session 1; after migration, these are canonical:

```bash
python3 "$HOME/.codex/skills/.system/skill-creator/scripts/quick_validate.py" \
  plugins/persona/skills/persona
```

```bash
python3 "$HOME/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py" \
  plugins/persona
```

```bash
node plugins/persona/skills/persona/scripts/report-html-renderer.mjs \
  examples/golden-report.json examples/golden-report.html
```

```bash
node plugins/persona/skills/persona/scripts/check-report.mjs \
  examples/golden-report.json examples/golden-report.html
```

```bash
node --input-type=module -e '
  import { sampleAdversarialPositions } from "./plugins/persona/skills/persona/scripts/halton-sampler.mjs";
  const dimensions = [
    { name: "d1", buckets: ["a", "b", "c"] },
    { name: "d2", buckets: ["a", "b", "c"] },
    { name: "d3", buckets: ["a", "b", "c"] },
    { name: "d4", buckets: ["a", "b", "c"] },
    { name: "d5", buckets: ["a", "b", "c"] },
    { name: "d6", buckets: ["a", "b", "c"] }
  ];
  const a = JSON.stringify(sampleAdversarialPositions(dimensions));
  const b = JSON.stringify(sampleAdversarialPositions(dimensions));
  if (a !== b) process.exit(1);
'
```

The exported sampler function name may differ after Session 2; update this
command to match the implemented API rather than maintaining an alias solely for
the plan.

```bash
rg -n -i \
  'map_position|persona sampling map|would_pay|needs_proof|simulated customer|representative market' \
  AGENTS.md IMPLEMENTATION_PLAN.md README.md plugins examples
```

The final search may match explicit prohibition and migration notes, but not
active output fields, report copy, or claims.

## Quality Gate for Every Report

- [ ] The real product bet is clear in one paragraph.
- [ ] Grounding mode is explicit.
- [ ] Recommendation is exactly `Build`, `Test first`, or `Do not build`.
- [ ] Confidence describes evidence quality, not startup success probability.
- [ ] The idea was normalized before adversarial reasoning.
- [ ] Six dimensions are specific to this idea and domain.
- [ ] All 12 Halton positions contain a distinct objection and proof trigger.
- [ ] Sampled stances are not counted as customers, votes, or market percentages.
- [ ] The decisive reason is supported or clearly labeled as an inference.
- [ ] There are 3-5 market-specific Hard Nos.
- [ ] Evidence references resolve to real evidence items.
- [ ] Missing evidence is visible.
- [ ] Reversal evidence could genuinely change the recommendation.
- [ ] Mistakes to avoid are specific to this idea.
- [ ] The final action can start this week.
- [ ] Success and kill thresholds are measurable.
- [ ] The report does not claim validation, prediction, or representative research.
- [ ] The report is short enough to scan in roughly five minutes.

## Start Here in a New Window

Use this prompt:

```text
Read AGENTS.md and IMPLEMENTATION_PLAN.md. Execute Session 1 only. Preserve
unrelated worktree changes, verify the session acceptance criteria, and stop
before Session 2.
```

Do not implement multiple sessions in one turn unless the user explicitly asks
to combine them.
