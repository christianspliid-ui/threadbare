# Action Proposal — Dialogue palettes by context (THR-1586)

## intent_quote

Christian, chat, 2026-09-25, looking at the compulsion-tier Premonition window:

> i love the colorfulness of the dialogue window

> it makes sense to have different color dialogue boxes for different contexts and dialogue types.

Director verdict recorded on THR-1586 (chat review, 2026-09-25):

> the starting proposal is approved as written. That covers the context taxonomy, keeping the existing Premonition and Veil palettes, **keeping reference sheets neutral**, and scoping the question of spreading the per-option sphere tint to encounter choices and action cards. The design session may treat the table as the agreed direction and refine the actual colour values itself, recording a veto invitation in the plan doc.

Christian, chat, 2026-10-02 (this session), on running the design now:

> du må gerne køre den første af dem her. design lanen er sat på pause.

## scope (what this plan does)

The plan defines three new dialogue-context palettes as named Law 30 tokens in `src/index.css`: story (hearth umber / terracotta), elder (verdigris) and gain (dark gilt / the one game gold). Every text tone is measured against WCAG AA on both gradient stops. A `context` prop on the shared `Modal` maps to a CSS class that sets local `--dlg-*` properties. Each property has today's neutral value as its fallback, so un-contexted modals are byte-identical.

The plan assigns five live surfaces to contexts and gives `RevealCard` a pass-through prop. It extracts the Premonition's sphere-tint recipe into a shared helper, with zero visual change to the Premonition. It extends that tint to the shared `CardFace` (nudge cards and action cards) when a card draws essence from a named sphere. It adds a styleguide section showing all contexts side by side and a read-only debug accessor. It fixes three Law 30/45 defects found on the re-skinned surfaces, and drafts Law 30 and Law 32 amendment text for Christian's joint decision.

## scope (what this plan does NOT do — explicit non-goals)

- It does not change the Premonition's or the encounter veil's palettes or tokens. They are listed in the registry only.
- It does not colour reference surfaces: entity sheets, `EventPopup`, Omen / Mandate / Doom details and settings stay neutral by the approved verdict.
- It does not touch `MeetTheFirstFlow` (a full-screen flow, not a `Modal`) or `MeetingEncounterModal` (unmounted on `main`).
- It does not tint card price text. Its colour carries affordability.
- It does not let a context ground carry polarity. Outcome words and band accents keep their polarity tokens.
- No engine, content, prose or game-state change of any kind.
- It does not land law text without Christian's chat approval.

## impact_class

Reversible. It is presentation-only and additive: new tokens, an optional prop, and new classes with neutral fallbacks. Reverting is a revert of one PR. The law-text edits are gated on Christian.

## evidence cited

- **Linear issue:** THR-1586 (description, director verdict comment 2026-09-25, design-request comment 2026-10-02)
- **Vision premises invoked:** the player is a god reading the world (colour read before words), and NFP #5 (narrative over mechanical perfection)
- **UL terms touched:** none new. "Dialogue context" is design-system vocabulary (`Docs/design-system/`), not game vocabulary.
- **Canon pages consulted:** `Docs/design-system/laws.md` (Laws 26, 27, 29, 30, 31, 32, 45), `Docs/canon/verification-gates.md` § Browser-verify, `Docs/canon/process.md` § User review interface
- **Prior plan docs this builds on:** THR-1010 (veil tokens), THR-1031 (premonition tokens), THR-799 (ceremonial frame / gold budget), THR-1607 (essence-cost preview predicate)
- **Rejected approaches considered and dismissed:** a palette per component (noise), a palette by importance (Law 26 rejects felt importance), a ground in the moment's sphere colour (collides with the option tint and card marks), a wrapper component per context (forks `Modal`), per-surface repainting (double grounds), and a green ground for gains (lies on failed acts). The brainstorm companion has the details.

## load-bearing decisions touched

None. No graph, node, edge, position, awareness, cache or engine decision is touched. The UI Laws (design-system constitution) are touched: Law 30 is amended by the agreed direction, and the Law 32 clarification goes to Christian, with a measured fallback if he declines.

## high-impact files touched (from Codesight)

None at ≥100 importers. `Modal.tsx` has 26 importers and `CardFace.tsx` has 9 (grep count on `main` @ `3b0a757f`). `src/index.css` is global but additive here.

## kill criteria

- **If any neutral-modal snapshot or screenshot changes,** a fallback is wrong. Fix the fallback, never the snapshot.
- **If the styleguide row shows story and gain indistinguishable at a glance,** the warm pair failed. Retune story toward terracotta before shipping, and re-measure.
- **If Christian says a context "doesn't feel like" its moment after seeing the styleguide,** retune that context's three tokens. The mechanism stays.
- **If the card tint makes the hand read as noise in the encounter veil,** drop the tint from `CardFace` by unsetting the model field. The helper and the Premonition stay.

## explicit user sign-off

Not required (Reversible). The direction is approved (2026-09-25 verdict). The Law 32 clarification is separately gated on Christian in chat before law text lands.

## author notes for the judge

- **The 2026-09-25 verdict lists `MeetingEncounterModal` and `RevealCard` under the story and gain contexts.** Measurement shows `MeetingEncounterModal` is unmounted. `RevealCard`'s only standalone caller is `EventPopup`, which the same verdict keeps neutral. The plan treats this as a correction to the surface list, not to the taxonomy: `RevealCard` forwards a context and `EventPopup` passes none. Please check whether that reads as fidelity or drift.
- **Law 32:** the Premonition gradient Christian praised is already above `--bg-surface` luminance. I matched it rather than darken, and put the law question to him with a measured fallback. All AA rows pass either way.
- **Sphere tint:** the verdict "scoped the question". The plan decides yes for `CardFace` with a veto invitation, citing his 2026-09-25 reaction and the predicate THR-1607 already uses.
