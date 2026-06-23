#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { parseEncounterContract } from '../src/data/encounter-contract-validators';
import {
  BAD_ENCOUNTER_CONTENT_LINT_FIXTURES,
  GOOD_ENCOUNTER_CONTENT_LINT_FIXTURES,
  type EncounterContentLintFixture,
} from '../src/data/__fixtures__/encounter-content-lint/index';
import { UNIFIED_ACTION_TEMPLATES } from '../src/data/unified-action-templates';
import { adaptUnifiedActionTemplateToEncounterContract } from '../src/engine/encounter-contract-adapter';
import {
  FLOWERY_PHRASES,
  FORECAST_DIGIT_PATTERN,
  PROBABILITY_PHRASES,
  PROSE_LOUD_WARNING_THRESHOLD,
  PROSE_WARNING_THRESHOLD,
} from '../src/engine/content-eval/detectors';
import type { EncounterContract } from '../src/types/encounter-contract';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WORLD_MODEL_PATH = path.join(repoRoot, 'src', 'data', 'world-model.json');
const DATA_ROOT = path.join(repoRoot, 'src', 'data');

export { PROSE_WARNING_THRESHOLD, PROSE_LOUD_WARNING_THRESHOLD };

export type EncounterLintSeverity = 'error' | 'warning';
export type EncounterLintRuleId = 'R1' | 'R2' | 'R3' | 'R4' | 'R5' | 'SCHEMA' | 'SYSTEM';
export type EncounterLintTarget =
  | 'templates-and-good'
  | 'templates'
  | 'good'
  | 'bad'
  | 'all-fixtures'
  | `bad:${string}`;

export interface EncounterLintIssue {
  readonly severity: EncounterLintSeverity;
  readonly ruleId: EncounterLintRuleId;
  readonly source: string;
  readonly encounterId: string;
  readonly path: readonly (string | number)[];
  readonly message: string;
}

export interface EncounterLintSummary {
  readonly contractCount: number;
  readonly errorCount: number;
  readonly warningCount: number;
}

export interface EncounterLintRunResult {
  readonly issues: readonly EncounterLintIssue[];
  readonly summary: EncounterLintSummary;
}

interface WorldModelNode {
  readonly id: string;
  readonly category?: string;
  readonly subcategory?: string;
  readonly properties?: Record<string, unknown>;
}

interface EncounterLintContractInput {
  readonly source: string;
  readonly contract: EncounterContract;
}

interface EncounterLintCorpus {
  readonly inputs: readonly EncounterLintContractInput[];
  readonly preflightIssues: readonly EncounterLintIssue[];
}

interface GraphRegistry {
  readonly nodeIds: Set<string>;
  readonly contentIds: Set<string>;
  readonly nodesById: Map<string, WorldModelNode>;
}

interface LintContext {
  readonly source: string;
  readonly encounterId: string;
}

function toPathString(pathParts: readonly (string | number)[]): string {
  if (pathParts.length === 0) {
    return '(root)';
  }
  return pathParts
    .map((part) => (typeof part === 'number' ? `[${part}]` : /^[A-Za-z_]\w*$/.test(part) ? `.${part}` : `["${part}"]`))
    .join('')
    .replace(/^\./, '');
}

function makeIssue(
  context: LintContext,
  severity: EncounterLintSeverity,
  ruleId: EncounterLintRuleId,
  message: string,
  pathParts: readonly (string | number)[] = [],
): EncounterLintIssue {
  return {
    severity,
    ruleId,
    source: context.source,
    encounterId: context.encounterId,
    path: pathParts,
    message,
  };
}

function isTsFile(filePath: string): boolean {
  return filePath.endsWith('.ts') && !filePath.endsWith('.test.ts');
}

function collectDataTsFiles(root: string): string[] {
  const files: string[] = [];
  const queue: string[] = [root];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      continue;
    }

    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) {
        queue.push(absolute);
        continue;
      }
      if (entry.isFile() && isTsFile(absolute)) {
        files.push(absolute);
      }
    }
  }

  return files;
}

