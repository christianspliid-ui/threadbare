---
name: encounter-pipeline
description: Automated encounter pipeline v3 — the Encounter Factory line. Runs brief → draft → bounded critic loop → machine gates → live proof → batch report for composition-complete encounter delivery, one encounter or a batch of six. Triggers on "encounter pipeline", "draft encounter", "run encounter pipeline", "author encounter", "encounter batch", "run a batch", or "/encounter-pipeline".
model: opus
last_validated_against: 2026-08-17
---

> **Load before authoring:** `Docs/canon/rulebook-quick-reference.md` (always — the synthesis layer for rules of play). Load `Docs/canon/rulebook.md` (full rulebook) when the work touches a specific rule of play and you need depth, status flags, or source citations.
>
> **Load before drafting a single card:** [`reference/nudge-authoring-spec.md`](reference/nudge-authoring-spec.md) — the canonical authoring contract in the locked THR-883 format: the communication pivot (prose does the scene, cards do the rules), the scene-writer's 14-question checklist, setting envelopes, the 21-type card library, the prose rubric, and the verbatim detector spec. It is shared verbatim with `template-encounter-rewrite`; where this skill and that spec appear to disagree, **the spec wins**.

# Encounter Pipeline v3 — the Encounter Factory line

Automated encounter pipeline: brief → deployed, proved code. Each agent pass produces its own outputs — no manual orchestrator assembly between passes.

```
BRIEF ─▶ DRAFT ─▶ CRITIC LOOP ─▶ MACHINE GATES ─▶ LIVE PROOF ─▶ BATCH REVIEW
(plan)   (Fable)  (editorial+systems)  (npm run)     (headless)    (Christian samples)
```

## What v3 adds to v2, and what it leaves alone

v2's draft → editorial → systems → implementation chain **keeps its shape**; v3 is an
extension of the same line, not a replacement (plan §"Lineage"). It adds a brief stage
in front, bounds the critic loop, and puts two machines between the last agent and the
PR:

| Stage | v2 | v3 |
|---|---|---|
| 0 Brief | — | [`reference/batch-brief-format.md`](reference/batch-brief-format.md), agent-drafted, Christian-approved in chat (ruling 2) |
| 1 Draft | Pass 1 | unchanged, plus the Composition Contract as the draft's skeleton |
| 2 Critic loop | editorial → systems, retry once | **bounded at two loops, then park** (ruling 4) |
| 2b Package critic | — | [`agents/package-prompt.md`](agents/package-prompt.md) — judges prose + chips as **one package** (THR-1154) |
| 3 Machine gates | tests + build | `npm run check:encounter` — green is a precondition for a PR existing |
| 4 Live proof | — | `npm run check:encounter-live` — the declared blocks must *arrive* in a running world |
| 5 Batch review | — | `npm run encounter:batch-report` — six side by side, Christian samples two |

**The load-bearing idea is the Stage 3/4 split.** Stage 3 asks whether a template
*declares* its blocks; Stage 4 asks whether they *arrive*. A template can pass the
contract and deliver nothing — an `aftermathConfig` whose variants are unreachable
renders the fallback forever, a seed on an unreached band never plants. Both stages are
needed and neither substitutes for the other.

**Park, don't kill (ruling 4).** Two failed critic loops ends the loop, not the
encounter: the draft is committed to `Docs/plans/encounters/<slug>-parked.md` with the
critic's outstanding fix-list, and the batch report carries it as parked. An encounter
that survived two critics is worth salvaging by a human; the previous behaviour
(escalate and redraft) threw away the work and re-spent the tokens.

**No exemptions (ruling 3).** The Composition Contract is absolute. A shape that cannot
carry a block is a future encounter *type* with its own contract, not a waiver. The gate
hard-fails a missing block; the only escape is `RETROFIT_PENDING`, a ratchet that only
ever shrinks.

## The model this pipeline authors for (THR-772/774)

> **The god acts in the physics of the scene, never in the dramaturgy of the story.**

Encounters authored here ship **nudge-native**. The player is handed a hand of authored,
essence-priced **nudges** that shift the named odds; **fate rolls the outcome** on the
five-band ladder; prose pays the nudge off at *every* band, misfires included.

**The communication pivot (THR-883, locked 2026-07-30): prose does the scene, cards do
the rules.** The scene lives in the per-class openings, the setting-neutral spine, and
the outcome prose. A card face is generic and reusable — 2–4 word title, one plain
mechanical `effectLine` (what the god does and why that moves the odds), one short flavor
quote — cut from the 21-type card library. Zero scene-bespoke prose on a card face.

