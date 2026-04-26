# THR-253 — Chain Weakens Prose Polish Pass

**Linear:** THR-253 · **Project:** Social Systems Expansion · **Created:** 2026-04-24 · **Author:** Cowork (autonomous scheduled session)

## Context

THR-225 shipped the phased event-activation runtime for `the-chain-weakens`. THR-254 wired the phase runner to the story-beat template registry, migrated all five Chain Weakens story-beat templates to dual-voice (`poetProse` + `witnessFacts`), set `defaultVoice` per phase, and made ChronicleEntries render dual-voice automatically via the existing `ChronicleEntryCard` (THR-155). The templates in `src/data/story-beat-templates/chain-weakens.ts` currently carry **placeholder-plus prose** — sufficient to render dual-voice correctly, acknowledged as below the Threadbare quality bar. THR-253 is the polish pass.

This is a **narrow content task**. The engine wiring is shipped. The voice allocation is fixed. The phase IDs, sphere values, mood values, and `defaultVoice` hints are fixed. Only the prose strings change — `title`, `poetProse`, and `witnessFacts[]` on each of five templates.

## What "done" looks like

Five Chain Weakens story-beat templates — `chain-weakens-rumor`, `chain-weakens-plague-bringer`, `chain-weakens-shield-anvil`, `chain-weakens-azath-cracks`, `chain-weakens-reckoning` — have Poet voice and Witness bullets that meet the Threadbare aesthetic bar: every Poet line lands one sensory hit plus one implication in present tense, ≤2 sentences; every Witness bullet is a concrete verifiable fact (who, what, where, how many); no bullet merely restates what the Poet line already carried. The dramatic arc escalates legibly across the five phases (rumor → herald → counter-force → crack → reckoning). No engine change. No UI change. No test change beyond structural invariants re-asserted.

## Three-pillar overview

### Engine pillar

**N/A.** THR-254 shipped `lookupStoryBeatTemplate`, the phase runner's `makePhaseChronicleEntry`, the `composition.story_beat_template_missing` trace, and the `STORY_BEAT_DEFAULT_*` constants. `CompositionStoryBeatTemplate`'s shape is fixed. Rationale for N/A: the polish only edits string contents of literal object properties that already parse, already serialize, already render. No new trace emitted. No new constant introduced. No new predicate or registry entry. No new fail-soft path.

### Content pillar

**The core of the work.** Rewrite `title`, `poetProse`, and `witnessFacts[]` on all five templates in `src/data/story-beat-templates/chain-weakens.ts` to the Threadbare aesthetic bar. Authoring constraints and per-phase briefs below. No other file is edited in this ticket.

### UI pillar

**N/A for component changes. Verification only.** `ChronicleEntryCard` already renders `poetProse` as italic display serif and `witnessFacts` as a bullet list, gated by the user-selected voice toggle. Phased-event entries flow through the same `state.chronicleEntries` array as any other Chronicle event. The verification check (below) is a manual 1920×1080 screenshot at the Chronicle panel after one phase activation, to confirm the polished prose renders correctly in both voice modes.

## Authoring constraints

These constraints are load-bearing and non-negotiable. Every rewritten template must satisfy all of them.

### Threadbare aesthetic (from `prose-pipeline` skill)

- Dark world, hidden magic, threads that break through.
- Short, declarative sentences with one vivid detail.
- No exclamation marks, no breathless enthusiasm.
- Wear and age over polish and perfection.
- The uncanny over the fantastic.
- Dry wit over comedy; irony over sentimentality.

### Poet voice rules (one-paragraph cosmic register)

