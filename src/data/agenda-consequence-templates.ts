/**
 * Agenda Consequence Templates — narrative feedback specialized for each agenda.
 *
 * These templates complement the generic consequence messages by being
 * agenda-specific (richer, more narrative) when an agenda is chosen.
 *
 * Organization: [interventionType][agendaCategory] → string[]
 *
 * Placeholders:
 * - {agent} → agent name
 * - {archetype} → narrative archetype name
 * - {sphere_adj} → sphere adjective (e.g., "thunderous", "shadowy")
 * - {agenda_hook} → agenda narrative hook from AgendaTemplate.narrativeHook
 * - {decay_hint} → decay hint indicating temporary nature
 *
 * All templates follow Threadbare aesthetic: dark, mythic, consequential.
 */

import type { InterventionType } from '../types/dream';

export type AgendaConsequenceCategory =
  | 'ambition'
  | 'courage'
  | 'compassion'
  | 'cunning'
  | 'devotion'
  | 'loyalty'
  | 'tradition'
  | 'dominance'
  | 'wrath'
  | 'greed';

export const DECAY_HINTS = [
  'though time will dull the edge',
  'for now, at least',
  'the seed is planted — what grows is uncertain',
  'how long it lasts, only the fates know',
  'but mortals are fickle creatures',
  'for a season, perhaps longer',
] as const;

type TemplateMap = Record<
  InterventionType,
  Record<AgendaConsequenceCategory, string[]>
>;

/**
 * AGENDA_CONSEQUENCE_TEMPLATES — 64+ templates across 8 types × 10 categories.
 *
 * Dream: subconscious, visions, temporal pull
 * Persuade: conviction, rhetoric, ideological shift
 * Deceive: shadow, misdirection, false reality
 * Intimidate: dread, submission, overwhelming force
 * Inspire: revelation, empowerment, transcendence
 * Coincidence: fate, convergence, synchronicity
 * Omen: portent, cosmic alignment, prophecy
 * Afflict/Bless: curse/grace, embodied power, transformation
 */