Choosing between authored futures for a mortal ("Forge the truth" / "Temper the
narrative") is the **rejected** model this replaced. A draft whose player-facing decision
is *what the mortal does* is not a revision note — it is the wrong encounter, and Pass 2
must reject it outright.

`authoredChoices` still renders for un-migrated templates (the stage branches on data
presence, so the rollout is per-template and reversible), but **new encounters do not
author it.** Conversion of the existing 28 is WS5.

## Scope

This pipeline produces **branching encounters** in `UnifiedActionTemplate` format — encounters with structural branches (`ActionStepBranch`) and full aftermath reaction suites. These go into `src/data/encounters/`. Their player-facing interaction is the nudge hand, not a choice menu.

For **linear template encounters** (guild, social, tavern, combat, borderland — single-step or multi-step without player-choice branches), use the `template-encounter-rewrite` skill instead. The migration to `UnifiedActionTemplate` is complete as of THR-108; `EncounterTemplate` no longer exists. Both encounter types now use the same unified format.

**Vault and documentation:** All encounter documentation lives in the Obsidian vault (`TheFantasyWorldSimulator/Systems/`). There are no Notion encounter pages; Notion content was migrated to Obsidian in April 2026.

## Step 0 — Read the Canon page first

Before any other reference material, read `Docs/canon/encounters.md`. It is the per-domain Step-0 entrypoint and points to the current spec, current rejected approaches, and current open questions. Everything below ("Systemic Wiring", "Game Design Direction Enforcement", etc.) is material the Canon page links to, and should be read after the Canon page, not instead of it.

If `Docs/canon/encounters.md` is missing or inaccessible, fall back to the pre-read list below and log the missing Canon page as a drift signal (open a `drift-scan`-labeled Linear issue per the canonical-documentation-strategy plan).

---

## Systemic Wiring — READ BEFORE AUTHORING

**Before running the pipeline, read `Docs/authoring-brief.md`** — the compiled preamble covering all 7 engine capabilities and the editorial rejection triggers. It is faster to read and more consistent than the full source. If `Docs/authoring-brief.md` is missing or `npm run check:authoring-brief` reports it stale, fall back to reading `Docs/plans/2026-04-16-systemic-wiring-guide.md` directly.

**Wounds and conditions in aftermath (THR-117):** To apply a physical or mental condition (wound, exhaustion, disease, blessing, …) in a `UnifiedActionTemplate` aftermath reaction, use the `condition_attachment` effect kind — not a legacy `content_grant` (which is not an aftermath effect kind) and not `appliesWound` (which is `EncounterTemplate`-only). Example: `{ kind: 'condition_attachment', templateId: 'trait.condition.wounded' }`. Applying the wound condition automatically triggers mid-encounter tier promotion from `background → shaping` (so the combat failure becomes visible in the chronicle) and feeds into the overflow pipeline (third wound → incapacitation check). You do not need to wire the overflow — it fires automatically. See the "Conditions and wounds" subsection of `Docs/plans/2026-04-16-systemic-wiring-guide.md` for all five subcategories and relevant constants.

**Exemplar encounters to study:** Read `Docs/exemplars.md` and study the top `Encounter` rows before drafting. This keeps exemplar promotion centralized and prevents skill-level drift.

## Game Design Direction Enforcement

**Before running the pipeline, read the issue's design doc in `Docs/plans/`.** If the design doc has Section 9 benchmark moments, inject them into the draft agent's prompt as the quality bar. Every encounter authored in this pipeline must meet or exceed the benchmark's emotional specificity and forward-hook quality.

**Inject the design direction principles into the draft agent's context.** The principles are compiled into `Docs/authoring-brief.md` (Section C). Prefer the brief; fall back to `Docs/plans/2026-04-16-game-design-direction.md` when the brief is absent.

**Player-as-god framing constraint.** The player is a god who observes through threads and intervenes indirectly. They NEVER make choices for the character. Every player-facing option is a **nudge** — a concrete, sphere-flavoured change to the physics of the scene (a stumble at the right moment, a spark of light in a dark room, a surge of strength on a climb), never an instruction to the mortal (say this, go there, fight) and never a choice between authored endings. The mortal acts according to their personality and the god's influence. Playing nothing must always be viable: a hand is an offer, not a toll gate.

**The editorial agent must check against these principles.** If a draft has structurally correct encounters but emotionally inert prose — if failure is just "you failed" with a number change, if the hand has an obvious dominant card, if the player wouldn't care about the outcome — the editorial agent should REVISE, not PASS. **Additionally, any encounter where the player "chooses how the character responds" must be rejected and reframed as a nudge hand.**

**Register enforcement (plainspoken Malazan, THR-609).** The editorial agent must also check register, per the spec's *Register assignment per authored field* table. **Baseline is the default:** step narration, `fiction` bodies, band base text, and aftermath overviews are plain, concrete, one idea per sentence, dry wit over ornament — no archaic diction, no stacked metaphor, no word that sends a reader to a dictionary. **Card names, `effectLine`s, factor lines and purpose lines are interactive text — always plain** (no metaphor, no ambiguity about what the click does). The **only** place sustained lyricism is earned is a declared **peak** surface: the final step's band prose, the fate-reveal line, and major aftermath beats — and even there, one figurative image per paragraph. A draft that reaches for lyricism in ordinary narration should REVISE. Declare non-default fields with the additive `register?: 'baseline' | 'character' | 'peak'` field (absent → baseline). Canon: [`Docs/canon/prose.md` § the register model](../../../Docs/canon/prose.md); deterministic floor: `registerCompliance` in `window.__DEBUG.proseQualityReport()`.

## Quality Exemplar

**The golden exemplar is `src/data/__fixtures__/nudge-exemplar/swollen-ford-exemplar.ts`** — The Swollen Ford, authored end-to-end against the locked THR-883 format, with every rule visible once. Read it before drafting. It is registered in no pool; it exists to be copied. `nudgeModel.test.ts` § *golden exemplar* asserts the checklist against it, so the exemplar and the spec cannot drift apart silently.

Every encounter must meet its bar:

- A declared setting envelope with one scene-built opening per class, and a setting-neutral spine — the scene-writer's 14 questions answered in writing
- Threads discovered inside the prose, not in a separate menu
- A **4–8 card authored hand on every nudge-bearing step** (dealt 4–6 after filters), spanning ≥4 spheres, with ≥1 ungated common option, no two cards answering the same question
- Generic card faces ("Steady Breath", not "Steady the hands against the vault lock") — the scene grounds the card, the face never carries the scene
- Effect lines that state mechanism: what the god does and why that moves the odds
- **Every card pays off in failure** — at least one failure-band fragment per nudge, both failure bands for a big-delta card
- Aftermath with reflective prose, actor-centered consequences, and reaction choices (medium+)
- **Cool failure at every band** — the failure path must be as narratively interesting as the success path. If the failure outcome reads like punishment, it's not done.
- **Human conditions, not mechanical labels** — aftermath prose describes what the protagonist *feels* and *becomes*, not what numbers changed

If a draft reads like a functional template with structural bones but no experiential depth, the editorial agent will reject it.

## Invocation

The user provides:
- **scale** (short / medium / long) — required
- **premise** — a sentence or two
- **optional constraints** — faction, location, branching template, tone

```
/encounter-pipeline short about a ferryman who charges souls instead of coin
/encounter-pipeline medium about a plague ship quarantine at a port city
/encounter-pipeline long about a contested divine relic emerging from a collapsed shrine
```

**Modes:**
- Default → full line (all stages), encounter deployed to code and proved live
- `draft` → Stage 1 only
- `design` → Stages 1–2 only (no implementation)
- `batch` → **the factory run** (THR-1047): Stage 0 brief → the whole line over N encounters → batch report

### Batch mode

```
/encounter-pipeline batch --brief Docs/plans/encounters/<slug>-brief.md
```

Batch size is **6** (ruling 1) — the number at which variance is visible in one view,
which is what Christian reviews for. The brief is drafted first and **approved in chat
before the batch runs** (ruling 2); an unapproved brief is not a batch, it is a
suggestion. Encounters are drafted in sequence, not in parallel: the critic loop for
encounter *n* reads what the batch has already produced, which is how the batch avoids
authoring the same hand six times.

## Slug Generation

Derive a kebab-case slug from the premise:
- "plague ship quarantine" → `plague-ship-quarantine`
- "tax collector's dilemma" → `tax-collector-dilemma`

All output files go to `Docs/plans/encounters/<slug>-<pass>.md`.

---

## Orchestration Protocol

The orchestrator (this skill) follows this state machine. No manual file editing, no assembly, no text surgery.

### Step 0: Canon-First Pre-Read

Before dispatching any agent, the orchestrator reads `Docs/canon/encounters.md` first. This Canon page is the Step 0 entrypoint for encounter authoring and establishes the current format, rejected approaches, and active-plan pointers.

Then the orchestrator reads the files the Canon page links to and injects them as context into agent prompts:

0. [`reference/nudge-authoring-spec.md`](reference/nudge-authoring-spec.md) — **mandatory**, the authoring contract every card is written against.
0b. `src/data/__fixtures__/nudge-exemplar/swollen-ford-exemplar.ts` — the worked example. Read it, do not re-derive it.
0c. `public/nudge-cards-reference.html` — the 21-type card library and pip vocabulary the hand is cut from.
0d. [`reference/anchor-catalog.generated.md`](reference/anchor-catalog.generated.md) — **mandatory**, every legal anchor a consequence chip may point at, how it is declared, and which surface shows it. Generated from the live type unions. Inject it into the draft prompt as well as the critics': a chip's referent is chosen while the prose is being written, and an author who has not seen this list writes toward fiction and gets the chip folded three stages later.
1. `Docs/authoring-brief.md` — compiled capability + principle preamble (preferred). If missing or stale, fall back: read `Docs/plans/2026-04-16-systemic-wiring-guide.md` and `Docs/plans/2026-04-16-game-design-direction.md` instead.
2. `Docs/encounter-building-checklist.md` — structural packet template. **Its per-step "approach card" sections describe the pre-nudge model**; where it conflicts with the spec above, the spec wins.
3. `Docs/encounter-branching-templates.md`
3. Obsidian vault pages via MCP:
   - `TheFantasyWorldSimulator/Systems/Thematic Pillars.md`
   - `TheFantasyWorldSimulator/Systems/Anti-Patterns.md`
   - `TheFantasyWorldSimulator/Systems/Content Creator Cheat Sheet.md`
   - At least one relevant archetype: `Character Archetypes.md`, `Ordeal Archetypes.md`, `Event Archetypes.md`, etc.

If Obsidian MCP is unavailable, note it and proceed. The draft agent should not need to read these files itself.

### Step 0a: Roll the Plot-Hook Draw (THR-1147)

Roll the premise **before** writing the brief — the hook is what the brief is about, so a
brief written first has nothing left to roll for:

```
npm run draw:hooks -- <briefSlug> --reach <reach>
```

It offers three story seeds from the project's inspiration corpus (Obsidian `Archetypes/`,
the four recoverable numbered hooks, unshipped drafts), each with themes, source and drawn
weight. **Take one as the starting point, or blend two**, write the premise from it, and
record both lines in the brief:

