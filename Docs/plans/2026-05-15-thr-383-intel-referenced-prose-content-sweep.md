# THR-383 — Template-walk content sweep for `intel_referenced_prose`

**Linear issue:** THR-383
**Project:** Encounter Format Migration (Urgent, Now)
**Parent:** THR-139 (`intel_referenced_prose` aftermath variant — Done, shipped 2026-05-08). This issue is Deferral #1 from THR-139's §Deferrals.
**Effort size:** M (pure content authoring; no engine/UI code; judgment-heavy because "should this reaction reference intel?" is a per-reaction call).
**Audience:** Claude Code — `model:opus-4-6` lane (matches the Encounter Format Migration content workstream; prose authoring + integration judgment).

---

## Problem

THR-139 shipped the *engine surface* for `intel_referenced_prose` — a content-driven aftermath reaction effect that appends a chronicle-visible "the intel paid off" line when an actor holds an intelligence record matching the encounter context. It shipped the dispatcher, two helpers, four constants, the trace discriminator, a 72-line reusable prose pack (`src/data/intelligence-referenced-prose.ts`), and **3 pilot reactions**:

| Pilot file | Category wired |
|---|---|
| `src/data/arcane-circle-encounter-content.ts` | `agent_network` |
| `src/data/builders-fellowship-encounter-content.ts` | `political_secret` |
| `src/data/encounter-anomaly-content.ts` | `cultural_knowledge` |

That is the entire current footprint: **3 reactions out of the whole encounter catalog reference intel.** From the player's seat, the intel-consumption loop is still almost invisible — it only closes in three hand-picked spots.

THR-383 is the breadth pass: walk the encounter content catalog and add `intel_referenced_prose` effects everywhere the matching category is realistic and the moment is load-bearing, so that an actor who learned something in a prior encounter *visibly references it* the next time it matters.

This is explicitly **not** an engine ticket. THR-139 closed the engine surface; nothing in `src/engine/`, `src/types/`, or `src/data/agent-behavior-constants.ts` changes here.

---

## Goal

