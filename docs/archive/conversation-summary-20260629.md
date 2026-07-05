# Persona Conversation Summary

Date: 2026-06-29
Workspace: `$HOME/Desktop/Persona`

## Setup

- Installed `gstack-codex` project and global packs with:
  - `npx gstack-codex init --project`
  - `npx gstack-codex init --global`
- Normal npm cache had permission issues, so the install was completed using a temporary cache at `/private/tmp/gstack-npm-cache`.
- Project setup updated:
  - `AGENTS.md`
  - `.agents/skills`
- Global setup updated:
  - `$HOME/.codex/AGENTS.md`
  - `$HOME/.agents/skills`

## Office Hours Direction

The `/office-hours` session reframed Persona from a standalone commercial app into an open source, agent-native tool.

The original Persona idea was:

> A cheap, honest "no" for product ideas before builders waste weeks building them.

The new constraint:

- A standalone commercial app may conflict with the user's new job.
- Open source contribution is safer and still useful.
- The Italian builder community, with 600+ people, is the first audience.

The chosen direction:

> Persona becomes an open source skill pack for Codex and Claude Code that helps builders pressure-test product ideas and save a short report.

## Core Positioning

Persona should not claim to predict the market.

Better framing:

> ChatGPT flatters your idea. Persona pressure-tests it.

Persona should produce:

- grounded market-facing objections
- deliberately diverse sampled perspectives
- hard nos
- objections to beat
- a next experiment
- a B&W visual sampling map

Persona should avoid:

- "market research" overclaims
- "simulated personalities" language
- verbose AI coaching
- decorative persona theater
- generic LLM praise such as "interesting idea"

## Key Product Principles

1. Simplicity is a founding principle.
2. The model should behave like an editor with a knife.
3. Structured output should come before prose.
4. Evidence should come before personas.
5. Grounding mode must be explicit:
   - `web-grounded`
   - `user-provided`
   - `ungrounded`
6. The report should be short, skeptical, useful, and actionable.

## Report Order

Approved report structure:

1. Product Snapshot
2. Verdict Metrics
3. Hard Nos
4. Persona Sampling Map
5. Persona Reactions
6. Objections To Beat
7. Next Experiment

The hard nos should appear early. If Persona hides the hard critique too deep in the report, it loses its edge.

## Chosen Package Shape

Three options were considered:

- A: Skill-only pack
- B: Skill pack plus tiny local renderer
- C: Full agent framework package

Chosen approach:

> B: Skill Pack + Tiny Local Renderer

Reason:

- Best learning-per-day for a six-day build.
- Keeps the project open source and local-first.
- Gives Persona a visual signature through a B&W persona sampling map.
- Avoids building a standalone app or premature framework.
- Teaches useful agent-product skills without drifting into infrastructure.

## Six-Day Build Plan

Day 1:

- Write the skill spec.
- Define report schema.
- Define persona dimensions.
- Create one golden sample report.

Day 2:

- Build the local B&W sampling map renderer.

Day 3:

- Create the Codex skill.
- Run it on 3 ideas.

Day 4:

- Create the Claude Code skill.
- Make output match Codex as closely as possible.

Day 5:

- Run 10 real ideas through Persona.
- Tighten harshness, brevity, and report order.

Day 6:

- Write README.
- Add examples.
- Draft launch article for X and the Italian builder group.

## Approved Design Doc

The approved office-hours design doc was saved at:

`$HOME/.gstack/projects/persona/guido-unknown-design-20260627-005603.md`

Status was changed to:

`APPROVED`

Recommended next gstack step:

> `/plan-eng-review`

Purpose:

- Turn the approved design into an engineering plan.
- Define file structure.
- Lock schema and renderer scope.
- Plan tests.
- Prepare release checklist.

## Official Resources Suggested

The learning resources were restricted to official OpenAI and Anthropic docs.

Primary docs:

- Codex Skills: https://developers.openai.com/codex/skills
- Claude Code Skills: https://code.claude.com/docs/en/skills
- Codex Plugins: https://developers.openai.com/codex/plugins/build
- Claude Code Plugins: https://code.claude.com/docs/en/plugins
- OpenAI Structured Outputs: https://developers.openai.com/api/docs/guides/structured-outputs
- OpenAI Prompt Engineering: https://developers.openai.com/api/docs/guides/prompt-engineering
- Claude Code Output Styles: https://code.claude.com/docs/en/output-styles
- Codex Subagents: https://developers.openai.com/codex/concepts/subagents
- Claude Code Subagents: https://code.claude.com/docs/en/sub-agents
- OpenAI Web Search Tool: https://developers.openai.com/api/docs/guides/tools-web-search
- Codex MCP: https://developers.openai.com/codex/mcp
- Claude Code MCP: https://code.claude.com/docs/en/mcp
- Codex AGENTS.md: https://developers.openai.com/codex/guides/agents-md
- Claude Code Memory / CLAUDE.md: https://code.claude.com/docs/en/memory
- Codex Hooks: https://developers.openai.com/codex/hooks
- Claude Code Hooks: https://code.claude.com/docs/en/hooks

## Flight Study Plan

The suggested long-flight goal was not passive reading.

The goal:

> Make Persona agent-native by design, not just a prompt wrapped in files.

Suggested flight outputs:

1. Persona Operating Model
   - what the skill does
   - what it refuses to claim
   - what inputs it needs
   - what files it saves

2. Report Schema
   - `grounding_mode`
   - `evidence_packet`
   - `personas`
   - `hard_nos`
   - `metrics`
   - `objections_to_beat`
   - `next_experiment`

3. Agent Flow Diagram
   - intake
   - evidence
   - sampling
   - critique
   - report
   - renderer

4. Golden Example
   - one realistic product idea
   - the ideal Persona output

Reading rule:

> After every doc section, write one sentence starting with: "For Persona, this means..."

Examples:

- For Persona, this means the renderer should not depend on model prose.
- For Persona, this means web grounding must be labeled.
- For Persona, this means subagents should create tension, but the final report should remove noise.
- For Persona, this means the skill description must say exactly when to invoke it.

## Strongest Takeaways

- Do not build a framework before proving the report is useful.
- Do not let the visual map become the product.
- Do not let "market reaction" become an overclaim.
- Do not let the LLM write long reports.
- Start with the golden report.
- Then build only the renderer and skill behavior needed to reproduce it.