function loadGraphRegistryForLint(): GraphRegistry {
  const worldModelContent = fs.readFileSync(WORLD_MODEL_PATH, 'utf8');
  const parsed = JSON.parse(worldModelContent) as { nodes?: WorldModelNode[] };
  const nodes = Array.isArray(parsed.nodes) ? parsed.nodes : [];

  const nodeIds = new Set<string>();
  const nodesById = new Map<string, WorldModelNode>();
  for (const node of nodes) {
    if (typeof node?.id !== 'string' || node.id.length === 0) {
      continue;
    }
    nodeIds.add(node.id);
    nodesById.set(node.id, node);
  }

  const contentIds = new Set<string>();
  const idPattern = /\bid\s*:\s*['"`]([^'"`]+)['"`]/g;
  const files = collectDataTsFiles(DATA_ROOT);
  for (const filePath of files) {
    const source = fs.readFileSync(filePath, 'utf8');
    let match: RegExpExecArray | null = idPattern.exec(source);
    while (match) {
      contentIds.add(match[1]);
      match = idPattern.exec(source);
    }
  }

  return {
    nodeIds,
    contentIds,
    nodesById,
  };
}

function resolvesId(id: string, registry: GraphRegistry): boolean {
  return registry.nodeIds.has(id) || registry.contentIds.has(id);
}

function isResolvableItemId(id: string, registry: GraphRegistry): boolean {
  if (!resolvesId(id, registry)) {
    return false;
  }
  if (id.startsWith('item.') || id.includes('.item.')) {
    return true;
  }
  const node = registry.nodesById.get(id);
  if (!node) {
    return false;
  }
  const category = (node.category ?? '').toLowerCase();
  const subcategory = (node.subcategory ?? '').toLowerCase();
  return category.includes('item') || subcategory.includes('item');
}

function lintR1(context: LintContext, contract: EncounterContract, registry: GraphRegistry): EncounterLintIssue[] {
  const issues: EncounterLintIssue[] = [];
  contract.encounter.beats.forEach((beat, beatIndex) => {
    Object.entries(beat.prose_tooltips).forEach(([phrase, id]) => {
      if (!resolvesId(id, registry)) {
        issues.push(
          makeIssue(
            context,
            'error',
            'R1',
            `${id} is not in world-model.json or content registry`,
            ['encounter', 'beats', beatIndex, 'prose_tooltips', phrase],
          ),
        );
      }
    });
  });
  return issues;
}

function lintR2(context: LintContext, contract: EncounterContract, registry: GraphRegistry): EncounterLintIssue[] {
  const issues: EncounterLintIssue[] = [];
  const relevantItems = new Set(contract.encounter.protagonist_view.items_relevant);
  contract.encounter.beats.forEach((beat, beatIndex) => {
    beat.encounter_choices.forEach((choice, choiceIndex) => {
      if (!choice.consumes_item) {
        return;
      }
      if (relevantItems.has(choice.consumes_item)) {
        return;
      }
      if (isResolvableItemId(choice.consumes_item, registry)) {
        return;
      }
      issues.push(
        makeIssue(
          context,
          'error',
          'R2',
          `${choice.consumes_item} is not in protagonist_view.items_relevant and does not resolve as an item node`,
          ['encounter', 'beats', beatIndex, 'encounter_choices', choiceIndex, 'consumes_item'],
        ),
      );
    });
  });
  return issues;
}

function lintR3(context: LintContext, contract: EncounterContract): EncounterLintIssue[] {
  const issues: EncounterLintIssue[] = [];
  contract.encounter.beats.forEach((beat, beatIndex) => {
    beat.forecast_factors.forEach((factor, factorIndex) => {
      if (!FORECAST_DIGIT_PATTERN.test(factor)) {
        return;
      }
      issues.push(
        makeIssue(
          context,
          'error',
          'R3',
          `forecast factor contains digits: "${factor}"`,
          ['encounter', 'beats', beatIndex, 'forecast_factors', factorIndex],
        ),
      );
    });
  });
  return issues;
}

function lintR4(context: LintContext, contract: EncounterContract): EncounterLintIssue[] {
  const issues: EncounterLintIssue[] = [];
  contract.encounter.beats.forEach((beat, beatIndex) => {
    beat.forecast_factors.forEach((factor, factorIndex) => {
      const normalized = factor.toLowerCase();
      const matchedPhrase = PROBABILITY_PHRASES.find((phrase) => normalized.includes(phrase));
      if (!matchedPhrase) {
        return;
      }
      issues.push(
        makeIssue(
          context,
          'error',
          'R4',
          `forecast factor contains probability phrase "${matchedPhrase}"`,
          ['encounter', 'beats', beatIndex, 'forecast_factors', factorIndex],
        ),
      );
    });
  });
  return issues;
}

function lintR5(context: LintContext, contract: EncounterContract): EncounterLintIssue[] {
  const issues: EncounterLintIssue[] = [];
  const receipt = contract.encounter.aftermath.receipt.toLowerCase();
  contract.encounter.beats.forEach((beat, beatIndex) => {
    const prose = beat.prose.toLowerCase();
    const matched = FLOWERY_PHRASES.filter((phrase) => prose.includes(phrase) || receipt.includes(phrase));
    if (matched.length < PROSE_WARNING_THRESHOLD) {
      return;
    }

    const severityLabel = matched.length >= PROSE_LOUD_WARNING_THRESHOLD ? 'high' : 'moderate';
    issues.push(
      makeIssue(
        context,
        'warning',
        'R5',
        `flowery-phrase count ${matched.length} (${severityLabel}): ${matched.join(', ')}. Prose quality bar: meeting-encounter prose. See Vision/taste-profile.md.`,
        ['encounter', 'beats', beatIndex, 'prose'],
      ),
    );
  });
  return issues;
}

function lintOneContract(
  context: LintContext,
  contract: EncounterContract,
  registry: GraphRegistry,
): EncounterLintIssue[] {
  return [
    ...lintR1(context, contract, registry),
    ...lintR2(context, contract, registry),
    ...lintR3(context, contract),
    ...lintR4(context, contract),
    ...lintR5(context, contract),
  ];
}

function fixtureToInput(fixture: EncounterContentLintFixture): EncounterLintContractInput {
  return {
    source: fixture.source,
    contract: fixture.contract,
  };
}

function collectTemplateCorpus(): EncounterLintCorpus {
  const inputs: EncounterLintContractInput[] = [];
  const preflightIssues: EncounterLintIssue[] = [];

  for (const template of UNIFIED_ACTION_TEMPLATES) {
    try {
      inputs.push({
        source: `template:${template.id}`,
        contract: adaptUnifiedActionTemplateToEncounterContract(template),
      });
    } catch (error) {
      preflightIssues.push(
        makeIssue(
          {
            source: `template:${template.id}`,
            encounterId: template.id,
          },
          'warning',
          'SYSTEM',
          `skipping template because adapter could not produce a contract: ${error instanceof Error ? error.message : String(error)}`,
        ),
      );
    }
  }

  return { inputs, preflightIssues };
}

function buildEncounterContentLintCorpus(target: EncounterLintTarget): EncounterLintCorpus {
  if (target === 'templates') {
    return collectTemplateCorpus();
  }
  if (target === 'good') {
    return {
      inputs: GOOD_ENCOUNTER_CONTENT_LINT_FIXTURES.map(fixtureToInput),
      preflightIssues: [],
    };
  }
  if (target === 'bad') {
    return {
      inputs: BAD_ENCOUNTER_CONTENT_LINT_FIXTURES.map(fixtureToInput),
      preflightIssues: [],
    };
  }
  if (target === 'all-fixtures') {
    return {
      inputs: [...GOOD_ENCOUNTER_CONTENT_LINT_FIXTURES, ...BAD_ENCOUNTER_CONTENT_LINT_FIXTURES].map(fixtureToInput),
      preflightIssues: [],
    };
  }
  if (target.startsWith('bad:')) {
    const name = target.slice('bad:'.length);
    const fixture = BAD_ENCOUNTER_CONTENT_LINT_FIXTURES.find((candidate) => candidate.name === name);
    if (!fixture) {
      throw new Error(`unknown bad fixture "${name}"`);
    }
    return {
      inputs: [fixtureToInput(fixture)],
      preflightIssues: [],
    };
  }
  const templates = collectTemplateCorpus();
  return {
    inputs: [...templates.inputs, ...GOOD_ENCOUNTER_CONTENT_LINT_FIXTURES.map(fixtureToInput)],
    preflightIssues: [...templates.preflightIssues],
  };
}

function summarizeIssues(contractCount: number, issues: readonly EncounterLintIssue[]): EncounterLintSummary {
  const errorCount = issues.filter((issue) => issue.severity === 'error').length;
  const warningCount = issues.filter((issue) => issue.severity === 'warning').length;
  return {
    contractCount,
    errorCount,
    warningCount,
  };
}

export function runEncounterContentLint(target: EncounterLintTarget = 'templates-and-good'): EncounterLintRunResult {
  let registry: GraphRegistry;
  try {
    registry = loadGraphRegistryForLint();
  } catch (error) {
    const issue: EncounterLintIssue = {
      severity: 'error',
      ruleId: 'SYSTEM',
      source: 'system:world-model',
      encounterId: 'system',
      path: [],
      message: `failed to load world-model registry: ${error instanceof Error ? error.message : String(error)}`,
    };
    return {
      issues: [issue],
      summary: summarizeIssues(0, [issue]),
    };
  }

  const corpus = buildEncounterContentLintCorpus(target);
  const issues: EncounterLintIssue[] = [...corpus.preflightIssues];

  for (const input of corpus.inputs) {
    try {
      const parsed = parseEncounterContract(input.contract);
      const context: LintContext = {
        source: input.source,
        encounterId: parsed.encounter.id,
      };
      issues.push(...lintOneContract(context, parsed, registry));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      issues.push(
        makeIssue(
          {
            source: input.source,
            encounterId: 'unknown',
          },
          'error',
          'SCHEMA',
          `contract failed schema parse: ${message}`,
        ),
      );
    }
  }

  return {
    issues,
    summary: summarizeIssues(corpus.inputs.length, issues),
  };
}

function formatIssue(issue: EncounterLintIssue): string {
  const label = issue.severity.toUpperCase();
  const pathLabel = toPathString(issue.path);
  return `${label} ${issue.source}\n  ${pathLabel}: ${issue.message} (${issue.ruleId})`;
}

function parseCliTarget(argv: readonly string[]): EncounterLintTarget {
  const targetFlagIndex = argv.findIndex((arg) => arg === '--target');
  if (targetFlagIndex < 0) {
    return 'templates-and-good';
  }
  const targetValue = argv[targetFlagIndex + 1];
  if (!targetValue) {
    throw new Error('--target requires a value');
  }

  const allowed: EncounterLintTarget[] = ['templates-and-good', 'templates', 'good', 'bad', 'all-fixtures'];
  if (allowed.includes(targetValue as EncounterLintTarget)) {
    return targetValue as EncounterLintTarget;
  }
  if (targetValue.startsWith('bad:')) {
    return targetValue as EncounterLintTarget;
  }
  throw new Error(`unknown target "${targetValue}"`);
}

function printRunResult(result: EncounterLintRunResult): void {
  console.info(`encounter-content-lint: scanning ${result.summary.contractCount} contracts...`);

  if (result.issues.length > 0) {
    for (const issue of result.issues) {
      console.info(formatIssue(issue));
    }
  }

  console.info(
    `Summary: ${result.summary.contractCount} contracts | ${result.summary.errorCount} errors | ${result.summary.warningCount} warnings`,
  );
}

function runCli(argv: readonly string[]): number {
  let target: EncounterLintTarget;
  try {
    target = parseCliTarget(argv);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }

  let result: EncounterLintRunResult;
  try {
    result = runEncounterContentLint(target);
  } catch (error) {
    console.error(`encounter-content-lint failed: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }

  printRunResult(result);
  return result.summary.errorCount > 0 ? 1 : 0;
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
const currentFilePath = fileURLToPath(import.meta.url);
if (invokedPath === currentFilePath) {
  process.exit(runCli(process.argv.slice(2)));
}
