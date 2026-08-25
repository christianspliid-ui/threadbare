/**
 * `draw:packet` — the Encounter Factory's whole brief, rolled at once. THR-1245.
 *
 * Director ruling (Christian, chat, 2026-08-25): the factory hands an authoring
 * agent a set of rolled values plus the guidance to use them, so nobody has to
 * learn every table and roll slot by slot. One command per batch:
 *
 *   npm run draw:packet -- <briefSlug>
 *   npm run draw:packet -- <briefSlug> --slots 6 --reaches iron,,veil
 *   npm run draw:packet -- <briefSlug> --ids encounter.camp.a,encounter.road.b
 *   npm run draw:packet -- <briefSlug> --json
 *
 * Per slot it composes every existing roll — plot hooks (THR-1147), the five
 * Seed Dice (THR-1224), the binding consequence hand where a planned template
 * id is given (THR-1145) — with the four packet dice (reach, decision shape,
 * gap-weighted setting class, maturity-gated system target), enforcing the
 * batch caps and floors by construction. The tail of the printout is the
 * ready-to-paste "Rolled constraints" block for the batch brief.
 *
 * Deterministic: same slug in, same batch out (the setting die also reads the
 * live corpus census, like the hook table reads `usedBy` — shipping encounters
 * legitimately moves later rolls). Rolls propose, design disposes: a slot may
 * override a roll on the brief with a stated reason; the caps bind either way.
 *
 * Exit codes:
 *   0  a packet was rolled
 *   1  bad arguments, or a catalog health violation
 */

import { UNIFIED_ACTION_TEMPLATES } from '../src/data/unified-action-templates';
import { REACH_DOMAINS, type ReachDomain } from '../src/types/traits';
import type { RarityTier } from '../src/types/rarity';
import { SETTING_CLASS_MAP } from '../src/data/settingClasses';
import {
  CONSEQUENCE_FAMILY_EFFECT_KINDS,
  consequenceHandSize,
} from '../src/data/content-eval/consequenceDraw';
import {
  PLOT_HOOKS,
  plotHookCatalogViolations,
  plotHookWeight,
} from '../src/data/content-eval/plotHooks';
import {
  DISPOSITION_NOT_APPLICABLE,
  seedDiceCatalogViolations,
} from '../src/data/content-eval/seedDice';
import {
  PACKET_DEFAULT_RARITY,
  PACKET_DEFAULT_SLOTS,
  packetDiceCatalogViolations,
  rollBatchPacket,
  settingCoverageFromTemplates,
  type BatchPacket,
  type SlotPacket,
} from '../src/data/content-eval/packetDice';

// ─── Args ────────────────────────────────────────────────────────────

const argv = process.argv.slice(2);
const wantsJson = argv.includes('--json');

const VALUE_FLAGS = ['slots', 'reaches', 'ids', 'rarity', 'count'] as const;

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

const briefSlug = positional[0];
if (!briefSlug) {
  console.error(
    'Usage: npm run draw:packet -- <briefSlug> [--slots n] [--reaches r1,r2,…] '
      + '[--ids id1,id2,…] [--rarity 1|2|3|4] [--count n] [--json]\n'
      + '       (empty positions in --reaches/--ids csv leave that slot rolled/pending)',
  );
  process.exit(1);
}

const slotsArg = flag('slots');
const parsedSlots = slotsArg === undefined ? undefined : Number(slotsArg);
if (parsedSlots !== undefined && (!Number.isInteger(parsedSlots) || parsedSlots < 1)) {
  console.error(`--slots must be a positive integer, got '${slotsArg}'`);
  process.exit(1);
}
const slotCount = parsedSlots ?? PACKET_DEFAULT_SLOTS;

const reachesArg = flag('reaches');
let reachOverrides: (ReachDomain | undefined)[] | undefined;
if (reachesArg !== undefined) {
  reachOverrides = reachesArg.split(',').map(raw => {
    const trimmed = raw.trim();
    return trimmed === '' ? undefined : (trimmed as ReachDomain);
  });
  const unknown = reachOverrides.filter(
    (reach): reach is ReachDomain =>
      reach !== undefined && !(REACH_DOMAINS as readonly string[]).includes(reach),
  );
  if (unknown.length > 0) {
    console.error(`Unknown reach(es) '${unknown.join(', ')}'. One of: ${REACH_DOMAINS.join(', ')}`);
    process.exit(1);
  }
}

const idsArg = flag('ids');
const templateIds = idsArg
  ?.split(',')
  .map(raw => (raw.trim() === '' ? undefined : raw.trim()));

const rarityArg = flag('rarity');
const parsedRarity = rarityArg === undefined ? undefined : Number(rarityArg);
if (parsedRarity !== undefined && ![1, 2, 3, 4].includes(parsedRarity)) {
  console.error(`Unknown rarity '${rarityArg}'. One of: 1, 2, 3, 4`);
  process.exit(1);
}
const rarityTier = (parsedRarity as RarityTier | undefined) ?? PACKET_DEFAULT_RARITY;

