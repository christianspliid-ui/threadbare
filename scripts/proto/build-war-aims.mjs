// Splices the war-aims sketch from the crown sketch's snapshot/purse half + war-aims-main.part.ts.
import fs from 'fs';
const src = fs.readFileSync('scripts/proto/crown-sketch.ts', 'utf8').split('\n');
const cut = src.findIndex(l => l.startsWith('// ─── Oaths'));
let head = src.slice(0, cut).join('\n');
const rep = (a, b) => { if (!head.includes(a)) throw new Error('missing: ' + a); head = head.split(a).join(b); };
rep('THR-1917 crown and fealty — OBSERVER SKETCH over the THR-1867 faction purse ledger.', 'THR-1868 economic war aims — OBSERVER SKETCH over the THR-1867 purse ledger (snapshot code from the THR-1917 crown sketch).');
rep('const TICKS = 1080;', 'const TICKS = 600;');
rep("'.cache/crown-snapshots.json'", "'.cache/war-aims-snapshots.json'");
rep("'scripts/proto/crown-sketch.output.txt'", "'scripts/proto/war-aims-sketch.output.txt'");
rep("'CrownSketch'", "'WarAimsSketch'");
rep('home?: string; monster?: boolean;', 'home?: string; monster?: boolean; monopolies?: string[];');
rep("monster: n.properties.isMonsterFaction === true || n.properties.factionType === 'monster' ? true : undefined,",
  "monster: n.properties.isMonsterFaction === true || n.properties.factionType === 'monster' ? true : undefined,\n    monopolies: Array.isArray(n.properties.monopolies) ? (n.properties.monopolies as string[]) : [],");
// Enemies also come from relates_to sentiment (war basis / below the rivalry threshold, phaseFactionActions).
rep("if (e.properties.isRival === true) relations.push({ a: e.source, b: e.target, k: 'rival' });",
  "if (e.properties.isRival === true || e.properties.basis === 'war' || (typeof e.properties.sentiment === 'number' && e.properties.sentiment < -0.3)) relations.push({ a: e.source, b: e.target, k: 'rival' });");
const main = fs.readFileSync('scripts/proto/war-aims-main.part.ts', 'utf8');
fs.writeFileSync('scripts/proto/war-aims-sketch.ts', head + '\n' + main);
console.log('wrote scripts/proto/war-aims-sketch.ts');
