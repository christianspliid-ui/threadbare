# Package critique — The Drowned Archive (Pass 3b)

> Slug: `the-drowned-archive` | Pass: 3b (package) | Date: 2026-08-25
> Judged against: `the-drowned-archive-final.md` (post-systems), `anchor-catalog.generated.md`,
> `nudge-authoring-spec.md` § Consequences (0, 0b, 0c, 0d, 1–4), `deep-places-brief.md`
> Batch sibling: `the-broken-seal-final.md` / `the-broken-seal-package.md` (slot 1)

templateId: encounter.delve.the_drowned_archive
packageVerdict: PACKAGE PASS
packageConnection: connected
packageLeaves: On the best ending the agent walks out with a clue about a real ruin somewhere in the world, and that clue is the strongest thing this encounter plants — the Adventurer's Guild reads it, and once the evidence at that ruin crosses its threshold with a guild hall within five hexes the guild posts a delve quest and a toast names the ruin and the direction to it, so the player watches a rumour they created turn into work somebody else takes; on the middle ending the vault's own settlement is marked Under Watch for a week of game time and that shows on the place's own sheet with a countdown, and its chip clicks straight through to that sheet, though nothing in the simulation yet acts on being watched; the keeper — a real person who stays in the world — ends up trusting the agent, or on the worst ending grieving the records they lost, both of which sit on their sheet; and every single ending mints an intelligence record the agent carries for the rest of their life, readable in the Intelligence section of their own sheet, which a later court, intrigue or ritual encounter will pick up as an advantage. That record does **not** know which settlement it is about — the engine has no way for an author to say so — and the shipped encounter no longer pretends otherwise: the five chips reporting it now point at the agent who carries it rather than at the settlement, so nothing sends the player to a place sheet where this ending wrote nothing, and the charter's tie to the ground it names lives in the chip's own sentence, where it is honest.

---

## Half A — every chip's referent

Ten chips across five bands. Every declaration checked against `classifyAnchorDeclaration`
(`src/data/content-eval/chipAnchorDeclarations.ts:86-137`) and every backing kind against
`CHIP_BACKING_EFFECT_KINDS` — against the **code**, not the catalog's prose, per the
standing warning that the two disagree.

| # | Chip | Band | Referent the sentence is about | In the catalog? | Declaration legal? | Prose names it? | Backed on this band? | Verdict |
|---|---|---|---|---|---|---|---|---|
| 1 | `archive.crit.charter_known` | `critical_success` | The intelligence record the agent now carries | ✅ via carrier — but the declared carrier is the **place**, and the record has no place end | ✅ `$target` classifies | ✅ `{location}` enriches | ✅ `intelligence` | **bind** — see A1 |
| 2 | `archive.crit.keeper_trusts` | `critical_success` | The bond with the keeper | ✅ Actor · individual 🔗 | ✅ `$cast:keeper` (key declared, § 5) | ✅ `{cast:keeper}` | ✅ `bond_change` `withAgentId: '$cast:keeper'` | **anchored** |
| 3 | `archive.success.watched` | `success` | The location, now Under Watch | ✅ Node · location 🔗 | ✅ `$target` | ✅ `{target}` | ✅ `condition_attachment` `targetLocationId: '$target'` | **anchored** — the strongest chip in the package, see A2 |
| 4 | `archive.success.charter_known` | `success` | The intelligence record | as #1 | ✅ | ✅ | ✅ `intelligence` | **bind** |
| 5 | `archive.cost.marked` | `success_at_cost` | The `cursed` condition | ✅ Attachment · condition 🔗 | ✅ `attachment_template` literal (`condition-trait-content.ts:207`) | ✅ *"{actor} is cursed"* | ✅ `condition_attachment` on `$actor` | **anchored** |
| 6 | `archive.cost.charter_known` | `success_at_cost` | The intelligence record | as #1 | ✅ | ✅ | ✅ `intelligence` | **bind** |
| 7 | `archive.fail.shaken` | `failure` | The `terrified` condition | ✅ (`:175`) | ✅ | ✅ | ✅ `condition_attachment` on `$actor` | **anchored** |
| 8 | `archive.fail.kept_name` | `failure` | The intelligence record | as #1 | ✅ | ✅ | ✅ `intelligence` | **bind** |
| 9 | `archive.crit_fail.keeper_grieves` | `critical_failure` | The `grieving` condition, on the keeper | ✅ (`:244`) | ✅ | ✅ `{cast:keeper}` + `{location}` | ✅ `condition_attachment` on `$cast:keeper` | **anchored** |
| 10 | `archive.crit_fail.one_line` | `critical_failure` | The intelligence record | as #1 | ✅ | ✅ | ✅ `intelligence` | **bind** |

