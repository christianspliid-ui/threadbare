/**
 * The aftermath page, assembled as the player reads it. THR-1474.
 *
 * ─── Why this module exists ──────────────────────────────────────────
 * Every stage of the encounter pipeline read the aftermath one *field* at a
 * time. The editorial critic's seam check (gate 4b) reads paragraph boundaries —
 * opening→spine, spine→band. `check:encounter` runs per-field detectors. Live
 * proof checks that declared blocks *arrive* in a running world, not how they
 * read together. So the page as a player meets it — the overview, then every
 * chip's caption in category order, then the reactions offered underneath — was
 * never assembled anywhere and therefore never read as one text.
 *
 * That is how the Snow on the Pass overview and its `EXHAUSTED` chip came to
 * tell the same fact twice with every gate green. Christian, on that sitting:
 * *"I am wondering if we even have a holistic test of all the aftermath text,
 * where the agent reads all the text on the page together, and makes sure there
 * is no repetition, verbosity, or conflict in the prose?"* The answer was no.
 *
 * ─── One assembly, three readers ─────────────────────────────────────
 * The page is built once, here, and read by three callers that would otherwise
 * each derive their own idea of what the page is:
 *
 *   1. {@link pageOverlapFindings} — the machine arm, warn-level, reporting a
 *      four-word run shared between any two blocks.
 *   2. {@link renderAftermathPage} — the batch report, so a human reviewer reads
 *      what the player reads instead of a field list.
 *   3. The editorial critic's **Page read** step, which reads the same rendering
 *      and judges the three things no n-gram can: repetition in fresh words,
 *      verbosity, and conflict.
 *
 * ─── What the machine arm can and cannot see ─────────────────────────
 * An n-gram overlap is a **lower bound on retelling, never a proof of its
 * absence** — the same caveat `CHIP_OVERVIEW_OVERLAP_RUN_WORDS` carries. A chip
 * that paraphrases the overview in fresh words passes this and is still
 * redundant; a chip that *contradicts* the overview shares no run at all. Both
 * residues are the critic's, which is why the doctrine half of THR-1474 is a
 * reading step and not another detector.
 *
 * Warn-level, and the clamp-follows-the-corpus rule (`nudgeAuthoringConstants.ts`,
 * the THR-1225 lesson) says it stays that way until the retrofit corpus is
 * drained. Gating now would turn the board red for work nobody has been asked to
 * do yet.
 */

import type {
  EncounterAftermathChange,
  UnifiedActionOutcome,
  UnifiedActionTemplate,
} from '../../types/unifiedAction';
import { aftermathFaces, type AftermathFace } from './compositionContract';
import { CHIP_OVERVIEW_OVERLAP_RUN_WORDS } from './nudgeAuthoringConstants';
import { wordRuns, wordsOf } from './proseWords';

/**
 * The order the ending draws its categories in.
 *
 * A literal copy of `CONSEQUENCE_CATEGORY_ORDER` from
 * `src/components/Game/encounter-stage/adapters/buildAftermathConsequences.ts`
 * (THR-1136 — *what it cost, who it changed, what was earned, what it opened*),
 * and the one duplicated constant in this module, on purpose: `content-eval` is
 * imported by `scripts/` under `--experimental-strip-types`, and reaching into
 * `src/components/` from here would drag the React adapter and its whole import
 * tree into every CLI check that loads this file.
 *
 * Pinned against the adapter's own constant by a test, so the copy cannot drift
 * silently — the drift would be visible only as a batch report whose page order
 * disagrees with the screen, which is exactly the class of error this module was
 * built to stop.
 */
export const AFTERMATH_PAGE_CATEGORY_ORDER: readonly string[] = ['scar', 'bond', 'boon', 'path'];

/** Which surface a block is — the three the page draws, in the order it draws them. */
export type AftermathPageBlockKind = 'overview' | 'chip' | 'reaction';

