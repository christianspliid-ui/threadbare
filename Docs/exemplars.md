# Exemplar Index

Use this table as the single source of truth for quality exemplars across content workflows.
When a better exemplar ships, update this file instead of hardcoding references in multiple skills.

| Kind | File | Rubric | Why exemplary |
| --- | --- | --- | --- |
| Encounter (format + prose) | `src/data/__fixtures__/nudge-exemplar/swollen-ford-exemplar.ts` | Locked THR-883 format | The nudge-native worked example — every hand/envelope/band rule visible once. **v2 caveat (re-audited 2026-08-25):** it predates Doctrine v2, so read its card *quotes* as retired (cards are spell-style now) and hold its scene prose to narrator mode where they disagree. |
| Encounter (wiring only) | `src/data/encounters/rival-shrine-betrayal.ts` | systemic wiring reference | Full-stack systemic connectivity, cool-failure outcomes, aftermath reactions. **Prose and choice model predate the nudge pivot and Doctrine v2 — do not imitate the prose.** |
| Encounter (wiring only) | `src/data/encounters/flawed-steel.ts` | systemic wiring reference | Fail-forward pacing and branch wiring. **Its premise is the named rejected authored-futures example ("forge the truth / temper the narrative") — wiring reference only.** |
| Prose — baseline register | (inline, below) | THR-609 register model | The default voice: plain, concrete, active. Dry understatement over ornament. |
| Prose — peak register | (inline, below) | THR-609 register model | Rationed lyricism for the non-encounter peak surfaces (doom transitions, Twilight, World-Soul — encounter surfaces lost peak status 2026-08-25, Doctrine v2). |
| Attachment | `<TBD - promote when a clear exemplar ships>` | `<TBD - define attachment rubric>` | Placeholder row for future promotion. |

## Register exemplars (THR-609)

The register model is canonical in [`Docs/canon/prose.md`](canon/prose.md#the-register-model-settled--plainspoken-malazan-thr-609). These two entries show the contrast an author must hold: **baseline is the default; peak is the rationed exception.** The deterministic floor is the prose-QA `registerCompliance` dimension (`window.__DEBUG.proseQualityReport()`).

**Baseline register** — the large majority of the prose the player reads. Plain, concrete, one idea per sentence. Dry wit over metaphor.

> The merchant owed too many people too much. He'd started checking the door. When the collector's boy finally came, he already had the ledger open — not to pay, but to show how little was left.

Why it works: short declarative sentences, concrete nouns (merchant, door, ledger, boy), no rare vocabulary, no stacked figuration. The tension is human and legible. Contrast the drift version the model rejects: *"The merchant's ambit had grown parlous, freighted with the weight of unspoken covenants."* — same beat, ornamental diction, sends the reader to a dictionary.

**Peak register** — reserved for the non-encounter surfaces: doom transitions, Twilight, World-Soul prose (encounter climaxes lost peak status 2026-08-25, Doctrine v2). One figurative image per paragraph; rhythm may stretch.

> The bells stopped. Whatever had been holding its breath beneath the city let it out. Somewhere far below the streets, in the dark the founders had bricked over and forgotten, a long exhalation moved through stone — and the stone, for the first time in an age, listened back.

Why it works: one sustained image (the city holding its breath), earned by the surface it sits on. It would be drift in baseline narration; here it is the point.
