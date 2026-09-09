/**
 * CardFace — the one card face, shared by every card in the game (THR-1002).
 *
 * Christian's directive, 2026-08-06: *"players would expect the same type of
 * syntax and rough layout and language for all 'cards' in the game, despite them
 * working in different contexts and having different functions."* This primitive
 * is that sentence as code. The nudge card established the face (THR-775 WS2,
 * THR-890, THR-972); this file is that zone stack extracted **verbatim** so the
 * action card can render the same one instead of a second, divergent design.
 *
 * ─── The grammar this face enforces ───────────────────────────────
 *
 * The zone order is the reading order, and it is the same on every card:
 *
 *   1. Picture band — a small generic image saying what *kind* of thing this is
 *      (Law 7). Never a hero illustration; the scene's art is the scene's job.
 *   2. Chip row — the card's kind on the left in its own build-enforced
 *      vocabulary (Law 9); on the right the reach it leans on, the sphere mark,
 *      and the price as **framed** pips.
 *   3. Name — display font, gold when selected.
 *   4. Alternate cost channels — a price paid outside the essence pool says so.
 *   5. Provenance — delivered in parts, never as prose (Law 2).
 *   6. Effect line, then the odds reading.
 *   7. No prose. The foot is a spacer (Prose Doctrine v2 — the flavour quote is
 *      retired by name; see {@link CardFaceModel.effectLine}).
 *   8. A dimmed card always says why.
 *
 * **Two rules are load-bearing and easy to break by accident:**
 *
 * - **Law 13 — no numerals on the player surface.** Cost and odds are pips or
 *   words; every number lives behind {@link CardFaceModel.designerLine}, which
 *   the DebugPanel's designer-view toggle gates. A numeral that reaches this
 *   face is a bug, not a style choice.
 * - **Law 10 — price is framed, odds are not.** THR-972 directive 5: a card's
 *   essence *price* and its *odds* both rendered as small rows of repeated
 *   glyphs, so two vocabularies meaning opposite things were separated only by
 *   glyph shape at 12px. The frame around the price is what stops the two rows
 *   reading as the same signal. This is also why {@link CardFaceOdds} has two
 *   shapes rather than one: pips mean *movement of the odds*, which is what a
 *   nudge does. A cast does not move odds — it rolls them — so it reads its
 *   forecast as a **word**, never as pips. Do not reach for the pips because
 *   they are on the other card.
 *
 * ─── Why the model is this wide ───────────────────────────────────
 *
 * Every optional field is a zone one card kind has and another does not (a nudge
 * has a forecast delta and no rarity; a cast has rarity, a scale chip and an
 * upkeep channel). The alternative — a face per kind — is the thing this ticket
 * exists to delete. Different *fields* per context are expected; different
 * *grammar* is not.
 *
 * Plan: `Docs/plans/2026-09-09-thr-1002-card-grammar.md` § UI pillar.
 */

import type React from 'react';
import type { SphereName } from '../../types/index';
import type { ReachDomain } from '../../types/traits';
import type { RarityTier } from '../../types/rarity';
import type { ForecastTier } from '../../types/resolution';
import type { EntityVisualDescriptor } from './entityVisualResolver';
import { EntityVisual } from './EntityVisual';
import { Tooltip } from './Tooltip';
import { SphereIcon } from './SphereIcon';
import { ReachIcon } from '../icons';
import { CardKeywordChip } from './CardKeywordChip';
import { CostPips, OddsPips } from './OddsPips';
import { RarityBadge } from './RarityBadge';

// ── Design tokens (the veil's ceremonial palette — Law 30, THR-1010) ───────
// These name the same tokens `EncounterVeil.tsx` and `NudgePhaseShell.tsx` use;
// the values live in `index.css`.
const GOLD = 'var(--veil-gold)';
const TEXT_WARM = 'var(--veil-text-warm)';
const TEXT_WHISPER = 'var(--veil-text-whisper)';
const FONT_DISPLAY = "'Palatino Linotype', 'Book Antiqua', Palatino, serif";

