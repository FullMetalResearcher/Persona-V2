# Persona Public Release Implementation Plan

Last updated: 2026-07-12

## Goal

Prepare Persona `v0.1.0` for a safe public GitHub release and prove that a new
Codex user can install, run, validate, and update it from the repository
marketplace.

The release is complete only when the repository is clean, the public history
contains no unintended private data, the plugin passes its quality and security
gates, and an anonymous installation succeeds from a fresh environment.

## How to Use This Plan

Execute phases sequentially. Complete every acceptance gate before moving to the
next phase. Preserve unrelated worktree changes and keep the GitHub repository
private through Phase 5.

This plan supplements `IMPLEMENTATION_PLAN.md`. The product contract and runtime
rules in that file and `AGENTS.md` remain authoritative.

## Current Baseline

Assessment performed on 2026-07-11 and 2026-07-12:

- GitHub repository `FullMetalResearcher/Persona-V2` is private.
- `origin/main` contains the obsolete prototype rather than the new plugin.
- The local `main` worktree contains a large uncommitted migration.
- Gitleaks found no secrets in Git history or the complete working directory.
- The Halton sampler is deterministic.
- Golden JSON and HTML regenerate byte-for-byte and pass `check-report.mjs`.
- Official Codex skill and plugin creator validators pass when PyYAML is supplied
  through an isolated temporary dependency path.
- Persona installs successfully from the local marketplace into a temporary
  `CODEX_HOME` as `persona@persona` version `0.1.0`.
- The current README marketplace commands match Codex CLI `0.144.1`.
- The HTML renderer can emit a clickable `javascript:` evidence URL before the
  later checker rejects the JSON.
- The custom checker accepts some JSON that violates the bundled schema,
  including unknown nested fields and non-string `input.links` items.
- Existing Git history exposes a personal email address.
- Archived documents contain machine-specific home-directory paths.
- Decision-quality, fresh-task installation, caller-repository output, remote
  update, and anonymous-install release gates are not yet complete.

## Non-Negotiable Constraints

- Keep `plugins/persona/` as the only runtime product source.
- Keep `.agents/plugins/marketplace.json` as distribution metadata.
- Do not commit generated `.agents/skills/` content.
- Keep generated reports ignored; `reports/` must contain only `.gitkeep`.
- Do not add package-manager scaffolding for the internal Node scripts.
- Use dependency-free Node code and built-in test facilities.
- Do not add services, databases, telemetry, analytics, or other v1 non-goals.
- Keep the repository root limited to `AGENTS.md`, `IMPLEMENTATION_PLAN.md`,
  `README.md`, and `LICENSE` as active documents.
- Keep GitHub private until all private-release gates pass.
- Request explicit approval before rewriting Git history, force-pushing, creating
  a public release, or changing repository visibility.

## Phase 1: Fix Release-Blocking Correctness Issues

### 1.1 Sanitize evidence URLs before rendering

Target:

- `plugins/persona/skills/persona/scripts/report-html-renderer.mjs`

Tasks:

- [x] Add one URL-normalization function used by every rendered link.
- [x] Permit only absolute `http:` and `https:` URLs.
- [x] Render missing or invalid URLs as escaped plain source text.
- [x] Ensure unsafe HTML is never written, even if the renderer is invoked
      without first running the checker.
- [x] Preserve current output for valid golden-report URLs.

Required regression cases:

- [x] `javascript:alert(document.domain)`
- [x] `data:text/html,...`
- [x] `file:///...`
- [x] mixed-case or whitespace-obfuscated unsafe schemes
- [x] quote, tag, and entity injection in source names and URLs
- [x] valid HTTP and HTTPS links

### 1.2 Align the checker with the bundled schema

Targets:

- `plugins/persona/skills/persona/scripts/check-report.mjs`
- `plugins/persona/skills/persona/schema/persona-report.schema.json`

Tasks:

- [x] Compare every schema object with the corresponding custom-checker branch.
- [x] Enforce `additionalProperties: false` for all nested objects.
- [x] Enforce item types and uniqueness for every array.
- [x] Validate every required property and enum.
- [x] Validate `input.links` item types and permitted URL behavior.
- [x] Validate IDs, ordering, and cross-references consistently.
- [x] Validate real calendar dates rather than only date-shaped strings.
- [x] Decide whether URL rules belong identically in the schema and checker, then
      keep both definitions synchronized.

