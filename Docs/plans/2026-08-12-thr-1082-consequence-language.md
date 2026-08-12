> **title:** `Consequence language — story-first aftermath chips — THR-1082`
> **linear_issue:** THR-1082
> **author:** `Claude Code`
> **created:** 2026-08-12
> **three_pillars:** Engine `done` · Content `done` · UI `done`

# Consequence language — story-first aftermath chips — THR-1082

*The aftermath is where the player learns what an encounter meant; today it reports die rolls in a mad-lib, and this plan makes it tell the character's story instead.*

## Why this is load-bearing

Christian's 2026-08-10 direction (verbatim in the issue) found the aftermath chips unreadable — "Vara's Stone grew steadily" names no icon and an adverb with no scale; "the bridge spent something" names nothing at all. The 2026-08-12 design session with him went further: the problem is not only presentation. The chip *taxonomy* (TOLL/MARK/SEED) means nothing to a player and nothing in the fiction, and the consequences themselves are plot-dead — mechanical residue rather than events that happen *to the character for a reason*. His ruling, recorded here as the design contract:

> Consequences must be **personal** — a success or a failure for the character first and foremost — and must **happen for a reason** relevant to the character and the world, fitting the epic tales of gods and world-influencing heroes on missions. Chips are either **plot hooks** (opening new opportunities) or **new capabilities/complications that tell the story of why they were earned**. The encounter builder should draw on **ALL the attachment types and many different conditions** — and may expand with new categories when it makes a good story.

Every encounter ending in the game renders through this surface. Until it ships, every aftermath in every encounter reads as a stat report, and no content pass can fix it, because the worst offenders are engine-generated sentences nobody authored.

## Design decisions (settled with Christian, chat, 2026-08-12)

1. **Taxonomy — four story-first categories replace the six chip kinds.** `SCAR` (what the trial cost them, written on body or spirit — absorbs TOLL + WOUND), `BOND` (who now stands with or against them — absorbs STANDING, plus companions), `BOON` (what they earned and why — absorbs PRIZE + growth), `PATH` (a way that has opened — absorbs SEED). **MARK dies**: a bucket named "everything else" can never be story-legible; unknowns fold by polarity (see fail-soft). Each category carries a registered tooltip and a first-contact legend (the THR-972 glyph-legend pattern).
2. **Chip anatomy:** `[icon tile] [CATEGORY · NOUN tag] [cause → change sentence] [delta cluster]`. The icon tile reuses existing vocabularies wherever one exists — `ReachIcon` for reaches, entity art for items/factions/companions — and mints new glyphs only for category-level fallbacks, drawn from the card-glyph family.
3. **The delta cluster is the magnitude idiom:** filled triangles, ▲ ×1–3 for gains, ▼ ×1–3 for losses, in `--positive`/`--negative`; a gold ◆ for PATH (a way opens — it has no scale). This is the *same glyph family* as the encounter cards' penalty pips (▼), per Christian's condition that the aftermath use the iconography of the screens that precede it. The five-band word ladders in `aftermathWords.ts` stay untouched as **data**; only the display collapses to three steps (slight / clear / great). The banded words survive in the tooltip ("grew steadily" becomes hover detail, not the headline).
4. **The causality rule:** every authored chip sentence is **cause → change**, in that order — "Caught at the rail by a passing wanderer — Jorun the Wayfarer walks with her now." A consequence naming no cause from the scene is an editorial reject. Anti-example, by name, in the authoring rule: *"The bridge spent something on this crossing that it will not get back."*
5. **Derived chips stop pretending to be fiction.** Engine-generated changes (capability growth, reputation drift) render as a compact icon-first row — icon tile, `CATEGORY · NOUN` tag, delta cluster, no sentence; the banded word moves to the tooltip. The step that was rolled is their implicit cause. A **tier crossing** is genuinely a story beat and keeps a full chip.
6. **The palette rule:** all seven existing attachment categories (`possession`, `condition`, `blessing`, `curse`, `bestowed_power`, `agreement`, `spell`) plus the new `companion` category (sibling ticket) are legitimate consequence material, alongside quintessence shifts, faction standing, reach growth, and future hooks. Christian's examples (twisted ankle, loss of confidence, rescuing ally, guild gratitude, bridge-repair growth) are directional, not exhaustive. New categories are welcome **when the story earns them** — as a design decision with a plan-doc note, never ad hoc (CLAUDE.md load-bearing rule on new types).
7. **UI Law amendments ship in the same PR** (Laws 13 and 15; a clarifying sentence on 31). See UI pillar.
8. **Chevron/triangle approval is conditional** on reusing the encounter screens' glyph family — satisfied by decision 3.

