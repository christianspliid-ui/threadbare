# Brainstorm companion — Reputation unification (THR-1206)

Companion to `Docs/plans/2026-08-23-thr-1206-reputation-unification.md`. Records the alternatives considered, the tensions surfaced, and the survey evidence the plan stands on. Three parallel in-session sweeps (engine substrate, authored content, UI surfaces) ran 2026-08-23; their full reports are condensed here.

## The originating ruling

Director, attended chat 2026-08-23, refining THR-1205: *"i would rather that it be a reputation or another core game concept. custom concepts are difficult for players to learn and understand. if we do have reputation as our concept for 'the social score that modifies interactions between a and b', then lets use that everywhere."*

## The six-mechanism census (survey evidence)

1. **`member_of.reputation`** — 0–1 on the membership edge; rank derived per-definition (`computeRankFromReputation`, `src/types/faction.ts:238`); consumers across access gates, bonuses, cohesion/schism, succession, prose. Member-only: `applyFactionReputationGain` no-ops `not_a_member` (`factionReputation.ts:74`).
2. **`reputationScore`** — node property, default 0.5 (`types/disposition.ts:165`). Live: death gate (`agentLifecycle.ts:120-125`), per-tick decay to neutral (`phaseReputationDecay.ts:21`), aftermath predicates (`effectPredicates.ts:94-102`), agent-card word (`agentDetail.ts:1156`). NOT write-only (initial framing corrected by survey).
3. **`reputationTallies`** — reach×polarity keys only; `VALID_TALLY_KEYS` = 16 (`encounterAftermath.ts:219-225`); invalid keys trace + drop (`:1173-1194`). **154 of 501 authored writes (31%) are on invalid keys** across 78 distinct keys — including three the engine itself authors (`unifiedActionResolution.ts:814,830,846`) and `star.negative` authored zero times (the "Zealot" trait is unreachable via tallies). Tallies feed 19 reputation traits at thresholds 3/8/15; traits carry the reactions/gates/scoring payloads and are the prose vocabulary (`{title}` enrichment).
4. **`relates_to.sentiment/.trust`** + `perceiveReputation()` (`reputationWalk.ts:71`) — the real pairwise agent↔agent substrate, consumed by the agent decision loop (`agentSelection.ts:231` → `applyDispositionModifier`).
5. **`reputation_set` effect** — handler live, sole authoring site in unimported `src/data/encounters/examples/`. Dead content.
6. **`standing_welcome`** — location condition, three writers (Grateful Kin bands), zero readers; its documented consumer `slice.kin.the_roof_opens` does not exist (`condition-trait-content.ts:365` names it; grep finds only the comment). THR-1175 closed a write-without-reachable-consumer defect by creating another one layer along.

Corpus-side: 196 `kind: 'reputation'` chips + 47 `faction_reputation` + 48 surviving `reputation_tally` chips (the latter already declared uninspectable by `compositionContract.ts:574`). **18 chips in 4 files claim `kind: 'reputation'` with zero reputation-family writes in the file** (`road-ambush`, `soul-ferryman`, `the-brink-rescue`, `the-courtyard-duel`) — cast-fate chips wearing the reputation label. UL: **no entry** for reputation/standing/renown/favor/disposition anywhere in 8 shards; `STANDING` is a formally retired display kind (`Encounters.md:65`); BOND's definition bundles "faction standing, personal reputation, a companion joining" as one display category.

## Alternatives considered

### A. One store to rule them all (migrate everything into a single `reputation` edge family) — REJECTED
Big-bang migration of member_of.reputation (rank machinery, 20+ consumer sites), relates_to (agent decision loop), and the tally→trait pipeline. Violates the standing strangler ruling (THR-1157 charter: "strangler, never big-bang") and NFP #6. The player needs one *concept*; the engine does not need one *table*.

