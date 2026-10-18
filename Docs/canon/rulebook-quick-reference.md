---
domain: rulebook
last_reviewed: 2026-09-02
reviewer: claude-code
ul_shards: [Cosmology, Agents, Encounters, Prose, Graph]
status: live
companion_of: rulebook.md
---

# Rulebook — Quick Reference

> The board-game reference card: current rules of play, with sparse `[IMPL]`/`[DESIGN]` tags marking the few pieces not yet shipped. For full status flags, source citations, and open questions load the full [rulebook](rulebook.md). For *why*, load Vision. For terms, load UL.

## What You Are

You are an **Ascendant** — a transcended mortal. You watch the world from a height. You spend sphere-typed essence. You shift probabilities on mortals you have threads to. You do not direct-control characters. The game asks one question per run: *what kind of god are you?*

**Buy your spheres** (THR-1749): at Remembrance you pour five measures into the eight Creation spheres (at most three in one, never both of an opposed pair; your hunger pre-fills a 3 + 2 split). Your two largest are your primary and secondary; income follows the whole pour, and every sphere keeps a small floor.

## What the World Is

A procedurally generated hex map. Hexes are mutable state (not graph nodes). Everything else — actors, locations, sublocations, factions, cultures, artifacts, traits — is a graph node connected by typed edges. Agents pursue their own goals through a Maslow needs pipeline. Above the cycle: a **Doom Clock** ticking toward an Unmaking. Beneath it: a **World-Soul** carrying echoes from prior cycles.

**Two borders, two meanings.** Dotted = an **Area**, the named ground; every land hex is in exactly one, and it never changes hands. Red = a **Realm** (a nation): a landed Faction with a seat and a court a mortal can climb. The red border is not stored — it is the towns the Realm holds, so **conquest moves the map**.

## The Three-Beat Turn

**Scan → Curated Moment → Aftermath.** Each tick is two in-world hours; 12 ticks per day. The world runs in real time between moments and **halts for every moment that matters**; when it closes, the clock returns to the state you left it in [IMPL — the Stellaris model, 2026-09-27; interrupt registry + resume-to-prior, THR-1608]. **The First is born asking:** her story chapters stop the world; after one ends she lives about two days of ordinary life before the next can begin, and her chores never ask [IMPL — THR-1715]. **Set a moment down** (Escape, or Show on map) and it waits on its badge: the world runs on, but that mortal stands in the moment until you return, let fate decide, or let them live on [IMPL — THR-1730]. Order is load-bearing: scan means you chose to look; encounter is the chapter; aftermath is the breath before the next scan.

## What You Can Do

Five verbs: **Create, Find, Change, Destroy, Control**. Control is the god-game signature — sustained commitment with ongoing cost, contestable by rivals. *You can't Update what you haven't Read* — Find gates Change/Control.

Every detail view becomes an **action target**. The ActionDrawer fills with templates filtered for that target. Each template can require two orthogonal checks: a **Reach prerequisite** (Domain Capability tier) and a **Sphere prerequisite** (sphere alignment). Both optional per template. Prerequisites also gate visibility.

**Where your powers come from** [IMPL — THR-1811]: the opening gifts and milestones give some; **most you take up from what the world offers** — each day three works stir, drawn to who you are; take up one with essence you have *earned* through its sphere (or from your first sphere at double), or let them pass when the day turns. Spending earned essence never lowers your attunement. As your attunement grows, deeper works are offered and their keys are given; your second reach signature is the first key. Tier and price are data on each card.

## The Cosmology

**Eight Reaches** (what you do): Iron, Gold, Shadow, Veil, Heart, Eye, Stone, Star.

**Twelve Spheres** (what fuels it):
- *Foundation:* Chaos ↔ Order, Light ↔ Darkness
- *Creation:* Force ↔ Mind, Matter ↔ Time, Energy ↔ Spirit, Life ↔ Entropy

Reaches and Spheres are **orthogonal**. The same Reach at different Sphere alignments produces different narrative textures. Quintessence is a separate meta-property (narrative centrality / threadbare-ness), **not** a ninth Reach.

## Your Resources

