/**
 * generate-consumption-ledger — THR-1212 slice 4.
 *
 * Emits `Docs/canon/consumption-ledger.generated.md`: every aftermath effect kind
 * and every `GraphOp` op, what it writes, who reads it, and — derived from that —
 * whether anything actually **acts** on the write.
 *
 * ## What this artifact is for
 *
 * Distinction 2 of the typed-state program epic (THR-1156) is *acted-on vs merely
 * recorded*. Until now that distinction lived in people's heads, and the record of
 * what happens to a write was a grep anyone could run and nobody did. Three
 * measured failures share one shape — a write whose reader does not act on it:
 * `hungerResonance` (its reader spoke a disjoint vocabulary), mandate milestone
 * prose (zero importers), and `followOnTags` (its reader renders a sentence about
 * the write and then forgets it).
 *
 * A grep for readers reports all three healthy. That is why this ledger records
 * **what the reader does**, and derives the class from it.
 *
 * ## Membership derived, annotation curated, class derived again
 *
 * - **Membership** is parsed from `src/types/unifiedAction.ts` and
 *   `src/types/graphOp.ts`, so a new effect kind appears here the day it is added
 *   and fails the build until someone says who consumes it.
 * - **Annotation** — what it writes, and the consumer sites — is curated in
 *   `scripts/consumption-ledger-sources.ts`. It is not machine-derivable: whether
 *   a reader *acts* is a judgement about what the code does with the value.
 * - **Class** is derived back out of the annotation by `classifyRow`. Nobody
 *   writes `write-without-consumer` into a row; a row earns it by having no
 *   consumer that does anything.
 *
 * That last inversion is the point. An author filling in this ledger honestly
 * cannot avoid the finding, because they never state the verdict.
 *
 * ## Fail-loud, deliberately
 *
 * NFP #4's fail-soft rule governs the tick loop, not the build. A ledger that
 * shrugged and emitted a partial table would publish "these writes are consumed"
 * over a set nobody checked — worse than no ledger.
 *
 * Usage:
 *   npm run generate-consumption-ledger          # write the ledger
 *   npm run generate-consumption-ledger:check    # regenerate + diff vs committed
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

import {
  AFTERMATH_TYPES_REL,
  EFFECT_ROWS,
  EFFECT_UNION_NAME,
  GRAPH_OP_ROWS,
  GRAPH_OP_TYPES_REL,
  GRAPH_OP_UNION_NAME,
  assertConsumerSitesResolve,
  assertEveryMemberHasRow,
  assertWriteWithoutConsumerIsDeferred,
  classifyRow,
  parseDiscriminatedUnionKinds,
  parseStringUnionMembers,
  type ConsumptionClass,
  type LedgerRow,
} from './consumption-ledger-sources.ts';

const OUTPUT_REL = 'Docs/canon/consumption-ledger.generated.md';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, '..');

const CLASS_BADGE: Readonly<Record<ConsumptionClass, string>> = {
  'acted-on': '✅ acted-on',
  bookkeeping: '📒 bookkeeping',
  'dormant-hook': '🌱 dormant-hook',
  'write-without-consumer': '🕳️ write-without-consumer',
};

const CONSUMER_KIND_LABEL: Readonly<Record<string, string>> = {
  acts: 'acts',
  spawns: 'spawns',
  'tally-point': 'tally-point',
  reports: 'reports only',
};

function renderConsumers(row: LedgerRow): string {
  if (row.consumers.length === 0) return '— none —';
  return row.consumers
    .map((c) => {
      const operand = c.operand ? ` <br/>*operand:* ${c.operand}` : '';
      return `\`${c.file}\` → \`${c.symbol}\` (${CONSUMER_KIND_LABEL[c.kind]})${operand}`;
    })
    .join('<br/>');
}

function renderSection(
  title: string,
  unionName: string,
  sourceRel: string,
  members: readonly string[],
  rows: Readonly<Record<string, LedgerRow>>,
): string[] {
  const lines: string[] = [];
  lines.push(`## ${title}`);
  lines.push('');
  lines.push(
    `Membership derived from \`export type ${unionName}\` in \`${sourceRel}\` — ` +
      `${members.length} members.`,
  );
  lines.push('');
  lines.push('| Member | Class | What it writes | Who reads it, and what they do |');
  lines.push('|---|---|---|---|');
  for (const member of members) {
    const row = rows[member];
    lines.push(
      `| \`${member}\` | ${CLASS_BADGE[classifyRow(row)]} | ${row.writes} | ${renderConsumers(row)} |`,
    );
  }
  lines.push('');

  const noted = members.filter((m) => rows[m].note);
  if (noted.length > 0) {
    lines.push('### Notes');
    lines.push('');
    for (const member of noted) {
      const row = rows[member];
      const ticket = row.deferralTicket ? ` *(deferral: ${row.deferralTicket})*` : '';
      lines.push(`- **\`${member}\`**${ticket} — ${row.note}`);
    }
    lines.push('');
  }
  return lines;
}

function countByClass(
  members: readonly string[],
  rows: Readonly<Record<string, LedgerRow>>,
): Record<ConsumptionClass, number> {
  const counts: Record<ConsumptionClass, number> = {
    'acted-on': 0,
    bookkeeping: 0,
    'dormant-hook': 0,
    'write-without-consumer': 0,
  };
  for (const member of members) counts[classifyRow(rows[member])] += 1;
  return counts;
}

function render(input: {
  effectKinds: readonly string[];
  graphOps: readonly string[];
}): string {
  const { effectKinds, graphOps } = input;
  const lines: string[] = [];

  lines.push('<!-- GENERATED by scripts/generate-consumption-ledger.ts — do not edit by hand. -->');
  lines.push('<!-- Regenerate: npm run generate-consumption-ledger -->');
  lines.push('');
  lines.push('# Reachable-consumption ledger');
  lines.push('');
  lines.push(
    'Every aftermath effect kind and every `GraphOp` op, with **what happens to the ' +
      'write**. Distinction 2 of the typed-state program epic ([THR-1156]' +
      '(https://linear.app/threadbare/issue/THR-1156)) made machinery: not *is it read*, ' +
      'but *does anything act on it*.',
  );
  lines.push('');
  lines.push(
    'Membership is derived from source. The consumer annotations are curated in ' +
      '`scripts/consumption-ledger-sources.ts` and every citation is resolved against the ' +
      'file it names at generate time. The **class is derived** from the annotations — no ' +
      'row states its own verdict.',
  );
  lines.push('');

  lines.push('## The classes');
  lines.push('');
  lines.push(
    'Settled at the attended sitting of 2026-08-17 ([THR-1161]' +
      '(https://linear.app/threadbare/issue/THR-1161)), cut by how the player is told.',
  );
  lines.push('');
  lines.push('| Class | Meaning |');
  lines.push('|---|---|');
  lines.push(
    `| ${CLASS_BADGE['acted-on']} | A game entity was created, modified or deleted and the ` +
      'player is told via an entity component. Awareness-scoped — fog and secrecy are exempt. |',
  );
  lines.push(
    `| ${CLASS_BADGE.bookkeeping} | An invisible accumulator whose result surfaces at a ` +
      'tally-point. The surfaced result is itself acted-on. |',
  );
  lines.push(
    `| ${CLASS_BADGE['dormant-hook']} | Spawns a real entity carrying firing metadata. Hooks ` +
      'are **not** passive: firing upgrades them to acted-on. |',
  );
  lines.push(
    `| ${CLASS_BADGE['write-without-consumer']} | Nothing acts on it. Per the sitting this is ` +
      '*a defect, not a class* — legal only with a cited deferral ticket. |',
  );
  lines.push('');
  lines.push(
    '> A reader that only **describes** the write — renders a chip, writes a trace — is not a ' +
      'consumer. That distinction is the reason this artifact exists: the writes that failed ' +
      'in practice all had readers.',
  );
  lines.push('');

  const effectCounts = countByClass(effectKinds, EFFECT_ROWS);
  const opCounts = countByClass(graphOps, GRAPH_OP_ROWS);
  const total = (c: ConsumptionClass) => effectCounts[c] + opCounts[c];

  lines.push('## Summary');
  lines.push('');
  lines.push('| Class | Effect kinds | GraphOps | Total |');
  lines.push('|---|---:|---:|---:|');
  for (const cls of Object.keys(CLASS_BADGE) as ConsumptionClass[]) {
    lines.push(
      `| ${CLASS_BADGE[cls]} | ${effectCounts[cls]} | ${opCounts[cls]} | ${total(cls)} |`,
    );
  }
  lines.push(
    `| **Total** | **${effectKinds.length}** | **${graphOps.length}** | ` +
      `**${effectKinds.length + graphOps.length}** |`,
  );
  lines.push('');

  lines.push(...renderSection(
    'Aftermath effect kinds',
    EFFECT_UNION_NAME,
    AFTERMATH_TYPES_REL,
    effectKinds,
    EFFECT_ROWS,
  ));
  lines.push(...renderSection(
    'GraphOp ops',
    GRAPH_OP_UNION_NAME,
    GRAPH_OP_TYPES_REL,
    graphOps,
    GRAPH_OP_ROWS,
  ));

  return lines.join('\n') + '\n';
}

function main(): void {
  const checkOnly = process.argv.includes('--check');
  const readSource = (rel: string): string =>
    fs.readFileSync(path.join(REPO_ROOT, rel), 'utf-8');

  const effectKinds = parseDiscriminatedUnionKinds(
    readSource(AFTERMATH_TYPES_REL),
    EFFECT_UNION_NAME,
    AFTERMATH_TYPES_REL,
  );
  const graphOps = parseStringUnionMembers(
    readSource(GRAPH_OP_TYPES_REL),
    GRAPH_OP_UNION_NAME,
    GRAPH_OP_TYPES_REL,
  );

  assertEveryMemberHasRow(effectKinds, EFFECT_ROWS, EFFECT_UNION_NAME);
  assertEveryMemberHasRow(graphOps, GRAPH_OP_ROWS, GRAPH_OP_UNION_NAME);
  assertConsumerSitesResolve(EFFECT_ROWS, EFFECT_UNION_NAME, readSource);
  assertConsumerSitesResolve(GRAPH_OP_ROWS, GRAPH_OP_UNION_NAME, readSource);
  assertWriteWithoutConsumerIsDeferred(EFFECT_ROWS, EFFECT_UNION_NAME);
  assertWriteWithoutConsumerIsDeferred(GRAPH_OP_ROWS, GRAPH_OP_UNION_NAME);

  const rendered = render({ effectKinds, graphOps });

  const outPath = path.join(REPO_ROOT, OUTPUT_REL);
  const existing = fs.existsSync(outPath) ? fs.readFileSync(outPath, 'utf-8') : '';

  if (checkOnly) {
    if (existing !== rendered) {
      console.error(
        `consumption-ledger: STALE — ${OUTPUT_REL} differs from a fresh render. ` +
          `Run \`npm run generate-consumption-ledger\` and commit the result.`,
      );
      process.exit(1);
    }
    console.log(`consumption-ledger: OK — ${OUTPUT_REL} is current.`);
    return;
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, rendered, 'utf-8');

  const effectCounts = countByClass(effectKinds, EFFECT_ROWS);
  const opCounts = countByClass(graphOps, GRAPH_OP_ROWS);
  const dead = effectCounts['write-without-consumer'] + opCounts['write-without-consumer'];

  console.log(
    `consumption-ledger: wrote ${OUTPUT_REL} — ` +
      `${effectKinds.length} effect kinds + ${graphOps.length} GraphOps = ` +
      `${effectKinds.length + graphOps.length} rows.`,
  );

  const named = [
    ...effectKinds.filter((m) => classifyRow(EFFECT_ROWS[m]) === 'write-without-consumer'),
    ...graphOps.filter((m) => classifyRow(GRAPH_OP_ROWS[m]) === 'write-without-consumer'),
  ];
  console.log(
    `consumption-ledger: ${dead} write-without-consumer` +
      (named.length > 0 ? ` — ${named.map((m) => `\`${m}\``).join(', ')}` : ''),
  );
}

main();
