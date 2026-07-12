# Persona Agent Notes

Persona is an open-source Codex plugin for indie hackers and builders deciding
whether an idea deserves implementation time.

## Active Sources

Read `IMPLEMENTATION_PLAN.md` before coding. It is the product and execution
source of truth.

`plugins/persona/` is the only runtime product source. The repository marketplace
entry at `.agents/plugins/marketplace.json` is product distribution metadata.
Treat every other `.agents/` file as generated local tooling.

Historical notes under `docs/archive/` are context only. The older commercial
app direction must not drive v1.

## Product Contract

Persona answers:

> Should I build this, test it first, or stop?

It produces one local JSON/HTML decision report and stops. Recommendations are
exactly:

- `Build`
- `Test first`
- `Do not build`

`Do not build` requires a structural failure or strong contradictory evidence.
Weak evidence normally means `Test first`.

## Anti-Sycophancy Contract

Persona is not a harsher chat prompt. It must:

1. normalize promotional founder language
2. gather a bounded evidence packet
3. derive six domain-specific opposition dimensions
4. use the dependency-free `Halton sequence` to create 12 positions
5. force one objection and proof trigger from every position
6. synthesize by evidence and severity, never by vote count

Sampled positions are reasoning instruments. Never call them customers,
personalities, representative research, purchase probabilities, market shares,
or market simulation.

Do not restore fixed generic B2B, B2C, or marketplace role grids. Dimensions must
fit the actual domain. Store raw sampling coordinates only to audit deterministic
coverage.

## Report Shape

Use this exact order:

1. Product Snapshot
2. Decision
3. Hard Nos
4. Evidence and Limits
5. Adversarial Coverage
6. What Would Change the Decision
7. Building Anyway? Avoid These Mistakes
8. Do This Now

The report ends with one action, a success threshold, and a kill threshold.

Grounding mode is explicit:

- `web-grounded`
- `user-provided`
- `ungrounded`

Keep these product terms in English in every report language:

- `Hard No`
- `Halton sequence`
- the grounding modes above
- the three recommendation values

## Quality Rules

- Structured JSON comes before HTML.
- Evidence comes before conclusions.
- Hard critique appears early.
- Every material claim is evidenced, user-provided, or labeled as uncertainty.
- Every `Hard No` cites evidence and sampled-position IDs.
- An objection is too generic if it fits an unrelated startup unchanged.
- Confidence describes evidence quality, not likelihood of startup success.
- Do not infer demand from vendor claims, search volume, waitlists, or enthusiasm.
- Do not show sampled stances as ratios, votes, or percentages.
- Keep the report readable in roughly five minutes.

## Build Discipline

- Execute the sessions in `IMPLEMENTATION_PLAN.md` sequentially and verify each
  acceptance gate.
- Preserve unrelated worktree changes.
- Prefer local files, plain JSON, and dependency-free scripts.
- Keep the root limited to `AGENTS.md`, `IMPLEMENTATION_PLAN.md`, `README.md`, and
  `LICENSE` as active documents.
- Put historical material under `docs/archive/`.
- Do not add package scaffolding for the internal Node scripts.
- Use browser print for PDF; do not add PDF tooling.

## Explicit Non-Goals

Do not add a web app, hosted API, database, auth, accounts, payments, credits,
queues, analytics, telemetry, dashboards, background workers, subagent
orchestration, MCP server, app connector, lifecycle hook, product CLI, market
forecasts, SWOT output, pitch generation, or ongoing coaching.

Claude Code parity is outside v1 until the Codex plugin is proven.

## Verification

After runtime changes, run:

```bash
node plugins/persona/skills/persona/scripts/halton-sampler.mjs \
  examples/golden-report.json --apply

node plugins/persona/skills/persona/scripts/report-html-renderer.mjs \
  examples/golden-report.json examples/golden-report.html

node plugins/persona/skills/persona/scripts/check-report.mjs \
  examples/golden-report.json examples/golden-report.html
```

Also validate the skill and plugin with the installed Codex creator tools. If
their Python environment lacks PyYAML, use an isolated temporary dependency path
rather than adding Python packaging to this repository.