/** One readable block of an assembled page. */
export interface AftermathPageBlock {
  readonly kind: AftermathPageBlockKind;
  /**
   * How a finding names this block: `overview`, `chip 'slice.x'`,
   * `reaction 'slice.y'`. Carries the authored id so an author can go straight
   * to the line, rather than a position that shifts when a sibling is added.
   */
  readonly label: string;
  /** The block's prose, as one string — what the reader reads, punctuation and all. */
  readonly text: string;
}

/** One (variant × band) ending, assembled top to bottom. */
export interface AftermathPage {
  readonly variantKey: string;
  readonly band?: UnifiedActionOutcome;
  /** `variantKey/band`, or the bare `variantKey` for the base face. */
  readonly where: string;
  readonly blocks: readonly AftermathPageBlock[];
}

/**
 * The sentence a chip draws — `causeClause` then `detail`, joined by the em-dash
 * `EncounterVeil` puts between them.
 *
 * Deliberately the same composition `chipSentenceOf` in `doctrineV2Checks`
 * performs; that one is re-exported from there for THR-1473's own callers and
 * both read the same two fields in the same order. Kept local rather than
 * imported because `doctrineV2Checks` imports *this* module, and the edge in the
 * other direction would close a cycle.
 */
function chipSentence(change: EncounterAftermathChange): string {
  return [change.causeClause?.trim(), change.detail?.trim()].filter(Boolean).join(' — ');
}

/**
 * A reaction as the page draws it: the label the player clicks, then the intent
 * line under it.
 *
 * Both are player-facing prose on the same page and are read as one block,
 * because a label and its own intent restating each other is the same defect as
 * a chip restating its overview — and splitting them into two blocks would
 * report that ordinary case as a finding on every well-written reaction.
 */
function reactionText(reaction: { readonly label: string; readonly intent?: string }): string {
  return [reaction.label?.trim(), reaction.intent?.trim()].filter(Boolean).join(' ');
}

/** Rank chips for the page's reading order: category first, emission order within it. */
function categoryRank(change: EncounterAftermathChange): number {
  const index = AFTERMATH_PAGE_CATEGORY_ORDER.indexOf(String(change.category));
  return index === -1 ? AFTERMATH_PAGE_CATEGORY_ORDER.length : index;
}

/**
 * Assemble one face into the page it renders.
 *
 * **Ordering is category then emission order**, which is the adapter's rule
 * minus its middle term. The adapter sorts *category → drawn magnitude →
 * emission order* (THR-1136 §4), and the magnitude it sorts on is the delta
 * cluster the engine resolves at runtime — a quantity no static read of a
 * template can compute. Reproducing two of the three terms is the honest
 * approximation, and it costs nothing where it matters: the overlap judgment is
 * pairwise and order-independent, so only the batch report's display order can
 * differ, and only among chips of the same category.
 *
 * **Uncategorised changes are skipped.** They draw no `CATEGORY · NOUN` tag and
 * no caption beside it, so their text is not on the page the player reads —
 * matching the scope `chipStateNounWordingViolations` and `chipSentenceProblems`
 * already use.
 *
 * A block with no text is dropped rather than carried empty: a face whose
 * variant authored no overview renders no overview paragraph, and a phantom
 * empty block would give the critic a blank line to judge.
 */
export function assembleAftermathPage(face: AftermathFace): AftermathPage {
  const blocks: AftermathPageBlock[] = [];

  if (face.overview.trim()) {
    blocks.push({ kind: 'overview', label: 'overview', text: face.overview.trim() });
  }

  const chips = face.changes
    .map((change, index) => ({ change, index }))
    .filter(entry => Boolean(entry.change.category))
    .sort((a, b) => categoryRank(a.change) - categoryRank(b.change) || a.index - b.index);

  for (const { change } of chips) {
    const text = chipSentence(change);
    if (!text) continue;
    blocks.push({ kind: 'chip', label: `chip '${change.id}'`, text });
  }

  for (const reaction of face.reactions) {
    const text = reactionText(reaction);
    if (!text) continue;
    blocks.push({ kind: 'reaction', label: `reaction '${reaction.id}'`, text });
  }

  return { variantKey: face.variantKey, band: face.band, where: whereOf(face), blocks };
}

