> **title:** A bounty is collected in a duel — the faction's own people come for the mortal it names, the winner takes the coin, and an unclaimed bounty pays back — THR-2072
> **linear_issue:** THR-2072
> **author:** Claude Code (design lane, run 2026-10-26f, unattended)
> **created:** 2026-10-26
> **three_pillars:** Engine done · Content done (two spawn-only duel templates, one chronicle line) · UI done (a Blood-row line, a Means-tooltip cause and a chronicle line, all on existing surfaces — § UI pillar)

# A bounty is collected in a duel — THR-2072

*When a guild puts a price on a cast-out member, the guild's own people come for them. If one of them wins the fight, the price is paid; if nobody does, the coin goes home.*

## Why this is load-bearing

[Money encounters, later rows](https://linear.app/threadbare/issue/THR-1954) keeps the primitives the [mortal wealth plan](2026-10-15-thr-1936-mortal-wealth.md) left out. Its last money row is the bounty half of *"a faction's quest or bounty pays its finisher from the purse"*. The [commission plan](2026-10-25-thr-2042-faction-commission-pay.md) took the quest half and left the bounty with this reason: *"Collecting one means hunting a named mortal to a fight's end — the fight-end path, not a payout row."* This plan is that fight-end path.

Today a bounty is a promise nobody keeps (Game Design Law 45). On main @ b5fbb824:

- `executeIssueBounty` (`src/engine/phaseFactionActions.ts:740-803`) picks a `hostile_to` target, adds an `event` node (`eventType: 'bounty'`, `targetAgentId`, `reward: BOUNTY_REWARD` 10, `expiryTick` +40, `status: 'active'`), an `issues` edge, takes `BOUNTY_COST` (12) from the purse and adds the bare string `hunted` to the target's `conditions`.
- `grep -rn "'bounty'" src` outside tests: the writer and the world-object registry (`data/world-objects.ts:203`). `grep -rn "'hunted'" src`: the writer only. **Nothing reads a bounty, its `status` never changes, and `hunted` is never lifted.**
- The three bounty scenes (`fa.bounty_hunt`, `ag.senior.bounty_hunt`, `mc.quest.collect_bounty`) talk about collecting a bounty but bind no bounty node and name no target.

Census (`scripts/bounty-census.ts`, branch `proto/thr-bounty-census`, never merged; medium map, 360 ticks = 30 days, one process per seed):

| seed | bounties posted (issuers) | distinct targets | target kind | target already dead at posting | re-posted while the pair's last was open | target shared a place with an issuing-faction member | … with a member who makes choices | median hours shared | bounty scenes drawn | fights ended (all kinds) |
|---|---|---|---|---|---|---|---|---|---|---|
| 42 | 39 (9) | 16 | 39 individuals | 2 | 1 | 30 | 3 | 41 | 1 | 2 |
| 99 | 28 (8) | 15 | 28 individuals | 2 | 2 | 11 | 1 | 0 | 1 | 0 |
| 7 | 35 (8) | 16 | 35 individuals | 1 | 6 | 30 | 4 | 41 | 1 | 0 |

A bounty's target is an excommunicated former member (`executeIssueBounty` reads the faction's `hostile_to` edges, which excommunication writes), so they usually still live among the guild's people: for most bounties, a member shares their place for the whole 40-hour window.

## Decisions this plan builds on

