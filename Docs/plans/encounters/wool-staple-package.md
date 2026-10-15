# The Wool Buyers' Ring — Pass 3b package critique

templateId: encounter.town.wool_staple
packageVerdict: connected
packageLeaves: Winning the sale leaves the agent holding Merchant Silks and better regard in the town, lets them sign a Trade Treaty with the market's mayor (Agnes Fallow), and plants a seed that brings the same ring's factor (Pieter Holm) back later to bid against them in The Last Lot at the Exchange, where his opinion of them is the stake; losing leaves the town thinking less of the agent's word on wool.

Slot 2 of `master-everyday-3` (THR-1840). Judged against the shipped package
`Docs/plans/encounters/wool-staple.package.json` (source of truth); `wool-staple-final.md`
§ 5, § 14, § 15 and § 16 match it chip for chip, write for write.

## Half A — anchoring

Bands: `critical_success` (cs), `success` (s), `success_at_cost` (sac), `failure` (f),
`critical_failure` (cf). `near_miss` aggregates to the `success_at_cost` aftermath band
(`src/engine/encounters/nudges.ts:424`), and step 1's `successMetadata` fires on it, so
the sac chips are backed on that route too.

| Chip | Referent | In the catalog? | Prose names it? | Verdict |
|---|---|---|---|---|
| `wool.cs.silks` (BOON · Merchant Silks) | The Merchant Silks possession granted to the agent (`attachment_grant reward_vestments_merchant_silks` → `$actor`, step 1 `successMetadata`) | Attachment · `possession`, 🔗 linked; template exists at `src/data/reward-attachment-catalog.ts:564` (`attachmentCategory: 'possession'`) | Yes — "Merchant Silks" / "dyed silk", `entityId` = the template id, `visualKind: 'attachment'` | anchored |
| `wool.cs.town` (BOON · reputation with {location}) | The agent's standing with this town (`reputation_with targetLocationId: $here` +0.08) | `reputation_with` edge, 📍 named; counterparty anchored as Location, 🔗 linked via `$here` (`ANCHOR_SENTINEL_HERE`) | Yes — `{location}` resolves to the town's own name | anchored |
| `wool.cs.factor` (PATH · seed) | The planted return of the ring's factor (`encounter_seed encounter.town.bell_at_the_exchange`, carrier `$actor`, `inheritContext`) | `encounter_template` is not an anchor → anchored through the carrier `$actor` and the carried cast `$cast:buyer`, both Actor · individual, 🔗 linked | Yes — "{cast:buyer} will come to bid against {actor} again" names both persons | anchored |
| `wool.s.silks` | as cs | as cs | as cs | anchored |
| `wool.s.town` | as cs | as cs | as cs | anchored |
| `wool.s.factor` | as cs | as cs | as cs | anchored |
| `wool.sac.silks` | as cs (successMetadata fires on sac and near_miss) | as cs | as cs | anchored |
| `wool.sac.town` | as cs | as cs | as cs | anchored |
| `wool.sac.factor` | as cs | as cs | as cs | anchored |
| `wool.f.town` (SCAR · reputation with {location}) | The agent's standing with this town (step 1 `failureMetadata` −0.10) | as cs.town | Yes — `{location}` | anchored |
| `wool.cf.town` (SCAR · reputation with {location}) | Same edge — step 1 `failureMetadata` −0.10 on the step-1 route; step 0 `failureMetadata` −0.05 on the step-0 critical-failure route that ends the action | as cs.town | Yes — `{location}` | anchored |

Eleven chips, eleven `anchored`. No `fold`, no `bind`.

### Referents verified

- **`reward_vestments_merchant_silks`** — exists, `type: 'artifact'` node, `attachmentCategory: 'possession'`, tier 1, `#gold #trade`, a real Gold bonus while borne. Used by no other encounter, as the design block claims.
- **`agreement.treaty.trade`** — exists in `src/data/agreement-reward-catalog.ts:131` (Trade Treaty, 96-tick term). Granted only by reactions (cs/s "Sign the mayor's contract", sac "Give the mayor the guild's pledge"), with `counterpartyId: '$cast:mayor'`, which the type admits (`src/types/unifiedAction.ts:784`). The mayor is `must-persist`, so the counterparty survives. No authored chip claims it, so no chip depends on a choice the player may not make.
- **`encounter.town.bell_at_the_exchange`** — exists (`src/data/encounters/bell-at-the-exchange.ts`), gold, urban, `supportBundle` cast key **`buyer`** (`must-persist`, lazy-materialize). Its prose names `{cast:buyer}` without pronouns, and every bell chip anchors `$cast:buyer` through `reputation_with`.
- **Does `inheritContext` seat this factor there?** Yes, traced end to end. Step 1's `successMetadata.effects` route through `applyStepOutcomeEffects` (`src/engine/unifiedActionResolution.ts:1271`), which wraps them in a synthetic reaction and passes the live `action` to `applyEncounterAftermathReaction`. The `encounter_seed` case (`src/engine/encounterAftermath.ts:1737`) snapshots `action.supportBindings` into `inheritedBindings`. At spawn, `resolveSeedInheritance` (`src/engine/encounterSeeding.ts:445`) drops only gone nodes, and the survivors go straight into the spawned action's `supportBindings` (`encounterSeeding.ts:803`) — no re-preparation of the bundle. So the bell's `buyer` slot holds the wool ring's factor, and the `mayor` binding rides along unused, which does no harm.

## Half B — what it leaves behind

The package leaves three things that later systems read, and all three are visible to the player:

1. **The factor comes back.** The PATH chip promises a named person, and the seed delivers that person into an encounter whose whole stake is that person's opinion of the agent. The bell's chips say "reputation with {target}" on `$cast:buyer`. A player who beat Pieter Holm at the wool staple then sees Pieter Holm on the exchange floor. This is the strongest kind of connection the line produces: the same person comes back, not just the same kind of person. The cs/s "Make peace" reaction writes a bond to the same factor, so that choice also carries into the return.
2. **Merchant Silks** is a possession the agent carries. It shows on their Attachments tab and adds Gold on later rolls.
3. **Standing with the town** (`reputation_with $here`) moves both ways. The Location Profile standing row reads it. The optional Trade Treaty writes a live agreement with the mayor, and the sac "Refuse the pledge" choice writes a bond scar on her.

Verdict **`connected`**.

## Non-blocking observations (no fix owed by this pass)

- **Placeless seed and setting.** The seed fires wherever the agent is when it falls due. A seed skips the eligibility filter, so the bell can fire outside an urban setting. Its opening is urban only. This is a bell-side prose risk shared by every placeless seed into an urban template, not a chip defect here.
- **`seedLabel` carries `{actor}`.** The planted-event message prints `seedLabel` raw (`encounterAftermath.ts:1821`). Precedent exists in the gold corpus (`salt-monopoly.ts`, `granary-riot.ts`, `guildhall-spy.ts`, `poisoned-feast.ts`). If the event log does not enrich it, this is a corpus-wide issue, not one for this encounter.
- **The near_miss route shows the sac overview.** The sac overview says the mayor kept the scales open late, but a near-miss sale did not show that in its afterimage. Its chips are all backed, so this is prose texture only.
- **`stateNoun` "reputation with {location}".** Nudge spec rule 0c says placeholders in `stateNoun` ship as literal braces. That is now stale: `buildAftermathConsequences.ts:776` enriches the noun (`nounTextFor(..., enrich, ...)`), and the corpus uses this form widely.

## Fix-list

None.

PACKAGE PASS
