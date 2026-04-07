/**
 * Culture Mores Prose — composes grounded, descriptive prose about how a
 * settlement's people live, govern, and work based on their CultureIdentity.
 *
 * Prose is built by composing two independently-authored sentence pools:
 *   1. Foundation opener (social structure, governance, justice)
 *   2. Sphere daily-life (what people value, how they spend their days)
 *
 * Material vocabulary from the CultureIdentity fills {material1}/{material2}
 * slots where they appear, giving each culture concrete, visual specifics.
 *
 * Design intent: mid-register prose — concrete enough to visualize daily life,
 * not so poetic that it becomes abstract. Starts with "Here" / "In this place" /
 * "In this settlement" to ground the reader in the location.
 */

import type { CultureIdentity } from '../types/culture';
import type { SphereName } from '../types';
import { mulberry32 } from '../lib/prng';

// ─── Foundation Openers (social structure + governance) ─────────────

const FOUNDATION_SENTENCES: Record<string, string[]> = {
  chaos: [
    'Here, authority belongs to whoever can hold it. There are no bloodlines of rule — leaders rise through challenge and fall the same way, and no one holds power long enough to grow comfortable with it.',
    'In this place, power shifts with the season. Nobody inherits their standing — it is earned in the open and lost just as publicly, and the people would have it no other way.',
    'In this settlement, the only fixed rule is that nothing stays fixed. Leaders serve until someone stronger or cleverer steps forward, and transitions of power are blunt, public affairs.',
  ],
  order: [
    'Here, everyone has a role, and the role has rules. Birth and trade determine standing, and the law applies equally from the magistrate\'s bench to the furthest field.',
    'In this place, rank is fixed by birth and reinforced by function. Laws are written, posted publicly, and enforced without exception — the same code binds the baker and the bailiff.',
    'In this settlement, predictability is a virtue. People know their station, their obligations, and their rights, and the whole system works because no one is above it.',
  ],
  light: [
    'Here, decisions are made in the open. Councils gather where everyone can hear, and disputes are settled by public testimony — there are no closed doors in matters of justice.',
    'In this place, privacy is treated with suspicion. Communal assemblies settle everything from trade disputes to boundary claims, and the worst punishment is to be seen doing wrong.',
    'In this settlement, transparency is the highest virtue. Walls are thin by custom, not poverty, and the people take pride in having nothing that cannot withstand a neighbor\'s scrutiny.',
  ],
  darkness: [
    'In this settlement, not everyone knows the same things, and that is by design. Society is layered into circles of trust — newcomers learn only what they need, and deeper knowledge is earned through ritual and patience.',
    'Here, what you know determines who you are. Initiation rites govern access to trade secrets, governance, and sacred knowledge, and the uninitiated accept their ignorance as the natural order.',
    'In this place, secrecy is structure, not deception. Disputes are resolved by tribunals that meet behind closed doors, and their judgments are accepted without question.',
  ],
};

// ─── Sphere Daily-Life Sentences ────────────────────────────────────
// Slots: {material1}, {material2} filled from CultureIdentity.materialVocabulary

