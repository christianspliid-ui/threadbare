> **title:** Spells as divine gifts and found tomes — acquisition channels 1 and 4 — THR-1672
> **linear_issue:** THR-1672
> **author:** Claude Code (design lane, run 2026-10-03b)
> **created:** 2026-10-03
> **three_pillars:** Engine `done` · Content `done — the Teach a Spell card, one Cache-family nudge member, the tome predicate over six authored books and the generated forbidden book, sheet and receipt lines` · UI `done — the sheet says who or what taught a spell; the god's receipt names the spell; the card shows what it will teach before it is played`

# Spells as divine gifts and found tomes — THR-1672

*Today a mortal comes to know a spell in only two ways: they start the world knowing one, or they study for another. The god's "gift" is a bag of stats, and the books the world hands out teach nothing. After this plan the god can teach a mortal a spell from the god's own spheres, and the god pays for teaching dark magic. Some old and arcane books teach whoever comes to hold them. The sheet says who taught each spell, and an ancient book becomes the first way a mortal outside the old orders can stumble on elder magic.*

## Why this is load-bearing

[THR-1231](https://linear.app/threadbare/issue/THR-1231/how-does-an-entity-come-to-hold-a-power-acquisition-channels) was settled with Christian on 2026-08-25: **all five acquisition channels exist at the destination**, each kept shallow. The power runtime ([THR-1571](https://linear.app/threadbare/issue/THR-1571), [plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-29-thr-1571-power-runtime.md)) shipped channel 2 (seeded knowing) and kept channel 3 (learning in play). The spell generator ([THR-1572](https://linear.app/threadbare/issue/THR-1572), [plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-30-thr-1572-seeded-spell-generator.md)) fills the shelves. Channel 5 (innate powers) shipped as [THR-1671](https://linear.app/threadbare/issue/THR-1671). This plan delivers the two that remain:

1. **Divine grant** — [THR-1230](https://linear.app/threadbare/issue/THR-1230/what-is-a-power-to-the-player-ratify-the-power-objects-shape) ruling 5: *"Spells are also grantable content: divine-gift bestowal …, nudge-card grant vocabulary, seeded scrolls/rewards. Granted magic's doom and notice trace back to the god's meddling — teaching forbidden magic is a characterful divine act with consequences."*
2. **Found tomes** — THR-1231 channel 4: *"some generated tomes/scrolls … teach a spell when claimed. Deliberate coupling to the Item Generator map: item drops can change who an agent is."*

Measured on `origin/main` f18d1003, 2026-10-03 (census reader [`spell-gifts-tomes.ts`](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-09-25-living-world-data/readers/spell-gifts-tomes.ts), seeds 42 / 99 / 7, medium, unattended, 150 ticks; output [`spell-gifts-tomes-2026-10-03-thr1672.json`](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-09-25-living-world-data/output/spell-gifts-tomes-2026-10-03-thr1672.json)):

```
42 {"individuals":619,"generatedItems":{"byOrigin":{"masterwork":1},"tomes":0},
    "spells":{"casters":105,"knowers":104,"nonCasterKnowers":0,"fullSlots":0,"wieldHist":{"1":104},"knowsSources":{"seeded":104}},
    "ascendant":{"props":{"sphereAlignment":{"primary":"chaos","secondary":"energy"}, …}}}
99 {"individuals":778,"generatedItems":{"byOrigin":{"masterwork":3},"tomes":0},
    "spells":{"casters":122,"knowers":122,"nonCasterKnowers":0,"fullSlots":0,"wieldHist":{"1":122},"knowsSources":{"seeded":122}}, …}
7  {"individuals":814,"generatedItems":{"byOrigin":{"masterwork":1},"tomes":0},
    "spells":{"casters":125,"knowers":123,"nonCasterKnowers":0,"fullSlots":0,"wieldHist":{"1":123},"knowsSources":{"seeded":123}}, …}
```

What it says:

- **Every known spell in the world was seeded.** In 150 ticks no mortal learned one in play, and no non-caster knows one. Every knower wields one spell and has two free slots (`SLOT_CAPS.spell = 3`, `src/data/attachment-slot-constants.ts:21`). A taught spell is therefore carried at once.
- **The god has a sphere pair to teach from.** The ascendant node carries `sphereAlignment: { primary, secondary }` on every seed.
- **Generated tomes do not occur yet.** The only in-play minting point is the masterwork (`strategicGraphOps.ts:1005`), 1–3 per world, none of them books.
- **Authored tomes already reach mortals in volume.** The reward-draw census of 2026-10-02 ([`reward-minting-2026-10-02-thr1626.json`](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-09-25-living-world-data/output/reward-minting-2026-10-02-thr1626.json), same seeds, 150 ticks) counts **32 / 39 / 52** Storied and Mythic `tomes_scrolls` rewards per world. Of those, the books this plan makes teach (§ Content pillar) are **11 / 12 / 16** (Veilscript Fragment 4/8/9, The Silent Testament 6/2/5, Book of Sealing 0/2/0, Fading Ward 1/0/1, Sealed Codex 0/0/1).

So channel 4 is live the day it ships, on books the world already hands out. Generated forbidden books join it wherever the item generator mints one: masterworks today, and the reward draw once [THR-1626](https://linear.app/threadbare/issue/THR-1626/item-generator-minting-point-2-reward-draws-carry-generated-items-at) lands. **This plan does not depend on THR-1626**, whose decision is still in its veto window. The teaching hook reads the item, not the minting point. If THR-1626 is vetoed or re-sized, nothing here changes.

**Settled input — not reopened here** (each is cited where the plan uses it):

- **THR-1230 rulings 4 and 5**: one earned caster badge with tradition shelves; spells are grantable, and granted magic's doom and notice trace to the god.
- **THR-1231**: five shallow channels from one minting seam (*"the generator's minting seam serves all five channels from one code path (they differ only in trigger and selector)"*); known unlimited, wielded slot-capped.
- **The power runtime (THR-1571, shipped)**: `knows_spell` = known, `has_trait` = wielded; one shared definition node per spell; the band decides a cast; `resolveCast` (`src/engine/spellCasting.ts:174`) is the one cast path.
- **The spell generator (THR-1572, built, PR [#2178](https://github.com/christianspliid-ui/threadbare/pull/2178), not yet merged)**. Its six lane decisions date from 2026-09-30, outside any veto window. This plan uses four of its parts, by their names on that branch: `resolveSpellTemplate(graph, id)` (`src/data/spell-templates.ts:291`), `getTraditionLibrary(graph, traditionId)` (`spellGenerator/spellLibrary.ts:224`), `casterTraditionOf(graph, actorId, worldSeed)` (`spellGenerator/casterTradition.ts:90`), and the transgression notice `placeSpellNotice(...)` / `spellProvenance(...)` (`spellGenerator/notice.ts`). It also uses the Foundation-shelf rule: elder spells only at tiers 3 and 4, never seeded. **This ticket is blocked by THR-1572.**
- **The taste profile**, `Vision/taste-profile.md` § Elder magic: *"Foundation spheres are elder magic in-game … they discover them through ruins, texts, and encounters."*

**Decided in this plan by the design lane under delegation** (process.md rule 4, 2026-09-11). Each is marked *Lane decision* where it appears, and each can be vetoed in chat:

1. **One grant seam.** Every channel writes a known spell through one function, `grantSpell`. The `knows_spell` edge records where the spell came from.
2. **The god teaches from the god's own spheres** (primary, then secondary), at tiers 1–2, and falls back to the mortal's own tradition. A god never teaches elder magic.
3. **A god-taught spell is a Spell, not a Bestowal.** Bestow Power stays exactly as it is, and Teach a Spell is a new card beside it.
4. **The god pays for teaching dark magic, and only for dark magic.** Teaching a transgression spell costs the god doom and detection in that mortal's region. Each later cast of it adds a little detection, and the mark it leaves names the god. Teaching gentler magic costs only essence.
5. **Knowing a spell does not make a mortal a caster.** The caster badge stays as ruled. A mortal who is not a caster can carry and cast what they are given, but cannot study for more.
6. **Which books teach**: a `tomes_scrolls` item tagged `#arcane` or `#ancient` and not `#map`, plus the generated *forbidden book*. A book teaches when it comes into a mortal's hands: as a reward, as a generated item handed to someone other than its maker, or when seized. `#ancient` books may teach up to tier 3 and prefer elder spells.
7. **The nudge-card grant vocabulary gains one kind, `spell_grant`**, and one card uses it: a new member of the Cache family.

The brainstorm companion records the options weighed for each.

## Substrate inventory

Measured 2026-10-03 against `origin/main` f18d1003 (grep + read + the census above; line numbers are that tree's). The THR-1572 rows are read on its PR branch (`claude/practical-gould-0b802d`).

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| **Spell holding:** `knows_spell` (known, unlimited, `edgeSchema.ts:566-583`) and `has_trait` (wielded, `SLOT_CAPS.spell = 3`) to one shared definition node `power.spell.<id>` (`spell-templates.ts:292-322`) | 🟢 ACTIVE | **extends**. `knows_spell` gains optional `grantedBy` and `viaItemId` |
| **Three hand-written spell writers:** `create × Power` (`learn_spell`, `undertaking-objects.ts:2306-2388`, `source: 'learn_spell'`); `seedSpellKnowing` (`seedAttachments.ts:291-370`, `source: 'seeded'`); `applySpellStamp` (`debugEncounterTools.ts:721`, `source: 'debug'`, which evicts the lowest-sorted spell when slots are full) | 🟢 ACTIVE | **replaced by one seam** (Lane decision 1). All three call `grantSpell` and write byte-identical edges. Pinned by tests before the refactor |
| **`attachment_grant` side door:** the type admits `spell` (`types/unifiedAction.ts:750`), but `instantiateReward` (`rewardPool.ts:771-907`) sends a `spell` subcategory into the generic trait branch. That writes an expiring `has_trait` to a per-bearer clone and no `knows_spell` (read, not run) | 🔴 LATENT DEFECT (no authored grant reaches it: 0 `attachment_grant` with a spell template in `src/data`, grep) | **closed**. A spell-subcategory template routes through `grantSpell` |
| **Bestow Power:** `action.bestow` (`unified-action-templates.ts:2569-2604`, star reach, `BESTOW_COST = 5`, op `bestow_power`) → `applyBestowPower` (`ascendantExpression.ts:243`): checks a thread with awareness ≥ `BESTOW_MIN_AWARENESS = 'faith'`, then mints a `Divine Gift` possession (`bestowedBy`, passive +2 in the god's primary reach, +0.01 quintessence a tick). It is unlocked by `beat.pool.invest.the_favored_soul` (`ascendant-beat-content.ts:403-410`) and resolved at `unifiedActionResolution.ts:1925-1940` | 🟢 ACTIVE | **preserve** (Lane decision 3). Teach a Spell copies its gates and its resolution site |
| **Ascendant spheres:** `sphereAlignment { primary, secondary }` on the ascendant actor node (census, all three seeds) | 🟢 ACTIVE | **reads** for the divine pool |
| **Nudge grants:** `StepNudge.grants?: EncounterAftermathReactionEffect[]` (`types/unifiedAction.ts:1741`), collected by `collectNudgeGrants` (`encounters/nudgeDispatch.ts:109`), applied by `applyEncounterAftermathReaction`. The union has 46 kinds and no spell grant. "Leave something behind" is `PERSISTENT_EFFECT_KINDS` (`content-eval/compositionContract.ts:114-148`). The Cache family's members (`card.cache.signature.matter`, `card.cache.hunger.gather`) grant `spawn_artifact` (`nudge-card-library.ts:953-967`) | 🟢 ACTIVE | **extends** by one kind, `spell_grant`, and one Cache member |
| **Detection pressure:** `applyRawDetectionDelta(pressure, regionId, delta, tick)` (`encounters/detectionPressure.ts`, signed, clamped 0–1, thresholds notice 0.5 / turn 0.8 / encounter 1.0 in `encounter-experience-constants.ts:53-57`); the nudge path resolves the region with the module-private `resolveActorRegionId` (`nudgeDispatch.ts:386`) | 🟢 ACTIVE | **reuses**. `resolveActorRegionId` is exported |
| **Doom:** `accelerateDoomClock(doomClock, delta)`, the nudge doom channel (`nudgeDispatch.ts:303-311`); card doom deltas are 0.05–0.06 (grep of `doomDelta:` in `src/data`) | 🟢 ACTIVE | **reuses** for the teaching price |
| **Spell notice (THR-1572):** `placeSpellNotice(state, casterId, spell, tick, site)` places one `forbidden_contact` hidden mark per caster per spell for a transgression; `spellProvenance(graph, id)?.notice` says whether a spell is one | 🟢 on the PR branch | **extends**. An optional `taughtBy` names the god in the mark's label |
| **Cast resolution:** `resolveCast` (`spellCasting.ts:174`); soul price queued as `spell_price` (:282-292) | 🟢 ACTIVE | **extends**. A god-taught transgression adds a detection echo |
| **Tradition libraries (THR-1572):** `getTraditionLibrary`, `casterTraditionOf`, `resolveSpellTemplate` | 🟢 on the PR branch | **reuses** for every pool |
| **Item possession writers:** reward instantiation, `possesses` at `rewardPool.ts:856`; generated mint, `mintGeneratedItem` (`itemGenerator/mintGeneratedItem.ts:91`, holder edge :122-130); seizure, `control:seize × Item` (`undertaking-objects.ts:2247-2261`, `via: 'seized'`) | 🟢 ACTIVE | **extends**. Each calls one hook, `onItemAcquired`, after its edge write |
| **Tomes:** authored `tomes_scrolls` rewards (19 in `reward-attachment-catalog.ts`; also `starter-attachments.ts`, `anomaly-reward-catalog.ts`); the generator's `forbidden_book` core (`item-generator-cores.ts:358-395`, forms book / almanac / ledger, slot `tome`) | 🟢 ACTIVE | **reads** through the tome predicate; no catalog edit |
| **Sheet:** `AttachmentsTab.tsx`, Powers rows and the Knows list (power runtime plan, :204 and :326-349); the existing *"Granted by <name>"* line (:242-244), fed by `PowerEntry.grantedBy` (`agentAttachments.ts:54`, :368) | 🟢 ACTIVE | **extends**. A god-taught spell fills `grantedBy` with the god's name from the edge, so the existing line renders. A book-taught spell gains one sibling field, `learnedFrom`, and the line *"Learned from <item>"* |

Green-field parts, with their evidence: **0 hits** across `src/` for `grantSpell`, `teach_spell`, `spell_grant`, `onItemAcquired` and `taughtBy` (Grep, 2026-10-03). `grantedBy` is **not** new. It is an existing display field on a power entry (`agentAttachments.ts:54`, filled from a bestowed trait node's `grantedBy` at :368), and the sheet renders it as *"Granted by <name>"* (`AttachmentsTab.tsx:242-244`, `ProwessTab.tsx:137-139`). This plan reuses that line for a god-taught spell rather than adding one. The four authored `attachment_grant` reactions (`encounter-content.ts:9977`, `counting-house-dispute.ts:230` and :298, `the-broken-seal.ts:259`) all grant items; none grants a spell.

**Population consumed:** 619 / 778 / 814 individuals; 104 / 122 / 123 knowers, all with free slots; 11 / 12 / 16 teaching tomes handed out per world in 150 ticks; one ascendant per world.

## Engine pillar

One ticket, three slices in build order. They are small enough to ship as one PR. The slices are review seams, not separate tickets.

| Slice | Delivers |
|---|---|
| **G1: One grant seam** | `grantSpell`; the three writers and the `attachment_grant` side door repointed; edge provenance |
| **G2: The god teaches** | the divine pool; Teach a Spell; the `spell_grant` reaction kind and its Cache card; the price of dark teaching |
| **G3: Books that teach** | the tome predicate; `onItemAcquired` at the three possession writers; the tome pool, with elder preference for ancient books |

### Systems design

**G1 — `grantSpell` (Lane decision 1).** A new module `src/engine/spellGrant.ts`:

```ts
export type SpellGrantSource = 'seeded' | 'learn_spell' | 'debug' | 'divine' | 'tome';
export interface SpellGrantOptions {
  source: SpellGrantSource;
  tick: number;
  grantedBy?: string;        // the ascendant id, for 'divine'
  viaItemId?: string;        // the item node, for 'tome'
  tradition?: string;        // as THR-1572 writes on seeded/learned edges
  evictWhenFull?: boolean;   // debug only: today's applySpellStamp behaviour
  extraEdgeProps?: Record<string, unknown>; // learn_spell's sphereAffinity, preserved
}
export interface SpellGrantResult {
  granted: boolean;
  wielded: boolean;          // false when the slots were full: known, not carried
  refused?: 'unknown_spell' | 'already_known' | 'missing_actor';
}
export function grantSpell(graph: WorldGraph, actorId: string, spellId: string, opts: SpellGrantOptions): SpellGrantResult;
```

It resolves the spell through `resolveSpellTemplate` and checks the definition node exists. It refuses `already_known`. It writes `knows_spell { learnedTick, source, grantedBy?, viaItemId?, tradition?, ...extraEdgeProps }`. If the wielded spell count is below `SLOT_CAPS.spell`, it also writes `has_trait { level: 1, ticksRemaining: null, source, visibility: 'discoverable', modifiers: {} }`; with `evictWhenFull`, it first evicts as `applySpellStamp` does today. It emits `spell.granted`, and never throws (NFP #4).

**Pure refactor first.** Before repointing, the executor pins the edges each of the three writers produces today (property-for-property snapshot tests on a seeded world, a learned spell and a debug stamp). After the repoint, those tests must pass unchanged. The `attachment_grant` side door is the one behaviour change: a template whose node is a spell definition (`subcategory: 'spell'`) routes to `grantSpell(source: 'tome' | 'divine' by the caller's context, else 'learn_spell')` instead of cloning. It is a latent defect today and is reached by nothing authored.

**G2 — The god teaches (Lane decisions 2, 3, 4).**

*The pool.* `pickDivineSpell(graph, ascendantId, targetId, worldSeed): string | null`:
1. Candidates: every spell definition node in the world (authored and generated) that the target does not know, with `tier ≤ DIVINE_TEACH_MAX_TIER` (2), whose prerequisites the target meets (`checkPrerequisites`, read-only).
2. First tier: the spell's `sphereAffinity` equals the god's `sphereAlignment.primary`. Second: `.secondary`. Third: the target's own tradition library (`getTraditionLibrary(graph, casterTraditionOf(...))`), so a god of a Foundation sphere, whose own sphere holds no low-tier spells (Foundation spells are tier 3–4 only), still teaches something true to the mortal.
3. Within the first non-empty tier: the lowest tier first, then one hashed pick keyed `teach:${worldSeed}:${ascendantId}:${casterSeedIdentity(target)}:${tick}`.
4. Nothing → `null`, and the card is unavailable on that target (§ UI pillar).

Elder magic is never taught by a god, because `DIVINE_TEACH_MAX_TIER = 2` sits below the Foundation floor (`SPELL_GEN_FOUNDATION_MIN_TIER = 3`). Elder magic stays discovered, not given.

*Teach a Spell.* A new divine action card `action.teach_spell`, built beside `action.bestow` and following it: star reach, essence `TEACH_SPELL_ESSENCE_COST` (4), target a threaded mortal, step `onSuccess: [{ op: 'teach_spell', nodeId: '$target' }]`. It is unlocked by the same investment beat as Bestow Power (`beat.pool.invest.the_favored_soul`), which gains the second unlock. The op resolves at the `bestow_power` site (`unifiedActionResolution.ts:~1925`) through `applyTeachSpell(state, ascendantId, agentId, tick)` in `ascendantExpression.ts`. That function checks the thread and the awareness gate exactly as `applyBestowPower` does (same constant), picks the spell, calls `grantSpell(source: 'divine', grantedBy)`, and applies the dark-teaching price.

*The `spell_grant` reaction kind (Lane decision 7).* `{ kind: 'spell_grant'; targetAgentId: string; selector: 'god' | 'tradition'; maxTier?: number }` joins `EncounterAftermathReactionEffect`. Its applier in `encounterAftermath.ts` resolves the player ascendant, picks with `pickDivineSpell` (`'god'`) or from the target's tradition library (`'tradition'`), and grants with `source: 'divine'`. A nudge card fired by the god is the god teaching, so `grantedBy` is always the player ascendant. It joins `PERSISTENT_EFFECT_KINDS`. No pick → the grant is skipped and traced (`spell.grant_skipped`); the card's other effects still apply.

*The price of dark teaching (Lane decision 4).* A spell is dark when `spellProvenance(graph, id)?.notice` is set, which is THR-1572's definition of a transgression. Authored spells carry no provenance, so the seven authored spells are never dark here. That matches their THR-1571 price table, where none is a generated transgression.
- **At teaching** (card or nudge): `accelerateDoomClock(doomClock, DIVINE_TEACH_DARK_DOOM)` (0.05, the card scale) and `applyRawDetectionDelta(…, region of the mortal, DIVINE_TEACH_DARK_DETECTION)` (0.15). Trace `spell.divine_teaching_priced`.
- **At each cast** of a god-taught dark spell: `resolveCast`, after the existing notice step, reads the caster's `knows_spell` edge to that spell. When it has `grantedBy`, it applies `applyRawDetectionDelta(…, DIVINE_TAUGHT_CAST_DETECTION)` (0.05) in the caster's region, and passes `taughtBy: grantedBy` to `placeSpellNotice`, so the one mark reads *"<spell> was cast — a god's teaching"*. Trace `spell.divine_echo`. A fizzled cast echoes too: the notice is placed on every cast in THR-1572, and this follows it.
- Gentler magic taught by a god costs the god only essence. The caster still pays the spell's own price, as any caster does.

Detection is regional and has no god id, but the player is the only god who teaches (rivals have no teaching verb), so regional pressure is the god's exposure, as every nudge cost already treats it. [THR-1690](https://linear.app/threadbare/issue/THR-1690) (in build, PR [#2182](https://github.com/christianspliid-ui/threadbare/pull/2182)) is what makes crossing a detection band bring a rival strike. This plan writes to the same pressure and needs nothing more from it.

**G3 — Books that teach (Lane decision 6).**

*The predicate.* `tomeTeaches(node): 'arcane' | 'ancient' | null` in `spellGrant.ts`:
- authored or cloned items: `subcategory === 'tomes_scrolls'`, tags include `#ancient` → `'ancient'`, else `#arcane` → `'arcane'`, and never when tagged `#map` (the five treasure maps carry `#ancient`);
- generated items: `properties.generated.coreId === 'forbidden_book'` → `'arcane'`, or `'ancient'` when the item's band is 3 or more.

*The hook.* `onItemAcquired(graph, holderId, itemId, tick, via: 'reward' | 'minted' | 'seized')`. It is called after the `possesses` edge write at the three writers: `rewardPool.ts:856`, `mintGeneratedItem` when `holderId` is set and differs from `makerId`, and `control:seize × Item`. If `tomeTeaches(item)` is null, it returns. If the item already taught this holder (`item.properties.taughtHolderIds` contains them), it returns. Otherwise it picks a spell and calls `grantSpell(source: 'tome', viaItemId: itemId)`, then appends the holder to `taughtHolderIds`, so a book teaches each reader once. A masterwork's maker does not learn from the book they wrote. The next holder does.

*The pool.* `pickTomeSpell(graph, item, readerId, worldSeed): string | null`:
1. Candidates: spell definition nodes the reader does not know, whose prerequisites they meet, at `tier ≤ min(itemTier, TOME_MAX_TIER[kind])` (arcane 2, ancient 3).
2. `'ancient'`: prefer Foundation-sphere spells (elder magic) if any exist in the world, then the rest.
3. `'arcane'`: prefer the reader's own tradition library (`casterTraditionOf`), then spells whose cast or carried Reach matches the book's reach tag (`#veil`, `#star`, …), then the rest.
4. Within the first non-empty preference: lowest tier, then a hashed pick keyed `tome:${worldSeed}:${itemTemplateOrCoreId}:${casterSeedIdentity(reader)}:${tick}`. Keyed on the reader's name, not a counter id (the THR-1572 same-seed lesson, `casterTraditionOf`'s comment).
5. Nothing → no teaching, traced `spell.tome_unread`. The book is still a book.

**The caster badge is unchanged (Lane decision 5).** `isCaster` reads the mastery trait, the role and the Veil floor exactly as today. A non-caster who reads a forbidden book carries its spell (a fate-woven spell works on its own) and can cast a deliberate one when a step fits: neither the step cast (`stepCast.ts`) nor `use × Power` asks `isCaster`. They cannot study for more, because `create × Power` does. *Item drops change who an agent is*, and the caster identity stays the earned one ruling 4 named.

### Graph nodes / edges

No new node type and no new edge type.

| Shape | Change |
|---|---|
| `knows_spell` edge | `source` gains `'divine'` and `'tome'`; optional `grantedBy` (ascendant id) and `viaItemId` (item id). Documented in `edgeSchema.ts` |
| `has_trait` edge (spell) | `source` gains the same two values |
| Item node (tome) | Optional `taughtHolderIds: string[]`, data internal to the item (who it has already taught). Not a relationship to traverse, since no system asks "which books taught X"; the reader's `knows_spell.viaItemId` is the traversable direction |
| `EncounterAftermathReactionEffect` | New member `spell_grant` (additive union member, § Blast Radius) |
| `UnifiedActionOp` | New op `teach_spell` beside `bestow_power` |

### Tick phases

None new. Teaching runs where divine actions and aftermath reactions already resolve. Book teaching runs inside the reward, mint and seize paths that already write `possesses`. The cast echo runs inside `resolveCast`.

### Resolution logic

There is no roll of its own. The divine card's own step band decides whether the teaching lands, as for Bestow Power: `onSuccess` only. Pools are sorted picks plus one hashed choice. The dark-teaching price is fixed constants.

### PRNG callouts

No `Math.random()`. Two hashed picks, both through `hashSeed` + `pickFrom` (`engine/naming/workNames.ts`), keyed as above (`teach:` and `tome:`). Neither consumes a shared stream, so no other draw in the tick shifts. Determinism test: same seed and inputs give the same taught spell, the same tome teaching, and the same edges.

## Content pillar

### Encounter templates

N/A. No encounter template is authored. The grant kind is usable by any future aftermath, and the one shipped user is a nudge card.

### Action cards

**Teach a Spell** (`action.teach_spell`), copying `action.bestow`'s shape:
- *name:* Teach a Spell
- *description:* "Put a working of your own into their hands. Dark magic taught is dark magic answered for."
- *success narrative:* "{target} wakes knowing {spell}, and does not remember learning it."

It needs `{spell}`: the op's result carries `spellName`, and the receipt composes the line from it. This follows the receipt pattern `applyBestowPower`'s `artifactId` already uses. No new `enrichProse()` placeholder.

**The Cache member** (Lane decision 7): `card.cache.variation.spirit`, *A Word Left Behind*. Essence 3, forecast 0, `grants: [{ kind: 'spell_grant', targetAgentId: '$actor', selector: 'god' }]`, context tags `['arcane', 'journey']` (the executor uses the nearest existing `DealContextTag` when `arcane` is not a member, and records the choice). Effect line: *"Something you know, they now know. They will not say where they learned it."* It is granted by the repertoire's existing progression path for Cache variation members (repertoire plan, Decision 7.2). `CARD_CONTENT` carries its title and quote, so `unauthoredCardCount() === 0` holds.

### The books that teach

No catalog entry is edited. The predicate selects these authored books (grep 2026-10-03):

| Book | Tier | Kind | Census draws (42 / 99 / 7) |
|---|---|---|---|
| Veilscript Fragment | 2 | arcane | 4 / 8 / 9 |
| Fading Ward | 2 | arcane | 1 / 0 / 1 |
| Book of Sealing | 2 | arcane | 0 / 2 / 0 |
| The Silent Testament | 3 | ancient | 6 / 2 / 5 |
| Codex of Unmaking | 4 (teaches at most tier 3) | ancient | 0 / 0 / 0 |
| Sealed Codex (anomaly) | 3 | ancient | 0 / 0 / 1 |

It also selects the generated *forbidden book* core ("the book that should not be read"), at any origin. The predicate excludes the five `#ancient` treasure maps by `#map`, the chronicles, the dossiers and the Tithe Box.

### Prose tables

- Sheet provenance: *divine* reuses the existing "Granted by <god's name>" line; *tome* adds "Learned from <item name>" in the same style. Seeded and studied spells show nothing new: THR-1572 already adds *Taught by* the tradition on its branch.
- Trace summaries in GM narration (prose canon), e.g. *"The Veilscript Fragment teaches Ser Aldric a working of the Veil."*
- No placeholder vocabulary is added.

### Data tables

`src/data/spell-grant-constants.ts` holds § Constants.

### UL

- **Spell** gains one sentence. *A mortal comes to know a spell five ways: seeded, studied, taught by a god, read from a book, or as anatomy (innate). The `knows_spell` edge records which.*
- **Bestowal** gains one sentence. *A god-taught spell is a Spell, not a Bestowal; Bestow Power and Teach a Spell are different cards.*
- No new term. *Tome* stays a plain-language word for a `tomes_scrolls` item, so no UL entry is proposed.

## UI pillar

UI Laws engaged (`Docs/design-system/laws.md`): **1** (one viewport), **13/14** (state words, no numbers in prose), **17**, **21**, **33**, **37**, and **56** (chips are state-backed: every chip below reads an edge).

### Player-facing display

- **Sheet** (`AttachmentsTab.tsx`): a god-taught spell shows the existing *"Granted by <god>"* line, because `agentAttachments.ts` resolves the god's name from the `knows_spell` edge's `grantedBy` id into `PowerEntry.grantedBy`. A book-taught spell shows *"Learned from <item>"* through a new sibling field, `learnedFrom`, rendered beside it in the same style. Both are read from the edge, never stored as prose.
- **Teach a Spell card**: before it is played, the card's target line names the spell it will teach ("will teach *Hollow Crown*"). *Lane decision, veto invited:* the god chooses the gift, so the god sees it, and the mystery tension (Vision `03-design-tensions.md`) is kept on the mortal's side, which only ever sees that they *know* it. The Vision auditor noted this as a soft lean toward legibility; naming only the sphere instead is a one-line change. The line is computed by `pickDivineSpell` on the current state (deterministic, so it matches the result). When the pick is null, the card is unavailable on that target with the reason "they know everything you could teach". For a dark spell it adds one word, *dark*, matching the card-cost vocabulary of the Heavy Hand line ("Anyone watching will know it was you").
- **Receipt** (the card's success narrative) names the spell, as above.
- **Cache card**: its effect line as authored. On resolution the existing grant chip shows "learned <spell>" (a chip on the `knows_spell` edge write; Law 56).

### Event notifications

None new. A book teaching an unthreaded mortal is world texture, visible on their sheet and in traces. A book teaching a threaded mortal reaches the chronicle through the existing reward line, which gains "and learned <spell>" when the reward's instantiate result carries a taught spell (`rewardResult.taughtSpellName`, additive).

### Debug inspection

- `window.__DEBUG.getSpellHolders()` (THR-1572) gains `source`, `grantedBy` and `viaItemId` per edge.
- New `window.__DEBUG.teachSpell(agentQuery, spellId?)` fires the divine path with the gates bypassed (the `applySpellStamp` pattern, `source: 'divine'`).
- New `window.__DEBUG.giveTome(agentQuery, templateId)` instantiates a reward book on a mortal through `instantiateReward`, so the hook runs for real.
- CLI: `spawn attachment <agent> reward_tomes_scrolls_veilscript_fragment` already instantiates a reward. It now teaches.

### Visual presence (HexMapV2)

N/A. Nothing new on the map.

### Review path

Browser verify with **Playwright DOM** (no WebGL surface changes) at `?view=game&seeded&size=medium&testavatar`. Steps: `window.__DEBUG.giveTome('@hero', 'reward_tomes_scrolls_veilscript_fragment')`, open the sheet (`openAgentSheet`), screenshot the Knows row. Then `window.__DEBUG.teachSpell('@hero')` and a second screenshot. The state assertion is `getSpellHolders()` showing `source: 'tome'` and `'divine'`.

## Wiring

| Module | Orchestrator / caller | UI | GameState / graph | Trace | Debug |
|---|---|---|---|---|---|
| `spellGrant.ts` `grantSpell` | seeding, `create × Power`, debug stamp, `instantiateReward` (spell templates), `applyTeachSpell`, `spell_grant` applier, `onItemAcquired` | AttachmentsTab | `knows_spell`, `has_trait` | `spell.granted` | `getSpellHolders` |
| `pickDivineSpell` | `applyTeachSpell`, `spell_grant` applier, the card's availability + target line | action card | read-only | (in `spell.granted`) | `teachSpell` |
| `applyTeachSpell` (`ascendantExpression.ts`) | `unifiedActionResolution.ts` `teach_spell` op | receipt | graph, `doomClock`, `regionalDetectionPressure` | `spell.divine_teaching_priced` | `teachSpell` |
| `spell_grant` applier (`encounterAftermath.ts`) | `collectNudgeGrants` → `applyEncounterAftermathReaction` | grant chip | graph | `spell.granted` / `spell.grant_skipped` | — |
| `onItemAcquired` + `tomeTeaches` + `pickTomeSpell` | `rewardPool.ts:856`, `mintGeneratedItem`, `control:seize × Item` | sheet, reward line | `knows_spell`, item `taughtHolderIds` | `spell.granted`, `spell.tome_unread` | `giveTome` |
| `resolveCast` echo (`spellCasting.ts`) | step cast and `use × Power` | — (mark) | `regionalDetectionPressure`, `hiddenMarks` | `spell.divine_echo` | CLI `eval state.hiddenMarks` |

`Docs/plans/wiring-checklist.md` gains the `grantSpell` and `onItemAcquired` rows. `Docs/plans/2026-04-16-systemic-wiring-guide.md` § Capability 37 gains the two channels: the `spell_grant` reaction kind (the content-facing capability) and the tome predicate (how to author a book that teaches: tag it `#arcane` or `#ancient`).

## Interface impact

| Contract (`scripts/interface-contracts.ts`) | Disposition | Note |
|---|---|---|
| `seeded-spell-holders` | **preserve** | Producer moves behind `grantSpell`; edges byte-identical, pinned |
| `mortal-learns-a-spell` | **preserve** | Same |
| `spell-cast-applies-effects` | **extend** | `resolveCast` gains the divine echo (detection write + `taughtBy` on the notice) |
| `attachment-encounter-rewards` | **extend** | `instantiateReward` calls `onItemAcquired`; spell templates route to `grantSpell` |
| `nudge-card-grants-dispatch-to-host-systems` | **extend** | One new kind, `spell_grant`, with its host system `grantSpell` |
| `nudge-card-cost-channels-detection-and-doom` | **preserve** | Teaching prices through the same two APIs, not through card costs |
| `generated-item-honest-vocabulary` | **preserve** | The forbidden book's promise "teaches fast, and changes whoever reads it" becomes literally true. No vocabulary row changes |
| **add:** `a-mortal-is-taught-a-spell-by-a-god-or-a-book` | **add** | Producers: `applyTeachSpell`, the `spell_grant` applier, `onItemAcquired`. Carrier: `knows_spell` (`source`, `grantedBy`, `viaItemId`). Readers: AttachmentsTab's provenance phrase and `resolveCast`'s divine echo. Registered in the same PR |

## Constants table

| Constant | Default | Purpose |
|---|---|---|
| `SPELL_GRANT_ENABLED_DIVINE` | `true` | Master switch for channel 1; `false` hides the card and skips `spell_grant` |
| `SPELL_GRANT_ENABLED_TOMES` | `true` | Master switch for channel 4; `false` makes `onItemAcquired` a no-op |
| `TEACH_SPELL_ESSENCE_COST` | `4` | The card's essence price (Bestow is 5; a spell is narrower than a stat gift) |
| `DIVINE_TEACH_MAX_TIER` | `2` | Highest tier a god teaches; below the elder floor by design |
| `DIVINE_TEACH_DARK_DOOM` | `0.05` | Doom the god pays for teaching a transgression (card scale) |
| `DIVINE_TEACH_DARK_DETECTION` | `0.15` | Detection in the mortal's region for teaching a transgression |
| `DIVINE_TAUGHT_CAST_DETECTION` | `0.05` | Detection per cast of a god-taught transgression |
| `TOME_MAX_TIER` | `{ arcane: 2, ancient: 3 }` | Highest tier a book of each kind teaches (also capped by the item's tier) |
| `TOME_TEACHING_GENERATED_CORES` | `['forbidden_book']` | Generated cores that teach |
| `TOME_ANCIENT_MIN_GENERATED_BAND` | `3` | A generated forbidden book at this band or above counts as ancient |
| `TOME_TEACHES_ONCE_PER_READER` | `true` | A book teaches each holder at most once |
| `CACHE_WORD_LEFT_BEHIND_ESSENCE` | `3` | Essence price of *A Word Left Behind* (authored in the card library, the repertoire's convention; named here so the number has a home) |
| `CACHE_WORD_LEFT_BEHIND_FORECAST` | `0` | Its forecast delta: the card changes who they are, not this roll |

## Tracing

```ts
// spell.granted — every channel, one shape
interface SpellGrantedTrace extends TraceBase {
  category: 'spell.granted';
  agentId: string; spellId: string; source: SpellGrantSource;
  wielded: boolean; grantedBy?: string; viaItemId?: string;
}
// spell.grant_skipped — a spell_grant or teaching found nothing to teach
interface SpellGrantSkippedTrace extends TraceBase {
  category: 'spell.grant_skipped';
  agentId: string; source: SpellGrantSource; reason: 'empty_pool' | 'already_known' | 'disabled' | 'gate';
}
// spell.tome_unread — a teaching book found nothing for this reader
interface SpellTomeUnreadTrace extends TraceBase {
  category: 'spell.tome_unread';
  agentId: string; itemId: string; kind: 'arcane' | 'ancient';
}
// spell.divine_teaching_priced — the god paid for teaching dark magic
interface SpellDivineTeachingPricedTrace extends TraceBase {
  category: 'spell.divine_teaching_priced';
  ascendantId: string; agentId: string; spellId: string; doomDelta: number; regionId: string; detectionDelta: number;
}
// spell.divine_echo — a god-taught transgression was cast
interface SpellDivineEchoTrace extends TraceBase {
  category: 'spell.divine_echo';
  ascendantId: string; casterId: string; spellId: string; regionId: string; detectionDelta: number; landed: boolean;
}
```

All five follow the live spell traces' shape (`SpellCastResolvedTrace extends TraceBase { category: … }`, `src/types/trace.ts`) and are registered in the category union and the registry beside them.

## Fail-soft table

| Failure | Fallback |
|---|---|
| Spell id resolves to no template or no definition node | `grantSpell` refuses `unknown_spell`, traced; nothing written |
| Target already knows every candidate | Pool empty → card unavailable / `spell.grant_skipped` / `spell.tome_unread`; no price charged |
| Slots full | Known, not wielded (the existing "known, not carried" sheet fact) |
| No ascendant / no `sphereAlignment` | Divine pool skips the sphere tiers and uses the mortal's tradition library |
| THR-1572 library absent (a world built with `SPELL_GEN_ENABLED = false`) | Pools read authored spells only; dark-teaching price never fires (no provenance) |
| Region unresolvable | `NUDGE_DETECTION_FALLBACK_REGION`, as the nudge path does |
| No `doomClock` | Doom half skipped, detection half still applies, traced |
| Any throw inside `onItemAcquired` | Caught; the item is still possessed; traced `spell.grant_skipped` reason `gate` |
| A seized book was already read by the seizer | `taughtHolderIds` makes it a no-op |

## Blast Radius

`src/types/unifiedAction.ts` (624 importers) and `src/types/trace.ts` (147) are touched, both additively. The first gains one member of the `EncounterAftermathReactionEffect` union and one `teach_spell` op. The second gains five trace interfaces in the union. Exhaustive `switch`es over the aftermath union (`applyEncounterAftermathReaction`, the composition contract, the honest-vocabulary and liveness probes such as `nudgeGrantLiveness.ts`) must gain the new case. `npm run check:typecheck` finds every one, and the executor does not leave a `default:` swallowing it. No existing member changes shape. `src/types/gameState.ts` is **not** touched.

## Three-pillar check

- [x] Engine: one seam, divine pool and card, grant kind, dark-teaching price, cast echo, tome predicate and hook
- [x] Content: Teach a Spell card, one Cache member, the book predicate over six authored books plus a generated core, provenance phrases
- [x] UI: sheet provenance, card target line and availability, receipt, grant chip, reward line
- [x] Wiring: § Wiring; wiring checklist and the systemic wiring guide updated

## Vision audit

- [x] No Vision premise contradicted:
  - **Systemic over scripted.** Teaching is one seam with five triggers. A book teaches by what it is (its tags), not by a list of exceptions.
  - **The god as meddler.** Ruling 5 says *"teaching forbidden magic is a characterful divine act with consequences"*, and this makes it real. The god pays in doom and in being seen, and every later cast echoes with the god's name on its mark.
  - **Elder magic, discovered not selected** (taste profile). Gods never teach it. An ancient book is the first way a mortal outside the old orders meets it. That is the *texts* half of the taste profile's *"through ruins, texts, and encounters"*; ruins and encounters stay open for later routes.
  - **Item drops change who an agent is** (THR-1231). A non-caster who picks up the Veilscript Fragment walks away carrying a working.
  - **No new player-facing number.** The prices are a state word on the card ("dark") and the existing detection and doom readouts.
- [x] No Vision edit owed.

## Rulebook impact

- [x] Changes a rule of play: how a mortal comes to know a spell.
  - `Docs/canon/rulebook-quick-reference.md` § Spells gains one sentence: *"A god can teach a mortal a spell from the god's own spheres. Dark magic costs the god doom and being seen, and keeps costing when it is cast. Some arcane and ancient books teach whoever holds them, and an ancient book can lead a mortal to elder magic."*
  - `Docs/canon/rulebook.md`'s spell section gains the same rule, tagged `[DESIGN — THR-1672]`. The executor flips it to `[IMPL]`.
- [x] UL: one sentence each on **Spell** and **Bestowal** (§ Content pillar → UL). No new term.

## NFP-compliance table

| NFP | Compliance |
|---|---|
| 1. Tunability | Every price, tier cap and switch is a named constant (§ Constants) |
| 2. Inspectability | Five traces; provenance on the edge; debug levers for both channels |
| 3. Determinism | Sorted picks plus keyed hashes on stable identities; no shared stream consumed |
| 4. Fail-soft | § Fail-soft; every entry point catches and traces |
| 5. Narrative over mechanics | Prices are fiction-first (dark teaching is answered for); books teach by what they are |
| 6. Additive | New module, optional edge properties, one union member, one op; the three writers keep their edges byte-identical |
| 7. Performance | No per-tick work. The hook runs on possession writes only (~150 reward instantiations per world per 150 ticks); pools scan spell definition nodes (≤ a few hundred) |

## Done when

- [ ] **Seam:** `grantSpell` is the only writer of `knows_spell` in `src/` (grep), and the snapshot tests pinning the three old writers pass unchanged.
- [ ] **Census re-run** ([`spell-gifts-tomes.ts`](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-09-25-living-world-data/readers/spell-gifts-tomes.ts), seeds 42 / 99 / 7, medium, 150 ticks; it already reports `knowsSources`):
  - `knowsSources.tome ≥ 5` per world;
  - at least one non-caster knows a spell on at least two of the three seeds;
  - nothing trips a kill criterion.
- [ ] **Headless divine path:**
  - the CLI fires Teach a Spell on a threaded mortal, in a world with a dark library spell;
  - the mortal gains `knows_spell { source: 'divine', grantedBy }`;
  - the doom clock and the region's pressure rise by the constants;
  - a cast of the spell places a mark whose label names the god's teaching, and adds `DIVINE_TAUGHT_CAST_DETECTION`.
- [ ] **Pool coverage:** the divine pool is non-empty for at least 95% of individuals on the three seeds at tick 0 (one census line). This proves the tradition fallback covers gods whose primary sphere is a Foundation sphere.
- [ ] **Determinism:** two runs on the same seed give identical `spell.granted` trace streams.
- [ ] **Browser-verify** (Playwright, 1920×1080, per § Review path), the four-part evidence:
  - a screenshot of the sheet showing both provenance lines;
  - the console (empty is valid);
  - a `getSpellHolders` assertion;
  - a UI-Laws line citing 1, 13/14, 17, 21, 33, 37 and 56.
- [ ] **Gates:** `npm test`, `npm run check:typecheck`, `npx vite build`, `npm run test:heavy`, the 30-tick CLI smoke, and both freshness gates.

## Kill criteria

- **Tomes flood the world with spells**: more than `3 × SLOT_CAPS.spell` known spells on any single mortal by tick 150, or tome-taught knowers above 15% of individuals. Then lower `TOME_MAX_TIER`, narrow the predicate to `#ancient` only, or switch tomes off, and report.
- **Dark teaching is never priced**: zero `spell.divine_teaching_priced` across a scripted run that teaches the same mortal three times, while that mortal's tradition library holds transgressions. Then the provenance read is broken; fix before ship.
- **The grant seam changes a seeded world**: any diff in seeded `knows_spell` edges against the pinned snapshot. Revert the repoint and ship G2/G3 against a thin wrapper.

## Coordination block

**Suggested model:** opus. It touches the aftermath union (624 importers), the cast resolver and three possession writers, and starts with a pin-then-refactor.
**Blocked by:** [THR-1572](https://linear.app/threadbare/issue/THR-1572) (needs `resolveSpellTemplate`, the tradition libraries and the notice module on `main`).
**Parallel-safe with:** [THR-1698](https://linear.app/threadbare/issue/THR-1698), [THR-1697](https://linear.app/threadbare/issue/THR-1697), [THR-1696](https://linear.app/threadbare/issue/THR-1696) (no shared files).
**Mutex with:**
- [THR-1626](https://linear.app/threadbare/issue/THR-1626) (both edit `src/engine/rewardPool.ts` reward instantiation and `itemGenerator/mintGeneratedItem.ts`; whichever lands second calls `onItemAcquired` from the other's new path);
- [THR-1683](https://linear.app/threadbare/issue/THR-1683) (both edit `src/engine/spellCasting.ts`);
- [THR-1690](https://linear.app/threadbare/issue/THR-1690) (both edit `src/engine/encounters/nudgeDispatch.ts`: this exports `resolveActorRegionId`);
- [THR-1700](https://linear.app/threadbare/issue/THR-1700) (both edit `src/data/unified-action-templates.ts` divine cards).

Re-check at claim time for any In-Dev ticket editing `src/components/Game/tabs/AttachmentsTab.tsx` or `src/data/nudge-card-library.ts`.

**Files to touch:**
- **Create:**
  - `src/engine/spellGrant.ts`: `grantSpell`, `pickDivineSpell`, `tomeTeaches`, `pickTomeSpell`, `onItemAcquired`; with `__tests__/spellGrant.test.ts` and the writer snapshot tests;
  - `src/data/spell-grant-constants.ts`.
- **Edit, the seam:**
  - `src/data/undertaking-objects.ts` (`create × Power`, `control:seize × Item`);
  - `src/engine/seedAttachments.ts` (`seedSpellKnowing`);
  - `src/engine/debugEncounterTools.ts` (`applySpellStamp`);
  - `src/engine/rewardPool.ts` (`instantiateReward`: the spell route and the hook);
  - `src/engine/itemGenerator/mintGeneratedItem.ts` (the hook);
  - `src/types/edgeSchema.ts` or its home (`knows_spell` properties).
- **Edit, the divine channel:**
  - `src/engine/ascendantExpression.ts` (`applyTeachSpell`);
  - `src/engine/unifiedActionResolution.ts` (the `teach_spell` op);
  - `src/data/unified-action-templates.ts` (`action.teach_spell`);
  - `src/data/ascendant-beat-content.ts` (the second unlock);
  - `src/types/unifiedAction.ts` (`spell_grant` kind, `teach_spell` op);
  - `src/engine/encounterAftermath.ts` (the applier);
  - `src/data/content-eval/compositionContract.ts` (`PERSISTENT_EFFECT_KINDS`);
  - `src/data/nudge-card-library.ts` (the Cache member and its `CARD_CONTENT`);
  - `src/engine/encounters/nudgeDispatch.ts` (export `resolveActorRegionId`);
  - every exhaustive switch the typecheck names (e.g. `src/engine/nudgeGrantLiveness.ts`).
- **Edit, the cast echo:**
  - `src/engine/spellCasting.ts`;
  - `src/engine/spellGenerator/notice.ts` (optional `taughtBy`).
- **Edit, UI:**
  - `src/engine/agentAttachments.ts` (`grantedBy` from the edge, `learnedFrom`);
  - `src/components/Game/tabs/AttachmentsTab.tsx` (the *Learned from* line);
  - the divine card's target line and availability (the component that renders `action.bestow`'s target today).
- **Edit, traces and debug:**
  - `src/types/trace.ts` (five categories, beside `spell.cast_resolved`);
  - `src/debug-bridge.ts` and `src/debug-bridge.d.ts` (`teachSpell`, `giveTome`, `getSpellHolders` fields).
- **Edit, docs:**
  - `Docs/canon/rulebook.md` and `Docs/canon/rulebook-quick-reference.md`;
  - `Docs/ubiquitous-language/Traits.md`;
  - `scripts/interface-contracts.ts`;
  - `Docs/plans/wiring-checklist.md`;
  - `Docs/plans/2026-04-16-systemic-wiring-guide.md`;
  - `public/nudge-cards-reference.html` (the wiki page whose sources include `nudge-card-library*.ts`).

## Notes for the executor

- **Pin before you repoint.** Snapshot the three writers' edges first, then refactor, then build G2 and G3 on the seam.
- `isCaster` is untouched. If you find yourself adding a fourth arm, stop: that is ruling 4, Christian's.
- `resolveActorRegionId` is private in `nudgeDispatch.ts:386`. Export it (or move it beside `applyRawDetectionDelta`) rather than copying it.
- The forbidden book's effect line, "teaches fast, and changes whoever reads it", is now literally true. Do not edit the core.
- **Out of scope, deliberately:**
  - rivals teaching spells;
  - mentorship transmission (THR-1231 left it as fog);
  - a tome-reading action, since a book teaches on acquisition;
  - new authored books;
  - delve-loot and faction-gift minting points;
  - changing Bestow Power;
  - the god teaching elder magic;
  - a per-god detection ledger;
  - the reward-draw share (THR-1626).

## Intent-judge verdict

**Run 1 — Allow** (cold spawn, fable, 2026-10-03). Impact class confirmed Reversible; all eleven dimensions PASS, 0 GAPs, 0 VIOLATIONs. Three non-blocking findings:

- **Dimension 1:** tomes are widened from generated-only to six authored books. The judge called this explicit and census-justified: generated-only would ship dead (0 generated tomes on three seeds), and THR-1231's own *"already the catalog's biggest families"* points at the authored catalog.
- **Dimension 1:** Bestow Power is kept, and Teach a Spell is added beside it. This is the *how* of an agreed outcome, marked as Lane decision 3 with a veto invited.
- **Handoff hygiene:** set the Linear `blockedBy` relation on THR-1572 at handoff, so the orchestrator's T1 scan does not promote this before PR #2178 merges. *Done at handoff.*

Substrate spot-checks the judge ran itself (eleven, all ✔) include:

- `edgeSchema.ts:566-583`, `ascendantExpression.ts:243/268`, `nudgeDispatch.ts:386`, `detectionPressure.ts:119`;
- the `#map` + `#ancient` treasure maps (so the exclusion is load-bearing);
- the green-field names at 0 hits;
- the THR-1572 exports absent from `main`.

## Forked-audit verdicts

### NFP audit
**PASS-with-notes.**
- Tunability: the Cache card's essence and forecast were not in the constants table. *Fixed: `CACHE_WORD_LEFT_BEHIND_ESSENCE` / `_FORECAST` added.*
- Additive: the three writers' repoint is a refactor, but it is pinned by snapshots with a kill criterion. The `attachment_grant` spell route is a deliberate behaviour change that closes a latent defect.
- Determinism, Inspectability, Fail-soft, Narrative and Performance: PASS.

### Three-pillar audit
**PASS.** Engine, Content and UI are present and substantive. Encounter templates and HexMapV2 are N/A with rationale. The wiring table connects every module. The substrate inventory extends the inventoried `spell` subsystem rather than duplicating it, and the THR-1572 dependency is declared.

### Vision audit
**PASS-with-notes.** No contradictions. The plan supports the north star (intervention consequential both ways) and non-negotiables #1, #3, #4 and #7, and respects the taste profile's elder-magic stance. Two notes:

1. The card naming the exact spell before play is a soft lean toward legibility over mystery. *Kept, and recorded as a lane decision with a veto invited in § UI pillar; naming only the sphere is a one-line change.*
2. "The one way to elder magic" overstated the taste profile, which also names ruins and encounters. *Fixed: now "the first way", the texts route, with ruins and encounters left open.*