- **Influence Essence** — per-sphere pools. Regenerates from worshippers (faithful towns: a hungry town on your ground prays, and one you answered that recovers keeps faith, up to four — THR-1935) / places of power / portfolio depth. Spent on actions, sustained on Control. **Upkeep**: every thread (by tier, 0.1–0.5) and every controlled essence source (0.15) costs a little of your primary sphere each tick; an unpaid thread stops climbing, an unpaid source stops growing, neither is lost (THR-1747). The source verbs arrive 48 ticks after the bond (the Wellspring); two flowering sources grant the four held-ground cards (Held Ground).
- **Dominion** — how much a place, mortal or faction leans toward your bought spheres: Hostile · Foreign · Touched · Held · Sovereign. Threads pay by tier × their mortal's band; sources pay by their host's band (Hostile pays nothing). Claim Dominion (a hold) and your seat, threaded mortals and anointed factions tend ground; untended ground fades and rivals press it; the seat never falls below Touched. Attunement through bought spheres strengthens it, up to double. Cheaper, surer casts on your ground, shown by the card chip and the cast bar; the Dominion lens (key 1) shows your ground and its frontier (THR-1750) (THR-1748).
- **Control slots** — sustained-effect cap, scales with Domain Capability tier [DESIGN — no cap in code; nothing gates how many you hold (THR-936)].
- **Influence Tiers** — depth of a thread (0–4 in code; five narrative names — Unaware → Curious → Recognized → Devoted → Enthralled — plus 'Aspect' as a separate apex milestone). **The apex is not bought and not chosen by you**: the Apotheosis asks the mortal *sacrifice vs survival*, you lean with cards, and the roll decides whether the frame holds — failing it is the "unmade" ending, not a retry (THR-1086).
- **Forks are decided by the mortal, never by you** — `decidedBy` reads their standing on the fork's value axis plus the lean of the cards you committed, and taking a fork drifts them toward that pole. A god with no cards in play still gets a decision; only a genuine tie falls to a coin.
- **Court positions** — `the_first`, `retinue`, `watched`, `dormant`. The first mortal the god threads, by any route, becomes `the_first` [IMPL — THR-1644 S1], and every thread plays a rite that scales down after the first [IMPL — THR-1754 S2].
- **Stealth** — detection profile against two audiences: mortals (whose disbelief turns to faith) and rival gods (who scan for divine signatures).

The two-way thread: you intervene; the mortal responds. The response is part of the texture.

## Encounters

A **curated chapter**, not a flat roll. Two pipelines, one format (`UnifiedActionTemplate`): authored *branching* encounters and systemic *linear template* encounters. Encounter awareness is **hex-granular** — if you see the hex, you see everything on it.

Resolution: **sigmoid → d100**, unified. No alternative dice. Outcomes land on a five-band ladder — *clean · at-cost · failure · crit-success · crit-failure*. **Success-at-cost (scraping through) is the dominant, expected texture**; clean and critical success are rare signals a god notices. **A mortal takes on challenges it forecasts at ~50–65%; skill decides which ones** [IMPL — THR-1581; the journeyman-and-up half waits on content, THR-1627]: success stays level while what a mortal attempts grows with it, failure never costs reach, a failed challenge is not retried straight away, and long odds are the god's to impose. Critical failure survives at every scale (only its severity scales) **except under an active `no_crit_fail` nudge** — an authored, essence-priced, per-step exception, never a global gate. **Every failure leaves a story artifact** — no outcome is dead air.

**The nudge** [IMPL — THR-773 substrate, THR-775 interface]: in an *attended* encounter only (`story_beat` tier), you get a hand of authored, essence-priced cards that bend the named odds. You nudge the physics; fate still picks the outcome. A card may carry a **rider** — *no crit fail*, *floor at cost*, or *the Gambit* (widens both ends: good gets better, bad gets worse) — that remaps the band after the roll lands; at most one applies, the protective riders outrank the Gambit, and riders never take an extra die. A card may also charge a **price that is not essence** (visibility to rivals, the doom clock) and **leave something behind** — an omen, a lifted condition, an item, a kindled ambition [IMPL engine — THR-885; card content DESIGN, THR-883]. A hand may be authored whole by the encounter, or **composed**: the encounter authors 0–2 specials and the rest is **dealt from your Repertoire** [IMPL — `ActionStep.deal`, THR-1247], scored on your spheres, the step's subject, and what you have earned. A dealt card names its origin on its face. Nothing is shuffled — same god, same step, same cards, every time. Sphere-matched cards cost 1 less, never below 1. Background and shaping encounters resolve exactly as before. **Probability floors at 5%, and the clamp bites before your cards are counted** — a mortal attempting something far outside their reach reads *doomed* however much you spend. You bend a mortal's odds; you do not lend them your competence.

**Appointments** [IMPL — THR-1479]: an ending may bind a mortal to a place by a time. They lean toward it as the time runs short, then go; a prudent mortal leaves early, an ambitious one may choose to miss. Kept, the promised meeting fires there; missed, a reckoning finds them wherever they are, with the broken promise on their sheet. Only encounters mint appointments.

