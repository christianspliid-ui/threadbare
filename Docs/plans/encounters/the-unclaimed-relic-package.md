# Pass 3b — Package critique: The Unclaimed Relic

> Batch: border-perils (THR-1221), row **3** · Pass: 3b (Package critic, THR-1154)
> Date: 2026-08-24 · Judged file: `Docs/plans/encounters/the-unclaimed-relic-final.md`

templateId: encounter.border.the_unclaimed_relic
packageVerdict: connected
packageLeaves: A real artifact — The Cold Reliquary — sitting in the agent's possessions for good, a bond with the other claimant that is warmed or soured and points at a person the world keeps, and an Under Watch mark on the place itself that the player can read on its Location Profile but that no system in the game acts on yet.

---

## Half A — anchoring

Ten authored chips across five bands. Every referent was checked against
`anchor-catalog.generated.md` and against the sentence that renders beside it.

| Chip | Referent | In the catalog? | Prose names it? | Verdict |
|---|---|---|---|---|
| `relic.crit.prize` | The Cold Reliquary, minted onto the agent | Yes — anchored through its **carrier**: actor/`individual` 🔗 linked (`entityId: '$actor'`, `visualKind: 'agent'`). Catalog clarification 1 + 2: an object the encounter itself creates counts as existing, and a category-only spawn has no template node, so the carrier is the anchor | Yes — *"The Cold Reliquary is in {actor}'s possessions now"*, a proper name, not a category | **anchored** |
| `relic.crit.told_them_how` | The bond with the other claimant | Yes — actor/`individual` 🔗 linked (`entityId: '$cast:claimant'`, `visualKind: 'agent'`); the underlying `relates_to` edge is a 📍 named edge anchor declared by its endpoints, both of which this band names | Yes — `{cast:claimant}` renders the resolved person's name (a reused NPC, else `Orin Vask`) | **anchored** |
| `relic.success.prize` | The Cold Reliquary | as above | as above | **anchored** |
| `relic.success.watched_ground` | The place the encounter happened at | Yes — `location` 📍 **named** (`entityId: '$target'`, **no `visualKind`**, which is exactly the catalog's declaration form). Concept carries `trait.condition.location.under_watch` as 🔗 linked attachment | Yes — `{target}` renders the resolved location's own name, so the chip reads *"Ashfell Ruin is under watch now"* | **anchored** |
| `relic.cost.prize` | The Cold Reliquary | as above | as above | **anchored** |
| `relic.cost.left_skin` | `trait.condition.wounded` on the agent | Yes — attachment · condition 🔗 linked, `entityId` = the **template** node id, `visualKind: 'attachment'` | Yes — `stateNoun.text` *'Wounded'* and concept *'wound'* both carry the template id; the detail names the wound | **anchored** |
| `relic.fail.the_fear_stayed` | `trait.condition.terrified` on the agent | Yes — attachment · condition 🔗 linked | Yes — *'Terrified'*, concept *'fright'* with the id | **anchored** |
| `relic.fail.two_who_failed` | The bond with the claimant | Yes — actor/`individual` 🔗 linked | Yes — `{cast:claimant}` | **anchored** |
| `relic.crit_fail.the_fear_stayed` | `trait.condition.terrified` | Yes — attachment · condition 🔗 linked | Yes | **anchored** |
| `relic.crit_fail.held_off` | The bond with the claimant, soured | Yes — actor/`individual` 🔗 linked | Yes — *"{cast:claimant} pulled them out and has kept a stride between them since"* | **anchored** |

**Half A: PASS. Zero `fold`, zero `bind`.**

Two notes on where the trap could have caught this packet and did not:

- **The location chip is not foldable.** `relic.success.watched_ground` anchors a
  place and carries no `visualKind`, so it cannot be clicked. The catalog is
  explicit that `named` satisfies Law 56 exactly as `linked` does, and folding it
  would be the exact error the trap warns about. The chip names the resolved
  location, the referent is a real graph node, and a real `has_trait` edge is
  written on it. It stands.
- **The prize chip anchors through a carrier, not through a template id.** That
  reads at first like an unanchored chip — the referent (the artifact) has no id at
  authoring time, because a category-only `spawn_artifact` mints its node at
  runtime. Catalog clarification 2 and the shipped vertical-slice precedent
  (`vertical-slice.ts:2394`, THR-1164) both sanction the carrier form, and the
  sentence names the object by its proper name. It stands.

### One binding I verified rather than inherited

The packet ships with an open flag: *"confirm `$target` binds to a location for
`encounter.border.*`"*. Both prior passes carried it forward unresolved, and the
batch's second location anchor rests on it — if `$target` does not bind, the write
no-ops fail-soft and the chip becomes an Unsafe Bridge (a chip claiming state
nothing wrote). I resolved it:

1. `SCENE_SENTINEL_FIELDS` registers `targetLocationId: 'location'`
   (`encounterAftermath.ts:684`, THR-1143), so `$target` on that field is bound at
   dispatch — not special-cased per condition branch.
2. `nodeMatchesSceneField(..., 'location')` accepts a **place-tier** location node
   (`isPlaceTierLocation`), deliberately excluding sublocations.
3. Both agent-driven creation paths set the target to the location for a
   non-social encounter: `phaseAgentDecision.ts:1058` is
   `targetId: sel.entry.targetAgentId ?? sel.entry.locationId`, and
   `EncounterCacheEntry.targetAgentId` is documented at `encounterCache.ts:107` as
   *"Target agent ID for social encounters (agent-to-agent). **Undefined for
   location encounters**"*. This template is a location encounter — gated by
   `locationSubtypes`, no social target, no cast-target effect kind.
   `actionCandidates.ts:78` sets `targetId: locationId` on the same principle.

**Verdict: `$target` binds.** The flag can be closed rather than carried into
implementation. The one residual is narrow and worth a line in the implementation
test: all eleven expanded subtypes must be **place-tier** location nodes, since a
sublocation-tier resolution would be refused by the kind check at step 2 (the
effect also carries `targetSublocationId`, but the multi-target guard at
`encounterAftermath.ts:1031` picks by priority rather than trying both, so
declaring both is not the fix). The batch's subtypes (`castle`, `fort`, `ruins`,
`ruined_tower`, `ruined_city`, `ruined_village`, `unexplored_poi`, `camp`, `oasis`,
`wilderness`, `battleground`) are location subtypes, not sublocation type ids —
`sublocation.ts:183` lists several of them as *parents* that host hidden
sublocations, which is the opposite reading.

