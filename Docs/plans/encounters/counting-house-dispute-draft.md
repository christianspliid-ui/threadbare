# Encounter Pipeline: The Counting-House Dispute
> Scale: short | Slug: counting-house-dispute | Pass: draft
> Date: 2026-09-29 | Pipeline version: 2.0
> Template: `encounter.town.counting_house_dispute` · batch journeyman-everyday-1, slot 4 (THR-1676)
> Package: `Docs/plans/encounters/counting-house-dispute.package.json` (dry-run clean; scratch `check:encounter` clean, 0 warnings)

## 1. Inspiration Anchors

- **Hook taken: `hook.masterwork_completion`** ("an artisan has finished something that should not be possible, and people are already arriving to see it"). Used as the *object* of the debt: the town's new weighing scales, finished last week, the whole market came to see them, and the founder's balance is unpaid. The hook gives the dispute a public stake and a creditor with a face without adding a third person on stage.
- Rolled and not taken: `hook.shifting_shape` (a transformation premise; no honest reading inside an everyday counting house), `hook.desperate_escort` (a journey premise; fights a single-room arbitration).
- Seed Dice honoured: p3 **opportunity** (rule, and be paid and owed) · opposition **law (duty)** — the contract's letter, which puts the balance on whichever house took delivery · disposition **neutral** (both houses agreed to the arbiter) · agentRole **judge asked to rule** (made real by the fork) · scale **personal**.
- Anti-patterns avoided: the helpful passerby (the agent was asked, and is paid); a good-vs-evil fork (both poles are defensible readings of the same books); a personal condition as the failure penalty (the brief's avoid-list).

## 2. Scale Justification

Short, two beats, `scale: 'local'`, rarityTier 2. One ruling in one room: the stakes are an arbiter's fee, a favour and a name at the magistrate's. A journeyman merchant should find this worth attempting and a novice should not be asked.

## 3. Pressure Knot

Houses Aldane and Corrow bought the scales together. The founder is unpaid. Each house's books blame the other, and the contract's letter (delivery taker pays) points at Corrow while the circumstance (Aldane's carter never came) points at Aldane. Both houses have already agreed to an arbiter before the agent walks in.

## 4. Intervention Fantasy

The god cannot rule for the mortal. It can put a wage list or an order book at their elbow, and in doing so lean *which way* the mortal reads the books: toward the house that can bear it (Mender) or toward the letter and the larger purse (Magnate). Then it can help the ruling hold.

## 5. Cast and World Objects

| Object | Binding | Role |
|---|---|---|
| `{cast:aldane}` | actor, reuse `merchant`, spawn "Brisa Tollan", must-persist | keeps House Aldane's books; debtor of the favour on the Magnate arm; loses standing on the Mender arm's failure |
| `{cast:corrow}` | actor, reuse `trader`, spawn "Oswin Marr", must-persist | keeps House Corrow's books; debtor of the favour on the Mender arm; loses standing on the Magnate arm's failure |
| Houses Aldane and Corrow, the founder, the scales, the magistrate | scene-local invention | named in prose only; no chip points at them |
| Letters of Introduction | `reward_tomes_scrolls_letters_of_introduction` | Corrow's fee (Mender arm) |
| Assessor's Weighted Scales | `reward_arms_assessors_weighted_scales` | Aldane's fee (Magnate arm) |

Distinct reuse roles keep one NPC from binding both factors. The factors are never gendered in prose.

## 6. Beat Structure

1. **Read the books** — Gold 0.42, `continue_weakened`. Two specials with opposite `poleLean`s + deal 4 (`insight`, `craft`).
2. **Make it hold** — Heart 0.40, `fail_action`, agent-decided fork on `asceticism_extravagance`. One special per arm + deal 4 (`social`, `presence`).

Mean difficulty 0.41 (brief row exact).

## 7. Branching Profile

- Branch depth: light · Branch count: 2
- Where branching lives: step-2 prose, cast emphasis, step-2 effects, aftermath variant.
- Convergence: none — the arms pay different fees, mint the favour on different debtors, and fail against different houses.
- Shape: Single Test → Personality Fork (`ActionStepBranch.decidedBy`, axis `asceticism_extravagance`, Gold's own pair). `aftermathConfig.branchOnStep: 0` names the deciding step.

## 8. Branching Map

- Step 1 lean `positive` (Mender) → rules for Corrow → Aldane must sign → success: Corrow pays in Letters of Introduction, `{cast:corrow}` owes a favour → failure: `reputation_with {cast:aldane}` −0.08.
- Step 1 lean `negative` (Magnate) → rules for Aldane → Corrow must sign → success: Aldane pays in Assessor's Weighted Scales, `{cast:aldane}` owes a favour → failure: `reputation_with {cast:corrow}` −0.08.
- The lean is the mortal's standing axis value plus the net `poleLean` of the step-0 cards the god committed (`Reveal The Cost` → positive, `Weigh The Purse` → negative).

## 9. Outcome Ladder

| Band | Progress | Spent | Opening / burden |
|---|---|---|---|
| critical_success | the ruling holds and is called fair aloud | nothing | fee + favour; a reaction choice: renown in the market (`reputation_with $here`) or the ledgers kept secret (`hidden_mark` secret_knowledge) |
| success | the ruling holds | a day's work | fee + favour |
| success_at_cost | the ruling holds | part of the fee (Mender) / a season's delay for the founder (Magnate) | fee + favour, told in the overview |
| failure | the ruling goes to the magistrate | the fee | the losing house thinks less of the arbiter |
| critical_failure | the losing house calls the arbiter bought in open market | the fee and the season's work in the counting house | same standing write, harder landing in prose |

## 10. Sample Opening

> {actor} arrives at the counting house of {location} at midmorning.
>
> Houses Aldane and Corrow bought the town's new weighing scales together. The founder finished them last week, and the whole market came to see them. Her balance is still unpaid. Each house's books say the other owes it.
>
> Both houses have agreed to let {actor} read the books and rule. The house that wins will pay the arbiter and owe a favour besides.

68 words.

## 11. The Hand Per Step

**Step 0 — Read the books** (deal 4: `insight`, `craft`)

| Card | Type | Sphere | Cost | Δ | Lean | Effect line | Fragments |
|---|---|---|---|---|---|---|---|
| Reveal The Cost | Kindled lean (pole card) | life | 2 | 0.08 | positive | Put House Corrow's wage list in front of them, open at this month. They will weigh the debt by who can bear it. | success, near_miss, failure |
| Weigh The Purse | pole card | matter | 2 | 0.08 | negative | Set House Aldane's full order book at their elbow. They will read the debt with an eye to who pays best afterwards. | critical_success, success, failure |

**Step 1 positive — Make it hold** (deal 4: `social`, `presence`)

| Recall The Missed Cart | Whisper | time | 2 | 0.12 | — | Make Aldane's factor remember the morning its own carter failed to come. The argument against paying gets harder to make. | success, near_miss, failure |

**Step 1 negative — Make it hold** (deal 4: `social`, `presence`)

| Steady The Debtor | Balm | mind | 2 | 0.12 | — | Calm Corrow's factor enough to hear the terms through to the end. A frightened house signs nothing. | success, near_miss, failure |

No over-exposed library card is authored. No rider, no cost channel, no grant on any special (the brief's single Heavy Hand is left for another slot). Sphere breadth and the ungated common option come from the fill.

## 12. Branch-Dependent Later Paragraphs

**Positive (Mender):**
> {actor} rules for House Corrow. Corrow's carts fetched the scales only because Aldane's carter never came, and the balance would break the smaller house. Aldane pays.
>
> {cast:aldane} keeps House Aldane's books and has not agreed to pay anything. {actor} has to bring Aldane to sign. A ruling nobody signs goes to the magistrate, with the arbiter's name on it.

**Negative (Magnate):**
> {actor} rules for House Aldane. The contract puts the balance on whichever house took delivery, and Corrow's carts took the scales. The letter is on Aldane's side, and so is the larger purse. Corrow pays.
>
> {cast:corrow} keeps House Corrow's books and says the balance will break the house. {actor} has to bring Corrow to sign. A ruling nobody signs goes to the magistrate, with the arbiter's name on it.

## 13. Aftermath Paragraph (positive / success)

> House Aldane paid the founder, and House Corrow kept its carts. Corrow had no coin to spare, so it paid the arbiter in letters to the houses it trades with.

## 14. Aftermath Reaction Choices

Critical success only, both arms: **Let the market hear who ruled** (`reputation_with` on `$here`, +0.08 — renown, the next quarrel comes to this door) vs **Let them keep both ledgers to themselves** (`hidden_mark` secret_knowledge on `$actor` — discretion, two houses' figures carried away unseen). Other bands: no reaction choices — consequence is clean.

## 15. Aftermath Kit Summary

- BOON · Letters of Introduction (Mender) / Assessor's Weighted Scales (Magnate) — `attachment_grant`, fork step success side.
- BOND · a favour owed — `favor_creation`, debtor `$cast:corrow` (Mender) / `$cast:aldane` (Magnate).
- SCAR · reputation with {target} — `reputation_with` −0.08 on the losing house's factor, fork step failure side.
- Every chip ≤15 words across cause + detail; nouns are sheet words; no noun anchored to a carrier.

## 16. Support Bundle Contract

| Support object | Delivery | Source | Persistence | Future references | Status |
|---|---|---|---|---|---|
| `aldane` factor | lazy-materialize-on-trigger | reuse `merchant` / spawn merchant | must-persist | favour debtor; reputation_with target | built |
| `corrow` factor | lazy-materialize-on-trigger | reuse `trader` / spawn trader | must-persist | favour debtor; reputation_with target | built |
| Letters of Introduction | granted template | `reward-attachment-catalog.ts` | must-persist | grants Patron's Backing on use | built |
| Assessor's Weighted Scales | granted template | `reward-attachment-catalog.ts` | must-persist | Gold capability while borne | built |

## 17. Self-Audit

- PASS — Composition Contract (scratch bundle of `scripts/check-encounter.ts` run against the package, consequenceDraw injected as the compiler stamps it): clean, 0 warnings; systems cast + rewards + reputation.
- PASS — consequence hand `possession` + `secret` wired (verified the draw check fails a wrong hand on the same bundle).
- PASS — difficulties 0.42 / 0.40 exactly as the brief; step reaches gold → heart; primary gold.
- PASS — everyday: `urban` only, no rule gate, `encounter.town.*` id.
- PASS — cool failure: money, standing, time; no condition on `$actor`.
- PASS — all ids live: both reward templates, `trait.core.core_integrity.virtue`, `ui.favour_owed`, `ui.reputation_with`, image tags, NPC roles `merchant`/`trader` at town/city/capital.
- FLAG (for Pass 2) — step 0 stages no named person (two houses only); each fork arm stages one factor.

## Experience Differentiator Gate

1 YES · 2 YES · 3 YES · 4 YES · 5 YES · 6 YES (essence on every special) · 7 YES · 8 YES (each special acts on a named ledger or factor) · 9 YES (pole leans answer *which way*; the step-1 cards answer *will it hold*) · 9b YES · 10 YES · 11 YES (named factors) · 11b YES (reaction page-overlap warning fixed) · 12 N/A (short scale; crit-success reactions offered anyway) · 13 YES (renown vs discretion) · 14 — art direction: two ledgers open side by side on a counting-house table, one column in each struck through; no people.
