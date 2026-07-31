> **title:** `Sphere-governed ascendant — decision record + sheet/bar legibility fix — THR-869`
> **linear_issue:** THR-869 (near-term fix) · THR-870 (deferred pivot design; this doc is its decision record)
> **author:** `Claude Code (Fable design session, live chat with Christian)`
> **created:** 2026-07-30
> **three_pillars:** Engine `N/A — presentational + content-data change; consumes an existing engine read` · Content `done` · UI `done`

# Sphere-governed ascendant — decision record + sheet/bar legibility fix

*Records the 2026-07-30 creative-director verdicts that the god is sphere-governed (reaches demote to mortal-past echo), and specs the conservative sheet/bar legibility fix (THR-869) that is safe to ship before the pivot.*

## Why this is load-bearing

Christian hit a player-facing contradiction: the ascendant character sheet reads "Primary Matter / Secondary Mind" while the left bar reads "Primary Stone / Secondary Gold / Secondary Iron". Investigation showed the sheet leads with **spheres** (unlabeled), lists all 8 reaches in fixed catalog order fed from frozen day-one ranking weights through the **mortal** tier-word ladder, while the bar shows live reach progression — two surfaces describing one god through different axes with the same "Primary/Secondary" words. The discussion that followed resolved a standing design ambiguity: which axis governs the god. Without this record, future design sessions will keep deepening reach-keyed god content (the THR-613 lineage) against the creative director's stated vision; without the THR-869 fix, the two identity surfaces keep contradicting each other and will drift further apart every tick.

---

## Part A — Decision record (feeds THR-870; deferred)

Verdicted by Christian (creative director) in chat, 2026-07-30. This section is the durable record; implementation is parked in the **Sphere-Governed Ascendant** Linear project (status: Idea) until the world/mortal systems mature — his sequencing call: *"the whole area of power curve for ascendant growth is still rudimentary as we build the world and the mortals."*

### Verdict 1 — The god is sphere-governed; reaches demote to echo

The ascendant is a god, an avatar of the Spheres — it does not work under mortal rules. Sphere alignment is already the god's identity nearly everywhere (archetype, essence economy, portraits, Divine Nature prose, derived cosmology); the reach layer on the god (THR-613) is the incongruent newcomer. Under the pivot: card gating, signatures, and progression key on **spheres**; the god's hunger-granted reach affinities demote to **mortal-past flavor** — prose echo, no gating. The god's reach echo gets its **own epic register**: *"remember they are ascendants and so as they ascended they were larger than life in many ways"* — never reusing mortal capability words (the exact words that caused the sheet confusion).

### Verdict 2 — Mortal magic is Veil-gated, sphere-bestowed

Canon line (Christian: "spot on"): **the Veil reach is whether a mortal can touch magic at all; the sphere is whose power flows through them when they do. Mortals reach through the Veil; gods are what's behind it.** A future mortal spell system hangs off this: Veil gates access, spheres supply substance, and **bestowal** (a god granting spells to threaded mortals) becomes a god verb. A dormant `bestowedPowers` trait path already exists in seeding — activate, don't green-field (systems-inventory Step 0 rule).

### Verdict 3 — God progression: accretion + clash trials, never practice

Gods do not grind practice; mortals do. God progression has two halves:

- **Passive accretion** — threads (live), essence sources (live), worship (**undesigned** — needs its own design session before it can carry weight).
- **Active trials keyed to sphere clashes.** Trials are world-authored, not god-authored: a clash is two opposed spheres contending somewhere in the world (`SPHERE_OPPOSITES` — Force↔Mind, Matter↔Time, Energy↔Spirit, Life↔Entropy; Foundation: Chaos↔Order, Light↔Darkness). Christian's verdict: *"i dont think we want sphere specific trials. all trials are about shaping the world and so should be about spheres clashing."* **Any god may answer any clash — alignment shapes how it tips and what it costs, never whether it may.** Rewards stay open both ways (permanent power and tilt-scoped boons — *"lets be open to both"*). The omen system (sphere_surge / doom_echo) is the natural detection layer; the mandate system is the staged-quest precedent; milestone beats are the grant path.

### Settled-decision reversal (recorded here so no session reverts it)

This direction **supersedes** the CLAUDE.md load-bearing decision *"Ascendants use the same prerequisite system as agents… not a special-cased entity type"* as far as the god's **governing axis** is concerned. In practice THR-613 already built the god a bespoke progression lane; the pivot changes which axis keys it, not whether machinery is shared where it fits. The CLAUDE.md edit itself rides THR-870's activation (so canon and implementation change together). **Interim guardrail:** any design session authoring new ascendant-facing content must check the Sphere-Governed Ascendant project before adding new reach-keyed god content — extend nothing reach-keyed on the god that THR-870 would immediately have to unwind.