**Sphere attunement**: the run counts the essence you have ever drawn *through* each sphere — spending never un-earns it. Cross a mark (`[20, 60]`) and that sphere's attunement cards join your repertoire: siblings of cards you already play, never stronger ones. **Depth, not a key** — your sphere identity still decides which families you may touch at all, so attuning to a sphere you do not hold gains you nothing. You start at the essence ceiling, so nothing is earned until you spend.

**Meet The First** [IMPL — THR-868; Batch A conversion THR-875]: the run's opening encounter and the only guaranteed one. Five beats, **three fate rolls** — two *formative tests* and the *bond test* as climax. A meeting card may carry a **pole lean**: the played hand's net lean picks which pole of the reach's value pair a *success* writes, and fate picks the band. Success writes the leaned pole; failure writes the **opposite** one plus a scar; the middle band writes a tempered shift. So *you nudged toward mercy, fate landed ruthlessness* is a real result — and you never have to seek a failure to get the pole you want. The bond **always** forms; the roll picks its reception (*awe · devotion · bargain · doubt · defiance*), and a defiant First bonds and defies you. A First can never start Broken (floor-clamped), and every card is affordable when offered (cost-capped — it fires on turn one). **Your first formative test is always a nudge beat** — slot 1 can only draw from the converted Batch A set. A meeting draws two or three dilemmas, and a later slot can still land on an unconverted template and render the legacy choice scene; a wholly pre-nudge meeting cannot happen.

**Fights** [IMPL — fight block FB1–FB7, THR-1537..1543]: a fight is a *nerve* step then up to three *exchanges*, every roll the ordinary ladder, all at the regional scale. The opponent's **card** prices the steps (*Dread* the nerve, *Might* each exchange); blows fill its **clock**, and a blow that lands on a full clock wins. Bad exchanges cost quintessence and leave conditions; after a wound the mortal chooses to fight on or yield on their own courage (your cards tip it); at half clock the opponent shows its temper. Grudges, secrets, favours, company, storied arms, blessings and curses are named lines on the odds, and the odds shown are the odds rolled. First template: *The Beast in Its Den*, never drawn at random. **The lair's beast** [IMPL — THR-1544] carries its family's card (Dread, Might, a temper, clock 4); a legendary lair hardens it to clock 5 and one more word of Dread, and its wounds stay. *The Named Beast* hunt [IMPL — THR-1545] is offered only where the beast lives, and fights it. **Duels** [IMPL — THR-1556, THR-1557, THR-1558]: when two mortals fight, both roll and two blows decide it; the victor's own mercy or ruthlessness decides a beaten loser's fate (spared and scarred, or finished one time in four), and a loser who yielded or fled is never killed. Two mortals who share a grudge born of a real injury and stand in the same place may **boil over** into a duel (about one tick in twenty, one in ten if either is bold; an old quarrel never does; eighty ticks between a pair's duels). A mortal fights one duel at a time, and a threaded mortal is always the one acting.

**Spells** [IMPL — THR-1571 S1, THR-1670 S2]: priests, healers, scholars and other casters start the world knowing one spell of their tradition. Most spells work on their own while carried; a few are cast, and **the same roll that decides the work decides the spell** — a landed band does what the spell says, any other fizzles, the price is paid either way. A strain spell leaves its caster **Strained** (a Reach thin for a while, never lost); a gamble can bite on a good day, a transgression only on disaster. **In a scene, a caster reaches for a fitting spell when a step's odds look bad** (below 45%, shifted by courage); the step shows "casting *Spell*" on its odds, and the step's roll — which your cards bend — decides the spell. **Every caster belongs to a tradition** [IMPL — THR-1572] chosen by their work and their people; each tradition teaches its own generated spells and prices them its own way (holy and healing never cost the soul; death and curse are never free), and dark arts are noticed — a hidden mark a later encounter can reveal. **A god can teach a mortal a spell** [IMPL — THR-1672] from the god's own spheres. Dark magic costs the god doom and being seen, and keeps costing when it is cast. Some arcane and ancient books teach whoever holds them, and an ancient book can lead a mortal to elder magic.

**Broken** [DESIGN — consequences ship disabled until the rebuild road exists]: failing erodes quintessence, scaled by band, step difficulty, and whether you were watching. Worn far enough a mortal goes *Broken* — not dead, not hurt, **out of the story**: no ordinary draws, drifting toward tended ground, for one to two in-game weeks. Erosion alone never reaches zero; death stays zero-state-owned. *Rekindle the Thread* (Spirit) is the expensive exception — the rebuild road is the primary recovery.