### 1.3 Add dependency-free tests

Add Node test files beside the scripts, using `node:test` and `node:assert`.

Tasks:

- [x] Test valid `web-grounded`, `user-provided`, and `ungrounded` reports.
- [x] Test unsafe URL rejection and safe renderer output.
- [x] Test HTML escaping for every user/model-controlled field category.
- [x] Test unknown nested fields.
- [x] Test malformed arrays and wrong item types.
- [x] Test duplicate, missing, and unresolved evidence and position IDs.
- [x] Test invalid sampling coordinates and dimension values.
- [x] Test invalid verdict/confidence combinations.
- [x] Test the `Do not build` structural-failure gate.
- [x] Test sampler determinism and preservation of enriched position fields.

Acceptance gate:

```bash
node --test plugins/persona/skills/persona/scripts/*.test.mjs

node plugins/persona/skills/persona/scripts/halton-sampler.mjs \
  examples/golden-report.json --apply

node plugins/persona/skills/persona/scripts/report-html-renderer.mjs \
  examples/golden-report.json examples/golden-report.html

node plugins/persona/skills/persona/scripts/check-report.mjs \
  examples/golden-report.json examples/golden-report.html
```

Gate conditions:

- [x] All tests pass.
- [x] No unsafe scheme appears in generated HTML.
- [x] Every tested schema-invalid object fails the checker.
- [x] Golden artifacts remain deterministic.
- [x] `git diff --check` passes.

## Phase 2: Resolve Privacy and Repository Hygiene

### 2.1 Public identity decision

Recommended decision: use a GitHub `noreply` address and remove machine-specific
paths before publication.

- [x] Confirm whether the existing personal email may remain in public Git
      history. Decision: remove it.
- [x] Confirm whether the `guido` username may remain in archived documents.
      Decision: remove machine-specific identity paths.
- [x] Configure the approved Git author name and email for all new commits.

If the existing email must be removed:

- [x] Finish and commit the intended work before manipulating history.
- [x] Make a separate backup or clone.
- [x] Rewrite the author and committer email in an isolated clone.
- [x] Verify every rewritten commit and tag.
- [x] Request explicit approval before force-pushing the private repository.

### 2.2 Sanitize publishable content

- [x] Replace active machine-specific paths with `$HOME`, `<repo>`, or
      another portable form.
- [x] Review `docs/archive/` and sanitize or remove unnecessary machine paths.
- [x] Review legacy reports for customer, interview, proprietary, or personal
      data.
- [x] Review all URLs and source attributions in the golden and legacy reports.
- [x] Remove the local `.DS_Store`; keep it ignored.
- [x] Confirm no generated reports are staged.
- [x] Confirm `.agents/skills/` remains ignored and unstaged.

Acceptance gate:

```bash
gitleaks git --no-banner --redact --log-opts='--all'
gitleaks dir . --no-banner --redact

rg -n '/Users/<username>|<personal-email>' \
  AGENTS.md IMPLEMENTATION_PLAN.md README.md LICENSE docs plugins examples

git status --short --ignored
git diff --check
```

Gate conditions:

- [x] Both Gitleaks scans report no leaks.
- [x] Every remaining identity reference is explicitly approved.
- [x] Ignored generated tooling and reports are not staged.
- [x] No large or unexpected binary file is included.

## Phase 3: Complete Decision-Quality Evaluation

Run these recommendation cases:

1. `Test first`: relevant market evidence, no direct buyer commitment.
2. `Do not build`: an evidence-backed structural distribution, economics,
   legal, or behavior contradiction.
3. `Build`: a reachable user, costly repeated behavior, direct demand evidence,
   a credible switching reason, and a narrow first wedge.

For each case, run:

- one promotional founder framing
- one neutral framing containing the same material facts

Tasks:

