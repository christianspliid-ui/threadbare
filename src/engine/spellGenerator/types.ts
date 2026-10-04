/**
 * The seeded spell generator — shared types (THR-1572).
 *
 * Plan: `Docs/plans/2026-09-30-thr-1572-seeded-spell-generator.md` § Systems design and
 * § Graph nodes / edges. Kept out of `src/types/effects.ts` (a ≥100-importer file) on
 * purpose: `SpellTemplate` already carries every field a generated spell needs.
 */

import type { AttachmentEffect, EffectCondition, SpellAgency, SpellArena, SpellTemplate } from '../../types/effects';
import type { ReachDomain } from '../../types/traits';
import type { SphereName } from '../../types';

/** The four price layers (THR-1230 ruling 3): free → strain → gamble → transgression. */
export type SpellPriceLayer = 'free' | 'strain' | 'gamble' | 'transgression';
export const SPELL_PRICE_LAYERS: readonly SpellPriceLayer[] = ['free', 'strain', 'gamble', 'transgression'];

/** What a tradition teaches — the hard fit between a tradition and a core (envelope rule 1). */
export type SpellTheme =
  | 'war' | 'travel' | 'sight' | 'mind' | 'heal' | 'holy' | 'death' | 'curse'
  | 'luck' | 'wild' | 'craft' | 'ward' | 'time' | 'fear' | 'conceal';

/** A spell tier as the library and the attachment system count it. */
export type SpellGenTier = 1 | 2 | 3 | 4;

/** One authored tradition row (`TRADITION_ENV`), keyed by the world model's tradition id. */
export interface TraditionRow {
  /** What kinds of spell it teaches; the first is its primary theme (price lean, vice). */
  readonly themes: readonly SpellTheme[];
  /** The situation its conditionals reach for first. */
  readonly cond: EffectCondition;
  /** Word banks (envelope rule 5): count nouns and mass nouns for names. */
  readonly nouns: readonly string[];
  readonly mass: readonly string[];
  /** Phrase overrides for the cores that speak of a blow, a road or a ward. */
  readonly blow?: string;
  readonly road?: string;
  readonly ward?: string;
  /** Reveal families of encounters that notice this tradition's transgressions (rule 6). */
  readonly noticeFamilies: readonly string[];
}

/** The per-sphere envelope: the Reaches it pulls, its words and what it does when it bites back. */
export interface SphereEnvelope {
  readonly reaches: Readonly<Partial<Record<ReachDomain, number>>>;
  readonly conditions: readonly EffectCondition[];
  readonly adj: readonly string[];
  readonly noun: readonly string[];
  /** The condition a carried spell of this sphere leaves when it turns on its bearer. */
  readonly turn: string;
  /** Cast backlash keys (`CAST_MISCASTS`) — only miscasts whose effect writes. */
  readonly miscasts: readonly string[];
  /** Default blow when the tradition names none. */
  readonly blow: string;
}

/** What a core's builder is handed: the drawn slot, already seeded. */
export interface CoreContext {
  readonly sphere: SphereName;
  readonly traditionId: string;
  readonly tradition: TraditionRow;
  /** The sphere-specific argument from the core's `spheres` table (a Reach, a condition, `true`). */
  readonly arg: string | true;
  /** The Reach this spell leans on (sphere pulls, nudged toward the tradition's primary theme). */
  readonly reach: ReachDomain;
  /** 0-based tier index (tier 1 → 0). */
  readonly tierIdx: number;
  /** Pick the tier's entry from a four-entry envelope. */
  t<T>(arr: readonly [T, T, T, T]): T;
  /** A magnitude inside the tier's envelope, on its own named stream. */
  m(stream: string): number;
  /** A uniform roll in [0, 1) on its own named stream. */
  roll(stream: string): number;
}

/** What a core builds: its effects and how it is named. The sentence is derived, never authored here. */
export interface CoreBuild {
  readonly effects: AttachmentEffect[];
  readonly reach: ReachDomain;
  readonly targeting: SpellTemplate['targeting'];
  readonly names: { readonly nouns: readonly string[]; readonly verbs?: readonly string[]; readonly objects?: readonly string[] };
}

/** One authored core (Content pillar): a small kernel the generator grows a spell around. */
export interface SpellCore {
  readonly id: string;
  readonly arena: SpellArena;
  readonly agency: SpellAgency;
  /** Inclusive tier-index window [min, max] (0 = tier 1). */
  readonly tiers: readonly [number, number];
  /** The themes it fits (hard). Null = any tradition. */
  readonly themes: readonly SpellTheme[] | null;
  /** Spheres it fits, each with its sphere-specific argument. */
  readonly spheres: Readonly<Partial<Record<SphereName, string | true>>>;
  /** Carried riders it may take (at most one, same arena, same Reach — THR-1232). */
  readonly riders: readonly string[];
  /** Authored flavour lines (envelope rule 8), each naming the theme family it suits. */
  readonly flavours: readonly { readonly themes: readonly SpellTheme[] | null; readonly text: string }[];
  /** A deliberate core's cast lines; `{actor}` / `{target}` stay for cast time, `{blow}` fills now. */
  readonly castProse?: { readonly landed: string; readonly fizzled: string };
  build(c: CoreContext): CoreBuild;
}

/** On a generated spell's definition node only. Read by the sheet, the debug bridge and the gate test. */
export interface GeneratedSpellProvenance {
  readonly traditionId: string;
  readonly coreId: string;
  /** Which of the core's authored lines fired. */
  readonly flavourIndex: number;
  readonly riderId?: string;
  readonly priceLayer: SpellPriceLayer;
  /** Re-running the generator with this key reproduces the spell. */
  readonly seedKey: string;
  /** Indexes into `passiveEffects` that are the price, not the boon. */
  readonly catchIndexes: readonly number[];
  readonly rerolls: number;
  /** A transgression spell's notice: who notices it, and how strongly. */
  readonly notice?: SpellNotice;
}

/** A transgression's notice (Lane decision 5) — placed as a `forbidden_contact` hidden mark. */
export interface SpellNotice {
  readonly severity: number;
  readonly revealFamilies: readonly string[];
}

/** One generator request: a tradition, a tier and a slot of its library. */
export interface SpellGenRequest {
  readonly worldSeed: number;
  readonly traditionId: string;
  readonly tier: SpellGenTier;
  readonly slot: number;
  readonly agency: SpellAgency;
  readonly arena: SpellArena;
  /** Reroll counter, appended to the seed key as `:r<k>`. */
  readonly reroll?: number;
  /** Spells already built on each core in this world (`SPELL_GEN_CORE_REPEAT_DECAY`). */
  readonly coreUse?: ReadonlyMap<string, number>;
  /** Names already in this world (no collisions). */
  readonly usedNames?: ReadonlySet<string>;
  /** Force a price layer — the soul-drain budget's reroll to strain. */
  readonly priceLayer?: SpellPriceLayer;
}

/** A generated spell: the template the engine reads, plus its provenance. */
export interface GeneratedSpell {
  readonly template: SpellTemplate;
  readonly provenance: GeneratedSpellProvenance;
  readonly sphere: SphereName;
}