---

## Half B — what this encounter leaves behind

### The table the batch report reads

| What is left | The write | Does a system read it? | Would the player see it? |
|---|---|---|---|
| **The Cold Reliquary** — an artifact node with `category: 'relic'`, `tier` unset ⇒ `'common'`, and a `possesses` edge to the agent | `successMetadata.effects` → `spawn_artifact`, dispatched through the same aftermath dispatcher as a reaction (`unifiedActionResolution.ts:923`, THR-783) — so it is unconditional on every success-side band | **Yes.** `contextBuilder.ts:73,208` walks the agent's `possesses` edges into encounter context; `attachmentSlotResolver`, `attachmentTierAdvancement`, `domainCapability` and `effectAura` all walk `possesses`; `detailPageResolvers.ts:393` builds its sheet from the incoming edge | **Yes.** It is in the agent's possessions permanently and the chip routes a click to it (`visualKind: 'artifact'`, 🔗 linked). *Honest caveat below.* |
| **A bond with the other claimant**, warmed on `critical_success` and `failure`, soured on `critical_failure` | band reactions → `bond_change`, writing a real bidirectional `relates_to` edge with clamped `sentiment`/`trust` (`encounterAftermath.ts:896–907, 4411`) | **Yes, and this is the encounter's real hook into the world.** `encounters/relationshipResolver.ts` resolves cast from `relates_to`, so the same person can be drawn back into a later encounter *and the bond decides how*; also read by `agentSelection`, `contextBuilder`, `ambitionTick`, `graphQueries`, `detailPageResolvers`, and the Bond overlay | **Yes.** Both sheets show the standing, the chip clicks straight to the person, and the person is `must-persist` so they are still there later |
| **`Under Watch` on the place** — a `has_trait` edge on the location node with `ticksRemaining` | the `success` reaction → `condition_attachment` with `targetLocationId: '$target'` | **No — not today.** `LOCATION_CONDITION_MOVEMENT_TAX` omits it *by design* (`condition-trait-content.ts:446`: being observed changes what you can do, not how long the road takes), and its declared reader — the `requiredTargetTraits` gate — has **no content gating on any `trait.condition.location.*` id**. See the grep below | **Yes.** `LocationProfileModal.tsx:91–111` renders active location conditions off the same `has_trait` edges, sorted by remaining term, so the player can open that place and read *Under Watch — 3 days* |
| **`Terrified`** on the agent for 24 ticks (both failure bands) | `failureMetadata.effects` → `apply_condition`, unconditional on the failure side | **Yes** — a live `CONDITION_TRAIT_DEFINITIONS` condition with a duration edge, counted down by `decayConditions` and read by the capability/condition stack | **Yes** — the agent's Attachments tab, with a term |
| **`Wounded`** on the agent (`success_at_cost`) | the band's reaction → `condition_attachment` | **Yes** — same path | **Yes** — same surface |

### The location-condition reader question, answered

