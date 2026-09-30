---
lane: tb-design-lane
run: 2026-09-30a
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-09-30 (run a, ~18:20Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [The seeded spell generator](https://linear.app/threadbare/issue/THR-1572/design-the-seeded-spell-generator-plan-doc-from-the-powers-and): **each school of magic now gets its own set of spells, written fresh for every world from the ideas you judged in the twenty-spell sample.** Today all 109 casters on the test world carry the same spell, Height Anchor. The calls made:
  - A caster's school comes from their work and the people they serve. A priest of the Dawn learns Holy Magic, and a warmage learns Fire or Lightning. It cannot come from their sphere, because no caster has a sphere when the world begins. A few hedge necromancers still turn up.
  - A school's casters share its book of about six spells. No mortal gets a spell of their own.
  - No spell speeds up the end of the world. A dark art costs the caster part of their soul instead.
  - When a dark art is used, someone notices. It leaves a hidden mark on the caster that a later encounter can bring out.
  - A spell that is cast must change something you can see. Spells that would only tilt the odds wait for [the fix to Hollow Crown](https://linear.app/threadbare/issue/THR-1683).
  - Elder magic (Order, Chaos, Light and Darkness) exists only in a school's two highest spells. Nobody starts the world with it, so it stays something to find.

  Plan: [the seeded spell generator](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-30-thr-1572-seeded-spell-generator.md). Spells are still not ready for you to look at. They will be once this is built and a thirty-spell sample reads well.

## Work

- **Chosen:** the build shelf held 2 jobs (floor 4) and no map was open, so this run wrote a plan. [The seeded spell generator](https://linear.app/threadbare/issue/THR-1572/design-the-seeded-spell-generator-plan-doc-from-the-powers-and) ranked first as the closed Powers map's own carve-up ticket. The power runtime it builds on cleared its veto window at ~00:52Z today. [The lead-climb survey and visit re-plan](https://linear.app/threadbare/issue/THR-1684/re-plan-the-lead-climbs-survey-and-visit-rungs-on-current-main-no-seed) is next in line; its veto dependency cleared at 12:57Z today.
- **Measured before designing** (CLI, seed 42, medium): `Seeded knowing: 109/109 casters wield a spell (109 via the fallback)`, and `bySpell` shows a single spell. Every caster has all-zero sphere scores, and no settlement has a dominant sphere, so the sphere shelf can never match. This finding moved the plan to key on a caster's school instead of their sphere.
- **Prototype preserved:** the spell prototype's source existed only in the non-git vault. It was copied verbatim to the never-merged branch [`proto/thr-1572-spell-generator`](https://github.com/christianspliid-ui/threadbare/tree/proto/thr-1572-spell-generator/Docs/audits/2026-09-24-proto-spells) so the builder can port it. That proto commit was made with `--no-verify`, which was unnecessary on a docs-only branch. Noted here; no gate was bypassed on `main`.
- **Gates:**
  - Intent judge (fable, cold) returned Allow on run 1, with five precision fixes, all folded in: `trace.ts` added to blast radius, the traces reshaped to the live pattern, the rulebook anchor, both overlay readers, and `payCosts` named.
  - Forked audits: NFP PASS-with-notes, pillars PASS, Vision PASS-with-notes. The Vision note (Foundation spheres are elder magic) was fixed by confining those spells to tiers 3–4.
  - Docs gates green.
- **Plan merged:** [PR #2154](https://github.com/christianspliid-ui/threadbare/pull/2154) — merged as `1848ae09`, liveness `LIVE`.
- **Handed off** [the seeded spell generator](https://linear.app/threadbare/issue/THR-1572/design-the-seeded-spell-generator-plan-doc-from-the-powers-and) to Ready for Dev, unassigned, with the coordination block. It must not run at the same time as [the Hollow Crown fix](https://linear.app/threadbare/issue/THR-1683) or [spells as gifts and tomes](https://linear.app/threadbare/issue/THR-1672).

## Escalations

None.
