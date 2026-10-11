# Action proposal — 2026-10-11-thr-1807-terms-explain-themselves

## intent_quote

> **Design question.** What is the one consistent way a new player learns a term the first time it matters, and which terms must be learned in the first ten minutes versus hidden until they matter?

> **Fixed when** at most one round-4 tester lists any of: sphere pour, Reaches tiers, Doom, Omen, the opposite-trait miss, or the picker portraits under "never understood".

> **Done when** this ticket's implementation tickets are filed into this same milestone (*Cold playtest · round 3*) and this ticket is closed by the design pass.

(THR-1807, filed by the cold-playtest lane from round 3, 2026-10-10, under Christian's blessed cold-playtest loop. Its recommended direction lists six items: top-bar and sheet hover explanations with DOOM/OMEN always clickable; a one-line pour explanation; a pre-commit opposite-trait line; the mortal panel listing a domain the aftermath named; a time label that names the holder; picker names on focus. It also asks to hide Signatures/Covenants/Hooks/Investiture until first use, coordinated with THR-1808. The design lane's 2026-09-25 mandate, Christian: "I think we have reached a state of the game where you can probably iterate and progress designs without me in many situations.")

## scope (what this plan does)

It sets one rule for where a term is learned: in place, through the existing tooltip registry, reachable even when the control cannot be clicked; risks and prices said before commit; rank words visibly ranked; empty sections hidden; two surfaces never disagree. It then applies that rule to every item the ticket names. Concretely:

- Registry tooltips for World-Soul, Omen, Attention, Signatures, Hooks, the clock hold and the step test chip; rewritten Doom and essence-row copy.
- The top-bar group stays hoverable under a veil (clicks guarded, with a reason line).
- Rung markers beside the Reach tier words.
- Empty Signatures/Covenants/Hooks sections hidden.
- A holder-naming clock label for every interrupt.
- A pour-meaning line at setup.
- A miss-flips line in the meeting hand.
- The Reach's sphere named on the premonition cost.
- Name + epithet on the focused picker portrait.
- One additive agent property recording the last tier crossing, so the info card lists the domain the aftermath named.

It files two implementation tickets.

## scope (what this plan does NOT do — explicit non-goals)

- It does not change any rule: starting pools stay flat, the pole write is unchanged, billing is unchanged, and no outcome moves.
- It does not decide the post-bond reveal order, nor when Investiture appears. That belongs to THR-1808, which this plan's rule 4 feeds.
- It does not make Doom/Omen panels open *under* an open veil. The ticket asked for "clickable at all times". The plan keeps hover live and guards the click with a reason, because the panels would render beneath the veil's z-band (GameViewTopBar.tsx:49-53). It records this as a deliberate narrowing.
- It does not add a tutorial, glossary page or "seen once" first-use captions. The kill criterion names the last as the next step if round 4 shows testers never hover.
- It does not re-plan the odds-legend pill (THR-1791 shipped 2026-10-10).
- It does not touch the THR-1806 chapter-answer readout states (`answerStatus`, clock not held).

## impact_class

Reversible. These are UI copy and display changes plus one additive node property; a revert restores today's behaviour.

## evidence cited

- **Linear issue:** THR-1807 (originals THR-1607, THR-1713; related THR-1784, THR-1791, THR-1806, THR-1808, THR-1749, THR-1711)
- **Vision premises invoked:** rulebook quick reference § Your Resources ("Forks are decided by the mortal, never by you"); § The Clocks (Doom sleeps until the bond, with a floor before it can end the world)
- **UL terms touched:** Doom, Omen, World-Soul, Attention, Reach, Sphere, Essence, Signature, Covenant, Hook, The First. No new terms; "Held" is microcopy, not a concept.
- **Canon pages consulted:** `Docs/canon/design-governance.md`, `Docs/canon/rulebook-quick-reference.md`, `Docs/ubiquitous-language/README.md`, `Docs/design-system/laws.md` (Laws 1, 13, 17–20, 25, 42, 43, 52, 53), `Docs/ops/player-complaint-classes.md`
- **Prior plan docs this builds on:** `Docs/plans/2026-10-05-thr-1713-readable-on-hover.md`; THR-1806's plan (`Docs/plans/2026-10-11-thr-1806-chapter-answers-on-screen.md`, open PR #2323) for readout coordination
- **Rejected approaches considered and dismissed:** glossary page, first-run walkthrough, seen-once captions (deferred to kill criterion), changing the pour's rules, names on the resting picker, replacing the lowest domain row, writing inside `applyEncounterGrowth`. Reasons are in the brainstorm companion.

## load-bearing decisions touched

- "Relationships between entities are graph edges, not property fields": `lastTierCross` is a fact about one agent (domain + tick), not a relationship, so it is a property.
- "The world graph is mutated in place — never key change detection on graph identity": the write calls `touchWorld()`.
- None is changed.

## high-impact files touched (from Codesight)

None ≥100 importers. Counted by grep: `agentDetail` 58, `unifiedActionResolution` 48, `SimulationControls` 8, `GameView` 7, `AscendantBar` 2. No Blast Radius section is needed.

## kill criteria

- A round-4 tester still lists Doom or Omen under never-understood: read the tester log for a top-bar hover. If there was none, the gap is discovery, so move to seen-once captions within THR-1808's staged reveal rather than adding more tooltip copy.
- A tester reads the rung marker as a score or a health bar: change the glyph, keep the rule.
- The ticket's own Fixed-when fails (two or more round-4 testers list any of the six named items): reopen as a PC-1 recurrence with the round-4 evidence.
