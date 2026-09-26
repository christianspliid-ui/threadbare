// write-doc.mjs — renders the THR-1236 review document from generated items.
// Static sections (how it was made, the dial, the critique, findings) live in notes.mjs,
// written by hand after reading the output; everything per-item comes from the generator.

const GH = (p) => `https://github.com/christianspliid-ui/threadbare/blob/main/${p}`;
export const LINKS = {
  thr1236: 'https://linear.app/threadbare/issue/THR-1236/item-generator-sketch-thirty-generated-items-to-react-to',
  thr1227: 'https://linear.app/threadbare/issue/THR-1227/wayfinder-map-item-generator',
  thr1234: 'https://linear.app/threadbare/issue/THR-1234/item-minting-today-where-items-are-born-and-what-shapes-them',
  thr1235: 'https://linear.app/threadbare/issue/THR-1235/random-table-raw-material-what-the-world-can-tell-the-generator',
  thr1237: 'https://linear.app/threadbare/issue/THR-1237/per-primitive-activation-ledger-what-live-means-for-every-dead-or',
  thr1232: 'https://linear.app/threadbare/issue/THR-1232/power-generator-sketch-twenty-generated-spells-to-react-to',
  fightBlock: GH('Docs/plans/2026-09-23-fight-block.md'),
  activation: GH('Docs/plans/2026-08-25-effect-vocabulary-activation.md'),
  wiring: GH('Docs/plans/2026-04-16-systemic-wiring-guide.md'),
  effects: GH('src/types/effects.ts'),
  catalog: GH('src/data/reward-attachment-catalog.ts'),
  rarity: GH('src/types/rarity.ts'),
  artifactTraits: GH('src/data/artifact-trait-content.ts'),
  artifactTraitsEngine: GH('src/engine/artifactTraits.ts'),
  conditions: GH('src/data/condition-trait-content.ts'),
  contentTags: GH('src/data/content-tags.ts'),
  contentObjects: GH('src/data/content-objects.ts'),
  cultureContent: GH('src/data/culture-content.ts'),
  workNames: GH('src/data/work-name-content.ts'),
  voiceBible: GH('src/data/faction-voice-bible.ts'),
  drawTable: GH('src/data/content-eval/drawTable.ts'),
  strategicOps: GH('src/engine/strategicGraphOps.ts'),
  dispatch: GH('src/engine/effects/effectEventDispatch.ts'),
  executors: GH('src/engine/effectExecutors.ts'),
  movementCost: GH('src/engine/movementCost.ts'),
  effectTick: GH('src/engine/effectTick.ts'),
  quintessenceTypes: GH('src/types/quintessence.ts'),
  predicates: GH('src/engine/effects/effectPredicates.ts'),
  factionDefs: GH('src/data/faction-definitions.ts'),
  monsterDefs: GH('src/data/monster-faction-definitions.ts'),
  itemBands: GH('src/data/item-stat-bands.ts'),
  effectConstants: GH('src/data/effect-constants.ts'),
  domainWords: GH('src/data/domain-words.ts'),
};

const NUMWORD = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function card(item, n, readback, underTheHood) {
  const kind = `${item.kindName} (${item.formNoun.replace(/^(pair|set|pot|bundle|flask) of /, '')})`;
  const tags = [];
  if (item.classes.includes('fight')) tags.push('matters in a fight');
  if (item.classes.includes('world')) tags.push('works on the map');
  if (item.classes.includes('social')) tags.push('social');
  const tropeBit = item.trope ? `trope: *${item.trope.label}*` : 'no trope (free composition)';
  const lines = [];
  lines.push(`### ${n}. ${item.name}`);
  lines.push(`**${item.rarity}** · ${kind} · Sphere: ${cap(item.sphere)} · Reach: ${cap(item.reach)} · ${tropeBit}${tags.length ? ` · ${tags.join(', ')}` : ''}`);
  lines.push('');
  lines.push(`**What it is.** ${item.look} ${item.provenance}`);
  lines.push('');
  lines.push(`**What it does.** ${item.words.does.join(' ')}`);
  lines.push('');
  lines.push(`**The catch.** ${item.words.catches.length ? item.words.catches.join(' ') : 'None. It is simply good.'}`);
  if (item.words.fight.length) {
    lines.push('');
    lines.push(`**Planned — in a fight.** ${item.words.fight.join(' ')} *(The fight system reads this in its last slice, not built yet.)*`);
  }
  lines.push('');
  const hood = underTheHood(item, readback).map(s => s.replace(/⚑ /g, '').replace(/✓/g, 'clean,').replace(/✗/g, 'FAILED:'));
  lines.push(`<sub>${hood.join('<br>')}</sub>`);
  lines.push('');
  return lines.join('\n');
}

