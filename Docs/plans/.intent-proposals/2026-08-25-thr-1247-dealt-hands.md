# Action Proposal — Dealt hands (THR-1247)

## intent_quote

> i think it would be interesting to have a nudge library, like we have an action library to help with this. a set of generic nudge types that unlock based on the sphere scores of the god. what would it take for our systems to pivot to this?

(Christian, chat, 2026-08-18 — the originating direction; the library-completion prerequisites shipped as THR-1178/1179/1180.)

> are we ready for that now?

> ok lets try

(Christian, chat, 2026-08-24/25 — "that" = the dealt-from-repertoire hands pivot, which the assistant's answer to the first message defined verbatim as: "run the design session now, with two constraints baked in — the landing is **hybrid** (dealt generics + one or two encounter-authored specials, so nothing in THR-1130's batches is wasted work), and the implementation sequences after or alongside the remaining retrofit batches rather than under them." The "ok lets try" approves exactly that.)

## scope (what this plan does)

Designs the dealt-hand pivot: per-member **play profiles** (mechanics as data) and **band fragments** (payoff-at-every-band, authored library-side) join the existing `CARD_CONTENT` table; a pure zero-PRNG **dealer** (`dealHand` + `mintDealtNudge`) fills a step's declared `deal` count from the god's repertoire on top of 0–2 encounter-authored specials; composed hands are gate-validated; provenance renders on the card explain surface. Split at handoff into an engine ticket (schema + dealer + gate + 2 reference profiles) and a content ticket (full corpus + spec/pipeline updates + one reference encounter).

## scope (what this plan does NOT do — explicit non-goals)

- Does NOT change any shipped encounter (dealing is opt-in per step; absent ⇒ byte-identical).
- Does NOT remove authored hands as a form, or the encounter-specific special card.
- Does NOT introduce PRNG into hand assembly (WS0 zero-rng preserved; named kill criterion).
- Does NOT touch the nudge law (influence never authorship; fate rolls; words never numbers).
- Does NOT rewrite THR-1130's retrofitted hands; remaining batches may opt in per batch brief.
- Does NOT special-case dealt cards downstream of assembly — a minted card is an ordinary `StepNudge`.

## impact_class

External — the content ticket edits agent-facing authoring surfaces (`nudge-authoring-spec.md`, `encounter-pipeline` SKILL, compiled `Docs/authoring-brief.md`) that change the factory lane's and THR-1130's behavior. Engine half is additive/reversible.

## evidence cited

- **Linear issue:** THR-1247 (prerequisites THR-1178/1179/1180 all Done, verified 2026-08-24; THR-1130 In Dev, coordinated by mutex)
- **Vision premises invoked:** north-star intervention menu; roguelite repertoire progression; generated-within-constraints
- **UL terms touched:** Nudge, rider, band fragment, Repertoire, Sphere Attunement (all existing/settled). New authoring nouns "play profile", "dealt hand", "deal declaration" → flagged for a UL-proposal filed at handoff
- **Canon pages consulted:** `Docs/canon/encounters.md` (nudge model, band-fragment terminology, WS5 state), systems-inventory (substrate table in plan)
- **Prior plan docs this builds on:** `2026-08-18-thr-1178-nudge-library-completion.md` (this pivot is its recorded next-design), `2026-07-30-nudge-card-repertoire.md` (Decision 6 deal-time binding, Decision 7.2 variation-not-power), `2026-07-30-encounter-authoring-frameworks.md`
- **Rejected approaches considered and dismissed:** fixed action count (the dealer clamps to the existing open window, no cap reintroduced); pure LLM prose (fragments are authored); choosing endings (untouched); brainstorm companion lists six architectural dismissals

## load-bearing decisions touched

- **Additive over destructive** — the entire declaration/minting design is built on the opt-in field.
- **Everything is a graph node/edge** — nothing persisted; dealt cards transient, dispatch writes via host systems.
- **No inventing node types** — none.
- **Rejected "fixed action count / capped action slots"** — explicitly re-fenced: the dealer fills within the existing 4–8 window and its constraints; it does not reintroduce a fixed count.

## high-impact files touched (from Codesight)

- `src/types/unifiedAction.ts` (~278 importers) — one optional `ActionStep.deal` field. Blast Radius section present.

## kill criteria

In the plan doc (§ Kill criteria): convergent-hands measurability via the TSV `dealt` column; seam-echo retreat to per-type-fragments-with-inserts; statically-unverifiable `deal` declaration re-opens the schema.

## explicit user sign-off

Not required (External class — sign-off required only for High-risk). "ok lets try" (2026-08-25, chat) authorizes the design session per the quoted definition of "that".

## author notes for the judge

The judgment most worth scrutiny: interpreting "ok lets try" as approval for the *hybrid, sequenced* version — the message approves the assistant's immediately preceding recommendation, quoted verbatim in intent_quote, so the constraints are part of what was approved rather than author-added scope. Second: the no-new-trace call (assembly runs on the render path; purity carries replayability) — inspectability is served by the `__DEBUG` deal report and TSV column, and the precedent is `buildRepertoire` itself. Third: profiles/fragments as per-member tables is the expensive-content path chosen deliberately over cheap per-type defaults; the retreat design is named in kill criteria rather than hedged into scope.