### What the pivot will cover when activated (THR-870 scope sketch)

Re-key `requiresReach` god cards to sphere requirements; flip the reach-signature matrix to sphere signatures (the (reach × sphere) individualization content mostly survives — the reach is the label, the sphere already does the scaling work; spell names persist as *what mortals call the miracle*); worship design; trial system design; UL proposals for the new vocabulary; kill-path check on the sphere fuel+gate+growth loop (rich-get-richer risk).

---

## Part B — THR-869: sheet/bar legibility fix (Ready for Dev now)

Conservative scope. **Does not pre-build the pivot** — reaches remain the gating axis today; this fix makes the two existing surfaces agree, teach the axis split, and stop dressing the god in mortal words.

## Engine pillar

Engine: N/A — consumes the existing `getAscendantProgress(state)` read (`src/engine/phaseAscendantProgression.ts`); no tick phases, graph types, resolution, or PRNG changes.

## Content pillar

### Data tables

**New file `src/data/ascendant-reach-register.ts`** exporting `ASCENDANT_REACH_REGISTER: Record<ReachDomain, { tierWords: [string, string, string, string, string]; echoLine: string }>` — 8 reaches × 5 tier words + one echo body line each.

**Register voice rules (from Verdict 1):**
- God-scale and mythic, written from the far side of the Veil — never mortal capability words (`Trained`, `Bartering`, `Rootless`, `Destitute` are the failure cases this exists to kill).
- The echo line frames the reach as **mortal-past carried into godhood**, e.g. Gold: *"In life, none could out-bargain her; death has not settled her accounts."*
- Threadbare voice, prose-first, no numbers (tier is a word, never an index).
- Example tier ladder to set the bar (Stone): `Unhewn → Set → Load-Bearing → Monumental → World-Root`. Executor authors the full 8×5 set to this standard.

### Encounter templates / Prose tables / Attachment content

N/A — no encounter, enrichment, or attachment content.

## UI pillar

*Screenshot tool: **Playwright** (both surfaces are DOM — the sheet is a Modal, the bar is DOM; no WebGL).*

### Player-facing display

1. **AscendantSheet header** (`src/components/Game/AscendantSheet.tsx`): the Primary/Secondary chip row gains an explicit axis caption — `Spheres · the currents that fuel you` (microcopy final wording executor's call, must name the axis "Spheres").
2. **AscendantSheet Dominion section**: replace the all-8-reaches `REACH_DOMAINS.map` over frozen `archetype.startingDomainAffinities` with the god's **live ranked reaches** — same read the bar uses (`selectReachRows(gameState)` from `src/components/Game/ascendant-bar/selectors.ts`, or `getAscendantProgress` directly). Each row: rank badge (`REACH_RANK_LABEL` — PRIMARY/SECONDARY), reach label, register tier word, echo line as body. Off-domain reaches are **not listed**; the existing "Browse the path codex" link remains the aspiration surface. Section sub-caption teaches the axis: `Reaches · the domains your godhood works through`.
3. **Ascendant bar** (`ascendant-bar/selectors.ts` → `selectReachRows`): `tierWord` switches from `getNarrativeLabel` (mortal lexicon) to the `ASCENDANT_REACH_REGISTER` lookup — bar and sheet share one data source *and* one live read, so they can never disagree again.
4. **Do NOT modify `DomainCard`** — it is shared with the mortal ProwessTab; the god rows are new lightweight local rendering inside AscendantSheet.

### Design-system conformance (UI-ticket requirement)

Tokens only (`var(--font-display)`, `var(--text-*)`, `var(--accent-gold)`, `--space-*`); reuse `SectionHeading`, `Tooltip`, and the bar's existing rank-label styling; no new shared primitives; no raw hex colors; Modal scroll behavior untouched (viewport contract: nothing below the fold at 1920×1080 beyond the Modal's own internal scroll).

### Event notifications

N/A — no new notifications.

### Debug inspection (DebugPanel)

No new `__DEBUG` surface. Verification uses the existing ascendant-progression read (see `src/debug-bridge.d.ts` for the exact method name; the engine documents it as safe for `__DEBUG` use).

### Visual presence (HexMapV2)

N/A — no hex-map surface.

## Interface impact

Part B touches no contract in `Docs/canon/interface-map.md` (verified by grep: no `AscendantProgress`/`ascendant-bar`/`AscendantSheet` rows exist). Part A's subsystem mentions (mandate, essence economy, encounters, omens, signatures) are decision-record prose about *deferred* work — THR-870 carries the full Step-0.7 interface pass when activated.

