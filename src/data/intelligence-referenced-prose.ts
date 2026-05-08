/**
 * THR-139 — Authored "intel paid off" chronicle prose pack.
 *
 * Reliability-tiered prose lines for the `intel_referenced_prose` aftermath
 * effect. Authors can either reference these lines by index when wiring an
 * effect into a reaction, or compose bespoke prose using the same voice
 * contract.
 *
 * Voice contract:
 *   - Threadbare voice (Witness/Poet hybrid). Past-tense, third-person.
 *   - 18–32 words per line. Hard floor 12 (avoid bullet voice), hard ceiling 40.
 *   - Each line stands alone — never references the next reaction step.
 *   - {name} and {location} are encouraged; deeper enrichment optional.
 *   - No numbers. Reliability is conveyed by phrasing, not by stats.
 *   - Dubious band explicitly hedges or shows the intel betraying the agent.
 *
 * Six categories × three bands × four lines = 72 lines total.
 *
 * Companion docs:
 *   - Plan doc: Docs/plans/2026-05-08-thr-139-intel-referenced-prose-reaction.md §C
 *   - Engine surface: src/engine/encounterAftermath.ts case 'intel_referenced_prose'
 */

import type { IntelligenceCategory } from '../types/unifiedAction';

export interface IntelReferencedProseBands {
  readonly reliable: readonly string[];
  readonly uncertain: readonly string[];
  readonly dubious: readonly string[];
}

