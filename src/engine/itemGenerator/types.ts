/**
 * The item generator's shapes (THR-1570).
 *
 * Plan: `Docs/plans/2026-09-26-thr-1570-seeded-item-generator.md` § Engine pillar.
 */

import type { AttachmentEffect } from '../../types/effects';
import type { LossCondition } from '../../types/attachments';
import type { ReachDomain } from '../../types/traits';
import type { SphereName } from '../../types/index';
import type { PossessionSubcategory } from '../../types/attachments';
import type { ItemGenBand, ItemGenOrigin, ItemGenFormId, ItemGenNameGrammar } from '../../data/item-generator-tables';

export type Pronoun = 'she' | 'he' | 'they';

// ─── The world an item is dressed by ──────────────────────────────────

/** A faction as the generator speaks of it. */
export interface ItemGenFaction {
  readonly id: string;
  /** Faction definition id (`FACTION_DEFINITIONS`), when the node carries one. */
  readonly defId: string | null;
  /** "The Free Company". */
  readonly name: string;
  /** "Free Company" — the name without its article. */
  readonly bare: string;
  readonly roles: readonly string[];
  readonly nameRoles: readonly string[];
  readonly spheres: Partial<Record<SphereName, number>>;
  readonly reachWeights: Partial<Record<ReachDomain, number>>;
}

export interface ItemGenPlace {
  readonly id: string;
  readonly name: string;
  readonly terrain?: string;
  readonly spheres: Partial<Record<SphereName, number>>;
}

export interface ItemGenCulture {
  readonly id: string;
  /** "the Harrowfolk". */
  readonly name: string;
  /** "Harrowfolk". */
  readonly adj: string;
  readonly spheres: Partial<Record<SphereName, number>>;
  readonly homePlaceId?: string;
}

/** What kind of disaster an event was — salvage reads the kind, not the id. */
export type ItemGenEventKind = 'flood' | 'siege' | 'last_stand' | 'fire' | 'plague' | 'riot' | 'winter' | 'starfall';

export interface ItemGenEvent {
  readonly id: string;
  readonly kind: ItemGenEventKind;
  readonly name: string;
  readonly short?: string;
  readonly placeId: string;
  readonly spheres: Partial<Record<SphereName, number>>;
  readonly what: string;
  readonly lingers: string;
  readonly salvage: string;
}

/** A named person a found thing's story can name — the dead, mostly. */
export interface ItemGenHero {
  readonly id: string;
  readonly name: string;
  readonly first: string;
  readonly family: string;
  readonly pronoun: Pronoun;
  readonly factionId: string | null;
  readonly role: string;
  readonly deed: string;
  readonly fate: string;
  readonly eventId?: string;
  readonly dead: boolean;
  readonly oathbreaker?: boolean;
}

export interface ItemGenMonster {
  readonly id: string;
  readonly name: string;
  readonly sphere: SphereName;
  readonly placeId: string;
  /** "a wraith of the Grey Wraith Host". */
  readonly one: string;
  /** A condition-family tag the host's trophies ward against, when it has one. */
  readonly immune?: string;
  readonly reachWeights: Partial<Record<ReachDomain, number>>;
}

/** The mortal who made the thing (masterwork origin). */
export interface ItemGenMaker {
  readonly id: string;
  readonly name: string;
  readonly first: string;
  readonly pronoun: Pronoun;
  readonly factionId: string | null;
  readonly placeId: string | null;
  readonly cultureId: string | null;
}

/**
 * Everything the generator may name. Every field optional in spirit: an empty table
 * makes the lines that need it ineligible, and nothing names a missing thing.
 */
export interface ItemWorldContext {
  readonly maker: ItemGenMaker | null;
  readonly factions: Readonly<Record<string, ItemGenFaction>>;
  readonly places: Readonly<Record<string, ItemGenPlace>>;
  readonly cultures: Readonly<Record<string, ItemGenCulture>>;
  readonly heroes: Readonly<Record<string, ItemGenHero>>;
  readonly events: Readonly<Record<string, ItemGenEvent>>;
  readonly monsters: Readonly<Record<string, ItemGenMonster>>;
}

// ─── Request and result ───────────────────────────────────────────────

/** What this world (or batch) has already made — the repeat decays read it. */
export interface ItemGenHistory {
  readonly core: Record<string, number>;
  readonly signature: Record<string, number>;
  readonly form: Record<string, number>;
  readonly hero: Record<string, number>;
  readonly provenance: Record<string, number>;
  readonly names: Set<string>;
  readonly looks: Set<string>;
}

export interface ItemGenRequest {
  /** The full seed key — re-running it reproduces the item exactly. */
  readonly seedKey: string;
  readonly band: ItemGenBand;
  readonly origin: ItemGenOrigin;
  readonly world: ItemWorldContext;
  /** Defaults to an empty history. */
  readonly history?: ItemGenHistory;
  /** Restrict to one core (review / tests). */
  readonly coreId?: string;
  /** Restrict to one signature of that core (review / tests). */
  readonly signatureId?: string;
}

export type ItemGenRole = 'boon' | 'catch';

export interface ItemGenPart {
  readonly effect: AttachmentEffect | { readonly type: '_note'; readonly text: string };
  readonly role: ItemGenRole;
}

/** A named entity the story mentions — the sheet links it (UI Law clause b). */
export interface ItemGenConcept {
  readonly id: string;
  readonly kind: 'actor' | 'faction' | 'location';
  readonly name: string;
}

export interface GeneratedItem {
  readonly seedKey: string;
  readonly band: ItemGenBand;
  readonly origin: ItemGenOrigin;
  readonly coreId: string;
  readonly coreLabel: string;
  readonly signatureId: string;
  readonly kind: PossessionSubcategory;
  readonly formId: ItemGenFormId;
  readonly formNoun: string;
  readonly materialId: string;
  readonly sphere: SphereName;
  readonly reach: ReachDomain;
  readonly name: string;
  readonly grammar: ItemGenNameGrammar;
  readonly look: string;
  readonly provenance: string;
  readonly provenanceTone: string;
  readonly effects: readonly AttachmentEffect[];
  /** Indexes into `effects` that are the catch, not the boon. */
  readonly catchIndexes: readonly number[];
  /** Plain-words notes on catches that are not an effect of their own (e.g. a suppress radius that includes the bearer). */
  readonly catchNotes: readonly string[];
  readonly tags: readonly string[];
  readonly lossCondition: LossCondition;
  readonly slotTag: string;
  readonly cursed: boolean;
  /** Virtue trait id a worthy hand must carry, for the cores that ask one. */
  readonly virtueTraitId: string | null;
  readonly concepts: readonly ItemGenConcept[];
  /** Tables fired, `table=pick` — the inspectability trail. */
  readonly fired: readonly string[];
}

/** The bag written on a generated item's node (`properties.generated`). */
export interface GeneratedItemProvenance {
  readonly origin: ItemGenOrigin;
  readonly coreId: string;
  readonly signatureId: string;
  readonly band: ItemGenBand;
  readonly seedKey: string;
  readonly formId: string;
  readonly catchIndexes: readonly number[];
  readonly catchNotes: readonly string[];
  readonly provenanceConcepts: readonly ItemGenConcept[];
  readonly makerId: string | null;
  readonly rerolls: number;
}