/**
 * Forecast tier → the colour the word carries. Tier classes, not new colours.
 *
 * Moved here from `NudgePhaseShell` (THR-1002) so the test panel's forecast word
 * and the action card's both read one table — the plan's requirement that the
 * card's odds zone uses "the same tier word, same classifier, same colours the
 * test panel uses". Values are unchanged.
 *
 * Law 30 (THR-1031): the hues are `--veil-loss-rgb` / `--veil-gain-rgb`, the
 * same channels the veil composes with. Law 45 binds these because they colour
 * a **word**: `doomed` moved off a literal `#b91c1c`, which measured 3.05:1 on
 * `--veil-void` — below the 4.5:1 floor. Full loss red is 7.14:1 and makes the
 * ladder symmetric: perilous 0.85 → doomed 1.0 mirrors favorable 0.8 → fated 1.0,
 * so severity reads as intensity rather than as a different red.
 */
export const FORECAST_TIER_COLORS: Record<string, string> = {
  doomed: 'rgb(var(--veil-loss-rgb) / 1)',
  perilous: 'rgb(var(--veil-loss-rgb) / 0.85)',
  uncertain: 'rgb(var(--veil-gold-rgb) / 0.85)',
  favorable: 'rgb(var(--veil-gain-rgb) / 0.8)',
  fated: 'rgb(var(--veil-gain-rgb) / 1)',
};

// ── Card-row layout (THR-890) ──────────────────────────────────────
// The locked card format. Sizes are constants so re-proportioning the row is a
// number change (NFP #1), and they are *shared* so the two hands cannot drift.

/** Card width. Four fit the encounter stage's column at 1920×1080 without wrap. */
export const CARD_WIDTH_PX = 210;
/** Picture band height — "small generic image", not a hero illustration. */
export const CARD_PICTURE_BAND_PX = 78;
/**
 * Tallest a hand may grow. The viewport contract forbids page scroll, so this
 * caps the row rather than letting a tall card push the commit button below the
 * fold; the row itself scrolls horizontally.
 */
export const HAND_MAX_HEIGHT_PX = 460;

// ── Card glyph sizes (THR-972 directive 5) ─────────────────────────
// The director's find was that three glyph vocabularies were "quite small and
// difficult to read" at 13px and indistinguishable from one another. The
// *distinguishing* work is done by the framed price badge, not by size.

/** Sphere mark on the card's chip row. */
export const CARD_SPHERE_ICON_PX = 16;
/** Essence price glyphs, inside the framed badge. */
export const CARD_COST_PIP_PX = 14;
/** The card's odds contribution. */
export const CARD_ODDS_PIP_PX = 14;
/** Reach mark on the card's chip row — sized to sit level with the sphere mark. */
export const CARD_REACH_ICON_PX = 16;

// ── Model ──────────────────────────────────────────────────────────

/**
 * The card's odds reading.
 *
 * Two shapes, and the distinction is a Law 10 rule rather than a style
 * preference (see the file header): `delta` is *movement of the odds* and draws
 * pips; `forecast` is *where the odds stand* for a roll the card makes itself,
 * and draws the tier word. A card that rolls must never draw pips.
 */
export type CardFaceOdds =
  | { readonly kind: 'delta'; readonly value: number }
  | { readonly kind: 'forecast'; readonly tier: ForecastTier };

/** A price charged outside the essence pool. */
export interface CardFaceCostChannel {
  readonly id: string;
  readonly icon: string;
  /** Plain-language price — never a numeral. */
  readonly label: string;
  /**
   * Raw signed delta for the penalty-pip row, or `0` for a channel whose label
   * carries the whole reading (an upkeep band). Only a *worsening* delta earns
   * pips; relief is stated in the label alone rather than drawn as a price.
   */
  readonly delta: number;
}

/** Where a card came from, when that is worth saying. Parts, never a sentence. */
export interface CardFaceProvenance {
  readonly prefix: string;
  readonly conceptLabel?: string;
  /** Registry id for {@link conceptLabel} (e.g. `sphere.darkness`) — Law 17. */
  readonly conceptTooltipId?: string;
  readonly suffix?: string;
  /**
   * The whole line as flat text — the accessible name for a zone whose visible
   * content is split across a tooltip. Supplied by the producer, which already
   * assembles it from the parts by construction; the face does not re-derive it,
   * because a screen reader and a sighted reader must not be given two
   * independently-composed sentences.
   */
  readonly text: string;
}

/** One chip in the card's kind vocabulary. */
export interface CardFaceKeyword {
  readonly label: string;
  readonly icon?: string;
}

