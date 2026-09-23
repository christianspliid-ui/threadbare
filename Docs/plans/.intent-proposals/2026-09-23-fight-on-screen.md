# Action Proposal — the fight on screen (Physical Conflict plan doc 4 of 6)

## intent_quote

Christian, chat, 2026-09-23. On the research into combat systems:

> what would look cool in game? what would be worth following for the player or at least observing? what would fit our systems best? what would best connect to our other systems for players to interact with?

His direction:

> the learnings and direction here is good, make sure we also are prepared to integrate spells when we get those up and running. this is a large design as far as i can see at the level of encounters and undertakings?

His delegation for the night:

> well i am going to bed. you have tons of tokens and time all night to work on this map, you have free roam to take the feature as far as you can design wise. also you can move elements of it into ready for dev so there is enough for our execution agent to work on tonight also. see you tomorrow

## scope (what this plan does)

Puts fights on screen under the UI Laws, in four slices:
- **F1:**
  - fixes two live defects: the lair sidebar's raw monster id, and `WorldPulse` counting monsters;
  - adds a monster `EntityVisual` kind.
- **F2:** an opponent header in the encounter veil, on fight steps only. It carries:
  - the portrait;
  - the clickable name;
  - Dread and Might as words, and the temper word once seen;
  - clock pips on the existing `StepDots` magnitude variant, plus a clock-state word;
  - step labels.
- **F3:** six fight consequence chips, each anchored to a real node (Law 56).
- **F4:** the lair sidebar's monster card, with words, pips, a temper reveal rule and "felled by".

The work reads plan docs 1–3's state through pure view-model adapters, with debug accessors so Done-whens can assert what renders.

## scope (what this plan does NOT do — explicit non-goals)

- No engine writes, and no rules of play (docs 1–3).
- No MomentCard for fights. Moments are undertaking-scoped; this deviation from THR-1272 is recorded, and the v2 layer holds it.
- No new pip, ring or bar primitive (Law 15). No numerals for the clock, Dread or Might (Law 13).
- No HexMapV2 or WebGL change. The lair icons exist.
- No duel-specific UI (plan doc 5) and no hunt UI (plan doc 6).

## impact_class

Reversible. These are component additions and two defect fixes. They're UI-pillar changes, so every slice carries the four-part browser-verify evidence.

## evidence cited

- **Linear issue:** THR-1258 (closed map); decision tickets THR-1272, THR-1268 §8, THR-1266, THR-1270.
- **Vision premises invoked:** taste profile (prose-first, no numbers); the non-negotiables (the god is not the protagonist); the core loop (one chrome).
- **UL terms touched:** Consequence Chip and its four categories SCAR, BOND, BOON and PATH (every fight chip fits one; no fifth category). "Encounter veil" and "Lair" have no UL shard entry and none is seated here. The clock-state words, Dread/Might phrases and temper clauses are content constants, and Dread, Might and Temper are seated by plan docs 2 and 3.
- **Canon pages consulted:** `Docs/design-system/laws.md` (Laws 1, 3, 13/14, 15, 17, 21, 29, 33, 37, 56), `Docs/canon/verification-gates.md` § Browser-verify.
- **Prior work built on:** THR-971 / THR-1082 (chips), THR-718 (the `StepDots` magnitude variant), THR-1424 (the Law 13 pip amendment), THR-1007 (the laws).
- **Rejected approaches:** a numeral clock, a progress bar, the doom ring, a side panel, showing the temper from the start, fight moments. Reasons are in the companion.

## load-bearing decisions touched

- **The graph is mutated in place:** respected. View-models memo on `worldVersion`, never on graph identity.

## high-impact files touched (from Codesight)

None at ≥100 importers. `EncounterVeil.tsx` is busy but not widely imported.

## kill criteria

- If the header pushes the hand into scroll at 1920×1080 after the art-omission fallback, the header design is wrong. Stop and rethink the layout rather than scroll (Law 33).
- If any chip can render without its write, that's a Law 56 defect. Block the merge.

## explicit user sign-off

N/A (Reversible). Christian's look-and-feel veto applies tomorrow; the doc is veto-invited throughout.

## author notes for the judge

- **After run 5 (Allow, 1 GAP and advisories), folded in before commit:** the watched view is wired through the adapter that builds it (`buildSimpleEncounterStageModel`, via the tier routing), with no aftermath there; the opponent is resolved before `fightState` exists (`opponentRef`, else the target); F2 is blocked by F1; the monster kind reaches the header, sidebar and chips, not the v1 sheet; PATH chips draw the marker with their own `deltaLabel`; the standing chip's noun is the settlement's name; the `fight.*` ids are literals, with Law 17's changelog line and the resolver header; the header is a different subject from `ContextStrip` (THR-1478), named for the veto; PATH is in the category constant; line numbers updated; the step labels are tested.