## Substrate inventory

Everything this plan touches already exists and is **extended**, never rebuilt (THR-658 discipline):

| Substrate | State | This plan |
|---|---|---|
| `engine/aftermathWords.ts` — derived-sentence builders + band ladders (THR-1004) | ACTIVE | **extends** — builders additionally return the structure they already compute |
| `EncounterAftermathChange` / `EncounterAftermathConceptRef` (`types/unifiedAction.ts`) | ACTIVE | **extends** — optional structured fields |
| Aftermath chip taxonomy + adapter (`buildAftermathConsequences.ts`, THR-971) | ACTIVE | **extends/remaps** — six display kinds fold into four categories at the adapter |
| Quintessence events (`types/quintessence.ts`, `computeOutcomeConsequence`) | ACTIVE | **extends** — adds an *authoring* surface (`quintessence_shift` effect); the write path is reused |
| Attachment system, 7 categories + conditions with duration/modifiers (THR-761/718) | ACTIVE | **reused as-is** — palette rule points authors at it; no engine change |
| Aftermath reaction-effect vocabulary (THR-885 grants seam) | ACTIVE | **extends** — one new effect member |
| Tooltip registry / `ReachIcon` / entity-visual resolver | ACTIVE | **reused as-is** — four new registry entries, no new resolution path (Law 3) |

Nothing here is green-field; the one genuinely new system (companion attachments) is deliberately split to a sibling ticket.

## Engine pillar

### Systems design

