# Buy your spheres — brainstorm companion (THR-1749)

Companion to [`2026-10-06-thr-1749-buy-your-spheres.md`](2026-10-06-thr-1749-buy-your-spheres.md). It records the alternatives the design lane weighed (run 2026-10-06b) and why each was not taken.

## Budget size

- **10 points, cap 6.** This is the obvious D&D-style number. It gives finer shapes, but at least six level words per sphere would be needed, or the screen falls back to numerals and breaks Law 13. It was rejected because the extra shapes buy nothing the Dominion read can tell apart at band granularity.
- **3 points, cap 2.** This allows only 2/1 and 1/1/1. That is too few shapes to feel like a choice, and 1/1/1 has no primary.
- **5 points, cap 3 (taken).** This gives four distinct shapes (3/2, 3/1/1, 2/2/1, 2/1/1/1). The cap forces two spheres, so "primary / secondary" always exist. Three level words are enough.

## Income split

- **Pure proportional (no floor).** An unbought sphere earns zero, which breaks the ticket's "never zero" Done-when. Foundation would also earn nothing, starving any later ruin-discovered magic.
- **Keep 35/25/4 and spread the rest by points.** This is a hybrid that still privileges two spheres. It contradicts ruling 3: the vector replaces the pair.
- **Floor 0.04 + proportional remainder (taken).** The 3/2 preset reproduces today's 35/25/4 to within 0.2 points, so the showcase economy does not move. The floor is today's number for an unchosen sphere, newly named.

## Control shape

- **Eight independent steppers + a "both poles" refusal.** This is legible, but the one-pole rule becomes an error message the player bumps into.
- **A radar / octagon drag.** It looks pretty, but it hides the opposition, is hard to make keyboard-accessible, and would be a new primitive (Law 26).
- **Four opposed-pair tracks (taken).** The rule is the geometry. Each track is a native-feeling slider with word readings, and it teaches `SPHERE_OPPOSITES` at minute one.

## The three off-canon hungers

- **Exempt them (Foundation lean for Haunt / Illuminate; allow force + mind for Reshape).** This preserves flavour, but it contradicts rulebook §5 and breaks the one-pole rule's purpose. Under THR-1745's formula, opposed buys cancel each other's Dominion.
- **Drop the two Foundation hungers.** That would remove content Christian has seen and liked. Too destructive (NFP 6).
- **Re-pair them within Creation (taken).** Only two words change per hunger; prose, courts and reach biases stay. Haunt → spirit / entropy, Illuminate → mind / energy, Reshape → force / matter (`SPHERE_ALLIES`). Veto call: "keep Haunt dark".

## Naming

`sphereAffinities` (the ticket's working name) is already a `SphereName[]` on five node kinds, and `sphereAffinity` is the grown sphere score. `spherePoints` is Christian's phrase ("buy sphere points") and collides with nothing.

## Tensions noted, not resolved here

- The god's grown sphere score (`sphereAffinity.scores`) is never seeded at init: the actor-seeding loop runs before `createAscendant` (`gameInit.ts:216-233` vs `:304`), and it casts the `{primary, secondary}` object to a number record. Seeding it from points is a Dominion-formula decision (power × affinity), left to THR-1748 and noted there.
- Foundation-signed card members lose their identity route (Deferral filed). The canon answer is "found in ruins", but no ruin grant exists yet.