**Decided by the design lane under delegation, 2026-10-26 (process.md rule 4) — the record is on [THR-2072](https://linear.app/threadbare/issue/THR-2072). Veto in chat.**

1. **A bounty is collected in a duel, not a scene.** While a bounty is open, a member of the issuing faction who shares a place with its target may come for them: a mortal duel (`fight.duel.bounty`), started the way a grudge boils over. The three bounty scenes stay as they are. They are drawn about once a month and bind no target, so making them collect would be three rewrites for one draw. *Veto:* "a bounty should be a scene the hunter is drawn to".
2. **The faction's own people do the hunting, seen or unseen.** Any living member of the issuing faction can come for the target. Members who make choices share a place with a target for only 1–4 bounties a month per world, so a decider-only hunt would leave almost every bounty unpaid. Mercenaries and the Adventuring Guild are not hunters in this slice. *Veto:* "only mortals who make choices may hunt".
3. **The coin is held and paid to the winner.** Posting still costs `BOUNTY_COST` (12). The `BOUNTY_REWARD` (10) part is now held on the bounty, and the other 2 are the faction's outlay, as today. If the hunter beats the target (the target yields, or is spared, mauled or slain), the bounty is collected: `hunted` is lifted, the held coin is paid out, and a hunter who makes choices gains one Means step (`MEANS_STEP`, the same scale as a commission, [THR-2042](https://linear.app/threadbare/issue/THR-2042) decision 2). An unseen hunter holds no Means; the coin is their pay off-screen. *Veto:* "a bounty should pay more than a commission".
4. **Death stays the duel's call.** A bounty adds no kill rule and no "dead or alive" choice. The [duel's own ending](2026-09-23-mortal-duels.md) decides it: the victor's mercy, the 25% kill draw for a ruthless victor, The First and the god's avatar never killed. A bounty duel's death reaches the world exactly like a grudge duel's.
5. **A bounty that nobody collects pays back.** At expiry, or when the target dies some other way, the bounty closes and its held coin returns to the purse. A faction posts at most one open bounty per target, and never on the dead. *Veto:* "a lapsed bounty's coin is spent anyway".

