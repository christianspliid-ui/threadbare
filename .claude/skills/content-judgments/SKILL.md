---
name: content-judgments
description: Where and how Threadbare uses Jev (TypeSafe's System One model) for typed judgments over authored content — narrator-mode screens, tag fit, claim-vs-write-set checks, coverage maps, fragment distinctness. Offline, advisory, never a gate. Load when a content pipeline step names it, when planning a content categorization run or audit (THR-1723), or on "Jev", "TypeSafe", "content judgments", "categorization run", "coverage map", "tag fit audit".
last_validated_against: 2026-10-15
validated_doctrine: prose@2
---

# Content judgments with Jev

**Jev** is TypeSafe's System One model: it reads text plus context and returns a *typed* answer with
probabilities — **Choice** (one of a set), **Noul** (probability a condition holds), **Score**
(position on described levels) — never prose. That makes it a cheap, fast semantic screen over many
content entries at once, where our deterministic checks only see words.

Christian's direction (2026-10-04): use it for **content categorization runs and audits as the
corpus grows.** This page is the single authority for how Threadbare uses it. The content skills
point here instead of restating these rules.

**For API mechanics** — primitives, question design, confidence, SDK and HTTP shapes — load the
`typesafe:typesafe-ai` skill and read the live docs it names (`https://docs.typesafe.ai/llms.txt`).
Do not write integration code from memory.

## Status

**The first shared runner is `npm run judge:encounters`** (THR-1723; code in
`scripts/judge-encounters.ts` and `scripts/content-judgments/`, plan
`Docs/plans/2026-10-14-thr-1723-encounter-coverage-map.md`). It judges every Encounter-kind
entry on a blind state (prose only, no declared labels) and writes:

- the artifact `Docs/ops/content-judgments/encounter-coverage.json` and
- the report `Docs/ops/content-judgments/encounter-coverage.md`,

both published to the **`ops` branch** (read with `git show origin/ops:<path>`), never to `main`.
A re-run reuses every row whose `(contentHash, questionsVersion, model)` match the previous
artifact, so only new or edited encounters cost money. `--dry-run --limit 1` prints one state and
its question set with no network call. **Key unset → the runner prints
`judge:encounters: skipped — TYPESAFE_API_KEY is not set`, exits 0 and writes nothing.**

**Calibrated (THR-1850, 2026-10-15)** against a blind Claude reader subagent on the 64-entry
sample, on `jev-1.13.0` and questions v1: Reach 0.80, Walk of life 0.50, tag-fit no 0.40 (thin:
10 labels). **Activity and Spheres are uncalibrated** — no cut reached 85% agreement over half the
sample, so every answer on those axes routes to review. The values are committed as `CALIBRATED_*`
in `scripts/content-judgments/constants.ts` and apply to any run that answers on the pinned model
with no carried thresholds. A re-calibration passes `--calibration <file>`, where the file is the
label array or `{ readerPrompt, labels }` (the prompt then lands in the artifact). Read Jev's
`→ eye` Reach judgments with suspicion: about 67 of the first run's 110 mislabel candidates were
judged Eye.

Outside that runner:

- An ad-hoc screen from a pipeline session is allowed for a **small worklist** (one batch, tens of
  entries), and only when `TYPESAFE_API_KEY` is set in the environment.
- **Key unset → skip silently**, and write one line in the pass's report: `Jev screen: skipped (no key)`.
  A skipped screen never blocks, fails or delays a pass.

## Rules (all of them, every use)

1. **Offline only.** Never from `src/engine/`, the tick loop, any runtime code path, or the shipped
   build. Determinism (NFP 3) and fail-soft (NFP 4) forbid it, the static deploy has no server for a
   key, and runtime LLM content is a rejected approach.
2. **Advisory, never a gate.** A Jev result is a **worklist for the critic**, not a verdict. The
   machine gates (`check:encounter`, `check:undertaking`, `check:attachment`), the register scorer
   and the mandatory fresh-context critic agent stay exactly as they are. Do not wire Jev into CI or
   into any `check:*` script — it costs money per call and depends on a network service.
3. **Persist what you ask and what came back.** Write the questions, the entry ids, the answers *with
   probabilities*, the model name, and the doctrine version (`prose@2`) to the pass's report or the
   run's artifact. A judgment nobody can re-read is a judgment nobody can audit.
4. **Build criteria from canon, quote don't paraphrase.** The model only sees the question text, so
   the question must carry the meaning — but take that text from the authority (`Docs/canon/prose.md`,
   `encounter-pipeline/reference/nudge-authoring-spec.md`, the content-tag catalog), not from a
   hand-written summary. A doctrine `version` bump invalidates earlier judgments that cite it.
5. **Low confidence routes to a reader.** Use the probability to order the worklist. Thresholds are
   calibrated on our own content (THR-1723 sets the first), never copied from a cookbook.
6. **The key stays local.** `TYPESAFE_API_KEY` from the environment; never in a file, a log, a
   commit, a Linear comment or a chat message.

## The judgment catalogue

Each row names a judgment, the step that may run it, and the blind spot it covers. A use not on
this list is fine to try. Add the row here when it proves useful, rather than in the calling skill.

| Judgment | Primitive | Runs at | What our existing checks cannot see |
|---|---|---|---|
| **Narrator mode.** Per prose field: is this a game-master's account of events, or an inhabited scene (camera work, the reader placed in the moment)? | Noul | encounter-pipeline Step 2 (before editorial), template-encounter-rewrite step 6, template-context-rewrite Pass 3, attachment and undertaking editorial passes | `registerCompliance` is lexical (sentence length, ornate words, figurative markers). Short, plain, in-situ prose passes it. Mode is the drift three rulings failed to hold (Doctrine v2). |
| **Echo pre-screen.** Pairs of adjacent paragraphs or seams: do these repeat an image or a sentence shape? | Noul | before the fresh-context critic, any prose pass | The nudge spec says the detectors cannot see this class. Jev hands the critic the likely pairs; the critic still reads everything. |
| **Who acts.** Per player-facing choice, card face and intervention label: does the god act, the mortal act, or neither? | Choice | prose-content-systems quality check, template-encounter-rewrite | Nothing checks player-as-god framing mechanically. A label where the god chooses the mortal's action is a finding. |
| **Tag fit.** Per (entry, tag it wears): does the entry earn this tag as the catalog defines it? And per axis: which closed-vocabulary tag fits best, or none? | Noul, Choice | attachment-pipeline Pass 3, undertaking critic loop, encounter Pass 3 | `tag_vocabulary` proves the word exists, not that the entry earns it. Also the route to finding entries that should carry a DEAD tag. |
| **Claim vs write set.** Per outcome or completion sentence, given the write set the work actually performs: does the sentence claim a change the work does not write? | Noul | undertaking critic loop (REVISE trigger 5), encounter aftermath and consequence-chip prose | The Law 56 write-set lexicon matches words, not claims. "The guild will remember this" names no lexicon word and still claims state. |
| **Reach fit.** Per step: does the prose test the Reach the step declares, as the cosmology canon defines it? | Noul (or Choice over the 8 Reaches) | encounter-pipeline Pass 3, mislabel audits | Design conformance is a critic question today, so it is read once, per encounter, by hand. |
| **Coverage map.** Per entry: theme, Reach and Sphere, rolled up into a grid of crowded and empty cells | Choice, Score | encounter-pipeline Step 0a ("assess what the corpus needs"), undertaking Stage 0 gap weighting | The kind × CRUD grid is structural. Nothing measures what the corpus is *about*. **THR-1723** built this run: `npm run judge:encounters`, artifact `origin/ops:Docs/ops/content-judgments/encounter-coverage.json`. |
| **Fragment distinctness.** Pairs of composed samples from one skeleton: same scene in different words, or different scenes? | Noul | template-context-rewrite Pass 3 | `enumerateTemplateSurfaces` counts surfaces. It cannot tell whether they read differently. |

**Corpus note:** the register scorer's corpus (`collectAuthoredProse`) does not sweep step
afterimages, so afterimage register is unchecked. A Jev narrator-mode or register screen over
afterimage fields covers that gap without touching the scorer.

## Writing a good question

Follow the skill's guidance: **one narrow judgment per question**. Use named JSON state (the entry
id, the field name, the text, the tag's catalog definition), and include a no-match outcome where
nothing may fit. Ask independent questions over the same state in one request, because they run in
parallel. A Noul near 0.5 means "the model is torn", not "half-inhabited". Treat it as a reason to read
the entry, never as a score to average.