The sibling encounter's systems pass is asking whether
`trait.condition.location.under_watch` has any reader in `src/`. It does not, and
the answer is worth carrying to the batch report because it is a **corpus** fact,
not a defect in this packet:

```
$ grep -rn "under_watch" src/ --include=*.ts --include=*.tsx
src/data/condition-trait-content.ts:323   ← the definition
src/data/condition-trait-content.ts:368   ← a comment about it
src/data/condition-trait-content.ts:414   ← its duration entry
src/engine/__tests__/locationConditions.test.ts:42,384   ← tests

$ grep -rn "requiredTargetTraits" src/data/ | grep "trait.condition.location"
(no output)
```

Both of the primitive's two readers miss it. Movement tax: omitted on purpose. The
gate: real machinery — `targetContextBuilders` puts the location's `traitIds` into
the target context and `targetActions.ts:281–288` gates on them — but **nothing in
`src/data/` gates on a location condition**. The one precedent the source comment
cites, `slice.kin.the_roof_opens` on `standing_welcome`, was retired by THR-1206
(reputation unification) and now has zero writers.

So this chip is a **factual claim about a place, with a real write and a real UI
row, and no consumer**. Per the pass's own framing, `SCAR` making a factual claim
is the defensible category for that; it is declared `scar · loss · loss`, not
`PATH`, so it never promises the game will act on it. If it had been authored as a
`PATH` — *"the way is open for someone to come back and watch this place"* — it
would be a `fold` or a `bind`, because the game has no opening to act on. It was
not, and the distinction is the whole reason this stage exists.

### Was the prose written *toward* its chips?

Yes, and demonstrably rather than by assertion. The three objects the chips point
at are all planted in the setting-neutral spine, in the order the bands consume
them: *the relic* → *the cold* → *the ring of dropped gear* → *the other claimant*.
Every chip's `causeClause` refers back to a spine image rather than to a new one:
the prize chips to the reach, the scar chips to the iron and the count, the bond
chips to the two of them at the ring. The `failure` overview — *"Their own pack is
on the ground now, three paces out, in the ring with the others"* — closes the ring
the spine opened *and* motivates the bond the band writes, in one image. That is
prose written for its consequences rather than prose that a consequence was bolted
onto afterwards.

The one place the pairing is thinner is the `success` band's location chip: the
overview earns it (*"That is a story now, and it will be told at the next fire"*
motivates the witness who will not keep quiet), but the world has nowhere to take
the story. The sentence does its job; the corpus does not yet do its half.

### Solitariness

Not solitary, and not close to it. This is a one-step `Single Test`, the shape most
at risk of being a closed loop, and it escapes on two counts:

- the **claimant is `must-persist`** with a real bond edge, so the encounter hands
  a *person* to the rest of the game — the one thing a later encounter can pick up
  without any new machinery, since cast resolution already reads `relates_to`;
- the **artifact is a permanent node**, not a printed line: it survives the scene,
  it is clickable, and it enters the possession walks that feed later encounter
  context.

**Honest caveat on the artifact.** A category-only spawn mints a node with
`category`, `tier`, `tags`, `sourceEncounterId` and `spawnedAtTick` — and **no
`statContributions`**, because there is no template to inherit them from. So The
Cold Reliquary is a **permanent, inspectable trophy and an enrichment noun**, not a
capability item: it will show up in possessions and in prose, and it will not move a
roll. That is correct for a rarity-1 open-draw encounter and the packet argues the
economy well, but the batch report should not describe it as a reward that makes
the agent better at anything. The Cache card's iron tongs, not the relic, are the
thing on this encounter that changes a number.

### Strongest and weakest connection

- **Strongest: the bond with the claimant.** A persistent person, a bidirectional
  `relates_to` edge with sentiment and trust, and the cast resolver already reads
  exactly that edge when choosing who appears in a later scene. Failure warms it and
  a critical failure sours it, so all three of the encounter's likely endings feed
  the same live channel from different directions. The player sees it on two sheets
  and can click straight through from the chip.
- **Weakest: `Under Watch` on the place.** The write is real, durable and
  player-readable, and no system in `src/` will ever ask about it. The state exists;
  nothing acts on it. It is the corpus's gap, not this encounter's error — this
  packet is the *second* content writer of a location condition and the first that
  isn't already deprecated — but it is the honest weak leg of the package and it
  should be named as such in the director's sample review rather than presented as
  a live consequence.

### One line for the batch report

> `trait.condition.location.*` has machinery on both sides — a write path, a
> decay path, a gate that reads location `traitIds`, and a Location Profile row —
> and **zero content on the reading side**. Two encounters in this batch now write
> a location condition. Nothing in `src/data/` gates on one. Worth one ticket to
> give the primitive its first live consumer, at which point both of this batch's
> location anchors go from *readable* to *acted on* with no content rewrite.

---

PACKAGE PASS
