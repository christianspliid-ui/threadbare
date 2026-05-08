import type { EncounterContract } from '../../../../types/encounter-contract';

const contract: EncounterContract = {
  encounter: {
    id: 'encounter.fixture.full_valid',
    protagonist: 'actor.fixture.eira',
    category: 'guild',
    rarity_tier: 2,
    intrinsic_tier: 'shaping',
    place: {
      location: 'location.fixture.bren',
      ambient_state: { time_of_day: 'evening' },
      painting: '/concept-art/encounters/fixture-full-valid.jpg',
    },
    cast: [
      {
        actor: 'actor.fixture.halren',
        role_in_scene: 'witness',
        attention_priority: 'primary',
        representation: 'cast_tile',
        disposition_per_beat: { 1: 'guarded' },
        tags: ['scene_tag'],
      },
    ],
    scene_state: {
      threads_in_play: [
        {
          name: 'authority',
          weight: 'taut',
          sphere_color: 'force',
        },
      ],
      factions_here: ['faction.fixture.civic_guard'],
      place_conditions: ['condition.fixture.narrow_gate'],
      conditions_on_protagonist: [],
    },
    protagonist_view: {
      capability_axes: ['iron', 'heart', 'eye'],
      items_relevant: ['item.fixture.captains_token'],
      vows_active_per_beat: { 1: ['vow.fixture.smallfolk'] },
      callback_candidates: ['event.fixture.gate_duty'],
      state_descriptor: 'she is weighing what kind of god to be',
    },
    beats: [
      {
        title: 'At the Gate',
        forecast_factors: ['the threads stand uncertain', 'iron-rooted, but quiet'],
        prose: 'She faces the captain. The crowd waits. A small folk holds her gaze.',
        prose_tooltips: {
          'foundation of order': 'foundation.order',
          'fire-rooted will': 'magic.fire',
        },
        encounter_choices: [
          {
            reach: 'iron',
            cost: 'small_breath',
            god_verb: 'stir her resolve',
            agent_reaction: 'she squares her shoulders',
            tilts_toward: 'protector path',
            moral_axis_pole: 'protector',
            fail_forward: 'the knot tightens',
            consumes_item: 'item.fixture.captains_token',
          },
          {
            reach: 'heart',
            cost: 'fuller_breath',
            god_verb: 'speak into the room',
            agent_reaction: 'the room stirs',
            tilts_toward: 'unsteady compromise',
            moral_axis_pole: 'sworn',
            fail_forward: 'a new witness steps in',
          },
        ],
      },
    ],
    aftermath: {
      receipt: 'The gate has held. Eira walks back into the keep with the captain at her side.',
      changes: [
        {
          kind: 'recent_event',
          payload: { message: 'The Gate is now remembered.' },
        },
      ],
    },
    ascendant_hand_filter: {
      eligible: ['action.divine.omen'],
      rare_pulse: [],
    },
    graph_node: {
      spawns_from: ['location.fixture.bren'],
      gates_to: [],
      enables: [],
    },
  },
};

export default contract;
