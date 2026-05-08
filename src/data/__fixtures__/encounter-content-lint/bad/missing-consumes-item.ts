import type { EncounterContract } from '../../../../types/encounter-contract';

const contract: EncounterContract = {
  encounter: {
    id: 'encounter.fixture.bad_missing_consumes_item',
    protagonist: 'actor.fixture.eira',
    category: 'guild',
    rarity_tier: 2,
    intrinsic_tier: 'shaping',
    place: {
      location: 'location.fixture.bren',
      ambient_state: {},
      painting: '/concept-art/encounters/fixture.jpg',
    },
    cast: [],
    scene_state: {
      threads_in_play: [],
      factions_here: [],
      place_conditions: [],
      conditions_on_protagonist: [],
    },
    protagonist_view: {
      capability_axes: ['iron', 'heart', 'eye'],
      // R2 trigger: items_relevant is empty AND consumes_item below points to a non-existent node.
      items_relevant: [],
      vows_active_per_beat: {},
      callback_candidates: [],
      state_descriptor: 'tense',
    },
    beats: [
      {
        title: 'At the Gate',
        forecast_factors: ['the threads stand uncertain'],
        prose: 'She reaches for the token she does not carry.',
        prose_tooltips: {},
        encounter_choices: [
          {
            reach: 'iron',
            cost: 'small_breath',
            god_verb: 'stir her resolve',
            agent_reaction: 'she steadies',
            tilts_toward: 'protector path',
            moral_axis_pole: 'protector',
            fail_forward: 'the knot tightens',
            // R2 violation: consumes_item not in items_relevant and not in registry.
            consumes_item: 'item.fixture_unknown_id_does_not_exist',
          },
        ],
      },
    ],
    aftermath: {
      receipt: 'A choice was made.',
      changes: [],
    },
    ascendant_hand_filter: {
      eligible: [],
      rare_pulse: [],
    },
  },
};

export default contract;
