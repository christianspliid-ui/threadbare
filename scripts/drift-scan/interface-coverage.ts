/**
 * S11 — interface-map coverage cadence (THR-717).
 *
 * Audit-on-touch alone lets cold subsystems fester, and that is exactly where
 * leaks live longest: Secrets & Favors has been DORMANT indefinitely, so no
 * design session has had reason to write its contract rows. This signal seeds
 * **one audit ticket per week**, highest-suspicion subsystem first, until every
 * subsystem has contract rows.
 *
 * Suspicion order — DORMANT badge first (a subsystem that is wired but produced
 * no output in the standard run is the likeliest place for a dead contract),
 * then alphabetical. Alphabetical rather than random so a re-run in the same
 * week proposes the same subsystem; the drift scan's exact-title dedup then
 * suppresses the duplicate.
 *
 * Pure and side-effect-free: it reads the contract registry and the generated
 * systems inventory, and returns a SignalResult. Fail-soft (NFP #4) — a missing
 * inventory degrades the ordering to alphabetical rather than failing the scan.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import { CONTRACTS } from '../interface-contracts.ts';
import { SUBSYSTEMS } from '../subsystems-registry.ts';

import type { SignalResult } from './index.ts';

/** Subsystems with no contract row on either side of any contract. */
export function unauditedSubsystems(): string[] {
  const covered = new Set<string>();
  for (const contract of CONTRACTS) {
    covered.add(contract.producerSystem);
    covered.add(contract.consumerSystem);
  }
  return SUBSYSTEMS.map((s) => s.name).filter((name) => !covered.has(name));
}

/** Subsystem names badged DORMANT in the generated systems inventory. */
function dormantSubsystems(repoRoot: string): Set<string> {
  const dormant = new Set<string>();
  try {
    const text = fs.readFileSync(path.join(repoRoot, 'Docs', 'canon', 'systems-inventory.md'), 'utf-8');
    for (const line of text.split(/\r?\n/)) {
      if (!line.includes('DORMANT')) continue;
      for (const subsystem of SUBSYSTEMS) {
        if (line.includes(subsystem.name)) dormant.add(subsystem.name);
      }
    }
  } catch {
    /* inventory absent — ordering degrades to alphabetical, never throws */
  }
  return dormant;
}

export function runInterfaceCoverage(repoRoot: string): SignalResult {
  const unaudited = unauditedSubsystems();
  if (unaudited.length === 0) {
    return { status: 'green' };
  }

  const dormant = dormantSubsystems(repoRoot);
  const ranked = [...unaudited].sort((a, b) => {
    const aDormant = dormant.has(a) ? 0 : 1;
    const bDormant = dormant.has(b) ? 0 : 1;
    return aDormant !== bDormant ? aDormant - bDormant : a.localeCompare(b);
  });

  const target = ranked[0];
  const subsystem = SUBSYSTEMS.find((s) => s.name === target);
  const badge = dormant.has(target) ? '🟠 DORMANT' : 'ACTIVE/UNKNOWN';

  const body = [
    `**Audit the cross-system contracts for \`${target}\`** (${badge}).`,
    '',
    `${unaudited.length} subsystem(s) still have no contract rows in \`scripts/interface-contracts.ts\`.`,
    'This ticket clears one. Highest-suspicion first: DORMANT subsystems are wired but produced no',
    'output in the standard run, which is where dead contracts survive longest.',
    '',
    '### What to do',
    '',
    `1. Load \`Docs/canon/interface-map.md\` for the protocol (classification is **downgrade-only**).`,
    `2. Enumerate the subsystem's cross-system reads/writes. Aliases to grep: ${(subsystem?.aliases ?? []).map((a) => `\`${a}\``).join(', ')}.`,
    `3. Engine domains that implement it: ${(subsystem?.domains ?? []).map((d) => `\`${d}\``).join(', ') || '—'}.`,
    '4. **Verify with greps — do not transcribe intentions.** A row needs a production write site',
    '   AND a production read site, both word-boundary-matched, tests excluded.',
    '5. Add one `Contract` row per finding to `scripts/interface-contracts.ts`.',
    '   - Genuinely live? Add `verifiedLive` with today\'s date and the evidence. LIVE is never automatic.',
    '   - Dead? File a `Deferral`-labeled issue and set `deferralTicket`, or the build fails (by design).',
    '6. Run `npm run generate-interface-map` and commit the regenerated map.',
    '',
    `### Remaining unaudited (${unaudited.length})`,
    '',
    ...ranked.map((name) => `- ${dormant.has(name) ? '🟠' : '⚪'} ${name}`),
  ].join('\n');

  return {
    status: 'red',
    summary: `audit cross-system contracts for ${target} (${unaudited.length} subsystems unaudited)`,
    body,
  };
}
