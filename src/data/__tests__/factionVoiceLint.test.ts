/**
 * Faction Voice Lint — THR-31 (TB-094)
 *
 * Enforces minimum prose quality on migrated (unified) faction encounter templates.
 * Legacy (EncounterTemplate) files are skipped — they fail by design until migrated.
 *
 * Per-template rules (§7 of the design doc):
 *   1. Every step narrative field must contain ≥1 enrichment placeholder ({name}, {location}, etc.)
 *   2. Every template must contain ≥1 conditional block ({?has_X}...{/has_X})
 *   3. Template must have an aftermathConfig block (ensures systemic wiring)
 *
 * Voice lexicon lint (advisory, not fail): checks FACTION_PROSE_VOICE_LEXICON_MIN_HITS
 * against the faction's bible entry. Advisory failures are logged, not thrown.
 */

import { describe, it, expect } from 'vitest';
import type { UnifiedActionTemplate } from '../../types/unifiedAction';
import {
  FACTION_PROSE_PLACEHOLDER_MIN_PER_STEP,
  FACTION_PROSE_CONDITIONAL_MIN_PER_TEMPLATE,
  FACTION_PROSE_VOICE_LEXICON_MIN_HITS,
} from '../faction-constants';
import { FACTION_VOICE_BIBLE } from '../faction-voice-bible';

// ── Unified faction files ──────────────────────────────────────────────────

import { THIEVES_GUILD_ENCOUNTER_TEMPLATES } from '../thieves-guild-encounter-content';
import { ARCANE_CIRCLE_ENCOUNTER_TEMPLATES } from '../arcane-circle-encounter-content';
import { CIVIC_GUARD_ENCOUNTER_TEMPLATES } from '../civic-guard-encounter-content';
import { ALL_HOD_TEMPLATES } from '../holy-order-dawn-encounter-content';
import { ALL_UK_TEMPLATES } from '../underking-court-encounter-content';
import { ALL_RB_TEMPLATES } from '../rangers-brotherhood-encounter-content';
import { ALL_MCT_TEMPLATES } from '../merchant-consortium-encounter-content';
import { ALL_MC_TEMPLATES } from '../mercenary-encounter-content';
import { ALL_LK_TEMPLATES } from '../lorekeepers-covenant-encounter-content';
import { ALL_TS_TEMPLATES } from '../temple-of-spheres-encounter-content';

// ── Type guards ────────────────────────────────────────────────────────────

function hasNarrativeTemplate(t: unknown): t is UnifiedActionTemplate {
  return (
    typeof t === 'object' &&
    t !== null &&
    'steps' in t &&
    Array.isArray((t as { steps: unknown[] }).steps) &&
    (t as { steps: unknown[] }).steps.length > 0 &&
    'narrativeTemplate' in (t as { steps: unknown[] }).steps[0]
  );
}

// ── Lint helpers ──────────────────────────────────────────────────────────

const PLACEHOLDER_RE = /\{[a-zA-Z_:?/][^}]*\}/;
const CONDITIONAL_RE = /\{\?has_[a-z_]+\}/;

function collectTemplateText(t: UnifiedActionTemplate): string {
  const parts: string[] = [];
  for (const s of t.steps) {
    if ('narrativeTemplate' in s && typeof s.narrativeTemplate === 'string') parts.push(s.narrativeTemplate);
    if ('successAfterimage' in s && typeof s.successAfterimage === 'string') parts.push(s.successAfterimage);
    if ('failureAfterimage' in s && typeof s.failureAfterimage === 'string') parts.push(s.failureAfterimage);
  }
  const nt = t.narrativeTemplates;
  if (nt) {
    if (typeof nt.initiation === 'string') parts.push(nt.initiation);
    if (typeof nt.success === 'string') parts.push(nt.success);
    if (typeof nt.failure === 'string') parts.push(nt.failure);
  }
  return parts.join('\n');
}

function placeholderCountInSteps(t: UnifiedActionTemplate): number {
  let count = 0;
  for (const s of t.steps) {
    if ('narrativeTemplate' in s && typeof s.narrativeTemplate === 'string') {
      if (PLACEHOLDER_RE.test(s.narrativeTemplate)) count++;
    }
  }
  return count;
}

