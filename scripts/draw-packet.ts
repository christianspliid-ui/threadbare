/**
 * `draw:packet` — one roll for a whole batch. THR-1245.
 *
 * Director ruling (Christian, chat, 2026-08-25): *"just build it all directly."*
 * Contract: `nudge-authoring-spec.md` § *The Seed Dice*, `batch-brief-format.md`
 * § *Rolled constraints (per slot)*, `Docs/canon/encounter-catalogs.md` §§ 1, 2, 7.
 *
 * `draw:hooks` rolls one slot; this rolls the batch, adds the four capped axes
 * nothing rolled (reach, decision shape, setting class, system target), enforces
 * every cap and floor by construction, and prints the brief's `Rolled
 * constraints` block ready to paste plus the spread table the batch report owes.
 *
 * The setting die is gap-weighted against the **live corpus** — the drawable
 * pool `UNIFIED_ACTION_TEMPLATES` carries, read the same way the THR-884
 * coverage matrix reads it — so a starving class surfaces more often. That read
 * lives here rather than in the module, which stays pure and takes the counts as
 * an input.
 *
 * Usage:
 *   npm run draw:packet -- <briefSlug>
 *   npm run draw:packet -- <briefSlug> --slots 6
 *   npm run draw:packet -- <briefSlug> --reaches iron,veil,heart
 *   npm run draw:packet -- <briefSlug> --ids encounter.slice.a,encounter.slice.b
 *   npm run draw:packet -- <briefSlug> --json
 *
 * Exit codes:
 *   0  a packet was printed
 *   1  bad arguments, or a catalog health violation
 */

import { UNIFIED_ACTION_TEMPLATES } from '../src/data/unified-action-templates';
import { REACH_DOMAINS, type ReachDomain } from '../src/types/traits';
import type { RarityTier } from '../src/types/rarity';
import {
  SETTING_CLASSES,
  settingClassForSubtype,
  type SettingClass,
} from '../src/data/settingClasses';
import {
  PACKET_DEFAULT_SLOTS,
  PACKET_MAX_SLOTS,
  SYSTEM_TARGET_FACES,
  packetDiceCatalogViolations,
  rollPacket,
  settingClassWeights,
} from '../src/data/content-eval/packetDice';
import { DISPOSITION_NOT_APPLICABLE } from '../src/data/content-eval/seedDice';

// ─── Args ────────────────────────────────────────────────────────────

const argv = process.argv.slice(2);
const wantsJson = argv.includes('--json');

const VALUE_FLAGS = ['slots', 'reaches', 'ids', 'hooks', 'tier'] as const;

function flag(name: string): string | undefined {
  const index = argv.indexOf(`--${name}`);
  if (index === -1) return undefined;
  return argv[index + 1];
}

const positional = argv.filter((arg, index) => {
  if (arg.startsWith('--')) return false;
  const previous = argv[index - 1];
  return !VALUE_FLAGS.some(name => previous === `--${name}`);
});

function usage(): never {
  console.error(
    'Usage: npm run draw:packet -- <briefSlug> [--slots n] [--reaches a,b] [--ids x,y]\n'
      + '                            [--hooks n] [--tier 1-4] [--json]',
  );
  process.exit(1);
}

// ─── Catalog health, first ───────────────────────────────────────────
//
// A packet rolled off a broken catalog is worse than no packet, because it
// looks like a packet — the same reason `draw:hooks` checks before printing.

const violations = packetDiceCatalogViolations();
if (violations.length > 0) {
  console.error('Packet-stage catalog has violations:');
  for (const violation of violations) console.error(`  ✗ ${violation}`);
  process.exit(1);
}

const briefSlug = positional[0];
if (!briefSlug) usage();

const slotsArg = flag('slots');
const slots = slotsArg === undefined ? PACKET_DEFAULT_SLOTS : Number(slotsArg);
if (!Number.isInteger(slots) || slots < 1 || slots > PACKET_MAX_SLOTS) {
  console.error(`--slots must be an integer between 1 and ${PACKET_MAX_SLOTS}, got '${slotsArg}'`);
  process.exit(1);
}

const reachesArg = flag('reaches');
let reaches: readonly ReachDomain[] | undefined;
if (reachesArg !== undefined) {
  const parts = reachesArg.split(',').map(part => part.trim()).filter(Boolean);
  const unknown = parts.filter(part => !(REACH_DOMAINS as readonly string[]).includes(part));
  if (parts.length === 0 || unknown.length > 0) {
    console.error(
      `--reaches takes a comma-separated list of: ${REACH_DOMAINS.join(', ')}`
        + (unknown.length > 0 ? `\n  unknown: ${unknown.join(', ')}` : ''),
    );
    process.exit(1);
  }
  reaches = parts as readonly ReachDomain[];
}

const idsArg = flag('ids');
const ids = idsArg?.split(',').map(part => part.trim()).filter(Boolean);