- **One or two sentences.** No more.
- **Present tense.** This is happening now, perceived now.
- **One sensory hit plus one implication.** Not two hits. Not three. The sensory hit should be uncanny — the thing that isn't quite right — not the grand fantastic.
- **No abstract nouns doing the work.** Prefer a concrete body (a warden, a glyph, a road) over a generalization ("the realm", "the people", "destiny").
- **≤ 35 words.** The current placeholders are 25–40 words — tighten at the long end.
- **No em-dashes in Poet prose chained to more than one clause.** Use one, use it well. (Witness bullets may use em-dashes more freely.)
- **Never name the ascendant.** Poet voice is narrated *near* the ascendant's perception but not *as* them.

### Witness voice rules (grounded factual bullets)

- **3–5 bullets.** 4 is the default target; a 3-bullet phase must earn the brevity; 5 is the ceiling.
- **Each bullet is a single concrete fact.** A verb + a specific object/place/actor count. "Vegetation along the route dies in a precise band" not "The land suffers."
- **No bullet restates a fact the Poet line already carried.** The Poet line and the bullets together should form a complete scene, not two angles on the same sentence.
- **At least one bullet in every mortal-voice phase names a specific actor or title** (a warden, a champion, a scout, a named order). Mortal voice is grounded.
- **Bullets are complete sentences ending with a period.** No ALL-CAPS, no bold. No mid-bullet em-dash chains longer than one clause.
- **Order matters.** Earlier bullets establish the fact; later bullets carry the consequence or the hook for the next phase.

### Arc coherence

The five phases form one dramatic arc. Each phase's prose must honour the phase it stands in. The cadence:

| Phase | Role in arc | Register | Forward hook to next phase |
|---|---|---|---|
| 1. Rumor | Disturbance named by no one | Divine — quiet, speculative | Mortals think the word without saying it. |
| 2. Plague-bringer | The thing arrives in a body | Divine — concrete, dread-tinged | A figure now walks the roads. |
| 3. Shield-Anvil | A counter-force rises | Mortal — resolute, grounded | Someone is now between it and the world. |
| 4. Azath cracks | Structural irreversibility | Divine — catastrophic | Containment is no longer complete. |
| 5. Reckoning | Named, organised, begun | Mortal — determined | Doctrines wake; action begins. |

Each Poet line should carry a different species of unease: bond slackening (1) → body arriving (2) → oath waking (3) → structure failing (4) → naming and resolve (5). If two consecutive phases feel tonally interchangeable, revise.

### Sphere and mood are fixed (do not change)

| id | sphere | mood | defaultVoice |
|---|---|---|---|
| `chain-weakens-rumor` | `entropy` | `uneasy` | `divine` |
| `chain-weakens-plague-bringer` | `entropy` | `dread` | `divine` |
| `chain-weakens-shield-anvil` | `order` | `resolute` | `mortal` |
| `chain-weakens-azath-cracks` | `entropy` | `catastrophic` | `divine` |
| `chain-weakens-reckoning` | `order` | `determined` | `mortal` |

These fields are authoritative; THR-254 ratified them. Polish touches only `title`, `poetProse`, `witnessFacts`.

### Titles

Keep the `"The Chain Weakens — {Subtitle}"` shape. Subtitle may change if a better one serves the phase; keep the em-dash spelled as the Unicode em-dash (`—`), not a hyphen. Titles are rendered as the Chronicle entry heading; keep them under 40 characters after the em-dash. Current subtitles ("Whispers", "The Herald Arrives", "A Counter-Force Rises", "The Structure Cracks", "The Reckoning") are all in the right zone; rewrite only if the new prose demands it.

### Unicode and quoting

- Use Unicode em-dash (`—`, U+2014), curly quotes (`'` U+2019 for apostrophe, `"` `"` U+201C/U+201D for quoted terms). The current file uses `\u2014`, `\u2019`, `\u201C`, `\u201D` escapes — keep that convention.
- Internal double-quoted terms inside a JS single-quoted string (e.g. `"plague-bringer"`) must be Unicode curly quotes to avoid the escape-the-escape noise. Example from current file: `\u201cplague-bringer.\u201d`.
- No trailing whitespace inside strings. No leading/trailing blank lines in `witnessFacts` arrays.