```
plotHookRolled: hook.trial_by_combat, hook.scarcity_crisis, hook.unsafe_crossing
plotHookTaken:  hook.trial_by_combat
```

**The hook is a starting point, not a contract**, and this is where it differs from Step 0b:
the consequence hand is binding and gate-checked, the hook is neither. Nothing compares the
finished encounter to the hook, because nothing machine-readable could. Drift is expected.
Recording the roll is not optional — it is what makes hook coverage measurable across
batches, and coverage is the only thing that makes the table worth having.

**Stamp `usedBy` at closeout.** When the encounter ships, add its template id to the hook you
took in `src/data/content-eval/plotHooks.ts`. That is what damps the hook's weight
(`PLOT_HOOK_REUSE_DAMPING`, 0.45 per use) so the corpus keeps reaching for unused ones. The
hook leaves no trace on the finished template by design, so nothing can stamp this for you —
an unstamped hook stays likelier than it deserves indefinitely. `npm run draw:hooks --
--coverage` reports what has been spent.

In batch mode, roll all six briefs before writing any of them, and check the spread: six
hooks sharing a theme is worth re-rolling a brief for, and it is much cheaper to notice here
than in the batch report.

### Step 0b: Roll the Consequence Draw (THR-1145)

Before dispatching the draft, roll each encounter's consequence hand and carry it into the
brief:

