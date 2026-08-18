# Action Proposal — Nudge library completion (THR-1178)

## intent_quote

> a god who nudges the physics of the scene (a stumble, a spark, a surge of strength) is too specific. the god is a magical being of great power that manipulates the threads of reality in different ways based on what spheres they have. this means that while the physics of the scene is one way of nudging, it is not the only one that makes sense from a fantasy god power perspective. the current guidance over constraints the nudges. i think it would be interesting to have a nudge library, like we have an action library to help with this. a set of generic nudge types that unlock based on the sphere scores of the god. what would it take for our systems to pivot to this?

> yes please file and continue this work. check linear for already stages work around this,.

(Christian, chat, 2026-08-18. The second message approves filing and continuing after the assistant reported that the library already exists as THR-887's Repertoire and enumerated the four completion gaps.)

## scope (what this plan does)

Completes the shipped-but-hollow Repertoire: (A) rewords the "physics of the scene" authoring guidance to "influence, never authorship" with sphere-spanning examples across canon/skill/spec surfaces; (B) authors title+quote for every unauthored library member (predicate: `unauthoredCardCount()` → 0); (C) builds the card-type mechanics whose library status is not `impl` (nine at plan time), each through its named host system; (D) adds a sphere-attunement unlock channel — monotonic `essenceEarnedBySphere` counter + `sphere_attunement` unlock kind — that deepens families on top of the untouched identity-keyed access floor. Split across THR-1178 (A+B) and two tickets filed at handoff (C, D).

## scope (what this plan does NOT do — explicit non-goals)

- Does NOT deal hands from the repertoire (per-encounter authored hands stay; the dealt-hand pivot is recorded as future design, blocked on the per-band prose fragment problem and THR-1130's in-flight retrofit).
- Does NOT re-key base card access from sphere identity to scores — that is THR-870's parked pivot; this plan does not un-park it.
- Does NOT change the nudge model's core law: influence never authorship, fate rolls outcomes, no percentages on mortal-facing surfaces.
- Does NOT mint new image-library slots (THR-832 / THR-1170 own those gaps).
- Does NOT alter existing shipped hands or templates (all changes additive; NFP #6).

## impact_class

External — corrected upward from Reversible by the intent judge (2026-08-18 run): workstream A edits `.claude/skills/encounter-pipeline/SKILL.md` (+ agent prompts) and `.claude/skills/template-encounter-rewrite/SKILL.md` — skill edits that change other agents' behavior are External by the classification table. The engine/content halves remain additive and reversible; the mid-flight interaction (spec rewording vs THR-1130) is coordinated by mutex + land-A-first.

## evidence cited

- **Linear issue:** THR-1178 (plus C/D tickets filed at handoff; THR-887, THR-885, THR-883 as shipped substrate; THR-870 as the parked adjacent pivot; THR-1130 as the in-flight consumer of the spec)
- **Vision premises invoked:** sphere-governed direction (`Docs/plans/2026-07-30-sphere-governed-ascendant-decision-record.md`), variation-not-power progression (Repertoire plan Decision 7.2), generated-within-constraints
- **UL terms touched:** Nudge, rider, band fragment (existing); **new term "Sphere Attunement" → UL-proposal issue filed at handoff**
- **Canon pages consulted:** `Docs/canon/encounters.md` (carries the framing line being reworded), `Docs/canon/cosmology.md` (12-sphere roster via encounters canon)
- **Prior plan docs this builds on:** `Docs/plans/2026-07-30-nudge-card-repertoire.md`, `2026-07-26-nudge-model-encounter-system.md`, `2026-07-30-encounter-authoring-frameworks.md`
- **Rejected approaches considered and dismissed:** authored-futures model (stays rejected — rewording protects it); intel gating (Whisper explicitly must not filter candidates); essence-pool-as-score, static-affinity-as-score, full access re-key, per-type ticket spam (brainstorm companion)

## load-bearing decisions touched

- **Reaches and Spheres are orthogonal axes** — respected; the plan is sphere-side only, no reach changes.
- **Ascendants use the same prerequisite system as agents** — note: THR-870's decision record already recorded a sanctioned reversal-in-principle for the god's gating; this plan does not act on that reversal (identity floor unchanged, attunement additive).
- **Relationships are graph edges, not property fields** — the counter is a scalar tally keyed by sphere name (like `unlockedActionIds`), not a relationship; no edge dodged.
- **No inventing node types** — none invented.

## high-impact files touched (from Codesight)

- `src/types/gameState.ts` (345 importers) — one optional additive field. Blast Radius section present in the plan doc.
- `src/types/unifiedAction.ts` (278 importers) — conditional, only if Whisper needs a grant-vocabulary extension; additive optional fields only. Listed in Blast Radius.

## kill criteria

- If ≥2 of the nine C types cannot ship through their named host system without a parallel path, the hostSystem contract is wrong — stop, re-open the type table design rather than green-fielding.
- If attunement unlocks never fire in a 100-tick seeded playtest with active essence income (thresholds unreachable), the thresholds/counter placement is miscalibrated — retune constants before adding members.
- If the guidance rewording produces drafts the editorial critic rejects at a higher rate on trigger 14 (instruction-to-mortal), the widened wording blurred the law — revert to a tighter formulation that still spans spheres.

## explicit user sign-off

Not required (External class — sign-off required only for High-risk). Christian's "yes please file and continue this work" (2026-08-18, chat) is the filing authorization.

## author notes for the judge

The single most load-bearing judgment: treating this as *completion of THR-887* rather than a new system. If you read the plan as green-fielding a library, check `src/data/nudge-card-library.ts` first — the structure, sphere signatures, and unlock kinds all exist; the plan adds content, mechanics behind an existing status column, one counter, and one unlock kind. The second judgment worth scrutiny: scoping D to *deepening* rather than acting on Christian's literal "unlock based on the sphere scores" for base access — the literal reading collides with his own parked THR-870 sequencing, and the plan chooses the contained reading with an explicit veto invitation in the handoff summary.