## Per-phase briefs

Each brief names the job the phase does in the arc, the sensory hit the Poet line should carry, and the facts the Witness bullets must land. These are briefs, not dictation — the writer finds the line that satisfies the brief.

### Phase 1 — `chain-weakens-rumor` (divine, entropy, uneasy)

**Job:** Something has changed and no one has the word for it yet.
**Poet brief:** One sensory absence (a note going slack, an air turning wrong, a charm loosening) plus the fact that multiple places feel it without anyone having communicated. Uncanny, not dread. The word "chain" should *not* appear in Poet voice here — that arrives later.
**Witness bullets brief:** A fact that proves the spread (settlements without a shared road), a fact that proves the physical cost (a warden's warding cracks, a ward-stone splits), and a fact about the word withheld (no one says it; they think it). The current placeholder hits these beats; polish is about verb strength and specificity. Consider naming a warden (even as a title, not a proper name).

### Phase 2 — `chain-weakens-plague-bringer` (divine, entropy, dread)

**Job:** The rumor now has a body walking the roads.
**Poet brief:** A figure on the night roads; one verb for what it leaves in its wake (wither, blacken, hush); the moment a mortal names it and the air *admits* the word. This is the line where the naming happens — the Poet voice carries it because the act of naming is the cosmic event.
**Witness bullets brief:** Multiple witness facts across ≥2 roads in one watch (spread + speed), the physical trail (dead vegetation in a precise band — *precise* is the Threadbare detail, not "widespread"), the warden's public naming (quote the word), the shift from rumor to fact. A fourth bullet should carry a hook — e.g. the figure has not been stopped.

### Phase 3 — `chain-weakens-shield-anvil` (mortal, order, resolute)

**Job:** A counter-force answers. Ground-level. Embodied.
**Poet brief:** This phase is mortal-lead but the Poet line should still exist (both voices populate every template). The Poet line here is the *oath* — an old thing waking in a living throat. Short. One clause for the oath's age, one clause for the throat. Do not name the champion.
**Witness bullets brief:** A champion takes the field (name the forgotten order by title — no proper name required); the Shield-Anvil burden is explicitly assumed (absorb harm into oneself); local aid organises behind the champion; a beat that concedes the chain is *still* weakening — the rise is a counter-force, not a cure. Mortal voice earns its concreteness here; make every bullet visible.

### Phase 4 — `chain-weakens-azath-cracks` (divine, entropy, catastrophic)

**Job:** Containment fails along a single line. Irreversibly.
**Poet brief:** A sound felt in the bones; a glyph fracturing along a line no tool could have cut; a statement of what was held becoming no-longer-fully-held. Keep "the Azath glyph" or equivalent concrete noun — the crack happens to a specific object, not to "the world".
**Witness bullets brief:** The glyph visibly cracks along a single line (specificity: one line, not many); containment is now incomplete; some of what was held is now out but not all; a beat that makes the irreversibility plain. The current placeholder's "This moment will not be undone." is strong — keep a beat like that. Four bullets is the target. No fifth bullet unless it earns its place.

### Phase 5 — `chain-weakens-reckoning` (mortal, order, determined)

**Job:** The order names what has happened and begins.
**Poet brief:** The order has watched the crack; they remember what their oath meant when it meant something; they speak the name of the event, and the speaking starts the work. Mortal-lead phase, so Poet voice is slightly quieter here — let the Witness bullets do the main narrative lift.
**Witness bullets brief:** The order (name the order by title — "the divine-champion order" is the current placeholder; consider whether there is a more specific title the world has given them) witnesses the glyph-crack; they publicly name the event ("The Chain has broken" or similar — the specific quoted phrase is the hook); mandates change or old doctrines wake; a reckoning has begun. This phase closes the arc; the final bullet should feel like a door opening, not closing.

## Worked example (illustrative — not prescriptive)

To calibrate the bar, here is one possible revision of the rumor phase. The writer is free to find a better line; this is shown to demonstrate what "polish to bar" means against the current placeholder.

**Current (placeholder-plus):**

> Poet: *A note in the weave goes slack. Not a sound, not yet — a looseness where a bond used to hold. The air in three settlements turns wrong before anyone remembers why.*
>
> Witness:
> - Rumors surface in settlements with no shared road.
> - A warden's charm cracks in its stone box.
> - No one yet says the word "chain." They think it.

**One possible polish (illustrative):**

> Poet: *A bond in the weave goes slack — not broken, only loose — and three roads of unrelated villages wake with the wrong air in their lungs.*
>
> Witness:
> - The rumor surfaces in villages that share no road, no trade, no faith.
> - An old warden's ward-stone splits down its long axis inside its iron box.
> - The word "chain" is not yet spoken. It is already thought.
> - No one has named what has changed. Only that something has.

Note what the polish did:
- Poet tightened from 3 sentences to 1; kept the *looseness where a bond used to hold* image but made it active; added the "wrong air in their lungs" for a sensory hit to mortals.
- Witness bullet 1 got specific (*no road, no trade, no faith* — a Threadbare-style triplet).
- Bullet 2 strengthened "charm cracks" to a specific object (ward-stone) and a specific failure mode (split down its long axis).
- Bullet 3 preserves the withholding of the word.
- New bullet 4 carries a hook — "something has changed, not yet named" — which sets up phase 2's naming.

The writer should **not** copy this worked example. It is shown to calibrate. The writer's own lines may be shorter, or drop a bullet, or pick a different detail. The bar is what matters, not the words.

## Constants table

No new constants. NFP #1 trivially satisfied (the polish does not introduce tuning dials).

## Tracing

No new trace types. The existing `composition.phase_activated` trace continues to fire with `voiceHint` and `templateResolved: true` — the polish does not alter any trace payload. NFP #2 trivially satisfied.

## Fail-soft table

| Failure | Behaviour |
|---|---|
| Writer leaves a template with empty `poetProse` and empty `witnessFacts` | Existing test `all templates have at least one of poetProse or witnessFacts` (see `src/data/story-beat-templates/__tests__/index.test.ts`) fails. Blocks merge. |
| Writer accidentally sets `sphere: 'void'` during edit | Existing test `no template uses sphere:void` fails. Blocks merge. |
| Writer removes a template id | Existing test `has exactly 5 Chain Weakens templates` fails. Blocks merge. |
| Writer edits `title` or prose in a way that breaks UTF-8 escapes | `npx tsc --noEmit` fails at parse. Blocks merge. |
| Runtime — template renders with newly polished strings | No behavior change; `ChronicleEntryCard` renders whatever strings it finds. |

The polish is fail-soft by construction: every failure mode is caught by the existing static structural tests or by `tsc`. No runtime fail-soft path is added.

## Wiring checklist

Per `Docs/plans/wiring-checklist.md`:

| Surface | Status | Notes |
|---|---|---|
| Orchestrator phase | unchanged | `phaseComposition` slot untouched. |
| GameState field | unchanged | No new fields. |
| Engine module | unchanged | No engine file edited. |
| Content registry | unchanged | `STORY_BEAT_TEMPLATE_REGISTRY` still contains the same 5 ids. |
| Trace categories | unchanged | No new or extended traces. |
| UI component | **verified** | `ChronicleEntryCard` renders polished prose in both voice modes; manual 1920×1080 screenshot attached. |
| Player controls | unchanged | Voice toggle pre-exists. |
| Debug bridge | unchanged | No new `window.__DEBUG` method. |
| Prose pipeline | unchanged | Story-beat templates are static; not `enrichProse()` targets. |
| Systemic wiring guide | unchanged | THR-254 already added the "Phase story-beats" subsection. |

## Non-Functional Priorities — compliance

| NFP | Status | Note |
|---|---|---|
| 1. Tunability | PASS | No new constants. No magic numbers introduced. |
| 2. Inspectability | PASS | Existing traces carry full context; no change. |
| 3. Determinism | PASS | Static literal edits. No PRNG touched. |
| 4. Fail-soft | PASS | All failure modes caught by existing structural tests or `tsc`. |
| 5. Narrative over mechanical perfection | PASS | The ticket *is* narrative polish. |
| 6. Additive over destructive | PASS | Only string contents change. Types, ids, spheres, moods, voices unchanged. |
| 7. Performance budget | PASS | String-length changes are negligible; templates are built at module load. |

## Rejected approaches

- ❌ **Change voice allocations** (e.g. flip phase 3 to divine). THR-254 ratified the allocations; changing them is a separate design decision, not a polish task.
- ❌ **Add new story-beat templates or phases.** Out of scope. If the polish reveals a missing phase, file a new ticket — do not smuggle it into this one.
- ❌ **Add enrichment placeholders** (`{warden}`, `{order}`, etc.) to Poet/Witness strings. Story-beat templates are static content, not `enrichProse()` targets; introducing placeholders would require resolver work that THR-254 explicitly left out of scope (Wiring checklist row "Prose pipeline: N/A"). Keep the static strings static; name specific actors only by title or role. If a future ticket introduces an event-scoped enrichment pass, polish can retrofit it then.
- ❌ **Touch the Chain Weakens recipe file** (`src/composition-dsl/examples/event-chain-weakens.recipe.ts`). Recipe is already correct per THR-254; do not edit it.
- ❌ **Rewrite `ChronicleEntryCard`** rendering. The card renders dual-voice correctly. If the polished prose reveals a rendering bug, file a new ticket; do not patch the card in this one.
- ❌ **Add snapshot tests on prose strings.** Snapshot tests lock prose to its current form, making the next polish pass painful. Rely on the existing structural tests (has poetProse, has witnessFacts, count = 5, sphere ≠ void).

## Test plan

No new tests are required. The existing suite covers the structural invariants:

- `src/data/story-beat-templates/__tests__/index.test.ts`
  - Registry contains all Chain Weakens template ids.
  - Exactly 5 Chain Weakens templates.
  - Every template has `poetProse` OR `witnessFacts.length > 0`.
  - No template uses `sphere: 'void'`.
- `src/engine/__tests__/phaseComposition.chainWeakens.test.ts` — phase activation integration for the Chain Weakens recipe (existing).
- `src/engine/__tests__/phaseComposition.test.ts` — phase runner wiring to story-beat templates (existing).
- `src/composition-dsl/__tests__/schema.dualvoice.test.ts` — dual-voice schema (existing).

**Required pre-commit per CLAUDE.md §Testing:**

1. `npm test` — all tests pass. Structural tests listed above must stay green.
2. `npx tsc --noEmit` — type check clean (catches malformed Unicode escapes).
3. `npx vite build` — production build succeeds.
4. `npm run check:process` — advisory workflow lint.

**Manual verification (one screenshot):**

5. Run `?view=game&seeded`. Use `window.__DEBUG` or `?view=cms` to inspect the Chain Weakens templates, or let the doom clock advance at least one tier. Open the Chronicle panel. Toggle voice modes: **poet-only** (italic paragraph visible, bullets hidden), **witness-only** (bullets visible, paragraph hidden), **interleaved** (both visible). Take a 1920×1080 screenshot showing at least the phase-2 entry (`The Chain Weakens — The Herald Arrives`) with the polished prose. Attach to the PR.

If the Chronicle panel does not surface a Chain Weakens entry during manual verification (e.g. the doom clock isn't advancing in the seeded scenario), fall back to visual inspection via `?view=cms` if a story-beat viewer exists, or emit a deferral issue (`// TODO(THR-XXX): __DEBUG helper to force phase activation`) and note it in the PR body. Do not block the polish on a non-existent debug helper.

## Acceptance criteria

- [ ] `src/data/story-beat-templates/chain-weakens.ts` edited: all five templates have polished `poetProse` and `witnessFacts`; `title`, `sphere`, `mood`, `defaultVoice`, and `id` on each template are unchanged.
- [ ] The `TODO(THR-253)` comments at the top of the file and above `chain-weakens-reckoning` (lines 19 and 81 in current file) are removed, since the polish lands in this commit.
- [ ] Every Poet line ≤ 2 sentences and ≤ 35 words.
- [ ] Every Witness bullet array has 3–5 entries.
- [ ] Every mortal-voice template (`chain-weakens-shield-anvil`, `chain-weakens-reckoning`) names at least one specific actor by title or role in Witness bullets.
- [ ] No bullet is a near-duplicate of its template's Poet line.
- [ ] Unicode em-dashes and curly quotes rendered via `\u2014`, `\u2019`, `\u201c`, `\u201d` escapes to keep the file consistent with its current convention.
- [ ] `npm test` green.
- [ ] `npx tsc --noEmit` clean.
- [ ] `npx vite build` succeeds.
- [ ] Manual verification screenshot attached to PR per §Test plan #5.
- [ ] Commit body contains `Fixes THR-253`.
- [ ] Post the raw terminal output of `npm test`, `npx tsc --noEmit`, and `npx vite build` (or a CI link for the same commit) in the closing commit body or Linear completion comment, per CLAUDE.md §Testing point 5.

## Out of scope (explicit)

- Engine edits of any kind (phase runner, traces, registry, schema).
- UI edits (ChronicleEntryCard, ChroniclePanel, debug panel).
- Adding enrichment placeholders to story-beat templates.
- Changing voice allocations, spheres, or moods.
- Adding a `__DEBUG` bridge helper to force doom-clock advancement (file a deferral if friction occurs during manual verification).
- Polishing prose on any other story-beat template (none exist today; if future compositions add templates, they polish in their own tickets).
- Adding new tests. Existing structural tests are sufficient.

## Vision audit

No Vision premise contradicted. This polish strengthens the "Dark world, hidden magic, threads that break through" tonal baseline at a visible player surface (the Chronicle, which is the primary narrative surface for phased doom events). The five-phase arc honours the turn-based pacing principle (each phase arrives at its own tier, each moment is turn-worthy). The work is a direct execution of the Threadbare aesthetic documented in `prose-pipeline` §Writing Guidelines and the `cowork-plugin-management` skill family's implicit quality bar. No new vision premise invoked; no existing premise revised.

## Sources

- [THR-253](https://linear.app/threadbare/issue/THR-253/chain-weakens-prose-polish-for-story-beat-templates-encounter-pipeline) — this issue.
- [THR-254](https://linear.app/threadbare/issue/THR-254) — dual-voice wiring (prerequisite, shipped).
- [THR-225](https://linear.app/threadbare/issue/THR-225/event-recipe-phased-activation-tied-to-doom-clock-tiers) — parent (Done).
- `Docs/plans/2026-04-24-chronicle-dual-voice-phased-events.md` — THR-254 plan doc; positions THR-253 as polish-over-authoring.
- `Docs/plans/2026-04-23-thr-225-event-recipe-phased-activation.md` — THR-225 plan doc; origin of the voice allocation table.
- `src/data/story-beat-templates/chain-weakens.ts` — the file this ticket edits.
- `src/data/story-beat-templates/__tests__/index.test.ts` — structural tests that gate the polish.
- `.claude/skills/prose-pipeline/SKILL.md` — Threadbare aesthetic guide (§Writing Guidelines).
- `.claude/skills/prose-content-systems/SKILL.md` — quality-enforcement prerequisite (§Content Quality Enforcement — READ FIRST).
- `Docs/plans/2026-04-16-systemic-wiring-guide.md` — systemic wiring context (polish preserves N/A-for-enrichment stance; no change required).
