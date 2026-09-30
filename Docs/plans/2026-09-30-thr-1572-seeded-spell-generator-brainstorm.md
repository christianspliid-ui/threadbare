# Brainstorm companion — the seeded spell generator (THR-1572)

Companion to `Docs/plans/2026-09-30-thr-1572-seeded-spell-generator.md`. It holds the options weighed for each lane decision, the tensions left open, and the Vision premises the plan leans on. Written by the design lane, run 2026-09-30a.

## The finding that reshaped the plan

The ticket was written assuming a caster's sphere picks their tradition shelf (THR-1230 ruling 4: "tradition shelves"; the prototype drew tradition *from* sphere). The census on 2026-09-30 says no caster has a sphere at worldgen: 109 of 109 on seed 42 carry all-zero `sphereAffinity.scores` and no `sphereAlignment`, and no settlement carries a `dominantSphere`. That is why the runtime's sphere shelf seeds every caster with the fallback cantrip. Any generator keyed on the caster's sphere would inherit the hole, so the plan turns the arrow around: **tradition first, from what the caster does; sphere follows from the tradition.**

## Lane decision 1 — where a caster's tradition comes from

| Option | For | Against |
|---|---|---|
| **(a) Role themes × faction reach lean, hashed** (chosen) | Every caster has a role (103 of 109) or a faction (83 of 109); reads what the world already says about them; a priest of the Dawn is a Holy mage because that is what priests do | A new authored table (`ROLE_THEMES`); dark traditions are rare unless the lean or the off-role tail reaches them |
| (b) Give casters spheres at worldgen, then keep the sphere shelf | Matches the ruling's wording | Changes every sphere reader in the game (affinity growth, alignment, encounter scoring) to fix a seeding pick; a much wider blast than this ticket owns |
| (c) The settlement's culture or dominant sphere | Place-flavoured magic | Settlements carry no dominant sphere (measured); culture is on 28 of 109 casters |
| (d) Uniform hashed pick over 34 | Trivial | A warmage of Healing Magic; the prototype's first failure again |

The off-role tail (`SPELL_GEN_OFF_ROLE_WEIGHT = 0.05`) is deliberate: a world of only holy priests and healers is less interesting than one with a hedge necromancer in it. It is the kill-criterion lever if the world reads too dark.

## Lane decision 2 — one library per tradition, not one spell per caster

| Option | For | Against |
|---|---|---|
| **(a) A shared library per tradition in use** (chosen) | Keeps the runtime's model (one shared definition node, many bearers); a tradition feels like a school with a book; node count bounded by traditions in use | Two priests may carry the same spell (the hashed seeded pick spreads them) |
| (b) A unique spell per caster | Every mortal's magic is theirs | ~100+ definition nodes per world, each carried by one; a generated sample of a hundred near-duplicates; learning has no "next spell of the school" |
| (c) A fixed library per tradition authored by hand | Highest quality | 34 × 6 = 204 hand-written spells; the THR-1232 ruling chose cores plus variation over hand authoring |

## Lane decision 3 — where a generated template lives

| Option | For | Against |
|---|---|---|
| **(a) On the definition node, read by `resolveSpellTemplate(graph, id)`** (chosen) | Graph-native ("everything is a node"); per session by construction; no registry to leak across games | Nine call sites repointed |
| (b) Regenerate from an id that encodes its seed key, memoised at module scope | No call-site change | A module-level memo keyed on id would serve a previous world's spell to a new game in the same page unless the id also carries the world seed; CLAUDE.md forbids module-scope engine caches |
| (c) A session registry on `SimulationRuntime` | Also per session | Several call sites (the UI adapter, `resolutionModifiers`) have a graph but no runtime handle |

## Lane decision 4 — the doom cap is zero

The ticket asks for "a population cap on world-doom prices, because `doom_rate_multiplier` multiplies across every carrier." Measured: `phaseDoom.ts:349-355` multiplies the key across every individual actor. With a shared library, one tier-1 carried price multiplies once per bearer — a school of twenty necromancers would speed the world's end twenty-fold compounded. Options weighed: a per-world carrier cap (count carriers, refuse the key past N); a per-spell magnitude so small it stays safe at 100 carriers (1.002^100 ≈ 1.22 — still a fifth faster, invisibly); or none at all. The soul price (`doom_increase` → `spell_price` → quintessence) already says "the world objects" per caster and additively. Chosen: none, as a constant set to zero, so a later design can raise it behind its own read-back.

## Lane decision 5 — notice is a hidden mark

Options: a new cost type `notice` (a new engine concept with no reader); reputation loss with the caster's faction (`relationship_damage` — refused as a cost today, and it is *known*, not *noticed*); a hidden mark (exists, has a reveal path, reads as "someone saw, and it may come out"). The THR-1232 write-up itself pointed at the THR-661 hidden-mark pattern. Chosen: the existing `forbidden_contact` category, one mark per caster per spell. Open: which encounter families reveal it — each tradition row names them, and the validator refuses a family nothing matches.

## Lane decision 6 — a cast must write

THR-1683 found that a landed Hollow Crown changes nothing but the step's odds, because `aura` and `conditional` are modifier-only in `executeEffect`. The prototype's deliberate spells lean heavily on `duration` riders, which are modifier-only too. Options: wait for THR-1683 before building the generator; emit them anyway (a spell that promises what it does not do — the one rule the item generator stands on); or admit only writing arms now and flip rows when THR-1683 lands. Chosen: the third, with the rows named, so the generator improves by data change when the channel ships.

## Tensions left open

- **Elder magic, discovered not selected** (taste profile). A tradition is shown on the sheet as *Taught by Holy Magic*. That tells the player something a purist might want them to find out. The plan keeps it because Law 14 (player words) and Law 4 (what a thing is) point the same way, and because the tradition is the explanation of the price.
- **Ruling 4's "tradition shelves" were sphere shelves in the prototype.** The plan keeps the Foundation-sphere patch as authored data but reverses the direction of the draw. If Christian meant spheres to lead, the veto is one function (`casterTraditionOf`).
- **The stray fifth Foundation sphere** in `world-model.json` (Shadow) is ignored, not removed. A canon reconciliation is outside this ticket.
- **The coherence bar** ("a player could guess its tradition from its name and effect, and its price from its tradition") is a review bar, not a gate. The gate proves honesty; only reading proves coherence.

## Vision premises leaned on

- Systemic over scripted (the world writes its magic from authored ideas).
- Narrative over mechanical perfection (price as characterization; notice as story).
- Prose, not numbers (the sheet speaks in words).
- The god shifts probabilities and never directs a character (unchanged by this plan).