const hooksArg = flag('hooks');
const hookCount = hooksArg === undefined ? undefined : Number(hooksArg);
if (hookCount !== undefined && (!Number.isInteger(hookCount) || hookCount < 1)) {
  console.error(`--hooks must be a positive integer, got '${hooksArg}'`);
  process.exit(1);
}

const tierArg = flag('tier');
const tier = tierArg === undefined ? undefined : Number(tierArg);
if (tier !== undefined && ![1, 2, 3, 4].includes(tier)) {
  console.error(`--tier must be 1, 2, 3 or 4, got '${tierArg}'`);
  process.exit(1);
}

// ─── Live-corpus reads ───────────────────────────────────────────────

/**
 * Drawable templates per setting class.
 *
 * Read off `locationSubtypes` — the field the encounter cache actually filters
 * on — exactly as `generate-setting-coverage` does, so the die is weighted
 * against the pool the engine can deal rather than the pool the content files
 * declare. A template drawable in three classes counts once in each; that is
 * what "how covered is this class" means.
 */
function settingCorpusCounts(): Record<SettingClass, number> {
  const counts = Object.fromEntries(SETTING_CLASSES.map(cls => [cls, 0])) as Record<
    SettingClass,
    number
  >;
  for (const template of UNIFIED_ACTION_TEMPLATES) {
    const seen = new Set<SettingClass>();
    for (const subtype of template.locationSubtypes ?? []) {
      const cls = settingClassForSubtype(subtype);
      if (cls) seen.add(cls);
    }
    for (const cls of seen) counts[cls]++;
  }
  return counts;
}

/** Reach and tier for ids the corpus already knows, so their hand matches the gate's. */
function knownTemplates(): ReadonlyMap<string, { reach: ReachDomain; rarityTier: RarityTier }> {
  const map = new Map<string, { reach: ReachDomain; rarityTier: RarityTier }>();
  for (const template of UNIFIED_ACTION_TEMPLATES) {
    map.set(template.id, { reach: template.reach, rarityTier: template.rarityTier });
  }
  return map;
}

const corpusCounts = settingCorpusCounts();

const packet = rollPacket({
  briefSlug,
  slots,
  reaches,
  ids,
  hookCount,
  settingCorpusCounts: corpusCounts,
  knownTemplates: knownTemplates(),
  rarityTier: tier as RarityTier | undefined,
});

// ─── JSON ────────────────────────────────────────────────────────────

