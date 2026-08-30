/**
 * generate-interface-map — cross-system contract liveness classifier (THR-717).
 *
 * Reads the contract registry (`./interface-contracts.ts`), classifies each row
 * against the working tree, and emits `Docs/canon/interface-map.generated.md`.
 *
 * ## Detection is DOWNGRADE-ONLY — the invariant to protect
 *
 * Static analysis can prove a contract dead; it can never prove one alive. Do
 * **not** "simplify" this into `write site exists AND read site exists → LIVE`.
 * That exact simplification would have re-badged both headline leaks green:
 * `domainContributions` greps clean while every catalog writes `{}` (value-level
 * deadness), and `modifiers` has a real production reader that only ever asks
 * for `los_range` (argument-level deadness). Neither is visible to symbols.
 *
 * Precedence, strictly downgrade-first:
 *   1. `badgeOverride`      — explicit human pin (LEAKED/PARTIAL), always wins.
 *   2. Mechanical LEAKED/UNWIRED — beats a stale `verifiedLive`, which is then
 *      reported as stale rather than silently masking a newly-dead contract.
 *   3. `verifiedLive`       — the only route to 🟢 LIVE.
 *   4. UNVERIFIED-OK        — the best a passing row can earn mechanically.
 *
 * ## Two tiers
 *
 *   - **Tier 1 — module orphan check.** When `mechanism.module` is set, count
 *     production importers. Zero → LEAKED. Catches `attachmentTriggers.ts`: a
 *     complete, tested resolver imported only by its own tests.
 *   - **Tier 2 — symbol asymmetry.** Word-boundary-anchored greps across `src/`
 *     excluding tests, partitioned into the declared write/read globs. Hits on
 *     one side only → LEAKED. Neither side → UNWIRED. Word boundaries are
 *     load-bearing: bare `grants` matches `grantsActionIds` and local variables
 *     named `grants`, manufacturing phantom read sites (THR-614 seam-2 class).
 *
 * Tier 3 (runtime flow probes — the real fix for value-level deadness) is
 * deferred to v2; only a runtime probe can promote to LIVE mechanically.
 *
 * ## The CI ratchet
 *
 * Exits non-zero when any contract classifies LEAKED without a `deferralTicket`.
 * The freshness diff alone would happily pass an executor who kills a read site
 * and commits the regenerated, now-LEAKED map — the exit code is what turns CI
 * red. Known-LEAKED rows carry tickets, so the build is green from day one.
 *
 * Determinism (NFP #3): pure static analysis of the working tree, directory
 * walks sorted, and **no wall-clock field in the output** — a generated
 * timestamp makes every parallel PR a merge conflict (THR-714). `.codesight/` is
 * gitignored and its hook does not run in CI, so it is never an input; this
 * script does its own import grep.
 *
 * Usage:
 *   npm run generate-interface-map           # write the doc
 *   npm run generate-interface-map:dry       # print planned output, write nothing
 */

import * as fs from 'fs';
import * as path from 'path';

import { CONTRACTS, TICKETED_BADGES, validateRegistry, type Contract, type ContractBadge } from './interface-contracts.ts';

// ─── Tunable constants (NFP #1) ───────────────────────────────────────────────

/** Globs that never count as a production site. */
const INTERFACE_MAP_EXCLUDES = ['__tests__', '.test.', '.spec.'] as const;
/** Cap per-row site listing in the generated output; totals are always reported. */
const MAX_SYMBOL_HITS_REPORTED = 5;

const OUTPUT_REL = path.join('Docs', 'canon', 'interface-map.generated.md');
const SOURCE_REL = 'src';
const SOURCE_EXTENSIONS = ['.ts', '.tsx'] as const;

const BADGE_LABEL: Record<ContractBadge, string> = {
  LIVE: '🟢 LIVE',
  PARTIAL: '🟠 PARTIAL',
  LEAKED: '🔴 LEAKED',
  HOLLOW: '🟣 HOLLOW',
  UNWIRED: '⚫ UNWIRED',
  'UNVERIFIED-OK': '🔵 UNVERIFIED-OK',
};

