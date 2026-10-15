# Package critic (Pass 3b): The Fallen Silver Drift

> Slug: silver-drift-rescue · master-everyday-3, slot 7 (THR-1840) · Date: 2026-10-15
> Read against: `silver-drift-rescue.package.json` (authoritative), `silver-drift-rescue-final.md`, brief slot 7, `anchor-catalog.generated.md`.
> Private gate `check-encounter-batch3 --package`: OK, 0 warnings (re-run during this pass).

templateId: encounter.town.silver_drift_rescue
packageVerdict: connected
packageLeaves: The mortal who brings the four miners out goes onto the Builders Fellowship's rolls (which opens that faction's work to them), and wins or loses the trust of the reeve and the regard of the village, while a failure leaves the named trapped miner carrying a Wounded condition, all of which the player sees on the chips and on the Fellowship, reeve, miner and village pages.

## Half A: anchoring

Fifteen chips across five bands. The three success bands carry the same three chips; failure and critical_failure carry the same three.

| Chip (bands) | Referent | In the catalog? | Prose names it? | Verdict |
|---|---|---|---|---|
| Taken In (cs, s, sac) | The actor's new `member_of` edge to the Builders Fellowship, written by step 2 `membership_change join builders_fellowship` | Faction, linked (`$faction:builders_fellowship`, `visualKind: 'faction'`); `member_of` edge, named. Pre-seeded faction (`builders-fellowship-definition.ts`); same declaration ships in `well-sinking.ts` | Yes: "the Builders Fellowship's rolls"; step 2 spine introduces "The Builders Fellowship holds this mine" | anchored |
| The Reeve's Trust (cs, s, sac) | The `relates_to` bond between the actor and the reeve, raised by step 2 `bond_change $cast:reeve` | Individual agent, linked (`$cast:reeve`, `visualKind: 'agent'`); `relates_to` edge, named. Must-persist cast | Yes: "{cast:reeve} trusts {actor} now" (resolves to Wat Corley or a reused elder/steward) | anchored |
| Well Regarded (cs, s, sac) | Actor's `reputation_with` the scene's location | Location, linked (`$here`, `visualKind: 'location'`) | Yes: "{location} thinks well of {actor}" | anchored |
| Crushed Leg (f, cf) | `trait.condition.wounded` on the trapped miner, written by every step's failure | Attachment · condition, linked (template id, `visualKind: 'attachment'`) plus the bearer, `$cast:miner` (agent, linked, must-persist) | Yes: "{cast:miner} is wounded from the fall"; told in every failure/cf afterimage | anchored |
| The Reeve's Trust (f, cf) | The same reeve bond, lowered (-0.12 step 2; -0.04/-0.05 steps 0/1) | as above | Yes: "{cast:reeve} trusts {actor} less" | anchored |
| Found Wanting / Out of Favour (f, cf) | Actor's `reputation_with` `$here`, lowered (-0.06 step 2; -0.02 steps 0/1, which backs the cf chip on early-step routes) | Location, linked | Yes: "{location} thinks less of {actor}" | anchored |

**No `fold`, no `bind`.** Every referent is a graph object the encounter either finds (the faction, the location) or mints and persists (reeve, miner, the bond, the condition, the membership). The trap does not apply: nothing here is landscape fiction dressed in a pointer. The mine, the drift, the old workings, the hoist house and the bad air are all scene fiction, and correctly they stay in the overviews and afterimages without a chip.

Binding check: `$here` under a `rural` envelope resolves to whatever village the encounter spawns at; the prose only says "the mine track above {location}", which places the mine *near* the location rather than claiming a mine node, so it needs no spawn bind. The Fellowship is pre-seeded per world, so `$faction:builders_fellowship` resolves wherever the encounter can spawn.

### Observations (non-blocking, no fix required)

1. **The reeve-trust chips say "reputation" (`stateNoun.text`, `tooltipId: ui.reputation_with`) over a `bond_change` write.** The anchor is correct (the reeve, by `$cast:reeve`); only the tooltip's word is reputation-flavoured. This is the corpus convention for a personal-trust chip (the same shape ships in witch-trial, gallows-pardon, returned-heir, sin-eater and others), so it is not this encounter's to fix.
2. **The query prize has no chip.** The tool from the mine's store comes from a step-2 `rewardPool` (`#stone` + `#tool`, six eligible items), which surfaces on its own reward card; the overviews name it in prose only ("a tool from the mine's store"). That is the right split: a pool draw is not an authored chip, and the prose does not name a particular item.
3. **Accepted limit (carried from the final):** an early-step failure then a final success wounds the miner with no chip on the success-side page; the step afterimage tells it. Not a Law 56 breach: no chip claims an unwritten state.

## Half B: what it leaves behind

**Verdict: `connected`.**

- **Membership** is the strongest thread: a `member_of` edge to the Builders Fellowship, chronicled, appears on the Fellowship sheet's roster and on the actor's sheet, and the Fellowship's guild-work content reads membership. A later Fellowship encounter or quest picks it up, and the player sees it as "on the rolls".
- **The reeve** is a must-persist cast actor with a bond that moves by ±0.12 at step 2. The relationship shows on both sheets and can be reused as an elder/steward by later encounters (`reuseNpcRoles`).
- **The miner** (must-persist) carries a Wounded condition on failure: a real attachment on a real person, visible on the miner's Attachments tab. The failure-side reaction "Wait at the mine mouth" adds a bond to the same miner.
- **Village regard** (`reputation_with $here`) feeds the location's standing row.
- The success-side reactions (seal the old workings / prop a road) trade reeve bond against village regard: small, but real writes the player chooses.

The player sees all of it: three chips per band, each opening a sheet (faction, agent, location, attachment).

## Fix list

None.

PACKAGE PASS