**Chance:** a hunter and their target who share a place roll `BOUNTY_DUEL_CHANCE_BASE` (0.02) × (1 + the hunter's courage lean), at most `BOUNTY_DUEL_CHANCE_MAX` (0.04), each hour. Census estimate at 0.02 (one duel per bounty at most, re-posts removed): **15.1 / 5.6 / 12.8 bounty duels a month** on seeds 42 / 99 / 7. At 0.05 it is 23.9 / 8.8 / 20.3, which would make bounties most of the world's fights; at 0.01 it is 9.0 / 3.4 / 7.7.

## Substrate inventory

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| Factions & Succession — Issue Bounty (`phaseFactionActions.ts:740-803`) | 🟢 writer; bounty node 🟠 DORMANT (written, never read) | **activates** the bounty node: `escrow`, `status` life cycle, one-per-target guard |
| Grudge duel trigger (`fights/grudgeDuelTrigger.ts`, THR-1558; `runGrudgeDuels` from `phaseColocationDetection.ts:156`) | 🟢 ACTIVE (0 spawns in the census) | **extends**: a second licence, "an open bounty of my faction on you", through the same pair walk, busy rules, cooldown map and stream shape |
| Mortal duels (`fight.duel.grudge`, agent-mode `fightBlock`, `decideBeatenDuellist` `fightEnding.ts:395`) | 🟢 ACTIVE | **reuses**: the bounty duel is the same block with its own lines |
| Fight-end dispatch (`FIGHT_END_BRANCHES`, `fightOutcome.ts:84`) | 🟢 ACTIVE | **extends** with one branch, `bountyCollectBranch` |
| Faction purse (`applyTreasuryDelta`, THR-1931) | 🟢 ACTIVE | refund through it |
| Mortal Means (`applyMeansShift`, `mortalMeans.ts`, THR-1936) | 🟢 ACTIVE | **reuses** the shift, new reason `'bounty'` |
| Person sheet Blood row (`personRows.ts:675`, `getAgentGrudges` `agentDetail.ts:1449`) | 🟢 ACTIVE | **extends** with one line for an open bounty |

Greps on main @ b5fbb824, each 0 hits in `src/`: `fight.duel.bounty`, `bountyCollect`, `BOUNTY_DUEL`.

## Engine pillar

### Systems design

New module `src/engine/factionBounties.ts` (pure graph reads and writes, no PRNG of its own):

- `openBountiesOn(graph, targetId, tick)` → the `bounty` nodes whose `targetAgentId` is the target, `status` absent or `'active'`, `expiryTick > tick`, sorted by `createdTick`, then id.
- `huntableBounty(graph, hunterId, targetId, tick)` → the oldest open bounty on the target whose `issuingFactionId` is a faction the hunter has a `member_of` edge to, or `null`.
- `collectBounty(state, bountyId, hunterId, tick)` → writes `status: 'collected'`, `collectedTick`, one `collected` edge (hunter → bounty, `{ tick }`), moves `escrow` to `escrowPaid`; if `isAutonomousDecisionActor(hunter)`, `applyMeansShift(hunter.properties, BOUNTY_MEANS_PAY, 'bounty')`; then `liftHuntedIfClear`.
- `closeBounties(state, tick)` — every tick: an active bounty past `expiryTick`, or whose target is gone (`isAgentGone`) or is not an individual mortal, gets `status: 'lapsed'` and its `escrow` back through `applyTreasuryDelta`; then `liftHuntedIfClear` for its target.
- `liftHuntedIfClear(graph, targetId, tick)` — removes `hunted` from `conditions` when no open bounty is left on them.

Edits:

- `executeIssueBounty`: pick only among `hostile_to` targets that are individual mortals (`actorType: 'individual'`, not `isAgentGone`). The faction → faction edges written by a crown rebellion (`crown.ts:784-789`) and a rising (`unrestPressure/rising.ts:108-111`) are filtered out before the pick, not after, so a faction with mortal enemies still posts. Skip a target that already has an open bounty from this faction (`return null`, so the faction does something else and spends nothing). Write `escrow: BOUNTY_REWARD` and `status: 'active'`; drop the unread `reward` stamp. Cost and gate unchanged.
- `grudgeDuelTrigger.ts`: inside the existing pair walk, when the pair holds no injury grudge, check `huntableBounty` both ways. A hit runs the same busy, cooldown and never-duellist checks, rolls `bountyDuelChance(hunterCourage)` on `bountyDuelRng(seed, tick, pairKey)` (salt `BOUNTY_DUEL_STREAM_SALT`), and spawns the duel. The actor is the hunter (`FIGHT_DUEL_BOUNTY_ID`), unless the target is threaded and the hunter is not: then the target is the actor (`FIGHT_DUEL_BOUNTY_DEFENCE_ID`), because the god's hand reaches only the actor (the grudge actor rule). A pair with both a grudge and a bounty runs the grudge roll only.
- `fightOutcome.ts`: `bountyCollectBranch` appended to `DEFAULT_FIGHT_END_BRANCHES`, after `fighterEndingBranch`. It acts only on the two bounty templates. The loser is the side whose ending is `yielded_to_mortal`, `spared`, `mauled` or `slain`; if the loser has an open bounty the winner can hunt (`huntableBounty(winner, loser)`), it calls `collectBounty` and returns one chronicle event. Any other end leaves the bounty open, and the pair's existing 80-hour fight cooldown stops a rematch inside the window.
- `phaseFactionActions` calls `closeBounties` every tick, right after `tickFactionGovernance(state)` (`phaseFactionActions.ts:953`), which already runs every tick before the `FACTION_ACTION_INTERVAL` gate at `:961`. If THR-2042's `lapseCommissions` has landed there first, the two sit side by side.
- `describeWealthSource` (`agentDetail.ts:1013`) gains `case 'bounty': return BOUNTY_CAUSE_LINE;`.
- `agentDetail` sheet card gains `bountiesOn?: { factionId; factionName }[]` from `openBountiesOn`, set only when one is open.

### Graph nodes / edges

No new node type. The `bounty` event node gains `escrow`, `escrowPaid`, `status` (`'active' | 'collected' | 'lapsed'`), `collectedTick`; it loses the unread `reward`. **One new edge type, `collected`: agent → bounty, at most one per bounty, `requiredProperties: ['tick']`**, in `src/types/graph.ts` and its `EDGE_SCHEMA` row beside `issues`. Who collected a bounty is a relationship (load-bearing: relationships are edges). `took_up` (THR-2042, not yet built) is not reused: it means "took the work on", and a bounty is never taken on, only collected. `participated_in` is not reused for the reason THR-2042 gives (15 readers would count it as an encounter).

### Tick phases · Resolution · PRNG

Trigger: `phaseColocationDetection`, after the grudge pass. Collection: fight end. Close: `faction_actions`, every tick. **PRNG:** one roll per eligible pair per hour on its own stream, `mulberry32(seed + tick × BOUNTY_DUEL_STREAM_SALT + hash(pairKey))`, never the detection stream, so every other colocation roll is unchanged with the switch off. Plain dice: this is a world event the player does not track (Law 5); Law 1 is measured as bounty duels a month (§ Done when).

## Content pillar

### Encounter templates

Two spawn-only templates in `src/data/encounters/fight-duel-bounty.ts`, each an agent-mode `fightBlock` like `fight.duel.grudge`, with no `locationSubtypes` and no cache registration:

| id | name | actor | opening (nerve) | goal / won / lost |
|---|---|---|---|---|
| `fight.duel.bounty` | The Price on Their Head | the hunter | "{name} finds {target} near {location}. There is a price on that head, and {name} has come to collect it." | collect a price on an old comrade's head · collected the price on {target}'s head · let the price on {target}'s head go unpaid |
| `fight.duel.bounty_defence` | Hunted | the hunted | "{target} has come for {name} near {location}, for the price on {name}'s head." | send the hunter away unpaid · sent the hunter away unpaid · was run down by the hunter who came for them |

Each carries a `RESULT_LINES` table for all seven `FightResult`s, read from the actor's side as the grudge duel's are. The lines are fixed here, because each one must agree with whether the bounty was collected (`overcome` for the hunter, and `struck_down` or `yielded` for the hunted, are the results that collect). `bargained` and `driven_off` are NPC-mode results a duel never reaches, so they carry a line only so every key resolves.

| result | `fight.duel.bounty` (actor = hunter) | `fight.duel.bounty_defence` (actor = hunted) |
|---|---|---|
| `overcome` | "{name} got the better of {target}." | "{name} beat {target} and sent the hunter away unpaid." |
| `struck_down` | "{target} cut {name} down. The price on {target}'s head still stands." | "{target} cut {name} down and collected the price on {name}'s head." |
| `yielded` | "{name} gave way to {target}. The price on {target}'s head still stands." | "{name} gave way to {target}, and the price on {name}'s head is paid." |
| `routed` | "{name} ran from {target}. The price on {target}'s head still stands." | "{name} ran from {target}, and got away. The price on {name}'s head still stands." |
| `broke_off` | "Neither of them was beaten. The price on {target}'s head still stands." | "Neither of them was beaten. The price on {name}'s head still stands." |
| `bargained` | "{name} and {target} came to terms. The price still stands." | same |
| `driven_off` | "{target} backed away from {name}. The price still stands." | same |

The stakes line the player reads before the fight (`goal`, above) names the price, and the result line says, in the same words, whether it was paid, with one exception. From the hunter's side, a target who was beaten and a target who ran both read `overcome` (the opponent's side is `opponentLoss`, `fightEnding.ts:487-493`), and only the first collects. So the hunter's `overcome` line does not say whether the price was paid; the chronicle line below says it, and only when it was.