export interface CardFaceModel {
  readonly id: string;
  /**
   * `data-testid` stem — `nudge-card`, `action-card`. The face composes the
   * per-zone ids from it (`<prefix>-art-<id>`, `<prefix>-cost-<id>`, …), so each
   * card kind keeps the test handles its own suites already use.
   */
  readonly testIdPrefix: string;
  /** Extra `data-*` attributes on the button (state hooks the suites query). */
  readonly dataAttributes?: Readonly<Record<string, string>>;
  /** Zone 1. Pre-resolved: the face never runs a resolver. */
  readonly picture: EntityVisualDescriptor;
  /** Zone 2, left. Absent ⇒ the slot holds its ground so the price stays right-aligned. */
  readonly keyword?: CardFaceKeyword;
  /** A muted second chip for a context-specific kind fact (a cast's scale). */
  readonly secondaryKeyword?: CardFaceKeyword;
  readonly reach?: ReachDomain;
  readonly sphere?: SphereName;
  /** Effective essence price, after any discount. */
  readonly cost: number;
  /** Emphasise the price, as an unaffordable card does. */
  readonly costEmphasised?: boolean;
  /** Zone 4. */
  readonly costChannels?: readonly CardFaceCostChannel[];
  /** Zone 5. */
  readonly provenance?: CardFaceProvenance;
  /** Zone 3. */
  readonly name: string;
  /**
   * Wrap the name in a link to the concept's codex page (Law 21). Absent ⇒ the
   * name renders as text — *where a page exists*, never a dead link.
   */
  readonly onOpenName?: () => void;
  /**
   * Zone 6. The card's one line, in plain words.
   *
   * This is the only text on the face, and it is deliberately not prose: Prose
   * Doctrine v2 retired the flavour quote by name (THR-1224/THR-1225), so a card
   * says what it does and nothing else. A description, a flavour line or sphere
   * copy belongs on the codex page.
   */
  readonly effectLine: string;
  readonly odds: CardFaceOdds | null;
  readonly rarityTier?: RarityTier;
  /** Zone 8. Rendered only when {@link dimmed}. */
  readonly blockedReason?: string;
  /**
   * The fate word this card's action resolved to, worn on the face in the band's
   * accent (Laws 37/47) — the ending wears the chrome of the card that started it.
   */
  readonly resolvedBand?: { readonly word: string; readonly color: string };
  readonly selected: boolean;
  /** Dimmed: unavailable, but still says why (Law 25 — never inert and silent). */
  readonly dimmed: boolean;
  /** Clicking does nothing. */
  readonly disabled: boolean;
  /**
   * Designer view only — every numeral on the card lives here (Law 13).
   *
   * A node rather than a string so each card kind composes its own reading
   * (a nudge shows its delta, a cast its probability and effective difficulty)
   * without the face knowing either vocabulary.
   */
  readonly designerLine?: React.ReactNode;
}

// ── Component ──────────────────────────────────────────────────────

/**
 * The card is a button (Law 23) — a keyboard player must be able to see which
 * card is focused, and a card that cannot be played is `disabled` rather than
 * merely unresponsive.
 */