```
npm run draw:consequences -- <templateId> --reach <reach> --rarity <n>
```

The template does not exist yet, so `--reach` is required — pass the reach the brief
assigns. The hand is two families (three at rarity ≥ 3) the encounter **must wire in
context**, drawn from a reach-weighted table; the command prints the concrete effect kinds
that satisfy each. Inject the hand into the draft agent's prompt alongside the premise, and
record it in the brief so the batch report can show what each encounter was asked for.

**Why the roll is upstream of the draft rather than a choice inside it.** Told to "draw
from the whole palette", every author reaches for the same three primitives — the
convergence the palette census measured. Rolling first makes the variety structural
instead of aspirational. The draw's rules, the family table, and the one-swap valve are in
[`reference/nudge-authoring-spec.md`](reference/nudge-authoring-spec.md) § The Consequence
Draw; the draft agent authors against that section, and `check:encounter` recomputes the
hand from the template id at Step 3, so a hand cannot be quietly rewritten downstream.

In batch mode, roll all six before dispatching any of them — the spread of families across
the batch is part of what the batch report shows Christian, and a hand that lands six
`possession` draws is worth noticing before six encounters are written.

### Step 1: Dispatch Pass 1 (Draft)

Dispatch sub-agent with `agents/draft-prompt.md`, model `opus`.
Inject: scale, premise, constraints, pre-read reference material, **the plot hook taken at
Step 0a**, and **the encounter's consequence hand from Step 0b**.
Agent writes: `<slug>-draft.md`

### Step 2: Dispatch Pass 2 (Editorial + Revision)