**Five chips verdict `bind`, and they are one fix repeated five times.** Half A fails.

**No `reputation_tally` chip** (rule 0d) — none of any kind; the encounter deliberately
touches neither reputation nor factions, as the brief instructed.

**Rule 0c holds on all ten.** Every `stateNoun.text` names a mechanic — *a record gained*,
*a bond warmed*, *a place under watch*, *Cursed*, *Terrified*, *Grieving* — never a scene
noun, and none carries a placeholder. Every `detail` names its endpoints before its fiction.
All four placeholder forms used (`{actor}`, `{target}`, `{location}`, `{cast:keeper}`)
resolve live in `detail` (`proseEnrichment.ts:590,592,624`; `buildAftermathConsequences.ts:656`).

### A1 — the five knowledge chips point at an object their write never touches

This is the defect, and it is the same *shape* as the one `$target` was invented to fix.

The five `*_known` / `kept_name` / `one_line` chips each declare
`stateNoun: { text: 'a record gained', entityId: '$target', visualKind: 'location' }`. So the
tile the player sees is the **place's** art and the click opens the **place's** profile
(`buildAftermathConsequences.ts:665` — `stateNoun` with a `visualKind` takes the tile
outright, and `nounEntityId`/`nounEntityKind` carry the click).

The write behind them is `intelligence`. Traced through the handler
(`encounterAftermath.ts:1741-1754`), an `IntelligenceRecord` is built with:

- `agentId` = the actor. **The record's only end.**
- `targetEntityId` = `effect.targetEntityId`, which this packet **deliberately omits** — correctly,
  because § 17 finding 3 is right that `targetEntityId` is not in `SCENE_SENTINEL_FIELDS`
  (`encounterAftermath.ts:651-685`, eight fields, confirmed) and a literal node id is minted per world.
- `targetRegion` = `effect.targetRegion`, also omitted — and it could not have been supplied either,
  since a region name is a per-world string and that field is not a sentinel field. **The packet's
  finding 3 is narrower than the truth: neither of the two fields that could tie the record to the
  place is authorable, so the record ships subject-less by construction.**

Nothing about the location node changes. And on the player's side, `buildIntelligenceDisplay`
(`intelligence.ts:308-322`) branches on exactly those two fields: with both absent it sets
`targetKind: 'unknown'` and `targetDisplayName: null`. So the record appears in the agent's
Intelligence section on `ThreadDetailView` **with no place attached at all**, while five chips
tell the player it is a record "on {location}" and point at that place's sheet, where nothing
this ending wrote will be found.

That is rule 0c's closing clause, verbatim: *"Anchor the end of the edge your sentence is
about… Anchoring `$actor` there is not a milder version of the rule — it points the player's
click at the wrong person."* Here it runs the other way — the state lives on the actor and the
chip points at the place — but it is the same failure, and it is the Grateful Kin failure
Christian named: *"this simply doesn't communicate what game state has changed."*

**Do not fold these.** The record is real, it persists, it displays, and it is consumed (Half B).
Folding five of ten chips would delete the encounter's entire advertised prize and the whole
`knowledge` family the brief swapped in. This is a repoint.

**The fix, five lines:**

> On `archive.crit.charter_known`, `archive.success.charter_known`, `archive.cost.charter_known`,
> `archive.fail.kept_name` and `archive.crit_fail.one_line`, change
> `stateNoun: { text: '…', entityId: '$target', visualKind: 'location' }`
> to
> `stateNoun: { text: '…', entityId: '$actor' }` — **`$actor`, and drop `visualKind` entirely.**
> Leave `title`, `causeClause`, `detail` and `concepts` exactly as authored; `{location}` stays in
> the `detail`, which is the right place for "what the record is about".

Why `visualKind`-less rather than `visualKind: 'agent'`: the record's home surface is the agent's
own Intelligence section, so `$actor` is the honest carrier, but making all five clickable agent
chips would put **six** `individual`-anchored chips on one encounter against the brief's ceiling of
one. Dropping the member renders them as `named` — fully lawful per the catalog — and is exactly the
fix slot 1's package critic recommended for its ambition chip, for the same reason. If the director
would rather have the click than the ceiling, `visualKind: 'agent'` on these five is the stronger
form and the brief's row should be spent deliberately rather than silently.

**Anchor totals after the fix:** 1 location (linked) · 3 attachment (linked) · 1 individual
(linked) · 5 actor-carrier (named). The brief's ≥1 location-with-`visualKind` row is still met by
`archive.success.watched`, and the ≤1 individual ceiling is met exactly.