Four design rules: (1) Path over adjective. (2) Moral axis is structural — each Reach maps to an archetype-pair (Iron: Protector ↔ Conqueror, etc.). (3) Verbs are encounter-specific, soft-power flavoured. (4) Every primitive is clickable.

**Failure is plot, not punishment.** Aftermath reshapes the protagonist's trajectory; it always produces narrative texture.

## The World at Work

Locations hold **resource stocks** in named classes (staple / strategic / luxury / arcane), resolving to three tiers: **scarce · adequate · surplus**. Tier drives prosperity, and surfaces as a plain-prose **Livelihood** line — you read hunger or glut, never a number.

**Unrest is pressure, not a spike.** It creeps (a few points a day) toward what a town lives through — hunger above all, then want, siege, sickness, its recent dead — and sudden blows fade back. **Restless** towns lose people to a fed, calm town nearby; **Lawless** towns riot over the granaries and pay half their tax. The place page's **Fortunes** row says it in one sentence, never a number.

Trade routes carry a **cargo manifest** naming what actually moves, derived from what each endpoint has spare and what it wants. Merchants prefer **complementary** partners — a surplus beside a shortage beats two towns with the same granary. A lane **lives while both its towns stand**; it dies only when a town is razed or its roads are cursed, and a blockade suspends it rather than killing it.

Five economic verbs are yours: **Bless the Harvest** (Gold / Life) swells staples toward glut; **Blight the Fields** (Shadow / Entropy) draws them toward famine; **Reveal the Vein** (Eye / Matter) surfaces a new deposit; **Guide the Caravan** (Eye / Order) boosts and protects every road that feeds a settlement; **Sour the Mine** (Shadow / Entropy) pinches the non-staple wealth shut. All arrive as milestone unlocks, all land a beat later — you tilt the odds, you do not farm.

**Armies fight only enemies** (hostile, rival, at war, resented past the rivalry line, or a monster lair). An army defends its own or a sworn vassal's threatened town within eight hexes first; otherwise it marches on the richest enemy town a supply line can reach, and holds when there is none. It re-aims once a day, and its sheet says why.

