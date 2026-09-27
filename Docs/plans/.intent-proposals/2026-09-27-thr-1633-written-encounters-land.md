# Action Proposal — THR-1633 let written encounters land

## intent_quote

Christian, 2026-09-25, agreeing the analysis the map is built on:

> "I agree with your analysis. log it as a design map, and make sure you dont forget the details of this analysis"

Christian, 2026-09-25, authorising the unattended design lane that authors this plan:

> "I think we have reached a state of the game where you can probably iterate and progress designs without me in many situations, for example where we have agreed on a wayfinder map."

The ticket (THR-1633, filed from the closed map's carve-up), verbatim excerpts:

> "This is the **reach half** of the content program: make existing writing reachable before commissioning more."

> "**Re-measure before designing.** The outgrowth numbers (median decider capability 0.990) were taken before the dice refit shipped … fix 1 may already be smaller or different."

> "**Boundary:** fix 2 must not add deciding protagonists — the map rules that out of scope (the tick budget binds). Take the route where **existing** deciders can join guilds (the join gates), not new spotlight members. The THR-814 membership ruling stands."

> "**Done when:** a plan doc in `Docs/plans/` is merged via a `docs/plan-*` PR, passes intent-judge and design-audit, covers all three pillars, names its expected unlock per fix as a measured before/after, and the ticket is handed off to Ready for Dev with a coordination block."

## scope (what this plan does)

Designs the reach fixes from THR-1597 still open after THR-1612/1613 shipped, re-measured on current `main`: records fix 1 (outgrowth) as already closed by THR-1581; replaces it with the new first gate the re-measure found (the 40-slot shortlist cap's positional fill, S1); repairs the reroute defect that makes a travelling mortal abandon its chosen encounter, which is the remaining cause of The First's quiet stretches (S2); makes existing deciders able to join guilds through the join encounters — every hall considered, a guild-fit score term, and the chosen-join-to-membership break diagnosed and fixed (S3); gives the 39 faction `.social.` and 10 anomaly templates a path, and rekeys the location-trait bonus table onto tags with bearers (S4). Each fix carries a measured before and a gated after. Ships as four slices; this ticket carries S1.

## scope (what this plan does NOT do — explicit non-goals)

- No new prose, no new templates, no rewrite of the reached templates (that is THR-1634's volume half).
- No new deciding protagonists; no spotlight promotion of ambient members; no re-seeding of membership (THR-814 ruling; map Out of scope).
- No change to the dice, the forecast window, the band ladder or the engagement fit (THR-1575/1581 settled).
- No fix 8 (more off-settlement places) — the ticket keeps it out unless fix 1's numbers call for it, and they do not.
- No First-only rule: The First gets no special selection or movement treatment.
- No UI surface change.
- No change to `factionMemberWork` (THR-815).

## impact_class

Reversible — engine behaviour changes behind named switches that restore the old behaviour; data-list repairs; no save-format or schema change.

## evidence cited

- **Linear issue:** THR-1633 (map THR-1589; research THR-1597, THR-1590; ruling THR-814; dice refit THR-1581)
- **Vision premises invoked:** mortal autonomy; encounter priority (variety, "the same encounter twice should be rare"); failure is plot — via `Docs/canon/rulebook-quick-reference.md` and the map's standing rulings
- **UL terms touched:** encounter, guild, member, The First, location trait, spotlight. "Decider" and "shortlist" appear as plain-word shorthand, defined in the plan's **Words** note; code-facing names use *spotlight* (judge advisory, dimension 6). No new UL term proposed.
- **Canon pages consulted:** `Docs/canon/encounters.md`, `Docs/canon/rulebook-quick-reference.md`, `Docs/canon/systems-inventory.md`, `Docs/canon/interface-map.md`
- **Prior plan docs this builds on:** `Docs/plans/2026-09-24-thr-1575-forecast-window.md`; `Docs/audits/2026-09-25-living-world-and-content-coverage.md`; `Docs/audits/2026-07-27-thr-814-faction-draw-path.md`
- **Rejected approaches considered and dismissed:** 1–2 spotlight members per guild at seed time (THR-1597's first option for fix 2 — adds deciders, ruled out); nearest-hex-first cap fill (still starves late-registered templates on a busy hex); hand-tagging 434 templates for fix 7 (rekey is smaller and self-policing); a First-only arrival rule (breaks mortal autonomy; the general defect is the cause).

## load-bearing decisions touched

- *Encounter awareness is hex-granular* — preserved; S1 changes only the fill after awareness filtering.
- *Engine caches owned per session* — preserved; no module-level state added (the rotation is a pure hash).
- *Relationships are graph edges* — preserved; guild membership stays `member_of` edges.
- *Agent position three-tier model* — respected; S3 reads halls through the existing `contains` edges from the Location the lifecycle generator already uses.

## high-impact files touched (from Codesight)

- `src/data/unified-action-templates.ts` — 189 importers; touched only to append ten ids to `CACHE_REGISTERED_REGIONAL_TEMPLATE_IDS` (S4). Plan carries a Blast Radius section.

## kill criteria

- S1: top-10 share rises above 0.30 or determinism drifts → rotation off, distinct-first alone, report.
- S3: no `FACTION_JOIN_FIT_BONUS` in 0.2–1.0 reaches coverage without joins exceeding 40% of boards reached → stop, report the funnel; the join encounter would need design (a Christian-facing fork on what belonging costs).
- Any slice: deciders at t200 > +10% or steady-state ms/tick > +10% → stop and report.

## explicit user sign-off

Not required (Reversible).

## author notes for the judge

- The ticket's "fix 1" premise is falsified by the re-measure (outgrowth drops 46,805 → 0). I did not quietly drop it: the plan records it closed by THR-1581 and substitutes the gate that took its place, the shortlist cap (2 → 67·68 templates), because the ticket's own intent is "make existing writing reachable" and told me fix 1 "may already be smaller or different". Judge whether substituting S1 for fix 1 is within intent.
- S3's third cause (chosen join → no membership) is not diagnosed in the plan; only 3 chosen joins occurred in 400 simulated ticks. I made it a diagnose-first step with named candidates rather than assert a cause I have not observed.
- The First's fix is general (reroute defect). I saw the mechanism in code (`motivationPull ?? 0` compared at the first re-check; target dropped on reroute) but have not run an A/B proving it closes the 44-tick gap; S2's gate measures it.
- Raw data committed beside the audit's: `reach-gates-2026-09-27.json`, `reach-prereq-2026-09-27.json`, `attended-medium-2026-09-27.{txt,json}`, `guild-join-2026-09-27.json`, and the new reader `readers/guild-join.ts`.
