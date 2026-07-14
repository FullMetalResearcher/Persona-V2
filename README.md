# Persona

[![Validate](https://github.com/FullMetalResearcher/Persona-V2/actions/workflows/validate.yml/badge.svg)](https://github.com/FullMetalResearcher/Persona-V2/actions/workflows/validate.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Get a brutal, evidence-linked go/no-go on your product idea before you spend
weeks building something nobody wants.

> ChatGPT flatters your idea. Persona pressure-tests it.

Persona is a Claude Code and Codex plugin for indie makers, founders, and side
project builders. It turns an idea into one local decision memo with a clear
`Build`, `Test first`, or `Do not build` recommendation.

## What You Get

- A verdict and confidence level tied to the evidence, not founder enthusiasm.
- 3-5 specific `Hard Nos` that identify what could actually stop adoption.
- The evidence that would reverse the decision.
- One immediate test with observable success and kill thresholds.
- A plain-language TL;DR and copyable verdict snippet you can share.
- A self-contained HTML report plus structured JSON for future use.

The report is direct about uncertainty:

> **Test first** - medium confidence
>
> The problem is plausible, but nobody has yet changed behavior or committed
> money for this workflow.
>
> **Hard No: The weekly pain may be too small to trigger switching.**
>
> Run the proposed concierge test before building automation.

Persona does not validate a market or predict startup success.

## Install

Persona needs a working `node` executable for its bundled dependency-free
scripts.

### Claude Code

Run these commands inside Claude Code:

```text
/plugin marketplace add FullMetalResearcher/Persona-V2
/plugin install persona@persona
```

Start a new session after installation so the skill is discovered.

### Codex

Use a Codex installation where `codex plugin --help` exposes the plugin
commands:

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

Give Persona the idea, first user, use moment, and current alternative:

```text
Pressure-test my idea: a $19/month cash-flow alert for freelance designers who
currently review three bank accounts every Friday in a spreadsheet.
```

You can also invoke the skill directly with `$persona`. Persona asks at most two
clarifying questions when the first user or use moment is missing. Price is
optional.

Reports are written to the current project:

```text
reports/<english-slug>-YYYY-MM-DD.json
reports/<english-slug>-YYYY-MM-DD.html
```

The JSON is the source of truth. The self-contained HTML report opens with the
TL;DR and shareable verdict, and it can be printed to PDF from the browser.

## How It Works

Persona uses a fixed anti-sycophancy process so the verdict does not simply
follow the wording of the pitch:

1. Neutralize promotional language and state the user, job, status quo, and
   switching reason plainly.
2. Ground the decision in current behavior, alternatives, barriers, and direct
   buyer language when evidence is available.
3. Derive six decision dimensions for the idea's actual domain.
4. Use a deterministic `Halton sequence` to cover 12 distinct
   counterpositions without inventing demographic characters.
5. Force every position to state a specific objection and the observable proof
   that would overcome it.
6. Rank objections by evidence and structural severity, never by counting
   positions as votes.

The 12 positions are reasoning coverage, not simulated customers, market share,
purchase probability, or market research.

## FAQ

### Is Persona market research?

No. Persona is a structured pre-build critique. Its sampled positions are
reasoning instruments, not real respondents, and the verdict does not predict
startup success.

### Does it need web access?

No, but web access improves the evidence. Persona uses `web-grounded` mode when
browsing is available, `user-provided` mode when you supply the evidence, and
`ungrounded` mode only as a low-confidence fallback. Vendor claims can establish
that an alternative exists; they cannot establish demand.

### Does it work in my language?

Yes. Persona detects the language of the idea and writes the report in that
language. Contract terms such as `Hard No`, `Build`, `Test first`, and `Do not
build` remain in English so reports stay structurally consistent.

### Where do reports go?

Both report files stay under `reports/` in the project where you ran Persona.
They are not committed or published automatically.

### Does everything stay local?

The JSON and self-contained, JavaScript-free HTML artifacts are generated
locally and use no external assets. In `web-grounded` mode, search queries still
go through the browsing provider available to your agent; Persona uses
generalized search terms when an idea appears private or proprietary.

## Update

### Claude Code

Refresh the Persona marketplace from inside Claude Code:

```text
/plugin marketplace update persona
```

Start a new session after the update.

### Codex

```bash
codex plugin marketplace upgrade persona
codex plugin add persona@persona
```

`marketplace upgrade` refreshes Git marketplace snapshots. When developing from
a local marketplace checkout, only rerun `codex plugin add persona@persona`.
Use a new task after updating.

## Development

The installable plugin lives in `plugins/persona/`. Run the dependency-free test
suite with:

```bash
node --test tests/persona/*.test.mjs
```

CI also checks JavaScript syntax, parses every product JSON file, verifies the
golden JSON and HTML artifacts byte for byte, scans for secrets, and rejects
tracked local reports.

## Feedback

Open a [GitHub issue](https://github.com/FullMetalResearcher/Persona-V2/issues)
and answer three questions:

1. Which objection was generic, unsupported, or wrong?
2. Did the recommendation change what you planned to build?
3. Was the final action practical this week?

## License

MIT