Dispatch sub-agent with `agents/editorial-prompt.md`, model `opus`.
Agent writes: `<slug>-editorial.md` AND `<slug>-revised.md`

**Check verdict in agent output:**
- `PASS` or `PASS WITH REVISIONS` → the agent produced both files. Proceed to Step 3.
- `REVISE BEFORE CONTINUING` → the agent produced only the editorial file (no revised file).

**On REVISE — auto-retry once:**
1. Re-dispatch the draft agent with the editorial feedback appended to the prompt: "The editorial agent returned REVISE BEFORE CONTINUING. Address these issues: [editorial feedback]"
2. Re-dispatch the editorial agent on the new draft.
3. If the second editorial also returns REVISE → **stop the pipeline** and tell the user.

### Step 3: Dispatch Pass 3 (Systems + Final Merge)

Dispatch sub-agent with `agents/systems-prompt.md`, model `sonnet`.
Agent writes: `<slug>-systems.md` AND `<slug>-final.md`

**Check verdict in agent output:**
- `READY FOR IMPLEMENTATION` or `READY WITH CAVEATS` → proceed to Step 4.
- `BLOCKED` → **stop the pipeline** and tell the user. The final file is produced but marked BLOCKED.

### Step 2b: Bound the critic loop (ruling 4 — park, don't kill)

The editorial and systems passes are **two independent critics over the same draft**, and
the loop around them is bounded at **two** iterations. Count loops, not passes: one loop
is editorial + systems + a revision.

- **Loop 1 clean** (editorial `PASS`/`PASS WITH REVISIONS` and systems `READY`/`READY WITH CAVEATS`) → Stage 3.
- **Loop 1 dirty** → revise, run loop 2.
- **Loop 2 still dirty** → **park**. Write `Docs/plans/encounters/<slug>-parked.md` containing the latest draft *plus* both critics' outstanding fix-lists, mark the encounter `parked` in the batch report, and continue the batch. Do not redraft, do not delete, do not silently drop it from the batch.

Parking rather than killing is deliberate: an encounter that survived two critics carries
real authored prose, and the failure is usually one block a human can settle in a minute.
Redrafting throws that away and re-spends the tokens on the same wall.

### Step 3a: Dispatch Pass 3b (Package critic) — THR-1154

Dispatch sub-agent with `agents/package-prompt.md`, model `opus`.
Agent writes: `<slug>-package.md`

**Why a third critic, and why it runs on the composed whole.** Editorial judges prose.
Systems judges whether declared ids resolve *against the code*. Neither can see the
question the director actually reviews — whether the prose was written *toward* its
chips, and whether the chips connect the encounter to the world. His frame, 2026-08-17:
*"they fit together into one player experience and so can't be evaluated individually …
if that doesnt work the encounter is just a solitary isolated story."*

The Unsafe Bridge is the proof the stage was missing: it passed the editorial critic, the
systems critic, **and** the Law 56 backing gate, and shipped a dead chip anyway. Every
stage was individually satisfied.

The pass has two halves. **Half A** is mechanical and shared with THR-1153's
anchor-resolution gate — every chip's referent must be a member of
`reference/anchor-catalog.generated.md` and the prose must name that particular object.
**Half B** is the judgment no machine makes: *what does this encounter leave behind that
a later encounter or system can pick up, and would the player recognise it happening?*

**Check the verdict line:**
- `PACKAGE PASS` → proceed to Step 3.
- `PACKAGE FIX` → apply the fold/bind list, then re-run this pass. This does **not**
  consume a critic loop — Half A is a mechanical defect list, not a quality disagreement.
- `PACKAGE PARK` → the encounter is `solitary`. Park it (ruling 4) and continue the
  batch. Do not redraft: an encounter that reached this stage carries real authored
  prose, and "connects to nothing" is a brief-level problem, not a drafting one.

**One trap, and it is the expensive one.** Half A must not fold a chip merely because its
anchor cannot be clicked. Only four kinds route a click; locations, cultures, regions,
bonds and traits are all lawful `named` anchors. A critic that treats unclickable as
unanchored would strip most legitimate consequences out of the corpus.

### Step 3: Machine gates

```bash
npm run check:encounter -- <templateId>
```

**Green is a precondition for a PR existing.** No exemption mechanism (ruling 3) — a
missing block is a hard fail whose message names the block and the plan section. If the
template is a not-yet-retrofitted legacy encounter it may sit on the `RETROFIT_PENDING`
ratchet; the ratchet only ever shrinks, and deleting a name from it is the retrofit's
proof.

### Step 4: Live proof

```bash
npm run check:encounter-live -- <templateId>
```

Spawns the encounter on the ascendant in a seeded world, commits a hand, ticks to
resolution, and reads the running state for what the template promised — cast bound,
reward landed, seed planted, a keyed aftermath variant rather than the fallback, concepts
on every change.

