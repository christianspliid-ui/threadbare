# Encounter Pipeline: The Spy in the Guildhall
> Scale: short (single test, `scale: 'local'`) | Slug: guildhall-spy | Pass: editorial (cold critic, THR-1757 master batch 2, slot 5)
> Date: 2026-10-14 | Pipeline version: 3.0
> Judged artifact: `Docs/plans/encounters/guildhall-spy.package.json` (the package ships; the revised doc is context)

## Verdict: PASS WITH REVISIONS

The encounter is sound: one clear crux, one test, a hand that acts on objects the prose sets up (the sleepers at the inn, the councillors' answers), and a success side whose stake (the Consortium takes in whoever names the spy) is written by a real effect. The revisions are page-level: three overviews repeated, contradicted or invented facts, the near-miss band rendered a clean-success afterimage over a cost aftermath, and one band's reactions disagreed with that band's overview. All fixes have been applied to the package.

## Brief conformance (binding row, slot 5)

| Field | Brief | Package | OK |
|---|---|---|---|
| id | `encounter.town.guildhall_spy` | same | ✓ |
| reach | shadow | shadow | ✓ |
| steps | shadow 0.78 (single test) | one step, shadow 0.78, `fail_action` | ✓ (inside 0.72–0.85) |
| shape | single test | single test, linear | ✓ |
| settings | `urban` | `["urban"]`, one opening | ✓ |
| rarity / scale / tier | 2 / local / shaping | 2 / local / shaping | ✓ |
| consequence hand | `story_seed` + `membership` | `encounter_seed` query `#consortium_errand` + `membership_change` join `merchant_consortium`, both on the success side | ✓ wired in context |
| Heavy Hand | slot 5 may take it | not taken | ✓ |
| over-exposed cards | no `card.boost.core` special, no darkness Undertow | neither | ✓ |

## 1. Prose quality

Opening (urban) and spine are narrator mode, 73 words, real roles, stake stated plainly in P3 ("The Merchant Consortium will take in whoever does it."). No interior sensation, no camera work. Afterimages are short and concrete (letters sewn into the minute book; the hand in the minutes matched to a letter).

Weak passages found (all fixed):

- **Failure overview** — "{location} sent for a master and still does not know who the spy is." Two problems: the opening never shows the town *sending for* anyone (the warden sits down at the inn table — rule 31, a summons asserted in narration that the scene did not stage), and "a master" is the difficulty band leaking into player prose.
  `[EDITORIAL REWRITE]` "The vote to close the gates failed by the spy's own vote. {location} asked {actor} for a name and never got one."
- **Critical-failure overview** — same "sent for a master" leak.
  `[EDITORIAL REWRITE]` "The council spent the sitting on the wrong name, and the gates stay open to the rival city. {location} asked {actor} for the spy and was handed an honest councillor instead."

## 2–4. Branch seduction / branch count / scale

Linear, branch count 0 — correct for a single test. KEEP 0. Scale is honest: one beat, compact aftermath, reaction pair on the success side.

## 5. Inspiration anchor honesty

`hook.stranger_bargain` survives as the shape of the offer: a stranger is asked to clean the house and is paid with a place in it. `stronghold_mobilization` survives as the gate vote. Honest.

## 6. Aftermath payoff

Actor-centred: the mortal joins a named faction, the warden's regard moves on the reaction, the town's regard drops on failure. The success-at-cost band is the weak spot (see § 6b and the author's question below).

### The author's question — is the success_at_cost cost honest? (rules 31 / 34)

The engine has no band-keyed step write: `successMetadata` fires on `success`, `success_at_cost`, `critical_success` **and `near_miss`** (`isStepSuccess`), and `computeFinalActionOutcome` routes `near_miss` to the `success_at_cost` aftermath band. So the cost can only live in prose. The test is whether that prose promises state the engine never writes.

- **As authored: not fully honest.** The overview read "Every councillor now knows who was asking questions at the inn." That is a standing on the mortal (exposed, known to the council) — rule 31's "standing between the agent and the world" — with no write behind it and no reader downstream. It reads as a consequence the player will expect to see again, and they never will.
- **The afterimage's cost is honest:** "The spy heard of it and fled the town." The spy is a role noun with no graph object; fleeing is a scene fact that closes inside the scene and promises no later behaviour (rule 34 clean).
- **Fix applied:** the overview now states only the scene-closed cost — "The council voted to close the gates to the rival city, with its spy gone and nobody held for it." — and no chip claims a cost. The cost is real *in the fiction* (the spy got away; nobody answers for the betrayal) and claims nothing on the sheet. Thin, but honest. This is recorded in the doc block's Accepted limits.

## 6b. Page read (every band, assembled)

**critical_success** (as authored)
> The council voted to close the gates to the rival city. {cast:warden} told the inner council who found the spy.
> - BOND · a guild membership — Vouched for by {cast:warden}. {actor} is on the rolls of the Merchant Consortium now.
> - PATH · seed — Word of the spy reaches the Merchant Consortium, which has work for {actor}.
> > Name the spy in open hall / Keep the name inside the council

**Repetition:** "{cast:warden} told the inner council who found the spy" and "Vouched for by {cast:warden}" are the same fact told twice (paraphrase; invisible to the `[page]` check). REVISE (trigger 35) → fixed: overview now "…once the letters were read to the inner council." — it carries the crit's own fact (the letters from the crit afterimage), and the warden appears once, in the chip.

**success** — reads clean. Overview (gates closed, spy held) → chip (taken in, vouched) → seed → reactions. No repetition, no conflict.

**success_at_cost** (as authored)
> The council voted to close the gates. Every councillor now knows who was asking questions at the inn.
> - BOND · a guild membership — Vouched for by {cast:warden}. {actor} is on the rolls…
> - PATH · seed — …
> > Name the spy in open hall — "The whole council hears who betrayed it…"
> > Keep the name inside the council — "Only the inner council keeps the name…"

**Conflict:** the overview says the whole council already knows who was asking; the spy has fled the town (afterimage); the reaction "Only the inner council keeps the name" contradicts both. REVISE → fixed: overview rewritten (above); intents rewritten — "The whole council hears who fled and why…" / "The town hears only that a councillor has left…". Effects unchanged.

**Near-miss seam (found while reading the band):** a `near_miss` step renders `successAfterimage` ("matched the hand in the minutes…", a clean win) and then lands in the `success_at_cost` aftermath. Fixed with a `nearMissAfterimage`: "{actor} named the keeper of the minutes as the bell was ringing. The spy was out of the hall before the watch reached the door." — consistent with the success_at_cost overview without repeating its words.

**failure** — after fix: overview (the spy's vote carried it; the town got no name) → chip "Not Trusted — {location} thinks less of {actor} now." Clean: the overview carries the event, the chip the standing.

**critical_failure** — after fix: overview (wrong name, gates open, an honest councillor handed over) → chip "Named Wrongly — {location} thinks less of {actor} now." Clean.

## 7. Dilemma energy

The reaction pair is a real stance split — publicity (the town's regard, at the warden's cost) against discretion (the warden's regard). The hand's question is distinct per card: the dream works on the guilty sleeper, the trait card works on the mortal's own manner.

## 8. Experience Differentiator Gate

| # | Question | Answer | Evidence |
|---|---|---|---|
| 1 | Narrator-mode skeleton, ≤80 words | YES | arrival (inn, warden sits down) · situation (vote, spy) · problem (name them quietly; the Consortium's offer); 73 words |
| 2 | Every sentence works | YES | no atmosphere-only sentence |
| 3 | Scene names what the hand acts on | YES | the councillors at the inn (dream's sleepers; the trait card's questions) |
| 4 | Retellable after one read | YES | "name the spy before the vote, quietly" |
| 4b | No seam echoes | YES (after fix) | opening→spine clean; near-miss afterimage→cost overview now share no image |
| 5 | Spell-style faces, no scene prose | YES | Send A Guilty Dream; Show An Honest Face |
| 6 | Mechanism effect lines, real prices | YES | dream at essence 2; trait card at 0 (trait-gated) |
| 7 | Every card pays off in failure | YES | both cards author `failure`; dream authors both failure bands |
| 8 | Card targets established in prose | YES | sleepers at the inn the councillors drink at; the councillors |
| 9 | Different questions | YES | the guilty party's tell vs the mortal's candour |
| 9b | 4–8 composed hand, no branch pick | YES | 1–2 specials + deal 3 (gate verified) |
| 10 | Reflective aftermath | YES | |
| 11 | Actor-centred, sheet-word chip nouns | YES (after fix) | `a membership` (tooltip `ui.faction_member`, as inheritance-wake), `seed`, `reputation with {location}` |
| 11b | Every band's page reads clean | YES (after fix) | § 6b |
| 12 | Reaction choices | YES | success side, three bands |
| 13 | Philosophical stances | YES | publicity vs discretion |
| 14 | Evocative art direction | YES | revised doc § Concept art: residue (the minute book's slit cover), not the action |

## 9. Verdict

**PASS WITH REVISIONS.**

## 10. Fix-list (all applied to the package)

1. critical_success overview — removed the warden-told-the-council paraphrase of the chip; now names the letters.
2. success_at_cost overview — removed the unbacked standing ("every councillor now knows who was asking"); states the scene-closed cost (spy gone, nobody held).
3. success_at_cost reaction intents — rewritten to agree with a spy who has fled; effects unchanged; "the mortal" → `{actor}`.
4. `nearMissAfterimage` added so a near-miss no longer renders a clean-win afterimage over the cost aftermath.
5. failure overview — "sent for a master" (unstaged summons + band label) → "asked {actor} for a name and never got one".
6. critical_failure overview — same fix.
7. membership chip noun `a guild membership` → `a membership` + `tooltipId: ui.faction_member` (corpus precedent, inheritance-wake).
8. seed chip concept re-anchored from `$actor` to `$faction:merchant_consortium` — the object the sentence actually names.
9. doc block Accepted limits updated (near-miss routing; the cost ruling).
