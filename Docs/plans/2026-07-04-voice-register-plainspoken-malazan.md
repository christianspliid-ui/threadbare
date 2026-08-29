---
status: current
issue: THR-609
supersedes: none (amends the voice section of Docs/canon/prose.md)
---

# Voice Register Calibration — Plainspoken Malazan

> **`status: current`, with one section superseded in part.** The three-register model is live canon. Its **peak-surface list** (§ 3 below) was narrowed by Prose Doctrine v2 on 2026-08-25 — encounter surfaces no longer qualify for peak. Read § 3's banner before authoring against it; [`Docs/canon/prose.md`](../canon/prose.md) wins on any disagreement.

**User verdict (Christian, 2026-07-04, chat — settled):** In-game voice must be simpler in tone while keeping the Malazan-esque vibe. Malazan is not high lyrical literature all the time — its funny parts use plain language. Make plainness the baseline; lyricism is the rationed exception, not the default.

This resolves the long-standing tension between the Vision's "dense and particular" prose and the recorded feedback that in-game prose/labels are too literary and hurt comprehension. Both were right; the register model below is the reconciliation.

## The Register Model (canon once this ships)

Three registers. Every player-facing string belongs to exactly one.

**1. Baseline narration (default — the large majority of words the player reads).**
Plain, concrete, active. Short-to-medium sentences, one idea each. Concrete nouns and verbs over abstractions. Dry understatement and deadpan humor are the preferred texture — this is the squad-banter register of Malazan (soldiers talking around a fire), not the Kharkanas register. Stacked metaphors, archaic diction, and ornamental subordinate clauses are drift.

**2. Character voice (dialogue and agent-attributed lines).**
Idiosyncratic per persona, but comprehension-first: wit over ornament. A character may be florid *as characterization* (sparingly, one per scene, the Kruppe allowance), but the narration around them stays baseline.

**3. Peak register (rationed lyricism).**
Reserved for designated **non-encounter** surfaces: doom stage transitions, Twilight Phase, World-Soul/Echo prose. Here the cosmic-melancholy lyric is earned. Budget: at most one figurative image per paragraph; sentence rhythm may stretch. Rare vocabulary allowed only if the sentence glosses it in context.

> *Superseded in part 2026-08-25, marked 2026-08-29 (THR-1324).* The register model itself is live and this doc remains its origin — but the peak list above previously also granted *"encounter climax steps (final step of branching encounters), major aftermath beats"*. **Prose Doctrine v2 revoked peak on every encounter surface**: encounter prose is narrator mode throughout, climaxes included. See [`Docs/canon/prose.md` § Narrator mode](../canon/prose.md), which is authoritative over this page wherever the two disagree.

**Hard rule — interactive text is always plain.** Choice labels, action card names, buttons, IPK keywords, tooltips, panel headings: no metaphor, no archaic words, no ambiguity about what a click does. A player must never misread an affordance because the label was being literary. IPK keywords are the learning engine; they stay mechanical-plain.

**What stays from the existing voice rules (unchanged):** no exclamation marks; wear and age over polish; the uncanny over the fantastic; dry wit over comedy; one vivid detail earns its keep. The existing rules already point this way — this plan makes the *default register* explicit and enforceable, because content has been drifting lyrical in practice despite them.

## Alternatives considered