const SPHERE_SENTENCES: Record<string, string[]> = {
  force: [
    'Disputes settle in fighting circles while the rest of the settlement watches. The smiths work {material1} and {material2} into practical weapons, and children learn to fight before they learn much else.',
    'Training grounds stand at the center of the settlement, not the market. Even the farmers carry weapons, and scars are displayed with the same pride other places reserve for fine clothes.',
    'Seasonal bouts and sparring matches mark the calendar here. The best fighters eat first and drink free, and {material1} lines the walls of every home as a reminder of what matters.',
  ],
  matter: [
    'The craft guilds run everything that counts. Apprentices spend years working {material1} and {material2} before earning the right to sell their own goods, and master artisans outrank most officials.',
    'Workshops outnumber homes. {material1} and {material2} are the stuff of daily life, and shoddy workmanship is treated as a genuine scandal — grounds for losing your trade license.',
    'Quality of craft determines standing as much as any title. Buildings are put together with visible care, every joint fitted and every surface finished, and the people take fierce pride in things built to last.',
  ],
  energy: [
    'The settlement hums with constant motion. Festivals spark up without much planning, trade happens at odd hours, and the streets are rarely quiet even after dark.',
    'Nothing stays the same for long here. Market stalls rearrange weekly, buildings get repurposed between seasons, and a person standing idle draws concerned looks from their neighbors.',
    'Movement is valued above stillness. {material1} and {material2} change hands rapidly in the busy markets, and the people treat boredom as a genuine affliction.',
  ],
  life: [
    'Gardens grow between every dwelling, tended communally. The healers\' houses are the largest buildings, and daily life follows the cycles of growth — planting, tending, harvesting, rest.',
    'Birth and death are public occasions here, celebrated and mourned with equal attention. {material1} and {material2} fill the common spaces, and the people mark time by growing seasons rather than calendars.',
    'The boundary between settlement and garden is deliberately blurred. {material1} covers the walkways, {material2} frames the doorways, and the people tend growing things with the same attention others give to commerce.',
  ],
  mind: [
    'Debate halls and archives sit at the settlement\'s center, not temples or barracks. Disagreements are settled by argument rather than authority, and even the laborers have opinions about philosophy.',
    'Children here are taught letters alongside chores. {material1} and {material2} are everyday goods, and the people trust what is written down over what is merely spoken.',
    'Records are kept of everything — trade, weather, births, disputes. The place produces more scribes than soldiers, and knowledge is hoarded as carefully as coin.',
  ],
  spirit: [
    'Small shrines sit on doorsteps and windowsills throughout the settlement, tended with {material1} and {material2}. The line between daily routine and sacred observance is thin here — almost nonexistent.',
    'The people speak of the unseen as naturally as they speak of the weather. {material1} hang in doorways, {material2} mark property lines, and even mundane tasks begin with quiet rituals.',
    'Communion with something beyond the material is part of daily life here. Meditation and prayer are as regular as meals, and the settlement\'s quiet has a deliberate weight to it.',
  ],
  time: [
    'The elders run things here, and age is the primary currency of respect. {material1} and {material2} mark every public space, and the people plan in generations rather than seasons.',
    'Everything is measured against what came before. The people are patient by nature — content to wait for results that may take years to arrive, and suspicious of anyone in a hurry.',
    'Ancestor shrines outnumber market stalls. Children learn the names of seven generations before they learn a trade, and the dead are treated as a living presence in daily decisions.',
  ],
  entropy: [
    'Death is treated as a neighbor here, not an enemy. {material1} and {material2} sit alongside living decorations without anyone finding it strange, and the people are simply untroubled by endings.',
    'The settlement maintains its decay rather than fighting it. Weathered {material1} is left where it forms, and the people find a quiet beauty in things that other places would rush to repair.',
    'Memorials to the departed take up as much space as homes for the living. The people tend {material1} and {material2} with the same care others give to gardens, and speak of endings as transformations.',
  ],
};

// ─── Slot Filler ────────────────────────────────────────────────────

/**
 * Replace {material1} and {material2} with items picked from materialVocabulary.
 * Guarantees the two picks are distinct when the pool has ≥2 items.
 */
function fillMaterialSlots(template: string, materials: string[], rng: () => number): string {
  if (materials.length === 0) {
    return template.replace(/\{material1\}/g, 'local goods').replace(/\{material2\}/g, 'worked materials');
  }
  let result = template;
  const idx1 = Math.floor(rng() * materials.length);
  result = result.replace(/\{material1\}/g, materials[idx1]);

  if (result.includes('{material2}')) {
    if (materials.length === 1) {
      result = result.replace(/\{material2\}/g, materials[0]);
    } else {
      let idx2 = Math.floor(rng() * (materials.length - 1));
      if (idx2 >= idx1) idx2++;
      result = result.replace(/\{material2\}/g, materials[idx2]);
    }
  }
  return result;
}

// ─── Main Composer ──────────────────────────────────────────────────

/**
 * Compose a culture-mores paragraph from a CultureIdentity.
 *
 * Returns null if the identity lacks the required fields.
 * Deterministic: same identity + seed = same output.
 */
export function composeCultureMores(
  identity: CultureIdentity,
  seed: number,
): string | null {
  const foundation = identity.foundationBias?.toLowerCase();
  if (!foundation) return null;

  const foundationPool = FOUNDATION_SENTENCES[foundation];
  if (!foundationPool || foundationPool.length === 0) return null;

  const rng = mulberry32(seed);

  // Pick foundation opener
  const foundationSentence = foundationPool[Math.floor(rng() * foundationPool.length)];

  // Pick sphere daily-life sentence (use primary venerated sphere)
  const primarySphere = identity.veneratedSpheres?.[0] as string | undefined;
  const spherePool = primarySphere ? SPHERE_SENTENCES[primarySphere] : null;
  if (!spherePool || spherePool.length === 0) return foundationSentence;

  const sphereTemplate = spherePool[Math.floor(rng() * spherePool.length)];
  const sphereSentence = fillMaterialSlots(
    sphereTemplate,
    identity.materialVocabulary ?? [],
    rng,
  );

  return `${foundationSentence} ${sphereSentence}`;
}