- **Fourth revision (after run 4's Revise, 4 blocking):** the watched view (`threadTier === 'watched'`) shows one opponent line (name and clock word) on a fight step, and the threat whisper is omitted in the model (`header.threatLabel`), so both render sites (`:1566`, `:2038`) go quiet (FB7 derives an accurate interim label first, F2 removes it); before `fightState` exists the header reads the card and its recovered clock through plan doc 2's pre-`fightState` read (the value FB2 records as `clockAtStart`), and an agent-mode fighter row reads `FIGHT_MORTAL_CLOCK`; the clock chip renders only for a `persistent` clock; fighter-anchored chips read `fightState.ending`, always the fighter's own record, since plan doc 2 now declares `opponentEnding` for the duel's other side (plan doc 5's E2 writes it), with an agent-mode spare test. Polish: chips refine an explicit `agent` on a monster to `monster`, and `entity-visual-fallbacks.ts` joins F1; `FIGHT_CLOCK_PIP_SIZE` at Law 11's floor; condition chip copy lives in `FIGHT_CHIP_COPY` with direction from polarity; the synthesizer fills its own slots (no raw `{`, Law 43) and PATH chips declare no direction; "slain by" follows `killerIsKnown`, which plan doc 2's FB2 makes true for fight deaths; temper words reuse the derived `attachment.trait.temper.*` ids and new ids take a `fight.*` prefix added to Law 17; the perf claim is corrected (the lair card model is memoized); the navigator's current-step marker is described correctly; Law 8 (imagery not gated) is stated; the stale `getAgentInfoCard` doc comment is flagged.

- **Third revision (after run 3's Revise, 9 findings):** the driven-off chip is dropped (the beast stays put and clearing progress has no surface); a BOND grudge chip is added; conditions are categorised by polarity (`inspired` is BOON); clock, slain-opponent and lair-cleared chips are PATH (a changed world object, no magnitude); counts are replaced by 'the chip table'; F2 suppresses the step's threat whisper on fight steps (one magnitude language); `getFightChips` is a new accessor and the `fightState` → changes step sits in `buildUnifiedEncounterStageModel`; `deriveKind` returns the monster kind, with the existing monster portrait as v1 art and family portraits as a follow-on ticket; the review route filters living monsters on plan doc 3's pinned `lairTier`; the duel-loser chips are a Deferral filed at handoff.

- **Second revision (after run 2's Revise, 10 findings):** the opponent's slain chip reads `lairOutcome.felled` only (duel losers wait for plan doc 5's E2), and a fighter's own death gets a SCAR chip; condition and Storied chips read two new `fightState` records (`conditionsApplied`, `storiedClimbs`) that plan doc 2 declares; the trophy chip reads `ending.reward`; a legendary lair shows its slain monster in the lair block; Law 10 rests on square clock pips (a `StepDots` `shape` prop) and the navigator's real place at the top; the review route ticks to 60 or 100 on `?view=game&seeded&size=medium`, picks a major lair, and stages with `spawnFight` (which moves the hero and returns the action id); chips are asserted from the view-model, not the pin verdict; a chip copy table follows the sheet-word noun rule, with 'slain' as the one word across chip, card and sheet; Temper is seated by plan doc 3's M1; the agent-mode gate reads the clock fields; the killer is read through `getAgentInfoCard`.

- **Revised after a first judge run (Revise, 11 findings):** F2–F4 now blocked by FB7, reviews staged with `spawnFight` (plan doc 2 defines `clockFilled` and `outcome`); the attention premise corrected against `attentionTier.ts` / `encounterVisibility.ts`, with `fight.lair.confront` pinned `story_beat` by FB7 and moments deferred (route b) with a follow-on ticket; the felled card reads the retained elite by `lairId` in the Cleared Lair Section and names the killer only behind `killerIsKnown`; the name link opens the existing sheet (a monster sheet deferred); no engine write; concept tooltips registered and the clock tooltip cause-neutral; the card is a sentence (Law 16); chips fit SCAR/BOND/BOON and read `fightState`, not traces; kill criteria in the plan; Laws 5 and 10 settled.

- The Engine pillar is N/A-with-rationale here, the mirror image of docs 1–3, where UI was N/A. The carve-up split the three pillars across docs on purpose, so each ships and verifies in its own lane (THR-688 rule C). Every pillar is covered across the six-doc set.
- The deviation from THR-1272 (no fight moments) is explicit, with its reason (moments are undertaking-scoped by type).
