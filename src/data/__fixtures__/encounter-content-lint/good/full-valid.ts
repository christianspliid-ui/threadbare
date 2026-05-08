import type { EncounterContract } from '../../../../types/encounter-contract';

const FULL_VALID_ENCOUNTER_CONTRACT: EncounterContract = {
  encounter: {
    id: 'encounter.fixture.good.full_valid',
    protagonist: 'actor.fixture.protagonist',
    category: 'social',
    rarity_tier: 2,
    intrinsic_tier: 'shaping',
    place: {
      location: 'location.fixture.square',
      ambient_state: {
        time_of_day: 'dusk',
      },
      painting: '/concept-art/encounters/fixture-good.jpg',
    },
    cast: [
      {
        actor: 'actor.fixture.witness',
        role_in_scene: 'witness',
        attention_priority: 'primary',
        representation: 'cast_tile',
        disposition_per_beat: {
          1: 'curious',
        },
        tags: ['fixture'],
      },
    ],
    scene_state: {
      threads_in_play: [
        {
          name: 'civic oath',
          weight: 'taut',
          sphere_color: 'spirit',
        },
      ],
      factions_here: ['faction.fixture.watch'],
      place_conditions: ['condition.fixture.market-open'],
      conditions_on_protagonist: [],
    },
    protagonist_view: {
      capability_axes: ['heart', 'eye', 'stone'],
      items_relevant: ['item.fixture.token'],
      vows_active_per_beat: {
        1: ['vow.fixture.peace'],
      },
      callback_candidates: ['event.fixture.market-dispute'],
      state_descriptor: 'She weighs peace against urgency.',
    },
    beats: [
      {
        title: 'A Circle of Uneasy Neighbors',
        forecast_factors: ['Rain presses low over the square', 'Voices tighten around the oath'],
        prose: 'The square stills while the steward asks for one clear promise.',
        prose_tooltips: {
          oath: 'rel.underpins',
        },
        encounter_choices: [
          {
            reach: 'heart',
            cost: 'small_breath',
            god_verb: 'steady their resolve',
            agent_reaction: 'the steward meets each gaze without flinching',
            tilts_toward: 'shared obligation',
            moral_axis_pole: 'sworn',
            fail_forward: 'the argument spills into the alley',
            consumes_item: 'item.fixture.token',
          },
        ],
      },
    ],
    aftermath: {
      receipt: 'A quiet promise settles over the square.',
      changes: [],
    },
    ascendant_hand_filter: {
      eligible: ['action.heart.guide'],
      rare_pulse: [],
    },
  },
};

export default FULL_VALID_ENCOUNTER_CONTRACT;
