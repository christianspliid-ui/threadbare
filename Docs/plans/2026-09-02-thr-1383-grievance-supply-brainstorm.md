---
tags: [brainstorm, engine, grievance]
aliases: [Grievance Supply Brainstorm]
status: complete
created: 2026-09-02
updated: 2026-09-02
---

# Grievance supply — Brainstorm Companion

> Companion to `Docs/plans/2026-09-02-thr-1383-grievance-supply.md`. Alternatives considered,
> tensions surfaced, Vision premises invoked. Written alongside the plan, in the same
> single-executor session that closed THR-1349.

## How this started

THR-1298's last slice ran the 300-tick observation its plan asked for and reported zero grievances minted on both seeds. The plan's kill criterion said: surface it, do not tune it away. The ticket named two reasons (faction victims; victims with two wants) and three candidate directions, and asked for a design pass.

## First-pass framing I considered

I expected to pick between the ticket's three directions. Re-measuring on the current tip changed the question: under the live decision board (THR-1349, an hour older than this session) no faction was a victim on either seed — every victim was a spotlight mortal holding two wants — and, more importantly, **two-thirds of harms were never inside a mint window at all**. The mint pass runs every 75 ticks (the LCM of two cadences) with a 25-tick lookback; that predates the grievance work and throttles the encounter-outcome mints too. So the design has two holes, one of them older than the ticket.

## Alternatives considered

**A. Widen the lookback (the ticket's direction 3).** Rejected as *the* fix but adopted as a derivation: a lookback picked as a number is how the 25-vs-75 gap happened. The window is now `lcm` of the two cadences it has to tile, computed from the exported constants, so it cannot drift again.

**B. Let any drive displace a want.** Rejected: a rebuild or guard drive taking a mortal's want by force makes the free-slot gate meaningless. Only a vendetta earns eviction — it is the one drive the design gives urgency, and the temperament funnel still decides whether this mortal *wants* revenge at all.

**C. Displace the primary if it is the weaker.** Rejected: the primary is the identity drive the calling reads; a mortal who drops their life's work for a severed contact is not the story. The secondary is the one that yields.

**D. Add a third slot for grievances.** Rejected: it re-creates the queue the one-slot rule was built to prevent, and it changes `MAX_ACTIVE_AMBITIONS`, which the arc panel, the calling, and the board all read.

**E. Route faction harms to every member.** Rejected: a razed guildhall minting a vendetta in forty members is the region-of-avengers world THR-1298's suppression exists to stop. The leader carries it; the members hold the faction's grudge through the existing faction-side edge.

**F. Leave it — grievances are a spotlight-only rarity.** Considered honestly (the ticket offers it). Rejected because the surfaces are shipped and reachable by nothing; a lane that mints in constructed tests only is the invisible feature.

## Tensions surfaced

- **Systemic emergence vs authored moments (#2).** A vendetta displacing a want is where emergence becomes a chapter; the chronicle line is deliberately there so the moment is told, not only logged.
- **Divine remove vs player attachment (#3).** The god is never a party to a grievance (THR-1298's guard); this plan keeps that — the player watches a mortal choose revenge over a granary and cannot make them.

## Vision premises this plan leans on

- **Weight of threads** (north star): a wrong done to a mortal must be able to move them. This plan's version: a heavy enough wrong moves them even when their hands are full.
- **Narrative over mechanical perfection:** the free-slot gate was mechanically tidy and produced no stories.

## Taste profile touchpoints

- Words, never numbers: heat stays *burning · hot · cooling*; the displacement reads *"set aside for a vendetta"*.
- No new soft pattern.

## Branches not taken

- A grievance-specific mint cadence (a separate, faster pass). The one board is the competition surface and the one walk is the cadence; a second scheduler is what THR-1298 refused.
- Making `MINT_LOOKBACK_TICKS` a per-event-class value. One derived window is enough; per-class windows are a tuning surface nobody asked for.

## Open questions

- Whether `network_severed` at 0.5 should qualify for displacement at all — the plan says yes so both seeds have supply, and names the kill criterion that reverses it (vendetta monoculture).
- Whether the encounter-outcome mints (THR-726), now seeing three times as many events per pass, change the world's drive mix noticeably. Measured as a kill criterion; `MINT_BASE_CHANCE` is the knob.

## Brainstorm Status

Complete enough to hand off.

---
*captured 2026-09-02 — design session, Claude Code (single-executor session)*
