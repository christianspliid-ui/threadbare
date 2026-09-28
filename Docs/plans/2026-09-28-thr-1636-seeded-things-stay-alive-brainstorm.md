> **Brainstorm companion** to `Docs/plans/2026-09-28-thr-1636-seeded-things-stay-alive.md` (THR-1636), design lane run 2026-09-28c.

# Seeded things that stay alive: the thinking behind the plan

## The two questions

1. **What keeps a trade lane alive?** Every lane, seeded or founded, dies 36 ticks after it opens, because nothing marks it as traded.
2. **How does a mortal get from a rumour to a delve?** In 300 ticks on two seeds: 72 leads, all vague, 65 held by mortals who never act, and 0 surveys of a ruin.

## Lanes: the options weighed

| Option | For | Against | Verdict |
|---|---|---|---|
| **A. Ambient traffic as route state:** a lane carries while both towns stand and nothing blocks it | The world's own rule. It matches route events (*"caravans are route STATE"*). A lane dies for a reason the player can see. It costs O(lanes) | An abstraction: no caravan walks | **Taken** |
| B. Seed an owner on worldgen lanes, whose upkeep work keeps them open | Uses the shipped holdings path | Only ~20 mortals decide. Measured, route cells start about once per 300 ticks per seed. The lane lives or dies by one mortal's attention, not the world's. And mortal-founded lanes, which *have* an owner, die at +36 today anyway | Rejected as the life rule. Kept as the layer on top: an owner's work lifts a lane above its ambient level |
| C. Exempt worldgen lanes from decay | Trivial | Immortal lanes that ignore their world. THR-1320 rejected exactly this for founded lanes (accumulation, prosperity inflation, dissolution moved onto paths that do not exist) | Rejected |
| D. Carry only while the pair has cargo | Reads like trade | Measured: 4 of 6 · 6 of 6 seeded lanes have an empty manifest at t12, and balance is 0 on all of them. This is today's defect with a different timer | Rejected. Cargo sets how *busy* a lane is, not whether it lives |

**Tensions surfaced.**
- *Blockade teeth versus "suspended, not deleted".* The blockade verb's own comment promises suspension, and the THR-1320 counter-play assumed a lane that stands. So a blockade suspends, and killing a lane takes razing a town or cursing its roads. A warlord who wants a lane gone has a harder, more visible job, which serves the story.
- *Owner work versus ambient traffic.* If ambient traffic held volume up forever, raising a lane would be pointless. So ambient traffic has a ceiling (4 of 10), and worked volume sinks back one step a day. A merchant's work is visible on the map as a wider line, and it fades if they stop.
- *Prosperity inflation.* A standing lane pays prosperity (8 × volume/10 per lane, so 1.6–3.2 at ambient levels). The worry in THR-1320 was accumulation. The lane count here is bounded by what is seeded (6) plus what is founded (about 1 per 300 ticks), and the Done-when reports the delta.

## The clue climb: why it is dead, in order

1. A **survey is instant**, and instant work always resolves as `success`, so the `critical_success → located` row never fires. The climb's top rung is unreachable by construction. This was the surprise: THR-1450 fixed the *band* problem for instant cells by defaulting them to `success`, and that fix made `located` impossible.
2. A **held lead blocks its own survey** (`clue_already_held`), so a lead can never be improved.
3. **Nothing makes a lead a reason to act.** Survey targets are the nearest Locations. The lead's holder is almost always an ambient mortal, and nobody walks to a ruin.

## The climb: the options weighed

| Option | Verdict |
|---|---|
| Let a survey write `located` (a critical row for instant cells, or a dice roll inside the survey) | Rejected. It reopens THR-1450's convention across five readers. And the delve still needs the mortal *on the ruin's hex*, which a survey from afar never achieves |
| Turn on `requiresLocation` for survey cells, so a surveyor must stand at the site | Rejected. THR-1294 owns that switch, and with no binder to bring actors to a stage it makes undertakings die of absence (the census recorded on the constant) |
| **The hunt's shape:** survey → appointment at the ruin → the visit's dice set the lead | **Taken.** Every piece ships already (appointments THR-1519, the hunt row THR-1560, seed-only encounters THR-1526, journeys that keep their goal THR-1639). The mortal ends on the ruin's hex, so admission follows with no new movement code. The dice are real, so the god can nudge them |
| Pass leads from ambient holders to deciders ("the barkeep tells the adventurer") | Deferred. A decider weight at hearing does most of this more cheaply. If the S2 measurement falls short, this is the next lever |
| Give elder ruins board encounters of their own, so mortals are drawn there anyway | Out of scope here. It is the content program's call ([THR-1634](https://linear.app/threadbare/issue/THR-1634): ruins after the past lands) |

**Vision premises invoked.** *Systemic over scripted*: nothing is timed or forced. *The god acts at one remove*: the visit is an ordinary encounter whose dice can be nudged, and `perceiveRelay`'s divine refine still works alongside. *Every consequence is state* (Law 56): the lead's precision is on the sheet, and the visit's chips anchor on the ruin.

## What would change the call

- If S1's census shows prosperity running away on lane-dense capitals, lower `LANE_TRAFFIC_MAX_VOLUME` before touching the life rule.
- If S2 leaves the decider share below 30%, raise `CLUE_BIAS_DECIDER` first, and consider hand-off second.
- If S3 shows visits missed more than kept, the travel pull (`CLUE_LEAD_VISIT_PULL_MULT`) is the lever, as it is for hunts.
- If Christian vetoes "blockade suspends", the alternative is one line: drop `suspended` and let a blockaded lane decay, which gives blockades teeth at the price of the verb's promise.