// ─── Source scan ──────────────────────────────────────────────────────────────

interface SourceFile {
  rel: string;
  text: string;
}

function isProductionSource(rel: string): boolean {
  if (!SOURCE_EXTENSIONS.some((ext) => rel.endsWith(ext))) return false;
  if (rel.endsWith('.d.ts')) return false;
  return !INTERFACE_MAP_EXCLUDES.some((frag) => rel.includes(frag));
}

/** Sorted walk of `src/`, production files only — sorted for determinism. */
function collectSources(repoRoot: string): SourceFile[] {
  const root = path.join(repoRoot, SOURCE_REL);
  const out: SourceFile[] = [];
  const walk = (dir: string): void => {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return; // Fail-soft: an unreadable directory must not abort the build.
    }
    for (const entry of [...entries].sort((a, b) => a.name.localeCompare(b.name))) {
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(abs);
        continue;
      }
      const rel = path.relative(repoRoot, abs).replaceAll('\\', '/');
      if (!isProductionSource(rel)) continue;
      try {
        out.push({ rel, text: fs.readFileSync(abs, 'utf-8') });
      } catch {
        /* unreadable file — skip, never throw */
      }
    }
  };
  walk(root);
  return out;
}

// ─── Matching helpers ─────────────────────────────────────────────────────────

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Word-boundary-anchored symbol matcher. The boundaries are the whole point:
 * bare `grants` otherwise matches `grantsActionIds`, `grantsTraitWhileHeld`, and
 * any local named `grants`, inventing read sites that do not exist.
 */
function symbolPattern(symbol: string): RegExp {
  return new RegExp(`\\b${escapeRegex(symbol)}\\b`);
}

/** Glob → RegExp supporting `**` (any depth) and `*` (one segment). */
function globToRegExp(glob: string): RegExp {
  const normalized = glob.replaceAll('\\', '/');
  let out = '';
  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i];
    if (ch === '*') {
      if (normalized[i + 1] === '*') {
        out += '.*';
        i++;
        if (normalized[i + 1] === '/') i++;
      } else {
        out += '[^/]*';
      }
    } else {
      out += escapeRegex(ch);
    }
  }
  return new RegExp(`^${out}$`);
}

function matchesAnyGlob(rel: string, globs: readonly string[]): boolean {
  return globs.some((glob) => globToRegExp(glob).test(rel));
}

/**
 * Production importers of a module, by repo-relative path. Matches any import
 * specifier whose resolved tail equals the module's path without extension —
 * covering `./attachmentTriggers`, `../engine/attachmentTriggers`, and aliased
 * forms. The module never counts as its own importer.
 */
function productionImporters(sources: readonly SourceFile[], moduleRel: string): string[] {
  const withoutExt = moduleRel.replace(/\.tsx?$/, '');
  const basename = path.basename(withoutExt);
  const importRe = new RegExp(`from\\s+['"]([^'"]*\\b${escapeRegex(basename)})['"]`, 'g');
  const hits: string[] = [];
  for (const file of sources) {
    if (file.rel === moduleRel) continue;
    importRe.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = importRe.exec(file.text)) !== null) {
      // Confirm the specifier really ends at this module, not a longer name.
      if (new RegExp(`(^|/)${escapeRegex(basename)}$`).test(match[1])) {
        hits.push(file.rel);
        break;
      }
    }
  }
  return hits;
}

// ─── Classification ───────────────────────────────────────────────────────────

interface Classification {
  badge: ContractBadge;
  reason: string;
  writeHits: string[];
  readHits: string[];
  otherHits: string[];
  totalHits: number;
  orphanModule: boolean;
  staleVerification: boolean;
}

/**
 * Second-cause hint appended to every symbol-asymmetry verdict (THR-755 row 4).
 *
 * A LEAKED/UNWIRED badge reads as an architectural finding — "nothing produces this
 * contract", "the consumer is starving" — but the identical evidence is produced by a
 * row that merely mis-declares `mechanism.symbols` or its site globs: the wiring is
 * live, the grep just never matched. Naming the cheaper explanation first, with the
 * literal grep to run, keeps the badge honest without weakening it (impediment #206).
 */
