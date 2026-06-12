/**
 * Thread digest content tables — beat templates, transition phrases,
 * tension lines, and empty-state lines.
 *
 * 64 beat template keys × 3 variants = 192 beat templates.
 * 6 tension kinds × 3 variants = 18 tension templates.
 * 4 roles × 4 transition phrases = 16 transition phrases.
 * 3 empty-state lines.
 *
 * Placeholders resolved by enrichProse(): {name}, {location}, {ally:strongest},
 * {rival:strongest}, {faction}.
 */

import type { BeatRole } from '../engine/threadDigest';
import type { ReachDomain } from '../types/traits';
import type { TensionKind } from '../types/attention';

export type BeatTemplateKey = `${BeatRole}_${ReachDomain}_${'success' | 'failure'}`;

// ─── Beat Templates ───────────────────────────────────────────────────────────
// 64 keys × 3 variants = 192 total

export const BEAT_TEMPLATES: Record<BeatTemplateKey, [string, string, string]> = {

  // ── opener × iron ──
  opener_iron_success: [
    '{name} faced the danger head-on and came through bloodied but unbroken.',
    'The conflict found {name} in {location}, and {name} emerged the stronger for it.',
    '{name} tested blade against circumstance — and the world yielded.',
  ],
  opener_iron_failure: [
    '{name} entered the fight with certainty and left with wounds to remember.',
    'The violence in {location} did not go the way {name} intended.',
    '{name} learned the hard way that iron meets iron, and sometimes iron loses.',
  ],

  // ── opener × stone ──
  opener_stone_success: [
    '{name} put hands to work and the work held.',
    'What {name} built in {location} is still standing.',
    'The craft {name} brought to the task was enough — barely, but enough.',
  ],
  opener_stone_failure: [
    '{name} labored long and the effort came to nothing.',
    'The work {name} undertook in {location} crumbled before it was finished.',
    'Stone resists, and {name} learned where the limits of patience lie.',
  ],

  // ── opener × eye ──
  opener_eye_success: [
    '{name} uncovered something that others had missed.',
    'The investigation that began in {location} bore fruit for {name}.',
    '{name} looked carefully and what came into focus changed everything.',
  ],
  opener_eye_failure: [
    '{name} sought the truth and found only deeper questions.',
    'The answers {name} chased through {location} led somewhere unexpected.',
    '{name} looked hard and saw the wrong thing entirely.',
  ],

  // ── opener × gold ──
  opener_gold_success: [
    '{name} struck a deal that others thought impossible.',
    'The negotiation in {location} ended in {name}\'s favor.',
    '{name} found the price worth paying, and the exchange held.',
  ],
  opener_gold_failure: [
    '{name} reached for an agreement that fell through their fingers.',
    'The trade in {location} cost {name} more than was gained.',
    '{name} read the transaction wrong and paid for the mistake.',
  ],

  // ── opener × veil ──
  opener_veil_success: [
    '{name} crossed into the uncertain and returned with something real.',
    'The ritual attempted in {location} held, and the veil parted briefly for {name}.',
    '{name} spoke to what listens in the dark, and something listened back.',
  ],
  opener_veil_failure: [
    '{name} reached for the hidden and the hidden reached back.',
    'The working {name} attempted in {location} unraveled at the seam.',
    '{name} walked the threshold and came back changed in ways still unfolding.',
  ],

  // ── opener × heart ──
  opener_heart_success: [
    '{name} spoke the words that needed speaking, and someone heard.',
    'The trust that {name} extended in {location} was returned.',
    '{name} read the room and said exactly what was needed.',
  ],
  opener_heart_failure: [
    '{name} reached out and the connection did not hold.',
    'The words {name} offered in {location} landed wrong.',
    '{name} tried to bridge something and found the gap wider than expected.',
  ],

  // ── opener × star ──
  opener_star_success: [
    '{name} followed the thread of fate and it led somewhere worthwhile.',
    'What the stars had in mind for {name} proved kinder than expected.',
    '{name} stood where destiny indicated and found it a good place to stand.',
  ],
  opener_star_failure: [
    '{name} trusted the signs and the signs were wrong, or wrongly read.',
    'Fate handed {name} something in {location} that required careful handling — and it was dropped.',
    '{name} walked into what seemed written and found it improvised.',
  ],

  // ── opener × shadow ──
  opener_shadow_success: [
    '{name} moved through {location} unseen and learned what the seen cannot.',
    'The secret {name} carried stayed secret, and the secrecy paid off.',
    '{name} found the hidden door and no one noticed the opening.',
  ],
  opener_shadow_failure: [
    '{name} stepped where the shadows were thinner than expected.',
    'The approach that worked before cost {name} something in {location}.',
    '{name} played it quiet and the quiet was broken at the wrong moment.',
  ],

  // ── pivot × iron ──
  pivot_iron_success: [
    'When the real threat came, {name} was ready for it.',
    'The decisive moment in the conflict favored {name} — for once.',
    '{name} held the line when it mattered, and the line held.',
  ],
  pivot_iron_failure: [
    'The fight {name} could not avoid was also the fight {name} could not win.',
    'When violence found {name} in earnest, something broke that hasn\'t mended.',
    'The blow that landed on {name} in {location} changed the shape of what comes next.',
  ],

  // ── pivot × stone ──
  pivot_stone_success: [
    '{name}\'s patience paid off in a moment that couldn\'t have been forced.',
    'The craftsmanship {name} had been building toward finally came together.',
    'What {name} had been making in {location} proved exactly what was needed.',
  ],
  pivot_stone_failure: [
    'The work {name} had invested collapsed at its most important moment.',
    'Something built with care was lost, and {name} was the one holding it when it fell.',
    '{name}\'s labor in {location} reached its limit and the limit was too soon.',
  ],

  // ── pivot × eye ──
  pivot_eye_success: [
    '{name} saw what was actually there, and not what they expected to see.',
    'The pattern finally resolved for {name} — the real shape of things.',
    'Understanding came to {name} all at once, and it couldn\'t be unfound.',
  ],
  pivot_eye_failure: [
    '{name} looked directly at the answer and still missed it.',
    'The investigation turned on {name} — the revealed truth was about {name} instead.',
    'What {name} found in {location} wasn\'t what was sought, and it cost more to know.',
  ],

  // ── pivot × gold ──
  pivot_gold_success: [
    'The deal {name} made changed what was possible.',
    '{name} found the exchange that shifted the whole balance.',
    'What {name} traded away was worth less than what came back.',
  ],
  pivot_gold_failure: [
    '{name} made the deal that couldn\'t be unmade, and it went wrong.',
    'The price looked fair until the full accounting arrived for {name}.',
    '{name} traded the wrong thing for the wrong thing, and knew it too late.',
  ],

  // ── pivot × veil ──
  pivot_veil_success: [
    '{name} touched the deeper current and it moved in their favor.',
    'The power {name} called on answered, which is not always the case.',
    'What {name} attempted in {location} worked — and the working echoes still.',
  ],
  pivot_veil_failure: [
    '{name} reached too far into what isn\'t meant to be touched.',
    'The ritual failed at its most critical moment, and {name} bore the cost.',
    'The veil took something from {name} that it isn\'t giving back.',
  ],

  // ── pivot × heart ──
  pivot_heart_success: [
    '{name} said the right thing at exactly the right time.',
    'The relationship that had been uncertain became certain — for {name}.',
    'Someone chose to trust {name}, and it changed the direction of things.',
  ],
  pivot_heart_failure: [
    '{name} lost something in someone\'s estimation that was harder to rebuild than expected.',
    'The connection that failed in {location} left {name} more alone than before.',
    'What {name} said — or didn\'t say — broke something that had been whole.',
  ],

  // ── pivot × star ──
  pivot_star_success: [
    'The moment destiny had been pointing toward arrived, and {name} was in it.',
    '{name} recognized the turning when it came and stepped through the door.',
    'What the signs had been indicating revealed itself fully, and {name} was ready.',
  ],
  pivot_star_failure: [
    'The crossroads came and {name} took the wrong branch — or it took them.',
    '{name} was where fate said to be and found that fate\'s judgment was unkind.',
    'The cosmic pattern {name} had been reading turned out to read differently.',
  ],

  // ── pivot × shadow ──
  pivot_shadow_success: [
    '{name} did what needed doing where it couldn\'t be seen.',
    'The secret operation {name} ran through {location} came off cleanly.',
    '{name}\'s silence became the loudest thing in the room, and no one knew it.',
  ],
  pivot_shadow_failure: [
    '{name} was seen when being unseen was the whole plan.',
    'The covert approach collapsed, and {name} was left exposed in {location}.',
    'Someone knew — had always known — what {name} was doing, and {name} found out when it was too late.',
  ],

  // ── compound × iron ──
  compound_iron_success: [
    '{name} handled the violence with something like competence.',
    'The physical contest went {name}\'s way this time.',
    'Another fight, another morning after — {name} is still here.',
  ],
  compound_iron_failure: [
    '{name} took the damage and kept moving.',
    'The confrontation left marks, but {name} survived the accounting.',
    'Iron and iron — {name} came out worse, but came out.',
  ],

  // ── compound × stone ──
  compound_stone_success: [
    'The work {name} put in yielded something solid.',
    '{name}\'s efforts in {location} accumulated into something real.',
    'Day by day, what {name} was building became more like what it was meant to be.',
  ],
  compound_stone_failure: [
    '{name}\'s work hit resistance it couldn\'t move through.',
    'The effort {name} invested returned less than was put in.',
    'Labor without reward — {name} knows the feeling and keeps going.',
  ],

  // ── compound × eye ──
  compound_eye_success: [
    '{name} learned something that won\'t be unlearned.',
    'The investigation {name} ran through {location} added another piece.',
    '{name} filed away what was found, and the picture gets clearer.',
  ],
  compound_eye_failure: [
    '{name} looked for clarity and found more questions instead.',
    'The evidence {name} found in {location} pointed in three directions.',
    'What {name} knows now is that there\'s more to know.',
  ],

  // ── compound × gold ──
  compound_gold_success: [
    '{name} came to terms that suited both parties — or at least didn\'t offend either.',
    'The exchange {name} negotiated was fair enough to hold.',
    '{name} found the number everyone could live with.',
  ],
  compound_gold_failure: [
    '{name}\'s position at the table weakened.',
    'The negotiation left {name} with less than expected.',
    'The deal went sideways in ways {name} is still calculating.',
  ],

  // ── compound × veil ──
  compound_veil_success: [
    '{name} navigated the hidden currents and came through clean.',
    'The working {name} attempted in {location} held longer than expected.',
    '{name}\'s reach into the unseen found something worth the reaching.',
  ],
  compound_veil_failure: [
    '{name}\'s working frayed at the edges.',
    'The unseen proved unwilling to cooperate with {name} this time.',
    '{name} touched something and it left a mark.',
  ],

  // ── compound × heart ──
  compound_heart_success: [
    '{name} and {ally:strongest} found a way to move forward together.',
    'The relationship {name} has been tending showed signs of taking root.',
    '{name} spoke honestly and it was taken that way.',
  ],
  compound_heart_failure: [
    'The distance between {name} and {rival:strongest} didn\'t close.',
    '{name}\'s attempt at connection landed in empty air.',
    'The relationship {name} reached toward receded a little more.',
  ],

  // ── compound × star ──
  compound_star_success: [
    '{name} read the signs and the reading held.',
    'Fate nudged {name} in {location} and {name} moved with the nudge.',
    'The thread of destiny that runs through {name}\'s life held a little tighter.',
  ],
  compound_star_failure: [
    '{name}\'s reading of the stars came out wrong again.',
    'The portents meant something — but not what {name} thought.',
    'Fate seems to have a different direction in mind for {name} than {name} does.',
  ],

  // ── compound × shadow ──
  compound_shadow_success: [
    '{name} kept things quiet in {location}, and the quiet was useful.',
    'What {name} did there went unnoticed, which was the point.',
    '{name} gathered what could be gathered without being seen gathering it.',
  ],
  compound_shadow_failure: [
    '{name}\'s cover wasn\'t as solid as it felt.',
    'The quiet approach in {location} attracted exactly the kind of attention it was meant to avoid.',
    '{name} overestimated the darkness.',
  ],

  // ── closer × iron ──
  closer_iron_success: [
    'For now, {name} stands.',
    'The violence has quieted, and {name} is still in it.',
    '{name} is harder to break than expected — including by themselves.',
  ],
  closer_iron_failure: [
    '{name} carries the wounds forward.',
    'What was damaged in the fighting hasn\'t fully healed.',
    'The cost of the confrontation is still being paid.',
  ],

  // ── closer × stone ──
  closer_stone_success: [
    'The work holds, for now.',
    'What {name} built is still standing.',
    '{name}\'s labor is visible in the world, solid and patient.',
  ],
  closer_stone_failure: [
    '{name} is building again, from different materials.',
    'The failed work is a lesson {name} hasn\'t finished learning.',
    'Something was lost that can\'t be rebuilt exactly.',
  ],

  // ── closer × eye ──
  closer_eye_success: [
    '{name} knows more than before, and it shows.',
    'The understanding {name} has gathered is changing how {name} moves.',
    'Light fell on something, and {name} saw it.',
  ],
  closer_eye_failure: [
    '{name} is still looking.',
    'The question that brought {name} to {location} remains open.',
    'What was revealed was only enough to reveal how much is still hidden.',
  ],

  // ── closer × gold ──
  closer_gold_success: [
    'The terms hold, the exchange stands.',
    '{name}\'s deal is in the world now, doing what deals do.',
    'Someone owes {name} something, and {name} hasn\'t forgotten.',
  ],
  closer_gold_failure: [
    '{name} is recalculating.',
    'The position {name} holds at the table is weaker than before.',
    'The wrong deal was made, and its consequences are still arriving.',
  ],

  // ── closer × veil ──
  closer_veil_success: [
    'The working echoes, faint but real.',
    '{name} is changed in ways only the veil would recognize.',
    'What was touched has left its mark on {name}, and it isn\'t unwelcome.',
  ],
  closer_veil_failure: [
    '{name} is careful now, in ways that weren\'t learned easily.',
    'The veil took something — what exactly, {name} is still working out.',
    'The working failed, and its failure is a presence {name} carries.',
  ],

  // ── closer × heart ──
  closer_heart_success: [
    'The bond {name} strengthened is real now.',
    '{ally:strongest} and {name} have an understanding that wasn\'t there before.',
    '{name} is less alone in {location} than at the start.',
  ],
  closer_heart_failure: [
    '{name} has rebuilt walls they once chose to put down.',
    'The isolation is quieter now — {name} has grown used to it.',
    'What was lost in the failing connection is still felt in its absence.',
  ],

  // ── closer × star ──
  closer_star_success: [
    '{name} stands where the stars placed them, and the view is clear.',
    'The thread of destiny didn\'t break — {name} held it.',
    'What was written seems to have been, for once, written kindly.',
  ],
  closer_star_failure: [
    '{name} is writing their own fate now, since the stars\' version didn\'t work out.',
    'The pattern has shifted, and {name} is finding a new place in it.',
    'What was supposed to happen didn\'t — and now something else will.',
  ],

  // ── closer × shadow ──
  closer_shadow_success: [
    '{name} knows what few know, and that knowledge is safe.',
    'The secret held, and {name} is the richer for the holding.',
    'Silence is a kind of power, and {name} has it in full.',
  ],
  closer_shadow_failure: [
    '{name} is more visible than before, and working with that.',
    'The cover is thinner now — {name} moves more carefully.',
    'What was hidden has been seen, and {name} is still calculating the consequences.',
  ],
};

