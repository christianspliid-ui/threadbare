# Brainstorm companion — Sphere-governed ascendant decision record

**Session:** 2026-07-30, live chat, Christian (creative director) + Claude (Fable design session).
**Plan doc:** `2026-07-30-sphere-governed-ascendant-decision-record.md`

## How the discussion actually ran

It started as a bug report: the ascendant sheet said "Primary Matter / Secondary Mind" while the bar said "Primary Stone / Secondary Gold / Secondary Iron", and Christian asked what the bar's Reaches block was even *for*. Code investigation showed no data bug — two axes (spheres vs reaches) both labeled Primary/Secondary, the sheet feeding frozen day-one ranking weights through the mortal word ladder. Explaining *why* the reach block exists (THR-613's card-unlock ladder) surfaced the real question: Christian's mental model was sphere-gated god cards, and the engine is reach-gated.

## The vision statement that decided it

Christian: the ascendant is *"a god, a being of magic, a force of nature, and as such does not work under the same rules as mortals… they have ascended to be able to shape the world in some sense, and so have become avatars of the spheres. this is from the core vision."* Mortals work within the constraints of a mortal soul and body — a reach governs whether they can even learn magic. The god's cards read as magic to mortals, so spheres should govern them in the ascendant context. The god also doesn't roll tests or run encounters — that's what reaches grade.

Supporting evidence from the code leaned the same way: sphere alignment is already the god's identity on every other surface, and the reach signatures are already sphere-scaled internally — the reach is mostly the label.

## Positions taken and resolved

- **Reaches on the god: vanish vs demote.** Resolved: demote to mortal-past echo — with **ascendant-specific epic descriptions**, never reusing the mortal register ("they were larger than life").
- **Canon line accepted verbatim:** "the Veil reach is whether a mortal can touch magic at all; the sphere is whose power flows through them… Mortals reach through the Veil" — Christian: "spot on."
- **God practice-grinding rejected.** Growth = accretion (threads, sources, worship) + trials. Worship flagged as undesigned.
- **Sphere-keyed trials rejected** in favor of **sphere clashes**: "all trials are about shaping the world and so should be about spheres clashing." Any god may answer any clash; alignment shapes how, not whether.
- **Trial rewards permanent vs temporary:** deliberately open to both.
- **Sequencing:** the whole god power curve is "still rudimentary as we build the world and the mortals" — pivot parked (Sphere-Governed Ascendant project, Idea), legibility fix ships now (THR-869).

## Alternatives considered and dropped

- **Sphere-surge trials keyed to the god's own spheres** — dropped by Christian's verdict (clashes, world-authored).
- **Editing CLAUDE.md's settled decision immediately** — deferred to THR-870 activation so canon and implementation move together; interim guardrail recorded in the plan doc instead.
- **Fixing the sheet by relabeling only** — rejected; the frozen-affinity Dominion list would still drift from the live bar every tick. One shared read is the fix.
- **A signature rework inside THR-869** — rejected as pivot pre-build; signatures move with THR-870.

## Open threads deliberately left open

- Worship as an accretion channel (needs its own design session).
- Trial reward split (permanent vs tilt-scoped) and doom-tier trial stakes.
- Whether bestowal (god granting mortal spells) lands with the spell system or earlier as a thread verb.
