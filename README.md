# Persona

Persona is a Codex plugin that pressure-tests a product idea before you spend
weeks building it.

> ChatGPT flatters your idea. Persona pressure-tests it.

It produces one local decision memo with:

- a clear `Build`, `Test first`, or `Do not build` recommendation
- 3-5 evidence-linked `Hard Nos`
- 12 domain-specific adversarial positions
- the evidence that could reverse the decision
- mistakes to avoid if you build anyway
- one action with success and kill thresholds

Persona does not validate a market or predict startup success.

## Why It Is Different

A normal chatbot gives one conversational opinion and can follow the founder's
framing. Persona runs a fixed anti-sycophancy process:

1. neutralize promotional language
2. research current behavior, alternatives, and barriers
3. derive six dimensions for the actual domain
4. use a deterministic `Halton sequence` to cover 12 counterpositions
5. force every position to state an objection and proof trigger
6. synthesize by evidence and severity, never by counting votes

The sampled positions are reasoning coverage, not simulated customers or market
research.

## Install

Add the repository marketplace and install the plugin:

```bash
codex plugin marketplace add FullMetalResearcher/Persona-V2
codex plugin add persona@persona
```

Start a new Codex task after installation so the skill is discovered.

If you previously installed Persona by copying it to
`~/.codex/skills/persona`, move that legacy directory outside
`~/.codex/skills/` before starting the new task. A manually installed skill with
the same name can take precedence over the plugin. Keep the old directory as a
backup until the plugin run succeeds.

## Run

Invoke Persona directly or ask naturally:

```text
$persona

An AI tool for Italian condominium administrators that drafts resident replies
from building documents and account data. The first users are studios managing
at least 20 buildings. They would use it to handle repetitive email and WhatsApp
requests. Price is not decided.
```

Persona asks at most two clarification questions when the first user or use
moment is missing. Price is optional.

Reports are written to the current project:

```text
reports/<english-slug>-YYYY-MM-DD.json
reports/<english-slug>-YYYY-MM-DD.html
```

The JSON is the source of truth. The self-contained HTML file is the readable
report and can be printed to PDF from the browser.

See [the golden report](examples/golden-report.html) and
[sample inputs](examples/sample-inputs.md).

## Grounding

Persona uses:

- `web-grounded` when browsing is available
- `user-provided` when the builder supplies the evidence
- `ungrounded` only as a low-confidence fallback

Vendor claims can establish that an alternative exists. They do not establish
demand. `Do not build` is reserved for a structural failure or strong
contradictory evidence; an unproven early idea normally receives `Test first`.

## Update

```bash
codex plugin marketplace upgrade persona
codex plugin add persona@persona
```

`marketplace upgrade` refreshes Git marketplace snapshots. When developing from
a local marketplace checkout, only rerun `codex plugin add persona@persona`.
Use a new task after updating.

## Development

The installable plugin lives in `plugins/persona/`. Validate the canonical
example with:

```bash
node plugins/persona/skills/persona/scripts/halton-sampler.mjs \
  examples/golden-report.json --apply

node plugins/persona/skills/persona/scripts/report-html-renderer.mjs \
  examples/golden-report.json examples/golden-report.html

node plugins/persona/skills/persona/scripts/check-report.mjs \
  examples/golden-report.json examples/golden-report.html
```

Implementation requirements and release gates are in
[`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md).

## Feedback

Open a [GitHub issue](https://github.com/FullMetalResearcher/Persona-V2/issues)
and answer three questions:

1. Which objection was generic, unsupported, or wrong?
2. Did the recommendation change what you planned to build?
3. Was the final action practical this week?

## License

MIT