export function CardFace({
  model,
  designerView,
  onToggle,
}: {
  model: CardFaceModel;
  designerView: boolean;
  onToggle: () => void;
}) {
  const { id, testIdPrefix: p, dimmed } = model;

  return (
    <button
      type="button"
      className="focus-ring"
      data-testid={`${p}-${id}`}
      aria-pressed={model.selected}
      disabled={model.disabled}
      onClick={onToggle}
      {...(model.dataAttributes ?? {})}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: 0,
        width: CARD_WIDTH_PX,
        // The row does not wrap, so a card must hold its width rather than
        // compressing into illegibility as the hand grows.
        flexShrink: 0,
        padding: 0,
        textAlign: 'left',
        borderRadius: 10,
        overflow: 'hidden',
        background: model.selected
          ? 'rgb(var(--veil-gold-rgb) / 0.12)'
          : 'rgba(255, 255, 255, 0.02)',
        border: `1px solid ${model.selected ? GOLD : 'rgb(var(--veil-gold-rgb) / 0.18)'}`,
        boxShadow: model.selected ? `0 0 12px rgb(var(--veil-gold-rgb) / 0.22)` : undefined,
        opacity: dimmed ? 0.45 : 1,
        cursor: model.disabled ? 'not-allowed' : 'pointer',
        transition: 'opacity 0.2s ease, border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease',
      }}
    >
      {/* ── Picture band ──────────────────────────────────────────
          The descriptor arrives pre-resolved, so the fallback chain has already
          run at the producer. An unresolved art path ends at the EntityVisual
          gradient+glyph, which never blocks the render (plan fail-soft row); the
          glyph is the card's *keyword* glyph, so an artless card still shows the
          right kind of thing rather than a generic lozenge. The glyph also stays
          populated on the art tier because EntityVisual uses it as the `<img>`
          onError swap target. */}
      <EntityVisual
        size="hero"
        shape="rounded"
        data-testid={`${p}-art-${id}`}
        descriptor={model.picture}
        aria-label={model.name}
        style={{
          height: CARD_PICTURE_BAND_PX,
          aspectRatio: 'auto',
          borderRadius: 0,
          borderWidth: '0 0 1px 0',
        }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '10px 12px 12px', flex: 1 }}>
        {/* ── Kind chips + reach + sphere + price ──────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
          {/* A card with a second chip needs a grouping span; a card with one
              must NOT have it, because the nudge card's pinned DOM does not —
              the extraction's whole claim is that the nudge face did not move. */}
          {model.keyword && model.secondaryKeyword ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
              <CardKeywordChip
                keyword={model.keyword.label}
                icon={model.keyword.icon}
                muted={dimmed}
                data-testid={`${p}-keyword-${id}`}
              />
              <CardKeywordChip
                keyword={model.secondaryKeyword.label}
                icon={model.secondaryKeyword.icon}
                // The second chip is always muted: it is a refinement of the
                // first, and two chips at equal weight read as two kinds.
                muted
                data-testid={`${p}-scale-${id}`}
              />
            </span>
          ) : model.keyword ? (
            <CardKeywordChip
              keyword={model.keyword.label}
              icon={model.keyword.icon}
              muted={dimmed}
              data-testid={`${p}-keyword-${id}`}
            />
          ) : (
            // A one-off authored option is not in the library and prints no
            // keyword. The slot still holds its ground so the price stays right-
            // aligned across the row.
            <span />
          )}
          {/* THR-972 directive 5 — the sphere mark and the price are two
              different vocabularies sitting side by side, so they are sized to be
              read (not 13px) and the price is framed as a token. The frame is
              what stops the essence row and the odds row below from reading as
              the same kind of thing. */}
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            {model.reach && <ReachIcon reach={model.reach} size={CARD_REACH_ICON_PX} />}
            {model.sphere && <SphereIcon sphere={model.sphere} size={CARD_SPHERE_ICON_PX} />}
            <CostPips
              cost={model.cost}
              size={CARD_COST_PIP_PX}
              framed
              emphasised={model.costEmphasised ?? false}
              data-testid={`${p}-cost-${id}`}
            />
          </span>
        </div>

        {/* ── Title ───────────────────────────────────────────── */}
        {model.onOpenName ? (
          // Law 21: a named concept reaches its page. Rendered as a span with
          // button semantics rather than a nested <button>, which is invalid
          // inside the card's own button element.
          <span
            role="link"
            tabIndex={0}
            data-testid={`${p}-name-link-${id}`}
            onClick={(e) => {
              e.stopPropagation();
              model.onOpenName?.();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                model.onOpenName?.();
              }
            }}
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: 'var(--text-sm)',
              lineHeight: 1.25,
              color: model.selected ? GOLD : 'var(--veil-text-bright)',
              textDecoration: 'underline',
              textDecorationColor: 'rgb(var(--veil-gold-rgb) / 0.35)',
              textUnderlineOffset: 2,
              cursor: 'pointer',
            }}
          >
            {model.name}
          </span>
        ) : (
          <span
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: 'var(--text-sm)',
              lineHeight: 1.25,
              color: model.selected ? GOLD : 'var(--veil-text-bright)',
            }}
          >
            {model.name}
          </span>
        )}

        {/* ── Alternate costs — a card paid for outside the pool says so ── */}
        {model.costChannels && model.costChannels.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {model.costChannels.map((channel) => (
              <span
                key={channel.id}
                data-testid={`${p}-channel-${id}-${channel.id}`}
                style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 'var(--text-xs)', color: TEXT_WARM }}
              >
                <span aria-hidden="true">{channel.icon}</span>
                {channel.label}
                {/* Only a worsening delta earns penalty pips; relief is stated
                    in the label alone rather than drawn as a price. */}
                {channel.delta > 0 && <OddsPips value={-channel.delta} size={10} muted={dimmed} />}
              </span>
            ))}
          </div>
        )}

        {/* ── Provenance (THR-1247) ────────────────────────────
            Only a card that came from the god rather than the scene carries
            this. Set below the title and above the effect so the reading order is
            what it is / where it came from / what it does. Muted and small: it is
            an attribution, not a second effect line, and it must never compete
            with the card's own promise. */}
        {model.provenance && (
          <span
            data-testid={`${p}-provenance-${id}`}
            aria-label={model.provenance.text}
            style={{
              fontSize: 'var(--text-2xs, 11px)',
              lineHeight: 1.4,
              color: TEXT_WARM,
              opacity: 0.85,
            }}
          >
            {model.provenance.prefix}
            {model.provenance.conceptLabel && (
              <>
                {' — '}
                {/* Law 1 + 17: the concept named here carries its tooltip from
                    the one registry. The producer told us which word it is
                    (Law 2) — we do not go looking for it in the sentence. */}
                {model.provenance.conceptTooltipId ? (
                  <Tooltip id={model.provenance.conceptTooltipId}>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {model.provenance.conceptLabel}
                    </span>
                  </Tooltip>
                ) : (
                  model.provenance.conceptLabel
                )}
              </>
            )}
            {model.provenance.suffix && (
              <>{model.provenance.conceptLabel ? ' ' : ' — '}{model.provenance.suffix}</>
            )}
          </span>
        )}

        {/* ── Effect + its odds ────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 'var(--text-xs)', lineHeight: 1.5, color: TEXT_WHISPER }}>
            {model.effectLine}
          </span>
          {model.odds?.kind === 'delta' && (
            <OddsPips
              value={model.odds.value}
              size={CARD_ODDS_PIP_PX}
              muted={dimmed}
              data-testid={`${p}-odds-${id}`}
            />
          )}
          {model.odds?.kind === 'forecast' && (
            // Law 10: a card that *rolls* the odds reads them as a word. Pips
            // here would claim the card moves odds it only tests.
            <Tooltip id={`ui.forecast.${model.odds.tier}`}>
              <span
                data-testid={`${p}-forecast-${id}`}
                data-forecast-tier={model.odds.tier}
                aria-label={`Forecast: ${model.odds.tier}`}
                style={{
                  fontSize: 'var(--text-xs)',
                  fontFamily: FONT_DISPLAY,
                  letterSpacing: '0.02em',
                  color: FORECAST_TIER_COLORS[model.odds.tier] ?? TEXT_WARM,
                  opacity: dimmed ? 0.7 : 1,
                }}
              >
                {model.odds.tier}
              </span>
            </Tooltip>
          )}
        </div>

        {/* ── The flavor quote is retired (THR-1224) ───────────────
            Prose Doctrine v2 § *Retired by name* strikes "the flavor quote" from
            the authoring rules, so no card face draws prose. A card says what it
            does and nothing else: name, effect line, cost, odds.

            The `marginTop: auto` that used to seat the quote at the card's foot
            lives on the spacer below, so cards of different body lengths still
            align their footers across a row. */}
        <div style={{ marginTop: 'auto' }} />

        {/* ── Rarity ───────────────────────────────────────────
            Its own vocabulary (Law 9), seated in the footer so it annotates the
            card rather than competing with the kind chip. */}
        {model.rarityTier !== undefined && (
          <span data-testid={`${p}-rarity-${id}`} style={{ fontSize: 'var(--text-2xs, 11px)' }}>
            <RarityBadge tier={model.rarityTier} />
          </span>
        )}

        {/* ── The fate word, once the card's action has resolved ──
            Laws 37/47: the ending wears the chrome of the card that started it. */}
        {model.resolvedBand && (
          <span
            data-testid={`${p}-resolved-${id}`}
            data-resolved-band={model.resolvedBand.word}
            style={{
              fontSize: 'var(--text-xs)',
              fontFamily: FONT_DISPLAY,
              color: model.resolvedBand.color,
            }}
          >
            {model.resolvedBand.word}
          </span>
        )}

        {/* A dimmed card always says why. This is the whole reason an
            unaffordable card dims instead of hiding. */}
        {dimmed && model.blockedReason && (
          <span
            data-testid={`${p}-reason-${id}`}
            style={{ fontSize: 'var(--text-xs)', color: 'rgb(var(--veil-loss-rgb) / var(--veil-loss-text-alpha))' }}
          >
            {model.blockedReason}
          </span>
        )}

        {designerView && model.designerLine && (
          <span style={{ fontSize: 'var(--text-xs)', color: TEXT_WHISPER, fontFamily: 'monospace' }}>
            {model.designerLine}
          </span>
        )}
      </div>
    </button>
  );
}
