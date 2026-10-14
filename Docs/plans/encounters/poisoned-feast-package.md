# Package critic (Pass 3b): The Poisoned Feast

> Batch: master-everyday-2 (THR-1757), slot 1 (seeded sequel) · Date: 2026-10-14
> Input: `Docs/plans/encounters/poisoned-feast.package.json` (after the editorial and systems fixes), `poisoned-feast-final.md`, brief `master-everyday-2-brief.md` slot 1.

templateId: encounter.town.poisoned_feast
packageVerdict: connected
packageLeaves: The master's standing with the town rises or falls on its page, a win leaves the town coroner owing them a favour, the poisoner they failed to name carries a hidden mark, and whoever paid for the poison sends hired strangers after them some days later (The Hired Knives), so the cost of surviving the feast comes back on the road.

---

## Half A — anchoring

| Chip | Referent | In the catalog? | Prose names it? | Verdict |
|---|---|---|---|---|
| BOND reputation with {location} (critical_success, success, success_at_cost) | the mortal's standing with the town (`reputation_with $here` +0.06, net +0.03 when step 0 failed) | `$here` → `location`, linked (`visualKind: 'location'`) | yes, `{location}` enriches to the town's name | anchored |
| BOND a favour owed (critical_success, success, success_at_cost) | the `owes_favor` edge, debtor the coroner, creditor the mortal (`favor_creation`) | `$cast:coroner` → `agent`, linked | yes, "{cast:coroner} owes {actor} a favour" names debtor and creditor | anchored |
| PATH seed (critical_success, success, success_at_cost, failure) | the planted `#rival_strike` seed, carried by the mortal | seed anchors through its carrier: `$actor` → `agent`, linked | yes, "{actor}" names the carrier; "whoever paid for the poison" names the sender as the encounter knows them (unnamed by design) | anchored |
| SCAR reputation with {location} (failure) | standing lost (−0.06) | `$here` → `location`, linked | yes | anchored |
| SCAR reputation with {location} (critical_failure) | standing lost: −0.03 (step-0 path) or −0.06 (step-1 path) | `$here` → `location`, linked | yes; "Before the whole guild" true on both paths | anchored |

No PRIZE chip and none expected (the hand is secret + story_seed). Hidden marks correctly carry no chip (anchor catalog: a concealed anchor is still an anchor). No `{target}` interpolation (THR-1685).

**Fixed in this pass, before the verdict:** the PATH chip promised "Whoever paid for the poison has heard that {actor} lived" on a band whose afterimage named the payer — a chip disagreeing with the prose above it. The afterimage no longer names the payer, and the chip now promises the act the sequel performs: *"Whoever paid for the poison is sending their people after {actor}."*

## Half B — what it leaves behind

**Would the player recognise the sequel as this encounter's consequence?** Now, yes. The seed can only draw The Hired Knives, which opens on *"Two strangers have followed {actor} for three days … they asked for {actor} by name. A rival sent them."* The parent's last word to the player is that whoever paid for the poison is sending their people after them; thirty ticks later two hired strangers are asking for them by name. That lands. The sequel's added reason ("because a god's help was seen around {actor}") is a second reason, not a contradiction: the cup meant for the master missed and the master walked away. Before this pass, the chip and the spine promised a patron who *knows the master knows*, and nothing downstream reads that — a promise the sequel could not keep.

Downstream: the reputation with the town is shown on its page and read wherever reputation gates encounters; the favour is a persistent `owes_favor` edge from the coroner to the mortal; the concealed mark sits on the poisoner as world state (not player-visible, by design); the seed is acted on by `encounterSeeding`, which is the part the player sees come back.

Verdict: **connected**.

## Fix-list

None outstanding. Follow-up (outside this slot): give The Hired Knives a planter-aware reason line, or author a second `#rival_strike` member, so the patron's people can be named as the poisoner's.

PACKAGE PASS