### A2 — the location chip does bind, verified independently of slot 1

`archive.success.watched` is the one chip whose anchor **and** whose write both route through
`$target`, so I checked both halves rather than inheriting slot 1's result:

1. `targetLocationId` is registered in `SCENE_SENTINEL_FIELDS` expecting kind `'location'`
   (`encounterAftermath.ts:684`), and `bindAftermathSceneTargets` binds `$target` only when
   `nodeMatchesSceneField(graph, action.targetId, 'location')` holds — which `isPlaceTierLocation`
   restricts to place-tier, excluding sublocations (`:690-700`, `:775-779`).
2. `resolveAnchorDeclaration('$target')` returns `action.targetId` unconditionally
   (`chipAnchorDeclarations.ts:168`), so a self-targeted action would render an agent node under
   `visualKind: 'location'`.

Slot 1 measured the live engine at tick 60: 33 of 33 encounter actions carried a place-tier
`location` targetId, zero sublocations. I take that measurement rather than re-running it — it is
the same engine, the same predicate, and the same batch — and I record that the same harness trap
applies here: reviewing this ending through `?spawn=` or the CLI with an avatar that has no resolved
location will make this correct chip render as dead text.

The `concepts` entry on the same chip declares the `under_watch` **template** as an attachment,
which is the documented form and gives the sentence a second, correct route.

### A3 — one accounting correction to § 14

§ 14 reports **"Totals: 6 location · 3 attachment · 1 individual"** and § 19 ticks the brief's
individual-ceiling row off that count. The count is arithmetically right and semantically wrong: five
of those six "location" anchors are the A1 chips, whose write touches no location. After the fix the
honest line is **1 location · 3 attachment · 1 individual · 5 named (actor carrier)**. Pass 4 should
write the corrected table, not the current one.

---

## Half B — what each ending leaves behind, and who picks it up

Traced per ending to a named consumer. The headline finding is an inversion: **the encounter's
advertised prize is its weakest downstream link, and its strongest link carries no chip.**

### `critical_success` — a clue that becomes somebody else's job

- **`spawn_clue` → `knows_clue_of`, `narrowed`, on a ruin.** The deepest write in the packet, and it
  is deliberately unchipped. `$nearest_ruin` resolves through `findAnyRuinId`
  (`clueLifecycle.ts:555-564`) — worth stating plainly, since the name misleads: it is a
  **uniformly-random** ruin anywhere in the world, with no distance term. Ruins exist in every world
  (`seedElderRuins`, called from `gameInit.ts:216`), each carrying `ruinMagnitude`, so the effect
  never no-ops. Downstream, two live phases read it:
  - **`phaseRuinQuestHooks`** (registered at `phases/index.ts:78`) calls `getEvidenceStrength`
    (`questHooks.ts:36`), which sums non-consumed clue magnitudes at that ruin. A clue's magnitude
    *is* the ruin's magnitude (`clueLifecycle.ts:356`), and `CLUE_QUEST_THRESHOLD` is `0.5`
    (`ruins/constants.ts:173`) — so **one clue from this encounter can cross the bar on its own**.
    When it does, and a Guild hall sits within `GUILD_QUEST_RADIUS` (5 hexes), the Adventurer's
    Guild posts a delve quest — `ag.quest.ruin_delve` / `ag.senior.deep_expedition` /
    `ag.elite.lost_city` by ruin size — and `buildQuestHookMessage` fires a **toast naming the ruin,
    the compass direction and the guild**. That is a system reading the write and a surface the
    player cannot miss. **Connected, and the best thing in this encounter.**
  - **`phaseClueDecay`** (`phases/index.ts:77`) ages it out on a `narrowed` clock, so it is a
    live rumour with a shelf life rather than a permanent flag.
  - **One dead branch, recorded because it looks alive.** `delveVariant.ts:319-324` will admit the
    agent to a real delve at that ruin — but only on `precision: 'located'`, and **nothing anywhere
    in the engine writes `'located'`** (every producer in `perceiveRelay.ts` writes `vague` or
    `narrowed`). So `consumeCluesOnConvergence` and the delve arc behind it are unreachable today.
    This is a pre-existing engine gap, not this packet's — the packet writes the highest precision
    that any producer writes — but a reader should not expect the agent themselves to go back down.
- **`intelligence`, `political_secret`, reliability 0.95.** See the standing note below.
- **`bond_change` on `$cast:keeper`.** A `must-persist` cast NPC, so the person survives the scene;
  the bond shows on the cast tile and both sheets. **Connected**, and correctly the encounter's one
  clickable person chip.