Add `intel_referenced_prose` aftermath effects across the encounter content catalog, reusing the THR-139 prose pack where it fits and composing bespoke prose (to the pack's voice contract) where it doesn't.

**In scope:** the 6-category sweep across the encounter-content files and the branching encounter files in `src/data/encounters/`.

**Out of scope:**
- Engine code — THR-139 shipped the effect kind, dispatcher, helpers, constants, traces. Verified Done (THR-139 Done-when all checked).
- The shared prose pack `src/data/intelligence-referenced-prose.ts` — already authored, 72 lines, all six categories. Reuse it; do not rewrite it. (Adding *new* lines to the pack is allowed if a category runs thin during the sweep — additive only.)
- `src/data/unified-action-templates.ts` and `src/data/npc-action-templates.ts` — **verified to contain zero aftermath reactions** (`grep -c "aftermathReactions" → 0`). The reaction content lives entirely in the `*-encounter-content.ts` files and `src/data/encounters/`. This is why THR-383 is **not** mutex with THR-441 (see Coordination).
- Dedup, lint rule, `acquiredDaysAgo` placeholder — THR-139 Deferrals #2/#3/#4, filed separately as THR-384 / THR-386 / (placeholder not yet filed).

---

## Three-pillar coverage

| Pillar | Status | Rationale |
|---|---|---|
| **Engine** | **N/A — shipped in THR-139, verified** | The `intel_referenced_prose` effect kind, the `applyEncounterAftermathReaction` dispatcher case, `findIntelReferencedProseMatch` / `pickIntelReferencedProseLine`, the four `INTEL_REFERENCED_PROSE_*` constants, and the `referencedBy: 'aftermath_prose'` trace discriminator all shipped and are covered by THR-139's unit + contract tests. THR-383 adds **zero** engine code — only new *instances* of an already-shipped, already-tested effect kind. |
| **Content** | **Full — this is the ticket** | The catalog sweep. See Content design below. |
| **UI** | **N/A — shipped/verified in THR-139** | Every `intel_referenced_prose` effect surfaces through the existing chronicle / right-rail `TickEvent` renderer and DebugPanel's `intelligence_referenced` inspector. THR-139 verified this end-to-end with a 1920×1080 browser screenshot. THR-383 introduces no new effect kind, no new `TickEvent.type`, no new trace discriminator — so it creates **no new UI surface to verify.** Browser-verify is genuinely exempt (the change touches only `src/data/`, nothing under `src/components/`, `src/views/`, etc.) — but the exemption must be stated in the commit body per Definition of Done (see Done-when). |

The UI and Engine pillars are **N/A by inheritance, not by omission** — THR-139 is their design home, it shipped, and THR-383 is a pure content expansion of the surface it built.

---

## Content design

### C1. The editable surface

`kind: 'intelligence'` grants — the strongest signal that "this encounter family deals in this category of intel" — are distributed as follows (verified 2026-05-15, `grep -rc "kind: 'intelligence'" src/data/`):

| File | Intel grants | Pilot already wired? |
|---|---:|---|
| `lorekeepers-covenant-encounter-content.ts` | 13 | — |
| `encounter-anomaly-content.ts` | 10 | ✅ `cultural_knowledge` |
| `arcane-circle-encounter-content.ts` | 10 | ✅ `agent_network` |
| `builders-fellowship-encounter-content.ts` | 7 | ✅ `political_secret` |
| `thieves-guild-encounter-content.ts` | 6 | — |
| `rangers-brotherhood-encounter-content.ts` | 6 | — |
| `army-encounter-content.ts` | 6 | — |
| `tavern-encounter-content.ts` | 5 | — |
| `social-encounter-content.ts` | 5 | — |
| `merchant-consortium-encounter-content.ts` | 4 | — |
| `civic-guard-encounter-content.ts` | 4 | — |
| `underking-court-encounter-content.ts` | 2 | — |
| `temple-of-spheres-encounter-content.ts` | 2 | — |
| `monster-encounter-content.ts` | 2 | — |
| `borderland-encounter-content.ts` | 2 | — |
| `holy-order-dawn-encounter-content.ts` | 1 | — |
| `faction-encounter-content.ts` | 1 | — |
| `src/data/encounters/rival-shrine-betrayal.ts` | 2 | — |

**Total: 88 intel grants across 18 files.** Plus the other **22 files** in `src/data/encounters/` (branching encounters) that currently grant no intel but may still host reactions where an actor would plausibly *already hold* category-relevant intel.

Reaction shape (confirmed): `reactions: [ { id, label, effects: [ ... ], closeAfterSelection } ]`. An `intel_referenced_prose` effect is added to a reaction's `effects` array, exactly as in the three pilots.

### C2. The core judgment heuristic

A reaction is a good candidate for an `intel_referenced_prose` effect when **all three** hold:

1. **The actor would plausibly already hold the intel.** This is a *reference*, not a *grant* — do not add it to the same reaction that grants the record. Add it to reactions an actor reaches *while* or *after* holding category-X intel from prior play. The `kind: 'intelligence'` grants in C1 are the signal that "category X is realistic for this encounter family" — they are not themselves the targets.
2. **The category is realistic for the encounter context.** Use the category→family map in C3. A `military_position` reference inside a flower-arranging tavern scene will simply never fire (`findIntelReferencedProseMatch` no-ops) — that is dead content, not a crash, but it is still wasted authoring.
3. **The moment is load-bearing.** Knowing-vs-not-knowing should change how the scene *reads*. The line is a payoff, not decoration. If the reaction would read identically with or without prior intel, skip it.

### C3. Category → encounter-family map (the scoping artifact)

This is the starting map so CC walks with intent, not blind. It is a *guide*, not a quota — CC applies judgment per reaction.

| `IntelligenceCategory` | Encounter families where it is realistic |
|---|---|
| `shrine_location` | temple-of-spheres, holy-order-dawn, `encounters/`: wandering-healer-shrine-access, pilgrims-offering, the-oracle-consulted, the-veiled-consultation, rival-shrine-betrayal, the-blinded-oracle, soul-ferryman, the-star-pilgrim |
| `agent_network` | arcane-circle *(pilot)*, thieves-guild, social, tavern, `encounters/`: the-letters-of-introduction, the-infiltrators-approach, shadow-court-audience |
| `trade_route` | merchant-consortium, borderland, `encounters/`: the-merchants-favor, the-unmarked-crossing, warlords-tribute |
| `military_position` | army, civic-guard, rangers-brotherhood, `encounters/`: road-ambush, the-brink-rescue, the-courtyard-duel, the-renowned-duel, warlords-tribute |
| `political_secret` | builders-fellowship *(pilot)*, underking-court, faction, `encounters/`: shadow-court-audience, the-jury-of-the-ruined, the-stones-judgement, the-executioners-commission, the-letters-of-introduction |
| `cultural_knowledge` | lorekeepers-covenant, encounter-anomaly *(pilot)*, temple-of-spheres, `encounters/`: the-blinded-oracle, the-oracle-consulted, flawed-steel, the-silent-chamber |

Some encounters legitimately span two categories (e.g. `underking-court` → `political_secret` *and* `agent_network`; `warlords-tribute` → `trade_route` *and* `military_position`). Pick the one the *specific reaction* is about.

### C4. Authoring rubric

For each flagged reaction, add one `intel_referenced_prose` effect to its `effects` array. Two valid authoring paths (THR-139 §C5 establishes both as equal):

- **Reuse the pack** — reference a line from `INTEL_REFERENCED_PROSE_PACK[category].{reliable|uncertain|dubious}[i]` when an existing line fits the moment. The pack ships 4 lines per band per category specifically so authors don't re-write prose for every reaction.
- **Compose bespoke** — when the pack lines are too generic for a specific encounter beat, write fresh prose to the voice contract (below). The two pilots in `arcane-circle` and `builders-fellowship` are bespoke; copy that level of specificity.

**Voice contract** (verbatim from `src/data/intelligence-referenced-prose.ts` header + THR-139 §C4):
- Threadbare voice (Witness/Poet hybrid). Past-tense, third-person.
- 18–32 words per line. Hard floor 12 (avoid bullet voice), hard ceiling 40.
- Each line stands alone — never references the next reaction step or assumes the player's next choice.
- `{name}` and `{location}` encouraged; deeper enrichment (`{ally}`/`{rival}`) optional.
- No numbers. Reliability is conveyed by phrasing, not stats.
- The `dubious` band **explicitly hedges or shows the intel betraying the agent** — dubious intel sometimes makes things worse, and that is the tonal point. Author all three bands (`reliable` required; `uncertain`/`dubious` optional but strongly encouraged — they inherit upward when absent).

### C5. Volume guidance and anti-noise caps

This is a *breadth* pass, not a *saturation* pass. THR-139 §Risks #1 flags chronicle noise as the real failure mode: an actor who triggers 3+ "they remembered the rumor" lines in one encounter reads as a bug.

- **One `intel_referenced_prose` effect per reaction** (hard — voice contract).
- **≤ 2 per encounter** (soft cap — so a single encounter never floods the chronicle with intel-payoff lines).
- **Target ~25–40 newly-flagged reactions total**, weighted toward the high-grant families (lorekeepers-covenant, arcane-circle, encounter-anomaly, the guild files). This is a *judgment target*, not a quota — under-shooting with high-quality, load-bearing placements beats hitting 40 with filler. The exact number is CC's call; the closing comment reports the actual roll-up.
- **Do not** add an effect to a reaction just because its encounter is in the C3 map. The C2 three-part test gates every placement.

### C6. Fail-soft (content-level)

No engine fail-soft changes — THR-139 §E8 owns that, and every effect THR-383 adds inherits it (no matching record → silent no-op + one skip trace; never a crash). The *content* failure mode is **dead content**: an effect whose `category` is implausible for its encounter never fires. Mitigations:
- The C3 category→family map + the C2 heuristic are the primary guard.
- THR-386 (the deferred lint rule) is the systemic guard — out of scope here, but a sloppy THR-383 pass increases THR-386's value, so place carefully.

---

## Wiring

Nothing new to wire. Confirmed against `Docs/plans/wiring-checklist.md`:

| Wiring surface | Status |
|---|---|
| Orchestrator phase | None new — effects fire inside `applyEncounterAftermathReaction`, already in the aftermath orchestrator phase (THR-139). |
| GameState fields | None new. |
| Modals / GameView JSX | None new. |
| Trace categories | None new — `intelligence_referenced` (`referencedBy: 'aftermath_prose'`) and `encounter_aftermath_effect` (`effectKind: 'intel_referenced_prose'`) fire automatically per added effect. |
| Debug visibility | DebugPanel `intelligence_referenced` inspector already covers it (THR-139). |
| Prose pipeline | Each added `prose.{reliable,uncertain,dubious}` string flows through `enrichProse()` at the existing dispatcher call site — same path as the pilots. |
| Player controls | None new. |
| Wiring-checklist update | **Not needed** — THR-139 already added the `intel_referenced_prose` row under "Aftermath effect kinds". |
| Systemic-wiring-guide update | **Not needed** — THR-139 already added the "Intel-referenced prose" row to `Docs/plans/2026-04-16-systemic-wiring-guide.md`. |

---

## Constants table

**N/A — no new constants.** The four `INTEL_REFERENCED_PROSE_*` constants (`SIGNIFICANCE_RELIABLE/UNCERTAIN/DUBIOUS`, `DUBIOUS_FIRES`) shipped in THR-139 and govern every effect THR-383 adds. Per-effect `significance` overrides remain available to authors (THR-139 §E1) and may be used where a specific beat warrants it.

## Tracing

**N/A — no new trace types.** Each added effect emits the existing `intelligence_referenced` (`referencedBy: 'aftermath_prose'`) trace on a successful fire and an `encounter_aftermath_effect` (`effectKind: 'intel_referenced_prose'`, `success` true/false + `failReason`) trace on every fire or skip. Both shipped and tested in THR-139.

## NFP compliance

| NFP | Status | Note |
|---|---|---|
| 1. Tunability | PASS (inherited) | No new magic numbers. The four THR-139 constants + per-effect `significance` override remain the tuning surface. |
| 2. Inspectability | PASS (inherited) | Every added effect is traceable via the existing `intelligence_referenced` / `encounter_aftermath_effect` traces. A categorical roll-up in the closing comment makes the *content* delta inspectable too. |
| 3. Determinism | PASS | Pure authored data. No randomness introduced; match selection and band derivation are THR-139's pure functions. |
| 4. Fail-soft | PASS (inherited) | Every added effect inherits THR-139 §E8 — no matching record → silent no-op + skip trace. Content-level dead-content risk mitigated by the C3 map + C2 heuristic. |
| 5. Narrative over mechanical | PASS | This is the whole point: turn an invisible mechanical fact (intel matched) into a visible narrative beat across the catalog, not just 3 pilots. |
| 6. Additive over destructive | PASS | Adds effects to existing `effects` arrays. No reaction is removed or restructured; no existing effect is modified. Pack additions (if any) are append-only. |
| 7. Performance | PASS (inherited) | One category-filtered intel scan per added effect per reaction *application* (not per tick) — aftermath reactions are off the per-tick critical path. THR-139 §NFP #7 covers this; THR-383 adds instances, not new cost shape. |

---

## Risks

1. **Chronicle noise (the real one).** A heavy-handed sweep floods the chronicle. Mitigation: the C5 caps (1/reaction, ≤2/encounter, ~25–40 total) and the C2 load-bearing test. If CC is unsure whether a placement is noise, it is — skip it.
2. **Dead content from implausible categories.** Mitigation: the C3 map. An effect that never fires is wasted authoring, not a bug, but still a quality miss.
3. **Mutex collision on encounter-content files.** If any executor later claims an issue that edits the same `*-encounter-content.ts` files, the later claimant must rebase. Mitigated by: no current In Dev work touches `src/data/` encounter content (verified 2026-05-15), and THR-383 should land in one focused PR. See Coordination.
4. **Pilot-style drift.** The two bespoke pilots set a high specificity bar. Reusing pack lines is fine and encouraged — but a sweep that is *100% pack reuse* will read repetitively across the catalog. Aim for a mix: pack lines for routine beats, bespoke for the load-bearing moments.

---

## Coordination block

```
Suggested model: opus-4-6
model:opus-4-6   ← matching label required (Rule 10) — already on the issue
Parallel-safe with: THR-425, THR-163, THR-434, THR-406
Mutex with: none
Codex review: yes (content-only, but a large multi-file diff — Codex review catches malformed effect-object shapes and voice-contract drift across files)
```

**Why parallel-safe with all currently-queued work:**
- THR-425 (stagger Linear pollers) — infrastructure / scheduled-task config. No file overlap.
- THR-163 (Foundation sphere marketing images) — `public/` assets + marketing HTML. No file overlap.
- THR-434 (impediment-dashboard regen) — tooling / `Docs/`. No file overlap.
- THR-406 (Vision/ numbered files) — Obsidian vault / docs. No file overlap.

**Why NOT mutex with THR-441** (rarity → reach-tier gating, also Content Architecture-adjacent): THR-441 edits `src/data/unified-action-templates.ts`. THR-383's editable surface is the `*-encounter-content.ts` files + `src/data/encounters/`. `unified-action-templates.ts` and `npc-action-templates.ts` were **verified to contain zero `aftermathReactions`** (2026-05-15) — they are out of THR-383's scope entirely. No file overlap, therefore no mutex.

**If CC discovers reaction-bearing content directly in `unified-action-templates.ts`** (it should not, per the grep): stop, do not edit that file, and flag it back to Cowork — that would make THR-383 mutex with THR-441 and the scope assumption here would need revisiting.

---

## Done when

- [ ] `intel_referenced_prose` effects added across the encounter content catalog per the C2 heuristic + C3 map, respecting the C5 caps (1/reaction, ≤2/encounter, ~25–40 total target).
- [ ] All added prose meets the C4 voice contract (Threadbare voice, 18–32 words, three bands, dubious-hedges). Pack reuse and bespoke composition both valid; aim for a mix.
- [ ] **Categorical roll-up** in the closing commit body or Linear comment — e.g. "14 cultural_knowledge, 9 agent_network, 6 political_secret, 5 shrine_location, 4 military_position, 3 trade_route — 41 reactions across 16 files."
- [ ] `npm test` green (THR-139's `intel-aftermath-prose-liveness.contract.test.ts` and unit suites still pass — the sweep must not regress them).
- [ ] `npx tsc --noEmit` clean (catches malformed effect objects — the primary mechanical risk of a content sweep).
- [ ] `npx vite build` clean.
- [ ] **Recommended** (not contractual — THR-383 touches no `src/engine/` file so the engine-smoke requirement does not strictly apply): a quick CLI smoke (`printf "run 5\nencounters\nexit\n" | npm run cli -- --seed 42 --map medium`) to confirm at least one new `intel_referenced_prose` line fires and the chronicle is not visibly flooded. Paste the relevant lines into the closing comment if run.
- [ ] **Browser-verify exemption stated in the commit body**: `Browser-verify exempt: content-only sweep, no src/components or src/views changes; intel_referenced_prose UI surface verified in THR-139`.
- [ ] Verification evidence (raw `npm test` / `npx tsc --noEmit` / `npx vite build` output, or green CI link) pasted in the closing commit body or Linear comment.
- [ ] Closing commit body includes `Fixes THR-383`.
- [ ] Linear issue moves to Done via the merge-to-main auto-close.

---

## Brainstorm companion

**Considered alternatives:**
- *Saturate every intel-relevant reaction.* Rejected — THR-139 §Risks #1 already identified chronicle noise as the dominant failure mode; a saturation pass would ship the bug. The C5 breadth-not-saturation framing is the response.
- *Restrict the sweep strictly to the 18 files that already grant intel.* Rejected as too narrow — the `src/data/encounters/` branching files host exactly the kind of high-stakes, returning-actor scenes (oracles, duels, court audiences) where intel payoff lands hardest, even though they don't grant intel themselves. Included via the C3 map.
- *Defer until THR-386 (the lint rule) ships, so misplaced categories get caught automatically.* Rejected — THR-386 is an XS deferral with no appetite signal yet, and THR-383's value (closing the visible intel loop across the catalog) shouldn't wait on a tooling nicety. The C3 map is a sufficient manual guard.

**Tensions surfaced:**
- *Breadth vs. noise* — resolved by the C5 caps and the C2 load-bearing test.
- *Pack reuse vs. bespoke specificity* — resolved by explicitly endorsing a *mix* (C4, Risk #4) rather than mandating either.

**Vision premises invoked:** NFP #5 (narrative over mechanical perfection) — the entire ticket exists to make a mechanical fact narratively visible. No Vision premise is contradicted or updated; this is a pure content expansion of a shipped, Vision-aligned surface.

**Rulebook impact:** None. THR-383 changes no rule of play — no turn structure, action verb, prerequisite, resource, encounter *structure*, clock, or win/loss condition. It adds flavor prose to existing aftermath reactions.

---

*Plan authored by Cowork, 2026-05-15 (keep-work-flowing run). Parent THR-139 plan: `Docs/plans/2026-05-08-thr-139-intel-referenced-prose-reaction.md` §C1 + §Deferrals.*