function glance(items, offset = 0) {
  const rows = ['| # | Name | Rarity | What it is | Trope | Fight | Map / social | Catch |', '|---|---|---|---|---|---|---|---|'];
  items.forEach((it, i) => {
    rows.push(`| ${i + 1 + offset} | ${it.name} | ${it.rarity} | ${it.formNoun.replace(/^(pair|set|pot|bundle|flask) of /, '')} | ${it.trope ? it.trope.label : '—'} | ${it.classes.includes('fight') ? 'yes' : ''} | ${[it.classes.includes('world') ? 'map' : '', it.classes.includes('social') ? 'social' : ''].filter(Boolean).join(', ')} | ${it.words.catches.length ? 'yes' : ''} |`);
  });
  return rows.join('\n');
}

export function writeDoc({ main, second, free, readback, seeds, cov, notes, underTheHood, TROPES }) {
  const cardFor = (it, n) => card(it, n, readback, underTheHood);
  const out = [];
  const byTier = (t) => main.filter(i => i.tier === t);
  const tropeCounts = {};
  for (const it of main) if (it.trope) tropeCounts[it.trope.id] = (tropeCounts[it.trope.id] ?? 0) + 1;
  const rb = readback ?? {};
  const allItems = [...main, ...second, ...free];
  const rbClean = allItems.filter(i => rb[i.id]?.ok).length;
  const rbChecks = allItems.reduce((s, i) => s + (rb[i.id]?.checks ?? 0), 0);

  out.push('# Thirty generated items — for reaction');
  out.push('');
  out.push(`Prototype for [THR-1236](${LINKS.thr1236}) on the [Item Generator map](${LINKS.thr1227}). Every item below was rolled by a seeded generator from random tables, world concepts, fantasy tropes and the game's own effect vocabulary. **Nothing was hand-edited.** Seed ${seeds.main}; a second seed and a no-trope run are in the appendices.`);
  out.push('');
  out.push(`Every effect is a real, working game effect: nothing here uses an effect the engine cannot run today, and ${readback ? `the real engine read back all ${allItems.length} items (${rbClean} clean, ${rbChecks} individual checks)` : 'the engine read-back has not been run yet'}. Two things that fights will read once the fight system's last slice lands are shown separately, marked **Planned**.`);
  out.push('');
  out.push('## How to react');
  out.push('');
  out.push('Skim the table, then read the cards that catch your eye. For each item, one word is enough: **cool**, **fine**, **flat** or **wrong** — and a few words on why if you have them. Reactions on the questions below settle the design in one pass.');
  out.push('');
  out.push('What your reactions decide:');
  out.push('');
  out.push('1. **The bar.** Which of these would you be glad to see a mortal pick up? Which are flat?');
  out.push(`2. **Which trope tables earn their place.** ${Object.keys(tropeCounts).length} tropes fired; each is listed on its card. Which would you cut, and what is missing?`);
  out.push('3. **The name grammar.** Eight name shapes are in play (listed under *How these were made*). Which read as names you would remember?');
  out.push('4. **How world-flavoured.** Items are faction-made, monster-taken, place-bred or history-touched. Which kind of story do you want most of?');
  out.push('5. **The rarity spread.** Nine Mundane, nine Storied, seven Mythic, five Legendary. Should the generator make Mundane things at all, or leave those to the hand catalog?');
  out.push('6. **The dial.** Items here grow around a hand-written core. Appendix B shows the same machine with the cores switched off.');
  out.push('');
  out.push('## At a glance');
  out.push('');
  out.push(glance(main));
  out.push('');
  out.push(`Coverage: ${cov.fight} items matter in a fight (across ${NUMWORD[cov.fightBands]} rarity bands); ${cov.worldSocial} work on the map or socially (across ${NUMWORD[cov.worldSocialBands]} bands); ${cov.tropes} of ${TROPES.length} tropes appear; ${main.filter(i => i.words.catches.length).length} of ${main.length} carry a catch.`);
  out.push('');
  let n = 1;
  for (const t of [1, 2, 3, 4]) {
    const items = byTier(t);
    out.push(`## ${items[0]?.rarity ?? ''} — ${NUMWORD[items.length]} items`);
    out.push('');
    for (const it of items) out.push(cardFor(it, n++));
  }
  out.push('---');
  out.push('');
  out.push(`## Appendix A — a second seed (seed ${seeds.second}, five items)`);
  out.push('');
  out.push('Same tables, different dice — to show the variety between runs.');
  out.push('');
  second.forEach((it, i) => out.push(cardFor(it, `A${i + 1}`)));
  out.push(`## Appendix B — the dial: the same machine with the trope cores switched off`);
  out.push('');
  out.push(notes.dialIntro);
  out.push('');
  free.forEach((it, i) => out.push(cardFor(it, `B${i + 1}`)));
  out.push('---');
  out.push('');
  out.push(notes.howMade(tropeCounts));
  out.push('');
  out.push(notes.dial);
  out.push('');
  out.push(notes.critique);
  out.push('');
  out.push(notes.findings);
  out.push('');
  out.push(notes.footer);
  out.push('');
  return out.join('\n');
}