if (wantsJson) {
  console.log(
    JSON.stringify(
      {
        briefSlug: packet.briefSlug,
        slotCount: packet.slots.length,
        settingCorpusCounts: corpusCounts,
        slots: packet.slots.map(slot => ({
          index: slot.index,
          slotSeed: slot.slotSeed,
          templateId: slot.templateId ?? null,
          reach: slot.reach,
          plotHookRolled: slot.hooks.map(hook => hook.id),
          p3Shape: slot.seedDice.stake.id,
          p2Must: slot.seedDice.stake.p2Must,
          needsNamedOwner: slot.seedDice.stake.needsNamedOwner,
          opposition: slot.seedDice.opposition.id,
          motive: slot.seedDice.motive,
          activity: slot.seedDice.activity ?? null,
          disposition: slot.seedDice.disposition ?? DISPOSITION_NOT_APPLICABLE,
          agentRole: slot.seedDice.agentRole.id,
          scale: slot.seedDice.scale,
          decisionShape: slot.decisionShape.id,
          settingClass: slot.settingClass,
          systemTarget: slot.systemTarget.id,
          systemMaturity: slot.systemTarget.maturity,
          consequenceHand: slot.consequenceHand ?? null,
          corrections: slot.corrections,
        })),
        spread: packet.spread,
        corrections: packet.corrections,
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

// ─── Print ───────────────────────────────────────────────────────────

const RULE = '══════════════════════════════════════════════════════════════';
const THIN = '──────────────────────────────────────────────────────────────';

console.log('');
console.log(RULE);
console.log('  The Packet Draw');
console.log(RULE);
console.log(`  brief     ${packet.briefSlug}`);
console.log(`  slots     ${packet.slots.length}`);
console.log(
  `  reaches   ${reaches === undefined ? 'rolled (cap 2)' : `supplied — ${reaches.join(', ')}`}`,
);
console.log('');

for (const slot of packet.slots) {
  console.log(THIN);
  console.log(
    `  slot ${slot.index}${slot.templateId === undefined ? '' : `  ·  ${slot.templateId}`}`
      + `   (seed ${slot.slotSeed})`,
  );
  console.log(THIN);
  console.log(`  reach:        ${slot.reach}`);
  console.log(`  setting:      ${slot.settingClass}`);
  console.log(`  shape:        ${slot.decisionShape.label}  [${slot.decisionShape.steps}]`);
  console.log(`                ${slot.decisionShape.useWhen}`);
  console.log(
    `  system:       ${slot.systemTarget.id}  (${slot.systemTarget.maturity})`
      + `\n                ${slot.systemTarget.note}`,
  );
  console.log('');
  console.log('  hooks offered:');
  for (const hook of slot.hooks) {
    console.log(`    ▸ ${hook.id}`);
    console.log(`        ${hook.hook}`);
  }
  console.log('');
  console.log(`  p3Shape:      ${slot.seedDice.stake.id}`);
  console.log(`                P2 must establish ${slot.seedDice.stake.p2Must}`);
  if (slot.seedDice.stake.needsNamedOwner) {
    console.log('                this shape needs a named person to own the problem');
  }
  console.log(
    `  opposition:   ${slot.seedDice.opposition.label} (motive: ${slot.seedDice.motive})`
      + (slot.seedDice.activity === undefined
        ? '  ·  activity: authored'
        : `  ·  activity: ${slot.seedDice.activity}`),
  );
  console.log(`  disposition:  ${slot.seedDice.disposition ?? DISPOSITION_NOT_APPLICABLE}`);
  console.log(`  agentRole:    ${slot.seedDice.agentRole.label}`);
  console.log(`  scale:        ${slot.seedDice.scale}`);
  if (slot.consequenceHand !== undefined) {
    console.log(`  hand:         ${slot.consequenceHand.join(' · ')}   (binding — THR-1145)`);
  }
  for (const correction of slot.corrections) {
    console.log(
      `  ⟳ ${correction.axis}: rolled ${correction.rolled} → ${correction.replacedWith}`
        + `\n      ${correction.reason}`,
    );
  }
  console.log('');
}

// ─── The paste block ─────────────────────────────────────────────────

console.log(RULE);
console.log('  Rolled constraints (paste into the batch brief)');
console.log(RULE);
/**
 * Two columns, with at least one space between them however long the left is.
 *
 * `padEnd` alone silently butts the columns together when a face id is longer
 * than the column — `danger_confrontation_aftermathsystem: movement` — and the
 * result is a paste block that reads as corrupt.
 */
const PASTE_COLUMN_WIDTH = 34;
function twoColumn(left: string, right: string): string {
  return `${left.padEnd(PASTE_COLUMN_WIDTH)} ${right}`;
}

console.log('```');
for (const slot of packet.slots) {
  console.log(`slot ${slot.index}:${slot.templateId === undefined ? '' : `  ${slot.templateId}`}`);
  console.log(
    `  plotHookRolled: ${slot.hooks.map(hook => hook.id).join(', ')}   plotHookTaken: <id>`,
  );
  console.log(twoColumn(`  reach: ${slot.reach}`, `setting: ${slot.settingClass}`));
  console.log(
    twoColumn(`  shape: ${slot.decisionShape.id}`, `system: ${slot.systemTarget.id}`),
  );
  console.log(
    twoColumn(
      `  p3Shape: ${slot.seedDice.stake.id}`,
      `opposition: ${slot.seedDice.opposition.id} (${slot.seedDice.motive})`,
    ),
  );
  console.log(
    twoColumn(
      `  disposition: ${slot.seedDice.disposition ?? DISPOSITION_NOT_APPLICABLE}`,
      `agentRole: ${slot.seedDice.agentRole.id}`,
    ),
  );
  console.log(`  scale: ${slot.seedDice.scale}`);
  if (slot.consequenceHand !== undefined) {
    console.log(`  consequenceHand: ${slot.consequenceHand.join(', ')}`);
  }
}
console.log('```');
console.log('');

// ─── The spread ──────────────────────────────────────────────────────

console.log(RULE);
console.log('  Spread');
console.log(RULE);
for (const row of packet.spread) {
  const faces = row.counts.map(([face, count]) => `${face} ${count}×`).join(' · ') || '—';
  console.log(`  ${row.satisfied ? '✓' : '✗'} ${row.axis.padEnd(16)} ${faces}`);
  console.log(`      ${row.bound}${row.satisfied ? '' : '  ← NOT MET'}`);
}
console.log('');

const unmet = packet.spread.filter(row => !row.satisfied);
if (unmet.length > 0) {
  console.log(`  ${unmet.length} bound(s) unmet. A batch this small or this constrained cannot`);
  console.log('  honour every cap; the packet reports the bust rather than re-rolling to');
  console.log('  hide it. Widen --slots, or accept the spread and say so on the brief.');
  console.log('');
}

// ─── Closing notes ───────────────────────────────────────────────────

console.log('  Rolls propose, design disposes. A slot may override any roll, stated');
console.log('  with a reason on the brief — the caps bind the batch either way. The');
console.log('  consequence hand is the one binding row: `check:encounter` recomputes');
console.log('  it. Hooks stay advisory; nothing checks the finished encounter against');
console.log('  the premise it started from.');
console.log('');
const deferred = SYSTEM_TARGET_FACES.filter(face => face.maturity === 'deferred');
console.log(`  Not targetable yet (weight 0): ${deferred.map(face => face.id).join(' · ')}.`);
console.log(
  `  Setting die is gap-weighted; weights this run: `
    + SETTING_CLASSES.map(
        cls => `${cls} ${settingClassWeights(corpusCounts)[cls].toFixed(1)}`,
      ).join(' · '),
);
console.log(RULE);
console.log('');
