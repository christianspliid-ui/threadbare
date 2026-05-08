import { encounterContractSchema } from './encounter-contract-validators';
import type { EncounterContract } from '../types/encounter-contract';

export type LintRuleId = 'R1' | 'R2' | 'R3' | 'R4' | 'R5' | 'zod';
export type LintSeverity = 'error' | 'warning';

export interface LintIssue {
  readonly source: string;
  readonly path: readonly (string | number)[];
  readonly rule_id: LintRuleId;
  readonly severity: LintSeverity;
  readonly message: string;
}

export interface GraphRegistry {
  readonly nodeIds: ReadonlySet<string>;
  readonly contentIds: ReadonlySet<string>;
}

export const PROBABILITY_PHRASES: readonly string[] = [
  'likely',
  'unlikely',
  'probably',
  'chance',
  'odds',
  'percent',
  '%',
  'probability',
];

export const PROSE_QUALITY_FLAGS: readonly string[] = [
  'inexorable',
  'ineffable',
  'transcendent',
  'sublime',
  'eldritch',
  'otherworldly',
  'gossamer',
  'ephemeral',
  'ethereal',
  'primordial',
  'ancient beyond reckoning',
  'shimmering',
  'gleaming',
  'glistening',
  'glittering',
  'scintillating',
  'whisper of fate',
  'hand of destiny',
  'weaver of threads',
  'mortal coil',
  'sea of stars',
  'tapestry of',
];

export const PROSE_QUALITY_WARN_THRESHOLD = 3;
export const PROSE_QUALITY_LOUD_WARN_THRESHOLD = 6;
export const PROSE_QUALITY_REMINDER =
  'Prose quality bar: meeting-encounter prose. See Vision/taste-profile.md.';

const DIGIT_REGEX = /\d/;

export function emptyRegistry(): GraphRegistry {
  return { nodeIds: new Set(), contentIds: new Set() };
}

function resolves(id: string, registry: GraphRegistry): boolean {
  return registry.nodeIds.has(id) || registry.contentIds.has(id);
}

function flaggedPhrasesIn(text: string): readonly string[] {
  const lower = text.toLowerCase();
  const hits: string[] = [];
  for (const flag of PROSE_QUALITY_FLAGS) {
    if (lower.includes(flag)) {
      hits.push(flag);
    }
  }
  return hits;
}

function probabilityPhrasesIn(text: string): readonly string[] {
  const lower = text.toLowerCase();
  const hits: string[] = [];
  for (const phrase of PROBABILITY_PHRASES) {
    if (lower.includes(phrase)) {
      hits.push(phrase);
    }
  }
  return hits;
}

export function lintEncounterContract(
  rawContract: unknown,
  registry: GraphRegistry,
  source: string,
): readonly LintIssue[] {
  const issues: LintIssue[] = [];

  const parsed = encounterContractSchema.safeParse(rawContract);
  if (!parsed.success) {
    for (const zodIssue of parsed.error.issues) {
      issues.push({
        source,
        path: zodIssue.path,
        rule_id: 'zod',
        severity: 'error',
        message: zodIssue.message,
      });
    }
    return issues;
  }

  const contract: EncounterContract = parsed.data;
  const payload = contract.encounter;
  const itemsRelevant = new Set(payload.protagonist_view.items_relevant);

  payload.beats.forEach((beat, beatIndex) => {
    // R1 — Tooltip references resolve to graph entities.
    for (const [phrase, entityId] of Object.entries(beat.prose_tooltips)) {
      if (!resolves(entityId, registry)) {
        issues.push({
          source,
          path: ['beats', beatIndex, 'prose_tooltips', phrase],
          rule_id: 'R1',
          severity: 'error',
          message: `tooltip "${phrase}" → "${entityId}" not in world-model.json or content registry`,
        });
      }
    }

    // R2 — consumes_item references an item the actor can have.
    beat.encounter_choices.forEach((choice, choiceIndex) => {
      if (!choice.consumes_item) return;
      const itemId = choice.consumes_item;
      if (itemsRelevant.has(itemId)) return;
      if (resolves(itemId, registry)) return;
      issues.push({
        source,
        path: ['beats', beatIndex, 'encounter_choices', choiceIndex, 'consumes_item'],
        rule_id: 'R2',
        severity: 'error',
        message: `consumes_item "${itemId}" not in protagonist_view.items_relevant or world model`,
      });
    });

    // R3 — forecast_factors strings contain no digits.
    beat.forecast_factors.forEach((factor, factorIndex) => {
      if (DIGIT_REGEX.test(factor)) {
        issues.push({
          source,
          path: ['beats', beatIndex, 'forecast_factors', factorIndex],
          rule_id: 'R3',
          severity: 'error',
          message: `forecast factor contains digit: "${factor}"`,
        });
      }

      // R4 — forecast_factors strings contain no probability words.
      const probHits = probabilityPhrasesIn(factor);
      if (probHits.length > 0) {
        issues.push({
          source,
          path: ['beats', beatIndex, 'forecast_factors', factorIndex],
          rule_id: 'R4',
          severity: 'error',
          message: `forecast factor contains probability phrase(s) [${probHits.join(', ')}]: "${factor}"`,
        });
      }
    });

    // R5 — Prose quality soft heuristic on per-beat prose + aftermath receipt.
    const corpus = `${beat.prose}\n${payload.aftermath.receipt}`;
    const flagged = flaggedPhrasesIn(corpus);
    if (flagged.length >= PROSE_QUALITY_LOUD_WARN_THRESHOLD) {
      issues.push({
        source,
        path: ['beats', beatIndex, 'prose'],
        rule_id: 'R5',
        severity: 'warning',
        message: `${flagged.length} flagged phrases (LOUD) — ${flagged.join(', ')}. ${PROSE_QUALITY_REMINDER}`,
      });
    } else if (flagged.length >= PROSE_QUALITY_WARN_THRESHOLD) {
      issues.push({
        source,
        path: ['beats', beatIndex, 'prose'],
        rule_id: 'R5',
        severity: 'warning',
        message: `${flagged.length} flagged phrases — ${flagged.join(', ')}. ${PROSE_QUALITY_REMINDER}`,
      });
    }
  });

  return issues;
}

export function summarize(issues: readonly LintIssue[]): { errors: number; warnings: number } {
  let errors = 0;
  let warnings = 0;
  for (const issue of issues) {
    if (issue.severity === 'error') errors += 1;
    else if (issue.severity === 'warning') warnings += 1;
  }
  return { errors, warnings };
}

export function formatIssue(issue: LintIssue): string {
  const tag = issue.severity === 'error' ? 'ERROR' : 'WARN ';
  const pathStr = issue.path
    .map((seg) => (typeof seg === 'number' ? `[${seg}]` : `.${seg}`))
    .join('')
    .replace(/^\./, '');
  return `${tag} ${issue.source}\n  ${pathStr || '(root)'}: ${issue.message} (${issue.rule_id})`;
}
