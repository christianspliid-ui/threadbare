# Brainstorm companion — The scene picture speaks words, not the encounter's contract (THR-1733)

Companion to `Docs/plans/2026-11-07-thr-1733-scene-picture-speaks-words.md`. Authored by the design lane
(run dl-20261107T1118) under the bug clause of the ways-of-working mandate.

## Vision premises engaged

- **The machine never shows through.** The encounter's opening picture is the threshold of a story; hearing
  serialized JSON there is the engine talking over the scene.
- **UI Law 14** — no raw internal keys on a player surface. **Law 13's `aria-label` clarification** — an
  `aria-label` is player-facing prose, judged by whether a person hears it.

## Alternatives considered

| Option | Why not taken |
|---|---|
| Move the contract into its own template field | The real cure for the storage trick, but it changes the builder, the adapter and 23 data files and how every contract template round-trips. A refactor, not this bug; the ticket rules it out of scope |
| Guard in `EncounterVeil` (`alt.startsWith('__')`) | Puts the contract's storage trick in a component; the unit sweep could not see it; any second renderer would leak again |
| Decode the contract and use a field from it as alt | The contract has no scene-description field (`place` holds location, ambient state and painting only), so there is nothing better to read |
| Author a real description per painting | Best alt text, but a content pass over every painted encounter — recorded as a possible later polish, not filed |

## Tensions

- `Scene from The Road Ambush` is thin alt text. It is still a scene name a listener can use, and it is what
  every non-contract encounter already gets. A richer description is content work.
- The helper trims authored alt before returning it. No authored alt today has edge whitespace, so the
  visible change is nil.