| Contract | Action |
|----------|--------|
| (none mapped for the surfaces THR-869 edits) | preserve — no cross-system read/write added, rerouted, or retired |

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `src/data/ascendant-reach-register.ts` | none (static data) | `AscendantSheet`, `ReachesBlock` (via selectors) | none | none | register words visible in both surfaces |
| `AscendantSheet.tsx` Dominion rebuild | none | `AscendantSheet` | reads `gameState` via existing progression read | none | `__DEBUG` progression read must match rendered rows |
| `ascendant-bar/selectors.ts` tierWord source | none | `ReachesBlock` | unchanged | none | same as above |

## Constants table

N/A — no numeric tunables. The register is a named content table (`ASCENDANT_REACH_REGISTER`); tier thresholds remain `computeTier` (unchanged). Changing god-facing feel = editing register words, not logic (NFP #1 honored in content form).

| Constant | Default | Purpose |
|----------|---------|---------|
| `ASCENDANT_REACH_REGISTER` | (content table, not a number) | God-register tier words + echo lines; the single source both surfaces read |

## Tracing

N/A — no new traces; presentational change. Progression already emits `ascendant.progression.*` traces at the engine layer (NFP #2 satisfied upstream).

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| No ascendant / progression unreadable | Existing empty-state copy (`REACH_EMPTY_COPY` on the bar; sheet renders the section with the codex link only) |
| Register missing a reach or tier entry | Render reach label without a tier word — never fall back to the mortal ladder |
| Non-finite tier from upstream | Clamp to lowest tier word (mirror the existing `Number.isFinite` guard in `selectReachRows`) |

## Three-pillar check

- [x] Engine pillar present (N/A with rationale)
- [x] Content pillar present
- [x] UI pillar present
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict any Vision premise — Part B is presentational and axis-teaching.
- [x] Part A *is* a recorded vision change (creative-director verdicted); its Vision/canon edit is in this ticket's scope in pointer form (cosmology canon guardrail, this PR), with the full canon/CLAUDE.md edit riding THR-870 activation by design.

## Rulebook impact

- [x] This plan does not change a rule of play — labels, data source, and prose register only; gating, tiers, and progression math untouched.
- [x] No `Docs/canon/rulebook.md` edit needed for Part B; the pivot's rulebook edits ride THR-870 activation.

> Brainstorm companion: `Docs/plans/2026-07-30-sphere-governed-ascendant-decision-record-brainstorm.md` (written alongside).

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | No magic numbers introduced; feel lives in a named content table |
| 2. Inspectability | PASS | Rendered rows must equal the `__DEBUG` progression read — asserted in Done-when |
| 3. Determinism | PASS | No random code |
| 4. Fail-soft | PASS | See fail-soft table; never crashes, never regresses to mortal words |
| 5. Narrative over mechanical perfection | PASS | The whole fix is narrative-register repair |
| 6. Additive over destructive | PASS with note | Sheet's Dominion rendering is replaced (the frozen-affinity read is the defect); `DomainCard` and mortal surfaces untouched |
| 7. Performance budget | PASS | Static table lookup; selectors already memoized on worldVersion |

## Done when

- [ ] Sheet alignment row carries the "Spheres" axis caption; sheet Dominion lists **exactly** the reaches returned by the `__DEBUG` ascendant-progression read, ranked, with PRIMARY/SECONDARY badges — pasted `__DEBUG` output + screenshot as evidence
- [ ] No god-facing surface resolves tier words through the mortal ladders — `getDomainTier`/`DOMAIN_WORD_SCALES`/`getNarrativeLabel` absent from the ascendant tier-word paths (grep evidence pasted)
- [ ] `ASCENDANT_REACH_REGISTER` pinned by a `toEqual`-style test enumerating all 8 reaches × 5 tiers (assert the full set, not a count — vacuous-probe guard)
- [ ] Playwright screenshots at 1920×1080 of the open sheet and the bar; console messages block pasted (`(no errors or warnings)` if empty)
- [ ] `npm test` and `npx vite build` pass; `npm run check:typecheck` ratchet green; `npm run check:wiki-freshness:blocking` green (update the Manual page in the same PR if a sources glob fires)
- [ ] Closing commit body includes the auto-close keyword line for THR-869 (per Definition of Done; not quoted here — THR-738)

## Coordination block

**Suggested model:** sonnet — contained UI + content-table change with a full spec (advisory; the lane runs Opus regardless).

**Parallel-safe with:** anything not touching `AscendantSheet.tsx`, `src/components/Game/ascendant-bar/*`, or the new register file.

**Mutex with:** any issue editing `src/components/Game/AscendantSheet.tsx` or `src/components/Game/ascendant-bar/selectors.ts` (both edit those files).

**Files to touch:**
- Create: `src/data/ascendant-reach-register.ts` (+ its pinning test)
- Edit: `src/components/Game/AscendantSheet.tsx` (header caption; Dominion rebuild on the live read; local row rendering)
- Edit: `src/components/Game/ascendant-bar/selectors.ts` (tierWord source → register)
- Edit: `src/components/Game/ascendant-bar/__tests__/reachRows.test.ts` (tierWord expectations)

## Notes for the executor

- **Do not touch `DomainCard`** (shared with mortal ProwessTab) and do not change mortal surfaces' word ladders.
- **Do not pre-build the sphere pivot** — THR-870 is parked deliberately; reaches stay the gating axis in this ticket.
- `REACH_COPY` label/body content stays; the register replaces only tier words + adds echo lines.
- Keep the "Browse the path codex" link — it is the off-domain aspiration surface once off-domain reaches stop rendering in the sheet.
- The sheet's Essence section and Divine Threads section are out of scope.

## Intent-judge verdict

**Allow** (2026-07-30, cold-boot Fable judge). High-risk class confirmed; explicit user sign-off verified. 10 dimensions PASS, 1 GAP (Vision-audit discoverability of the interim guardrail). Advisory adopted in the same PR: a pointer to this decision record now sits at the top of `Docs/canon/cosmology.md` § Active design plans, so Step-0 canon loading surfaces the guardrail.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-07-30*

### NFP audit

| NFP | Verdict | Evidence |
|-----|---------|----------|
| 1. Tunability | PASS | "No numeric tunables. The register is a named content table... Changing god-facing feel = editing register words, not logic" |
| 2. Inspectability | PASS | Wiring table maps module→phase→UI→field→trace→debug (matches checklist format); Done-when requires rendered rows == `__DEBUG` progression read, pasted as evidence |
| 3. Determinism | PASS | Engine pillar N/A, static lookup + existing memoized selector reads only; "No random code" |
| 4. Fail-soft | PASS | Explicit fail-soft table: no-ascendant fallback, missing register entry → label-only render (never mortal ladder), non-finite tier clamp |
| 5. Narrative over mechanical | PASS | Entire fix is register repair — kills mortal capability words (`Trained`, `Bartering`) on the god, mandates epic-register echo lines |
| 6. Additive over destructive | PASS-with-note | Doc itself flags: Dominion's frozen-affinity `REACH_DOMAINS.map` render is replaced, framed as fixing "the defect"; `DomainCard`/mortal surfaces explicitly untouched — a scoped, justified replacement, not a blanket rewrite |
| 7. Performance budget | PASS | "Static table lookup; selectors already memoized on worldVersion" — no new per-tick cost |

**NFP AUDIT: PASS-with-notes (see row 6)**

### Three-pillar audit

| Pillar | Verdict | Finding |
|--------|---------|---------|
| Engine | N/A-with-rationale | Correctly scoped — consumes existing `getAscendantProgress` read; no tick/graph/PRNG changes, rationale explicit |
| Content | present-and-substantive | New `ASCENDANT_REACH_REGISTER` file fully spec'd: shape, voice rules, example ladder, pinning-test requirement |
| UI | present-and-substantive | Both surfaces (AscendantSheet header + Dominion, ascendant-bar selectors) specified with concrete file paths, design-system conformance, fail-soft table, debug-inspection tie-in |

No missing required sections. Blast Radius section absent but correctly so — no touched file is on the ≥100-importer list. Wiring section traces the register through both consuming components to a shared debug-visibility requirement (phase/trace legitimately "none" for a static-data/presentational change). Substrate check: N/A (no Engine pillar).

**PILLAR AUDIT: PASS**

### Vision audit

Premises touched: `02-non-negotiables.md` — "Narrative over mechanical perfection" confirmed (register rules, prose-only tier words); "All mechanics surface through prose, never numbers" confirmed; "Player is a god, not a protagonist" extended (clash trials / bestowal add god-verb texture, no direct mortal control). `taste-profile.md` — prose-first / no-numbers confirmed. `00-north-star.md`, `01-core-loop.md` — not referenced/untouched. No contradictions found — the reach/sphere-orthogonality reversal is explicitly named and its scope parked to THR-870; Part B ships none of the pivot. Non-negotiables (god/protagonist separation) preserved; god-echo prose forbidden from reusing mortal capability words, protecting the sovereignty distance. "Trials are world-authored, not god-authored" leans systemic without abandoning authored framing.

**VISION AUDIT: PASS** — Part A records a creative-director-verdicted axis change coherently (scoped, parked, guardrail added to canon); Part B is a conservative, Vision-compliant presentational fix that ships none of the pivot.