- [x] Produce six JSON/HTML report pairs in a temporary evaluation directory.
- [x] Validate every pair.
- [x] Compare normalized ideas across each framing pair.
- [x] Compare recommendation values across each framing pair.
- [x] Compare material `Hard No` themes across each framing pair.
- [x] Confirm changing decisive evidence can change the recommendation.
- [x] Confirm positions cover distinct refusal conditions.
- [x] Confirm no report presents positions as votes, customers, probabilities,
      market shares, or representative research.
- [x] Confirm every report ends with one action, success threshold, and kill
      threshold.

Score every report from 1-5 on:

- objection specificity
- adversarial coverage diversity
- domain relevance of dimensions
- evidence traceability
- recommendation calibration
- reversal clarity
- mistake usefulness
- actionability
- concision

- [x] Record the prompts, results, scorecard, reviewer notes, and any revisions
      in `docs/release/v0.1.0-evaluation.md` or the release PR.
- [x] Revise the skill or renderer whenever any dimension scores below 4. No
      revision was required because no dimension scored below 4.
- [x] Re-run all affected cases after a revision. No cases were affected.

Acceptance gate:

- [x] All nine dimensions score at least 4/5 for every report.
- [x] Equivalent framing pairs produce the same recommendation value.
- [x] Material objections remain stable across equivalent framing pairs.
- [x] Decisive evidence changes can change the recommendation.
- [x] All six final report pairs pass the checker.

## Phase 4: Add Repeatable Release Validation

### 4.1 Add CI

Target:

- `.github/workflows/validate.yml`

Use pinned action versions. CI should:

- [x] Parse all JSON files used by the plugin and marketplace.
- [x] Run `node --check` on every runtime `.mjs` file.
- [x] Run dependency-free Node tests.
- [x] Verify sampler determinism.
- [x] Copy the golden report into a temporary directory.
- [x] Apply sampling, regenerate HTML, and validate the temporary pair.
- [x] Compare the regenerated files byte-for-byte with committed golden files.
- [x] Run Gitleaks using a pinned action or pinned binary.
- [x] Fail on whitespace errors or unexpected generated files where practical.

Do not vendor the Codex creator tools. Keep their validators as a documented
local release gate unless a stable official CI installation route is available.

### 4.2 Finish public documentation

Targets:

- `README.md`
- marketplace and plugin metadata as needed

Tasks:

- [x] State that Codex must expose the `codex plugin` command.
- [x] State that a working `node` executable is required.
- [x] Keep the shortest verified marketplace install flow prominent.
- [x] Keep update instructions aligned with the tested CLI flow.
- [x] Confirm the golden report and sample-input links resolve on GitHub.
- [x] Confirm the feedback route asks the three approved questions.
- [x] Avoid unverified claims about market validation, prediction, or outcomes.

### 4.3 Run official creator validators locally

Use an isolated temporary PyYAML dependency path when necessary. Do not add
Python packaging to the repository.

```bash
PYTHONDONTWRITEBYTECODE=1 \
PYTHONPATH=<temporary-pyyaml-path> \
python3 "$HOME/.codex/skills/.system/skill-creator/scripts/quick_validate.py" \
  plugins/persona/skills/persona

PYTHONDONTWRITEBYTECODE=1 \
PYTHONPATH=<temporary-pyyaml-path> \
python3 "$HOME/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py" \
  plugins/persona
```

Acceptance gate:

- [x] CI passes from a clean checkout.
- [x] Official skill validation passes.
- [x] Official plugin validation passes.
- [x] README prerequisites and commands match the tested environment.

## Phase 5: Commit and Test the Private Release Candidate

### 5.1 Create reviewable commits

- [x] Create a release branch such as `release/v0.1.0`.
- [x] Review every addition, modification, move, and deletion.
- [x] Confirm obsolete root-level runtime sources are intentionally removed.
- [x] Stage explicit paths rather than using `git add -A`.
- [x] Exclude `.agents/skills/`, `.DS_Store`, and generated reports.
- [x] Prefer logical commits:
  1. security and validator corrections
  2. plugin migration and obsolete-source removal
  3. documentation, examples, and privacy cleanup
  4. CI and release metadata
- [x] Run a pre-landing review against `origin/main`.

### 5.2 Test installation from the private GitHub remote

Use fresh temporary directories for `CODEX_HOME` and the caller repository.

