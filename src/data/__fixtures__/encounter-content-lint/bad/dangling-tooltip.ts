import type { EncounterContract } from '../../../../types/encounter-contract';

const contract: EncounterContract = {
  encounter: {
    id: 'encounter.fixture.bad_dangling_tooltip',
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
      items_relevant: [],
      vows_active_per_beat: {},
      callback_candidates: [],
      state_descriptor: 'tense',
    },
    beats: [
      {
        title: 'At the Gate',
        forecast_factors: ['the threads stand uncertain'],
        prose: 'The small folk holds her gaze, waiting for the order.',
        // R1 violation: tooltip points at an entity that doesn't exist anywhere.
        prose_tooltips: {
          "the small folk's silence": 'vow.fixture_unknown_id_does_not_exist',
        },
        encounter_choices: [
          {
            reach: 'iron',
            cost: 'small_breath',
            god_verb: 'stir her resolve',
            agent_reaction: 'she steadies',
            tilts_toward: 'protector path',
            moral_axis_pole: 'protector',
            fail_forward: 'the knot tightens',
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