**Read the verdict, not the exit code.** Three verdicts:

| Verdict | Meaning |
|---|---|
| `proved` | every declared claim arrived |
| `failed` | a declared block did not arrive — fix before the PR |
| `vacuous` | ran clean and **proved nothing**: the template declares no cast, reward, seed, condition or reachable variant, so every claim was skipped |

`vacuous` does not fail the command — refusing a template that declares too little is
Stage 3's job, and failing it here would report one defect twice. But a batch of vacuous
encounters is a batch that proved nothing, so the batch report counts them on their own
line. Treat `vacuous` as unproved, never as a pass.

**A template not in `UNIFIED_ACTION_TEMPLATES` cannot be proved.** The engine resolves
templates by registry lookup, so an unregistered one stages fine and then never advances
a step. The sweep detects this up front and says so — register it before Stage 4, or
prove a registered sibling. This is why the golden exemplar (registered in no pool) is a
Stage 3 artifact only.

### Step 4b: Dispatch Pass 4 (Implementation)

Dispatch sub-agent with `agents/implementation-prompt.md`, model `sonnet`.
Agent creates: `src/data/encounters/<slug>.ts`, `src/data/encounters/__tests__/<slug>.test.ts`
Agent modifies: `src/data/unified-action-templates.ts`
Agent generates: concept art (if design doc has art direction)
Agent runs: `npm test`, `npm run check:typecheck`, `npx vite build`

> **Never `npx tsc --noEmit`** — the root `tsconfig.json` sets `files: []`, so it exits 0
> unconditionally no matter how broken the code is, and citing that exit 0 as evidence is
> gate theater (THR-686). `npm run check:typecheck` is the identical ratchet CI runs.

**On completion:** commit and push. Report to user.

### Step 5: Batch review

```bash
npm run encounter:batch-report -- <id1> <id2> … --brief Docs/plans/encounters/<slug>-brief.md
```

Renders the batch **side by side** (ruling 1): one row per encounter carrying gate
verdict, live verdict, **package verdict**, resolved outcome, systems connected, band
count, and two review links. The per-encounter detail comes after the table, not before —
a report that led with six dossiers would be six reviews rather than one batch review.

The **Package** column and the *What each encounter leaves behind* table are read from
each `<slug>-package.md` (THR-1154), so package quality is a column in the director's
sample review rather than nobody's. A batch that never ran Pass 3b renders `— not run`
and says so in the section body: unjudged, which is not the same as passing.

The report **runs neither check itself** — it renders their JSON. That is what keeps it
from disagreeing with CI, which is the most expensive disagreement available here
because it surfaces after the director has already approved the batch.

Then Stage 5's human half: post a **plain-language chat summary** naming the two sampled
encounters, each with its clickable link (Rule Zero), and ask one question. Christian
never reviews all six — the gates hold the floor, he holds the ceiling. His verdict feeds
the next brief.

### Step 6: Done

Tell the user: encounter deployed and proved. Provide the review link
(`?view=game&seeded&size=medium&spawn=<template-id>`) — not the CLI command; per Rule
Zero every reference he sees is something he can click.

---

## Pipeline Passes (Detail)

### Pass 1: Draft

**Model:** `opus` — prose quality is the primary output
**Writes:** `<slug>-draft.md`

The draft agent produces a complete encounter packet by walking the **8-step checklist**
in [`reference/nudge-authoring-spec.md`](reference/nudge-authoring-spec.md) in order:

1. **Envelope + vignette** — setting envelope declared; one opening per class + setting-neutral spine, written under the 14-question scene-writer's checklist; motive hooks, quintessence stakes, and scene tag declared; premise started from the Step 0a plot hook (drift away from it is fine — an unrecorded roll is not)
2. **Test panel data** — per step: reach(es) + ≤4-word purpose line, difficulty, 2–4 factor lines each naming its source
3. **The hand** — 4–8 `StepNudge`s per nudge-bearing step cut from the 21-type library: generic faces, mechanism-stating effect lines, ≥4 spheres, ≥1 ungated common option, ≤1 rider per hand, trait-only cards at cost 0, zero-essence cards priced on another channel, grants naming only built content
4. **Band prose** — all six `StepOutcome`s covered; every nudge ≥1 failure-band fragment; big-delta cards cover both failure bands
5. **Trait hooks** — all four questions answered explicitly (gate / variant / trait-only nudge / trait fragment); live refs only
6. **Aftermath** — prizes, tolls, seeds as object references; tolls in words; **every family in the Step 0b consequence hand wired in context**, recorded in `consequenceDraw` (one recorded `consequenceSwap` allowed)
7. **Images** — one generic image tag per library card + scene tag; genericity test documented
8. **Evidence** — register scorer + detectors clean; 14-question answers recorded in the file doc comment