- [x] Add `FullMetalResearcher/Persona-V2` as a Git marketplace.
- [x] Confirm the marketplace exposes `persona@persona` version `0.1.0`.
- [x] Install Persona into the temporary `CODEX_HOME`.
- [x] Start a fresh Codex task in the separate caller repository.
- [x] Invoke Persona with a non-golden input.
- [x] Confirm bundled schema and scripts resolve from the installed cache.
- [x] Confirm reports are written to the caller repository, not the plugin
      source or cache.
- [x] Validate the generated JSON/HTML pair.
- [x] Test marketplace upgrade after a private version change or controlled
      cache-buster.
- [x] Confirm a new task sees the updated plugin.

Acceptance gate:

- [x] Release-branch CI passes.
- [x] Private remote marketplace addition succeeds.
- [x] Private remote plugin installation succeeds.
- [x] Fresh-task invocation succeeds.
- [x] Output lands in the caller repository.
- [x] Upgrade succeeds and exposes the updated version.
- [x] `git status --short` is empty after all intended commits.

## Phase 6: Publish and Verify

### 6.1 Prepare GitHub metadata while private

- [ ] Merge the reviewed release branch into `main`.
- [ ] Confirm `main` CI passes.
- [ ] Confirm GitHub recognizes the MIT license.
- [ ] Set a concise repository description.
- [ ] Set relevant topics such as `codex`, `plugin`, `startup`, and
      `decision-making`.
- [ ] Set a homepage only if there is a real maintained destination.
- [ ] Confirm Issues are enabled.
- [ ] Confirm the README feedback link works.
- [ ] Create and push the `v0.1.0` tag.
- [ ] Draft a GitHub release with install instructions, product boundaries, and
      known limitations.

### 6.2 Visibility gate

Before making the repository public, report:

- final commit SHA
- final tag SHA
- CI result
- Gitleaks result
- official creator-validator results
- evaluation result
- private remote install/run/update result
- remaining accepted risks

- [ ] Obtain explicit approval to change repository visibility to public.
- [ ] Change visibility only after approval.

### 6.3 Anonymous public smoke test

- [ ] Clone the repository anonymously into a fresh temporary directory.
- [ ] Use a fresh temporary `CODEX_HOME`.
- [ ] Add the public GitHub marketplace using the README command.
- [ ] Install `persona@persona` using the README command.
- [ ] Run Persona from another fresh caller repository.
- [ ] Validate the produced JSON/HTML pair.
- [ ] Confirm README, golden report, sample inputs, license, and issue links work
      on public GitHub.
- [ ] Run a final Gitleaks history scan.
- [ ] Confirm the public tag contains exactly the reviewed release commit.

Acceptance gate:

- [ ] An anonymous user can follow the README successfully.
- [ ] The public installation produces a valid report in the caller repository.
- [ ] No private-only credential or local-path assumption is required.
- [ ] GitHub displays the expected description, license, tag, release, and
      feedback route.

## Final Definition of Done

Persona is ready to share publicly only when all statements below are true:

- [x] No unresolved critical security or validator finding remains.
- [x] Renderer output is safe for untrusted model/user strings and URLs.
- [x] The checker enforces the bundled JSON contract.
- [x] The worktree and index are clean.
- [x] CI passes from a clean checkout.
- [x] Official skill and plugin validators pass.
- [x] All six decision-quality evaluation reports pass.
- [x] Equivalent framings produce stable decisions.
- [x] Remote install, fresh invocation, output placement, and update are proven.
- [x] Public identity exposure is intentional.
- [x] Gitleaks reports no secrets in release history or content.
- [ ] GitHub metadata and feedback routing are complete.
- [ ] Anonymous clone and installation succeed.

## New Session Start Prompt

Start the next session with:

```text
Read AGENTS.md, IMPLEMENTATION_PLAN.md, and
docs/release/PUBLIC_RELEASE_IMPLEMENTATION_PLAN.md. Our goal is to prepare
Persona v0.1.0 for a safe public GitHub release. Execute Phase 1 only. Preserve
unrelated worktree changes, use dependency-free Node tests, run every Phase 1
acceptance gate, update the plan checkboxes for work actually completed, and
stop before Phase 2 with a concise status report.
```