The producer currently throws the structure away: `unifiedActionResolution.ts` calls `growthSentence()` and friends (`src/engine/aftermathWords.ts`), receives a finished English string, and ships it as `EncounterAftermathChange.detail`. The surface then cannot render an icon, a direction, or a magnitude because they no longer exist as data (the issue's Engine-pillar finding). The fix is additive:

- **Extend `EncounterAftermathChange`** (`src/types/unifiedAction.ts`) with optional structured fields:
  - `category?: 'scar' | 'bond' | 'boon' | 'path'` — producer-declared; absent ⇒ the adapter derives it from `kind` + `polarity` exactly as `classifyChangeKind` does today.
  - `stateNoun?: EncounterAftermathConceptRef` — the one concept that *is* the changed state (reach, faction, item, companion, standing). Distinct from `concepts` (which decorates the sentence): this one drives the icon tile and the tag.
  - `direction?: 'gain' | 'loss' | 'opens'` — explicit, never inferred from prose.
  - `magnitude?: { ladder: 'growth' | 'reputation' | 'tally'; band: number }` — the band index into the named ladder, as data. The display maps band → cluster size; the trace keeps the raw number as it always has.
  - `causeClause?: string` — authored chips only; enriched like `detail`.
- **`aftermathWords.ts` builders return the structure they already know.** `DerivedSentence` widens (additively) to carry `stateNoun`, `direction`, `magnitude` alongside `detail` + `concepts`. Every call site in `unifiedActionResolution.ts` copies them onto the change. The sentence keeps being built — it becomes the tooltip/aria text for derived chips, so THR-1004's numeral gate keeps its single address and nothing regresses if a surface ignores the new fields.
- **`quintessence_shift` consequence authoring surface:** Christian's "loss of confidence" example. `QuintessenceEvent` exists (`src/types/quintessence.ts`) but no encounter can *author* a shift as an aftermath effect. Add a `quintessence_shift` member to the aftermath reaction-effect vocabulary (`EncounterAftermathReactionEffect`), applied through the existing quintessence write path, surfaced as a SCAR/BOON by sign. This widens the same vocabulary card grants reuse (THR-885), so cards inherit it for free.
- **Injuries need no engine work:** a `condition` attachment with a duration edge and a negative reach modifier is already expressible end-to-end (THR-761 expiry, THR-718 stat contributions). The gap is content breadth, owned by the content ticket.

### Graph nodes / edges

None. No new node types, no new edge types. Attachment instantiation continues through the existing reward/attachment path. (The `companion` attachment category is deliberately **out of this ticket** — sibling ticket below — precisely because a person-shaped attachment needs its own design pass.)

### Tick phases

None changed. All work happens inside the existing resolution step (`unifiedActionResolution.ts` building `aftermathChanges`) and at render time.

### Resolution logic

Band→cluster display mapping, per ladder (constants table): bands 0–1 → 1 triangle, band 2 → 2, bands 3–4 → 3 for the five-band ladders; the four-band tally ladder maps 0→1, 1→1, 2→2, 3→3. Pure display arithmetic in the adapter, no engine change.

### PRNG callouts

None. No random draws anywhere in scope.

## Content pillar

### Encounter templates

No template *schema* change. The authored `changes` arrays in existing encounters keep working unmodified (all new fields optional). Rewriting the vertical-slice consequence *sets* under the causality rule — cause → change, palette breadth, no "something" — is the content ticket filed alongside this plan (extends the defect THR-1083 already owns on The Unsafe Bridge's TOLL line).

### Prose tables

**The authoring rule lands in the authoring surfaces, not just here:**
- `.claude/skills/encounter-pipeline/reference/nudge-authoring-spec.md` — new section *"Consequences — cause → change"*: every authored consequence names its state noun, declares `category`/`direction`/`stateNoun`, writes the cause from the scene into the sentence, and draws from the full palette (all attachment categories, conditions, quintessence, standing, growth, hooks). Anti-example quoted.
- `.claude/skills/template-encounter-rewrite/SKILL.md` — same rule, one paragraph, pointing at the spec section.
- The Encounter Factory (THR-1043, In Design) inherits the rule from the spec — its machine gates should count palette breadth; noted in its issue as a comment, not designed here.

### Attachment content

Out of scope here; the `companion` category and a broader injury/condition library ride the sibling tickets. This plan only guarantees the *rendering* of any attachment-shaped consequence: an attachment gained is a BOON (or SCAR when cursed/polarity-loss), named and iconed via its entity art.

### Data tables

Category tooltips registered in the tooltip registry (`ui.consequence.scar`, `ui.consequence.bond`, `ui.consequence.boon`, `ui.consequence.path`), ≤200 chars each (Law 18), written in the epic-tale register — e.g. SCAR: "What the trial cost them — an injury, a loss, a weight carried away from the scene. Scars heal or linger; either way the world remembers."

## UI pillar

*Screenshot tool: Playwright (the encounter veil is a DOM surface).*

### Player-facing display

`EncounterVeil.tsx`'s consequence block (lines ~641–765) renders the new anatomy:

- **Icon tile** (30px, Law 11 floor met): `stateNoun.visualKind` → `EntityVisual` tile (item/faction/agent/companion art or designed fallback); a reach noun → `ReachIcon`; no resolvable noun → the category glyph.
- **Tag:** `CATEGORY · NOUN` (e.g. `SCAR · TWISTED ANKLE`), category tint on tag + left border.
- **Sentence:** authored chips render `causeClause`-led prose through the existing linker/concept decoration; derived chips render the compact label row instead, sentence demoted to tooltip.
- **Delta cluster:** right-aligned triangles per decision 3, ≥14px (Law 11), `aria-label` stating the reading in words ("Stone grew — a clear amount"), words from the existing ladders.
- **Category legend** on first contact (Law 12): one row under the chip list, the THR-972 pattern, dismiss-persistent via the Law 51 preference store.
- **Category tint is not polarity** (Law 31): gain/loss is carried by the cluster in `--positive`/`--negative` + the aria words; category color rides only the tag/border and is accompanied by the category word.

Laws engaged, for the executor's judgment line: **1, 2, 12, 13, 14, 15, 17, 21, 31, 37** (chip in the Law-37 chrome).

**Law amendments in the same PR** (`Docs/design-system/laws.md` + one `Docs/changelog.md` line each, per the change protocol; ratified by Christian in this session's chat):
- **Law 13** gains: *"Consequence chips render magnitude visually — the delta cluster, three rough steps banded from the data ladders — with the banded word in the tooltip. A visual magnitude is not a raw numeral; the numeral ban stands."*
- **Law 15** rescopes: pips mean odds and price on the card surfaces; the **delta cluster** (triangle family) is the sanctioned magnitude glyph language for *state changes*, per Law 10's distinct-meanings rule. Two languages, two meanings, one glyph family.

### Event notifications

None new. The aftermath surface is already interrupt-registered; chips are part of it.

### Debug inspection (DebugPanel)

`window.__DEBUG` aftermath accessors already expose the change set; the structured fields ride along automatically (they live on `EncounterAftermathChange`). The prose-quality audit surface should assert the causality rule's machine-checkable half: no authored `detail` matching the evasive lexicon (`something` is already banned by THR-899's scoped lexicon — cite, don't duplicate).

### Visual presence (HexMapV2)

N/A — no map surface in scope.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `engine/aftermathWords.ts` (structure out) | resolution (existing) | — | — | existing resolution traces keep raw deltas | existing |
| `engine/unifiedActionResolution.ts` (copy fields) | resolution (existing) | — | `unifiedActions[].aftermathSummary` | unchanged | `__DEBUG` aftermath accessors |
| `types/unifiedAction.ts` (additive fields) | — | — | — | — | — |
| `adapters/buildAftermathConsequences.ts` (4-category mapping, cluster) | — | `EncounterVeil` | — | — | styleguide sample |
| `EncounterVeil.tsx` (chip anatomy, legend) | — | itself | — | — | Playwright + screenshot |
| tooltip registry (4 entries) | — | `Tooltip` | — | — | tooltip validation test |

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `CONSEQUENCE_CATEGORY_LABELS` | `SCAR / BOND / BOON / PATH` | the four player-facing category words |
| `CONSEQUENCE_CATEGORY_GLYPHS` | one glyph per category (card-glyph family) | icon-tile fallback when no entity/reach resolves; keyed on the category union so a new category without a glyph is a type error (Law 9) |
| `DELTA_CLUSTER_MAX` | `3` | most triangles a cluster draws |
| `DELTA_CLUSTER_BAND_MAP.growth` | `[1,1,2,3,3]` | five-band growth ladder → cluster size |
| `DELTA_CLUSTER_BAND_MAP.reputation` | `[1,1,2,3,3]` | five-band reputation ladder → cluster size |
| `DELTA_CLUSTER_BAND_MAP.tally` | `[1,1,2,3]` | four-band tally ladder → cluster size |
| `DELTA_GAIN_GLYPH` / `DELTA_LOSS_GLYPH` | `▲` / `▼` | the triangle family (matches penalty-pip family) |
| `PATH_MARKER_GLYPH` | `◆` | PATH's scale-less marker, veil gold |
| `DELTA_CLUSTER_GLYPH_SIZE_PX` | `14` | Law 11 legibility floor |
| `CONSEQUENCE_LEGEND_STORE_KEY` | namespaced pref key | Law 51 — legend dismissal survives the session |

## Tracing

No new trace types: every consequence already originates from traced resolution events carrying the raw deltas, and the new fields are a re-presentation of that same data (NFP #2 satisfied at the existing addresses). The one addition is an assertion surface, not a trace: the aftermathWords tests extend to pin that every builder returns `stateNoun` + `direction` + `magnitude` alongside its sentence.

```ts
// Extended shape returned by every derived-sentence builder (aftermathWords.ts)
interface DerivedChange /* extends DerivedSentence */ {
  detail: string;                       // existing — becomes tooltip text on derived chips
  concepts: readonly EncounterAftermathConceptRef[]; // existing
  stateNoun: EncounterAftermathConceptRef; // NEW — drives icon tile + tag
  direction: 'gain' | 'loss';           // NEW
  magnitude?: { ladder: 'growth' | 'reputation' | 'tally'; band: number }; // NEW
}
```

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| Change carries no `category` (all pre-existing content) | adapter derives from `kind` + `polarity` via the existing `classifyChangeKind` table, remapped: prize→boon, standing→bond, toll/wound→scar, seed→path, mark→polarity rule below |
| Unknown/unclassifiable `kind` | by polarity: `gain`→BOON, `loss`/`mixed`→SCAR, `info`→PATH — never a blank, never a fifth bucket |
| No `stateNoun` resolvable | icon tile draws the category glyph; tag shows category alone — the pre-THR-1004 behaviour, still designed |
| `magnitude` absent (e.g. attachment gained, gate shifted) | single triangle (direction only) — EH's "impair ☉" case: noun + direction is legible with no scale |
| `magnitude.band` out of ladder range | clamp to cluster map bounds, warn once |
| `causeClause` present but enrichment fails | render `detail` alone — a plain sentence beats a broken weld |
| Legend preference store unavailable | legend renders every time — noisy beats missing (Law 12) |

## Blast Radius

| File | Importer count | Cascade-risk note |
|------|---------------|-------------------|
| `src/types/unifiedAction.ts` | 278 importers | **additive optional fields only** — no existing field changes shape or meaning, no signature changes; the identity-preserving pattern THR-969 already proved on this exact type (pinned by an identity assertion then; the executor should pin the same way) |

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar present
- [x] UI pillar present
- [x] Wiring section connects them

## Interface impact

| Contract | Touch | Note |
|---|---|---|
| aftermath payload, engine→UI (`aftermathSummary` read path, incl. `player-action-aftermath-read`) | **extend** | additive fields on `EncounterAftermathChange`; production read site is the veil adapter (exists) |
| card grants vocabulary (`EncounterAftermathReactionEffect`) | **extend** | new `quintessence_shift` member; read site is the existing aftermath reaction applier |
| `aftermathWords` builder contract | **extend** | builders return structure + sentence; all callers in `unifiedActionResolution.ts` updated in the same PR |

## Vision audit

- [x] This plan does not contradict any Vision premise — it *implements* two: consequences personal-first (Christian, 2026-08-12) and the player-as-god reading mortals' stories. The lyrical-register rejection is respected: cause→change sentences are plain, picturable, event-anchored.
- [x] No Vision edit is required — nothing here changes a premise; the personal-first consequence rule is director direction recorded in this plan and the authoring spec, and graduating it into a Vision file is a separate editorial decision this ticket does not take.

## Rulebook impact

- [x] No rule of play changes — outcome bands, resolution, and what consequences *do* are untouched; this changes what they *say* and how authors choose them.
- [x] `Docs/canon/rulebook.md` needs no update — the palette rule is an authoring norm, recorded in the authoring spec, not a rule of play.

> Brainstorm companion: `Docs/plans/2026-08-12-thr-1082-consequence-language-brainstorm.md` (written alongside).

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | every threshold, glyph, and map in the constants table; ladders stay the existing named constants |
| 2. Inspectability | PASS | raw deltas stay on existing traces; structure now survives to the surface instead of dying in a string |
| 3. Determinism | PASS | no random code anywhere in scope |
| 4. Fail-soft | PASS | see table; MARK's fail-soft duty is inherited by the polarity rule |
| 5. Narrative over mechanical perfection | PASS | the whole plan is this NFP — cause→change, personal-first |
| 6. Additive over destructive | PASS | every type change optional-additive; sentence builders keep returning sentences; old content renders unmodified |
| 7. Performance budget | PASS | render-time mapping over ≤10 chips; no measurable cost |

## Done when

- [ ] The four-category taxonomy renders on the aftermath surface with registered tooltips and a first-contact legend; MARK no longer renders anywhere
- [ ] Every consequence chip shows an icon tile, a `CATEGORY · NOUN` tag, and a delta cluster (or PATH marker); no chip's headline is a bare adverb sentence; nothing says "something"
- [ ] Derived changes (growth, reputation drift) render icon-first with the banded word in the tooltip; tier crossings keep a full chip
- [ ] `EncounterAftermathChange` carries `category` / `stateNoun` / `direction` / `magnitude` as data; `aftermathWords` builders return them; the numeral gate still passes
- [ ] `quintessence_shift` is authorable as an aftermath effect and renders by sign
- [ ] The causality rule + palette rule are in `nudge-authoring-spec.md` and `template-encounter-rewrite/SKILL.md`, with the anti-example quoted
- [ ] Laws 13 and 15 amended (+ Law 31 clarifying sentence), changelog lines naming the law numbers
- [ ] Browser evidence at 1920×1080 (Playwright), **two encounters × two outcome bands**, Laws judgment citing 1, 12, 13, 14, 15, 17, 21, 31, 37
- [ ] `npm test` and `npx vite build` pass; types via `tsc -b` net-new diff
- [ ] Closing commit body includes `Fixes THR-1082`

## Kill criteria

How we will know this design was wrong, and what happens then:

- **The anatomy failed:** playtest/screenshot review still cannot answer "what changed and roughly how much" per chip *without hovering*. Then the taxonomy/cluster get a second design pass before any content investment (THR-1097 pauses).
- **The taxonomy is too small:** the polarity fallback (unknown→BOON/SCAR/PATH) fires routinely in real content — visible in the adapter's warn-once logs. Then the taxonomy grows a deliberate fifth category via this plan's own new-category rule (design decision, plan-doc note), never by resurrecting MARK.

Both are display-layer reversals; the structured data fields stay valid either way (NFP #6).

## UL note — the four category words

SCAR / BOND / BOON / PATH enter **author-facing** vocabulary in this PR (authors declare `category` per the authoring spec), not just display copy — so a `UL-proposal` issue is filed alongside this plan (see handoff) to seat them in the Encounters shard. THREAD was rejected for the fourth word precisely because the UL already owns it (god↔mortal bond).

## Coordination block

**Suggested model:** `opus` — multi-pillar restructure across a 278-importer type, the veil, and the derived-sentence engine seam.

**Parallel-safe with:** issues not touching `unifiedAction.ts` types, `aftermathWords.ts`, `unifiedActionResolution.ts` aftermath block, `buildAftermathConsequences.ts`, or `EncounterVeil.tsx`.

**Mutex with:** THR-1083 (both touch vertical-slice consequence text); THR-1096 companion category (both touch the attachment/consequence seam); any ticket editing `EncounterVeil.tsx`. THR-1097 (content sweep) is **blocked by** this ticket, not parallel.

**Files to touch:**
- Edit: `src/types/unifiedAction.ts` (additive fields on `EncounterAftermathChange`; `quintessence_shift` effect member)
- Edit: `src/engine/aftermathWords.ts` (builders return structure)
- Edit: `src/engine/unifiedActionResolution.ts` (copy structure onto changes)
- Edit: `src/components/Game/encounter-stage/adapters/buildAftermathConsequences.ts` (4-category mapping, cluster derivation)
- Edit: `src/components/Game/encounter-stage/types.ts` (chip model fields)
- Edit: `src/components/Game/EncounterVeil.tsx` (chip anatomy, legend)
- Edit: tooltip registry data (4 category entries)
- Edit: `Docs/design-system/laws.md`, `Docs/changelog.md` (amendments)
- Edit: `.claude/skills/encounter-pipeline/reference/nudge-authoring-spec.md`, `.claude/skills/template-encounter-rewrite/SKILL.md` (causality + palette rules)
- Tests: extend `aftermathWords.test.ts`, `buildAftermathConsequences.test.ts`; identity assertion on pre-existing content rendering

## Notes for the executor

- **Do not rename the six `EncounterStageConsequenceKind` values in one big-bang sweep of test fixtures** — map at the adapter, keep the wire kinds, and let `category` be the display truth. The engine's `kind` union (`growth`/`trait`/`item`/…) is untouched either way.
- **Do not reuse `OddsPips` for the delta cluster** — Law 10. Same glyph *family*, separate component, separate constants.
- The THREAD name for PATH was considered and rejected — it collides with the core thread (god↔mortal bond) vocabulary. Do not resurrect it in copy or tooltips.
- The word ladders (`GROWTH_MAGNITUDE_BANDS` etc.) are data other systems may band against — do not collapse them to three rungs; only the display map is three-step.
- Category tint choices should come from existing tokens; if a fourth family color is needed (BOND's blue in the mock), it enters as a named token per Law 30, not a local hex.
- Christian ratified the Law 13/15 amendments in chat this session (2026-08-12); record `human gate satisfied via chat review 2026-08-12` in the Linear comment when they land.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-08-12*

### NFP audit

| NFP | Verdict | Evidence |
|---|---|---|
| 1. Tunability | PASS | Constants table names every threshold/glyph/map (`DELTA_CLUSTER_MAX`, `DELTA_CLUSTER_BAND_MAP.*`, glyphs, legibility floor); existing word ladders left as named data, not hardcoded. |
| 2. Inspectability | PASS | No new trace types, but raw deltas remain on existing resolution traces; the previously string-only `detail` now survives as structured `stateNoun`/`direction`/`magnitude` on `EncounterAftermathChange`. Wiring table's Debug-visibility column is populated for every row. |
| 3. Determinism | PASS | "PRNG callouts: None. No random draws anywhere in scope"; confirmed no RNG touch in Resolution logic section. |
| 4. Fail-soft | PASS | Explicit 7-row fail-soft table covers missing category, unclassifiable kind, unresolved noun, absent magnitude, out-of-range band, failed cause-clause enrichment, and unavailable legend store — none default to blank/throw. |
| 5. Narrative over mechanical perfection | PASS | Plan's stated purpose; causality rule (cause→change) and anti-example are load-bearing design content, not decoration. |
| 6. Additive over destructive | PASS | All new schema fields optional; old content renders unmodified via adapter-derived fallback. "MARK dies" is a *display*-taxonomy retirement only — wire `kind` values are explicitly preserved and MARK's fail-soft duty is inherited by a polarity rule. |
| 7. Performance budget | PASS | Render-time mapping over ≤10 chips; scale is trivially bounded. |

`NFP AUDIT: PASS`

### Three-pillar audit

| Pillar | Verdict | Finding |
|---|---|---|
| Engine | present-and-substantive | Systems design names exact files, specifies additive fields with types, covers graph nodes/edges (N/A, justified), tick phases (none changed, justified), resolution logic (band→cluster map), PRNG (none, stated). |
| Content | present-and-substantive | Encounter templates (schema-unchanged, sibling ticket cited), prose tables (two authoring-surface files named with the exact new section), attachment content (scoped out, rationale given), data tables (4 tooltip entries with char cap). |
| UI | present-and-substantive | Player-facing anatomy specified down to pixel sizes and Law citations, screenshot tool stated (Playwright), event notifications (N/A justified), debug inspection (concrete `__DEBUG` tie-in), visual presence (N/A, HexMapV2 out of scope, justified). |

Missing required sections: none. Wiring table matches the checklist's six-column format and concretely connects engine producers to the UI adapter/veil and debug/tooltip surfaces. Substrate-existence check (THR-658): `## Substrate inventory` present; cross-checked against `systems-inventory.md` — all touched systems correctly identified as existing and extended, not rebuilt; no green-field duplication detected.

`PILLAR AUDIT: PASS`

### Vision audit

Premises touched: `02-non-negotiables.md` → "Narrative over mechanical perfection" — silent (named without file citation); the plan's own Vision-audit section invokes "player-as-god reading mortals' stories" and the lyrical-register rejection, both asserted from director chat + canon rather than cited to Vision file paths. No contradictions found. Qualitative checks: north star not engaged directly (presentation/data-shape fix); core loop unengaged (no change to resolution, tick phases, or intervention mechanics — purely how outcomes are *reported*); god/protagonist separation holds (chips describe consequences happening *to mortal characters* the player-god observes/shapes); design tensions and taste profile not engaged.

`VISION AUDIT: PASS-with-notes — no contradiction found, but the plan's self-declared Vision compliance rests on assertion rather than citation; north star, core loop, design tensions, and taste-profile go unaddressed.`
