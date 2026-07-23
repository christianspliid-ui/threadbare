# Simulation Coupling Assessment — opportunities, method, and the player-loop chain

**Date:** 2026-07-23 · **Session:** Fable design session (interactive, user-directed)
**Status:** current — analysis document (not a feature plan; the groomed tickets carry the features)
**Companions:** `Docs/canon/interface-map.md` (protocol home), `Docs/plans/2026-07-23-system-interface-map.md` (framework), wiki page `public/system-interface-map-reference.html`

## Purpose

Records the full-system architectural assessment of 2026-07-23 — where the simulation's
systems should be connected but aren't — and, more importantly, **the analytical method**
that future design work must repeat before sending solutions to dev. Three tickets were
groomed from this assessment; the method outlived them and is codified in the interface-map
canon protocol.

## The validation ladder (run these passes, in order, on any coupling/feature design)

1. **Existence sweep.** Does the substrate already exist? Grep `Docs/canon/systems-inventory.md`
   (generated) + `src/engine/` for the premise's nouns and synonyms; check the DORMANT badges;
   check the pre-Linear backlog (`.planning/BACKLOG_HISTORY.md`) and the Linear archive for
   shipped-then-forgotten work. (Design-governance Step 0.6. This session: the war-style
   dormancy of Secrets & Favors, and the already-authored economic/secret/exodus verbs, were
   all found this way — a green-field design would have rebuilt all of them.)
2. **Coupling asymmetry check.** For the systems touched: who writes the state, who reads it,
   at design level? A system whose output has no production consumer (cultural tension), or a
   consumer with fewer inputs than the world offers (migration's flat 2% coin flip), is an
   opportunity — or a leak. (Step 0.7 / interface-map contract rows.)
3. **Player-loop chain check.** For anything with player verbs, validate the four-link chain —
   **verb authored → verb reachable → effect wired → world visibly responds** — see the
   binding rule in `Docs/canon/interface-map.md` § protocol. A design that strengthens
   simulation without closing this chain produces background richness the player never
   touches; a verb without a world response produces a button that lies.
4. **Fun framing.** State, in game terms, what the *player does* and what they *watch happen*
   through the existing surfaces (action cards, encounter choices, aftermath reactions,
   beats) before proposing any new surface. New UI is a last resort; the surfaces exist.

## Evidence found this session (grep/runtime-verified 2026-07-23)

- **Secrets & Favors:** engine wired (`phaseSecretsFavors`, `secretGeneration`,
  `secretsConsequences`, `socialLeverage`) yet DORMANT in the 120-tick probe — and its player
  verbs `action.secrets.plant_secret` / `action.secrets.reveal_secret` are authored but in no
  beat's grants → unreachable by construction (THR-613/THR-501 progression architecture).
  Broken at chain links 2 and 4.
- **Economy:** `loc.bless_harvest`, `loc.blight`, `loc.open_markets`, `loc.reveal_vein` are
  granted and playable — but `encounterScoring.ts` contains **zero** prosperity/economic
  terms, so the world never answers economically in scenes. Broken at link 4 only. (Contrast:
  war→economy is well-coupled — `battleAftermath.ts` hits prosperity, trade, settlement tier
  and spawns refugee encounters; use it as the pattern.)
- **Migration:** flat `MIGRATION_CHANCE = 0.02` per tick — blind to war, prosperity, unrest,
  culture. `hex.incite_exodus` authored but not beat-granted; `loc.guide_caravan` reachable.
- **Culture:** shapes agents at birth + prose context (`contextBuilder`), but
  `culturalTension` output has no production consumer and culture appears nowhere in
  encounter scoring, faction behavior, or war.
- **Ambitions:** the model coupling (assignment → progress → scoring bias → motive-receipt
  legibility, all live) — but assignment reads only the agent's own snapshot; the world never
  mints wants from events.
- **Healthy already:** reputation → scoring (THR-641), intel → scoring (`INTEL_SCORING_BONUS`),
  omen bias → scoring, war → economy.

## The seven opportunities, final verdicts (player-lens)

| # | Opportunity | Player interaction | Verdict |
|---|---|---|---|
| 1 | **Secrets & Favors activation** | Surface-native: hold a secret → reveal / bury / plant via existing (orphaned) cards + encounter choices | **Groomed → ticket.** Top priority: two wiring fixes light an entire built system |
| 2 | **Economy → scenes** | No new UI: pays off four cards the player already holds with visible story response | **Groomed → ticket.** Cheapest fun per effort on the list |
| 3 | **World-reactive ambitions** | Consequence multiplier for every existing verb; legibility free via motive receipts | **Groomed → ticket** |
| 4 | Pressure-driven migration | Ambient = read-only map storytelling; the exodus arc = future flagship beat | Ambient rides ticket #2 as a stated stretch/deferral; exodus arc is its own future design |
| 5 | Cultural tension consumers | Indirect (stage-setting, war legibility); no culture verbs exist and none warranted yet | Defer; surface via omens when built |
| 6 | Item theft / loss conditions | Witnessed, not played | Fold into THR-719 (loss conditions as effect primitives); no separate initiative |
| 7 | Information warfare vs rivals | Counter-intel duel layer | Parked behind #1 — requires living secrets |

## Rules adopted (where they now live)

- **Player-loop chain** is protocol rule 6 in `Docs/canon/interface-map.md` (§ Interface
  stewardship protocol) — contract audits of player-verb systems register each chain link as
  its own row **in `scripts/interface-contracts.ts`** (the registry shipped with THR-717,
  Done 2026-07-23, PR #754 — CLAUDE.md Step 0.7 + the lint check are live); a break at any
  link is a leak with a `deferralTicket`, enforced by the generator's CI ratchet.
- The reachability link is mechanically checkable today via
  `window.__DEBUG.listUnreachableActions()` (THR-659); cite its output in audits.

## Groomed tickets

Created 2026-07-23, all in Todo pending their own three-pillar plan docs: see the Linear
issues referencing this document (secrets activation · economy answers the god ·
world-minted ambitions). Each must run the validation ladder above in its design pass and
register its interface + player-loop rows per Step 0.7.