// ─── Transition Phrases ───────────────────────────────────────────────────────
// 4 roles × 4 variants = 16

export const TRANSITION_PHRASES: Record<BeatRole, [string, string, string, string]> = {
  opener: ['', '', '', ''],
  pivot: ['Then,', 'Everything shifted when', 'A turning came:', 'But this much stands out:'],
  compound: ['Meanwhile,', 'In those same days,', 'Along the way,', 'Around this time,'],
  closer: ['Now,', 'In the end,', 'What remains is this:', 'Since then,'],
};

// ─── Tension Templates ────────────────────────────────────────────────────────
// 6 kinds × 3 variants = 18

export const TENSION_TEMPLATES: Record<TensionKind, [string, string, string]> = {
  active_encounter: [
    '{name} is in the middle of something right now.',
    'Something is unresolved for {name}.',
    '{name} is not done with what started in {location}.',
  ],
  open_wound: [
    '{name} carries {attachment} — it shapes everything.',
    'The condition known as {attachment} follows {name} everywhere.',
    '{name} is walking wounded, and {attachment} is the wound.',
  ],
  faction_debt: [
    '{name} owes {faction} something — and {faction} hasn\'t forgotten.',
    'The obligation to {faction} hangs over {name}.',
    '{name} made a promise to {faction} that hasn\'t been kept.',
  ],
  pending_obligation: [
    '{name} has something unfinished.',
    'There\'s an obligation {name} hasn\'t discharged.',
    '{name} owes a debt that isn\'t yet due — but isn\'t forgotten either.',
  ],
  doom_pressure: [
    '{name} can feel something closing in.',
    'The pressure {name} is under is not imaginary.',
    '{name} is in a narrowing corridor.',
  ],
  idle: [
    '{name} moves through the world at their own pace.',
    'The thread of {name}\'s life runs quiet for now.',
    '{name} is between storms — for the moment.',
  ],
};

// ─── Empty State Lines ────────────────────────────────────────────────────────
// 3 variants

export const EMPTY_THREAD_LINES: [string, string, string] = [
  'The thread of {name}\'s story is just beginning to unspool.',
  '{name} has barely begun to leave a mark on the world.',
  'Not enough has happened yet to tell — but that won\'t last.',
];
