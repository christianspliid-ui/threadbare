/**
 * Prose vignettes for the Delve encounter variant (THR-152).
 *
 * Keyed by: archetype (vault | temple | battlefield) → beatName → outcome (advanced | partial | stalled)
 * Each entry has a Poet's Voice (italic narrative) and Witness facts (mechanical bullets).
 *
 * All player-character names use {name} / {their} / {their_name} enrichment placeholders.
 * Artifact references use {artifact}. Ally references use {ally}.
 */

import type { DelveBeatName, DelveBeatOutcome, RuinArchetype } from '../engine/ruins/delveTypes';

export interface DelveProseEntry {
  poet: string;
  witness: string[];
}

type DelveProseLookup = Record<
  RuinArchetype,
  Partial<Record<DelveBeatName, Partial<Record<DelveBeatOutcome, DelveProseEntry>>>>
>;

export const DELVE_PROSE: DelveProseLookup = {

  // ── Vault ────────────────────────────────────────────────────────────────
  vault: {
    Approach: {
      advanced: {
        poet: '{name} moves through the broken threshold, dust rising in columns where old seals have crumbled. Something in the dark ahead recognises the shape of {their} intent.',
        witness: ['{name} gains entry to the vault interior.', 'First seal broken — structural passage open.'],
      },
      partial: {
        poet: 'The outer gate holds longer than expected. {name} finds a narrow breach in the stonework — enough to pass, but {their} presence has stirred something old.',
        witness: ['{name} forces a partial entry.', 'Vault on alert — next check harder by 1 tier.'],
      },
      stalled: {
        poet: 'The vault\'s outer shell refuses {name}. Wards older than memory pulse faintly in the mortar. There is another way in, but it will cost time.',
        witness: ['{name} blocked at the outer threshold.', 'Beat delayed one tick — retry next opportunity.'],
      },
    },
    Threshold: {
      advanced: {
        poet: 'The inner door gives under {their} hands with a sound like held breath released. Beyond: a long hall of sealed alcoves, each one a story the old world chose to keep.',
        witness: ['{name} passes the inner threshold.', 'Vault interior open — inventory alcoves accessible.'],
      },
      partial: {
        poet: 'The mechanism answers {name}, but only halfway — the door locks open a hand-width, just enough to squeeze through. The room beyond is smaller than the map suggested.',
        witness: ['{name} advances with partial clearance.', 'Interior access limited — some alcoves sealed.'],
      },
      stalled: {
        poet: 'Something behind the door breathes. {name} steps back and waits in the dark, listening to the rhythm of a guardian that has slept for centuries and is not yet awake.',
        witness: ['{name} pauses — guardian presence detected.', 'No progress this beat.'],
      },
    },
    Descent: {
      advanced: {
        poet: 'The lower chamber opens like a held secret finally spoken. What the old world placed here gleams in {their} light — patient, undisturbed, waiting.',
        witness: ['{name} reaches the vault\'s heart.', 'Primary cache located — essence signature confirmed.'],
      },
      partial: {
        poet: '{name} finds the lower chamber, but the floor has shifted — some of what was stored here now lies under stone. They take what can be taken and mark the rest.',
        witness: ['{name} reaches partial cache access.', 'Reduced yield anticipated — {their} knowledge of the layout grows.'],
      },
      stalled: {
        poet: 'The descent stalls at a collapse. {name} studies the rubble, calculating. The way through exists, but it will require a different kind of force.',
        witness: ['{name} blocked in the descent.', 'Structural obstruction — no progress this beat.'],
      },
    },
    Revelation: {
      advanced: {
        poet: 'The archive at the vault\'s heart is intact. {name} reads what was meant to be forgotten: names of the dead, maps of the unmade, a single line that explains the shape of everything.',
        witness: ['{name} accesses the vault\'s knowledge core.', 'Ancient intelligence unlocked — origin culture data recovered.'],
      },
      partial: {
        poet: 'Most of the archive is damaged — fire long ago, or simply time. {name} recovers fragments: enough to understand the vault\'s purpose, not enough to know its full contents.',
        witness: ['{name} recovers partial archive.', 'Incomplete intelligence — origin culture partially illuminated.'],
      },
      stalled: {
        poet: 'The archive requires a key {name} does not carry. The knowledge is here, behind a final barrier that will not yield to force alone.',
        witness: ['{name} cannot access the knowledge core this beat.', 'Barrier requires specific capability.'],
      },
    },
    Egress: {
      advanced: {
        poet: '{name} walks back through the broken gate into open air, carrying what the old world left behind. The vault exhales behind them, its purpose complete.',
        witness: ['{name} exits the vault successfully.', 'Delve arc complete — emergence outcome resolving.'],
      },
      partial: {
        poet: 'The vault resists the departure — a final lock, a last weight of stone. {name} leaves with effort, and something small stays behind, as the old places always take something.',
        witness: ['{name} exits with complications.', 'Minor loss on egress — consequence roll modified.'],
      },
      stalled: {
        poet: 'The way out is not the way in. {name} finds the passage collapsed and begins the slower work of finding a new path. The vault is not done with {them} yet.',
        witness: ['{name} delayed on egress.', 'Exit complicated — arc conclusion delayed.'],
      },
    },
  },

  // ── Temple ───────────────────────────────────────────────────────────────
  temple: {
    Approach: {
      advanced: {
        poet: '{name} crosses the courtyard where the old god\'s name has been worn from the stone by rain and years. Whatever power remains here stirs at a familiar footstep.',
        witness: ['{name} enters the temple precinct.', 'Devotional threshold crossed — sphere resonance rising.'],
      },
      partial: {
        poet: 'The outer sanctum accepts {name} grudgingly. The wards are old but not dead — something here still remembers what was asked of those who entered.',
        witness: ['{name} gains conditional access.', 'Temple wards partially active — {name} must proceed carefully.'],
      },
      stalled: {
        poet: 'The temple\'s outer door is sealed with intention, not age. Someone — or something — has closed it against exactly the kind of arrival {name} represents.',
        witness: ['{name} refused at the outer sanctum.', 'Sealed by recent action — not ancient decay.'],
      },
    },
    Threshold: {
      advanced: {
        poet: 'The inner hall opens. {name} steps past the boundary where the god\'s voice was once heard by congregations now ash. The silence here is different from the silence outside.',
        witness: ['{name} enters the inner sanctum.', 'Devotional space accessible — old sphere-resonance present.'],
      },
      partial: {
        poet: 'Something tests {name} at the inner threshold — a question without words, a weight behind the eyes. {they} pass, but the answer they gave was not the answer the temple wanted.',
        witness: ['{name} passes with reservations.', 'Temple senses {their} intent — subsequent checks affected.'],
      },
      stalled: {
        poet: 'The inner threshold asks something of {name} that {they} cannot give. Not strength — understanding. The kind that only comes from having stood in this place before.',
        witness: ['{name} held at the inner sanctum.', 'Devotional requirement unmet — no progress this beat.'],
      },
    },
    Descent: {
      advanced: {
        poet: 'Beneath the altar: the deep sanctum, where the old god\'s most private work was done. {name} descends into accumulated centuries of sacred purpose.',
        witness: ['{name} reaches the subterranean sanctum.', 'Deep sanctum accessible — core relic chamber ahead.'],
      },
      partial: {
        poet: 'The descent takes {name} deeper than the maps suggested. The deep sanctum is real, but it is also occupied — by old intentions that predate any mortal record.',
        witness: ['{name} reaches the deep sanctum cautiously.', 'Old-god presence detected — {name} proceeds under observation.'],
      },
      stalled: {
        poet: 'The way to the deep sanctum is submerged. {name} stands at the edge of dark water and considers. Whatever is down there has been waiting longer than they have been alive.',
        witness: ['{name} blocked by physical obstacle in descent.', 'Submerged passage — alternative route required.'],
      },
    },
    Revelation: {
      advanced: {
        poet: 'The temple\'s heart speaks. Not in words — in the residue of ten thousand prayers, the shape of what was asked for and what was given. {name} understands what this place was for.',
        witness: ['{name} communes with the temple\'s devotional record.', 'Origin god\'s intent recovered — faction alignment clarified.'],
      },
      partial: {
        poet: 'The revelation comes in pieces, like a sentence spoken by a voice that is mostly gone. {name} catches the meaning but not all the words. Enough, perhaps. Perhaps not.',
        witness: ['{name} receives partial revelation.', 'Incomplete communion — understanding degraded.'],
      },
      stalled: {
        poet: 'The temple\'s deepest record is not for {name}. The old god\'s choice, not {their} failing. Something about who they are — what sphere they carry — closes this door.',
        witness: ['{name} denied deep access.', 'Sphere misalignment — revelation gated.'],
      },
    },
    Egress: {
      advanced: {
        poet: '{name} leaves the temple carrying the weight of old purpose. Behind them, the inner sanctum is quiet — as if what was needed has been done, and what was not needed has been left.',
        witness: ['{name} exits the temple with full outcome.', 'Delve arc complete — emergence outcome resolving.'],
      },
      partial: {
        poet: 'The temple releases {name} slowly, like a hand that isn\'t sure it wants to let go. {they} emerge into air that tastes different than it did when {they} entered.',
        witness: ['{name} exits with residual attachment.', 'Minor binding retained — consequence roll modified.'],
      },
      stalled: {
        poet: 'The temple\'s blessing is also a trap. {name} has been seen here, and the old god\'s record is indelible. Leaving cleanly was never an option.',
        witness: ['{name} marked by temple on egress.', 'Divine record updated — exit complicated.'],
      },
    },
  },

  // ── Battlefield ──────────────────────────────────────────────────────────
  battlefield: {
    Approach: {
      advanced: {
        poet: '{name} crosses the field where the last army of the old world made its final stand. The ground is wrong here — too quiet, too flat, as if the earth has been holding itself still ever since.',
        witness: ['{name} enters the battlefield perimeter.', 'Field geography mapped — approach route clear.'],
      },
      partial: {
        poet: 'The field resists passage — not with physical obstacles but with something {name} cannot name. The air carries a residue of decision. {they} move through it slowly.',
        witness: ['{name} advances through residual memory.', 'Psychic pressure reducing movement — progress slower than expected.'],
      },
      stalled: {
        poet: 'The battlefield\'s outer boundary is watched. Not by anything alive — by the shape of what happened here, which still insists on being witnessed before it yields.',
        witness: ['{name} blocked at the perimeter.', 'Battlefield memory-ward active — passage requires acknowledgment.'],
      },
    },
    Threshold: {
      advanced: {
        poet: 'The killing ground. {name} walks where ten thousand made their last decision. The old power concentrates here — it was always most itself in the moment of total commitment.',
        witness: ['{name} crosses into the central field.', 'Battlefield apex reached — major power site accessible.'],
      },
      partial: {
        poet: 'The central ground accepts {name} but demands something in return: an acknowledgment. Of what was done. Of why. {they} give it, quietly, and move on.',
        witness: ['{name} gains conditional access to the central field.', 'Ritual acknowledgment paid — {name} may proceed.'],
      },
      stalled: {
        poet: 'Two forces still contend here, long after their bodies have gone to soil. {name} cannot pass through what is still, technically, in progress.',
        witness: ['{name} caught in residual conflict.', 'Battle-echo active — no safe path through this beat.'],
      },
    },
    Descent: {
      advanced: {
        poet: 'Beneath the field: the command position, where the old general made the decision that ended everything. {name} finds the place and understands, in their body, what it cost.',
        witness: ['{name} locates the command site.', 'Strategic relics accessible — military intelligence preserved.'],
      },
      partial: {
        poet: 'The command position is real, but it has been visited before. Someone else found this place and took what was most valuable. {name} takes what remains.',
        witness: ['{name} finds the command site partly looted.', 'Reduced strategic cache — secondary intelligence recoverable.'],
      },
      stalled: {
        poet: 'The ground under the command position has shifted in a way that suggests intention. {name} digs in the wrong place three times before understanding they are being redirected.',
        witness: ['{name} misdirected in the descent.', 'Ward active on command site — correct approach unclear.'],
      },
    },
    Revelation: {
      advanced: {
        poet: 'The last order. {name} finds it preserved — not on paper, which would have rotted, but in the land itself: the shape of the final positions, the silence of the final choice.',
        witness: ['{name} reads the final order.', 'Tactical record intact — historical culture\'s last decision recovered.'],
      },
      partial: {
        poet: 'The revelation is incomplete — the outcome, not the reason. {name} understands what happened but not why. The why is still here, somewhere, but it will take more than one visit to find it.',
        witness: ['{name} recovers partial battle record.', 'Incomplete revelation — outcome recovered, cause uncertain.'],
      },
      stalled: {
        poet: 'The final order is in a language {name} cannot read. Or perhaps it is a language no one reads anymore. The revelation is locked behind knowledge that was carried to the grave.',
        witness: ['{name} cannot access the battle record.', 'Language or cipher barrier — cultural knowledge required.'],
      },
    },
    Egress: {
      advanced: {
        poet: '{name} leaves the field as the last survivor always does — with the full understanding of what it cost and the open question of whether it was worth it. The field releases them without comment.',
        witness: ['{name} exits the battlefield.', 'Delve arc complete — emergence outcome resolving.'],
      },
      partial: {
        poet: 'The field does not want to be left. Not with malice — with the need of all incomplete things to be witnessed a little longer. {name} walks away anyway, carrying the weight of it.',
        witness: ['{name} exits with battlefield residue.', 'Psychic attachment on egress — consequence roll modified.'],
      },
      stalled: {
        poet: 'The last soldier on the field was the last to leave, and they were never sure if they were allowed to. {name} understands this now in a way that slows {their} steps.',
        witness: ['{name} delayed at egress.', 'Memory-binding at perimeter — arc conclusion delayed.'],
      },
    },
  },
};

/**
 * Resolve a prose entry for a delve beat. Falls back to a generic entry if
 * the exact (archetype, beatName, outcome) combination is missing.
 */
export function resolveDelveProseEntry(
  archetype: RuinArchetype,
  beatName: DelveBeatName,
  outcome: DelveBeatOutcome,
): DelveProseEntry {
  const entry = DELVE_PROSE[archetype]?.[beatName]?.[outcome];
  if (entry) return entry;

  // Fallback: try any outcome for this beat
  const beatEntries = DELVE_PROSE[archetype]?.[beatName];
  if (beatEntries) {
    const fallback = beatEntries.advanced ?? beatEntries.partial ?? beatEntries.stalled;
    if (fallback) return fallback;
  }

  // Generic fallback — should not reach here in practice
  return {
    poet: '{name} presses deeper into the ruin, moving through corridors that have not seen living passage in generations.',
    witness: ['{name} advances through the ruin.', `Beat ${beatName} — ${outcome}.`],
  };
}
