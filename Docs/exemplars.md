# Exemplar Index

Use this table as the single source of truth for quality exemplars across content workflows.
When a better exemplar ships, update this file instead of hardcoding references in multiple skills.

**Read the `Why exemplary` column before copying anything.** A row is exemplary *at what it says it is exemplary at* — the two May encounter rows below are wiring references whose **prose is pre-register-model and must not be imitated**. The pipeline's instruction is to study the top `Encounter` rows before drafting, so the ordering here is load-bearing: the prose exemplar sorts first.

| Kind | File | Rubric | Why exemplary |
| --- | --- | --- | --- |
| Encounter — prose + structure | `src/data/__fixtures__/nudge-exemplar/swollen-ford-exemplar.ts` | Nudge Model format (THR-883) + Prose Doctrine v2 | **The one to copy.** Authored end-to-end against the locked format with every rule visible once; present tense, one fact per sentence, no figuration in the spine. Registered in no pool — it exists to be copied. `nudgeModel.test.ts` § *golden exemplar* pins it against the spec. *(The old caveat about its card quotes is closed — THR-1225 removed the `fiction` fields; cards are spell-style with no quote to copy.)* |
| Encounter — systemic wiring only | `src/data/encounters/rival-shrine-betrayal.ts` | 10/10 systemic wiring · **prose: do not copy** | Full-stack systemic connectivity with strong cool-failure outcomes and meaningful aftermath reactions. Study the wiring, not the sentences. |
| Encounter — systemic wiring only | `src/data/encounters/flawed-steel.ts` | 9/10 systemic wiring · **prose: do not copy** | High-quality branch seduction and fail-forward pacing while staying implementable and testable. Study the branch/aftermath structure, not the sentences — and note its premise is the named rejected authored-futures example ("forge the truth / temper the narrative"). |
| Prose — baseline register | (inline, below) | THR-609 register model | The default voice: plain, concrete, active. Dry understatement over ornament. |
| Prose — peak register | (inline, below) | THR-609 register model | Rationed lyricism for the non-encounter peak surfaces (doom transitions, Twilight, World-Soul — encounter surfaces lost peak status 2026-08-25, Doctrine v2). |
| Attachment | `<TBD - promote when a clear exemplar ships>` | `<TBD - define attachment rubric>` | Placeholder row for future promotion. |

## Register verdicts on the encounter rows (THR-1250, 2026-08-25)

Both May encounter rows were audited against the register model and Prose Doctrine v2 and were **demoted from prose exemplar to wiring exemplar**. They were not deleted: their wiring is still the best in the corpus, and their rubric scores were always about wiring. What changed is that the row now says so, because the pipeline sends every draft agent here to "study the top Encounter rows" and an unqualified row is read as a prose model.

| File | Verdict | Evidence |
| --- | --- | --- |
| `rival-shrine-betrayal.ts` | **Wiring exemplar; prose drifted** | Past tense throughout ("spread the ledger", "walked the agent through") against doctrine v2's present tense. Facts encoded rather than stated: *"She spoke at exactly the volume that carried no further than the table"* for *she spoke quietly*. Simile in baseline narration: *"like a stone dropped into still water"*, *"as though showing a friend a garden"*. |
| `flawed-steel.ts` | **Wiring exemplar; prose drifted further** | Opens on camera work and interiority — *"The first thing the god noticed was the sound"*. Stacked figuration in baseline: *"like a missing heartbeat"*, *"lighter than breath — a whisper threaded through the morning air"*. Past tense throughout. This is the pre-register-model lyricism THR-609 and doctrine v2 were both written to stop. |
| `swollen-ford-exemplar.ts` | **Holds — promoted to the top row** | Present tense, subject-verb-object, one fact per sentence, no figuration in the spine: *"The river runs brown and loud over the drowned ford. The guide-rope dips where the current pulls hardest."* Carries the doctrine-v2 card shapes. (The dead `fiction` strings it once held are gone — THR-1225 shipped the field removal; note updated 2026-08-29, THR-1372.) |

**Re-run the verdict when either encounter is rewritten** — the retrofit campaign (THR-1130) may lift them back to prose exemplars, at which point the row's Kind and the `do not copy` qualifier come off together.

## Register exemplars (THR-609)

The register model is canonical in [`Docs/canon/prose.md`](canon/prose.md#the-register-model-settled--plainspoken-malazan-thr-609), and narrator mode — Prose Doctrine v2 — governs it as of 2026-08-25. These two entries show the contrast an author must hold: **baseline is the default; peak is the rationed exception.** The deterministic floor is the prose-QA `registerCompliance` dimension (`window.__DEBUG.proseQualityReport()`).

**Baseline register** — the large majority of the prose the player reads. Plain, concrete, one idea per sentence. Dry wit over metaphor.

> The merchant owed too many people too much. He'd started checking the door. When the collector's boy finally came, he already had the ledger open — not to pay, but to show how little was left.

Why it works: short declarative sentences, concrete nouns (merchant, door, ledger, boy), no rare vocabulary, no stacked figuration. The tension is human and legible. Contrast the drift version the model rejects: *"The merchant's ambit had grown parlous, freighted with the weight of unspoken covenants."* — same beat, ornamental diction, sends the reader to a dictionary.

**Peak register** — reserved for the non-encounter surfaces: doom transitions, Twilight, World-Soul prose (encounter climaxes lost peak status 2026-08-25, Doctrine v2). One figurative image per paragraph; rhythm may stretch.

> The bells stopped. Whatever had been holding its breath beneath the city let it out. Somewhere far below the streets, in the dark the founders had bricked over and forgotten, a long exhalation moved through stone — and the stone, for the first time in an age, listened back.

Why it works: one sustained image (the city holding its breath), earned by the surface it sits on. It would be drift in baseline narration; here it is the point.
