import type { HungerDefinition } from '../types/remembrance';

export const HUNGER_CATALOG: HungerDefinition[] = [
  // ─── life/spirit ───────────────────────────────────────────────
  {
    id: 'hunger.gather',
    name: 'Gather',
    imageAssetPath: '/assets/remembrance/hunger/gather.jpg',
    proseVariants: [
      { driveTag: 'love', prose: 'Your love became a hunger. You would gather every soul under your wings — shelter them, hold them, keep them. Whether they wish it or not.' },
      { driveTag: 'preservation', prose: 'Your grief became a hunger. What died was alone. Unprotected. You would never let that happen again. You would gather them all.' },
      { driveTag: 'compassion', prose: 'Your compassion became a hunger. The broken, the lost, the abandoned — you would find them all. Your flock would have no edge, no limit.' },
      { driveTag: 'devotion', prose: 'Your devotion became a hunger. One face was not enough. You would gather every worthy soul, every kindred spirit, until the loneliness that drove you to ascend was drowned in belonging.' },
    ],
    mandateDirection: 'Build a devoted community of followers bound to your court',
    courtOptions: [
      { courtType: 'circle', prose: 'Your court is a circle. All are seen. All are held. Every voice reaches the center, and the center holds them all.', isDefault: true },
      { courtType: 'web', prose: 'Your court is a web. Every thread connects. Every soul you gather strengthens the whole. Pull one, and all feel it.', isDefault: false },
    ],
    sphereAlignment: { primary: 'life', secondary: 'spirit' },
    domainAffinities: { heart: 4, stone: 3, star: 2 },
    ascendantLens: {
      perceptionStyle: 'You see vulnerability first — who needs shelter, who is alone, who is about to break.',
      emotionalTone: 'Protective warmth edged with possessiveness. The flock must grow.',
    },
  },

  // ─── mind/spirit ───────────────────────────────────────────────
  {
    id: 'hunger.witness',
    name: 'Witness',
    imageAssetPath: '/assets/remembrance/hunger/witness.jpg',
    proseVariants: [
      { driveTag: 'obsession', prose: 'Your question became a hunger. You would know everything. Every secret whispered in darkness. Every truth buried under lies. Nothing — nothing — would be hidden from you.' },
      { driveTag: 'seeking', prose: 'Your seeking became a hunger. Not for answers — for seeing. You would witness every moment, every choice, every hidden thing. The world would be transparent to your gaze.' },
      { driveTag: 'knowledge', prose: 'Your thirst for knowledge became a hunger. Books were not enough. Sages were not enough. You would see through every eye, hear through every ear. The world itself would become your library.' },
    ],
    mandateDirection: 'Establish an information network that sees across the world',
    courtOptions: [
      { courtType: 'web', prose: 'Your court is a web. Every thread leads to you. Every secret finds its way home along the silk.', isDefault: true },
      { courtType: 'high_house', prose: 'Your court is a high house. Knowledge flows upward. You sit at the apex, and nothing reaches you unfiltered.', isDefault: false },
    ],
    sphereAlignment: { primary: 'mind', secondary: 'spirit' },
    domainAffinities: { eye: 4, veil: 3, gold: 2 },
    ascendantLens: {
      perceptionStyle: 'You see what others hide — the thought behind the smile, the fear behind the bravado, the secret behind the silence.',
      emotionalTone: 'Detached fascination edged with voyeuristic hunger. Everything must be known.',
    },
  },

  // ─── force/time ────────────────────────────────────────────────
  {
    id: 'hunger.reclaim',
    name: 'Reclaim',
    imageAssetPath: '/assets/remembrance/hunger/reclaim.jpg',
    proseVariants: [
      { driveTag: 'vengeance', prose: 'Your rage became a hunger. What was taken will be taken back. What was destroyed will be rebuilt. And those who took it will understand what they stole.' },
      { driveTag: 'justice', prose: 'Your sense of justice became a hunger. The scales are broken. The world is crooked. You would right every wrong, recover every loss, even if it means breaking what stands in the way.' },
      { driveTag: 'loss', prose: 'Your loss became a hunger. You refuse to accept what time has taken. You will reach back through the centuries and pull it forward — every stone, every name, every forgotten oath.' },
    ],
    mandateDirection: 'Recover what was lost — reclaim ruins, right ancient wrongs, restore forgotten power',
    courtOptions: [
      { courtType: 'high_house', prose: 'Your court is a high house. Rebuilt from the ruins of what was. Every stone reclaimed. Every position earned through the work of restoration.', isDefault: true },
      { courtType: 'abyss', prose: 'Your court is an abyss. You reach down into what was lost and pull it back from darkness. Your power flows upward from forgotten depths.', isDefault: false },
    ],
    sphereAlignment: { primary: 'force', secondary: 'time' },
    domainAffinities: { iron: 4, gold: 3, stone: 2 },
    ascendantLens: {
      perceptionStyle: 'You see what was taken — the scars, the absences, the places where something used to be. Every ruin speaks to you.',
      emotionalTone: 'Cold determination edged with old grief. What was lost will be found.',
    },
  },

  // ─── force/mind ────────────────────────────────────────────────
  {
    id: 'hunger.reshape',
    name: 'Reshape',
    imageAssetPath: '/assets/remembrance/hunger/reshape.jpg',
    proseVariants: [
      { driveTag: 'perfectionism', prose: 'Your vision became a hunger. The world as it is — imperfect, chaotic, wrong — cannot be tolerated. You would reshape it. All of it. Until it matches what you saw.' },
      { driveTag: 'vision', prose: 'Your certainty became a hunger. You saw the truth that others could not. Now you would make them see it too — by changing everything around them until the truth is all that remains.' },
      { driveTag: 'order', prose: 'Your need for order became a hunger. Disorder is not just ugly — it is an offense. You would impose pattern on the world until even the wind blows where you direct it.' },
    ],
    mandateDirection: 'Transform cultures and reshape the world according to your vision',
    courtOptions: [
      { courtType: 'high_house', prose: 'Your court is a high house. Vision flows downward from the apex. Every position exists to execute the design, to make the world conform.', isDefault: true },
      { courtType: 'circle', prose: 'Your court is a circle. Every member carries the vision. The transformation spreads from the center outward, a ripple that never stops.', isDefault: false },
    ],
    sphereAlignment: { primary: 'force', secondary: 'mind' },
    domainAffinities: { gold: 4, iron: 3, eye: 2 },
    ascendantLens: {
      perceptionStyle: 'You see potential — what someone could become, what a place could be, the gap between what is and what should be.',
      emotionalTone: 'Visionary intensity edged with impatience. The world is not yet right.',
    },
  },

  // ─── time/spirit ───────────────────────────────────────────────
  {
    id: 'hunger.preserve',
    name: 'Preserve',
    imageAssetPath: '/assets/remembrance/hunger/preserve.jpg',
    proseVariants: [
      { driveTag: 'preservation', prose: 'Your grief became a hunger. You watched it die — and you swore nothing else would. You would hold the world in place. Every name remembered. Every thread unbroken. Even if time itself must stop.' },
      { driveTag: 'memory', prose: 'Your memory became a hunger. You remember everything, and you will not allow forgetting. Every language, every song, every face — you would press them into amber and hold them against the dark.' },
      { driveTag: 'love', prose: 'Your love became a hunger to preserve. Not to gather — to keep. What you held once, you would hold forever. Nothing would fade. Nothing would change. Nothing would be lost again.' },
      { driveTag: 'grief', prose: 'Your grief became a hunger. You could not save what you loved, so now you will preserve everything else. The world will not lose another beautiful thing. Not while you endure.' },
    ],
    mandateDirection: 'Preserve what remains — protect ancient knowledge, prevent cultural decay, hold back entropy',
    courtOptions: [
      { courtType: 'circle', prose: 'Your court is a circle. A closed ring that nothing escapes. What enters is preserved. What is held is eternal.', isDefault: true },
      { courtType: 'high_house', prose: 'Your court is a high house. A fortress against time. Every level another layer of protection. Nothing reaches the center without your consent.', isDefault: false },
    ],
    sphereAlignment: { primary: 'time', secondary: 'spirit' },
    domainAffinities: { stone: 4, heart: 3, eye: 2 },
    ascendantLens: {
      perceptionStyle: 'You see fragility — what is about to break, what is fading, what the next wind will carry away. Everything is always almost ending.',
      emotionalTone: 'Fierce tenderness edged with paralysis. To change is to lose.',
    },
  },

  // ─── energy/life ───────────────────────────────────────────────
  {
    id: 'hunger.kindle',
    name: 'Kindle',
    imageAssetPath: '/assets/remembrance/hunger/kindle.jpg',
    proseVariants: [
      { driveTag: 'compassion', prose: 'Your compassion became a hunger. But not to shelter — to ignite. You saw the spark in the broken, the lost, the defeated. You would not carry them. You would set them on fire.' },
      { driveTag: 'devotion', prose: 'Your devotion became a hunger to kindle. You loved one soul so completely that now you would pour that fire into every soul you touch. They will burn with purpose they never knew they had.' },
      { driveTag: 'restlessness', prose: 'Your restlessness became a hunger to kindle. You could not stop moving, and now you would make the world move with you. Every still thing would learn to burn.' },
      { driveTag: 'freedom', prose: 'Your love of freedom became a hunger to kindle. Chains are not broken by force alone — they are burned away from within. You would light the fire in every captive soul.' },
    ],
    mandateDirection: 'Ignite movements, inspire creation, set the world ablaze with new purpose',
    courtOptions: [
      { courtType: 'web', prose: 'Your court is a web. Fire spreads along threads. One spark becomes a conflagration. Every connection carries the flame further.', isDefault: true },
      { courtType: 'circle', prose: 'Your court is a circle. A ring of fire. Those within burn brighter for the company. The warmth is intoxicating.', isDefault: false },
    ],
    sphereAlignment: { primary: 'energy', secondary: 'life' },
    domainAffinities: { star: 4, heart: 3, iron: 2 },
    ascendantLens: {
      perceptionStyle: 'You see the ember in everyone — the untapped potential, the suppressed fire, the dream they abandoned. You see what they could become if someone just struck the match.',
      emotionalTone: 'Infectious intensity edged with recklessness. The fire must spread.',
    },
  },

  // ─── entropy/mind ──────────────────────────────────────────────
  {
    id: 'hunger.sever',
    name: 'Sever',
    imageAssetPath: '/assets/remembrance/hunger/sever.jpg',
    proseVariants: [
      { driveTag: 'freedom', prose: 'Your freedom became a hunger. But freedom is not a gift — it is a wound. You would cut every chain, sever every bond, break every cage. Whether the prisoner wants it or not.' },
      { driveTag: 'restlessness', prose: 'Your restlessness became a hunger. Every wall is an insult. Every obligation is a lie. You would unmake the structures that hold the world in place and let it breathe for the first time.' },
      { driveTag: 'vengeance', prose: 'Your vengeance became a hunger to sever. You were bound, and it destroyed you. Now you would cut every bond in the world — not for justice, but because the very concept of being held makes you sick.' },
      { driveTag: 'obsession', prose: 'Your obsession became a hunger to sever. You saw the truth: every connection is a leash. Every love is a cage. You would free the world from the lie of belonging.' },
    ],
    mandateDirection: 'Destroy systems of control — break covenants, dissolve factions, liberate through destruction',
    courtOptions: [
      { courtType: 'abyss', prose: 'Your court is an abyss. There is no structure, only depth. Those who follow you fall upward, unbound, free in the vertiginous dark.', isDefault: true },
      { courtType: 'web', prose: 'Your court is a web. But your threads do not connect — they cut. Every line of influence is a blade, and you are at the center of a lattice of severance.', isDefault: false },
    ],
    sphereAlignment: { primary: 'entropy', secondary: 'mind' },
    domainAffinities: { veil: 4, shadow: 3, eye: 2 },
    ascendantLens: {
      perceptionStyle: 'You see the chains — the obligations, the debts, the loyalties, the loves that bind people to places and each other. You see where to cut.',
      emotionalTone: 'Glacial clarity edged with loneliness. Freedom is the only truth.',
    },
  },

  // ─── matter/mind ───────────────────────────────────────────────
  {
    id: 'hunger.bind',
    name: 'Bind',
    imageAssetPath: '/assets/remembrance/hunger/bind.jpg',
    proseVariants: [
      { driveTag: 'perfectionism', prose: 'Your need for perfection became a hunger to bind. Order is not imposed — it is woven. You would thread every faction, every soul, every stone into a pattern so tight that nothing could ever come apart again.' },
      { driveTag: 'order', prose: 'Your love of order became a hunger. Not to reshape the world — to fix it in place. Covenants that cannot be broken. Oaths that outlast the speakers. Structure that endures beyond memory.' },
      { driveTag: 'devotion', prose: 'Your devotion became a hunger to bind. You loved so fiercely that now you would make every bond unbreakable. Betrayal would be impossible. Abandonment would be a concept without meaning.' },
      { driveTag: 'justice', prose: 'Your justice became a hunger to bind. Promises must be kept. Oaths must hold. You would weave a covenant so total that no one — mortal or divine — could slip its threads.' },
    ],
    mandateDirection: 'Establish an unbreakable covenant across factions — bind the world in lasting order',
    courtOptions: [
      { courtType: 'high_house', prose: 'Your court is a high house. Every stone is mortared with oaths. Every position is a binding. The structure itself is the covenant.', isDefault: true },
      { courtType: 'web', prose: 'Your court is a web. But not of silk — of iron. Every thread is a contract, and you are the witness to all of them.', isDefault: false },
    ],
    sphereAlignment: { primary: 'matter', secondary: 'mind' },
    domainAffinities: { stone: 4, gold: 3, iron: 2 },
    ascendantLens: {
      perceptionStyle: 'You see the agreements — spoken and unspoken. The debts. The promises. The places where the social fabric is frayed and needs repair.',
      emotionalTone: 'Patient authority edged with inflexibility. What is bound stays bound.',
    },
  },

  // ─── energy/time ───────────────────────────────────────────────
  {
    id: 'hunger.wander',
    name: 'Wander',
    imageAssetPath: '/assets/remembrance/hunger/wander.jpg',
    proseVariants: [
      { driveTag: 'restlessness', prose: 'Your restlessness became a hunger. Not to arrive — to move. Every horizon is a door. Every ending is a lie. You would walk forever, and the world would unfold before you like a road without end.' },
      { driveTag: 'freedom', prose: 'Your freedom became a hunger to wander. Roots are prisons. Homes are cages. You would see everything, touch everything, leave everything behind. The journey is the only destination.' },
      { driveTag: 'seeking', prose: 'Your seeking became a hunger to wander. The answer was never in one place. It was in the space between places. You would map the unknown, walk the edges of the world, find what no one else has found.' },
      { driveTag: 'discovery', prose: 'Your love of discovery became a hunger. Not to know — to find. There is a difference. Knowing is an ending. Finding is the eternal moment before the answer. You would live in that moment forever.' },
    ],
    mandateDirection: 'Explore every corner of the world — map the unknown, discover hidden places, walk the edges',
    courtOptions: [
      { courtType: 'web', prose: 'Your court is a web. But it is not a trap — it is a map. Every thread is a road you have walked. Every node is a place you have been. The web grows as you wander.', isDefault: true },
      { courtType: 'abyss', prose: 'Your court is an abyss. Not a void — an expanse. You stand at the edge of everything known, and your court is the darkness beyond it, waiting to be walked.', isDefault: false },
    ],
    sphereAlignment: { primary: 'energy', secondary: 'time' },
    domainAffinities: { gold: 4, eye: 3, shadow: 2 },
    ascendantLens: {
      perceptionStyle: 'You see the roads — the paths taken and not taken, the borders, the edges, the places where the map goes blank. Every horizon calls to you.',
      emotionalTone: 'Restless wonder edged with inability to stay. There is always something beyond.',
    },
  },

  // ─── entropy/force ─────────────────────────────────────────────
  {
    id: 'hunger.consume',
    name: 'Consume',
    imageAssetPath: '/assets/remembrance/hunger/consume.jpg',
    proseVariants: [
      { driveTag: 'vengeance', prose: 'Your vengeance became a hunger. But not for justice — for appetite. They took from you, and now you would take from everyone. Territory. Power. Essence. You would swallow it all and still be hungry.' },
      { driveTag: 'obsession', prose: 'Your obsession became a hunger to consume. You counted, and counted, and counted — and it was never enough. Now you would consume the world itself, absorbing every rival, every resource, every scrap of power into yourself.' },
      { driveTag: 'loss', prose: 'Your loss became a hunger. The emptiness inside you is vast. You would fill it with everything — every territory claimed, every rival absorbed, every fragment of power devoured. But the emptiness grows faster than you can feed it.' },
      { driveTag: 'vision', prose: 'Your vision became a hunger to consume. You saw how small you were, and how vast the world. Now you would make the world small instead — by making yourself vast. By consuming everything that is not you.' },
    ],
    mandateDirection: 'Expand territory and absorb rival power — grow until nothing remains outside your domain',
    courtOptions: [
      { courtType: 'abyss', prose: 'Your court is an abyss. Everything falls in. Everything is absorbed. Your followers do not serve you — they are consumed by you, and through consumption, they become part of something greater.', isDefault: true },
      { courtType: 'high_house', prose: 'Your court is a high house. But it is built from the bones of what you have consumed. Every stone was once someone else\'s wall. Every banner was torn from a rival\'s keep.', isDefault: false },
    ],
    sphereAlignment: { primary: 'entropy', secondary: 'force' },
    domainAffinities: { shadow: 4, iron: 3, veil: 2 },
    ascendantLens: {
      perceptionStyle: 'You see resources — who has what you need, what can be taken, where the weak points are. Every rival is a meal. Every territory is an appetizer.',
      emotionalTone: 'Insatiable appetite edged with desperation. It is never enough.',
    },
  },

  // ─── spirit/darkness ───────────────────────────────────────────
  {
    id: 'hunger.haunt',
    name: 'Haunt',
    imageAssetPath: '/assets/remembrance/hunger/haunt.jpg',
    proseVariants: [
      { driveTag: 'love', prose: 'Your love became a hunger to haunt. You would not let them forget. Every dream, every quiet moment, every shadow in the corner of their eye — you would be there. Watching. Remembering. Refusing to let go.' },
      { driveTag: 'grief', prose: 'Your grief became a hunger to haunt. Death did not end your vigil. You would whisper from the other side of the veil, a presence felt but never seen, shaping the living from the space between worlds.' },
      { driveTag: 'memory', prose: 'Your memory became a hunger to haunt. The past is not past — it lives in every shadow, every old stone, every word spoken in the dark. You would keep the dead close to the living. Uncomfortably close.' },
      { driveTag: 'obsession', prose: 'Your obsession became a hunger to haunt. You cannot be seen, cannot be touched, but you are always there. In the whispers. In the dreams. In the cold feeling at the back of every neck.' },
    ],
    mandateDirection: 'Haunt the world from the spirit realm — influence through dreams, omens, and unseen presence',
    courtOptions: [
      { courtType: 'abyss', prose: 'Your court is an abyss. It exists in the space beneath awareness — in dreams, in the dark between heartbeats. Your followers do not gather; they are visited.', isDefault: true },
      { courtType: 'web', prose: 'Your court is a web. Invisible threads that touch the sleeping, the grieving, the remembering. You pull, and they feel you without knowing why.', isDefault: false },
    ],
    sphereAlignment: { primary: 'spirit', secondary: 'darkness' },
    domainAffinities: { veil: 4, shadow: 3, heart: 2 },
    ascendantLens: {
      perceptionStyle: 'You see the inner world — dreams, fears, unspoken longings, the ghosts people carry without knowing. The surface is irrelevant; you see what haunts them.',
      emotionalTone: 'Intimate presence edged with invasiveness. You are always too close.',
    },
  },

  // ─── light/order ───────────────────────────────────────────────
  {
    id: 'hunger.illuminate',
    name: 'Illuminate',
    imageAssetPath: '/assets/remembrance/hunger/illuminate.jpg',
    proseVariants: [
      { driveTag: 'justice', prose: 'Your justice became a hunger to illuminate. Corruption hides in darkness. Cruelty thrives in shadow. You would burn away every hiding place until the world stands naked in the light, and nothing wicked can endure.' },
      { driveTag: 'vision', prose: 'Your vision became a hunger to illuminate. You saw the truth so clearly — and everyone else was blind. Now you would make the truth visible to all, whether they want to see it or not. Light has no mercy.' },
      { driveTag: 'compassion', prose: 'Your compassion became a hunger to illuminate. People suffer in ignorance. They hurt each other in the dark. You would bring light to every corner, every secret, every lie — because understanding is the only path to peace.' },
      { driveTag: 'knowledge', prose: 'Your knowledge became a hunger to illuminate. What good is wisdom locked in a library? You would project truth across the sky itself. Every mind would be opened. Every shadow would be burned away.' },
    ],
    mandateDirection: 'Bring truth to light — expose corruption, reveal hidden knowledge, make the invisible visible',
    courtOptions: [
      { courtType: 'high_house', prose: 'Your court is a high house. A beacon. Light pours down from the apex, and every level below is bathed in its radiance. There are no shadows in your court.', isDefault: true },
      { courtType: 'circle', prose: 'Your court is a circle. Every member holds a light. Together they banish every shadow. The truth is shared, amplified, inescapable.', isDefault: false },
    ],
    sphereAlignment: { primary: 'light', secondary: 'order' },
    domainAffinities: { eye: 4, star: 3, gold: 2 },
    ascendantLens: {
      perceptionStyle: 'You see deception — every lie, every hidden motive, every shadow cast by half-truths. You see where light needs to fall.',
      emotionalTone: 'Righteous clarity edged with mercilessness. Truth does not negotiate.',
    },
  },
];