### `success` — a place marked, and nothing yet marks it back

- **`condition_attachment` → `trait.condition.location.under_watch` on the location.** Real: it
  writes a `has_trait` edge with a duration, `CONDITION_UNDER_WATCH_DURATION` is 84 ticks (seven
  game days), and `LocationProfileModal` reads those edges and renders the place's active conditions
  with their remaining term (`LocationProfileModal.tsx:80-99, 251-260`). **The player sees it on the
  place's own sheet and can watch it lift.**
  **But nothing acts on it.** `LOCATION_CONDITION_MOVEMENT_TAX` omits `under_watch` on purpose
  (`condition-trait-content.ts:446` — *"being observed changes what you can do in a place, not how
  long it takes to walk in. Its reader is the gate."*), and that gate has no user: every
  `requiredTargetTraits` in the corpus gates on a reputation trait, and **not one template gates on
  a location condition.** So this is honestly `thin`, not `connected` — visible, durable, and inert.
  It is still the right chip and the right write; it is the batch's clearest instance of content
  arriving before its reader. Contrast slot 1's `pass_closed`, which has a real mechanical reader
  (×8 movement cost) — the two encounters happen to sit either side of that line.
- **`intelligence` 0.80**, and a second `bond_change` on the keeper.

### `success_at_cost` — a curse the body carries

- **`condition_attachment` → `trait.condition.cursed` on the actor.** A live condition with a
  duration edge, decayed by `decayConditions`, read by reach computation, and shown on the agent's
  Attachments tab with its own detail view. **Connected**, and the chip clicks straight to it.
- **`intelligence` 0.75.**

### `failure` — a fright, a kindness, and a way back

- **`condition_attachment` → `terrified`.** As above. **Connected.**
- **`bond_change` on the keeper** — the band the `relationship` family was drawn for, and the design
  is good: they came up with nothing and the keeper sat down with them anyway.
- **`encounter_seed`, family `encounter.delve`, on `$actor`, +36 ticks, `inheritContext`.** Same
  supply fact slot 1 recorded and I second: `matchFamilyTemplate` draws over registered templates
  whose id starts with `encounter.delve.`, which has **zero** members today and exactly **two** after
  this batch — this encounter and The Broken Seal, sharing one envelope. If the agent is still at a
  ruin, tower, shrine or temple 36 ticks later the seed draws one of those two; if they have moved
  on it degrades to a chronicle line. Honest for the first content written into a starved family, but
  the door it opens leads back into this batch.
- **`intelligence` 0.40, `cultural_knowledge`.**

### `critical_failure` — a person left grieving

- **`condition_attachment` → `grieving` on `$cast:keeper`.** The condition lands on the *other*
  person, and because the cast spec is `must-persist` that person stays in the world carrying it.
  Visible on their sheet; decayed like any condition. **Connected**, and the most unusual write in
  either slot — a consequence the agent watches happen to somebody else.
- **`intelligence` 0.30.**

### The standing note: what the five intelligence records are actually worth

They persist (`state.intelligenceRecords`), they never decay to nothing, and they are **player-visible**:
`ThreadDetailView` renders an Intelligence section for any threaded agent at tier ≥ 1, showing the
label, the detail, a reliability word and how long ago it was learned
(`ThreadDetailView.tsx:677`; `buildIntelligenceDisplay`). So the second clause of the Half B question
is satisfied — the player can see it.

The first clause is thinner than the packet suggests. With `targetEntityId` and `targetRegion` both
unauthorable, the **only** live matching route left is category → templateId substring
(`TEMPLATE_CATEGORY_MATCHERS`, `intelligence.ts:67-74`):

- `political_secret` → `court`, `intrigue`, `blackmail`, `extort`, `betray`
- `cultural_knowledge` → `ritual`, `ceremony`, `lore`, `cultural`

Those matchers have plenty of live targets — the corpus carries dozens of `court.*`,
`court_whispers.*`, `company.betrayal.*`, `blackmail_ledger_*`, `ritual_*` and `*_lore` ids — and
three consumers act on a match: `findActionableIntelligence` adds `INTEL_SCORING_BONUS` when such an
encounter is scored (`encounterScoring.ts:1267-1291`), `observeResolutionIntelligence` fires an
`intelligence_referenced` trace when one resolves, and `findIntelReferencedProseMatch` lets authored
prose quote the record back. So the record genuinely does something later.

What it cannot do is be about **this place**. A charter read at Emberhollow gives its holder an edge
at some future court intrigue anywhere in the world, and gives them nothing at Emberhollow. That is
not a defect in this encounter — it is the shape of the engine's intelligence model, and the packet
was right to omit the field rather than ship a literal string. It is the reason the A1 fix matters:
the chip should stop promising a link the record does not carry.

### Half B verdict

`connected`. Three endings write state a named system acts on and a surface the player can open, and
one of them (the clue → guild quest → toast) reaches further out of the encounter than anything in
slot 1. The two soft spots are named rather than hedged: `under_watch` is inert until something gates
on it, and the knowledge prize is consumed by category rather than by place.

---

## Batch-spread judgement

| Axis | Slot 1 (The Broken Seal) | Slot 2 (The Drowned Archive, post-fix) | Verdict |
|---|---|---|---|
| Anchor kinds | 6 attachment · 1 location · 2 individual | 3 attachment · 1 location · 1 individual · 5 named actor-carrier | ✅ Complementary; neither leads on `individual` |
| Consequence categories | `boon` ×5 · `scar` ×3 · `path` ×1 | `boon` ×5 · `scar` ×4 · `bond` ×1 | ✅ All four covered across the batch |
| Consequence families | `drive` + `movement` | `relationship` + `knowledge` | ✅ Four distinct, no overlap |
| `location` chip w/ `visualKind` | ✅ 1 (`pass_closed`) | ✅ 1 (`under_watch`) | ✅ Brief's ≥1-per-encounter met — **and the pre-fix "6" was not six** |
| `individual` ceiling (≤1) | ❌ 2 (slot 1's own A2) | ✅ 1 | ⚠️ One-line fix each side |
| `faction` anchor (warned off) | ✅ none | ✅ none | ✅ |
| `place` — an ending changes what is true of the location | ✅ `pass_closed`, with a live reader | ✅ `under_watch`, **with no reader yet** | ⚠️ Both write; only slot 1's is acted on |
| Grim-ending budget (≤1) | resolves grim | every band mints knowledge, incl. both failures | ✅ |

**I do not contradict slot 1's spread reading; I sharpen one row of it.** Slot 1 recorded slot 2 as
"6 location / 3 attachment", which is what § 14 says. Five of those six were the A1 chips. The
batch's true location-anchor count is **two, one per encounter** — which is still exactly what the
brief asked for, so the conclusion holds and only the number moves.

### On slot 1's two stated gaps

**Gap 1 — no `artifact`-kind anchor and no `spawn_artifact` anywhere in the batch. Confirmed, and
worse from my side.** Slot 2's only object grant is `reward_tools_instruments_scroll_case`, and it
arrives from a **card** (`Find What Remains`, step 0). Nudge card grants sit outside the aftermath
`changes` surface Law 56 audits, so they are never chip-backed and carry no anchor at all. Slot 2
therefore contributes **zero** to the brief's `artifact` row — not "one grant". The row is met only
by reading slot 1's possession attachments as artifacts, and no chip in either encounter declares
`visualKind: 'artifact'`. Stated plainly rather than ticked, as slot 1 asked.

**Gap 2 — the catalog's `ambition` row prescribes a declaration the classifier rejects. Confirmed by
direct code read, and it is not one row.** `classifyAnchorDeclaration` accepts exactly five forms:
`$actor`, `$target`, `$cast:<key>`, `$faction:<defId>`, and a literal that resolves through
`getAttachmentTemplateNode`. Everything else is refused with *"a literal node id is minted per world
and cannot be authored"*. But the generated catalog tells authors to declare `entityId` = a raw node
id on **eighteen** rows — `ambition`, `region`, `resource`, `relationship`, `companion`, `culture`,
`group`, and every edge-endpoint row — and only the `location` row carries a note about the sentinel
route. So an author writing faithfully from the catalog ships a gate failure on any of them. Slot 2
hits the wall from the other side: its `assign_ambition` is a card grant and could not have carried
an anchor even if it had wanted one. **The catalog is the surface that should move**, and the fix is
a column, not a row: every anchorable kind needs its *sentinel* form stated, or an honest "no
authorable declaration exists today".

---

## Fix list

**Blocking (Half A):**

1. **Repoint the five knowledge chips.** On `archive.crit.charter_known`,
   `archive.success.charter_known`, `archive.cost.charter_known`, `archive.fail.kept_name` and
   `archive.crit_fail.one_line`, change `stateNoun.entityId` from `'$target'` to `'$actor'` and
   **remove `visualKind: 'location'`**. Nothing else on those five chips changes — same `title`,
   same `causeClause`, same `detail` (keep `{location}` in it), same `concepts`. (A1)

**Non-blocking, apply in the same pass:**

2. **Correct § 14's totals** to `1 location · 3 attachment · 1 individual · 5 named (actor carrier)`,
   and correct § 19's brief-compliance rows to match. (A3)
3. **Widen § 17 finding 3.** It says `targetEntityId` is not sentinel-bound; the true statement is
   that **neither** `targetEntityId` nor `targetRegion` can be authored for a per-world place, so an
   intelligence record cannot be about a location at all today. That is the finding worth carrying to
   the batch report.
4. **Pass 4 code comment** at the `spawn_clue` effect recording that `$nearest_ruin` is a uniformly
   random ruin (`findAnyRuinId`), not the nearest, so the next reader does not assume proximity.

## Findings for the batch report

1. **An intelligence record cannot be about a place.** `targetEntityId` is absent from
   `SCENE_SENTINEL_FIELDS` and `targetRegion` takes a per-world string, so every `intelligence`
   effect in the corpus ships subject-less: `buildIntelligenceDisplay` renders it with
   `targetKind: 'unknown'`, and its only live match route is category → templateId substring. Any
   encounter whose prize is knowledge *about somewhere* will hit this. Engine-side fix — register
   `targetEntityId` as a `'location'`/`'agent'` scene-sentinel field.
2. **`trait.condition.location.under_watch` has no reader.** No movement tax by design, and its
   documented reader (`requiredTargetTraits`) has zero users on any location condition across the
   whole corpus. Three shipped encounters now write it. It displays on the location sheet and nothing
   acts on it.
3. **`CluePrecision: 'located'` is read and never written.** `delveVariant.ts` admits a delve only on
   a `located` clue; every producer in the engine writes `vague` or `narrowed`. The delve-admission
   arc and `consumeCluesOnConvergence` behind it are unreachable today. The quest-hook branch of the
   clue system *is* live, which is what saves `spawn_clue` as a consequence.
4. **The anchor catalog's declaration column is wrong on ~18 rows, not one.** Seconds and widens slot
   1's finding 2: every row prescribing a raw node id is rejected by `classifyAnchorDeclaration`.
5. **`nudge-authoring-spec.md` rule 0c is stale on one clause.** It says the surface does not enrich
   `stateNoun`; THR-1205 made it enriched (`buildAftermathConsequences.ts:683`), specifically so an
   author can write `a standing welcome at {target}`. Harmless here — neither encounter puts a
   placeholder in a `stateNoun` — but the rule is now telling authors not to use a feature that
   exists, and it is the field most in need of it.
6. **The batch ships no `artifact`-kind anchor and no `spawn_artifact`** (slot 1's finding 5,
   confirmed; slot 2's only object grant is a card grant and carries no anchor at all).
7. **`encounter.delve.` has two members after this batch, both sharing one envelope** (slot 1's
   finding 3, confirmed — slot 2's `failure` seed draws from the same two-item pool).

---

The Drowned Archive is a genuinely connected encounter with one repeated wiring mistake. The prose
and the writes are about the same things — the flooding vault the prose opens on is the place the
chip marks Under Watch, the keeper who could not go down is the person who ends up trusting or
grieving, and the charter everyone is arguing about is the record the agent walks out carrying. On
the best ending it plants a rumour about a real ruin that the Adventurer's Guild picks up and turns
into a posted quest, with a toast naming the place and the way to it: that is the strongest reach out
of any encounter in this batch, and it currently has no chip on it at all. The mistake is at the
other end. Five of the ten chips — the ones reporting the knowledge the whole encounter is for —
point the player at the settlement, when the thing that changed is a record in the agent's own head
and the engine has no way to tie that record to a place. Clicking those five opens a location sheet
where nothing happened. The fix is five lines: point them at the agent instead, and leave every word
as written.

PACKAGE FIX

---

## Re-run after PACKAGE FIX — 2026-08-25

Judged against the **shipped TypeScript**, not the packet. Everything above is kept as the record of
what was found; this section records what is in the tree now. Line numbers are
`src/data/encounters/the-drowned-archive.ts` unless stated.

### A1 — the five knowledge chips, verified per chip

All five carry `stateNoun: { text: 'a record gained', entityId: '$actor' }` with **no `visualKind`
member**, exactly as prescribed:

| Chip | Line | Shipped declaration | `title` / `causeClause` / `detail` / `concepts` |
|---|---|---|---|
| `archive.crit.charter_known` | chip 729, noun 744 | `{ text: 'a record gained', entityId: '$actor' }` | unchanged; `{location}` still in `detail` |
| `archive.success.charter_known` | chip 821, noun 831 | same | unchanged; `{location}` still in `detail` |
| `archive.cost.charter_known` | chip 882, noun 892 | same | unchanged; `{location}` still in `detail` |
| `archive.fail.kept_name` | chip 938, noun 946 | same | unchanged; `{location}` still in `detail` |
| `archive.crit_fail.one_line` | chip 1007, noun 1015 | same | unchanged; `{location}` still in `detail` |

`grep -n "visualKind" ` over the whole file returns nine hits and **not one of them sits on a
`'a record gained'` noun** — the five `visualKind: 'location'` declarations the fix targeted are
gone, and none was replaced with `visualKind: 'agent'`. The write behind each is still the same
single-ended `intelligence` effect with `targetAgentId: '$actor'` and no `targetEntityId`
(effects at 768, 842, 903, 957, 1026), so anchor and write now name the same object. (A sixth
`intelligence` write exists at 437, on the step-2 card `Salvage One Fact` — a card grant, outside the
aftermath `changes` surface Law 56 audits, so it carries no chip and no anchor obligation.) The file's own
header block (lines 20-28) and an inline comment at the crit-success chip (739-743) record the fix
and say it was implemented as written and not reverted — so a later reader cannot mistake the
`$actor` anchor for a drafting slip and "correct" it back.

### A1's ceiling reasoning — verified, and it holds

Slot 1's critic argued that dropping `visualKind` is what keeps a `$actor` sentinel from counting as
an `individual` anchor. **That is correct here, at the code level, and not merely by catalog
convention:**

- The catalog's `individual` row requires `visualKind: 'agent'` on an actor node id
  (`anchor-catalog.generated.md:67`) — the anchor *kind* is a property of the declaration, not of
  what the sentinel happens to resolve to.
- `buildAftermathConsequences.ts:665` picks the tile only from a ref that carries a `visualKind`
  (`const iconConcept = (stateNoun?.visualKind ? stateNoun : undefined) ?? …`), and `:705` passes
  `nounEntityKind: stateNoun?.visualKind` — the click route. With the member absent, both are
  `undefined`: no tile, no click, `named` tier.

So the encounter ships **exactly one** `individual`-anchored chip — `archive.crit.keeper_trusts`
(757, `$cast:keeper` + `visualKind: 'agent'`) — and the brief's ≤1 ceiling
(`deep-places-brief.md:139`) holds. Shipped totals: **1 location (linked) · 3 attachment (linked) ·
1 individual (linked) · 5 actor carrier (named).**

### A2 — `archive.success.watched` is unchanged and still correct

Line 815: `stateNoun: { text: 'a place under watch', entityId: '$target', visualKind: 'location' }`,
with `concepts` still declaring `trait.condition.location.under_watch` as an `attachment` (817). Its
backing write is unchanged — `condition_attachment` / `templateId:
'trait.condition.location.under_watch'` / `targetLocationId: '$target'` (853-857). Anchor and write
still route the same sentinel through the same sentinel field. It is the encounter's one
location-anchored-with-`visualKind` chip, which is the brief's `≥1` row
(`deep-places-brief.md:135`) — and per that row's own THR-1221 warning, the `visualKind` was **not**
dropped in the fix pass. The fix touched five chips and left this one alone, which is what was asked.

### The other five chips — re-checked against rules 0, 0b, 0c, 0d, 1–4

| Chip | Line | Rule 0 (backing write) | 0b (referent) | 0c (mechanic noun + endpoints) | 1 (cause → change) | 3 (category) |
|---|---|---|---|---|---|---|
| `archive.crit.keeper_trusts` | 748 | `bond_change` `withAgentId: '$cast:keeper'` (792) | `$cast:keeper`; key declared in `SUPPORT_BUNDLE` (44) | *a bond warmed*; `detail` names both parties | ✓ | `bond` ✓ |
| `archive.success.watched` | 807 | `condition_attachment` on `$target` (850) | place-tier location node | *a place under watch* | ✓ | `scar` ✓ |
| `archive.cost.marked` | 870 | `condition_attachment` `trait.condition.cursed` on `$actor` (911) | attachment template, live (`condition-trait-content.ts:207`) | *Cursed* | ✓ | `scar` ✓ |
| `archive.fail.shaken` | 926 | `condition_attachment` `trait.condition.terrified` on `$actor` (965) | live (`:175`) | *Terrified* | ✓ | `scar` ✓ |
| `archive.crit_fail.keeper_grieves` | 995 | `condition_attachment` `trait.condition.grieving` on `$cast:keeper` (1034) | live (`:244`) | *Grieving* | ✓ | `scar` ✓ |

None was disturbed by implementation. **Rule 0d:** `grep -n "reputation_tally"` returns nothing —
no tally chip of any kind. **Rule 0c clause 1:** no `stateNoun.text` in the file carries a
placeholder, so the stale "the surface does not enrich `stateNoun`" clause (finding 5 above) is moot
for this encounter either way. **Rule 4:** three `condition` attachments, a bond, a location
condition, a clue, a seed and five intelligence records — palette breadth unchanged.

### The two implementation-found classes — neither appears here

1. **Dead ambition id.** The drowned archive's only `assign_ambition` is the step-1 card grant
   `ambition_uncover_secrets` (287). Verified live: it sits at `ambition-templates.ts:490`, inside
   `AMBITION_TEMPLATES` (opens at `:96`), **not** inside `EVENT_MINTED_AMBITION_TEMPLATES` (opens at
   `:1013`). The id that failed grant-liveness — `ambition_chase_the_wonder` (`:1289`) — appears
   nowhere in this file.
2. **`polarity: 'mixed'` beside a declared `direction`.** No `'mixed'` anywhere in this file. Every
   aftermath change pairs `direction: 'gain'` with `polarity: 'gain'` or `direction: 'loss'` with
   `polarity: 'loss'` (732/733, 751/752, 810/811, 824/825, 873/874, 885/886, 929/930, 941/942,
   998/999, 1010/1011). The `polarity: 'for' | 'against'` values at 537-619 are `TraitVariant`
   polarities, a different field, and are not what the corpus test reads.

### Sibling regression check — `the-broken-seal.ts`

Both of slot 1's corrections landed and are recorded in the file:

- **Chip 9 (`seal.crit_fail.the_wanting`, id at 810, noun at 827):** `stateNoun: { text: 'a new
  ambition', entityId: '$actor' }` — `visualKind: 'agent'` is gone, `entityId` retained, with an
  inline comment at 801-809 explaining the anchor-catalog carrier route. `seal.fail.driven_out`
  (id 754, noun 762) is now the encounter's only `visualKind: 'agent'` chip, so slot 1's own ≤1
  ceiling is met too.
- **Both `assign_ambition` effects carry the `no_free_slot` comment:** critical_success at 612-619
  (full text — `MAX_ACTIVE_AMBITIONS` = 2, no eviction, ~21% of actors in a mature world) and
  critical_failure at 843-847 (back-reference to the first). Both grant
  `ambition_uncover_secrets`, the live template — `ambition_chase_the_wonder` no longer appears in
  the sibling either.
- Slot 1's `polarity: 'mixed'` on `seal.fail.driven_out` (758) is **lawful and correctly left
  alone**: the corpus predicate skips any change whose `direction === 'opens'`
  (`consequenceSignalCorpus.test.ts:107`), and that chip declares `direction: 'opens'`. The Pass-4
  comment at 814-822 states the rule slightly wider than the test enforces ("rejected outright
  whenever a direction is declared"); harmless today, worth one word if the file is touched again.

### Gates re-run for this pass

```
npm run check:chip-anchors
  checked 696   templates failing 0   chips 0
  every chip that names a referent anchors it, and every anchor resolves.

npm run check:encounter -- encounter.delve.the_drowned_archive
  checked 1   clean 1   failing 0   on ratchet 0   warnings 0
  ✓ encounter.delve.the_drowned_archive  [systems: cast, rewards, seeds, conditions]

npm run check:encounter -- encounter.delve.the_broken_seal
  checked 1   clean 1   failing 0   on ratchet 0   warnings 0
  ✓ encounter.delve.the_broken_seal  [systems: cast, rewards, seeds, conditions]
```

### One correction applied to the final packet, not to code

Fix-list item 2 (correct § 14's totals) was applied **half-way** in
`the-drowned-archive-final.md`: the *Declaration* column was rewritten to `entityId: '$actor'` on
all six rows that previously read `$target` — including `archive.success.watched`, which ships
`$target` + `visualKind: 'location'` — while the *Anchor kind* column and the `Totals:` line still
read "6 location". The packet therefore described a shipped chip incorrectly, in the one direction
that could get the encounter's only location-linked anchor "corrected" away by a later reader. I
have rewritten § 14's table, its totals line, and the now-stale paragraph defending the `$target`
anchoring, so the packet matches the tree. No code changed.

### Half B — unchanged

Nothing in the fix touched an effect, so every downstream trace in Half B above stands as written:
the `critical_success` clue → `phaseRuinQuestHooks` → guild delve quest + toast is still the
encounter's furthest reach; `under_watch` is still visible-and-inert; the intelligence records still
match by category → templateId substring only. The seven batch-report findings stand unamended.

PACKAGE PASS