Plus: all structural sections (inspiration anchors, pressure knot, cast, beat structure,
branching profile, outcome ladder, support bundle, self-audit), a sample opening
paragraph (continuous prose, fiction-grade), one branch-dependent later paragraph per
branch, an aftermath paragraph, concept art direction, and the Experience Differentiator
Gate (14 YES/NO).

### Pass 2: Editorial + Revision

**Model:** `opus` — must catch prose weakness and enforce quality gates
**Writes:** `<slug>-editorial.md` + `<slug>-revised.md`

The editorial agent:
1. Reviews prose quality, branch seduction, scale discipline, inspiration honesty, aftermath payoff, dilemma energy
2. Runs the Experience Differentiator Gate (14 questions)
3. Issues a verdict
4. **If PASS or PASS WITH REVISIONS:** produces the revised file directly with all edits applied inline. No manifest. No orchestrator text surgery.
5. **If REVISE BEFORE CONTINUING:** produces only the editorial file. Pipeline auto-retries once.

**Automatic REVISE triggers** (non-negotiable):
1. No approach prose
2. Generic god-verbs
3. No thread integration
4. Missing aftermath reaction choices (medium+)
5. Reporter prose
6. No concept art recommendation
7. **A hand outside 4–8 authored cards on a nudge-bearing step**
8. **Fewer than 4 distinct spheres, or no ungated common (sphere-less) option, in a hand**
9. **Any nudge with no failure-band fragment** — or a big-delta nudge (`forecastDelta ≥ 0.15`) missing either failure band
10. **A `StepOutcome` band no fragment in the hand covers**
11. **A number or `%` in an `effectLine`** — words only; the pip row renders magnitude
12. **Trait-hook step skipped**, or a hook naming a ref `validateTraitRefs()` reports dead
13. **A nudge-specific payoff written into the base band text** — it must read correctly with any subset of the hand active
14. **A player-facing option that instructs the mortal** rather than changing the physics of the scene — the rejected authored-futures model
15. **Any detector hit**: a vagueness-lexicon word, or more than one annotation clause across the encounter
16. **Scene-bespoke prose on a card face** — a title, effect line, or flavor quote that only reads in this encounter (the communication pivot: prose does the scene, cards do the rules)
17. **An effect line that states mood instead of mechanism** — it must say what the god does and why that moves the odds
18. **No setting envelope, or a declared class with no opening** — or a spine/afterimage that names class scenery
19. **Two rider cards in one hand**, or a rider with no justifying comment
20. **A zero-essence non-trait card with no other cost channel**, or a grant naming content that does not exist (`validateNudgeGrantRefs`)
21. **Two encounters in the same family with an identical card-type composition**
22. **A seam echo** — a repeated image, repeated sentence shape, or near-identical phrasing across a paragraph boundary (the class the automated detectors cannot see; check every opening→spine and spine→band seam explicitly)
23. **A static authored factor line** — any `factorLines` entry that would read identically on every run of the encounter (the variance rule: factors come from the broader game context — agent, hex, global modifiers, earlier steps — all derived; scene facts are priced into the difficulty and live in the prose)
24. **The agent as bystander** — a set-piece scene the acting agent merely watches, without the design block's written justification; the default shape is the opportunity/complication/danger landing on the agent or in their path
25. **Announced outcome mechanics in scene prose** — explicit "pass and X / fail and Y" framing; stakes are foreshadowed in the scene's furniture, outcomes live in afterimages and band prose
26. **A design-block breach** — a declared mechanic or object the prose never uses, a step whose prose does not test its declared reach, a mortal choice with no named value axis, or a promise (mystery, hook) with no designed payoff
27. **A title that fails the glance test** — a player reading only the title cannot say what the complication or objective is ("The Broken Wheel" passes; "The Held Commission" does not)
28. **A missing or verbose crux** — the design block does not open with the one plain-grammar sentence stating the complication from the agent's point of view, or needs a paragraph to say it
29. **Unreadable compression** — a sentence that needs two readings, a paragraph carrying a larger story than its word count can hold, or clue information front-loaded in the opening that the shape puts behind an investigation gate (rule zero: game prose, not novel prose — clarity beats compression, dialogue welcome)
30. **A shape invented on the fly** — the encounter does not name its shape from the catalog, or its step structure contradicts the shape it names
31. **Invented game state in base prose** — a relationship, debt, prior visit, or standing between the agent and the world asserted in scene prose with no backing state read (prose rule 7: consume state through a gate or placeholder, produce it through grants/aftermath, never declare it in narration)

### Pass 3: Systems Audit + Final Merge

**Model:** `sonnet` — code/systems analysis, not prose judgment
**Writes:** `<slug>-systems.md` + `<slug>-final.md`

