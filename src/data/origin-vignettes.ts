import type { ReachDomain } from '../types/traits';

/**
 * Origin-vignette content library (THR-539, content half of THR-526).
 *
 * A flat, engine-free pool of pre-history vignettes that seed an agent's
 * *baseline* personality at birth. Each vignette nudges one axiological axis
 * toward its virtue or vice pole. The consumer (THR-526's birth-seeding hook)
 * draws several at birth, maps `reach` → the canonical `axisId` via the
 * THR-536 registry, and derives the *signed* delta from `pole`:
 *
 *   virtue → +magnitude   (toward 1.0, the virtue pole)
 *   vice   → −magnitude   (toward 0.0, the vice pole)
 *
 * This file knows nothing about `axisId`, `AxiologicalProfile`, or the
 * registry — it keys on `(reach, pole)` only. The reach→pole vocabulary is
 * frozen by THR-524 (Done); see `Docs/canon/cosmology.md`. Keeping the key at
 * `(reach, pole)` is what makes this library parallel-safe with the registry
 * trie (THR-536/537/538): nothing here reworks when `axisId` strings finalize.
 *
 * Frozen 8-axis vocabulary (virtue pole 1.0 / vice pole 0.0):
 *   iron   — Brave/Protector      / Power-Hungry/Conqueror
 *   gold   — Generous/Patron      / Greedy/Extractor
 *   shadow — Fair/Broker          / Scheming/Manipulator
 *   veil   — Patient/Weaver       / Impatient/Unraveller
 *   heart  — Loyal/Sworn          / Disloyal/Renegade
 *   eye    — Perceptive/Seer      / Judgemental/Inquisitor
 *   stone  — Dependable/Keeper     / Reckless/Destroyer
 *   star   — Inspiring/Beacon      / Discouraging/Anchor
 *
 * Voice: Threadbare house style (`Docs/canon/prose.md`) — plain, concrete,
 * one-line pre-history circumstances. Show the soil, not the flower. Every
 * entry is generic and reusable: no proper nouns, no setting-specific
 * locations, no gendered assumptions.
 */

/** Which pole of a reach's virtue/vice axis a vignette leans toward. */
export type OriginVignettePole = 'virtue' | 'vice';

/**
 * Unsigned nudge strength. The sign is derived from `pole` at consumption
 * time, never stored here. Skewed toward the smaller deltas so that drawing
 * several at birth yields a roughly normal baseline (central-limit) rather
 * than extremes.
 */
export type OriginVignetteMagnitude = 0.05 | 0.1 | 0.15 | 0.2;

export interface OriginVignette {
  /** Stable, unique id. Format: `origin.<reach>.<pole>.<slug>`. */
  id: string;
  /** One-line pre-history vignette in Threadbare voice. */
  text: string;
  /** The reach whose virtue/vice axis this vignette nudges. */
  reach: ReachDomain;
  /** Which pole the vignette leans toward. */
  pole: OriginVignettePole;
  /** Unsigned magnitude; sign comes from `pole` at consumption. */
  magnitude: OriginVignetteMagnitude;
}

