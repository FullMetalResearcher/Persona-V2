# Persona Agent Notes

Persona is an open-source, agent-native skill pack for Codex and Claude Code.
It helps builders pressure-test product ideas before they waste weeks building.

## Active Implementation Source

For coding work, use `IMPLEMENTATION_PLAN.md` as the primary source of truth.

Historical notes live in `docs/archive/`. Read them only for context, not as implementation instructions.
The older June 6 design doc describes a commercial app direction and must not drive v1 unless the user explicitly revives that scope.

If `.agents/` is present, treat it as generated local tooling, not Persona product source.

## Current Direction

- Build the smallest useful version first: skill pack plus tiny local renderer.
- Prefer local files and simple scripts over services, accounts, databases, queues, or dashboards.
- Treat the Italian builder community and warm indie builders as the first audience.
- Do not make claims that Persona predicts the market.
- Frame Persona as: "ChatGPT flatters your idea. Persona pressure-tests it."

## Build Discipline

- Implement one session from `IMPLEMENTATION_PLAN.md` at a time.
- Do not create future folders or files until the current session requires them.
- Prefer one clear file over many clever files.
- Prefer plain schemas, small examples, and direct prompts over abstractions.
- Do not add package scaffolding until a script actually needs it.
- Keep root clean: active root files should be `AGENTS.md`, `IMPLEMENTATION_PLAN.md`, future `README.md`, and future `LICENSE`.
- Put historical or supporting notes under `docs/`.

## V1 Contract

- Persona v1 is a Codex skill plus tiny local renderer.
- Reports are local artifacts: Markdown first, structured JSON, and a linked SVG map audit artifact.
- Default grounding is `web-grounded`.
- Fallback grounding modes are `user-provided` and `ungrounded`.
- Language is auto-detected from user input.
- Stable product terms remain in English in every language:
  - `Hard No`
  - `Sobol sampling`
  - `Halton sequence`
  - `web-grounded`
  - `user-provided`
  - `ungrounded`
  - `WOULD_PAY`
  - `NEEDS_PROOF`
  - `HARD_NO`
- Filenames use English slugs.
- Price is optional and must not block a run.
- Ask at most 1-2 clarification questions.
- Use 12 sampled perspectives in v1 unless `IMPLEMENTATION_PLAN.md` changes.
- Use the dependency-free `Halton sequence` sampler for v1.
- Classify ideas as `B2B`, `B2C`, or `marketplace/platform`.
- Allowed verdicts are `WOULD_PAY`, `NEEDS_PROOF`, and `HARD_NO`.

## Product Principles

- Simplicity is a founding principle.
- The model should behave like an editor with a knife.
- Structured output comes before prose.
- Evidence comes before personas.
- Hard critique should appear early.
- Every output should be short, skeptical, useful, and actionable.

## Report Shape

Use this order unless we explicitly change it:

1. Product Snapshot
2. Verdict Metrics
3. Hard Nos
4. Persona Sampling Map
5. Persona Reactions
6. Objections To Beat
7. Next Experiment

Grounding mode must be explicit:

- `web-grounded`
- `user-provided`
- `ungrounded`

## Output Quality Checklist

- Product appears before methodology.
- Grounding mode is explicit near the top.
- Verdict metrics use 1-5 scores with short reasons.
- Hard Nos appear before persona reactions.
- Persona reactions are 2-3 lines, not essays.
- Objections are concrete and market-facing.
- Next Experiment is one action the builder can run this week.
- The report is truth-seeking, not performatively harsh.

## Keep It Clean

- Do not create extra markdown files unless the user asks for them or they are clearly needed.
- Do not create large frameworks, app scaffolds, or persistent infrastructure without approval.
- Do not add accounts, payment flows, credit ledgers, databases, queues, or analytics unless the project direction changes.
- Do not preserve old commercial-app assumptions when working on the current open-source skill-pack version.
- Prefer one clear file over many clever files.
- Prefer plain schemas, small examples, and direct prompts over abstractions.

## Avoid

- "Market research" overclaims.
- "Simulated personalities" language.
- Verbose AI coaching.
- Decorative persona theater.
- Generic LLM praise such as "interesting idea."
- Output that hides the hard no too late in the report.

## Useful Prior Context

- `docs/archive/conversation-summary-20260629.md` summarizes the June 29 direction change.
- `docs/archive/Persona_initial_workflow_logic.md` documents old prototype logic worth reusing carefully.
- `docs/archive/guido-persona-design-20260606-131758.md` is older commercial-app strategy context; avoid carrying over that scope unless explicitly revived.