function misdeclarationHint(symbols: readonly string[], sites: readonly string[]): string {
  const symbol = symbols[0] ?? '<symbol>';
  if (sites.length === 0) {
    return (
      ` — or the row under-declares its sites: confirm \`${symbol}\` is the symbol actually` +
      ` used at the real site, then register that site before treating this as a leak.`
    );
  }
  return (
    ` — or the declared symbol does not appear at the declared site:` +
    ` grep '${symbol}' ${sites[0]} before treating this as a leak.`
  );
}

function classify(contract: Contract, sources: readonly SourceFile[]): Classification {
  const patterns = contract.mechanism.symbols.map(symbolPattern);
  const writeHits: string[] = [];
  const readHits: string[] = [];
  const otherHits: string[] = [];

  for (const file of sources) {
    if (!patterns.some((re) => re.test(file.text))) continue;
    if (matchesAnyGlob(file.rel, contract.writeSites)) writeHits.push(file.rel);
    else if (matchesAnyGlob(file.rel, contract.readSites)) readHits.push(file.rel);
    else otherHits.push(file.rel);
  }
  const totalHits = writeHits.length + readHits.length + otherHits.length;

  // Tier 1 — module orphan check.
  let orphanModule = false;
  if (contract.mechanism.module) {
    orphanModule = productionImporters(sources, contract.mechanism.module).length === 0;
  }

  // Tier 2 — symbol asymmetry against the declared sides.
  let mechanical: ContractBadge;
  let reason: string;
  if (orphanModule) {
    mechanical = 'LEAKED';
    reason = `Tier 1: \`${contract.mechanism.module}\` has zero production importers — the module is an orphan.`;
  } else if (totalHits === 0) {
    mechanical = 'UNWIRED';
    reason =
      'Tier 2: no production hits for any declared symbol on either side.' +
      misdeclarationHint(contract.mechanism.symbols, [...contract.writeSites, ...contract.readSites]);
  } else if (readHits.length === 0) {
    mechanical = 'LEAKED';
    reason =
      (contract.readSites.length === 0
        ? 'Tier 2: the registry declares no read sites and none were found — producer writes into nothing.'
        : 'Tier 2: write sites present, declared read sites empty — the consumer is starving.') +
      misdeclarationHint(contract.mechanism.symbols, contract.readSites);
  } else if (writeHits.length === 0) {
    mechanical = 'LEAKED';
    reason =
      'Tier 2: read sites present, declared write sites empty — nothing produces this contract.' +
      misdeclarationHint(contract.mechanism.symbols, contract.writeSites);
  } else {
    mechanical = 'UNVERIFIED-OK';
    reason = 'Tier 2: production writes and reads both present. Not proof of liveness — payloads are unchecked.';
  }

  const mechanicallyDead = mechanical === 'LEAKED' || mechanical === 'UNWIRED';

  // Precedence 1 — an explicit human pin always wins (it is always a downgrade).
  if (contract.badgeOverride) {
    return {
      badge: contract.badgeOverride.badge,
      reason: `Pinned by badgeOverride: ${contract.badgeOverride.reason}`,
      writeHits,
      readHits,
      otherHits,
      totalHits,
      orphanModule,
      staleVerification: false,
    };
  }

  // Precedence 2 — mechanical deadness beats a stale verifiedLive. This is the
  // downgrade-only invariant: a dated verification must never mask a contract
  // that has since died.
  if (mechanicallyDead) {
    return {
      badge: mechanical,
      reason: contract.verifiedLive
        ? `${reason} NOTE: verifiedLive (${contract.verifiedLive.date}) is now STALE — re-verify or retire the contract.`
        : reason,
      writeHits,
      readHits,
      otherHits,
      totalHits,
      orphanModule,
      staleVerification: Boolean(contract.verifiedLive),
    };
  }

  // Precedence 3 — the only route to LIVE.
  if (contract.verifiedLive) {
    return {
      badge: 'LIVE',
      reason: `Verified ${contract.verifiedLive.date}: ${contract.verifiedLive.evidence}`,
      writeHits,
      readHits,
      otherHits,
      totalHits,
      orphanModule,
      staleVerification: false,
    };
  }

  return { badge: mechanical, reason, writeHits, readHits, otherHits, totalHits, orphanModule, staleVerification: false };
}