export const INTEL_REFERENCED_PROSE_PACK: Record<IntelligenceCategory, IntelReferencedProseBands> = {
  shrine_location: {
    reliable: [
      '{name} approached the consecrated ground from the path the old stories named — every marker stood where memory had placed it, and the working held.',
      '{name} read the shrine\'s geometry with the unhurried recognition of someone returning to a place they had never quite stopped knowing.',
      'The sanctity of {location} unfolded for {name} the way maps unfold — known edges first, then center, then the still place where worship lived.',
      '{name} crossed the threshold the way returning pilgrims cross thresholds, the route through the consecrated stones already remembered, already trusted.',
    ],
    uncertain: [
      '{name} found half the path remembered, half worked out from instinct — the shrine\'s geometry came back in pieces, but enough pieces aligned.',
      'What {name} recalled of {location}\'s consecrated stones met the present — partial recognition, clouded edges, but the central marker stood where memory had it.',
      '{name} approached the shrine partly from memory, partly from the way the air thinned at sacred ground — the recognition was incomplete but real.',
      'Fragments of the route returned to {name} as the shrine came into view — what the memory missed, the sanctity itself supplied.',
    ],
    dubious: [
      '{name} reached for the shrine\'s known geometry, and what surfaced was older — markers in unfamiliar places, the consecrated path no longer where it had been.',
      'What {name} thought {location} would be was not what {location} was — the rumor of the sanctuary had drifted, and the working did not greet a stranger.',
      '{name} walked the shrine\'s remembered route and arrived at empty stone — the holy ground had moved, or the memory had, and neither would yield.',
      'The sanctity {name} recalled was the sanctity of years past — the consecration had shifted, and the path that had once led inward led nowhere.',
    ],
  },

  agent_network: {
    reliable: [
      '{name} found the contacts where the dossier said they would be — names accurate, schedules accurate, the social geometry of {location} unchanged.',
      'The names {name} carried into the meeting were the right names, in the right order — the network held its shape, and the doors opened.',
      '{name} moved through the introductions with the surety of someone who had already drawn the map of who knew whom.',
      'What {name} knew of the network in {location} proved exact — alliances unmoved, debts unpaid in the same direction, the right names still meaning what they meant.',
    ],
    uncertain: [
      '{name} arrived with names that had been right once — most still were, and the introductions found their way through the gaps in the map.',
      'Half the network {name} expected stood as remembered; the other half had shifted, but enough remained to bridge what no longer connected directly.',
      '{name} worked the introductions partly from memory, partly from the room\'s rhythm — what the dossier missed, the conversation supplied.',
      'The names came back to {name} as faces emerged — most matched, a few had moved sideways in the social order, but the work proceeded.',
    ],
    dubious: [
      '{name} reached for the contacts the rumor had named, and reached past them — the network had reformed around different centers, and the old map ended in dead corners.',
      'What {name} carried as a list of allies in {location} read as a list of strangers — the network had moved on, or the names had been wrong from the start.',
      '{name} introduced herself by names that no longer carried weight here — the social order had shifted in ways the dossier had not been told about.',
      'The map of who knew whom that {name} relied on was the map of an older season — the present {location} had different alignments, and the effort showed.',
    ],
  },

  trade_route: {
    reliable: [
      '{name} read the caravan\'s rhythm exactly as the route notes had described — waystation timings held, the merchants\' debts owed in the directions remembered.',
      'The route through {location} unfolded for {name} the way familiar trade does — predictable bottlenecks, predicted yields, the same hands at the same crossings.',
      '{name} priced the goods by what {name} already knew the route would bear — the market spoke, but it spoke a language already learned.',
      'What {name} knew of {location}\'s commerce was current — the caravans ran on the marked schedule, the salt prices held the marked floor.',
    ],
    uncertain: [
      '{name} approached the trade with notes that had been right last season — most still applied, with a few small errors that cost only the noticing.',
      'Half of what {name} remembered about the route held; half had drifted, and {name} negotiated the difference at each crossing.',
      '{name} worked the caravan\'s pace partly from the marked schedule, partly from the dust on the road — the recognition was uneven but workable.',
      'The merchants\' rhythms {name} had once mapped had loosened — close enough to navigate, off enough to require attention at the unfamiliar stops.',
    ],
    dubious: [
      '{name} reached for the route\'s known turns and found the trade had moved — different waystations, different prices, the dossier describing a season already over.',
      'What {name} carried as the caravan\'s rhythm in {location} read as a fiction — the schedule had broken, and the rumor had not kept pace.',
      '{name} approached the merchants by the names the route notes had supplied — none answered, and the unfamiliar replacements asked questions {name} could not answer.',
      'The trade route {name} relied on was the trade route of a year that had ended — the present caravan ran on different ledgers, with different debts.',
    ],
  },

  military_position: {
    reliable: [
      '{name} read the patrol pattern the way the intelligence had described it — rotation intact, watch hours intact, the gap at the fourth marker still a gap.',
      'The garrison at {location} ran on the schedule {name} had memorized — sergeants where sergeants were said to be, the same blind angles where they were said.',
      '{name} moved through the perimeter with the surety of someone who already knew where the eyes were, and where they were not.',
      'What {name} knew of the patrol came back exact — same shifts, same gaps, the same tired hour when discipline thinned and the column blinked.',
    ],
    uncertain: [
      '{name} approached the garrison with most of the schedule remembered — the rotation had drifted by an hour or so, but the structural gaps remained.',
      'Half the patrol pattern {name} carried held; the other half required careful watching — close enough to predict, off enough to require breath held at corners.',
      '{name} read the perimeter partly from the marked dossier, partly from the way the watchmen carried themselves — the recognition was real but partial.',
      'The watch hours {name} had memorized had loosened — close enough to time the move, far enough off that the timing required a second look.',
    ],
    dubious: [
      '{name} reached for the patrol pattern the rumor had described and met a different garrison — different rotation, different captains, the dossier already a season behind.',
      'What {name} carried as the watch schedule in {location} matched none of the watch — the column had reformed, and the intelligence had not.',
      '{name} expected the gap at the fourth marker; the gap had moved, or had never been where the briefing put it, and the perimeter held closed.',
      'The military reading {name} had relied on was the reading of a settled garrison — the present force was unsettled, and the dossier had no answer for that.',
    ],
  },

  political_secret: {
    reliable: [
      '{name} carried the secret into the chamber the way carriers of valuable secrets do — knowing which silences would speak for it, and which would not.',
      'What {name} knew of the court\'s quiet alignments held — {name} pressed where the dossier said pressing would yield, and the room yielded.',
      '{name} read the gathering\'s hidden currents with the unhurried precision of someone who already knew which faction was bargaining and which was pretending.',
      'The leverage {name} had been told existed at {location} was real — the threat unspoken landed exactly where the briefing said it would.',
    ],
    uncertain: [
      '{name} entered the chamber with most of the alignments mapped — a few had shifted since the dossier was written, but the central wedge still held.',
      'Half the court\'s hidden geometry {name} had been told about was current; half required reading from the room itself — the conversation closed the gap.',
      '{name} carried a partial map of who feared whom in {location} — the names were right, the urgency had shifted, and the leverage moved accordingly.',
      'The political signal {name} was meant to read came back partly clear — recognition where recognition was earned, and reserve where the briefing had grown old.',
    ],
    dubious: [
      '{name} reached for the leverage the dossier had named, and reached past it — the secret had become open knowledge, or had never been a secret at all.',
      'What {name} carried as the court\'s hidden alignment in {location} read as last season\'s gossip — the room had reformed, and the threat could not land.',
      '{name} pressed where the briefing said pressing would yield, and the room laughed quietly — the secret had aged into a story everyone now told.',
      'The political reading {name} relied on was the reading of an earlier court — the present court had moved, and the leverage failed to find a fulcrum.',
    ],
  },

  cultural_knowledge: {
    reliable: [
      '{name} read the working with the unhurried recognition of someone who had seen its bones before — the lore came back, exactly as remembered.',
      'What {name} knew of the rite at {location} proved exact — gestures in the right order, the silences kept where the silences belonged.',
      '{name} moved through the ceremony with the surety of someone who had already learned its shape — every turn anticipated, every offering placed correctly.',
      'The lore {name} had carried into {location} held — the old practice spoke through {name}\'s hands, and the working took the shape it was meant to take.',
    ],
    uncertain: [
      '{name} works half from instinct, half from a half-recalled fragment — the lore returned in pieces, but enough pieces lined up to carry the working.',
      'Half the ritual\'s grammar {name} had memorized stood; half required improvisation, and the improvisation found its way to the right cadence eventually.',
      '{name} read the ceremony\'s structure partly from the lore committed to memory, partly from how the room held its breath — the recognition was real, if uneven.',
      'What {name} recalled of the old practice met the present — fragments lined up where they could, and the working took a familiar enough shape.',
    ],
    dubious: [
      '{name} reached for the lore they thought they knew. What surfaced was older, and stranger, and not quite what was expected.',
      'What {name} carried as the rite\'s true sequence read as a different rite — older, or younger, or simply wrong, and the working refused the shape.',
      '{name} read from a memory of the practice that the practice no longer matched — gestures landed in empty places, and the silences held no weight.',
      'The lore {name} had been so sure of had drifted — every other gesture met the air with the surety of practice, and every other gesture met nothing.',
    ],
  },
};