### Prose tables

`BOUNTY_CHRONICLE_LINE = '{hunter} collected the price on {target}\'s head at {place}.'` in `src/data/fight-ending-content.ts`, emitted by `bountyCollectBranch` beside the fight's own face line, filled by the same `fillLine` (`fightEnding.ts:704`), so an empty place reads `FIGHT_CHRONICLE_NAMELESS_PLACE` as every fight line does. The line names no faction, so no article is ever added to a name. The `BountyTrace.summary` is this same sentence. When the hunter's result is `overcome` but the target ran (`opponentLoss: 'routed'`), the branch emits `BOUNTY_ESCAPED_LINE = '{target} got away from {hunter} at {place}; the price on their head still stands.'` at routine significance (event log, not chronicle), so the one case the hunter's result line cannot tell is still told.

## UI pillar

All three surfaces already exist. UI Laws engaged: 21 (names are links), 13 (words, never an amount), 56 (state-backed: a line exists only while its bounty does), 43 (Means ladder and Blood row, no new concept).

### Player-facing text

| Surface | Exact text the player reads | Complaint class | How the player understands it |
|---|---|---|---|
| Person sheet, **Blood** row (Bonds tab), the target, while a bounty is open | "**The Adventurers Guild** has put a price on their head." (the faction's node name verbatim, a link; faction names carry their own "The", `faction-definitions.ts:53`, so the line adds none) | PC-2 (today `hunted` is written and shown nowhere: a hidden rule) | This mortal is being hunted, and by whom. |
| Duel opening and stakes (hunter acts) | "Edda Vane finds Joss Harl near Millbrook. There is a price on that head, and Edda Vane has come to collect it." Goal: "collect a price on an old comrade's head" | PC-2 (the stakes before the roll) | Why these two are fighting. |
| Duel result, hunter wins / hunter runs | "Edda Vane got the better of Joss Harl." (the chronicle line says if the price was paid) / "Edda Vane ran from Joss Harl. The price on Joss Harl's head still stands." | PC-2 (the result in the stakes' words) | Whether the price was paid. |
| Duel opening, stakes and win (hunted acts, a threaded target) | "Edda Vane has come for Joss Harl near Millbrook, for the price on Joss Harl's head." Goal: "send the hunter away unpaid". Win: "Joss Harl beat Edda Vane and sent the hunter away unpaid." | PC-2 (the win says the goal's words; the price itself lapses only with time) | The player's mortal is being hunted, and can be helped. |
| Blood row, two factions with a price on the same mortal | One line per faction, in posting order: "The Adventurers Guild has put a price on their head." / "The Iron Company has put a price on their head." A faction never has two open on one mortal (decision 5), so no line repeats. | PC-5 | Each faction hunting them, once. |
| Chronicle (notable), on collection | "Edda Vane collected the price on Joss Harl's head at Millbrook." (beside the duel's own face line, e.g. "Edda Vane beat Joss Harl at Millbrook, and let them live.") | PC-4 (a mortal's fight, and maybe death, comes with its cause said) | Why this fight happened and who was paid. |
| Character sheet, Means tooltip cause (`describeWealthSource`), the hunter | "a price their faction paid for" | PC-6 (one constant, `BOUNTY_CAUSE_LINE`) | Where the money came from. |

The duel itself renders through the existing fight header and aftermath (plan doc 4 of the Physical Conflict map); the template's own lines name the price.

### Playtest signal

A tester who opens a cast-out mortal's sheet reads that a faction has put a price on their head; when that mortal is later beaten in a duel by one of the faction's people, the chronicle says the price was collected.

- **HexMapV2:** N/A. A bounty has no place on the map, and a duel already shows as a fight.
- **Debug:** `window.__DEBUG.getBounties(factionId?)` → `{ id, factionId, targetId, status, escrow, createdTick, expiryTick, collectedBy?, collectedTick? }[]`, typed in `src/debug-bridge.d.ts`. CLI: `spawn duel <hunter> --with <target> --bounty`, a flag on the existing `spawn duel` (`scripts/cli.ts:2874`) that posts the bounty if none is open and stages `fight.duel.bounty`.
- **Browser-verify:** under 400 non-test UI lines, so one 1920×1080 screenshot of a hunted mortal's Blood row (Playwright DOM, `?view=game&seeded&size=medium`) plus the `getBounties` assertion.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|---|---|---|---|---|---|
| `grudgeDuelTrigger.ts` bounty licence | `colocation_detection` | fight header (existing) | `unifiedActions`, `fightCooldowns` | `fight.trigger` (`source: 'bounty'`) | `getBounties`, `getFightState` |
| `bountyCollectBranch` + `collectBounty` | fight end (`finalizeFightEnd`) | chronicle panel; sheet Means tooltip | bounty node props; hunter `wealth`, `lastWealthReason` | `economy.bounty` (`collected`) | `getBounties` |
| `closeBounties` | `faction_actions`, every tick | Blood row line disappears | bounty node props; faction `wealth`; target `conditions` | `economy.bounty` (`lapsed`) | `getBounties` |
| `bountiesOn` on the sheet card | — (read on sheet open) | `personRows.blood` | — | — | sheet |

Wiki: `public/factions-cultures-reference.html` (the wiki-freshness gate names the page).

## Interface impact

| Contract | Change | Note |
|---|---|---|
| Factions → Agents: a bounty pays its collector (`bounty-pays-collector`) | **add** (write) | read by `agentDetail.ts` (Means word + cause) and `readMeansWant` |
| Factions → Economy: a lapsed bounty refunds the purse | **add** (write) | read by the purse's own `readWealth` |
| Factions → Fights: an open bounty licenses a duel (`bounty-licenses-duel`) | **add** (read) | read by `grudgeDuelTrigger.ts` |
| `faction-purse-pays-faction-holders` | preserve | income untouched |

Register the three in `Docs/canon/interface-map.md` and `scripts/interface-contracts.ts`.

## Constants table

| Constant | Default | Purpose |
|---|---|---|
| `BOUNTY_DUEL_CHANCE_BASE` | 0.02 | hourly chance a hunter comes for a co-located target, before courage |
| `BOUNTY_DUEL_CHANCE_MAX` | 0.04 | ceiling after the courage lean |
| `BOUNTY_DUEL_STREAM_SALT` | 7019 | the trigger's own stream (distinct from `GRUDGE_ESCALATION_STREAM_SALT` 6263) |
| `BOUNTY_MEANS_PAY` | `MEANS_STEP` (6) | Means a decider collector gains |
| `BOUNTY_REWARD` | 10 (existing) | now the escrow a bounty holds |
| `BOUNTY_COST` / `BOUNTY_EXPIRY` | 12 / 40 (existing) | unchanged |
| `BOUNTY_CAUSE_LINE` | `'a price their faction paid for'` | Means-tooltip cause (`mortal-means-constants.ts`) |
| `BOUNTY_BLOOD_LINE` | `{ lead: '', tail: ' has put a price on their head.' }` | Blood-row line (`person-sheet-words.ts`) |
| `FACTION_BOUNTIES_ENABLED` | `true` | rollback: `false` restores today's behaviour (no trigger, no collection, no refund, no guard) |

Fight constants (`FIGHT_DUEL_KILL_CHANCE_RUTHLESS`, `GRUDGE_DUEL_COOLDOWN_TICKS`) are reused, not copied.

## Tracing

`'economy.bounty'` joins `TraceCategory` and `TRACE_CATEGORIES` (`src/types/trace.ts`); `FightTriggerGrudgeTrace.source` widens to `'grudge' | 'bounty'` with an optional `bountyId`.

```ts
export interface BountyTrace {
  category: 'economy.bounty';
  tick: number;
  action: 'collected' | 'lapsed';
  bountyId: string;
  factionId: string;
  targetId: string;
  escrow: number;
  reason?: 'expired' | 'target_gone'; // lapsed only
  hunterId?: string;                  // collected only
  meansPaid?: boolean;                // collected only: false for an unseen hunter or a clamped shift
  summary: string;                    // collected: BOUNTY_CHRONICLE_LINE filled; lapsed: "The Adventurers Guild's price on Joss Harl lapsed; 10 back to the purse"
}
```

## Fail-soft table

| Failure case | Fallback |
|---|---|
| bounty made before this ships (no `escrow`, `status: 'active'`) | escrow reads 0; it can still be collected and lapses with no refund |
| issuing faction gone at close | `lapsed`, nothing refunded |
| hunter belongs to no issuing faction / target gone / no open bounty at fight end | no collection, nothing written |
| `applyMeansShift` returns null (clamp, Means off) | still collected; `meansPaid: false` |
| a second `collected` edge would be written | treated as collected; never a second edge |
| bounty template missing | traced `no_template` once, as the grudge trigger does; no spawn |
| a `hostile_to` target that is not an individual mortal (a faction, from a rebellion or a rising) | never picked by `executeIssueBounty`; an old bounty already on one (made before this ships) is closed by `closeBounties` as `lapsed` with `reason: 'target_gone'`, refunding its escrow (0 for an old one) |
| any throw in trigger, branch or close | caught per bounty or pair; the tick and the fight's own ending go on |

## Blast Radius

| File | Importer count | Cascade-risk note |
|---|---|---|
| `src/types/graph.ts` | 329 (`grep -rl "types/graph'" src scripts`, main @ b5fbb824) | one `EdgeType` member (`collected`); the exhaustive consumer is `EDGE_SCHEMA`, which this plan extends |
| `src/types/trace.ts` | 142 (same grep for `types/trace'`) | one union member, one category; no consumer must change |

Below the threshold: `fightOutcome.ts` 13 importers, `agentDetail.ts` 24, `phaseFactionActions.ts` 4, `grudgeDuelTrigger.ts` 2.

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar present (two spawn-only templates, one chronicle line)
- [x] UI pillar present (Blood-row line, Means cause, chronicle; debug accessor)
- [x] Wiring section connects them

## Game Design Laws

Conforms to 45 (a posted bounty is a promise the world now keeps), 42 (rides the grudge trigger and the fight-end branch list; no per-faction case), 41 (Means through `applyMeansShift`), 25 (death stays rare, behind the duel's own gate), 22 (an uncollected bounty refunds and lifts `hunted`; a lost duel writes the duel's scar and grudge), 15 (bounty duels interrupt only a followed mortal, by the fight's existing rule), 36 (cost unchanged), 1 and 5 (plain dice on a world event; measured as duels a month). Breaks none.

## Vision audit

- [x] No Vision premise contradicted: `Vision/01-core-loop.md` (consequences compound: a collected bounty leaves a scar, a grudge or a death), `Vision/02-non-negotiables.md` (prose not numbers; the graph is the substrate), `Vision/03-design-tensions.md` (death stays rare and caused).
- [x] No Vision edit needed.

## Rulebook impact

- [x] A rule of play changes: a faction's bounty can now be collected, and an uncollected one refunds.
- [x] The rulebook edit is owed in the build PR, not as a follow-up. Add to `Docs/canon/rulebook.md` (after the commission line, THR-2042) and the quick reference's Means paragraph: *"A faction that puts a price on a mortal's head holds the coin. Its own people may come for that mortal in a duel; the one who beats them collects, and a price nobody collects goes back to the faction."* (`[IMPL — THR-2072]`).

> Brainstorm companion: `Docs/plans/2026-10-26-thr-2072-bounty-collected-in-a-duel-brainstorm.md`.

## NFP-compliance table

| NFP | Verdict | Note |
|---|---|---|
| 1. Tunability | PASS | chance, cap, salt, pay and a switch are named |
| 2. Inspectability | PASS | bounty carries its life cycle; `economy.bounty` and `fight.trigger` traces; `getBounties` |
| 3. Determinism | PASS | own seeded stream per pair; id order everywhere else |
| 4. Fail-soft | PASS | table above |
| 5. Narrative over mechanics | PASS | a cast-out member is hunted by their old guild, said in prose |
| 6. Additive | PASS | new props, one edge type, one branch, one licence; the dead `reward` stamp retired |
| 7. Performance | PASS | the bounty check runs inside the existing pair walk only for pairs with no grudge, and is one edge read per side; close walks ~40 bounties a month per world |

## Done when

- [ ] `factionBounties.test.ts`: a member co-located with the target can spawn a bounty duel (forced roll); a non-member, the target alone, a dead target and a cooling pair cannot; the hunter is the actor unless only the target is threaded; a pair with an injury grudge rolls the grudge only; `executeIssueBounty` refuses a gone target, a faction target (a rebellion `hostile_to`) and a second open bounty from the same faction; a beaten target (yielded, spared, mauled, slain) is collected once, with one `collected` edge passing `EDGE_SCHEMA`, a decider hunter's Means +`BOUNTY_MEANS_PAY`, an unseen hunter's none, and `hunted` lifted; a target who wins, flees or breaks off leaves the bounty open; a lapse refunds `escrow` once and lifts `hunted`; the switch off restores today's behaviour.
- [ ] `npm run census:bounties` (the proto script, landed under `scripts/` and extended to count spawned bounty duels and collections) on seeds 42/99/7 × 360 ticks: **bounty duels per month between 3 and 25 on every seed**; at least one bounty collected on two of three seeds; `collected + lapsed + active = posted`; escrow posted = paid out + refunded + still held.
- [ ] Rulebook + quick reference lines, interface map + contracts, wiki sentence; `npm run gate` green; one 1920×1080 screenshot of a hunted mortal's Blood row and the `getBounties` assertion.

## Kill criteria

- More than 25 bounty duels a month on any seed: halve `BOUNTY_DUEL_CHANCE_BASE` and re-run once. Still above → ship with the switch off and set the ticket back to Todo with the census.
- Fewer than 3 on any seed: double it once; still below → the same.
- More than 3 bounty-duel deaths a month on any seed: a death-rate finding for the duel's kill draw, not this plan; file it and ship.

## Coordination block

**Suggested model:** opus — a trigger licence, a fight-end branch, two templates and a sheet line across engine, content and UI.

**Parallel-safe with:** [famine and glut draws](https://linear.app/threadbare/issue/THR-2040) (scoring only).

**Mutex with:** [a faction's commission pays](https://linear.app/threadbare/issue/THR-2042) — both edit `phaseFactionActions.ts`, `graph.ts`/`edgeSchema.ts` (one edge each), `trace.ts`, `describeWealthSource` and `mortal-means-constants.ts`; rebase onto whichever merges first.

**Files to touch:**
- Create: `src/engine/factionBounties.ts`, `src/data/encounters/fight-duel-bounty.ts`, `src/engine/__tests__/factionBounties.test.ts`, `scripts/bounty-census.ts` (from `proto/thr-bounty-census`) + `census:bounties` in `package.json`
- Edit: `src/engine/phaseFactionActions.ts`, `src/engine/fights/grudgeDuelTrigger.ts`, `src/engine/fights/fightOutcome.ts`, `src/data/fight-ending-content.ts`, `src/data/fight-constants.ts`, `src/types/factionAction.ts`, `src/types/graph.ts`, `src/types/edgeSchema.ts`, `src/types/trace.ts`, `src/types/traces/fight-traces.ts`, `src/engine/agentDetail.ts`, `src/engine/views/subjects/personRows.ts`, `src/data/person-sheet-words.ts`, `src/data/mortal-means-constants.ts`, the template registry, `src/debug-bridge.ts`, `src/debug-bridge.d.ts`, the CLI `spawn duel` command
- Edit: `Docs/canon/rulebook.md`, `Docs/canon/rulebook-quick-reference.md`, `Docs/canon/interface-map.md`, `scripts/interface-contracts.ts`, the wiki page

## Notes for the executor

Do not bind the three bounty scenes (decision 1). Do not add a kill rule (decision 4). Do not read the retired `reward` prop: the escrow is the coin.

## Intent-judge verdicts

| Run | Verdict | Findings | Fixed by |
|---|---|---|---|
| 1 | Revise | dim 12 GAP: the duel templates' result lines unquoted and no rendered sample; the chronicle line, its sample and the trace summary worded three ways, with no rule for a "The …" faction name or an empty place. dim 3 note: `closeBounties` anchored on THR-2042's unbuilt call. Proposal non-goal contradicted decision 5 | all seven result lines per template fixed in § Encounter templates (and the hunter's `overcome` line made silent on pay, since a fled target also reads `overcome`); one chronicle sentence with no faction name, `FIGHT_CHRONICLE_NAMELESS_PLACE` for an empty place, the trace summary the same; anchored after `tickFactionGovernance` (`:953`); proposal non-goal reworded |
| 2 | Revise | dim 12 GAP: the hunted side's goal "live to see the price lifted" is something no win delivers; two factions' prices on one mortal unquoted. dim 4 GAP: `hostile_to` also points at factions (crown rebellion, rising), and the plan said nothing of a faction target | goal now "send the hunter away unpaid", and the won and `overcome` lines say the same; the Blood row quoted for two factions (one line each, no repeats); `executeIssueBounty` picks only individual mortals, and `closeBounties` closes an old faction-target bounty (fail-soft row) |
| 3 | **Allow** | non-blocking dim 12: when the target runs, nothing on the duel says the price still stands | `BOUNTY_ESCAPED_LINE`, routine event (§ Prose tables) |

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-10-26*

### NFP audit
PASS-with-notes. All seven pass. Note on 6 (additive): the plan retires the unread `reward` stamp and changes `executeIssueBounty` to filter targets and skip duplicates; both are explained and covered by the `FACTION_BOUNTIES_ENABLED` rollback. Tunability (named chance, cap, salt, pay, switch), inspectability (bounty life cycle, `collected` edge, `economy.bounty` and `fight.trigger` traces, `getBounties`), determinism (own per-pair stream; id order elsewhere), fail-soft (legacy, gone faction or target, faction-type target, missing template, null shift, duplicate edge, throws) and performance (check inside the existing pair walk; ~40 bounties a month) all PASS.

### Three-pillar audit
PASS. Engine, Content and UI all present and substantive; no missing required sections; the Wiring table connects trigger, collect branch, close and sheet line to phase, UI, state, trace and debug. Substrate inventory present: activates the dormant bounty node, extends the grudge trigger and fight-end dispatch, reuses mortal duels, the purse and Means; no green-field duplication found.

### Vision audit
PASS-with-notes. No contradictions. Confirms core loop, non-negotiables (prose not numbers; the collector is an edge; the god acts only through the existing actor rule) and taste profile; extends design tensions (a dormant bounty becomes a caused, legible event). Note on tension 2: most hunters are unseen members, so many bounty duels resolve off-screen, and 6–15 a month would make bounties a large share of a world's fights; the kill criteria bound this. The hunter's `overcome` line is silent on pay, so legibility rests on the chronicle and escaped lines.
