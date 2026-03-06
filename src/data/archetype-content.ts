/**
 * Archetype Content Package — 19 narrative archetypes from the content strategy.
 *
 * Each agent is assigned one archetype during world generation. The archetype
 * influences prose tone, story shape, and highlights certain Reach affinities.
 *
 * Source: Docs/plans/2026-03-06-content-strategy.md
 */

import type { ReachDomain } from '../types/traits';

export interface NarrativeArchetype {
  id: string;
  name: string;
  storyShape: string;
  proseTone: string;
  reachAffinities: ReachDomain[];
}

export const NARRATIVE_ARCHETYPES: NarrativeArchetype[] = [
  { id: 'tragic_hero', name: 'Tragic Hero', storyShape: 'Rise, hubris, fall', proseTone: 'Grand, foreboding, inevitable', reachAffinities: ['iron', 'veil', 'heart'] },
  { id: 'trickster', name: 'Trickster', storyShape: 'Schemes, reversals, ironic justice', proseTone: 'Wry, quick, darkly comic', reachAffinities: ['shadow', 'gold', 'heart'] },
  { id: 'coming_of_age', name: 'Coming of Age', storyShape: 'Innocence, hardening, transformation', proseTone: 'Wonder fading to resolve', reachAffinities: ['flesh', 'veil', 'eye'] },
  { id: 'brooding_warrior', name: 'Brooding Warrior', storyShape: 'Burden, endurance, reluctant action', proseTone: 'Terse, heavy, physical', reachAffinities: ['iron', 'stone', 'star'] },
  { id: 'fallen_noble', name: 'Fallen Noble', storyShape: 'Lost glory, bitter wisdom, possible redemption', proseTone: 'Weary, sharp-edged, proud', reachAffinities: ['gold', 'heart', 'shadow'] },
  { id: 'true_believer', name: 'True Believer', storyShape: 'Faith tested, vindicated or shattered', proseTone: 'Fervent, intense, certain', reachAffinities: ['veil', 'star', 'heart'] },
  { id: 'schemer', name: 'Schemer', storyShape: 'Webs of manipulation, delayed payoffs', proseTone: 'Cold, precise, calculating', reachAffinities: ['shadow', 'gold', 'heart'] },
  { id: 'wanderer', name: 'Wanderer', storyShape: 'Rootless, observing, stumbling into consequence', proseTone: 'Detached, laconic, then suddenly urgent', reachAffinities: ['star', 'eye', 'shadow'] },
  { id: 'monster', name: 'Monster', storyShape: 'Inhuman acts, possibly with buried humanity', proseTone: 'Brutal, unflinching, occasionally tender', reachAffinities: ['iron', 'flesh', 'shadow'] },
  { id: 'folk_hero', name: 'Folk Hero', storyShape: 'Unlikely champion, beloved by common people', proseTone: 'Warm, earthy, darkly funny', reachAffinities: ['heart', 'stone', 'gold'] },
  { id: 'reluctant_king', name: 'Reluctant King', storyShape: 'Refuses power, forced to accept, transformed by burden', proseTone: 'Quiet dignity, weight of duty, melancholy', reachAffinities: ['heart', 'iron', 'stone'] },
  { id: 'oathkeeper', name: 'Oathkeeper', storyShape: 'Bound by a vow that costs everything', proseTone: 'Stubborn, grinding, the vow becomes the whole person', reachAffinities: ['iron', 'star', 'heart'] },
  { id: 'poisoned_court', name: 'Poisoned Court', storyShape: 'Power corrupts, alliances shift, trust is a weapon', proseTone: 'Silken, venomous, every word has a second meaning', reachAffinities: ['gold', 'heart', 'shadow'] },
  { id: 'doomed_innocent', name: 'Doomed Innocent', storyShape: 'Good person in a world that will break them', proseTone: 'Tender at first, darkening steadily, no rescue coming', reachAffinities: ['star', 'veil', 'heart'] },
  { id: 'old_power', name: 'Old Power', storyShape: 'Ancient, vast, fading or awakening', proseTone: 'Slow, heavy, elemental — weight not speed', reachAffinities: ['veil', 'eye', 'star'] },
  { id: 'kingmaker', name: 'Kingmaker', storyShape: 'Never rules, always decides who does', proseTone: 'Shrewd, understated, power through others', reachAffinities: ['gold', 'heart', 'shadow'] },
  { id: 'seeker', name: 'Seeker', storyShape: 'Pursues forbidden knowledge, pays the price of knowing', proseTone: 'Obsessive, precise, progressively unhinged', reachAffinities: ['eye', 'veil', 'star'] },
  { id: 'maker', name: 'Maker', storyShape: 'Creates something that outlasts them — or destroys them', proseTone: 'Patient, hands-on, proud — the craft is sacred', reachAffinities: ['stone', 'flesh', 'eye'] },
  { id: 'noble_savage', name: 'Noble Savage', storyShape: 'Primal strength meets civilization, transforms it or is broken', proseTone: 'Raw, physical, elemental — contempt for complexity', reachAffinities: ['iron', 'flesh', 'stone'] },
];

export function getArchetype(id: string): NarrativeArchetype | undefined {
  return NARRATIVE_ARCHETYPES.find(a => a.id === id);
}
