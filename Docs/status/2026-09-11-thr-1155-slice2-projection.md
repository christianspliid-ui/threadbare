# THR-1155 slice 2, step 2 — the political map moves

**Date:** 2026-09-11 · **Ticket:** THR-1155 (stays In Dev; `Fixes` rides slice 3) ·
**Plan:** `Docs/plans/2026-09-10-thr-1155-realms-and-areas.md` § Engine C

## Current focus

The red border on the map used to come from `RegionData.hexDomainId` — a per-hex
political stamp written once at worldgen. Its defect was not that it was wrong; it was
that it **could not move**. A nation's extent on screen was a picture of a decision taken
before tick 0, and no runtime writer of a faction `controls` edge could have changed it
even if one had existed.

It is a projection now. `buildRealmProjection(graph, tiles)` gives each hex to the Realm
holding the nearest town within `REALM_FILL_RADIUS` (3) and to **nobody** beyond that, so
wilderness is real rather than an artefact of where a culture region happened to be drawn.
`SimulationRuntime` owns exactly one of them (`ensureRealmProjection`, the
`ensureEncounterCache` pattern), and the setter-less `useState(regionData)` the renderer
kept is gone. Three layers changed their source and kept their geometry: `BorderMesh`
(one tier now — the province lines are **deleted**, not hidden), `CapitalMarkers` (a dot
on each Realm's seat), and the label tier, which is `realm · area · river` where it was
`domain · province · geographic · river`.

**And a belt, because participation is not an assumption.** `ensureRealmProjection` keeps
a fingerprint of the faction-sourced `controls` edges and rebuilds on a change even when
`structuralCacheVersion` matches, emitting `realm_projection_rebuilt` with
`reason: 'fingerprint'`. A writer that forgets `touchStructure` is named in the trace
rather than leaving the map quietly stale — which would have been indistinguishable from
the world this step replaces. A mortal's `controlType: 'strategic'` stance deliberately
does not move that fingerprint (THR-1448 owns what a hold inside a Realm means), so
taking a stance never rebuilds the border.

## What it measures

On a generated seed-42 medium world, three Realms claim 375 of 768 tiles — 180 / 60 / 135
hexes from 17 / 10 / 6 held towns — with 393 unclaimed (water and wilderness together; the
count is every tile no Realm claims, not a measure of land). Retargeting one `controls`
edge (`loc_10`, faction_1 → faction_0) and bumping moved **17 hexes of border** on the next
read: 60 → 43 against 180 → 197, with `builtAt` advancing 0 → 1. That is the first time the
political map has ever moved.

## One defect fixed on the way

`stampRealmSeat` cleared a stale seat through `graph.updateEdge`, which **merges**
properties (`graph.ts:208`), so `delete properties.role` was undone on the way in. A
re-seated Realm therefore carried `role: 'seat'` on two `controls` edges and the projection
reported whichever edge order visited last. Cleared in place now, as
`phaseSchismResolution` does for its own keys, with a test that re-seats onto a city and
asserts exactly one seat edge. Logged as impediment #1013 — the merge semantics are correct
and documented, but nothing warned the one caller that needed removal.

It also fixed a pre-existing miss it sat next to: `LocationLabelOverlay`'s collision shim
returned `'barony'`, a label tier that had not existed in the union for some time, so a
capital's label carried no collision priority at all.

## A finding for the conquest step

Retargeting a `controls` edge carries its `role: 'seat'` property with it, so a victor that
seizes the loser's *capital* inherits the seat and the loser is left with none. That is
visible in the measurement above: faction_0's seat became `loc_10` and faction_1's went
`null`. The projection reporting a seatless Realm is correct fail-soft behaviour, but
`applyConquestOrVacuum` (slice 2 step 3) must re-stamp both sides through `stampRealmSeat`
or a conquest will move a court it never meant to.

## Not done here

Conquest itself, realm membership (`member_of`, without which no Realm can field an army),
and the census/faction-sheet lines — steps 3–5 of slice 2. `Fixes THR-1155` rides slice 3,
as the handoff specified.