export const ORIGIN_VIGNETTES: readonly OriginVignette[] = [
  // ─────────────────────────────── IRON ───────────────────────────────
  // Virtue: Brave / Protector
  { id: 'origin.iron.virtue.doorway', text: 'Was the smallest in a house of fists, and stood in the doorway anyway.', reach: 'iron', pole: 'virtue', magnitude: 0.05 },
  { id: 'origin.iron.virtue.walked-home', text: 'Walked the younger ones home through the bad streets every night, unasked.', reach: 'iron', pole: 'virtue', magnitude: 0.05 },
  { id: 'origin.iron.virtue.nearest-door', text: 'Slept nearest the door, so whatever came through would reach it first.', reach: 'iron', pole: 'virtue', magnitude: 0.05 },
  { id: 'origin.iron.virtue.the-dog', text: 'Never ran from the dog the whole street ran from.', reach: 'iron', pole: 'virtue', magnitude: 0.05 },
  { id: 'origin.iron.virtue.raised-hand', text: 'Stepped in front of a hand raised against someone smaller, and held there.', reach: 'iron', pole: 'virtue', magnitude: 0.1 },
  { id: 'origin.iron.virtue.night-watch', text: 'Stood the night watch alone while the others warmed their hands by the fire.', reach: 'iron', pole: 'virtue', magnitude: 0.1 },
  { id: 'origin.iron.virtue.carried-stranger', text: 'Carried a hurt stranger half a day to help, though no one would have known otherwise.', reach: 'iron', pole: 'virtue', magnitude: 0.1 },
  { id: 'origin.iron.virtue.bought-time', text: 'Faced the men who came for the neighbours, unarmed, and bought the rest time to run.', reach: 'iron', pole: 'virtue', magnitude: 0.15 },
  { id: 'origin.iron.virtue.burning-house', text: 'Turned back alone into the burning house, and came out carrying someone.', reach: 'iron', pole: 'virtue', magnitude: 0.2 },
  // Vice: Power-Hungry / Conqueror
  { id: 'origin.iron.vice.first-fight', text: 'Won the first fight young, and never forgot how quiet the others went after.', reach: 'iron', pole: 'vice', magnitude: 0.05 },
  { id: 'origin.iron.vice.the-stick', text: 'Learned that whoever held the stick made the rules, and kept hold of the stick.', reach: 'iron', pole: 'vice', magnitude: 0.05 },
  { id: 'origin.iron.vice.counting-weakness', text: 'Counted the weaknesses of others the way some count coins.', reach: 'iron', pole: 'vice', magnitude: 0.05 },
  { id: 'origin.iron.vice.stepped-aside', text: 'Liked the way the smaller ones stepped aside, and made sure they kept doing it.', reach: 'iron', pole: 'vice', magnitude: 0.05 },
  { id: 'origin.iron.vice.head-of-table', text: 'Took the head of the table before it was offered, and dared anyone to object.', reach: 'iron', pole: 'vice', magnitude: 0.1 },
  { id: 'origin.iron.vice.fear-cheaper', text: 'Found that fear bought obedience cheaper than kindness ever had.', reach: 'iron', pole: 'vice', magnitude: 0.1 },
  { id: 'origin.iron.vice.little-kingdom', text: 'Ran the yard like a little kingdom, and tithed every newcomer.', reach: 'iron', pole: 'vice', magnitude: 0.1 },
  { id: 'origin.iron.vice.broke-the-pack', text: 'Broke the strongest of the pack first, so the rest would kneel unasked.', reach: 'iron', pole: 'vice', magnitude: 0.15 },
  { id: 'origin.iron.vice.burned-the-road', text: 'Burned the road behind a taken hill, so nothing could be taken back.', reach: 'iron', pole: 'vice', magnitude: 0.2 },

  // ─────────────────────────────── GOLD ───────────────────────────────
  // Virtue: Generous / Patron
  { id: 'origin.gold.virtue.last-bread', text: 'Always split the last bread three ways, even when two would have done.', reach: 'gold', pole: 'virtue', magnitude: 0.05 },
  { id: 'origin.gold.virtue.better-coat', text: 'Gave away the better coat to someone colder, and said nothing about it.', reach: 'gold', pole: 'virtue', magnitude: 0.05 },
  { id: 'origin.gold.virtue.saved-a-share', text: 'Saved a share for the one who had not come home yet.', reach: 'gold', pole: 'virtue', magnitude: 0.05 },
  { id: 'origin.gold.virtue.extra-change', text: 'Handed back the extra change the merchant miscounted in their favour.', reach: 'gold', pole: 'virtue', magnitude: 0.05 },
  { id: 'origin.gold.virtue.fed-any-stranger', text: 'Grew up in a house that fed any stranger who knocked, however thin the larder.', reach: 'gold', pole: 'virtue', magnitude: 0.1 },
  { id: 'origin.gold.virtue.first-wages', text: 'Spent the first wages on the family debts and kept none of it.', reach: 'gold', pole: 'virtue', magnitude: 0.1 },
  { id: 'origin.gold.virtue.orphaned-animal', text: 'Took in the orphaned animal nobody else would, and shared the scraps.', reach: 'gold', pole: 'virtue', magnitude: 0.1 },
  { id: 'origin.gold.virtue.hidden-savings', text: 'Emptied a hidden savings to a neighbour in ruin, and never mentioned the loan.', reach: 'gold', pole: 'virtue', magnitude: 0.15 },
  { id: 'origin.gold.virtue.whole-harvest', text: 'Gave the whole harvest to a starving village, and went hungry through the winter for it.', reach: 'gold', pole: 'virtue', magnitude: 0.2 },
  // Vice: Greedy / Extractor
  { id: 'origin.gold.vice.harvest-sold', text: 'Grew up watching the harvest sold off while the family went hungry.', reach: 'gold', pole: 'vice', magnitude: 0.05 },
  { id: 'origin.gold.vice.hid-the-food', text: 'Learned to hide the good food before the others got to the table.', reach: 'gold', pole: 'vice', magnitude: 0.05 },
  { id: 'origin.gold.vice.secret-count', text: 'Kept a secret count of what everyone owed, down to the smallest favour.', reach: 'gold', pole: 'vice', magnitude: 0.05 },
  { id: 'origin.gold.vice.stale-sweets', text: 'Hoarded the sweets long after they had gone stale, rather than share.', reach: 'gold', pole: 'vice', magnitude: 0.05 },
  { id: 'origin.gold.vice.taking-next-time', text: 'Watched a landlord take the last of the grain, and decided to be the one taking next time.', reach: 'gold', pole: 'vice', magnitude: 0.1 },
  { id: 'origin.gold.vice.tight-fist', text: 'Found early that a tight fist kept more than an open hand ever did.', reach: 'gold', pole: 'vice', magnitude: 0.1 },
  { id: 'origin.gold.vice.always-collected', text: 'Lent to the desperate at a child’s idea of interest, and always collected.', reach: 'gold', pole: 'vice', magnitude: 0.1 },
  { id: 'origin.gold.vice.bought-the-well', text: 'Bought the well the village depended on, and charged them for their own thirst.', reach: 'gold', pole: 'vice', magnitude: 0.15 },
  { id: 'origin.gold.vice.roof-tiles', text: 'Stripped a failing farm of everything that could be sold, roof tiles and all.', reach: 'gold', pole: 'vice', magnitude: 0.2 },

  // ────────────────────────────── SHADOW ──────────────────────────────
  // Virtue: Fair / Broker
  { id: 'origin.shadow.virtue.held-the-stakes', text: 'Was the one the other children trusted to hold the stakes of a bet.', reach: 'shadow', pole: 'virtue', magnitude: 0.05 },
  { id: 'origin.shadow.virtue.down-the-middle', text: 'Always cut the shared thing down the middle, even when no one was watching.', reach: 'shadow', pole: 'virtue', magnitude: 0.05 },
  { id: 'origin.shadow.virtue.both-sides', text: 'Heard both sides of every yard quarrel before saying a word.', reach: 'shadow', pole: 'virtue', magnitude: 0.05 },
  { id: 'origin.shadow.virtue.found-purse', text: 'Returned the found purse with every coin still in it.', reach: 'shadow', pole: 'virtue', magnitude: 0.05 },
  { id: 'origin.shadow.virtue.market-disputes', text: 'Settled the market disputes the grown-ups were too proud to settle themselves.', reach: 'shadow', pole: 'virtue', magnitude: 0.1 },
  { id: 'origin.shadow.virtue.refused-bribe', text: 'Refused to take a bribe to look the other way, even as a hungry child.', reach: 'shadow', pole: 'virtue', magnitude: 0.1 },
  { id: 'origin.shadow.virtue.believed-by-both', text: 'Grew up translating between two feuding families, and was believed by both.', reach: 'shadow', pole: 'virtue', magnitude: 0.1 },
  { id: 'origin.shadow.virtue.held-the-terms', text: 'Brokered a peace between rival crews, and held to the terms when it cost them friends.', reach: 'shadow', pole: 'virtue', magnitude: 0.15 },
  { id: 'origin.shadow.virtue.hard-truth', text: 'Testified to a hard truth that ruined a powerful patron, because it was true.', reach: 'shadow', pole: 'virtue', magnitude: 0.2 },
  // Vice: Scheming / Manipulator
  { id: 'origin.shadow.vice.wanted-to-hear', text: 'Learned which lie each adult wanted to hear, and told it to them.', reach: 'shadow', pole: 'vice', magnitude: 0.05 },
  { id: 'origin.shadow.vice.one-against-other', text: 'Played one parent against the other to get what neither would give alone.', reach: 'shadow', pole: 'vice', magnitude: 0.05 },
  { id: 'origin.shadow.vice.whispered-secret', text: 'Found that a whispered secret bought more than an honest favour.', reach: 'shadow', pole: 'vice', magnitude: 0.05 },
  { id: 'origin.shadow.vice.ledger-of-shame', text: 'Kept a careful ledger of everyone’s shame, in case it was ever useful.', reach: 'shadow', pole: 'vice', magnitude: 0.05 },
  { id: 'origin.shadow.vice.from-the-edge', text: 'Spread the rumour that turned the yard against a rival, and watched from the edge.', reach: 'shadow', pole: 'vice', magnitude: 0.1 },
  { id: 'origin.shadow.vice.smile-widest', text: 'Learned to smile widest at the people they meant to use.', reach: 'shadow', pole: 'vice', magnitude: 0.1 },
  { id: 'origin.shadow.vice.others-secrets', text: 'Traded other people’s secrets like coins, and never spent their own.', reach: 'shadow', pole: 'vice', magnitude: 0.1 },
  { id: 'origin.shadow.vice.engineered-disgrace', text: 'Engineered a friend’s disgrace to take the place that should have been theirs.', reach: 'shadow', pole: 'vice', magnitude: 0.15 },
  { id: 'origin.shadow.vice.inherited-both', text: 'Set two protectors against each other, and inherited what both had built.', reach: 'shadow', pole: 'vice', magnitude: 0.2 },

  // ─────────────────────────────── VEIL ───────────────────────────────
  // Virtue: Patient / Weaver
  { id: 'origin.veil.virtue.mended-net', text: 'Could sit a whole afternoon mending one net, and finish it right.', reach: 'veil', pole: 'virtue', magnitude: 0.05 },
  { id: 'origin.veil.virtue.waited-out', text: 'Waited out every tantrum without raising a voice.', reach: 'veil', pole: 'virtue', magnitude: 0.05 },
  { id: 'origin.veil.virtue.the-tide', text: 'Learned to wait for the tide rather than fight it.', reach: 'veil', pole: 'virtue', magnitude: 0.05 },
  { id: 'origin.veil.virtue.any-knot', text: 'Was the one who could untangle any knot the others gave up on.', reach: 'veil', pole: 'virtue', magnitude: 0.05 },
  { id: 'origin.veil.virtue.three-winters', text: 'Spent three winters learning a craft that took most people ten, and did not rush it.', reach: 'veil', pole: 'virtue', magnitude: 0.1 },
  { id: 'origin.veil.virtue.slow-tree', text: 'Tended a slow-growing tree, knowing it would shade someone else’s children.', reach: 'veil', pole: 'virtue', magnitude: 0.1 },
  { id: 'origin.veil.virtue.same-wall', text: 'Rebuilt the same wall a dozen times until it finally held.', reach: 'veil', pole: 'virtue', magnitude: 0.1 },
  { id: 'origin.veil.virtue.failing-orchard', text: 'Nursed a failing orchard back over years, when everyone said to cut it down.', reach: 'veil', pole: 'virtue', magnitude: 0.15 },
  { id: 'origin.veil.virtue.decade-vigil', text: 'Kept a vigil that lasted a decade, and was still there at the end of it.', reach: 'veil', pole: 'virtue', magnitude: 0.2 },
  // Vice: Impatient / Unraveller
  { id: 'origin.veil.vice.half-baked', text: 'Could never wait for the bread to cool, and ate it half-baked.', reach: 'veil', pole: 'vice', magnitude: 0.05 },
  { id: 'origin.veil.vice.early-carrots', text: 'Pulled the half-grown carrots up early, just to see.', reach: 'veil', pole: 'vice', magnitude: 0.05 },
  { id: 'origin.veil.vice.stopped-being-easy', text: 'Abandoned every craft the moment it stopped being easy.', reach: 'veil', pole: 'vice', magnitude: 0.05 },
  { id: 'origin.veil.vice.snapped-the-thread', text: 'Snapped the tangled thread rather than work it loose.', reach: 'veil', pole: 'vice', magnitude: 0.05 },
  { id: 'origin.veil.vice.tore-it-down', text: 'Tore down the half-built thing in a temper, and started over more than once.', reach: 'veil', pole: 'vice', magnitude: 0.1 },
  { id: 'origin.veil.vice.quick-wins', text: 'Left every long task to others and took only the quick wins.', reach: 'veil', pole: 'vice', magnitude: 0.1 },
  { id: 'origin.veil.vice.fast-wrong', text: 'Learned that a fast wrong answer drew less scorn at home than a slow right one.', reach: 'veil', pole: 'vice', magnitude: 0.1 },
  { id: 'origin.veil.vice.burned-the-work', text: 'Burned a season’s patient work because the result came too slowly.', reach: 'veil', pole: 'vice', magnitude: 0.15 },
  { id: 'origin.veil.vice.unpicked-saving', text: 'Unpicked a family’s years of careful saving in a single reckless afternoon.', reach: 'veil', pole: 'vice', magnitude: 0.2 },

  // ─────────────────────────────── HEART ──────────────────────────────
  // Virtue: Loyal / Sworn
  { id: 'origin.heart.virtue.every-promise', text: 'Kept every promise made to the other children, however small.', reach: 'heart', pole: 'virtue', magnitude: 0.05 },
  { id: 'origin.heart.virtue.never-told', text: 'Never told, not even when telling would have spared a beating.', reach: 'heart', pole: 'virtue', magnitude: 0.05 },
  { id: 'origin.heart.virtue.long-nights', text: 'Stayed at a sick friend’s side through the long dull nights.', reach: 'heart', pole: 'virtue', magnitude: 0.05 },
  { id: 'origin.heart.virtue.came-back', text: 'Came back for the one left behind, every time.', reach: 'heart', pole: 'virtue', magnitude: 0.05 },
  { id: 'origin.heart.virtue.took-the-punishment', text: 'Took a punishment meant for a friend, and never named them.', reach: 'heart', pole: 'virtue', magnitude: 0.1 },
  { id: 'origin.heart.virtue.followed-exiled', text: 'Followed an exiled companion out of the only home they had known.', reach: 'heart', pole: 'virtue', magnitude: 0.1 },
  { id: 'origin.heart.virtue.wrote-for-years', text: 'Wrote letters for years to someone everyone else had given up on.', reach: 'heart', pole: 'virtue', magnitude: 0.1 },
  { id: 'origin.heart.virtue.disgraced-family', text: 'Stood by a disgraced family when standing by them cost everything.', reach: 'heart', pole: 'virtue', magnitude: 0.15 },
  { id: 'origin.heart.virtue.oath-to-the-dead', text: 'Honoured an oath to the dead long after anyone living remembered it was sworn.', reach: 'heart', pole: 'virtue', magnitude: 0.2 },
  // Vice: Disloyal / Renegade
  { id: 'origin.heart.vice.loudest-promises', text: 'Learned early that the loudest promises were the first ones broken.', reach: 'heart', pole: 'vice', magnitude: 0.05 },
  { id: 'origin.heart.vice.traded-up', text: 'Found it easy to trade up to a better set of friends.', reach: 'heart', pole: 'vice', magnitude: 0.05 },
  { id: 'origin.heart.vice.foot-toward-door', text: 'Kept one foot toward the door in every house they lived in.', reach: 'heart', pole: 'vice', magnitude: 0.05 },
  { id: 'origin.heart.vice.forgot-the-debt', text: 'Forgot a debt of kindness the moment a better offer came.', reach: 'heart', pole: 'vice', magnitude: 0.05 },
  { id: 'origin.heart.vice.slept-fine', text: 'Sold out the gang the first time it was convenient, and slept fine after.', reach: 'heart', pole: 'vice', magnitude: 0.1 },
  { id: 'origin.heart.vice.stopped-paying', text: 'Left every alliance the moment it stopped paying.', reach: 'heart', pole: 'vice', magnitude: 0.1 },
  { id: 'origin.heart.vice.first-to-turn', text: 'Learned that the first to turn coat was the last to be punished.', reach: 'heart', pole: 'vice', magnitude: 0.1 },
  { id: 'origin.heart.vice.betrayed-shelter', text: 'Betrayed the one who had sheltered them, for a stranger’s promise.', reach: 'heart', pole: 'vice', magnitude: 0.15 },
  { id: 'origin.heart.vice.broke-blood-oath', text: 'Broke a blood-oath in open daylight, and walked away whistling.', reach: 'heart', pole: 'vice', magnitude: 0.2 },

  // ──────────────────────────────── EYE ───────────────────────────────
  // Virtue: Perceptive / Seer
  { id: 'origin.eye.virtue.read-the-weather', text: 'Read the weather in people’s faces before they spoke.', reach: 'eye', pole: 'virtue', magnitude: 0.05 },
  { id: 'origin.eye.virtue.hands-moved', text: 'Always knew which adult was lying by the way their hands moved.', reach: 'eye', pole: 'virtue', magnitude: 0.05 },
  { id: 'origin.eye.virtue.missing-thing', text: 'Noticed the missing thing in a room before anyone said it was gone.', reach: 'eye', pole: 'virtue', magnitude: 0.05 },
  { id: 'origin.eye.virtue.coming-storm', text: 'Could tell a coming storm by the smell of the morning.', reach: 'eye', pole: 'virtue', magnitude: 0.05 },
  { id: 'origin.eye.virtue.steer-clear', text: 'Learned to spot trouble a street away, and steer the others clear.', reach: 'eye', pole: 'virtue', magnitude: 0.1 },
  { id: 'origin.eye.virtue.about-to-fail', text: 'Watched the market closely enough to know who was about to fail.', reach: 'eye', pole: 'virtue', magnitude: 0.1 },
  { id: 'origin.eye.virtue.days-before', text: 'Saw the quarrel coming days before it broke, and said so.', reach: 'eye', pole: 'virtue', magnitude: 0.1 },
  { id: 'origin.eye.virtue.scraps-connected', text: 'Pieced together a hidden danger from scraps no one else thought to connect.', reach: 'eye', pole: 'virtue', magnitude: 0.15 },
  { id: 'origin.eye.virtue.still-smiling', text: 'Saw the betrayal in a trusted face while everyone else was still smiling.', reach: 'eye', pole: 'virtue', magnitude: 0.2 },
  // Vice: Judgemental / Inquisitor
  { id: 'origin.eye.vice.private-tally', text: 'Kept a private tally of everyone else’s small failures.', reach: 'eye', pole: 'vice', magnitude: 0.05 },
  { id: 'origin.eye.vice.inside-a-minute', text: 'Could name what was wrong with a person inside a minute of meeting them.', reach: 'eye', pole: 'vice', magnitude: 0.05 },
  { id: 'origin.eye.vice.worst-reading', text: 'Trusted the worst reading of a stranger, and was rarely talked out of it.', reach: 'eye', pole: 'vice', magnitude: 0.05 },
  { id: 'origin.eye.vice.no-one-could-meet', text: 'Measured every newcomer against a standard no one could meet.', reach: 'eye', pole: 'vice', magnitude: 0.05 },
  { id: 'origin.eye.vice.find-the-flaw', text: 'Learned to find the flaw first, and named it before anyone could hide it.', reach: 'eye', pole: 'vice', magnitude: 0.1 },
  { id: 'origin.eye.vice.high-window', text: 'Sat in judgement of the whole street from a high window.', reach: 'eye', pole: 'vice', magnitude: 0.1 },
  { id: 'origin.eye.vice.proof-after', text: 'Decided early who was guilty, and went looking for the proof after.', reach: 'eye', pole: 'vice', magnitude: 0.1 },
  { id: 'origin.eye.vice.only-the-chase', text: 'Hounded a suspected liar until the truth no longer mattered, only the chase.', reach: 'eye', pole: 'vice', magnitude: 0.15 },
  { id: 'origin.eye.vice.over-a-trifle', text: 'Put a whole household to the question over a missing trifle, and never apologised.', reach: 'eye', pole: 'vice', magnitude: 0.2 },

  // ─────────────────────────────── STONE ──────────────────────────────
  // Virtue: Dependable / Keeper
  { id: 'origin.stone.virtue.chores-no-thanks', text: 'Was up before everyone to do the chores no one thanked them for.', reach: 'stone', pole: 'virtue', magnitude: 0.05 },
  { id: 'origin.stone.virtue.one-lamp', text: 'Kept the one lamp burning so the others could find their way home.', reach: 'stone', pole: 'virtue', magnitude: 0.05 },
  { id: 'origin.stone.virtue.same-task-right', text: 'Did the same dull task right, every day, without being checked.', reach: 'stone', pole: 'virtue', magnitude: 0.05 },
  { id: 'origin.stone.virtue.held-a-key', text: 'Could be trusted to hold a secret or a key for years.', reach: 'stone', pole: 'virtue', magnitude: 0.05 },
  { id: 'origin.stone.virtue.long-illness', text: 'Held the household together through a long illness, quietly, without being asked.', reach: 'stone', pole: 'virtue', magnitude: 0.1 },
  { id: 'origin.stone.virtue.relief-came', text: 'Stayed at the post long after the relief should have come.', reach: 'stone', pole: 'virtue', magnitude: 0.1 },
  { id: 'origin.stone.virtue.spare-key', text: 'Was the one the whole street left their spare key with.', reach: 'stone', pole: 'virtue', magnitude: 0.1 },
  { id: 'origin.stone.virtue.single-handed', text: 'Kept a failing farm running single-handed through a season no one else would face.', reach: 'stone', pole: 'virtue', magnitude: 0.15 },
  { id: 'origin.stone.virtue.years-of-hardship', text: 'Stood by a promise through years of hardship, when breaking it would have been easy.', reach: 'stone', pole: 'virtue', magnitude: 0.2 },
  // Vice: Reckless / Destroyer
  { id: 'origin.stone.vice.shrugged-pieces', text: 'Broke more than they ever mended, and shrugged at the pieces.', reach: 'stone', pole: 'vice', magnitude: 0.05 },
  { id: 'origin.stone.vice.scars-as-winnings', text: 'Took every dare, and counted the scars as winnings.', reach: 'stone', pole: 'vice', magnitude: 0.05 },
  { id: 'origin.stone.vice.thrown-hard', text: 'Learned that a thing thrown hard enough stopped being a problem.', reach: 'stone', pole: 'vice', magnitude: 0.05 },
  { id: 'origin.stone.vice.unreturned', text: 'Left a trail of borrowed things broken and unreturned.', reach: 'stone', pole: 'vice', magnitude: 0.05 },
  { id: 'origin.stone.vice.near-the-barn', text: 'Played with fire near the dry barn once too often, and called it luck when it held.', reach: 'stone', pole: 'vice', magnitude: 0.1 },
  { id: 'origin.stone.vice.smashed-the-toy', text: 'Smashed the toy rather than let another child have it.', reach: 'stone', pole: 'vice', magnitude: 0.1 },
  { id: 'origin.stone.vice.single-bad-bet', text: 'Gambled the family’s small store on a single bad bet, and laughed it off.', reach: 'stone', pole: 'vice', magnitude: 0.1 },
  { id: 'origin.stone.vice.sound-wall', text: 'Pulled down a sound wall in a temper, just to feel it fall.', reach: 'stone', pole: 'vice', magnitude: 0.15 },
  { id: 'origin.stone.vice.bridge-relied-on', text: 'Burned a bridge the whole village relied on, over an insult no one else remembered.', reach: 'stone', pole: 'vice', magnitude: 0.2 },

  // ─────────────────────────────── STAR ───────────────────────────────
  // Virtue: Inspiring / Beacon
  { id: 'origin.star.virtue.dull-chore', text: 'Could make the other children believe a dull chore was an adventure.', reach: 'star', pole: 'virtue', magnitude: 0.05 },
  { id: 'origin.star.virtue.whole-room-laughing', text: 'Was the one whose laugh started the whole room laughing.', reach: 'star', pole: 'virtue', magnitude: 0.05 },
  { id: 'origin.star.virtue.up-the-cliff', text: 'Talked a frightened friend up a cliff they had sworn they could not climb.', reach: 'star', pole: 'virtue', magnitude: 0.05 },
  { id: 'origin.star.virtue.a-little-brighter', text: 'Left every room a little brighter than they found it.', reach: 'star', pole: 'virtue', magnitude: 0.05 },
  { id: 'origin.star.virtue.steady-voice', text: 'Rallied the discouraged with nothing but words and a steady voice.', reach: 'star', pole: 'virtue', magnitude: 0.1 },
  { id: 'origin.star.virtue.worth-staying-awake', text: 'Made a hungry winter bearable by telling stories worth staying awake for.', reach: 'star', pole: 'virtue', magnitude: 0.1 },
  { id: 'origin.star.virtue.back-on-its-feet', text: 'Got a beaten team back on its feet with a single stubborn refusal to quit.', reach: 'star', pole: 'virtue', magnitude: 0.1 },
  { id: 'origin.star.virtue.calm-they-didnt-feel', text: 'Led a frightened crowd to safety on the strength of a calm they did not feel.', reach: 'star', pole: 'virtue', magnitude: 0.15 },
  { id: 'origin.star.virtue.hope-alone', text: 'Kept a doomed effort alive on hope alone, and turned it around.', reach: 'star', pole: 'virtue', magnitude: 0.2 },
  // Vice: Discouraging / Anchor
  { id: 'origin.star.vice.flat-word', text: 'Had a flat word ready for every bright idea the others brought.', reach: 'star', pole: 'vice', magnitude: 0.05 },
  { id: 'origin.star.vice.a-sigh', text: 'Learned that a sigh could deflate a room faster than a shout.', reach: 'star', pole: 'vice', magnitude: 0.05 },
  { id: 'origin.star.vice.last-time-wrong', text: 'Reminded everyone of the last time it went wrong.', reach: 'star', pole: 'vice', magnitude: 0.05 },
  { id: 'origin.star.vice.reasons-it-fails', text: 'Met every plan with the reasons it would fail.', reach: 'star', pole: 'vice', magnitude: 0.05 },
  { id: 'origin.star.vice.weary-doubt', text: 'Talked friends out of trying, one weary doubt at a time.', reach: 'star', pole: 'vice', magnitude: 0.1 },
  { id: 'origin.star.vice.leaving-the-ground', text: 'Was the weight that kept every hopeful scheme from leaving the ground.', reach: 'star', pole: 'vice', magnitude: 0.1 },
  { id: 'origin.star.vice.expecting-nothing', text: 'Found that nothing was safer than expecting nothing, and taught it to others.', reach: 'star', pole: 'vice', magnitude: 0.1 },
  { id: 'origin.star.vice.gift-to-waste', text: 'Convinced a gifted friend to give up, and watched the gift go to waste.', reach: 'star', pole: 'vice', magnitude: 0.15 },
  { id: 'origin.star.vice.quietly-fell-apart', text: 'Drained the will from a whole effort until it quietly fell apart.', reach: 'star', pole: 'vice', magnitude: 0.2 },
] as const;
