---
domain: encounter-catalogs
last_reviewed: 2026-08-25
reviewer: claude-opus
ul_shards: [Encounters, Prose]
status: live
---

# Canon — Encounter Catalogs

> The design block picks one entry per catalog before any prose is written. Closed
> vocabularies beat on-the-fly invention: the AI structures better from a short list
> it must choose from than from an open field (Christian, 2026-07-31). The better the
> catalog, the more creative the encounters — creativity lives in the combination and
> the prose, never in inventing new structure per encounter.

**Owner:** THR-883 (the authoring format). **Extending any catalog is a design-session
decision with Christian**, recorded here — never an authoring-session judgement.
**Catalogs 1, 2 and 7 are rolled at brief time** by `npm run draw:packet` (THR-1245),
which transcribes them into dice in `src/data/content-eval/packetDice.ts` and enforces
their per-batch caps by construction; a face added here without a matching face there
fails that module's catalog-health check rather than going quietly unrollable.
**These catalogs are deliberately agile:** game systems are still moving, so entries
carry maturity flags rather than pretending the ground is settled.

**Companion idea bank:** `Design/research/quest-hooks/` — 1,200 tagged situations
(README documents the tag line and its measured gaps). A hook is a pre-rolled
combination across these catalogs plus a prose seed; the design block cites it as
`Hook: #NNN` or `Hook: original`.

## 1. Shape — structure (pick exactly one)

Authority: `nudge-authoring-spec.md` § the shape catalog. Single Test · Test &
Consequence · Puzzle–Investigation–Resolution · Danger–Confrontation–Aftermath ·
Personality Fork (THR-894; N-route form pending THR-898) · Opt-in Complication ·
**Seeded Sequel** (a parent's outcome plants a designed follow-up via
`encounter_seed` — templateId + delayTicks + inheritContext — with the sequel
authored alongside the parent; the sanctioned home for earned history).

## 2. Setting — where it fires (one or more classes)

Engine-enforced (THR-884, `src/data/settingClasses.ts`): `rural` `urban` `stronghold`
`sacred` `arcane` `ruin` `wayside` `battlefield`. One opening per declared class.
Known corpus gap: `stronghold` has zero hooks (tranche-2 target).

## 3. Pressure — what is squeezing (pick one, a second as undertone)

From the hook corpus, closed at 20: `hunger` `debt` `plague` `war` `feud` `grief`
`ambition` `faith` `secret` `love` `oath` `exile` `succession` `weather` `rumour`
`boredom` `shame` `duty` `fear` `greed`.

## 4. Form — the shape of the event (pick one)

From the hook corpus, closed at 40 (see `quest-hooks/README.md` § FORM for the full
list and the secret-vs-rumour distinction): `disappearance` `apparition` `discovery`
`arrival` `accusation` `bargain` `betrayal` `omen` `transformation` `siege`
`migration` `ritual` `theft` `contest` `birth` `death` `refusal` `return`
`infestation` `collapse` `secret` `rumour` `rescue` `escort` `research` `reveal`
`conceal` `restore` `inherit` `prove` `settle` `endure` `fulfil` `release`
`imprison` `hunt` `negotiate` `exchange` `spreading` `trailblaze`.

## 5. Objective — what the mortal is trying to do (pick one)

From the hook corpus, closed at 36, **rotated off the party onto the mortal inside
the situation** (see `quest-hooks/README.md` § OBJECTIVE for the full list and the
rotation notes): `avenge` `conceal` `cure` `depose` `destroy` `dispose` `elevate`
`endure` `enrich` `escape` `escort` `exchange` `fulfil` `gohome` `hunt` `imprison`
`inherit` `negotiate` `overthrow` `prevent` `protect` `prove` `recover` `refuse`
`release` `repay` `rescue` `research` `restore` `reveal` `sanctify` `settle`
`solve` `survive` `trailblaze` `unbind`.

## 6. Stakes — the reward/penalty shape (pick one; name the surface)

New, closed at 8. **Each entry names the system surface that mints it**, which makes
prose rule 7 structural — a reward cannot be narrated without the mechanism existing.

