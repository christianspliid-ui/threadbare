import type { ReachDomain } from '../types/traits';
import type { StoredHungerId } from '../types/hunger';

export interface CandidateVignette {
  /** Unique ID (e.g. 'vignette.iron.sentinel'). */
  id: string;
  /** Display name template (will be replaced with generated name). */
  archetypeLabel: string;
  /** The primary reach this vignette implies. */
  primaryReach: ReachDomain;
  /** The secondary reach this vignette implies. */
  secondaryReach: ReachDomain;
  /** Narrative epithet (e.g. "blacksmith's son, broad-shouldered, stubborn"). */
  epithet: string;
  /**
   * The scene the god glimpses. Register (THR-868 WS6): plain and descriptive —
   * what the mortal is doing, and why they are doing it. Two or three sentences,
   * present tense, every one of them picturable. No closing abstraction: the old
   * "a loneliness that no amount of being right can cure" register is retired
   * game-wide (Christian, 2026-07-30). Enforced by
   * `src/data/__tests__/meetingProseRegister.test.ts`.
   */
  prose: string;
  /** 4:3 character portrait path. */
  imageAssetPath: string;
  /** Gradient fallback. */
  placeholderGradient: string;
  /** Hunger IDs this vignette resonates with (for filtering) — the stored dotted form. */
  hungerResonance: StoredHungerId[];
  /** Emotional tags for art matching. */
  emotionalTags: string[];
}