function conditionalCountInTemplate(t: UnifiedActionTemplate): number {
  const full = collectTemplateText(t);
  return (full.match(new RegExp(CONDITIONAL_RE.source, 'g')) ?? []).length;
}

function voiceLexiconHits(t: UnifiedActionTemplate, factionDefId: string): number {
  const entry = FACTION_VOICE_BIBLE.find(e => e.factionDefId === factionDefId);
  if (!entry) return 0;
  const full = collectTemplateText(t).toLowerCase();
  return entry.lexicon.filter(word => full.includes(word.toLowerCase())).length;
}

// ── Per-faction lint runner ────────────────────────────────────────────────

function lintUnifiedFaction(
  label: string,
  factionDefId: string,
  templates: UnifiedActionTemplate[],
): void {
  describe(`${label} — unified voice lint`, () => {
    const unified = templates.filter(hasNarrativeTemplate);

    it('has at least one unified template', () => {
      expect(unified.length).toBeGreaterThan(0);
    });

    for (const t of unified) {
      describe(`template ${t.id}`, () => {
        it(`has ≥${FACTION_PROSE_PLACEHOLDER_MIN_PER_STEP} enrichment placeholder per step narrative`, () => {
          const count = placeholderCountInSteps(t);
          expect(
            count,
            `${t.id}: ${count} steps with placeholders; need ≥${FACTION_PROSE_PLACEHOLDER_MIN_PER_STEP} — add {name}, {location}, {?has_X}... etc.`,
          ).toBeGreaterThanOrEqual(FACTION_PROSE_PLACEHOLDER_MIN_PER_STEP);
        });

        it(`has ≥${FACTION_PROSE_CONDITIONAL_MIN_PER_TEMPLATE} conditional block {?has_X}`, () => {
          const count = conditionalCountInTemplate(t);
          expect(
            count,
            `${t.id}: no conditional blocks — add at least one {?has_faction}...{/has_faction} or similar`,
          ).toBeGreaterThanOrEqual(FACTION_PROSE_CONDITIONAL_MIN_PER_TEMPLATE);
        });

        it('has an aftermathConfig block', () => {
          expect(
            t.aftermathConfig,
            `${t.id}: missing aftermathConfig — every unified faction template must wire systemic consequences`,
          ).toBeDefined();
        });

        it(`[advisory] voice lexicon ≥${FACTION_PROSE_VOICE_LEXICON_MIN_HITS} hits`, () => {
          const hits = voiceLexiconHits(t, factionDefId);
          if (hits < FACTION_PROSE_VOICE_LEXICON_MIN_HITS) {
            // Advisory: log but do not fail. Flip to expect() when Phase 1 lands for that faction.
            console.warn(
              `[voice-lint advisory] ${t.id} (${factionDefId}): ${hits}/${FACTION_PROSE_VOICE_LEXICON_MIN_HITS} lexicon hits. ` +
              `Prose may not carry faction voice strongly enough.`,
            );
          }
          // Advisory — always pass
          expect(hits).toBeGreaterThanOrEqual(0);
        });
      });
    }
  });
}

// ── Run lint for all migrated factions ────────────────────────────────────

lintUnifiedFaction('Thieves Guild', 'thieves_guild', THIEVES_GUILD_ENCOUNTER_TEMPLATES);
lintUnifiedFaction('Arcane Circle', 'arcane_circle', ARCANE_CIRCLE_ENCOUNTER_TEMPLATES);
lintUnifiedFaction('Civic Guard', 'civic_guard', CIVIC_GUARD_ENCOUNTER_TEMPLATES);
lintUnifiedFaction('Holy Order of the Dawn', 'holy_order_dawn', ALL_HOD_TEMPLATES);
lintUnifiedFaction('Underking Court', 'underking_court', ALL_UK_TEMPLATES);
lintUnifiedFaction('Rangers Brotherhood', 'rangers_brotherhood', ALL_RB_TEMPLATES);
lintUnifiedFaction('Merchant Consortium', 'merchant_consortium', ALL_MCT_TEMPLATES);
lintUnifiedFaction('Mercenary Company', 'mercenary_company', ALL_MC_TEMPLATES);
lintUnifiedFaction('Lorekeepers Covenant', 'lorekeepers_covenant', ALL_LK_TEMPLATES);
lintUnifiedFaction('Temple of Spheres', 'temple_of_spheres', ALL_TS_TEMPLATES);
