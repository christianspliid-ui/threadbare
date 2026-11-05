# Action proposal — the rail rows say what they are (THR-2175, slice 1)

## intent_quote

> "get the design lane to focus on UI and UX improvements for the next period. specifically legibility and usability of the different UI modules: are we using tried and true ux patterns for how humans read UI panels..." — Christian, chat 2026-11-01 (design-lane period focus)

> Ticket THR-2175 (warm playtest round 3, filed by the cold-playtest lane): "Design question: What does a returning player need explained, and where — given they skipped (or forgot) the one-at-a-time introductions?" Recommended direction: "(1) Every god-rail footer row and every Doom/Omen word gets a one-sentence hover in game words (Law 13/14), and the row's own text says what it is for … (2) The warm arrival (THR-2173's card) re-arms the first-use captions … (3) File a UL-proposal for the two meanings of 'Reach'." Fixed when: "No warm round-4 tester lists more than two of Reaches / Mandate / Signatures / Hooks / Doom / Omen under never-understood." Done when: "Its build ticket(s) and the UL-proposal are filed into this milestone and are Done."

## scope (what this plan does)

Words and two small layout touches on the god rail's folded rows and the Doom panel. Each collapsed row's summary names what it counts ("Hooks · 11 unfinished"); an opened row begins with a muted definition line taken from the row's existing hover entry; Mandate gains the hover it lacks; the Dominion first-use caption is prefixed "Dominion:" so it stops reading as Reach's definition; Counter-omens and Doom debt rows hide at zero like the panel's Speed modifier row. A UL-proposal ticket records the display rule that "Reach" never names Dominion.

## scope (what this plan does NOT do — explicit non-goals)

- Does not re-arm first-use captions on warm arrival (part 2 of the ticket direction) — needs THR-2173's arrival card, not yet designed.
- Does not rename any canon term (Hooks, Signatures, Mandate, Reach).
- Does not touch rank words with no scale or the small numbers on the mortal sheet — filed as a separate design request in the same milestone.
- Does not touch card pips (designed in THR-2146) or Omen / Doom stage story titles.
- Does not open any row by default or widen the rail.
- No rule of play changes.

## impact_class

Reversible

## evidence cited

- **Linear issue:** THR-2175
- **Vision premises invoked:** prose-first UI, map is the table (vault `Vision/taste-profile.md`)
- **UL terms touched:** Reach, Dominion, Hooks, Signatures, Mandate, Covenants, Threads (avoided); new UL-proposal for a display rule on Reach vs Dominion
- **Canon pages consulted:** `Docs/ubiquitous-language/Cosmology.md` § Reach, `Docs/design-system/laws.md`, `Docs/design-system/layout-zones.md`
- **Prior plan docs this builds on:** `Docs/plans/2026-11-05-thr-2177-god-rail-hand-room.md`, `Docs/plans/2026-11-02-thr-2143-the-sheet-says-what-grew.md`, `Docs/plans/2026-11-02-thr-2146-every-card-says-what-it-buys.md`, `Docs/plans/2026-10-18-thr-1980-words-teach-themselves.md`
- **Rejected approaches considered and dismissed:** renames, "?" glyphs, rows open by default, the ticket's "ways rivals can reach you" wording (factually wrong per `ui.hooks`)

## load-bearing decisions touched

"Reaches and Spheres are orthogonal axes" — respected; the plan keeps Reach meaning only "what you do".

## high-impact files touched (from Codesight)

None ≥100 importers. Measured by grep of import specifiers in `src/`: `ui-content` 44, `frame-registry` 20, `frame-content` 17, `first-use-captions` 5. No Blast Radius section needed.

## kill criteria

- A summary ellipsizes at 1920×1080 → drop its prefix on that row.
- A player waits for counter-omens they cannot see → restore the rows as "No counter-omens yet".
- Warm round 4 still lists ≥3 of the six words as never understood → the next slice is the arrival-time teaching in THR-2173, not more rail words.
