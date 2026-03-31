/**
 * Named Terrain Overlay Definitions — enumerable hex effects from spells/artifacts.
 *
 * Each overlay applies per-reach modifiers to all agents on the affected hex,
 * plus optional behavior modifications (spawn rates, movement costs, etc.).
 *
 * Design doc: Docs/plans/2026-03-31-generic-effect-system-design.md
 */

import type { ReachDomain } from '../types/traits';
import type { TerrainOverlayType } from '../types/effects';

export interface TerrainOverlayDefinition {
  readonly type: TerrainOverlayType;
  readonly name: string;
  readonly description: string;
  /** Per-reach modifiers applied to all agents on the hex */
  readonly reachModifiers: Partial<Record<ReachDomain, number>>;
  /** Behavioral effects (spawn rates, movement costs, etc.) */
  readonly behaviorModifiers?: {
    readonly spawnRateMultiplier?: number;
    readonly movementCostMultiplier?: number;
    readonly doomRateMultiplier?: number;
    readonly healingMultiplier?: number;
    readonly cooldownMultiplier?: number;
    readonly backlashSeverityMultiplier?: number;
  };
  /** Visual tint color for hex map rendering (hex color string) */
  readonly tintColor: string;
}

export const TERRAIN_OVERLAY_DEFINITIONS: Record<TerrainOverlayType, TerrainOverlayDefinition> = {
  sacred_ground: {
    type: 'sacred_ground',
    name: 'Sacred Ground',
    description: 'Hallowed earth radiates cosmic harmony.',
    reachModifiers: { star: 0.05, shadow: -0.05 },
    tintColor: '#f5e6a0',
  },
  blighted: {
    type: 'blighted',
    name: 'Blighted Land',
    description: 'Corruption seeps from the earth.',
    reachModifiers: { stone: -0.05, heart: -0.05 },
    tintColor: '#4a2f5c',
  },
  fertile_ground: {
    type: 'fertile_ground',
    name: 'Fertile Ground',
    description: 'Life force pulses through the land.',
    reachModifiers: { stone: 0.05 },
    behaviorModifiers: { spawnRateMultiplier: 1.5 },
    tintColor: '#3d8c40',
  },
  frozen: {
    type: 'frozen',
    name: 'Frozen',
    description: 'Bitter cold grips everything.',
    reachModifiers: { iron: -0.05 },
    behaviorModifiers: { movementCostMultiplier: 2.0 },
    tintColor: '#a0d4e8',
  },
  volcanic: {
    type: 'volcanic',
    name: 'Volcanic',
    description: 'Fire and ash rise from the earth.',
    reachModifiers: { iron: 0.05 },
    tintColor: '#e04020',
  },
  shrouded: {
    type: 'shrouded',
    name: 'Shrouded',
    description: 'An unnatural mist blankets the area.',
    reachModifiers: { shadow: 0.05, eye: -0.05 },
    tintColor: '#606080',
  },
  hallowed: {
    type: 'hallowed',
    name: 'Hallowed',
    description: 'Death itself is held at bay here.',
    reachModifiers: { heart: 0.05 },
    behaviorModifiers: { doomRateMultiplier: 0.0 },
    tintColor: '#fff8dc',
  },
  cursed_ground: {
    type: 'cursed_ground',
    name: 'Cursed Ground',
    description: 'An ancient evil permeates this place.',
    reachModifiers: { star: -0.05 },
    behaviorModifiers: { doomRateMultiplier: 1.5 },
    tintColor: '#2d0a2e',
  },
  wild_magic: {
    type: 'wild_magic',
    name: 'Wild Magic',
    description: 'Raw magical energy crackles unpredictably.',
    reachModifiers: {},
    behaviorModifiers: { cooldownMultiplier: 0.5, backlashSeverityMultiplier: 2.0 },
    tintColor: '#8040c0',
  },
  contested: {
    type: 'contested',
    name: 'Contested',
    description: 'The air thrums with aggression.',
    reachModifiers: { iron: 0.03 },
    behaviorModifiers: { spawnRateMultiplier: 1.5 },
    tintColor: '#c03030',
  },
};