### B. Presentation-only unification (rename surfaces, change nothing underneath) — REJECTED
Fails Law 56 the moment a chip says "reputation in Sacred Grove": no store holds that pair, so the chip would claim state nothing writes — the exact defect class THR-1141 swept. The gap is real; a new store for the uncovered pairs is unavoidable.

### C. Reuse `knows_of` (actor→location, zero required props, ~unused) as the carrier — REJECTED
Cheapest by registration cost (survey suggested it), but "knows of" is awareness semantics; burying standing inside an awareness edge is a new vocabulary drift on the day we're ending one. Registration cost of a new family is small post-THR-1177 (schema row + two chokepoints validate for free).

### D. Extend `member_of` to non-members (reputation without membership on the same edge) — REJECTED
`member_of` means membership everywhere it is read (rank derivation, awareness, topology, succession). A non-member membership edge is a contradiction every consumer would need to special-case — more drift, not less.

### E. The chosen shape — one read API + one word vocabulary + one new sparse edge family for the uncovered pairs
`getReputationWith` dispatches: membership → member_of; edge → `reputation_with`; agent bond → normalized trust; else default. Bands single-sourced from `getReputationWord`. The new family covers agent↔location and non-member agent↔faction (faction nodes are actors, so one target union covers both). Everything the player sees says "reputation" with one band vocabulary; every store keeps its machinery.

## Tensions surfaced

- **Trust vs reputation (agent↔agent leg).** Private regard (`relates_to.trust`) and public standing are arguably different concepts; folding trust into the reputation *read* risks flattening that. Resolution: the read delegates (so "reputation with a person" is answerable and worded), but the store, BondsTab presentation, and the disposition loop are untouched. If the director later wants public-vs-private regard split, the edge family covers "public standing with a person" without rework — the dispatch order just changes.
- **Traits/tallies are renown, not pairwise standing.** "What you are known for" (Feared, Beloved) is one-sided and stays so — the plan deliberately does not force it pairwise. The invalid-key leak is fixed and the dead keys re-authored, but the reach-polarity design is untouched.
- **The condition-vs-edge question (THR-1175's ghost).** THR-1175 correctly rejected a town-as-favor-debtor edge and chose a location condition; the director's ruling now rejects the condition's *noun*. The lesson carried forward: the defect was never edge-vs-condition, it was write-without-reader. This plan ships all three readers in the same ticket as the write.
- **Where does the *ascendant's* reputation live?** Out of scope by a deliberate line: reputation belongs to mortals and communities (the avatar agent holds the edges); the god reads it through threads. A divine-notoriety concept (rival gods, mortal faith) exists separately (stealth/detection) and must not be conflated.
- **Fifth-mechanism anxiety.** The ticket's own anti-goal is "no parallel fifth mechanism." The defense: `reputation_with` fills pairs *no* store covers (so it parallels nothing), and the read API is the single door — a consumer that reads a store directly instead of through `getReputationWith` is the new drift to lint for (noted as a possible future content-eval rule).

## Sequencing (vs the THR-1157 wave)

Architecture-first stands. This design is the *second worked example* of the wave-1 seam pattern (hunger vocabulary is the first): one concept, N disagreeing vocabularies, unify at the read + word layer, strangle the stores. Execution has no dependency on the shared-machinery anchor type — the chip anchors it needs already resolve (THR-1172 contract) — so it can run as soon as an executor picks it up; its catalog rows join the generated object catalog when that machinery lands. Recommendation recorded on the map ticket at handoff.

## Named follow-ups (not this ticket)

- Pairwise `computeBondModifier` (encounter-desire term) — tuning, separable.
- Cached-vs-derived faction rank read disagreement (`factionAwareness.ts:127` et al. vs `meetsFactionRankRequirement`) — deferral.
- `secretGeneration.ts:184` reads a `relates_to.reputation` property that never exists (`past_crime` secrets unreachable from that path) — deferral.
- `reputation_walk_bonus` authored on 23 faction tiers, consumed nowhere — deferral or deletion at retro.
- Trade pricing / favor call-in — no hooks exist; genuinely new systems if ever wanted.