Every **mortal who makes choices is born with Means** (their walk of life, their home town's fortune), and a **money encounter pays or costs it by how the dice fall** — the stakes name the risk first, and the poor lose half as much (THR-1936). A **poor or greedy mortal leans toward work that pays**; a rich one who is not greedy turns away from it — the lean weighs what they choose, never their odds (THR-1952).

Every **faction keeps a purse**: the towns, places, borders, tolls and guild work it holds pay it daily, and its armies cost upkeep. Raising an army costs coin; an army its purse cannot pay deserts. The faction sheet's **Purse** shows its Means in words.

A **realm courts fealty**: it forces a faction it besieged or took a town from, else persuades or buys one with protection, standing and a gift. A vassal pays its liege three tenths of its day income; its loyalty, on the reputation words, breaks at Distrusted, and a big realm breaking away rebels. A realm with two oaths is a **Crown** (THR-1932).

## The World in Company

Mortals **band into companies** (never "parties" in player-facing prose) that travel and fall apart together. A company holds a single scalar, **cohesion**, read only as prose: **bound · holding · frayed · breaking**. Companies form from colocated mortals, take encounters a lone agent cannot, and resolve each step through whichever companion best suits that step's Reach.

Factions field **bands** of their own named people — a band is a company in every respect, and known by whose it is ("The Temple of the Spheres' Sparrows"). A company and a foreign band on the same hex resolve as **one contested pair**: both priced by full company strength, the loser shedding cohesion, a decisive loss risking a named member's life, and both sides leaving with a **grudge** — the same standing blood two *people* can carry (see below), reported in prose on the mortal sheet either way ("There is blood between them and …") and never as a number. Four authored confrontations — **The Ambush**, **Den Assault**, **The Guild Falls**, **The Standoff** — surface only while a live opponent is standing there; The Standoff is the rung where it can end with nobody carried away.

Your seat stays the intervention seat: **Bless this Company** (Heart / Spirit) steadies a band's bonds; **Draw Together** (Heart / Spirit) tilts scattered threaded mortals toward one hex until a company gathers on its own; **Reunite** (Heart / Spirit) calls a company that has *already disbanded* back toward one another, re-forming under a variant of its old name — or lapsing unanswered; **Sunder** (Shadow / Entropy) is Bless's mirror, doubling dissent and desertion and forcing the fray drama pool open. Bless and Sunder may both be open at once and neither cancels the other. You never command a company.

## Following a Mortal

**Follow** a mortal and their long work interrupts you: a costly step, trouble, a doubling-down, an abandonment, a finish opens a **moment** card — plain narration, the state that moved, and *Inspire the Work* / *Sow Doubt* while the work is live. Your thread's First and retinue are followed by themselves; un-following one is a **mute**. Everything else, and every founding, waits as a badge on the thread row for four days. An encounter always opens first.

Every mortal carries a **calling** — *Trader, Reaver, Mender* — derived from their strongest reaches, the ambition they pursue and their temperament. It changes only when their life does, holds at least three days, and a change in the spotlight is a chronicle moment.

## When Someone Is Wronged

A harm becomes the victim's next drive. An undertaking that razes a holding, severs a network, or kills a name writes an outcome naming **culprit** and **victim**, and offers the wronged party a temperament-shaped *set* of drives — vengeance, rebuilding, guarding, flight — with their character picking, not the world. The god is never a party: no mortal can hold a grievance against you.

A drive minted from a harm is a **grievance**: it names its culprit and carries **heat**, read as *burning · hot · cooling*, never a number. One per mortal — a repeat harm feeds the standing one, only a decisively heavier harm takes the slot. Heat decays, and below the threshold the vendetta leaves the board and becomes a permanent **grudge** (relationship colour, not a drive; it never fades). It also ends when *answered* — the grievance's own ambition completing, or the culprit dying. A **proportionate** reprisal mints nothing back; only an answer that overshoots re-opens the account, which is what ends most feuds at one round. Past two links, further victims get grudges only. A mortal below the spotlight gets the grudge without the vendetta — no promise the world cannot keep.

A heavy enough harm may take a full mortal's **secondary** want — the vendetta sets it aside, and the chronicle says so; the primary is never displaced, and a lesser harm offers a full mortal nothing. A harm done to a **faction** reaches its leader, with the faction's name in the provenance. Every harm is offered to exactly one mint pass; none falls between.

## Where You Stand With People

**Reputation** is the social score modifying interactions between any two parties — a mortal and a town, a mortal and a guild, a mortal and another mortal. One concept, one vocabulary, wherever two parties stand in some regard. It is **directional** (a's standing with b is not b's with a) and always reads as a **word, never a number**: *Distrusted · Unknown · Accepted · Respected · Revered*. Note the neutral default already bands as **Accepted**, so a gate meaning "this person has earned something" must test *Respected* or above. Standing opens doors, gives a known name leverage in a parley, and fades toward unremarkable when nothing feeds it. Faction rank is reputation's ladder inside a membership; a stranger can earn a name in a place without joining anything. You read it and nudge the deeds that move it — you never set it.

## The Clocks and the Ending

Two clocks pressure the run. **Doom** (7 archetypes × 5 stages: Whispers, Signs, Tremors, Crisis, Culmination) ticks toward an Unmaking. It sleeps until you bond The First, and it cannot end the world before a floor of time after the bond [IMPL — THR-1646, the opening plan S2]. **Victory Mandate** (3 stages, graph-state win) runs in parallel. They pressure each other — essence spent on one is essence not spent on the other.

Either clock ending triggers the **Twilight Phase**: the run's closing chapter, harvested into Echoes (Legacy / Monument / Relic) that feed the **World-Soul** and shape the next cycle. When an age ends a new world wakes — a new map carrying your god's marks and leaning toward its spheres; your next god starts as strong as your first (THR-1813).

The game is not, structurally, about winning. It is about what kind of being you chose to be toward a world you could not save unconditionally.

---

## What this card deliberately leaves out

Recorded so a future review does not re-raise it as drift (decision 2026-09-02, THR-1378). Two rules of play live in the full rulebook and are **kept off this card on purpose**:

- **Companions** (§6) — a mortal's resource, capped at 3, never silently vanishing. Left off because the card is written from *your* seat, and companions are a bonus the mortal carries that you neither spend nor command; a player reading this card needs to know what *they* can do.
- **Items answering back** (§4) — break/spend/charges/rule-overrides. Left off because all four are consequences that happen *to* a mortal's gear at resolution, with no decision attached for you to make.

Both are real rules and both are on the full page. **Reputation earned its place here** where they did not, because standing gates encounters and shifts scenes you are choosing whether to nudge. If either of the two ever grows a player-facing decision, that is the trigger to revisit — not their mere absence.

For the full rulebook (with status flags, source citations, and open questions): [rulebook.md](rulebook.md).
For terms: [Ubiquitous Language index](../ubiquitous-language/README.md).
For why: the vault's `TheFantasyWorldSimulator/Vision/` folder (filesystem via `OBSIDIAN_VAULT_PATH` — outside this repo, so no relative link resolves to it).
