// src/types/targetContext.ts

import type { NodeType } from './graph';
import type { SphereName } from './index';
import type { HexPosition } from '../engine/delivery';

/**
 * Describes the currently-focused graph node for action filtering.
 * Constructed by each detail view from whatever node it displays.
 */
export interface TargetContext {
  /** The graph node ID of the target */
  readonly nodeId: string;
  /** The node's type (actor, location, artifact, etc.) */
  readonly nodeType: NodeType;
  /** Display name for drawer header */
  readonly displayName: string;
  /** Short label for drawer header (e.g., tier name, location subtype, item tier) */
  readonly displayLabel: string;
  /** Node subtype (actorType, locationSubtype, attachment subcategory, terrain type) */
  readonly subtype: string | null;
  /** Trait IDs present on this node (via has_trait edges) */
  readonly traitIds: readonly string[];
  /** Sphere affinity of the target (if any) */
  readonly sphereAffinity: SphereName | null;
  /** Hex position of the target (for range calculations) */
  readonly position: HexPosition | null;
  /** For actor targets: Influence Tier (enables legacy intervention path) */
  readonly influenceTier?: number;
  /** Arbitrary properties from the node, for advanced filtering */
  readonly properties: Readonly<Record<string, unknown>>;
}

/** Categories a template can declare it targets */
export type TargetCategory =
  | 'actor'
  | 'location'
  | 'sublocation'
  | 'hex'
  | 'artifact'
  | 'artifact_legendary'
  | 'resource';