// ─── Render ───────────────────────────────────────────────────────────────────

function fmtSites(sites: readonly string[]): string {
  if (sites.length === 0) return '—';
  const shown = sites.slice(0, MAX_SYMBOL_HITS_REPORTED).map((s) => `\`${s}\``).join(', ');
  const extra = sites.length - MAX_SYMBOL_HITS_REPORTED;
  return extra > 0 ? `${shown} +${extra} more` : shown;
}

function ticketOf(contract: Contract): string | undefined {
  return contract.deferralTicket ?? contract.badgeOverride?.deferralTicket;
}

interface Row {
  contract: Contract;
  result: Classification;
}

function render(rows: readonly Row[], registryErrors: readonly { contractId: string; problem: string }[]): string {
  const L: string[] = [];
  L.push('<!-- GENERATED by scripts/generate-interface-map.ts — do not edit by hand. -->');
  L.push('<!-- Source of truth: scripts/interface-contracts.ts. Run `npm run generate-interface-map`. -->');
  L.push('');
  L.push('# Canon — System Interface Map (generated)');
  L.push('');
  L.push('> Cross-system contracts and their liveness. Companion to the curated');
  L.push('> `Docs/canon/interface-map.md`, which carries the protocol; this file carries the rows.');
  L.push('');
  L.push('**Classification is downgrade-only.** Static analysis can prove a contract dead, never');
  L.push('alive. 🟢 LIVE comes only from a dated human `verifiedLive` entry; the best a');
  L.push('mechanically passing row earns is 🔵 UNVERIFIED-OK. A 🔴 LEAKED row must carry a');
  L.push('remediation ticket or the build fails.');
  L.push('');

  const counts = new Map<ContractBadge, number>();
  for (const row of rows) counts.set(row.result.badge, (counts.get(row.result.badge) ?? 0) + 1);

  L.push('## Badge summary');
  L.push('');
  L.push('| Badge | Count |');
  L.push('|---|---|');
  for (const badge of Object.keys(BADGE_LABEL) as ContractBadge[]) {
    L.push(`| ${BADGE_LABEL[badge]} | ${counts.get(badge) ?? 0} |`);
  }
  L.push(`| **Total** | **${rows.length}** |`);
  L.push('');

  if (registryErrors.length > 0) {
    L.push('## Registry errors');
    L.push('');
    L.push('| Contract | Problem |');
    L.push('|---|---|');
    for (const err of registryErrors) L.push(`| \`${err.contractId}\` | ${err.problem} |`);
    L.push('');
  }

  const leakedNoTicket = rows.filter((r) => TICKETED_BADGES.includes(r.result.badge) && !ticketOf(r.contract));
  if (leakedNoTicket.length > 0) {
    L.push('## ⚠️ LEAKED / HOLLOW without a remediation ticket');
    L.push('');
    L.push('These fail the build. Either fix the contract or file a `Deferral` issue and cite it.');
    L.push('');
    for (const row of leakedNoTicket) L.push(`- \`${row.contract.id}\` — ${row.result.reason}`);
    L.push('');
  }

  const bySystem = new Map<string, Row[]>();
  for (const row of rows) {
    const key = row.contract.producerSystem;
    if (!bySystem.has(key)) bySystem.set(key, []);
    (bySystem.get(key) as Row[]).push(row);
  }

  L.push('## Contracts by producing subsystem');
  L.push('');
  for (const system of [...bySystem.keys()].sort()) {
    L.push(`### ${system}`);
    L.push('');
    L.push('| Contract | Intent | Mechanism | Consumer | Status | Ticket |');
    L.push('|---|---|---|---|---|---|');
    for (const row of (bySystem.get(system) as Row[]).slice().sort((a, b) => a.contract.id.localeCompare(b.contract.id))) {
      const c = row.contract;
      const symbols = c.mechanism.symbols.map((s) => `\`${s}\``).join(', ');
      const ticket = ticketOf(c) ?? '—';
      L.push(
        `| \`${c.id}\` | ${c.intent} | ${c.mechanism.kind}: ${symbols} | ${c.consumerSystem} | ${BADGE_LABEL[row.result.badge]} | ${ticket} |`,
      );
    }
    L.push('');
  }

  L.push('## Evidence');
  L.push('');
  for (const row of rows.slice().sort((a, b) => a.contract.id.localeCompare(b.contract.id))) {
    const c = row.contract;
    L.push(`### \`${c.id}\` — ${BADGE_LABEL[row.result.badge]}`);
    L.push('');
    L.push(`- **Intent:** ${c.intent}`);
    L.push(`- **Producer → Consumer:** ${c.producerSystem} → ${c.consumerSystem}`);
    if (c.ulTerms && c.ulTerms.length > 0) L.push(`- **UL terms:** ${c.ulTerms.map((t) => `*${t}*`).join(', ')}`);
    if (c.mechanism.module) L.push(`- **Module:** \`${c.mechanism.module}\`${row.result.orphanModule ? ' — **no production importers**' : ''}`);
    L.push(`- **Production hits:** ${row.result.totalHits} total — ${row.result.writeHits.length} write, ${row.result.readHits.length} read, ${row.result.otherHits.length} unclassified`);
    L.push(`- **Write sites:** ${fmtSites(row.result.writeHits)}`);
    L.push(`- **Read sites:** ${fmtSites(row.result.readHits)}`);
    if (row.result.otherHits.length > 0) L.push(`- **Other hits:** ${fmtSites(row.result.otherHits)}`);
    L.push(`- **Verdict:** ${row.result.reason}`);
    L.push('');
  }

  return L.join('\n');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main(): void {
  const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
  const dryRun = process.argv.includes('--dry-run');

  const registryErrors = validateRegistry(CONTRACTS);
  const sources = collectSources(repoRoot);
  if (sources.length === 0) {
    console.error('generate-interface-map: FAIL — no production sources found under src/. Refusing to emit an empty map.');
    process.exit(1);
  }

  const rows: Row[] = CONTRACTS.map((contract) => ({ contract, result: classify(contract, sources) }));
  const output = render(rows, registryErrors);

  if (dryRun) {
    console.log(output);
  } else {
    const outPath = path.join(repoRoot, OUTPUT_REL);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, `${output}\n`, 'utf-8');
    console.log(`generate-interface-map: wrote ${OUTPUT_REL} (${rows.length} contracts, ${sources.length} sources scanned)`);
  }

  // ── The CI ratchet ──────────────────────────────────────────────────────────
  const leakedNoTicket = rows.filter((r) => TICKETED_BADGES.includes(r.result.badge) && !ticketOf(r.contract));
  if (registryErrors.length > 0) {
    console.error(`generate-interface-map: FAIL — ${registryErrors.length} registry error(s):`);
    for (const err of registryErrors) console.error(`  - ${err.contractId}: ${err.problem}`);
    process.exit(1);
  }
  if (leakedNoTicket.length > 0) {
    console.error(`generate-interface-map: FAIL — ${leakedNoTicket.length} contract(s) LEAKED/HOLLOW without a remediation ticket:`);
    for (const row of leakedNoTicket) console.error(`  - ${row.contract.id}: ${row.result.reason}`);
    console.error('');
    console.error('Fix the contract, or file a `Deferral`-labeled Linear issue and set `deferralTicket` on the row.');
    process.exit(1);
  }

  const stale = rows.filter((r) => r.result.staleVerification);
  for (const row of stale) {
    console.warn(`generate-interface-map: WARN — \`${row.contract.id}\` has a stale verifiedLive; mechanical check now reads ${row.result.badge}.`);
  }
}

main();
