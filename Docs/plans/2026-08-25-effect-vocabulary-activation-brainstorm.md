# Brainstorm companion — Effect Vocabulary Activation (THR-1239)

Considered alternatives, tensions, and Vision premises behind `2026-08-25-effect-vocabulary-activation.md`. The live design exchanges are on the Powers & Spellcraft wayfinder map (THR-1226) and its decision tickets; this file records what was weighed and set aside.

## Alternatives considered

**Scope the generators to the ~21 live primitives instead of activating all.** The substrate inventory's original recommendation. Killed by director ruling 2026-08-25 ("please extend to all the primitives first"). The ruling is the better game bet: the dead executor family (teleport, spawn, compel, cascade) contains exactly the primitives that make spells feel like *magic* rather than stat adjustments, and the map-spell classes ratified on THR-1230 (travel/sight/mark) are unreachable without them.

**"Add rows to `getReactiveTrigger`" as the unlock.** The substrate inventory's framing; the ledger corrected it — the rows already exist, the *events* are never constructed. The fix moved from the trigger table to three production raise sites. This correction is why verify-as-you-go research runs before design.

**Preserve every spelling (wire all 10 no-op arms as distinct executors).** The literal reading of "extend to all." Rejected in favor of capability-live/spellings-consolidated (decide-and-invite-veto, standing): `swap_reach` and `encounter_reach_override` are two spellings of one idea; `haste`/`slow`/`freeze_duration` are all duration arithmetic already expressible as rule keys; `reroll` is hostile to seeded determinism (a second draw from the same stream shifts every later draw — `test_shaper` gets the same expected-value effect without one). Wiring them as separate executors would double the maintenance surface to preserve words no player ever sees. `reveal`/`suppress` went the other way — wire, don't retire — purely on content pressure (17 + 4 refs).

**Overlays/overrides on graph nodes instead of GameState.** Tempting for inspectability (everything is a graph node). Rejected: they are transient *rule-state* with tick-scoped lifetimes, not world facts; node-backed storage would need new node types (full design gate) and pollute worldgen/save-shape for state the effect-tick phase owns. GameState collections mirror the existing `pendingHexMutations` drain exactly.

**`entered_hex` per hex step.** Rejected — ~4× event volume on long moves, and no design gain: a ward that fires "as you cross" and one that fires "as you arrive" are indistinguishable in prose at current tick granularity. Revisit only if a specific spell design needs mid-path interception.

**A real damage model instead of the condition proxy.** Per-agent HP would be a new system with combat-wide consequences — far beyond activation scope, and against the game's story-shaped-wounds direction (conditions ARE the damage model; they carry names and prose). The proxy makes `damaged`/`healed` mean what the game already means by harm.

**Battle events audible to same-hex bystanders.** Deferred. Participants-only keeps the audience computable from battle membership edges; bystander coupling is a thematic-pressure question (fear spreading from battles) that deserves its own design if wanted.

## Tensions carried, not resolved

- **Event vocabulary is still partial.** `rest`, territory events, `dawn_cycle`, `attacked`/`cursed`/`blessed`/`ally_damaged` remain unraised (several lack even an event variant). The `never` guard covers effect types, not events — a content author can still write an `until_event: 'rest'` that never fires. Mitigation: the generator envelopes (next map stage) whitelist raised events only; a lint for unreachable event refs would be a future hardening, deliberately not filed now (process-work throttle).
- **Stacking-cap tuning is guesswork until play.** `RULE_OVERRIDE_VALUE_CAP = 3.0` and aura constants are first guesses; the balance envelope is explicitly fog on the map, waiting on the generator prototype.
- **Stage 4 is destructive.** The only stage that deletes. The `never` guard + full-suite tests bound it, but a missed dynamic reference (string-keyed lookup) would surface at runtime as fail-soft skips — acceptable, traceable, but worth the executor's attention. (Dead-code census traps: string refs are not import-path refs.)

## Vision premises engaged

- **Systemically alive content over hardcoded fiction** — the whole point: generated spells/items whose stated effects are mechanically true.
- **Fail-soft dread world** — transgression pricing (doom/notice) and persistent marks need the doom keys and overlays live.
- **Narrative over mechanical perfection** — condition-proxy for damage; consolidation preserves what content *means*, not how it was spelled.