export const AGENDA_CONSEQUENCE_TEMPLATES: TemplateMap = {
  dream: {
    ambition: [
      'You weave a dream of {agenda_hook} into {agent}\'s sleeping mind. When they wake, the hunger will burn brighter — {decay_hint}.',
      '{agent}\'s dreams shift to golden kingdoms and crowns of light. The {sphere_adj} pull toward {agenda_hook} takes root.',
      'In the dream-realm, you show {agent} themselves as they secretly wish to be — {decay_hint}.',
    ],
    courage: [
      'A dream of terrible trials and {agent}\'s triumph over them. The {sphere_adj} echo lingers — {decay_hint}.',
      '{agent} dreams they are fireborn and fearless. When they wake, that fire remains — {decay_hint}.',
      'You gift {agent} a dream where cowardice brings only ash. The memory will strengthen them — {decay_hint}.',
    ],
    compassion: [
      '{agent} dreams of suffering transformed through mercy. The {sphere_adj} vision settles in their heart — {decay_hint}.',
      'In sleep, {agent} feels the weight of every soul they could save. That weight becomes love — {decay_hint}.',
      'A dream where kindness breaks chains and heals wounds. {agent} wakes with a {sphere_adj} ache of purpose — {decay_hint}.',
    ],
    cunning: [
      '{agent} dreams of secrets revealed, of patterns others cannot see. The {sphere_adj} clarity lingers — {decay_hint}.',
      'You show {agent} a dream where their wit cuts through every deception. The hunger for wisdom awakens — {decay_hint}.',
      'In dreams, {agent} solves riddles that would break lesser minds. Waking, they retain the {sphere_adj} echo — {decay_hint}.',
    ],
    devotion: [
      'A dream where faith opens doors and miracles unfold. {agent} wakes with {sphere_adj} conviction — {decay_hint}.',
      '{agent} dreams of kneeling before something greater than themselves. The pull toward {agenda_hook} settles deep — {decay_hint}.',
      'You weave a dream of communion with the divine. {agent}\'s faith deepens with each breath — {decay_hint}.',
    ],
    loyalty: [
      '{agent} dreams of bonds unbreakable, of standing with others against the dark. The {sphere_adj} warmth lingers — {decay_hint}.',
      'In sleep, {agent} sees themselves as shield to those they love. That purpose awakens — {decay_hint}.',
      'A dream of fellowship forged in fire. {agent} wakes with {sphere_adj} resolve to honor their oaths — {decay_hint}.',
    ],
    tradition: [
      '{agent} dreams of ancient rites and their power renewed. The {sphere_adj} weight of ages settles on them — {decay_hint}.',
      'A dream where the old ways hold back the dark. {agent} wakes knowing their place in an endless chain — {decay_hint}.',
      '{agent} dreams of ancestors watching, guiding. The {sphere_adj} inheritance becomes clear — {decay_hint}.',
    ],
    dominance: [
      '{agent} dreams of command, of others bending to their will. The {sphere_adj} hunger awakens — {decay_hint}.',
      'You show {agent} a dream where they rule justly and absolutely. The memory intoxicates — {decay_hint}.',
      'A dream of thrones and crowns. {agent} wakes tasting {sphere_adj} power — {decay_hint}.',
    ],
    wrath: [
      '{agent} dreams of righteous fury burning through their enemies. The {sphere_adj} anger awakens — {decay_hint}.',
      'In sleep, {agent} unleashes every wound as flame. They wake knowing how to burn — {decay_hint}.',
      'A dream where justice is swift and terrible. {agent} carries the {sphere_adj} edge upon waking — {decay_hint}.',
    ],
    greed: [
      '{agent} dreams of mountains of treasure, of endless wealth. The hunger awakens {sphere_adj} in their chest — {decay_hint}.',
      'You show {agent} a dream where gold flows like water and they gather it all. The thirst lingers — {decay_hint}.',
      'In dreams, {agent} possesses everything. Waking, they burn to make it real — {decay_hint}.',
    ],
  },

  persuade: {
    ambition: [
      'You whisper to {agent} of all they could become — a {archetype} unbound by lesser minds. The {sphere_adj} conviction takes hold.',
      '{agent} hears your rhetoric and feels their reach expand. {agenda_hook} calls louder now.',
      'The words you plant in {agent}\'s mind bloom into hungry desire. The {sphere_adj} pull grows stronger.',
    ],
    courage: [
      'You remind {agent} that they are stronger than their fear. The {sphere_adj} fire takes hold — {decay_hint}.',
      '{agent} hears your words and feels shame dissolve into valor. The hunger to prove themselves awakens.',
      'You speak to the warrior in {agent}\'s heart. The {sphere_adj} resolve hardens — {decay_hint}.',
    ],
    compassion: [
      'Your words paint a picture of a better world, and {agent} believes it — {decay_hint}.',
      '{agent} hears you speak of mercy and feels their heart shift. The {sphere_adj} pull toward {agenda_hook} grows.',
      'You appeal to the healer within {agent}. Their compassion deepens with each word — {decay_hint}.',
    ],
    cunning: [
      'You whisper of secrets, of games within games. {agent}\'s mind awakens to {sphere_adj} possibility — {decay_hint}.',
      '{agent} hears your subtle logic and feels their wit sharpen. The hunger for advantage grows.',
      'Your words reveal patterns {agent} never saw. The {sphere_adj} clarity lingers — {decay_hint}.',
    ],
    devotion: [
      'You speak of transcendence, and {agent} believes. The {sphere_adj} faith deepens — {decay_hint}.',
      '{agent} hears your words and feels drawn to something greater. The pull toward {agenda_hook} takes root.',
      'Your rhetoric speaks to the zealot in {agent}\'s soul. Conviction hardens like stone — {decay_hint}.',
    ],
    loyalty: [
      'You remind {agent} of oaths sworn and bonds that matter. The {sphere_adj} resolve returns — {decay_hint}.',
      '{agent} hears your words and remembers why they chose their path. Loyalty deepens.',
      'Your rhetoric binds {agent} closer to those they love. The {sphere_adj} chains feel like embraces — {decay_hint}.',
    ],
    tradition: [
      'You speak of ancient ways and their enduring power. {agent} feels the {sphere_adj} weight of continuity — {decay_hint}.',
      '{agent} hears reverence for the old paths and feels anchored. The pull toward {agenda_hook} strengthens.',
      'Your words remind {agent} of their place in an endless chain. Pride and duty intertwine — {decay_hint}.',
    ],
    dominance: [
      'You whisper that {agent} is meant to rule. The {sphere_adj} hunger awakens — {decay_hint}.',
      '{agent} hears your words and feels destined for command. The pull toward {agenda_hook} becomes undeniable.',
      'Your rhetoric makes clear what {agent} secretly believed. They are meant to lead — {decay_hint}.',
    ],
    wrath: [
      'You remind {agent} of every wrong done to them. The {sphere_adj} rage awakens — {decay_hint}.',
      '{agent} hears your words and feels justified fury take shape. The pull toward {agenda_hook} burns hot.',
      'Your rhetoric transforms pain into righteous anger. {agent}\'s {sphere_adj} edge becomes sharp — {decay_hint}.',
    ],
    greed: [
      'You paint a picture of endless wealth within {agent}\'s reach. The {sphere_adj} hunger awakens — {decay_hint}.',
      '{agent} hears your words about treasure and power. The pull toward {agenda_hook} consumes their thoughts.',
      'Your rhetoric whispers of all they could possess. Greed blooms {sphere_adj} and dark — {decay_hint}.',
    ],
  },

  deceive: {
    ambition: [
      'You convince {agent} that {agenda_hook} lies in a dark path. The {sphere_adj} lie takes root — {decay_hint}.',
      '{agent} now believes a falsehood that feeds their ambition. The corruption is {sphere_adj} and subtle — {decay_hint}.',
      'A false whisper that {agenda_hook} requires betrayal. {agent} believes it — {decay_hint}.',
    ],
    courage: [
      'You tell {agent} that their friends doubt them. The {sphere_adj} seeds of distrust take hold — {decay_hint}.',
      '{agent} now believes a lie about their own cowardice. The shame festers — {decay_hint}.',
      'A false tale of heroes who hesitated and failed. {agent} carries the {sphere_adj} weight — {decay_hint}.',
    ],
    compassion: [
      'You convince {agent} that mercy is weakness. The {sphere_adj} corruption spreads — {decay_hint}.',
      '{agent} now believes the lie that they are a fool for caring. The {sphere_adj} shadow grows — {decay_hint}.',
      'A false whisper that kindness betrays them. {agent} hardens against it — {decay_hint}.',
    ],
    cunning: [
      'You plant a false truth that others are scheming against {agent}. The {sphere_adj} paranoia takes root — {decay_hint}.',
      '{agent} believes a clever lie that justifies deception. The shadow deepens — {decay_hint}.',
      'A false pattern that only {agent} can see. The {sphere_adj} obsession consumes them — {decay_hint}.',
    ],
    devotion: [
      'You whisper that {agenda_hook} requires abandoning their faith. The {sphere_adj} doubt spreads — {decay_hint}.',
      '{agent} now believes a lie about their god\'s cruelty. The faith fractures {sphere_adj} — {decay_hint}.',
      'A false revelation that their path is hollow. {agent} carries the {sphere_adj} wound — {decay_hint}.',
    ],
    loyalty: [
      'You convince {agent} that their allies scheme against them. The {sphere_adj} betrayal festers — {decay_hint}.',
      '{agent} now believes a lie that poisons their bonds. The {sphere_adj} corruption spreads — {decay_hint}.',
      'A false tale of treachery. {agent} withdraws into shadow — {decay_hint}.',
    ],
    tradition: [
      'You convince {agent} that the old ways are hollow. The {sphere_adj} doubt takes root — {decay_hint}.',
      '{agent} believes a lie that breaks their connection to ancestors. The {sphere_adj} loss cuts deep — {decay_hint}.',
      'A false whisper that tradition is chains. {agent} questions everything — {decay_hint}.',
    ],
    dominance: [
      'You convince {agent} that leadership demands ruthlessness. The {sphere_adj} corruption spreads — {decay_hint}.',
      '{agent} believes a lie that rivals plot against them. The {sphere_adj} paranoia grows — {decay_hint}.',
      'A false tale that mercy is weakness. {agent}\'s leadership {sphere_adj} hardens — {decay_hint}.',
    ],
    wrath: [
      'You convince {agent} that vengeance is justified. The {sphere_adj} rage awakens — {decay_hint}.',
      '{agent} believes a lie that they were wronged. The {sphere_adj} anger burns — {decay_hint}.',
      'A false tale that sparks conflict. {agent} carries the {sphere_adj} fire — {decay_hint}.',
    ],
    greed: [
      'You convince {agent} that wealth justifies any means. The {sphere_adj} corruption takes hold — {decay_hint}.',
      '{agent} believes a lie about hidden treasure. The {sphere_adj} obsession consumes them — {decay_hint}.',
      'A false tale that rivals hoard what is rightfully theirs. The hunger {sphere_adj} burns — {decay_hint}.',
    ],
  },

  intimidate: {
    ambition: [
      'You show {agent} a terrible vision of their ambition ending in ash. The {sphere_adj} warning lingers — {decay_hint}.',
      '{agent} sees themselves crushed by forces beyond their reach. The {sphere_adj} fear takes hold — {decay_hint}.',
      'A vision that reaching too high brings divine wrath. {agent} trembles — {decay_hint}.',
    ],
    courage: [
      'You flood {agent} with dread, reminding them of vulnerability. The {sphere_adj} fear takes root — {decay_hint}.',
      '{agent} sees themselves helpless before overwhelming force. The {sphere_adj} terror lingers — {decay_hint}.',
      'A vision of their own blood and ending. {agent}\'s boldness falters — {decay_hint}.',
    ],
    compassion: [
      'You show {agent} the price of their mercy — loved ones suffering for their softness. The {sphere_adj} guilt spreads — {decay_hint}.',
      '{agent} sees those they care for broken by enemies. The {sphere_adj} dread takes hold — {decay_hint}.',
      'A vision that kindness invites cruelty. {agent}\'s compassion hardens — {decay_hint}.',
    ],
    cunning: [
      'You show {agent} a vision of their schemes unraveled. The {sphere_adj} dread takes root — {decay_hint}.',
      '{agent} sees themselves outwitted by greater minds. The {sphere_adj} paranoia spreads — {decay_hint}.',
      'A vision that their cleverness is transparent. {agent} trembles with fear — {decay_hint}.',
    ],
    devotion: [
      'You remind {agent} of divine punishment for disobedience. The {sphere_adj} dread settles deep — {decay_hint}.',
      '{agent} sees the price of straying from their god\'s path. The {sphere_adj} fear binds them — {decay_hint}.',
      'A vision of eternal torment for broken faith. {agent}\'s devotion hardens into fear — {decay_hint}.',
    ],
    loyalty: [
      'You show {agent} a vision of betrayal and the price paid. The {sphere_adj} dread takes hold — {decay_hint}.',
      '{agent} sees their bonds shattered and themselves alone. The {sphere_adj} fear cuts deep — {decay_hint}.',
      'A vision that betraying their oaths brings ruin. {agent} clings to loyalty — {decay_hint}.',
    ],
    tradition: [
      'You remind {agent} of ancestral spirits punishing deviation. The {sphere_adj} dread takes root — {decay_hint}.',
      '{agent} sees themselves cursed for abandoning tradition. The {sphere_adj} fear binds them — {decay_hint}.',
      'A vision of the old ways exacting vengeance. {agent}\'s grip on tradition tightens — {decay_hint}.',
    ],
    dominance: [
      'You overwhelm {agent} with your power. The {sphere_adj} submission takes hold — {decay_hint}.',
      '{agent} realizes they cannot match your strength. The {sphere_adj} fear humbles them — {decay_hint}.',
      'A vision of their resistance crushed beneath your heel. {agent} surrenders — {decay_hint}.',
    ],
    wrath: [
      'You show {agent} the ruin wrathful action brings. The {sphere_adj} dread awakens — {decay_hint}.',
      '{agent} sees the consequences of unleashing their rage. The {sphere_adj} fear stays their hand — {decay_hint}.',
      'A vision of bloodshed and suffering from their anger. {agent}\'s wrath turns to caution — {decay_hint}.',
    ],
    greed: [
      'You show {agent} a vision of wealth lost, of riches turned to ash. The {sphere_adj} dread spreads — {decay_hint}.',
      '{agent} sees themselves impoverished and broken. The {sphere_adj} fear takes hold — {decay_hint}.',
      'A vision of all they treasure stripped away. {agent} clings to their possessions in fear — {decay_hint}.',
    ],
  },

  inspire_intervention: {
    ambition: [
      'You kindle a {sphere_adj} fire in {agent}\'s chest — they see themselves as {archetype} destined for greatness.',
      '{agent} feels a surge of divine inspiration. {sphere_adj} confidence blooms. {agenda_hook} becomes inevitable.',
      'A moment of transcendent clarity: {agent} sees their path to {agenda_hook} lit by {sphere_adj} fire.',
    ],
    courage: [
      'You flood {agent} with {sphere_adj} valor. They remember who they are — a warrior unchained by fear.',
      '{agent} feels divine fire burning away doubt. The {sphere_adj} courage awakens.',
      'A moment of {sphere_adj} revelation: {agent} realizes they are braver than they knew.',
    ],
    compassion: [
      'You awaken a {sphere_adj} love in {agent}\'s heart — vast and undeniable as the ocean.',
      '{agent} feels a surge of divine mercy. The {sphere_adj} compassion blooms.',
      'A moment of {sphere_adj} clarity: {agent} sees themselves as healer and savior.',
    ],
    cunning: [
      'You grant {agent} a {sphere_adj} moment of perfect insight. Patterns align, secrets reveal themselves.',
      '{agent} feels divine clarity flooding their mind. The {sphere_adj} wisdom awakens.',
      'A moment of {sphere_adj} revelation: {agent} understands exactly what they must do.',
    ],
    devotion: [
      'You awaken divine fire in {agent}\'s soul. The {sphere_adj} faith blazes incandescent.',
      '{agent} feels communion with something greater. The {sphere_adj} devotion deepens.',
      'A moment of {sphere_adj} revelation: {agent} knows their faith is justified.',
    ],
    loyalty: [
      'You kindle a {sphere_adj} bond in {agent}\'s chest — they feel the strength of those they love.',
      '{agent} feels divine affirmation of their oaths. The {sphere_adj} loyalty blazes.',
      'A moment of {sphere_adj} clarity: {agent} knows they will never betray those they love.',
    ],
    tradition: [
      'You awaken a {sphere_adj} connection to the ancestral chain. {agent} feels the power of ages flowing through them.',
      '{agent} feels divine recognition of their place in tradition. The {sphere_adj} continuity blooms.',
      'A moment of {sphere_adj} revelation: {agent} understands the strength of the old ways.',
    ],
    dominance: [
      'You kindle {sphere_adj} authority in {agent}\'s bearing. They feel born to rule.',
      '{agent} feels divine right coursing through them. The {sphere_adj} dominance awakens.',
      'A moment of {sphere_adj} revelation: {agent} realizes they are meant to lead.',
    ],
    wrath: [
      'You awaken a {sphere_adj} righteous fury in {agent}\'s chest. Justice becomes their banner.',
      '{agent} feels divine validation of their anger. The {sphere_adj} wrath becomes sacred.',
      'A moment of {sphere_adj} clarity: {agent} sees their rage as justified and righteous.',
    ],
    greed: [
      'You kindle a {sphere_adj} hunger in {agent}\'s heart. Wealth, power, abundance — all seem within reach.',
      '{agent} feels divine abundance flowing toward them. The {sphere_adj} greed blooms.',
      'A moment of {sphere_adj} revelation: {agent} sees fortune turning in their favor.',
    ],
  },

  coincidence: {
    ambition: [
      'Fate aligns: a chance meeting leads {agent} toward {agenda_hook}. The {sphere_adj} convergence feels inevitable.',
      'By {sphere_adj} synchronicity, {agent} encounters exactly what they need. Ambition blazes.',
      'Fortune turns: a {sphere_adj} opportunity presents itself, and {agent} sees their path forward.',
    ],
    courage: [
      'By {sphere_adj} chance, {agent} confronts their fear and finds themselves unbroken. Courage takes root.',
      'Fate provides: a {sphere_adj} moment of triumph proves {agent} stronger than they believed.',
      'Synchronicity: {agent} discovers unexpected strength in a {sphere_adj} moment of crisis.',
    ],
    compassion: [
      'By {sphere_adj} chance, {agent} witnesses suffering and is moved to mercy. Compassion awakens.',
      'Fate aligns: {agent} meets someone in need, and helping them feels {sphere_adj} inevitable.',
      'Synchronicity: a {sphere_adj} encounter with another\'s pain awakens {agent}\'s tender heart.',
    ],
    cunning: [
      'By {sphere_adj} chance, {agent} overhears a secret that shifts their understanding. Cunning sharpens.',
      'Fate provides: a {sphere_adj} conversation reveals patterns {agent} can exploit.',
      'Synchronicity: {agent} discovers exactly the {sphere_adj} knowledge they need.',
    ],
    devotion: [
      'By {sphere_adj} chance, {agent} witnesses a miracle. Faith blooms.',
      'Fate aligns: a {sphere_adj} sign appears, and {agent}\'s devotion deepens.',
      'Synchronicity: {agent} encounters a {sphere_adj} proof of the divine.',
    ],
    loyalty: [
      'By {sphere_adj} chance, {agent} meets an unexpected ally. Bonds form.',
      'Fate aligns: a {sphere_adj} friendship takes root, and {agent} finds family in an unexpected place.',
      'Synchronicity: {agent} discovers a {sphere_adj} companion when they needed one most.',
    ],
    tradition: [
      'By {sphere_adj} chance, {agent} learns an ancient secret from their past. Tradition awakens.',
      'Fate aligns: {agent} encounters someone who shares their {sphere_adj} reverence for the old ways.',
      'Synchronicity: a {sphere_adj} moment reveals the enduring power of tradition.',
    ],
    dominance: [
      'By {sphere_adj} chance, {agent} encounters weakness in a rival. Opportunity beckons.',
      'Fate aligns: a {sphere_adj} power vacuum opens, and {agent} is perfectly positioned.',
      'Synchronicity: {agent} gains {sphere_adj} advantage through fortunate circumstance.',
    ],
    wrath: [
      'By {sphere_adj} chance, {agent}\'s enemy stumbles into reach. Vengeance becomes possible.',
      'Fate aligns: a {sphere_adj} insult is delivered at the worst possible moment. Rage ignites.',
      'Synchronicity: {agent} finds {sphere_adj} justification for their anger.',
    ],
    greed: [
      'By {sphere_adj} chance, {agent} discovers hidden treasure. Greed awakens.',
      'Fate aligns: a {sphere_adj} windfall falls into their lap.',
      'Synchronicity: {agent} finds {sphere_adj} fortune through fortunate circumstance.',
    ],
  },

  omen: {
    ambition: [
      'A {sphere_adj} portent crosses {agent}\'s path — success seems written in the stars. Ambition surges.',
      'A {sphere_adj} sign appears: ravens bearing glory, clouds arranged like crowns. {agenda_hook} feels destined.',
      'The heavens shift: a {sphere_adj} alignment speaks to {agent} of fortune turning in their favor.',
    ],
    courage: [
      'A {sphere_adj} portent appears — the weak fall, the bold endure. Courage blooms.',
      'A {sphere_adj} sign: thunder on a clear day, lightning that strikes the cowardly. {agent} feels called.',
      'The heavens align: a {sphere_adj} omen whispers that only the fearless survive.',
    ],
    compassion: [
      'A {sphere_adj} portent shines: broken things made whole, the suffering healed. Compassion awakens.',
      'A {sphere_adj} sign: flowers blooming in winter, light in darkness. {agent} sees possibility.',
      'The heavens speak: a {sphere_adj} omen of abundance for those with tender hearts.',
    ],
    cunning: [
      'A {sphere_adj} portent crosses {agent}\'s path — secrets revealed to the clever, traps sprung on the slow.',
      'A {sphere_adj} sign: serpents coiling, mirrors reflecting truth. Cunning awakens.',
      'The heavens align: a {sphere_adj} omen speaks only to those wise enough to understand.',
    ],
    devotion: [
      'A {sphere_adj} portent shines: temples standing eternal, miracles unfolding. Devotion deepens.',
      'A {sphere_adj} sign appears — the divine acknowledges its faithful. {agenda_hook} feels sacred.',
      'The heavens speak: a {sphere_adj} omen of grace for those whose faith endures.',
    ],
    loyalty: [
      'A {sphere_adj} portent shines: bonds unbreakable, companions standing unbroken. Loyalty awakens.',
      'A {sphere_adj} sign: hearts beating as one, circles unbroken. {agent} feels called to their oaths.',
      'The heavens align: a {sphere_adj} omen of strength for those who keep faith.',
    ],
    tradition: [
      'A {sphere_adj} portent shines: the old ways endure, ancestors watching. Tradition awakens.',
      'A {sphere_adj} sign appears — the chain of ages holding firm. {agent} feels the weight of continuity.',
      'The heavens speak: a {sphere_adj} omen that the past shapes the future.',
    ],
    dominance: [
      'A {sphere_adj} portent crosses {agent}\'s path — crowns rising, thrones being built. Ambition surges.',
      'A {sphere_adj} sign: lords and kings ascending, the weak bowing. Dominance calls.',
      'The heavens align: a {sphere_adj} omen that those meant to rule will inherit the earth.',
    ],
    wrath: [
      'A {sphere_adj} portent shines: vengeance unfolding, enemies falling. Wrath awakens.',
      'A {sphere_adj} sign: storm clouds gathering, thunder rolling. Justice feels inevitable.',
      'The heavens speak: a {sphere_adj} omen that wrathful action serves a greater purpose.',
    ],
    greed: [
      'A {sphere_adj} portent shines: treasures uncovered, wealth flowing. Greed awakens.',
      'A {sphere_adj} sign: gold emerging from shadow, riches multiplying. {agent} feels destiny turning.',
      'The heavens align: a {sphere_adj} omen that fortune favors the ambitious and bold.',
    ],
  },

  afflict_bless: {
    ambition: [
      'A {sphere_adj} blessing: {agent}\'s drive becomes unstoppable. They move as if {agenda_hook} is inevitable — {decay_hint}.',
      'A {sphere_adj} curse: {agent}\'s ambition becomes consuming madness. They cannot rest — {decay_hint}.',
      'A {sphere_adj} mark appears on {agent}: the blessing or curse of endless hunger — {decay_hint}.',
    ],
    courage: [
      'A {sphere_adj} blessing: {agent}\'s heart becomes iron. Fear cannot touch them — {decay_hint}.',
      'A {sphere_adj} curse: {agent}\'s nerves shatter. Everything terrifies them — {decay_hint}.',
      'A {sphere_adj} mark of divine judgment: {agent} cannot hide what they are — {decay_hint}.',
    ],
    compassion: [
      'A {sphere_adj} blessing: {agent}\'s love becomes overwhelming. They feel every suffering and wish to ease it — {decay_hint}.',
      'A {sphere_adj} curse: {agent}\'s heart turns to stone. They cannot care, no matter how they try — {decay_hint}.',
      'A {sphere_adj} transformation: {agent} becomes living embodiment of mercy or cruelty — {decay_hint}.',
    ],
    cunning: [
      'A {sphere_adj} blessing: {agent}\'s mind becomes sharp as razors. They see through all deception — {decay_hint}.',
      'A {sphere_adj} curse: {agent}\'s thoughts scatter. They cannot focus or remember — {decay_hint}.',
      'A {sphere_adj} mark of wisdom or folly: {agent}\'s nature becomes transparent — {decay_hint}.',
    ],
    devotion: [
      'A {sphere_adj} blessing: {agent}\'s faith becomes unshakeable. Miracles follow — {decay_hint}.',
      'A {sphere_adj} curse: {agent}\'s faith shatters. They feel abandoned by the divine — {decay_hint}.',
      'A {sphere_adj} seal: {agent} becomes bound to their god or utterly severed — {decay_hint}.',
    ],
    loyalty: [
      'A {sphere_adj} blessing: {agent} becomes the perfect ally. Their bonds unbreakable — {decay_hint}.',
      'A {sphere_adj} curse: {agent}\'s bonds wither. Loneliness becomes unbearable — {decay_hint}.',
      'A {sphere_adj} mark: {agent}\'s loyalty becomes visible to all who see them — {decay_hint}.',
    ],
    tradition: [
      'A {sphere_adj} blessing: {agent} becomes living vessel of the old ways. Ancestors speak through them — {decay_hint}.',
      'A {sphere_adj} curse: {agent} is severed from tradition. They become outcast — {decay_hint}.',
      'A {sphere_adj} mark: {agent} becomes either guardian or breaker of ancient chains — {decay_hint}.',
    ],
    dominance: [
      'A {sphere_adj} blessing: {agent} becomes an avatar of command. Others bend to their will — {decay_hint}.',
      'A {sphere_adj} curse: {agent} becomes servile. They cannot resist authority — {decay_hint}.',
      'A {sphere_adj} transformation: {agent}\'s nature becomes that of master or slave — {decay_hint}.',
    ],
    wrath: [
      'A {sphere_adj} blessing: {agent}\'s rage becomes righteous fire. Their enemies fall — {decay_hint}.',
      'A {sphere_adj} curse: {agent}\'s anger consumes them. They burn from within — {decay_hint}.',
      'A {sphere_adj} mark: {agent} becomes living manifestation of justice or cruelty — {decay_hint}.',
    ],
    greed: [
      'A {sphere_adj} blessing: {agent}\'s touch turns things precious. Wealth flows toward them — {decay_hint}.',
      'A {sphere_adj} curse: {agent}\'s wealth turns to ash. They cannot keep what they gain — {decay_hint}.',
      'A {sphere_adj} binding: {agent} becomes either blessed by fortune or consumed by hunger — {decay_hint}.',
    ],
  },
};

