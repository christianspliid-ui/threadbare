> **title:** An oath from tribute — the house that pays tribute in a crown's hall swears to that crown — THR-2051
> **linear_issue:** THR-2051
> **author:** Claude Code (design lane, run 2026-10-26b, unattended)
> **created:** 2026-10-26
> **three_pillars:** Engine done (one optional field on an existing effect) · Content done (one outcome table) · UI done (no new surface; the faction sheet's Fealty section and the oath chronicle line already read a brokered `sworn_to` — § UI pillar)

# An oath from tribute — THR-2051

*Wren Callow laid three trays before the temple court of Ashford and swore the schedule. The court's crown swore protection back. From that day the Ironwrights owe fealty to Valen.*

## Why this is load-bearing

*The Tribute Exchange*'s last step says *"the crown swears to the protection that answers it. Both halves go on the page"* (`encounter-content.ts:3984`). The [money-encounter outcome table](https://linear.app/threadbare/issue/THR-1872) gave it *"S Means−− + protection oath"*. [Mortal wealth](2026-10-15-thr-1936-mortal-wealth.md) S2 built the Means half; the oath waited on [the crown](2026-10-15-thr-1932-crown.md) and sat on [Money encounters, later rows](https://linear.app/threadbare/issue/THR-1954). The crown has shipped, and so has a mortal brokering an oath ([THR-1944](https://linear.app/threadbare/issue/THR-1944), `crown/brokeredOath.ts`). This plan points that writer at the scene.

## Substrate inventory

Measured on main @ 3f54d0dd. Disposition: **extends** the 🟢 ACTIVE `crown` subsystem (`systems-inventory.md:291`, its brokered oath) and the money-encounter outcome tables; activates and replaces nothing.

| Fact | Where |
|---|---|
| *The Tribute Exchange* (`locationTypes: capital, castle, temple`) has an `outcomeEffects` Means table only: CS −`MEANS_STEP`, every other band −`MEANS_STEP_BIG`. | `encounter-content.ts:3920-3936` |
| `faction_broker_fealty` swears one faction to **the realm the broker serves** (`brokerLiegeOf`: the broker's top realm membership, or its liege). The vassal is `vassalAgentId`'s top swearable non-realm membership, or the best-standing faction present. It writes through the crown's own `swearBrokeredOath`. | `unifiedAction.ts:1017-1033`; `brokeredOath.ts:58-62, 71-82, 106-124`; `crown.ts:1003-1029` |
| `swearBrokeredOath` refuses: crown off, liege not a realm, liege itself sworn, liege landless (`mayCourt`), vassal may not swear (`maySwear`: swearable kind, not sworn, not a liege), re-swear cooldown. Every refusal writes nothing and is traced. | `crown.ts:1008-1016`; `eligibility.ts:98-117` |
| Who holds a town: `getLocationHolder` (the one *held by* reader, lowest edge id). A holder's own liege: `liegeOf`. | `realmHolder.ts:52`; `crownView.ts:50` |
| Two templates already use the effect from an outcome table: *faction unification* (simple, `persuaded`, CS/S/SaC) and *the Warlord's Tribute* (branching, `coerced`). | `encounter-content.ts:5186-5188`; `warlords-tribute.ts:196-205` |
| A brokered oath reads on the vassal's sheet as *"Owes fealty to <liege> for <time>, won by <broker>'s word."* and in the chronicle (in attention) from `OATH_BROKERED_LINES.persuaded`. | `fealtySentences.ts:58-66, 155-163`; `crown-chronicle-content.ts:108-112` |

**Census.** A throwaway probe (not committed; `initializeGameState` → `runTick`, medium map, 360 ticks, seeds 42, 99, 7) read every resolved *Tribute Exchange* and asked what an oath would find:

```
seed 42: resolved 21  liege {held_by_nobody 5, held_by_realm 1, held_by_unsworn:military 3, held_by_unsworn:religious 1, holder_sworn_to_realm 11}
                      house {no_swearable_house 14, house_already_sworn 1, may_swear: guild 2, military 3, religious 1}
                      joint {no_oath 21}
seed 99: resolved 10  liege {held_by_unsworn:religious 6, holder_sworn_to_realm 4}
                      house {no_swearable_house 4, house_already_sworn 2, may_swear: military 4}
                      joint {WOULD_SWEAR: success_at_cost 1, failure 1; no_oath 8}
seed 7:  resolved 1   liege {held_by_unsworn:religious 1}  house {no_swearable_house 1}
```

Of 32 scenes, 16 stand in a town that answers to a crown, **15 of them through the temple order that holds the town**, which has sworn to a realm. Only 1 town was held by a realm directly. 11 actors have a house that may swear; 18 belong to a realm only or to nothing. **2 scenes had both; one succeeded.** The world held 6–17 oaths at day 15. So a tribute oath is rare, and adds at most one oath per world in that span.

## Decisions

Decided by the design lane under delegation (process.md rule 4). Each can be vetoed on its own.

1. **The actor's house swears to the crown the hall answers to.** The vassal is the actor's own house. In this plan, **house** means the actor's highest-ranked faction that may swear, never a realm; it is the scene prose's word (*"{actor}'s house"*), not a new UL term, and no player surface uses it (a mortal never swears a whole realm, THR-1944, `brokeredOath.ts:66-70`). The liege is the realm that holds the hall's town; or, when the town's holder is a temple order, company or guild sworn to a realm, **that realm**. The census shows the second case is 15 of the 16 where any crown is found. *Rejected:* a faction present in the town swears (THR-1944's default). The tribute is the actor's own, paid from their own Means. *Veto:* "only a town a realm holds directly counts".
2. **Every success band swears; failure swears nothing.** Critical success, success and success at a cost swear a `persuaded` oath. It reads *"won by protection"*, and with the broker *"won by Wren Callow's word"*, as *faction unification* does. Failure and critical failure keep today's table: the tribute is paid, and the commitment step's failure line already says the crown *"strikes the protection clause and keeps the tribute clause"*. *Veto:* "success at a cost should pay without the oath".
3. **A tribute that can swear nothing is still paid.** When there is no crown, no house, or the house is already sworn, the Means step stands and nothing is sworn. The trace says why. No refund: the trays were laid down before the oath. *Veto:* "a tribute that buys no oath should be refunded".
4. **No draw change in this slice.** The table's *likelier when: held town* column is not built. Half the scenes already stand under a crown, and the scarce side is the house (18 of 32 have none), which a town-side lean would not help. This retires the column for this row; no ticket holds it. *Veto:* "the tribute scene should only come up under a crown".

## Engine pillar

### Systems design

1. **One optional field on `faction_broker_fealty`** (`src/types/unifiedAction.ts:1017`):
   ```ts
   /**
    * THR-2051 — where the liege comes from. 'broker_realm' (default): the realm the broker
    * serves (THR-1944). 'scene_town': the realm the scene's town answers to — its holder
    * when a realm, else its holder's liege.
    */
   readonly liegeFrom?: 'broker_realm' | 'scene_town';
   ```
2. **`townLiegeOf(state, brokerId)`** in `src/engine/crown/brokeredOath.ts`, beside `presentVassalFor`. Town = `resolveToParentLocation(graph, node(resolveSceneHere(graph, brokerId, 'location')))` (the pattern at `:86-88`). Holder = `getLocationHolder(graph, townId)`. Returns `null` with no town or no holder. A realm holder returns `liegeOf(holder) ?? holder` (one layer, as `brokerLiegeOf` does). A non-realm holder returns `liegeOf(holder)` when that is a realm, else `null`.
3. **`brokerOath`** (`brokeredOath.ts:106`) takes `liegeFrom` in its args. It resolves `liegeId` with `townLiegeOf` when `liegeFrom === 'scene_town'`, else `brokerLiegeOf` as today. Null → refusal `'no_realm'`, unchanged. Everything after (vassal pick, `swearBrokeredOath`, every crown rule) is unchanged.
4. **The aftermath case** (`encounterAftermath.ts:3928`) passes `liegeFrom: effect.liegeFrom` and adds it to both traces' `effectDetail`.

With `vassalAgentId: '$actor'` and no `vassalFactionDefId`, `vassalOfAgent` already picks the actor's top swearable non-realm house (`brokeredOath.ts:81`). `$actor` already binds `vassalAgentId` (kind `'agent'`, `sceneSentinels.ts:145`; `$actor` accepts `agent` or `mortal`, `:256-260`), so no sentinel edit is needed.

### Graph nodes / edges · Tick phases · Resolution · PRNG

No new node or edge. The write is the crown's `sworn_to` (vassal → liege) with `brokeredBy`, through `writeOath`. No phase change: the effect runs at the roll inside `applyOutcomeEffectsTable`. No PRNG: the holder and the house are id-ordered picks.

## Content pillar

`encounter.tribute_exchange` outcome table (`encounter-content.ts:3929-3935`), Means rows unchanged:

| Band | Today | After |
|---|---|---|
| critical_success | Means −`MEANS_STEP` | same · **tribute oath** |
| success | Means −`MEANS_STEP_BIG` | same · **tribute oath** |
| success_at_cost | Means −`MEANS_STEP_BIG` | same · **tribute oath** |
| failure / critical_failure | Means −`MEANS_STEP_BIG` | unchanged |

`tribute oath` = `{ kind: 'faction_broker_fealty', brokerAgentId: '$actor', vassalAgentId: '$actor', liegeFrom: 'scene_town', oathKind: 'persuaded' }`, as one shared `const` above the template.

No prose changes. The commitment step's success line (*"…the crown swears to the protection that answers it. Both halves go on the page"*) and failure line (*"…strikes the protection clause and keeps the tribute clause"*) already match the bands (THR-1872's *prose?* column: yes). No new chronicle lines: `OATH_BROKERED_LINES.persuaded` reads true for a house sworn by its own member's word.

## UI pillar

No component changes. Every surface already reads the `sworn_to` edge this writes.

### Player-facing text

| Surface | Exact text the player reads | Complaint class | How the player understands it |
|---|---|---|---|
| Vassal's faction sheet, Fealty section (`fealtySentences.ts:155-163`) | *"Owes fealty to Valen for a day, won by Wren Callow's word."* (both names links) | PC-6 | The sheet, the chronicle and the Crown chip read one `sworn_to` edge, so they cannot disagree |
| Liege's sheet, Crown chip and vassal list | *"two factions owe it fealty."* (the count now includes the tribute house) | PC-6 | as above |
| Chronicle, when either faction is in attention (`crown.ts:345-351`) | *"Through the word of Wren Callow, the Ironwrights swore fealty to Valen."* | PC-8 | the scene the player watched has a visible answer |
| Aftermath event (`encounterAftermath.ts:3964-3965`) | *"Through Wren Callow, the Ironwrights swore fealty to Valen."* | none | — |

- **Before:** after *"Both halves go on the page"*, the Ironwrights' sheet shows no oath.
- **After:** the sheet shows the oath above, and the Ironwrights pay their liege its share of their day income, as every vassal does.
- **No oath possible:** nothing new shows. The scene's Means card moves as it does today.
- Laws engaged: 1 (one truth: the edge), 4 (no numerals: the sheet's oath words carry no tax figure), 13/14 (a missing broker drops the tail to the plain *"won by protection."*, `fealtySentences.ts:62-63`), 17 and 21 (both names are links through existing parts), 56 (every line is backed by the write).

### Playtest signal

A warm-playtest tester who watches a mortal with a guild or company win *The Tribute Exchange* in a crown's town can open that guild's sheet and find who it now owes fealty to, and whose word won it.

### Event notifications · Visual presence · Debug inspection

- Event: the existing aftermath line and chronicle line above; nothing new.
- HexMapV2: N/A. The crown outline wraps only sworn **realms** (`crownHexes`, `crownView.ts:106-118`), and a tribute house is never a realm, so the map is unchanged.
- Debug: the Traces tab shows `encounter_aftermath_effect` / `faction_broker_fealty` with `liegeFrom` and, on a refusal, `failReason`; `oath_sworn` carries `brokeredBy`. The Inspector on the vassal faction shows the `sworn_to` edge and its properties.

**Browser-verify tool:** Playwright DOM at 1920×1080. `?view=game&seeded&size=medium&spawn=encounter.tribute_exchange&outcome=success` (read `await window.__DEBUG.getOutcomePinVerdict()`). The census says most spawned actors have no house, so the screenshot may show the refusal trace instead of an oath; either is acceptable evidence, with the trace line quoted. No UI code changes: one screenshot.

## Wiring

Checked against `Docs/plans/wiring-checklist.md`: no new module, phase, component or debug tab.

| Module | Phase | UI | GameState | Trace | Debug |
|---|---|---|---|---|---|
| `townLiegeOf` + `liegeFrom` (`brokeredOath.ts`) | encounter resolution, outcome table | faction sheet Fealty, Crown chip, chronicle | graph: `sworn_to` | `encounter_aftermath_effect`, `oath_sworn` | Traces tab; faction detail |
| tribute outcome table (`encounter-content.ts`) | — | — | — | — | — |

## Interface impact

| Contract | Status | Change |
|---|---|---|
| Encounter Aftermath → Crown (`faction_broker_fealty` → `swearBrokeredOath`) | extend | a second liege source (`scene_town`) reading `getLocationHolder` and `liegeOf`. Read sites unchanged: the crown's daily loyalty and tax pass, the faction sheet, the realm projection |

`Docs/canon/interface-map.md` and `scripts/interface-contracts.ts` note the second liege source in the build PR.

## Constants table

No new number. Removing the tribute oath from the table turns this slice off.

| Constant | Default | Purpose here |
|---|---|---|
| `MEANS_STEP` / `MEANS_STEP_BIG` | as authored | the tribute's Means cost (unchanged) |
| `BROKERED_OATH_ENABLED` | `true` | the switch for every brokered oath (`crown-constants.ts:171`) |
| `FEALTY_TAX_SHARE` | as authored | what the sworn house pays its liege each day (unchanged) |

## Tracing

No new category. Both existing `faction_broker_fealty` traces gain one field:

```ts
effectDetail: { brokerAgentId: string; vassalAgentId?: string; vassalId?: string; liegeId?: string;
  oathKind: 'persuaded' | 'coerced'; liegeFrom: 'broker_realm' | 'scene_town' };
```

## Fail-soft table

| Case | Behaviour |
|---|---|
| The actor stands on no town, or the town is held by nobody | `no_realm` refusal traced; Means row still applies |
| The town's holder is an unsworn non-realm (a free company holds it) | `no_realm`; nothing sworn |
| The actor has no house that may swear (realm-only, no faction, thieves' guild) | `no_vassal`; nothing sworn |
| The house is already sworn, or is itself a liege | `may_not_swear` (crown's own rule) |
| The house broke an oath with this crown recently | `cooldown` |
| The house *is* the town's holder, sworn to the crown already | `may_not_swear`; nothing changes |
| The crown is landless or itself sworn | `no_realm` / `liege_sworn_chain` (crown's own rules) |

## Blast Radius

`src/types/unifiedAction.ts` is a wide-blast file. The change is one optional field on an existing union member; no `switch` needs a new case. `npm run check:typecheck` covers the rest.

## Three-pillar check

- [x] Engine pillar present (one optional field, one helper)
- [x] Content pillar present (one outcome table)
- [x] UI pillar present (existing surfaces, one screenshot)
- [x] Wiring section connects them

## Game Design Laws

Conforms to 41 (one vocabulary of effects: the crown's existing brokered-oath effect, no tribute-only writer), 42 (one liege-source field, not a tribute special case), 43 (a tribute oath is an ordinary oath with the ordinary words) and 22 (failure still leaves the paid tribute, and its line says what the crown kept). **Law 45** (the game never promises what the world will not do): the commitment line now comes true whenever the world has a house and a crown to bind. For a mortal with no house the line describes the hall's ceremony; no surface states a protection consequence for that mortal, so nothing is promised that the world then fails to do. Breaks none.

## Vision audit

- [x] Does not contradict a Vision premise. Checked: `Vision/00-north-star.md` (a story the player can tell: Wren's tribute bound her guild to a crown), `Vision/01-core-loop.md` (what mortals do changes the world, and the crown's tax and loyalty then compound it), `Vision/02-non-negotiables.md` (the relationship is the `sworn_to` edge), `Vision/03-design-tensions.md` #2 (systemic: the crown's own writer, every rule intact) and #4 (no number shown), the taste profile (graph edges, no numerals, prose first).
- [x] No Vision edit needed.

## Rulebook impact

- [x] A rule of play changes: a mortal's tribute can swear their house to a crown.
- [x] Owed in the build PR. In `Docs/canon/rulebook.md` at the end of the *"Realms win fealty"* paragraph (`:452`), and in the quick reference's crown sentence (*"A **realm courts fealty**…"*): *"A mortal who pays tribute in a crown's hall swears their own house to that crown."* (`[IMPL — THR-2051]`).

> Brainstorm companion: `Docs/plans/2026-10-26-thr-2051-oath-from-tribute-brainstorm.md`.

## NFP-compliance table

| NFP | Verdict | Note |
|---|---|---|
| 1. Tunability | PASS | no new number; the switch is the table row and `BROKERED_OATH_ENABLED` |
| 2. Inspectability | PASS | `liegeFrom` on both traces; every refusal names its reason |
| 3. Determinism | PASS | no PRNG; holder by lowest edge id, house by rank then id |
| 4. Fail-soft | PASS | table above; every refusal writes nothing |
| 5. Narrative | PASS | the scene's oath comes true |
| 6. Additive | PASS | one optional field, default = today's behaviour |
| 7. Performance | PASS | one holder lookup per resolved tribute scene (about one a day per world) |

## Done when

- [ ] `crownBrokeredOath.test.ts`: with `liegeFrom: 'scene_town'`, an actor in a guild, standing in a town whose holder is a temple order sworn to realm R, swears the guild to R (`sworn_to` guild → R, `kind: 'persuaded'`, `brokeredBy` = actor).
- [ ] The same test: a town a realm holds directly swears to that realm; a town held by nobody or by an unsworn company refuses `no_realm`; an actor with only a realm membership refuses `no_vassal`. Without `liegeFrom`, every existing THR-1944 case is unchanged.
- [ ] A content test: *The Tribute Exchange* carries the tribute oath on critical success, success and success at a cost, and on no failure band; the Means rows are unchanged.
- [ ] The tribute census above, re-run as a test or a scratch script on seeds 42 and 99 for 360 ticks, reports `faction_broker_fealty` traces for *The Tribute Exchange* by result. Every refusal names a reason from the fail-soft table.
- [ ] Rulebook and quick-reference lines; interface map and contracts; the wiki page whose `sources` match. `npm run gate` green. The 1920×1080 screenshot.

## Kill criteria

- The re-run census shows tribute oaths making more than a third of the oaths sworn in a world. The scene would then be outrunning the crown's own courting, and loyalty and tax would turn on a hall scene. Then restrict the oath to critical success and re-measure.

## Coordination block

**Suggested model:** sonnet. One optional field and one helper on THR-1944's path, one content table.

**Parallel-safe with:** [famine and glut draws](https://linear.app/threadbare/issue/THR-2040), [commission pay](https://linear.app/threadbare/issue/THR-2042), [the sequel place](https://linear.app/threadbare/issue/THR-1929), [relic take-up](https://linear.app/threadbare/issue/THR-2031). None touches the crown's brokered oath or this template.

**Mutex with:** [a road's encounters](https://linear.app/threadbare/issue/THR-2046) and [a place held after success](https://linear.app/threadbare/issue/THR-2048). All three edit the aftermath effect union in `unifiedAction.ts` and `encounterAftermath.ts`, and THR-2048 edits `encounter-content.ts` tables. Merge conflicts only, no design overlap; whoever lands second rebases.

**Files to touch:** `src/types/unifiedAction.ts`, `src/engine/crown/brokeredOath.ts`, `src/engine/encounterAftermath.ts`, `src/data/encounter-content.ts`, tests; rulebook pair, interface map and contracts, wiki page.

## Notes for the executor

Do not change `swearBrokeredOath` or any crown rule. Do not add a new oath kind or new chronicle lines. Do not add the oath to the failure bands. Do not change *faction unification* or *the Warlord's Tribute*: they keep the default `broker_realm`.

## Intent-judge verdicts

| Run | Verdict | Findings | Fixed by |
|---|---|---|---|
| 1 | **Allow** | dim 6 GAP: "house" is not a UL term; dim 11 GAP: the `$actor` → `vassalAgentId` binding was left to the executor although source answers it; advisory: Decision 4's dropped *likelier when* column was held by no ticket | "house" defined once as the scene prose's word; the binding stated from `sceneSentinels.ts:145, 256-260` and the sentinel edit dropped; Decision 4 says it retires the column |

## Forked-audit verdicts

### NFP audit
PASS. All seven pass: no new number (the table row and `BROKERED_OATH_ENABLED` are the switches); `liegeFrom` on both traces and every refusal names its reason; id-ordered picks, no PRNG; a seven-row fail-soft table; the commitment line comes true; one optional field defaulting to today; one holder lookup per resolved scene. Note: the auditor could not read `wiring-checklist.md` in full (532 KB) and relied on the plan's wiring table.

### Three-pillar audit
PASS-with-notes. Engine, Content and UI present and substantive; no required section missing; the wiring table links module, phase, UI, graph, traces and debug. Note: the substrate inventory lacked the template's disposition line (now added: extends the 🟢 ACTIVE `crown` subsystem, `systems-inventory.md:291`). No green-field duplication.

### Vision audit
PASS-with-notes. No contradiction with the north star, core loop, non-negotiables (the oath is an edge; no numerals), design tensions #2 and #4, or the taste profile. Note on tension #4: when no oath is possible (most scenes, per the census) nothing new shows, and why is visible only in the traces. Accepted: the scene's Means card and failure line already say what the tribute bought, and the plan's Law 45 paragraph states why the success line promises nothing the world fails to do.
