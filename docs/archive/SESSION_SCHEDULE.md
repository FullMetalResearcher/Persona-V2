# Persona Session Schedule

Last updated: 2026-06-30

Persona is an open-source, agent-native pressure-testing skill pack for startup and product ideas. The goal is to build the smallest excellent version first: a Codex skill, a Claude Code skill, a structured report, and a tiny local renderer for a black silhouette sampling map.

## Working Principles

- Build the report before the infrastructure.
- Default to `web-grounded` runs when browsing is available.
- Auto-detect the report language from the user's input.
- Keep stable product terms in English: `Hard No`, `Sobol sampling`, `web-grounded`, `user-provided`, `ungrounded`, `WOULD_PAY`, `NEEDS_PROOF`, `HARD_NO`.
- Use English slugs for filenames, regardless of report language.
- Support startup and product ideas first.
- Ask at most one or two clarification questions when the idea lacks a target user or concrete use case.
- Price is optional. If missing, treat it as an uncertainty, not a blocker.
- Ship one `standard` mode for v1.
- Distinguish `B2B`, `B2C`, and `marketplace/platform` before choosing sampling dimensions.
- Avoid claims that Persona predicts the market.

## Session Roadmap

| Session | Goal | Main Work | Output | Prep Resources |
| --- | --- | --- | --- | --- |
| 1 | Golden report | Pick one realistic startup/product idea and write the ideal Persona report by hand. Tune tone, length, report order, hard nos, and what the visual map must communicate. | `examples/golden-report.md` draft | OpenAI prompt engineering guide; current Persona notes |
| 2 | Product contract | Define exactly what Persona does, refuses to claim, asks from the user, and saves locally. Lock user input fields and clarification rules. | v1 product contract section for README or spec | Codex customization docs; AGENTS.md guidance |
| 3 | Structured schema | Design the structured intermediate artifact consumed by the Markdown report and map renderer. Include idea type, detected language, grounding mode, evidence packet, dimensions, personas, metrics, hard nos, objections, and next experiment. | `schema/persona-report.schema.json` or equivalent draft | OpenAI structured outputs guide |
| 4 | Sampling system | Define B2B, B2C, and marketplace/platform dimensions. Decide count of sampled perspectives for v1. My suggested default: 12. | Sampling spec with dimension tables and decision bucket rules | Subagents docs only if we decide to split reviewers; old Sobol prototype notes |
| 5 | Prompt and report engine | Write the core skill instructions that turn input plus evidence into structured data and a terse report. Tune for truth-seeking rather than theatrical harshness. | Draft Persona prompt/skill behavior | OpenAI prompt engineering guide; web search docs |
| 6 | Renderer prototype | Build tiny local renderer that reads structured persona data and outputs a black silhouette SVG map. Keep it functional and deterministic. | `renderer/` prototype plus sample SVG | Structured schema from Session 3 |
| 7 | Codex skill | Package the Codex skill so one invocation runs the workflow end to end: clarify, ground, sample, critique, render, save report. | `skills/codex/persona/SKILL.md` | Codex skills docs; Codex subagents docs if needed |
| 8 | Claude Code skill | Build the Claude Code skill with matching behavior and output shape. Avoid drift between Codex and Claude reports. | `skills/claude/persona/SKILL.md` | Claude Code skills docs |
| 9 | Real idea test batch | Run 5-10 real ideas through Persona. Record where output is too soft, too vague, too long, or insufficiently grounded. | Tightened prompt rules and 2-3 strong example reports | Web search docs; prompt engineering guide |
| 10 | Packaging | Write README, install instructions, examples, MIT license, and first release checklist. Decide whether to mention the origin story in launch material later. | README, examples, license, release checklist | Codex plugins docs only if plugin distribution becomes necessary |

## Recommended Build Order

1. Golden report
2. Product contract
3. Structured schema
4. Sampling system
5. Prompt and report engine
6. Renderer
7. Codex skill
8. Claude Code skill
9. Real idea testing
10. README and release packaging

## Component Map

| Component | Purpose | Build Timing | Notes |
| --- | --- | --- | --- |
| Product contract | Keeps scope clean and prevents old SaaS assumptions from returning. | First | Should live in README and skill instructions. |
| Structured schema | Makes the report and renderer consume the same truth. | Early | Prevents the model from drifting into long prose. |
| Evidence packet | Records what grounded the critique. | Early | Supports `web-grounded`, `user-provided`, and `ungrounded`. |
| Sampling dimensions | Forces deliberate spread across market positions. | Early | Must differ for B2B, B2C, and marketplace/platform. |
| Report writer | Produces the final short Markdown artifact. | Middle | Should be strict about length and section order. |
| SVG renderer | Produces black silhouette sampling map. | Middle | Should read structured data, not prose. |
| Codex skill | Main OpenAI-side distribution surface. | After report and renderer are stable | One invocation should run the whole workflow. |
| Claude Code skill | Anthropic-side distribution surface. | After Codex behavior is stable | Match Codex output as closely as possible. |
| Examples | Prove usefulness and teach usage. | Late, then iterate | User will add at least one README example. |
| README | Makes the project adoptable. | Late | Should be short and example-led. |

## Resource List

Use these as focused references, not homework. Read the relevant page only when that session needs it.

| Resource | Use It For | Link |
| --- | --- | --- |
| Codex Agent Skills | Designing and packaging the Codex skill. | https://developers.openai.com/codex/skills |
| Codex Customization | Understanding where durable behavior should live: skill, AGENTS.md, config, plugin, etc. | https://developers.openai.com/codex/concepts/customization |
| Codex Subagents | Deciding whether Persona should split research, critique, and synthesis into separate reviewers. | https://developers.openai.com/codex/concepts/subagents |
| Codex Plugins | Later distribution if a simple skill pack is not enough. Not needed for v1 unless install friction becomes the main problem. | https://developers.openai.com/codex/plugins/build |
| OpenAI Prompt Engineering | Writing the core Persona prompt: terse, skeptical, structured, and grounded. | https://developers.openai.com/api/docs/guides/prompt-engineering |
| OpenAI Structured Outputs | Designing strict structured data before Markdown and rendering. | https://developers.openai.com/api/docs/guides/structured-outputs |
| OpenAI Web Search | Designing `web-grounded` evidence gathering. | https://developers.openai.com/api/docs/guides/tools-web-search |
| OpenAI Tools | Understanding tool use patterns if the skill later becomes API-backed. | https://developers.openai.com/api/docs/guides/tools |
| Claude Code Skills | Building the Claude Code skill and matching Codex behavior. | https://code.claude.com/docs/en/skills |
| Claude Code Subagents | Optional later reference if Claude-side reviewer roles become useful. | https://code.claude.com/docs/en/sub-agents |

## Session Prep Checklist

Before each session:

- Decide the single artifact to finish.
- Avoid adding new files unless the artifact needs them.
- Keep the v1 path local-first and skill-pack shaped.
- Compare every idea against the question: does this make the report sharper?

After each session:

- Save the artifact.
- Note unresolved decisions in this file or the relevant spec.
- Run one small example if the artifact affects output.
- Remove or defer anything that smells like hosted-app infrastructure.

## Open Decisions

| Decision | Current Leaning | Decide By |
| --- | --- | --- |
| Number of sampled perspectives | 12 | Session 4 |
| Map layout | Black silhouette map, likely 2D/matrix hybrid | Session 6 |
| File layout | `skills/`, `renderer/`, `examples/`, `reports/`, maybe `schema/` | Session 3 |
| License | MIT | Session 10 |
| Final project name | `Persona` for now, still open | Before public release |
| Launch story | Decide later | Session 10 |