/**
 * Resolve a consequence message for a specific agenda.
 * Uses seeded template selection + placeholder resolution.
 */
export interface AgendaConsequenceContext {
  agentName: string;
  archetype?: string;
  sphereAdj?: string;
  agendaHook?: string;
  decayHint?: string;
}

export function getAgendaConsequenceMessage(
  interventionType: InterventionType,
  category: AgendaConsequenceCategory,
  context: AgendaConsequenceContext,
  seed: number,
): string {
  const templates = AGENDA_CONSEQUENCE_TEMPLATES[interventionType]?.[category] ?? [];
  if (!templates.length) {
    return `The ${interventionType} on ${context.agentName} has consequences.`;
  }

  // Seeded template selection
  const templateIdx = Math.abs(seed) % templates.length;
  const template = templates[templateIdx];

  // Resolve placeholders
  let resolved = template;

  const decayIdx = Math.abs(seed + 1) % DECAY_HINTS.length;
  const decayHint = context.decayHint ?? DECAY_HINTS[decayIdx];

  // Apply all replacements once
  resolved = resolved.replace(/{agent}/g, context.agentName ?? 'the target');
  resolved = resolved.replace(/{archetype}/g, context.archetype ?? 'warrior');
  resolved = resolved.replace(/{sphere_adj}/g, context.sphereAdj ?? 'mysterious');
  resolved = resolved.replace(/{agenda_hook}/g, context.agendaHook ?? 'destiny');
  resolved = resolved.replace(/{decay_hint}/g, decayHint);

  return resolved;
}