export const CANDIDATE_VIGNETTES: readonly CandidateVignette[] = [
  // ─── Iron (3) ───
  {
    id: 'vignette.iron.sentinel',
    archetypeLabel: 'Sentinel',
    primaryReach: 'iron',
    secondaryReach: 'stone',
    epithet: "wall-watcher, scarred hands, unflinching",
    prose: "She stands the third night watch alone. The others went in to warm their hands an hour ago; she stayed because on each of the last two nights she heard movement below the wall and no one believed her. She is still listening.",
    imageAssetPath: '/assets/meeting/candidates/iron-sentinel.jpg',
    placeholderGradient: 'linear-gradient(135deg, #2a1a1a, #3a2020, #1a0a0a)',
    hungerResonance: ['hunger.preserve', 'hunger.bind', 'hunger.reclaim'],
    emotionalTags: ['duty', 'endurance', 'isolation'],
  },
  {
    id: 'vignette.iron.champion',
    archetypeLabel: 'Champion',
    primaryReach: 'iron',
    secondaryReach: 'heart',
    epithet: "pit fighter, loyal to a fault, always carrying another's stake",
    prose: "The crowd is shouting his name and he is not listening to it. He is watching the woman in the third row, who put up everything she owned on him tonight. His ribs are cracked and he raises his fists again.",
    imageAssetPath: '/assets/meeting/candidates/iron-champion.jpg',
    placeholderGradient: 'linear-gradient(135deg, #3a1a0a, #2a1010, #1a0a0a)',
    hungerResonance: ['hunger.gather', 'hunger.kindle', 'hunger.reclaim'],
    emotionalTags: ['sacrifice', 'loyalty', 'strength'],
  },
  {
    id: 'vignette.iron.tactician',
    archetypeLabel: 'Tactician',
    primaryReach: 'iron',
    secondaryReach: 'eye',
    epithet: "young officer, cold eyes, three steps ahead",
    prose: "She has fought tomorrow's battle six times on the sand table and won all six. Her commander calls it a game and laughs. She has counted the men who will die at each gate, written the number beside it, and she has not changed her plan.",
    imageAssetPath: '/assets/meeting/candidates/iron-tactician.jpg',
    placeholderGradient: 'linear-gradient(135deg, #1a1a2a, #2a1a1a, #0a0a1a)',
    hungerResonance: ['hunger.reshape', 'hunger.sever', 'hunger.witness'],
    emotionalTags: ['control', 'intellect', 'ruthlessness'],
  },
  // ─── Gold (3) ───
  {
    id: 'vignette.gold.merchant',
    archetypeLabel: 'Merchant',
    primaryReach: 'gold',
    secondaryReach: 'eye',
    epithet: "merchant's daughter, ink-stained fingers, sharp-tongued",
    prose: "She is a dozen years younger than every trader at the table and she has read all of their ledgers. Hers stays in a locked case and she checks it twice a day. Two of them have stopped trying to short her on the count.",
    imageAssetPath: '/assets/meeting/candidates/gold-merchant.jpg',
    placeholderGradient: 'linear-gradient(135deg, #2a2a0a, #3a2a1a, #1a1a0a)',
    hungerResonance: ['hunger.gather', 'hunger.reshape', 'hunger.wander'],
    emotionalTags: ['ambition', 'cunning', 'commerce'],
  },
  {
    id: 'vignette.gold.patron',
    archetypeLabel: 'Patron',
    primaryReach: 'gold',
    secondaryReach: 'heart',
    epithet: "aging benefactor, weary smile, pockets lighter than his conscience",
    prose: "He has given away three fortunes and built four orphanages and he still does not sleep. Tonight he is walking the lower district, counting the children asleep on the steps. He hands over his cloak before he reaches the end of the street.",
    imageAssetPath: '/assets/meeting/candidates/gold-patron.jpg',
    placeholderGradient: 'linear-gradient(135deg, #2a2a1a, #1a2a1a, #2a1a0a)',
    hungerResonance: ['hunger.gather', 'hunger.kindle', 'hunger.preserve'],
    emotionalTags: ['generosity', 'guilt', 'compassion'],
  },
  {
    id: 'vignette.gold.smuggler',
    archetypeLabel: 'Smuggler',
    primaryReach: 'gold',
    secondaryReach: 'shadow',
    epithet: "river rat, quick hands, debts on both sides of the border",
    prose: "The barrels are labelled salt. They hold fever medicine for thirty people on the far side of the checkpoint. He has run this crossing seventeen times, been caught twice, and been told there will be no trial for a third.",
    imageAssetPath: '/assets/meeting/candidates/gold-smuggler.jpg',
    placeholderGradient: 'linear-gradient(135deg, #1a1a0a, #2a1a1a, #0a1a0a)',
    hungerResonance: ['hunger.wander', 'hunger.sever', 'hunger.consume'],
    emotionalTags: ['risk', 'resourcefulness', 'moral_grey'],
  },
  // ─── Shadow (3) ───
  {
    id: 'vignette.shadow.infiltrator',
    archetypeLabel: 'Infiltrator',
    primaryReach: 'shadow',
    secondaryReach: 'eye',
    epithet: "nobody's friend, everybody's confidant, a face for every room",
    prose: "Tonight she is a servant in a lord's house. Tomorrow she will be a priestess at the gate. She has used so many names that she keeps her own written on a scrap in her boot, and she has never once wanted it back.",
    imageAssetPath: '/assets/meeting/candidates/shadow-infiltrator.jpg',
    placeholderGradient: 'linear-gradient(135deg, #0a0a1a, #1a0a2a, #0a0a0a)',
    hungerResonance: ['hunger.witness', 'hunger.sever', 'hunger.consume'],
    emotionalTags: ['deception', 'identity', 'loss'],
  },
  {
    id: 'vignette.shadow.saboteur',
    archetypeLabel: 'Saboteur',
    primaryReach: 'shadow',
    secondaryReach: 'iron',
    epithet: "quiet hands, a grudge that burns cold, patient",
    prose: "He loosens the third bolt on the gate mechanism and puts it in his pocket. No one will find it missing until the siege engines arrive, and by then he will be two towns east, drinking with the men who paid him. He has never once thought about the people behind this wall.",
    imageAssetPath: '/assets/meeting/candidates/shadow-saboteur.jpg',
    placeholderGradient: 'linear-gradient(135deg, #1a0a0a, #0a0a1a, #1a1a1a)',
    hungerResonance: ['hunger.sever', 'hunger.reshape', 'hunger.reclaim'],
    emotionalTags: ['betrayal', 'precision', 'detachment'],
  },
  {
    id: 'vignette.shadow.manipulator',
    archetypeLabel: 'Manipulator',
    primaryReach: 'shadow',
    secondaryReach: 'heart',
    epithet: "the one who listens, the one who remembers, the one you should not have trusted",
    prose: "She remembers every secret anyone has told her, and she never set out to. She keeps them sorted by who would pay to bury them and who would kill to, and that sorted list is the only reason she sleeps.",
    imageAssetPath: '/assets/meeting/candidates/shadow-manipulator.jpg',
    placeholderGradient: 'linear-gradient(135deg, #1a0a1a, #2a0a1a, #0a0a1a)',
    hungerResonance: ['hunger.bind', 'hunger.gather', 'hunger.witness'],
    emotionalTags: ['control', 'vulnerability', 'secrets'],
  },
  // ─── Veil (3) ───
  {
    id: 'vignette.veil.diviner',
    archetypeLabel: 'Diviner',
    primaryReach: 'veil',
    secondaryReach: 'eye',
    epithet: "touched since birth, feared by her village, always right",
    prose: "She told the village the river would rise and they left the grain in the low barn. She told them the child would come wrong and they drove her out the same week. She sits at the crossroads now and answers only when paid, and she is still right.",
    imageAssetPath: '/assets/meeting/candidates/veil-diviner.jpg',
    placeholderGradient: 'linear-gradient(135deg, #1a0a2a, #2a1a3a, #0a0a1a)',
    hungerResonance: ['hunger.witness', 'hunger.illuminate', 'hunger.sever'],
    emotionalTags: ['isolation', 'truth', 'power'],
  },
  {
    id: 'vignette.veil.runecaster',
    archetypeLabel: 'Runecaster',
    primaryReach: 'veil',
    secondaryReach: 'stone',
    epithet: "mountain-born, ink under her nails, speaks to the rock",
    prose: "The symbols she cuts into the stone are older than any language spoken in this valley. Her grandmother taught her forty of them; she has worked out eleven more on her own. When she finishes the last line the rock goes warm under her palm.",
    imageAssetPath: '/assets/meeting/candidates/veil-runecaster.jpg',
    placeholderGradient: 'linear-gradient(135deg, #1a1a2a, #2a2a3a, #1a0a1a)',
    hungerResonance: ['hunger.preserve', 'hunger.bind', 'hunger.reshape'],
    emotionalTags: ['tradition', 'craft', 'ancient_power'],
  },
  {
    id: 'vignette.veil.empath',
    archetypeLabel: 'Empath',
    primaryReach: 'veil',
    secondaryReach: 'heart',
    epithet: "healer who feels too much, cracked hands, kind eyes",
    prose: "She puts her hands on the fevered child and takes the sickness into her own blood. It passes in a day or two; it always has so far. She has done this nine times this month and she has not turned anyone away at the door.",
    imageAssetPath: '/assets/meeting/candidates/veil-empath.jpg',
    placeholderGradient: 'linear-gradient(135deg, #1a1a2a, #1a2a2a, #1a0a2a)',
    hungerResonance: ['hunger.gather', 'hunger.kindle', 'hunger.haunt'],
    emotionalTags: ['empathy', 'sacrifice', 'healing'],
  },
  // ─── Heart (3) ───
  {
    id: 'vignette.heart.demagogue',
    archetypeLabel: 'Demagogue',
    primaryReach: 'heart',
    secondaryReach: 'gold',
    epithet: "born poor, speaks fire, the crowd hangs on every word",
    prose: "He owns his voice and a pair of boots. When he stands on the crate in the market square and talks about bread and dignity, the guards stop to listen instead of moving him along. He knows they will move him along tomorrow.",
    imageAssetPath: '/assets/meeting/candidates/heart-demagogue.jpg',
    placeholderGradient: 'linear-gradient(135deg, #2a1a0a, #3a1a1a, #1a0a0a)',
    hungerResonance: ['hunger.kindle', 'hunger.gather', 'hunger.reclaim'],
    emotionalTags: ['passion', 'justice', 'charisma'],
  },
  {
    id: 'vignette.heart.counselor',
    archetypeLabel: 'Counselor',
    primaryReach: 'heart',
    secondaryReach: 'eye',
    epithet: "quiet authority, the one they come to after midnight",
    prose: "She does not give advice. She asks questions, and people leave her rooms having reversed a decision they walked in certain of. The king's other counselors want her gone; the king will not sit a council without her.",
    imageAssetPath: '/assets/meeting/candidates/heart-counselor.jpg',
    placeholderGradient: 'linear-gradient(135deg, #1a2a1a, #2a2a1a, #0a1a0a)',
    hungerResonance: ['hunger.witness', 'hunger.reshape', 'hunger.preserve'],
    emotionalTags: ['wisdom', 'influence', 'restraint'],
  },
  {
    id: 'vignette.heart.martyr',
    archetypeLabel: 'Martyr',
    primaryReach: 'heart',
    secondaryReach: 'star',
    epithet: "the one who stays, the one who burns, the one they'll remember",
    prose: "They told her to run and she heard them clearly. There were still voices calling from the upper floor. She went back in through the doorway she had just come out of, and this is the third time she has done it.",
    imageAssetPath: '/assets/meeting/candidates/heart-martyr.jpg',
    placeholderGradient: 'linear-gradient(135deg, #2a0a0a, #2a1a1a, #3a0a0a)',
    hungerResonance: ['hunger.kindle', 'hunger.gather', 'hunger.consume'],
    emotionalTags: ['sacrifice', 'conviction', 'fire'],
  },
  // ─── Eye (3) ───
  {
    id: 'vignette.eye.cartographer',
    archetypeLabel: 'Cartographer',
    primaryReach: 'eye',
    secondaryReach: 'stone',
    epithet: "map-maker, restless feet, sees what others walk past",
    prose: "He measures the country in paces and marks it on hide with a charcoal stub worn down to his fingers. His map is more accurate than the king's and he knows it. He is saving coin for a season's walk into the four blank corners of it.",
    imageAssetPath: '/assets/meeting/candidates/eye-cartographer.jpg',
    placeholderGradient: 'linear-gradient(135deg, #0a1a2a, #1a2a2a, #0a0a1a)',
    hungerResonance: ['hunger.wander', 'hunger.witness', 'hunger.preserve'],
    emotionalTags: ['curiosity', 'precision', 'exploration'],
  },
  {
    id: 'vignette.eye.oracle',
    archetypeLabel: 'Oracle',
    primaryReach: 'eye',
    secondaryReach: 'veil',
    epithet: "sees too far, speaks in riddles, trusted by no one and consulted by all",
    prose: "The visions arrive whether she wants them or not. Last night, a city burning; the night before, a child who will be crowned. She writes each one down in a cipher no one else reads, dates it, and sets the page aside.",
    imageAssetPath: '/assets/meeting/candidates/eye-oracle.jpg',
    placeholderGradient: 'linear-gradient(135deg, #0a0a2a, #1a1a3a, #0a1a2a)',
    hungerResonance: ['hunger.witness', 'hunger.illuminate', 'hunger.haunt'],
    emotionalTags: ['prophecy', 'burden', 'truth'],
  },
  {
    id: 'vignette.eye.scout',
    archetypeLabel: 'Scout',
    primaryReach: 'eye',
    secondaryReach: 'shadow',
    epithet: "light-footed, sharp-eyed, always the first to know and last to be seen",
    prose: "She has watched the warband from the ridgeline for three days. She knows their number, their watch rotation, and which two drink through it. When the general asks how she knows, she shrugs; she lay still for longer than anyone else would.",
    imageAssetPath: '/assets/meeting/candidates/eye-scout.jpg',
    placeholderGradient: 'linear-gradient(135deg, #0a1a0a, #1a2a1a, #0a0a0a)',
    hungerResonance: ['hunger.wander', 'hunger.sever', 'hunger.witness'],
    emotionalTags: ['stealth', 'observation', 'independence'],
  },
  // ─── Stone (3) ───
  {
    id: 'vignette.stone.mason',
    archetypeLabel: 'Mason',
    primaryReach: 'stone',
    secondaryReach: 'gold',
    epithet: "builds to outlast himself, calloused hands, stubborn as the rock he shapes",
    prose: "The wall he is laying will stand a hundred years. He knows because his grandfather's wall is still standing and he learned the trade watching those stones settle. He lays four courses a day and refuses to lay a fifth.",
    imageAssetPath: '/assets/meeting/candidates/stone-mason.jpg',
    placeholderGradient: 'linear-gradient(135deg, #1a1a1a, #2a2a2a, #1a1a0a)',
    hungerResonance: ['hunger.preserve', 'hunger.bind', 'hunger.reshape'],
    emotionalTags: ['craft', 'patience', 'legacy'],
  },
  {
    id: 'vignette.stone.elder',
    archetypeLabel: 'Elder',
    primaryReach: 'stone',
    secondaryReach: 'heart',
    epithet: "village anchor, remembers what was agreed, voice like settling earth",
    prose: "She has buried three husbands and raised seven children and she is not finished. When the young ones fight over the well rights they come to her bench. She settles it by naming who dug the well, and why, and what they asked in return.",
    imageAssetPath: '/assets/meeting/candidates/stone-elder.jpg',
    placeholderGradient: 'linear-gradient(135deg, #2a1a1a, #1a1a1a, #2a2a1a)',
    hungerResonance: ['hunger.preserve', 'hunger.gather', 'hunger.bind'],
    emotionalTags: ['tradition', 'authority', 'community'],
  },
  {
    id: 'vignette.stone.geomancer',
    archetypeLabel: 'Geomancer',
    primaryReach: 'stone',
    secondaryReach: 'eye',
    epithet: "reads the bones of the earth, quiet, knows where the water runs",
    prose: "He presses his palm to the ground and listens. He can place the aquifer thirty feet down, the fault line a mile east, and the old temple's footings carrying a load they were never cut for. He has told the priests twice and they have not sent for a mason.",
    imageAssetPath: '/assets/meeting/candidates/stone-geomancer.jpg',
    placeholderGradient: 'linear-gradient(135deg, #1a1a0a, #1a2a1a, #0a1a1a)',
    hungerResonance: ['hunger.witness', 'hunger.preserve', 'hunger.wander'],
    emotionalTags: ['perception', 'earth', 'hidden_knowledge'],
  },
  // ─── Star (3) ───
  {
    id: 'vignette.star.templar',
    archetypeLabel: 'Templar',
    primaryReach: 'star',
    secondaryReach: 'iron',
    epithet: "faith made flesh, armored in conviction, eyes like burning scripture",
    prose: "He kneels in the mud at the ruined shrine and prays to a god who has never answered him. The bandits will reach the treeline by dawn. His sword is laid across his knees and he intends to be standing on this ground when they arrive.",
    imageAssetPath: '/assets/meeting/candidates/star-templar.jpg',
    placeholderGradient: 'linear-gradient(135deg, #2a2a1a, #3a2a0a, #1a1a0a)',
    hungerResonance: ['hunger.reclaim', 'hunger.kindle', 'hunger.preserve'],
    emotionalTags: ['faith', 'duty', 'fire'],
  },
  {
    id: 'vignette.star.seer',
    archetypeLabel: 'Seer',
    primaryReach: 'star',
    secondaryReach: 'eye',
    epithet: "reads the stars, speaks softly, carries what she knows too early",
    prose: "She has given the village three predictions and two have already come true. The third was about the harvest, and since then no one has asked her to dinner. She keeps reading the stars and she keeps saying aloud what she reads.",
    imageAssetPath: '/assets/meeting/candidates/star-seer.jpg',
    placeholderGradient: 'linear-gradient(135deg, #1a1a2a, #2a2a3a, #1a1a1a)',
    hungerResonance: ['hunger.illuminate', 'hunger.witness', 'hunger.haunt'],
    emotionalTags: ['prophecy', 'isolation', 'truth'],
  },
  {
    id: 'vignette.star.apostle',
    archetypeLabel: 'Apostle',
    primaryReach: 'star',
    secondaryReach: 'heart',
    epithet: "wandering preacher, open hands, believes ahead of the evidence",
    prose: "He walked into the plague village while the last carts were still leaving it. He brought no medicine and no training, only the conviction that no one should die alone in a room. Three weeks on, half the village is dead and the other half will not let him leave.",
    imageAssetPath: '/assets/meeting/candidates/star-apostle.jpg',
    placeholderGradient: 'linear-gradient(135deg, #2a1a2a, #2a2a1a, #1a0a1a)',
    hungerResonance: ['hunger.gather', 'hunger.kindle', 'hunger.consume'],
    emotionalTags: ['faith', 'compassion', 'recklessness'],
  },
];