| Entry | Baseline / crit | System surface |
|---|---|---|
| `no-penalty` | avoid the penalty / one small boon | movement delay, tick stand-still, minus-to-move |
| `item` | keep or gain an object | attachment spawn (`spawn_artifact`, Cache) |
| `passage` | the road opens / opens early | movement, location gates |
| `relief` | a condition lifted | `remove_condition` (Balm targets) |
| `intel` | learn who / where / what | intelligence system, Whisper (UI pending) |
| `relationship` | a favor owed, an agent minted | favor edges, agent spawn (aftermath only) |
| `standing` | reputation with a group | faction reputation *(deferred tier — see § 7)* |
| `seed` | a future encounter planted | `encounter_seed`, `emit_omen` |

## 7. System — what the encounter exercises (pick one primary; maturity-gated)

New, closed at 14. **The vertical slice targets the mature tier only** (Christian,
2026-07-31): systems still being iterated are not load-bearing in new encounters —
they may appear as flavor, never as required mechanics. The tier of an entry moves
only by design-session decision as systems mature.

**Mature — target freely (the traveling-agent core):**

- `movement` — journeys, delays, passage; the tick/move economy
- `cards` — the nudge hand itself (riders, cost channels, pips)
- `traits` — gates, variants, trait-only cards; Core continua
- `conditions` — apply/lift (exhausted, wounded, …); Balm targets
- `items` — attachments held, gained, lost; item stat contributions
- `forks` — agent-decided branches (THR-894; N-route pending THR-898)
- `carryover` — step-to-step consequence (THR-892)

**Middling — use sparingly, one per batch at most:**

- `omens` — emission + draw bias (path live, few emitters)
- `favors` — favor edges consumed (`requiresFavor`) or minted (recently activated)
- `groups` — travel companies, Fellowship cards (`requiresGroup`)

**Deferred — do not build encounters on these yet:**

- `economy` — trade, scarcity, prices *(system immature)*
- `war` — armies, sieges, borders as mechanics *(story side immature)*
- `factions` — standing, rank, faction plots *(immature; `standing` stakes wait too)*
- `agent-magic` — mortal spellcraft, the arcane as mechanics *(immature; arcane as
  scene flavor is fine)*

Also not yet targetable: `ambitions` (reactive dispatcher new, unproven) and
`compulsion` (no dispatcher — THR-886 open).

**Connected-systems minimum (Christian, 2026-07-31):** the design block lists and
counts every system the encounter touches (personalized cast address, attribute-read
rewards, bespoke supporting content, conditions, items, seeds, …). Target **≥3 beyond
the core test**, warn-level; the critique pass reports the count. An encounter that
touches only its own step is a flat one.

## Coverage

The THR-884 coverage matrix counts settings × reach today. Extending it to count
these axes (shape, pressure, form, objective, stakes, system) is **deliberately
deferred** until the vertical slice validates the catalogs — wiring a generator to a
vocabulary that is still moving buys drift, not visibility. Revisit after the first
slice batch ships.

**What the coverage matrix now feeds (THR-1245).** The packet's setting die is
*gap-weighted* against those same settings × reach counts: a class the corpus barely
covers rolls up to six times likelier than the densest one, tapering linearly with
coverage. That is a pull, not a quota — the die still reaches covered classes, because
the corpus needs second scenes in good settings as much as first scenes in empty ones.
It also stops short of the deferred work above: nothing counts the finished encounter
against the axis it rolled, so shape/pressure/form/objective/stakes remain unmeasured
and the rolled axes remain *capped*, never binding.

## Open questions

- **The Iron rule** — the hook corpus's "force resolves instead of prolonging" rule
  left `iron` thinnest (52/1,200). Christian's verdict pending: correct rule, or
  Iron starvation?
- **Corpus tranche 2** — stronghold hooks, movement-first authoring, and a SYSTEMS
  column on the tag line (retro-tagging the 1,200). Queued behind the slice.

## Last-reviewed

2026-08-25 by Claude Opus (THR-1245 — catalogs 1, 2 and 7 are now rolled at brief time
by `draw:packet`; the setting die is gap-weighted against the THR-884 coverage counts.
No catalog entry, tier or rule changed).

2026-07-31 by Claude Fable (created — THR-883 catalog architecture, Christian's chat
approval; vertical-slice maturity tiers per his direction the same day).
