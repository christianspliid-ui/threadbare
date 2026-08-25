# The batch brief — Stage 0 of the Encounter Factory

**Source:** `Docs/plans/2026-08-08-encounter-factory-workflow.md` §2 Stage 0, plus ruling 1 (batch of 6) and ruling 2 (briefs are agent-drafted, Christian-approved in chat). Shipped by THR-1047.

A brief is the one place a human steers **what gets made**. Everything downstream of it — draft, critics, gates, live proof — steers *how well*. So a brief is short enough to read in two minutes and specific enough that two different authoring runs against it produce recognisably the same batch.

## The rule that shapes the whole document

**A brief names variance, not content.** It does not describe six encounters; it describes the *spread* the six must cover — reaches, shapes, tones, settings — and lets the draft agent find the fiction inside that spread. A brief that specifies the encounters has moved the authoring into the brief, where none of the gates can see it, and the batch report's variance table then reports a variance the brief already fixed.

## Format

Copy this skeleton. Every heading is required; an empty one is a decision nobody made.

```markdown
# Batch brief — <slug> (<N> encounters)

**Drafted:** <agent, date> · **Approved:** <pending | Christian, chat, date>

## Why this batch

One paragraph: what gap in the corpus this fills, and what the player gets that
they do not get today. If this paragraph is about the pipeline rather than the
player, the batch is not ready to run.

## Family and setting envelope

- **Family:** `encounter.<family>.*`
- **Setting classes:** <the envelope classes each encounter must author an opening for>
- **Excluded:** <settings this batch deliberately does not enter, and why>

## Variance targets

| Axis | Target across the batch |
|---|---|
| Reach spread | <e.g. no reach more than twice across 6> |
| Decision shapes | <from the roster: single test / consequence chain / fork / opt-in / sequel> |
| Tone | <e.g. at most two that resolve grim> |
| Step counts | <e.g. two 1-step, three 2-step, one 3-step> |
| Setting class | no class more than twice (packet die C; gap-weighted toward thin classes) |
| System target | ≤1 middling-maturity system, 0 deferred (packet die D) |
| P3 stake shapes | no shape more than twice (spec § The Seed Dice, die 1) |
| Opposition | no opposition kind more than twice (die 2) |
| Disposition | not everything hostile (die 3 floor) |
| Agent's role | no role more than twice (die 4) |
| Scale | ≥1 settlement-or-larger (die 5 floor) |

## Rolled constraints (per slot)

One block per encounter slot, rolled at brief time, recorded here so the batch report
can print `hook → shape → role` per encounter and coverage stays measurable.

**Roll the whole batch in one command** (THR-1245) and paste its output block here:

```bash
npm run draw:packet -- <briefSlug> --slots <N>
```

It rolls each slot's hooks and Seed Dice *and* the four capped axes nothing used to
roll — reach, decision shape, setting class, system target — enforcing every cap and
floor by construction, then prints exactly this block plus the spread table for the
Variance-targets section above. Deterministic off the brief slug, so anyone can
recompute it. Single slot: `npm run draw:hooks`.

```
slot 1:
  plotHookRolled: <three ids>   plotHookTaken: <id>
  reach: <die A>                setting: <die C>
  shape: <die B>                system: <die D>
  p3Shape: <die 1>              opposition: <die 2, with motive>
  disposition: <die 3 or n/a>   agentRole: <die 4>
  scale: <die 5>
  consequenceHand: <binding — printed when the slot has a template id>
```

Rolls propose, design disposes — a slot may override a roll, stated with a reason.
The variance caps above bind the batch either way. `draw:packet` prints each override
it made itself, naming the face the unconstrained table rolled and the cap that bit.

## Systems quota targets

Contract floor is 3 (`COMPOSITION_SYSTEMS_QUOTA_MIN`). Name which systems this
batch should reach for, and which it should *avoid* leaning on so the corpus does
not converge:

- **Reach for:** <e.g. seeds, factions — under-represented today>
- **Avoid defaulting to:** <e.g. conditions — already on most of the corpus>

## Anchors this batch intends to touch

Which **world objects** the batch's chips should connect to. Name anchor
*kinds* from [`anchor-catalog.generated.md`](anchor-catalog.generated.md), not
specific instances — the draft agent picks the instance, the brief picks the
spread, same as every other axis here.

| Anchor kind | Target across the batch |
|---|---|
| `<e.g. faction>` | <e.g. at least two encounters leave a standing change> |
| `<e.g. relationship / bond>` | <e.g. one mints a reified bond> |

**Avoid defaulting to:** <the anchor kinds the corpus already leans on>

## Over-exposed cards

Read `cardPlayTally` telemetry and list the library cards the corpus already
leans on. New hands must diversify away from these — this is the whole reason the
brief reads telemetry rather than guessing.

| Card | Times authored | Instruction |
|---|---|---|
| `<cardId>` | <n> | avoid / at most once across the batch |

## Out of scope

What this batch is explicitly not doing, so a critic does not ask for it.
```

## Why the brief names anchors (THR-1154)

Christian's ruling, 2026-08-17: *"the choice of prose when generated must take into account that they generate interesting chips and connections into the gamestate."*

The causality is the whole point of putting anchors in the **brief** rather than leaving them to the draft. Chips bolted onto finished prose are chips written to fit sentences that were never aiming at the world — which is how The Unsafe Bridge ended up with a `PATH` chip about a river that is not a game object and is usually not even on the hex the encounter spawned on. Naming the anchor kinds up front makes the prose get written *toward* them.

It also gives the Package critic (Pass 3b) something to judge the batch against, not merely each encounter in isolation: a batch whose six encounters all anchor to the same kind is a spread failure the per-encounter passes cannot see.

Name **kinds**, never instances — same rule as every other axis in this document. A brief that names the faction has authored the encounter.

**Do not name the `nation` anchor** — it does not exist. There is no nation node type and no border model; territory is expressed as faction control over locations. Anchor the faction that holds the ground instead. The catalog's gap table carries the current verdict and the ticket tracking it.

## How the brief is used

1. **Drafted by an agent**, from `cardPlayTally`, the corpus census, and the ticket that asked for a batch.
2. **Approved by Christian in chat** (ruling 2), in plain language, with the brief itself linked (Rule Zero). Approval is the gate — a batch does not run on an unapproved brief.
3. **Injected verbatim** into Stage 1's draft prompt, as the constraint set. The draft agent fills the spread; it does not renegotiate it.
4. **Named in the batch report** (`--brief <path>`), so a reviewer reading the report can see what the batch was *asked* for before judging what it produced.

## Where briefs live

`Docs/plans/encounters/<slug>-brief.md`, beside that batch's other pipeline artifacts. They are committed — a brief is the record of what was asked for, and a batch whose brief was never written down cannot be reviewed against its own intent.
