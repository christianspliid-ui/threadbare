# Action proposal — encounter story text, wave 2 (THR-2108, with THR-2128)

## intent_quote

> "we need the design lane to look at the quality of the story text in the encounters."
> — Christian, chat 2026-10-31 (quoted in THR-2105's description; THR-2108 is its filed follow-up)

THR-2108 description: "**Scope:** the next twenty board templates in `src/data/encounter-content.ts` by attended demand (re-measure with `readers/attended.ts 42,99 150` at pickup …), plus any of the seven templates missing at-cost/critical lines (festival_of_spheres, investigate_anomaly, dead_drop, tribute_exchange, vault_heist, master_craftsman_challenge, and the mason-lord wall) not already in that twenty. **Done when:** a plan doc for this wave in `Docs/plans/`, handed to Ready for Dev (design lane). Sequence after slice 1 ships and its cold read holds (slice 1 kill criterion 1)."

Orchestrator staging comment (2026-11-01): fold in the two calibration suggestions — let `stakes.lost` be rewritten together with the failure lines, and add a board exemplar for writer and critic.

## scope (what this plan does)

One plan doc, `Docs/plans/2026-11-02-thr-2108-encounter-story-text-wave-2.md`, in two executor slices: 2a (THR-2108) rewrites ten board templates (attended ranks 11–20 among those still on `RETROFIT_PENDING`, 253 of 1,690 encounters met), fixes slice 1's ten residue lines and names `assess_holdings` as the board exemplar; 2b (THR-2128, filed this run, blocked by 2a) rewrites the next ten plus three P5 templates (176 encounters met) and completes nine of them for `FIRED_TEMPLATE_COMPLETION`. A placement-safe arrival-line rule replaces slice 1's "all eight classes".

## scope (what this plan does NOT do — explicit non-goals)

- No change to Prose Doctrine v2 or to any writing check (THR-2106).
- No new cast, no new aftermath, no chip-wording change, no placement change.
- The Mason-Lord's Wall is left to THR-2110 (it is a P4 story beat in its own file).
- Four ranked templates already migrated off `RETROFIT_PENDING` (scout_the_perimeter, tend_to_wounds, offer_small_prayer, rest_and_reflect) are left to THR-2109.
- No engine or UI code.

## impact_class

Reversible — data strings and optional fields (`settings`, `openings`, `deal`) in 23 templates, list appends, one exemplar-index row.

## evidence cited

- **Linear issues:** THR-2108 (this), THR-2128 (2b, filed this run), THR-2105 completion + calibration comments, THR-2109, THR-2110
- **Measurements (this run, `main` @ `fea5ff53`):** `attended.ts 42,99 150` → 1,690 firings, 219 templates; `completion.ts` on the same census → per-template ladder/hand gaps; no aftermath on any of the 23
- **Code read:** `settingClasses.ts:57` (class map), `:173–208` (opening compile and canonical-first fallback), `:245–275` (`validateSettingEnvelope`: openings ⊆ `settings`); `encounter-content.ts:428` (placement = union of settings, locationTypes, sublocationTypes)
- **Vision premises invoked:** none changed. NFP 5.
- **UL terms touched:** none new (afterimage, dealt hand, deal declaration)
- **Canon pages consulted:** nudge-authoring-spec § Prose doctrine v2; `Docs/exemplars.md`; THR-1634 § What "complete" means
- **Prior plan docs:** slice 1 (`2026-10-31-thr-2105-…-slice-1.md`), THR-1634 plan
- **Rejected:** one slice of 23; three slices; all-eight-classes everywhere; narrowing `locationTypes`; no board exemplar

## load-bearing decisions touched

None. Placement is unchanged by construction and asserted per slice.

## high-impact files touched (from Codesight)

`src/data/encounter-content.ts`: 104 importers. Blast Radius section in the plan (string and optional fields only).

## kill criteria

Cold read failing after one round → stop, post findings, 2b waits for the design lane. Any firing count moving → revert that template's `settings`, step-0 lead instead. A veto of the board exemplar → drop the row, calibrate on the doctrine alone.