const countArg = flag('count');
const parsedCount = countArg === undefined ? undefined : Number(countArg);
if (parsedCount !== undefined && (!Number.isInteger(parsedCount) || parsedCount < 1)) {
  console.error(`--count must be a positive integer, got '${countArg}'`);
  process.exit(1);
}

// ─── Catalog health, first ───────────────────────────────────────────

const violations = [
  ...plotHookCatalogViolations(),
  ...seedDiceCatalogViolations(),
  ...packetDiceCatalogViolations(),
];
if (violations.length > 0) {
  console.error('Brief-stage catalog has violations:');
  for (const violation of violations) console.error(`  ✗ ${violation}`);
  process.exit(1);
}

// ─── Roll ────────────────────────────────────────────────────────────

const settingCoverage = settingCoverageFromTemplates(UNIFIED_ACTION_TEMPLATES);

const packet: BatchPacket = rollBatchPacket({
  briefSlug,
  slots: slotCount,
  reaches: reachOverrides,
  templateIds,
  rarities: templateIds?.map(id => (id === undefined ? undefined : rarityTier)),
  settingCoverage,
  hookCount: parsedCount,
});

// ─── JSON mode ───────────────────────────────────────────────────────

if (wantsJson) {
  console.log(
    JSON.stringify(
      {
        briefSlug,
        slotCount,
        settingCoverage,
        slots: packet.slots.map(slot => ({
          slot: slot.slot,
          slotSeed: slot.slotSeed,
          reach: slot.reach,
          reachOverridden: slot.reachOverridden,
          hooks: slot.hooks.map(hook => ({
            id: hook.id,
            hook: hook.hook,
            themes: hook.themes,
            weight: plotHookWeight(hook, slot.reach),
            timesUsed: hook.usedBy.length,
          })),
          seedDice: {
            p3Shape: slot.seedDice.stake.id,
            p2Must: slot.seedDice.stake.p2Must,
            closingFormat: slot.seedDice.stake.closingFormat,
            needsNamedOwner: slot.seedDice.stake.needsNamedOwner,
            opposition: slot.seedDice.opposition.id,
            motive: slot.seedDice.motive,
            activity: slot.seedDice.activity ?? null,
            disposition: slot.seedDice.disposition ?? DISPOSITION_NOT_APPLICABLE,
            agentRole: slot.seedDice.agentRole.id,
            scale: slot.seedDice.scale,
          },
          decisionShape: slot.decisionShape,
          settingClass: slot.settingClass,
          settingSubtypes: SETTING_CLASS_MAP[slot.settingClass],
          systemTarget: slot.systemTarget,
          consequence: slot.consequence
            ? {
                ...slot.consequence,
                effectKinds: Object.fromEntries(
                  slot.consequence.hand.map(family => [
                    family,
                    CONSEQUENCE_FAMILY_EFFECT_KINDS[family],
                  ]),
                ),
              }
            : null,
        })),
        spread: packet.spread,
        violations: packet.violations,
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

// ─── Print ───────────────────────────────────────────────────────────

console.log('');
console.log('══════════════════════════════════════════════════════════════');
console.log('  The Authoring Packet');
console.log('══════════════════════════════════════════════════════════════');
console.log(`  brief     ${briefSlug}`);
console.log(`  slots     ${slotCount}`);
console.log(`  hooks     ${PLOT_HOOKS.length} in the table`);
console.log('');

for (const slot of packet.slots) {
  printSlot(slot);
}

// ── Spread ───────────────────────────────────────────────────────────

console.log('──────────────────────────────────────────────────────────────');
console.log('  Batch spread (caps hold by construction)');
console.log('──────────────────────────────────────────────────────────────');
printSpreadLine('reach', packet.spread.reach);
printSpreadLine('stake', packet.spread.stake);
printSpreadLine('opposition', packet.spread.opposition);
printSpreadLine('disposition', packet.spread.disposition);
printSpreadLine('agent role', packet.spread.agentRole);
printSpreadLine('scale', packet.spread.scale);
printSpreadLine('shape', packet.spread.decisionShape);
printSpreadLine('setting', packet.spread.settingClass);
printSpreadLine('system', packet.spread.systemTarget);
if (packet.spread.hooksOfferedTwice.length > 0) {
  console.log(
    `  ⚠ hooks offered to more than one slot: ${packet.spread.hooksOfferedTwice.join(', ')}`
      + ' — fine as offers, but do not take the same hook twice',
  );
}
console.log('');

if (packet.violations.length > 0) {
  console.log('  ✗ CAPS BREACHED (an override or an oversized batch):');
  for (const violation of packet.violations) console.log(`      ${violation}`);
  console.log('');
}

// ── The ready-to-paste brief block ───────────────────────────────────

console.log('──────────────────────────────────────────────────────────────');
console.log('  Rolled constraints — paste into the batch brief');
console.log('──────────────────────────────────────────────────────────────');
console.log('');
console.log('```');
for (const slot of packet.slots) {
  const dice = slot.seedDice;
  console.log(`slot ${slot.slot}:`);
  console.log(
    `  plotHookRolled: ${slot.hooks.map(hook => hook.id).join(', ')}   plotHookTaken: <pick one>`,
  );
  console.log(
    `  p3Shape: ${dice.stake.id}   opposition: ${dice.opposition.id} (motive: ${dice.motive})`,
  );
  console.log(
    `  disposition: ${dice.disposition ?? DISPOSITION_NOT_APPLICABLE}   agentRole: ${dice.agentRole.id}`,
  );
  console.log(
    `  scale: ${dice.scale}   reach: ${slot.reach}${slot.reachOverridden ? ' (override)' : ''}`,
  );
  console.log(`  decisionShape: ${slot.decisionShape.id}   settingClass: ${slot.settingClass}`);
  console.log(
    `  systemTarget: ${slot.systemTarget.id}   consequenceHand: ${
      slot.consequence
        ? slot.consequence.hand.join(', ')
        : `<pending: npm run draw:consequences -- <templateId> --reach ${slot.reach}>`
    }`,
  );
}
console.log('```');
console.log('');
console.log('  Rolls propose, design disposes — a slot may override a roll with a');
console.log('  stated reason; the batch caps bind either way. Take ONE hook per');
console.log('  slot (or blend two) and record the choice. The consequence hand is');
console.log('  BINDING once rolled from the real template id; everything else is');
console.log('  capped or advisory per the spec\'s enforcement tiers.');
console.log('══════════════════════════════════════════════════════════════');
console.log('');

// ─── Helpers ─────────────────────────────────────────────────────────

function printSlot(slot: SlotPacket): void {
  const dice = slot.seedDice;
  console.log('──────────────────────────────────────────────────────────────');
  console.log(`  Slot ${slot.slot} — reach: ${slot.reach}${slot.reachOverridden ? '  (override)' : ''}`);
  console.log('──────────────────────────────────────────────────────────────');

  console.log('  hooks (take one, or blend two):');
  for (const hook of slot.hooks) {
    console.log(`    ▸ ${hook.id}  ·  weight ${plotHookWeight(hook, slot.reach).toFixed(2)}`
      + (hook.usedBy.length > 0 ? `  ·  used ${hook.usedBy.length}×` : ''));
    console.log(`        ${hook.hook}`);
  }

  console.log(`  p3Shape:     ${dice.stake.id} — P2 must establish ${dice.stake.p2Must}`);
  console.log(`               closing: ${dice.stake.closingFormat}`);
  if (dice.stake.needsNamedOwner) {
    console.log('               this shape needs a named person to own the problem');
  }
  console.log(
    `  opposition:  ${dice.opposition.label} (motive: ${dice.motive})`
      + (dice.activity === undefined
        ? '  ·  activity: authored'
        : `  ·  activity: ${dice.activity}`),
  );
  console.log(
    `  disposition: ${dice.disposition ?? DISPOSITION_NOT_APPLICABLE}`
      + (dice.disposition === undefined ? '  (no willed opposition)' : ''),
  );
  console.log(
    `  agentRole:   ${dice.agentRole.label}`
      + (dice.agentRole.note === undefined ? '' : `  — e.g. ${dice.agentRole.note}`),
  );
  console.log(`  scale:       ${dice.scale}`);

  console.log(`  shape:       ${slot.decisionShape.label}  (${slot.decisionShape.steps})`);
  console.log(`               ${slot.decisionShape.useWhen}`);
  console.log(
    `  setting:     ${slot.settingClass}  [gap weight ${slot.settingWeight.toFixed(2)}]`
      + `  →  ${SETTING_CLASS_MAP[slot.settingClass].join(', ')}`,
  );
  console.log('               author one opening for this class (arrival · situation · problem)');
  console.log(
    `  system:      ${slot.systemTarget.label}  [${slot.systemTarget.tier}]  — ${slot.systemTarget.guidance}`,
  );

  if (slot.consequence) {
    console.log(
      `  consequences (BINDING, ${slot.consequence.hand.length} of `
        + `${consequenceHandSize(slot.consequence.rarityTier)} for ${slot.consequence.templateId}):`,
    );
    for (const family of slot.consequence.hand) {
      console.log(
        `    ▸ ${family} — wire one of: ${CONSEQUENCE_FAMILY_EFFECT_KINDS[family].join(', ')}`,
      );
    }
  } else {
    console.log(
      `  consequences: pending the template id — run: npm run draw:consequences -- <id> --reach ${slot.reach}`,
    );
  }
  console.log('');
}

function printSpreadLine(
  label: string,
  counts: Readonly<Partial<Record<string, number>>>,
): void {
  const entries = Object.entries(counts).filter(([, count]) => (count ?? 0) > 0);
  if (entries.length === 0) return;
  console.log(
    `  ${label.padEnd(12)}${entries.map(([face, count]) => `${face}×${count}`).join('  ')}`,
  );
}