The systems agent:
1. Audits support bundle honesty, missing primitives, runtime feasibility, aftermath supportability
2. Lists new hooks needed with scope estimates
3. Produces implementation file map
4. Issues a verdict (READY / READY WITH CAVEATS / BLOCKED)
5. **Produces the final merged document** with pipeline summary + full encounter packet from the revised file

### Pass 4: Implementation

**Model:** `sonnet` — code translation of already-authored prose
**Creates:** `src/data/encounters/<slug>.ts`, tests, concept art
**Modifies:** `src/data/unified-action-templates.ts`

The implementation agent:
1. Creates the encounter template file (prose copied verbatim from final doc)
2. Registers it in the unified action template array
3. Writes structural tests
4. Generates concept art (if art direction present)
5. Runs verification: tsc + tests + build
6. Commits and pushes

**Prose fidelity rule:** Sonnet copies prose verbatim. It does not rewrite Opus's work.

---

## Re-running Individual Passes

- `/encounter-pipeline draft <slug>` — re-run draft only
- `/encounter-pipeline editorial <slug>` — re-run editorial+revision (reads existing draft)
- `/encounter-pipeline systems <slug>` — re-run systems+merge (reads existing revised)
- `/encounter-pipeline implement <slug>` — re-run implementation (reads existing final)

## Scale Enforcement

- `short`: 1-2 beats, 0 or 2 branches, compact aftermath
- `medium`: 2-3 beats, 0, 2, or 3 branches, curated aftermath
- `long`: 3-5 beats, 2-3 branches, full aftermath + reaction choices

Branch count 1 is invalid. Encounters are linear (0) or branching (2-3).

## Branch Count Enforcement

- 3 is a ceiling, not a target
- 2 strong branches > 3 weak branches
- The editorial agent must evaluate whether each branch earns its place

## Model Assignment

| Pass | Model | Why |
|------|-------|-----|
| 1: Draft | **Opus** | Prose quality is the primary output |
| 2: Editorial + Revision | **Opus** | Must catch prose weakness, enforce quality gates, apply its own edits |
| 3: Systems + Final Merge | **Sonnet** | Code/systems analysis + mechanical assembly |
| 3b: Package | **Opus** | Half A is mechanical, but Half B is the qualitative judgment the director reviews — "would the player recognise it happening?" is not a Sonnet question |
| 4: Implementation | **Sonnet** | Code translation of already-authored prose |

Opus where creative judgment matters. Sonnet where code/systems matters. 2 of 5 passes use the cheaper model.

## File Dependencies

```
Stage 0 (Brief) ──→ Docs/plans/encounters/<slug>-brief.md
    │                (agent-drafted; Christian-approved in chat before the batch runs)
    ▼
Reference material (pre-read by orchestrator)
    │
    ▼
Pass 1 (Draft, Opus) ──→ <slug>-draft.md
    │
    ▼
Pass 2 (Editorial+Revision, Opus) ──→ <slug>-editorial.md + <slug>-revised.md
    │
    ├── REVISE? → auto-retry once → still REVISE? → STOP
    │
    ▼
Pass 3 (Systems+Merge, Sonnet) ──→ <slug>-systems.md + <slug>-final.md
    │
    ├── BLOCKED? → STOP (final file marked BLOCKED)
    │
    ▼
Pass 3b (Package, Opus) ──────→ <slug>-package.md
    │                            templateId / packageVerdict / packageLeaves
    │
    ├── PACKAGE FIX?  → apply the fold/bind list, re-run 3b
    ├── PACKAGE PARK? → <slug>-parked.md, continue the batch (ruling 4)
    │
    ▼
Pass 4 (Implementation, Sonnet) ──→ src/data/encounters/<slug>.ts
                                     src/data/encounters/__tests__/<slug>.test.ts
                                     public/concept-art/encounters/<slug>.jpg
                                     src/data/unified-action-templates.ts (modified)
    │
    ▼
Stage 3 (Machine gates) ──→ npm run check:encounter -- <id>          [green = PR may exist]
    │
    ▼
Stage 4 (Live proof) ─────→ npm run check:encounter-live -- <id>     [proved / failed / vacuous]
    │
    ▼
Stage 5 (Batch report) ───→ npm run encounter:batch-report -- <ids…> --brief <path>
    │                        Docs/plans/encounters/batch-report-<date>.md
    ▼
Commit + Push → Vercel auto-deploys → Christian samples 2 in chat
```

**Parked encounters** leave the line at Step 2b and land at
`Docs/plans/encounters/<slug>-parked.md`, carrying both critics' outstanding fix-lists.
They stay in the batch report, marked parked — a parked encounter is work awaiting a
human, not work discarded.
