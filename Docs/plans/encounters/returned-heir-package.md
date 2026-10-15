# Package critic — The Returned Heir (slot 1, master-everyday-3, THR-1840)

templateId: encounter.town.returned_heir
packageVerdict: connected
packageLeaves: A finding the master can stand behind books them into the manor court in the town on court day, three days out, with the steward Wystan Pell to hear it (kept: the court names the man the lord's son; missed: the claimant Aldous Harrow comes looking for them wherever they are), and either way it moves their standing with the town and their bond with Aldous Harrow, and a failed reading has them shown the road away from the town.

## Half A — anchoring

Routes checked: step 0 is `continue_weakened` and step 1 is `fail_action`. Each band below is checked against every route into it. The band is the overall outcome; `branchOnStep: 0` only keys `variants`, and `variants` is empty here.

| Chip | Bands | Referent | In the catalog? | Prose names it? | Backing write, every route | Verdict |
|---|---|---|---|---|---|---|
| `heir.{crit,win,cost}.town_regard` (BOND · reputation with {location}) | crit / success / s@c | the mortal's standing with this town | `location` via `$here`, 🔗 linked (`reputation_with` anchors the counterparty) | yes, `{location}` | step-1 success `reputation_with $here` +0.06. With step 0 failed first: −0.02 then +0.06, net +0.04, still a gain | anchored |
| `heir.{crit,win,cost}.claimant_trust` (BOND · reputation, {cast:claimant} trusts) | crit / success / s@c | Aldous Harrow's trust in the mortal | `agent` via `$cast:claimant` (must-persist), 🔗 linked | yes, `{cast:claimant}` | step-1 success `bond_change` +0.12/+0.10. With step 0 failed first: net +0.07/+0.05 | anchored |
| `heir.{crit,win,cost}.court_day` (PATH · appointment) | crit / success / s@c | the appointment's place: the town, on court day | `$appointment` → location, 🔗 linked (THR-1518, the shipped easter-reckoning shape) | yes: "{cast:steward} hears the finding sworn in {location} in three days" (`delayTicks` 36, the same as easter-reckoning) | step-1 success `encounter_seed` + `appointment`. This is the only route into these bands | anchored |
| `heir.lost.town_regard` (SCAR · reputation with {location}) | failure | standing with this town, lost | `location` via `$here`, 🔗 linked | yes | step-1 failure −0.06 (−0.08 if step 0 also failed) | anchored |
| `heir.lost.claimant_blame` (BOND · {cast:claimant} blames) | failure | Aldous Harrow's regard, lost | `agent` via `$cast:claimant`, 🔗 linked | yes | step-1 failure −0.12/−0.10. After the "write to the man" reaction the sentiment is still −0.08, so the chip stays true | anchored |
| `heir.lost.on_the_road` (PATH · seed, travelling away) | failure | the mortal leaving this town | the `located_at` move, named through `{location}`. It is the shipped relocation shape (`assize-letter.ts:296`, and toll-gate-writ was judged anchored the same way). `journey` is deliberately not a chip kind | yes: "{actor} is travelling away from {location} now"; no destination is claimed | step-1 failure `agent_relocation $actor` away ≥3, travel. A plain failure can only come from step 1, because step 0 cannot end the action on a plain failure | anchored |
| `heir.broke.town_regard` (SCAR · reputation with {location}) | crit-fail | standing with this town, lost | `location` via `$here`, 🔗 linked | yes | step-0 crit-fail route: −0.02. Step-1 crit-fail route: −0.06 (or −0.08) | anchored |
| `heir.broke.claimant_blame` (BOND · {cast:claimant} blames) | crit-fail | Aldous Harrow's regard, lost | `agent` via `$cast:claimant` (bound at encounter start, so it resolves on the step-0 route too) | yes | step-0 route: −0.05/−0.05. After the "write to the man" reaction the sentiment is −0.01 and trust −0.05, so the claim is true but small. Step-1 route: −0.12/−0.10 | anchored |

The crit-fail band correctly claims no road chip. On the step-0 crit-fail route nothing relocates. On the step-1 crit-fail route the relocation does fire, but it goes unchipped. That under-claims, which is lawful. The step-1 critical-failure afterimage already says the uncle had the master "shown off the manor", so the player is told it.

No fold, no bind. Every referent is the town (`$here`), the bound claimant, or the appointment's place, and all three exist wherever the encounter spawns: a must-persist cast actor resolves on every route.

## Half B — what it leaves behind

- **The appointment is the real thread.** On any success band the mortal is held to the town for court day, with the steward as counterparty. The player sees the PATH chip, then the mortal leaning toward the town, then one of two authored sequels. Kept (`town.returned_heir_sworn`): the court names the man the lord's son, and both the town standing and the claimant's bond go up again. Missed (`town.returned_heir_defaulted`): the claimant tracks the master down wherever they are. Its writes target only the claimant, never the stray `$here`.
- **The claimant's bond** is a must-persist agent's edge that the player can open on his sheet, and the missed sequel reads that same man back into the story. This is the part of the package a later encounter picks up.
- **Standing with the town** shows on the Location Profile, in both directions.
- **The failure relocation** is the most visible failure cost: the mortal is on the map, walking away from the manor. It fires only where no appointment exists, so movement and the appointment never fight.

Verdict: `connected`, because the appointment and its two sequels act on what this encounter writes, and the player watches each of them happen.

## Observations (non-blocking, no fix required)

1. **The s@c page has some tension.** The overview says the uncle tells the whole manor the widow bought the finding. The chip below it says {location} thinks well of the master. Both are true: the write is +0.06 and the bribe charge lives only in prose. The page reads as "the charge did not stick", not as a contradiction. Systems caveat 3 already records that s@c writes no extra state.
2. **The step-0 crit-fail BOND chip is thin.** If the player takes the "write to the man" reaction, the sentiment ends at −0.01. Trust stays at −0.05, so "blames" is still true in direction.
3. **`consequenceDraw` is missing from the package JSON.** This is expected, because compile stamps it (see `easter-reckoning.ts:84`).

## Fix-list

None.


## Post-critic amendment (orchestrator, 2026-10-15)

The package critic noted that after a step-0 critical failure the "Write the man what was found" reaction (+0.04) left the BLAME chip barely true (sentiment -0.01). Step-0 failure now writes -0.08 sentiment / -0.06 trust with the claimant (was -0.05 / -0.05), so the chip stays true after the reaction (-0.04). The success side still nets positive (+0.12 - 0.08). Re-gated green.

PACKAGE PASS