/** `variantKey/band`, or the bare key for the base face. Matches THR-1473's finding prefix. */
function whereOf(face: AftermathFace): string {
  return face.band ? `${face.variantKey}/${face.band}` : face.variantKey;
}

/** Every ending this template can render, each assembled as its page. */
export function assembleAftermathPages(
  template: UnifiedActionTemplate,
): readonly AftermathPage[] {
  return aftermathFaces(template).map(assembleAftermathPage);
}

/**
 * The page as a reviewer should read it — a plain markdown rendering for the
 * batch report and the critic's Page read step.
 *
 * No field names, no ids in the body: the point of the artifact is that it reads
 * like a page rather than a config dump, because a reviewer given a field list
 * goes on reading field by field, which is the habit that let the defect through.
 * The labels stay available on {@link AftermathPageBlock} for findings.
 */
export function renderAftermathPage(page: AftermathPage): string {
  if (page.blocks.length === 0) return `_(${page.where} renders no prose)_`;

  const lines: string[] = [];
  for (const block of page.blocks) {
    if (block.kind === 'overview') lines.push(block.text);
    if (block.kind === 'chip') lines.push(`- ${block.text}`);
    if (block.kind === 'reaction') lines.push(`> ${block.text}`);
  }
  return lines.join('\n\n');
}

/**
 * THR-1474 — any four-word run two blocks on the same page share.
 *
 * **The pair the overview makes with a chip is deliberately excluded**, and this
 * is the one place this check knowingly reports less than its ticket's letter
 * asked for. `chipSentenceProblems` (THR-1473, landed first) already reports
 * exactly that pair, with a message written for it — *"the chip names the state
 * that changed"* — and both checks print into the same warn channel. Reporting
 * it from here as well would tell an author to fix one sentence twice, which is
 * the dedup rule THR-1473 applied to its own band inheritance for the same
 * reason. Coverage of the pair is unchanged; only the reporter is.
 *
 * What is new here is every other pair on the page: **chip ↔ chip** (two
 * consequences telling the same beat), **chip ↔ reaction** (a reaction offering
 * back what a chip already stated), **overview ↔ reaction**, and **reaction ↔
 * reaction** (two stances phrased as one).
 *
 * Reported per `(page, pair)` and not deduplicated across bands: a change
 * inherited by three bands sits under a different overview and beside different
 * siblings on each, so the same two ids can be clean on one page and repetitive
 * on the next — and only the page names which.
 */
export function pageOverlapFindings(template: UnifiedActionTemplate): readonly string[] {
  const findings: string[] = [];

  for (const page of assembleAftermathPages(template)) {
    const runs = page.blocks.map(block => ({
      block,
      runs: wordRuns(block.text, CHIP_OVERVIEW_OVERLAP_RUN_WORDS),
    }));

    for (let i = 0; i < runs.length; i += 1) {
      for (let j = i + 1; j < runs.length; j += 1) {
        const left = runs[i];
        const right = runs[j];

        // THR-1473's arm owns this pair; see the note above.
        if (left.block.kind === 'overview' && right.block.kind === 'chip') continue;

        const shared = [...left.runs].filter(run => right.runs.has(run));
        if (shared.length === 0) continue;

        findings.push(
          `${left.block.label} and ${right.block.label} on ${page.where} share `
            + `${shared.map(run => `'${run}'`).join(', ')} — the page tells one fact twice. `
            + 'Each block on an ending earns its place by adding something the blocks '
            + 'above it did not carry (THR-1474)',
        );
      }
    }
  }

  return findings;
}

/**
 * Words the whole page spends, per ending — the verbosity signal the critic's
 * Page read step is pointed at.
 *
 * Reported by the batch report rather than as a finding: there is no defensible
 * budget for a page (an ending with four chips legitimately runs longer than one
 * with a single chip), so a threshold here would be a number invented to look
 * like a rule. A reviewer comparing bands of the same encounter can see an
 * outlier without one.
 */
export function aftermathPageWordCount(page: AftermathPage): number {
  return page.blocks.reduce((sum, block) => sum + wordsOf(block.text).length, 0);
}