- *Simplify everything uniformly* — rejected: flattens the doom/twilight peaks the Vision's emotional register depends on. Long prose remains a feature (reader + TTS audience); this is a diction calibration, not a length cut.
- *Per-surface style guides without a scorer* — rejected: the drift happened under existing prose rules; without a measurable signal it recurs (NFP #2, inspectability applies to content quality too).
- *LLM-judged register at authoring time only* — kept as the editorial-pass layer (pipelines already do this), but the deterministic scorer is the floor that catches drift between editorial passes.

## Three Pillars

### Engine

Extend the prose-quality audit (`window.__DEBUG.proseQualityReport()` / `scoreProseEntry()`, THR-490 — pure, deterministic, static-library) with a **register compliance** dimension:

- `avgSentenceLength` — mean words/sentence per entry.
- `rareWordDensity` — fraction of tokens outside a bundled common-word list (`src/data/register-common-words.ts`, new, ~5k lemmas, plus a whitelist for game terms: reach/sphere names, UL terms, proper nouns from the graph).
- `figurativeDensity` — heuristic marker scan (like/as-constructions, known figurative verb list) per paragraph.
- `interactivePlainness` — separate check for label-class strings (action names, choice labels): max word count, no rare words, no figurative markers. Label-class detection via the template field type, not string heuristics.

Each entry gets `registerCompliance: pass | warn | fail` folded into the existing summary. **Register declaration mechanism (single, settled):** an additive optional `register?: 'baseline' | 'character' | 'peak'` field on content entries / template prose fields. Absent → `baseline`. No new graph nodes/edges; purely additive type field.

### Content

1. **Canon update** — rewrite the "Threadbare voice rules" section of `Docs/canon/prose.md` to the register model above; add register declaration guidance; bump last-reviewed. Update `Docs/canon/rulebook.md` only if it quotes voice rules (check; likely N/A).
2. **Skill updates** — voice sections of `prose-content-systems`, `prose-vignettes-and-enrichment`, `prose-pipeline`, `encounter-pipeline`, `template-encounter-rewrite`, `attachment-pipeline` (`.claude/skills/`, mirror `.agents/` via `npm run check:skill-sync:sync`). Bump `last_validated_against`. Editorial passes in the pipelines gain a register check: "is this line in its declared register?"
3. **Rewrite pass, ordered by player exposure:**
   - Pass A: all interactive/label text (action catalog names, choice labels, IPK keywords) — audit + rewrite to plainness rule.
   - Pass B: prose QA `bottomTail` entries + any entry scoring `registerCompliance: fail` at baseline.
   - Pass C: marquee entries re-checked — they must *exemplify* the new baseline (some current exemplars may be too lyrical for baseline; if so, re-tag them as peak-register exemplars, don't delete).
   - `Docs/exemplars.md`: add one baseline-register exemplar and one peak-register exemplar so authors see the contrast (also closes the "standalone prose exemplar TBD" open question in prose canon).

   **Rewrite guardrail (all passes):** rewrites must preserve enrichment placeholders (`{name}`, `{ally:…}`, conditional blocks) and the 3–5-variant minimum per content key. A rewrite that flattens a placeholder into a hardcoded name or collapses variants reintroduces rejected approaches and fails review regardless of register quality.

### UI

No new surface. DebugPanel Prose QA tab gains a `register` column and compliance badge (existing tab, one column). Browser-verify artifact via **Playwright** (DOM surface): `preview_resize(1920,1080)` + screenshot of the Prose QA tab showing the new column, `__DEBUG.proseQualityReport()` returning `registerCompliance` fields, console capture per DoD.

### Wiring

- Scorer: extend `src/debug-bridge.ts` prose-QA path + the pure scoring module it calls; no orchestrator/tick involvement (static-library audit).
- Content tables: register declarations ride existing template/type fields — no new graph nodes or edges (no schema change; load-bearing rules untouched).
- Skills + canon: doc-tree only.
- `Docs/plans/2026-04-16-systemic-wiring-guide.md`: no new engine capability for content authors → no update required (voice is canon, not wiring). Wiki: if a manual page quotes voice guidance, update in same PR (`npm run check:wiki-freshness`).

## Constants (all named, tunable)

| Constant | Default | Purpose |
|---|---|---|
| `BASELINE_MAX_AVG_SENTENCE_LEN` | 18 | Baseline register: mean words/sentence ceiling (warn above, fail at +25%) |
| `PEAK_MAX_AVG_SENTENCE_LEN` | 26 | Peak register ceiling |
| `BASELINE_RARE_WORD_DENSITY_MAX` | 0.015 | Rare-token fraction ceiling, baseline |
| `PEAK_RARE_WORD_DENSITY_MAX` | 0.04 | Rare-token fraction ceiling, peak |
| `PEAK_FIGURATIVE_IMAGES_PER_PARA` | 1 | Image budget, peak register |
| `BASELINE_FIGURATIVE_WARN_AT` | 1 | Baseline: figurative images per paragraph that trigger warn |
| `BASELINE_FIGURATIVE_FAIL_AT` | 2 | Baseline: figurative images per paragraph that trigger fail |
| `INTERACTIVE_LABEL_MAX_WORDS` | 6 | Label-class plainness word cap |
| `REGISTER_WARN_TO_FAIL_RATIO` | 1.25 | Multiplier from warn threshold to fail threshold |

Defaults are starting points; tune against the meeting-encounter exemplar (which must score `pass` at its declared registers) before the rewrite pass begins.

## Tracing

N/A at runtime (static audit; no tick-loop participation). The QA report itself is the inspection surface: `registerCompliance` per entry + summary counts, exported via existing `proseQualityReport()` shape (additive fields only).

## Fail-soft

| Failure | Behavior |
|---|---|
| Common-word list missing/unloadable | `registerCompliance: skipped`, report notes reason; never throws |
| Entry lacks register declaration | Treated as `baseline` (strictest common case), flagged `undeclared` |
| Figurative heuristic false positives | Warn-level only unless ≥2 markers; heuristic list is a named constant table, tunable |
| Label-class detection misses a field type | Field falls back to baseline scoring; add type to the label-class list (constant) |

## NFP Compliance

| NFP | Verdict |
|---|---|
| 1 Tunability | PASS — all thresholds named constants |
| 2 Inspectability | PASS — per-entry compliance verdicts with reasons in QA report |
| 3 Determinism | PASS — pure static scoring, no randomness, no LLM at runtime |
| 4 Fail-soft | PASS — skipped/undeclared paths, never throws |
| 5 Narrative over mechanical | PASS with note — the scorer serves the voice, not vice versa; editorial pass retains override authority (a `warn` with editorial sign-off ships; `fail` requires rewrite or register re-declaration) |
| 6 Additive | PASS — additive report fields, additive template metadata; no removals |
| 7 Performance budget | PASS — dev-only static audit, tree-shaken in prod |

## Sequencing (one PR per step is fine)

1. Canon + skills update (so all in-flight authoring — THR-571 C1 prose, THR-573 volume grammar — lands in the right register from day one).
2. Scorer extension + exemplar calibration.
3. Rewrite passes A → B → C.

## Forked-audit verdicts

Combined intent-judge + NFP/three-pillar/Vision audit (2026-07-04, subagent): initial verdict **Revise** with three required fixes — (1) register-declaration mechanism ambiguity, (2) missing placeholder/variant rewrite guardrail, (3) figurative-constant split + verify-tool naming. All three integrated above. Intent finding: faithful to the user ask, plainness enforced as baseline, no scope inversion; scorer justified as extension of existing THR-490 audit with editorial override preserving NFP #5. Vision finding: safe — diction calibration, not a length cut; peak register preserves cosmic melancholy. Post-fix status: **Allow**.

## Before/after register examples (authoring reference)

- Label, wrong: "Beseech the Sundered Veil" → right: "Part the Veil".
- Baseline, wrong: "The merchant's ambit had grown parlous, freighted with the weight of unspoken covenants." → right: "The merchant owed too many people too much. He'd started checking the door."
- Peak (allowed, doom transition): "The bells stopped. Whatever had been holding its breath beneath the city let it out."
