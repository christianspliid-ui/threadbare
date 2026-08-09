/**
 * The Package View's block renderers — THR-1046.
 *
 * One component per composition block, each drawing a slice of the model
 * `buildEncounterPackage` produced. Split from the viewer so the page's
 * composition (which blocks, in what order, one or six across) stays readable
 * apart from how any one block draws (Law 33's modularization clause).
 *
 * **This is a designer surface, and it says so.** Ids, tags and raw difficulty
 * numbers are the *subject* here, not leakage — the Law 13/14 trace-and-designer
 * carve-out, granted explicitly by THR-1046. Two rules survive the carve-out and
 * are held below: a magnitude that has a player-facing word shows **both** (the
 * word first, the number as annotation), because the point of the surface is
 * seeing what the player will see; and every concept still carries its image,
 * tooltip and link (Law 1), because this is also where Law 1 gaps become visible.
 */

import { useState, type ReactNode } from 'react';
import { EntityVisual } from '../../shared/EntityVisual';
import { Tooltip } from '../../shared/Tooltip';
import { SphereIcon } from '../../shared/SphereIcon';
import { RarityBadge } from '../../shared/RarityBadge';
import { ReachIcon } from '../../icons';
import { NudgeCard } from '../../Game/encounter-stage/shells/NudgePhaseShell';
import { gradientIndexForId } from '../../../data/entity-visual-fallbacks';
import type { RarityTier } from '../../../types/rarity';
import type {
  EncounterPackage,
  PackageAftermathVariant,
  PackageCard,
  PackageCastMember,
  PackageImage,
  PackagePlace,
  PackageReward,
  PackageSeed,
  PackageStep,
  PackageVerdict,
} from './buildEncounterPackage';
import { AFTERMATH_BANDS } from './buildEncounterPackage';

// ── Constants (NFP #1) ───────────────────────────────────────────────

/** Reach chip edge on this surface. One notch below the stage's 34px. */
const REACH_ICON_PX = 24;
const SPHERE_ICON_PX = 14;
/** Thumbnail edge in the image-manifest table. */
const IMAGE_THUMB_PX = 64;

/** Blocks whose bodies start collapsed — the long tails a reviewer opens on demand. */
const COLLAPSED_BY_DEFAULT: ReadonlySet<string> = new Set(['Images', 'Aftermath endings']);

// ── Shared bits ──────────────────────────────────────────────────────

/**
 * A labelled block with a collapse toggle and a count on its header.
 *
 * Law 36: the package is a long list of long lists, so it groups and collapses
 * rather than making a reviewer scroll past a block they are not reading. Law 25:
 * the toggle is a real control with a real effect, never a decorative caret.
 */
export function Block({
  title,
  count,
  tone = 'neutral',
  children,
}: {
  title: string;
  count?: number;
  tone?: 'neutral' | 'warn';
  children: ReactNode;
}) {
  const [open, setOpen] = useState(!COLLAPSED_BY_DEFAULT.has(title));
  return (
    <section className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="focus-ring flex items-center gap-2 text-left"
        style={{
          padding: '4px 2px',
          background: 'transparent',
          borderBottom: '1px solid var(--border-subtle)',
          cursor: 'pointer',
        }}
      >
        <span aria-hidden="true" style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
          {open ? '▾' : '▸'}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '0.7rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: tone === 'warn' ? 'var(--negative)' : 'var(--accent-gold)',
          }}
        >
          {title}
        </span>
        {count !== undefined && (
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{count}</span>
        )}
      </button>
      {open && <div className="flex flex-col gap-2">{children}</div>}
    </section>
  );
}

/**
 * Authored prose, with its placeholder slots drawn as slots.
 *
 * The package shows prose **un-enriched** on purpose — the authored string is what
 * a designer is reviewing, and a resolved `{they}` would hide whether the author
 * wrote a token at all. But an un-enriched string puts raw `{frag:opening}` and
 * `{cast:keeper}` on screen, which reads as the Law 43 defect (a leaked
 * placeholder) rather than as the authored value it is. So the tokens are chipped:
 * visibly a slot, hoverable for what fills it, and impossible to mistake for
 * prose. Law 43 is not weakened — it governs player-facing strings, and this
 * surface is neither player-facing nor pretending the token is words.
 */
export function AuthoredProse({
  text,
  size = 'sm',
}: {
  text: string;
  size?: 'sm' | 'xs';
}) {
  // Split on balanced single-brace tokens; the capture group keeps them in the
  // output array so the slots can be wrapped in place.
  const parts = text.split(/(\{[^{}]+\})/g);
  return (
    <p
      className={size === 'sm' ? 'text-sm' : 'text-xs'}
      style={{
        margin: 0,
        fontFamily: 'Georgia, serif',
        lineHeight: 1.6,
        color: 'var(--text-primary)',
      }}
    >
      {parts.map((part, i) =>
        part.startsWith('{') && part.endsWith('}') ? (
          <Tooltip
            key={i}
            label="Authored slot"
            desc="A placeholder the enrichment layer fills at render — a fragment, a cast name, or a pronoun. Shown raw here because the authored string is what this page reviews."
          >
            <span
              style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '0.85em',
                color: 'var(--accent-gold)',
                background: 'var(--accent-gold-glow)',
                border: '1px solid var(--accent-gold-dim)',
                borderRadius: 3,
                padding: '0 3px',
              }}
            >
              {part}
            </span>
          </Tooltip>
        ) : (
          part
        ),
      )}
    </p>
  );
}

/** Nothing authored here. A designed empty state, never a blank (Law 4). */
export function Empty({ what }: { what: string }) {
  return (
    <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>
      No {what} authored.
    </p>
  );
}

/** A monospace id. On a designer surface the id is the subject, so it is styled as one. */
export function Id({ children }: { children: ReactNode }) {
  return (
    <code
      className="font-mono"
      style={{
        fontSize: 'var(--text-xs)',
        color: 'var(--text-secondary)',
        background: 'var(--bg-raised)',
        borderRadius: 3,
        padding: '1px 4px',
      }}
    >
      {children}
    </code>
  );
}

/** Pass / fail pill. Polarity carries a word as well as a hue (Law 31). */
export function Verdict({ pass, label }: { pass: boolean; label?: string }) {
  return (
    <span
      className="text-xs px-1.5 py-0.5 rounded"
      style={{
        color: pass ? 'var(--positive)' : 'var(--negative)',
        background: pass ? 'rgba(74, 222, 128, 0.1)' : 'rgba(248, 113, 113, 0.1)',
        border: `1px solid ${pass ? 'var(--positive)' : 'var(--negative)'}`,
      }}
    >
      {label ?? (pass ? 'pass' : 'fail')}
    </span>
  );
}

/** The reach, with its icon and its tooltip (Laws 1, 9, 17). */
export function ReachChip({ reach }: { reach: string }) {
  return (
    <Tooltip id={`reach.${reach}`}>
      <span className="inline-flex items-center gap-1.5">
        <ReachIcon reach={reach as never} size={REACH_ICON_PX} />
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{reach}</span>
      </span>
    </Tooltip>
  );
}

// ── Identity ─────────────────────────────────────────────────────────

export function PackageHeader({ pkg }: { pkg: EncounterPackage }) {
  return (
    <header className="flex items-start gap-3">
      {/* The scene's own art, at the one hero aspect (Law 5). Absent art lands on
          the designed gradient fallback rather than a hole (Law 4). */}
      <EntityVisual
        size="hero"
        shape="rounded"
        descriptor={{
          tier: pkg.illustration.path ? 'art' : 'fallback',
          ...(pkg.illustration.path ? { src: pkg.illustration.path } : {}),
          glyph: '◈',
          gradientIndex: gradientIndexForId(pkg.templateId),
          alt: pkg.name,
          kind: 'encounter',
        }}
        style={{ width: 168, flexShrink: 0 }}
      />
      <div className="flex flex-col gap-1 min-w-0">
        <h3
          className="text-base font-semibold"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--accent-gold)' }}
        >
          {pkg.spellName ?? pkg.name}
        </h3>
        {pkg.spellName && (
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            {pkg.name}
          </span>
        )}
        <div className="flex items-center gap-2 flex-wrap">
          <ReachChip reach={pkg.reach} />
          <RarityBadge tier={pkg.rarityTier as RarityTier} />
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
            {pkg.intrinsicTier} · {pkg.scale}
          </span>
        </div>
        <Id>{pkg.templateId}</Id>
        {pkg.settings.length > 0 ? (
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            envelope: {pkg.settings.join(', ')}
          </span>
        ) : (
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--negative)' }}>
            no setting envelope declared
          </span>
        )}
      </div>
    </header>
  );
}

// ── Verdict ──────────────────────────────────────────────────────────

export function VerdictBlock({ verdict }: { verdict: PackageVerdict }) {
  const failing = verdict.blocks.filter((b) => !b.pass);
  return (
    <Block title="Composition contract" count={failing.length} tone={failing.length > 0 ? 'warn' : 'neutral'}>
      <div className="flex items-center gap-2 flex-wrap">
        <Verdict pass={verdict.pass} label={verdict.pass ? 'composition-complete' : `${failing.length} blocks failing`} />
        {verdict.retrofitPending && (
          <Tooltip
            label="Retrofit pending"
            desc="This template predates the Composition Contract. Its failures do not fail CI yet; the ratchet only ever shrinks."
          >
            <span
              className="text-xs px-1.5 py-0.5 rounded"
              style={{
                color: 'var(--accent-gold)',
                background: 'var(--accent-gold-glow)',
                border: '1px solid var(--accent-gold-dim)',
              }}
            >
              retrofit pending
            </span>
          </Tooltip>
        )}
      </div>
      <div className="flex flex-col gap-1">
        {verdict.blocks.map((block) => (
          <div key={block.block} className="flex items-start gap-2">
            <span style={{ minWidth: 86 }}>
              <Verdict pass={block.pass} label={block.block} />
            </span>
            <div className="flex flex-col gap-0.5 min-w-0">
              {block.messages.map((message, i) => (
                <span key={i} style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                  {message}
                </span>
              ))}
              {block.planSection && (
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                  {block.planSection}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </Block>
  );
}

// ── Openings ─────────────────────────────────────────────────────────

export function OpeningsBlock({ pkg }: { pkg: EncounterPackage }) {
  return (
    <Block title="Openings" count={pkg.openings.length}>
      {pkg.openings.length === 0 && <Empty what="openings" />}
      {pkg.openings.map((opening) => (
        <div key={opening.settingClass} className="flex flex-col gap-1">
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
            {opening.settingClass}
          </span>
          <AuthoredProse text={opening.text} />
        </div>
      ))}
    </Block>
  );
}

// ── Steps ────────────────────────────────────────────────────────────

export function StepsBlock({ steps }: { steps: readonly PackageStep[] }) {
  return (
    <Block title="Steps" count={steps.length}>
      {steps.length === 0 && <Empty what="steps" />}
      {steps.map((step) => (
        <StepPanel key={step.index} step={step} />
      ))}
    </Block>
  );
}

function StepPanel({ step }: { step: PackageStep }) {
  return (
    <div
      className="flex flex-col gap-2 rounded p-2"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
    >
      <div className="flex items-center gap-3 flex-wrap">
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
          step {step.index}
        </span>
        <ReachChip reach={step.reach} />
        {/* Word first, number as the designer annotation — the carve-out does not
            remove the word, it adds the number beside it. */}
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
          {step.difficultyWord}
          <span style={{ color: 'var(--text-muted)' }}> · {step.difficulty}</span>
        </span>
        {step.purposeLine && (
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)' }}>
            “{step.purposeLine}”
          </span>
        )}
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
          {step.failBehavior}
        </span>
      </div>

      {step.branch && (
        <p className="text-xs" style={{ margin: 0, color: 'var(--text-secondary)' }}>
          Fork on step {step.branch.onStep}
          {step.branch.decidedBy ? ` · decided by ${step.branch.decidedBy}` : ' · decided by recorded choice'}
          {step.branch.variantKeys.length > 0 && ` · ${step.branch.variantKeys.join(' / ')}`}
        </p>
      )}

      {step.narrative && <AuthoredProse text={step.narrative} />}

      {step.factorLines.length > 0 && (
        <div className="flex flex-col gap-0.5">
          {step.factorLines.map((line, i) => (
            <span
              key={i}
              style={{
                fontSize: 'var(--text-xs)',
                color: line.polarity === 'for' ? 'var(--positive)' : 'var(--negative)',
              }}
            >
              {line.polarity === 'for' ? '＋' : '−'} {line.text}
            </span>
          ))}
        </div>
      )}

      {/* Afterimages: the whole band set side by side, which is the thing no
          single playthrough can show. An unauthored band says so — that gap is
          what the reviewer is here to find. */}
      <div className="flex flex-col gap-1">
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
          afterimages
        </span>
        {step.afterimages.map((after) => (
          <div key={after.band} className="flex items-start gap-2">
            <span
              style={{
                minWidth: 118,
                flexShrink: 0,
                fontSize: 'var(--text-xs)',
                color: after.authored ? 'var(--text-tertiary)' : 'var(--negative)',
              }}
            >
              {after.band}
            </span>
            <span
              style={{
                fontSize: 'var(--text-xs)',
                lineHeight: 1.5,
                color: after.authored ? 'var(--text-secondary)' : 'var(--text-muted)',
                fontStyle: after.authored ? undefined : 'italic',
              }}
            >
              {after.text ?? 'unauthored — falls back to the success or failure line'}
            </span>
          </div>
        ))}
      </div>

      {step.cards.length > 0 ? <HandRow cards={step.cards} /> : <Empty what="nudge hand" />}
    </div>
  );
}

/**
 * The step's hand, drawn with the stage's own card row.
 *
 * Reuse rather than re-render (Law 27): a second card implementation here would
 * let the designer surface and the player stage disagree about the very thing the
 * surface exists to review. The row scrolls on its own axis, never the page
 * (Law 33).
 */
function HandRow({ cards }: { cards: readonly PackageCard[] }) {
  return (
    <div className="flex flex-col gap-1">
      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
        the hand — {cards.length} cards
      </span>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {cards.map((card) => (
          <div key={card.model.id} className="flex flex-col gap-1" style={{ flexShrink: 0 }}>
            <NudgeCard
              card={{ ...card.model, selected: false, interactive: false }}
              designerView
              onToggle={() => undefined}
            />
            <div className="flex flex-col gap-0.5" style={{ width: 210 }}>
              {card.libraryCardId && <Id>{card.libraryCardId}</Id>}
              {card.sphere && (
                <span className="inline-flex items-center gap-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                  <SphereIcon sphere={card.sphere} size={SPHERE_ICON_PX} />
                  {card.sphere}
                </span>
              )}
              {card.gates.map((gate) => (
                <span key={gate} style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                  gate · {gate}
                </span>
              ))}
              {card.lean && (
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                  leans {card.lean}
                </span>
              )}
              {card.grants.length > 0 && (
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-gold)' }}>
                  grants {card.grants.map((g) => g.kind).join(', ')}
                </span>
              )}
              {card.bandProse.length > 0 && (
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                  band prose · {card.bandProse.length}
                </span>
              )}
              {card.art.tagMissed && (
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--negative)' }}>
                  tag missed the manifest → {card.art.source}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Cast ─────────────────────────────────────────────────────────────

export function CastBlock({
  cast,
  places,
}: {
  cast: readonly PackageCastMember[];
  places: readonly PackagePlace[];
}) {
  return (
    <Block title="Cast and places" count={cast.length + places.length}>
      {cast.length === 0 && places.length === 0 && <Empty what="support bundle" />}
      <div className="flex gap-3 flex-wrap">
        {cast.map((member) => (
          <div key={member.key} className="flex items-start gap-2" style={{ maxWidth: 260 }}>
            {/* A person renders at the portrait aspect (Law 5). No graph here, so
                the descriptor is the designed fallback rather than a wrong tile. */}
            <EntityVisual
              size="portrait"
              shape="rounded"
              descriptor={{
                tier: 'fallback',
                glyph: '☖',
                gradientIndex: gradientIndexForId(member.key),
                alt: member.spawnName ?? member.supportRole,
                kind: 'agent',
              }}
              style={{ width: 54, flexShrink: 0 }}
            />
            <div className="flex flex-col gap-0.5 min-w-0">
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
                {member.spawnName ?? member.supportRole}
              </span>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                {member.supportRole} · {member.spawnNpcRole}
              </span>
              <Id>{member.key}</Id>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                {member.delivery} · {member.persistence}
              </span>
              {member.factionDefId && (
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                  faction · {member.factionDefId}
                </span>
              )}
              {member.defaulted && (
                <Tooltip
                  label="Family default"
                  desc="This binding comes from the family or setting default, not from the template. The person spawns and persists — but nobody wrote this scene's version of them."
                >
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-gold)' }}>
                    family default
                  </span>
                </Tooltip>
              )}
            </div>
          </div>
        ))}
      </div>
      {places.length > 0 && (
        <div className="flex flex-col gap-1">
          {places.map((place) => (
            <span key={place.key} style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              place · {place.fallbackName ?? place.sublocationTypeId} ({place.delivery} · {place.persistence})
            </span>
          ))}
        </div>
      )}
    </Block>
  );
}

// ── Rewards ──────────────────────────────────────────────────────────

export function RewardsBlock({
  rewards,
  persistentEffects,
}: {
  rewards: readonly PackageReward[];
  persistentEffects: readonly { readonly kind: string; readonly where: string }[];
}) {
  return (
    <Block title="Rewards and lasting change" count={rewards.length + persistentEffects.length}>
      {rewards.length === 0 && persistentEffects.length === 0 && (
        <Empty what="reward pool or persistent consequence" />
      )}
      {rewards.map((reward) => (
        <div key={reward.where} className="flex flex-col gap-0.5">
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
            {reward.where}
          </span>
          <div className="flex gap-2 flex-wrap">
            {reward.categories.map((category) => (
              <span
                key={category.category}
                className="text-xs px-1.5 py-0.5 rounded"
                style={{ background: 'var(--bg-raised)', color: 'var(--text-secondary)' }}
              >
                {category.category} · {category.weight}
              </span>
            ))}
          </div>
          {reward.recipe.tagFilters && reward.recipe.tagFilters.length > 0 && (
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              tags · {reward.recipe.tagFilters.join(', ')}
            </span>
          )}
        </div>
      ))}
      {persistentEffects.length > 0 && (
        <div className="flex flex-col gap-0.5">
          {persistentEffects.map((effect, i) => (
            <span key={i} style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              {effect.kind} <span style={{ color: 'var(--text-muted)' }}>at {effect.where}</span>
            </span>
          ))}
        </div>
      )}
    </Block>
  );
}

// ── Aftermath ────────────────────────────────────────────────────────

export function AftermathBlock({ variants }: { variants: readonly PackageAftermathVariant[] }) {
  const authored = variants.reduce((sum, v) => sum + v.authoredBandCount, 0);
  return (
    <Block title="Aftermath endings" count={authored}>
      {variants.length === 0 && <Empty what="aftermath" />}
      {variants.map((variant) => (
        <div key={variant.key} className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
              variant
            </span>
            <Id>{variant.key}</Id>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              {variant.authoredBandCount} of {AFTERMATH_BANDS.length} bands authored
            </span>
          </div>
          {variant.overview
            ? <AuthoredProse text={variant.overview} />
            : <Empty what="base overview" />}
          {variant.changes.map((change) => (
            <span key={change.id} style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--text-primary)' }}>{change.title}</strong> — {change.detail}
              <span style={{ color: 'var(--text-muted)' }}> ({change.kind} · {change.polarity})</span>
            </span>
          ))}
          {variant.reactions.length > 0 && (
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              reactions · {variant.reactions.map((r) => r.label).join(' / ')}
            </span>
          )}
          {/* The band matrix. Every band gets a row whether or not it is authored:
              an ending nobody wrote is invisible in play and is exactly what this
              surface is for (ruling 7's floor is checkable from here). */}
          <div className="flex flex-col gap-1 pl-2" style={{ borderLeft: '1px solid var(--border-subtle)' }}>
            {variant.bands.map((band) => (
              <div key={band.band} className="flex items-start gap-2">
                <span
                  style={{
                    minWidth: 118,
                    flexShrink: 0,
                    fontSize: 'var(--text-xs)',
                    color: band.authored ? 'var(--accent-gold)' : 'var(--text-muted)',
                  }}
                >
                  {band.band}
                </span>
                <div className="flex flex-col gap-0.5 min-w-0">
                  {band.authored ? (
                    <>
                      {band.overview && (
                        <span style={{ fontSize: 'var(--text-xs)', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                          {band.overview}
                        </span>
                      )}
                      {band.changes.map((change) => (
                        <span key={change.id} style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                          {change.title} — {change.detail}
                        </span>
                      ))}
                      {band.reactions.length > 0 && (
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                          reactions · {band.reactions.map((r) => r.label).join(' / ')}
                        </span>
                      )}
                    </>
                  ) : (
                    <span style={{ fontSize: 'var(--text-xs)', fontStyle: 'italic', color: 'var(--text-muted)' }}>
                      unauthored — resolves to the base ending above
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </Block>
  );
}

// ── Seeds ────────────────────────────────────────────────────────────

export function SeedsBlock({
  seeds,
  onOpenTemplate,
}: {
  seeds: readonly PackageSeed[];
  onOpenTemplate: (templateId: string) => void;
}) {
  return (
    <Block title="Seeds" count={seeds.length}>
      {seeds.length === 0 && <Empty what="encounter seeds" />}
      {seeds.map((seed, i) => (
        <div key={`${seed.seedLabel}-${i}`} className="flex flex-col gap-0.5">
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
            {seed.seedLabel}
          </span>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
            planted at {seed.where} · after {seed.delayTicks} ticks
            {seed.inheritContext && ' · inherits the scene'}
          </span>
          {/* Law 21: the target encounter has a page — this one — so the name is a
              real link to it, not styled text pretending to be one. */}
          {seed.templateId && seed.targetName && (
            <button
              type="button"
              onClick={() => onOpenTemplate(seed.templateId as string)}
              className="focus-ring text-left"
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--accent-gold)',
                background: 'transparent',
                textDecoration: 'underline',
                cursor: 'pointer',
                width: 'fit-content',
              }}
            >
              grows into {seed.targetName} ↗
            </button>
          )}
          {seed.targetMissing && (
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--negative)' }}>
              names {seed.templateId}, which is not a live template — this seed grows nothing
            </span>
          )}
          {!seed.templateId && seed.encounterFamily && (
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              draws from the {seed.encounterFamily} family
            </span>
          )}
        </div>
      ))}
    </Block>
  );
}

// ── Images ───────────────────────────────────────────────────────────

export function ImagesBlock({ images }: { images: readonly PackageImage[] }) {
  const missed = images.filter((image) => image.tagMissed).length;
  return (
    <Block title="Images" count={images.length} tone={missed > 0 ? 'warn' : 'neutral'}>
      {images.length === 0 && <Empty what="image references" />}
      <div className="flex flex-wrap gap-2">
        {images.map((image, i) => (
          <div key={`${image.where}-${i}`} className="flex flex-col gap-0.5" style={{ width: 150 }}>
            <EntityVisual
              size="hero"
              shape="rounded"
              descriptor={{
                tier: image.path ? 'art' : 'fallback',
                ...(image.path ? { src: image.path } : {}),
                glyph: '◇',
                gradientIndex: gradientIndexForId(image.where),
                alt: image.where,
                kind: 'encounter',
              }}
              style={{ width: '100%', height: IMAGE_THUMB_PX, aspectRatio: 'auto' }}
            />
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              {image.where}
            </span>
            {image.tag && <Id>{image.tag}</Id>}
            <span
              style={{
                fontSize: 'var(--text-xs)',
                color: image.tagMissed ? 'var(--negative)' : 'var(--text-muted)',
              }}
            >
              {image.source}
            </span>
          </div>
        ))}
      </div>
    </Block>
  );
}

// ── Systems ──────────────────────────────────────────────────────────

export function SystemsBlock({ pkg }: { pkg: EncounterPackage }) {
  return (
    <Block title="Systems connected" count={pkg.systems.length}>
      {pkg.systems.length === 0 ? (
        <Empty what="game-system connections" />
      ) : (
        <div className="flex gap-2 flex-wrap">
          {pkg.systems.map((system) => (
            <span
              key={system}
              className="text-xs px-1.5 py-0.5 rounded"
              style={{
                background: 'var(--accent-gold-glow)',
                color: 'var(--accent-gold)',
                border: '1px solid var(--accent-gold-dim)',
              }}
            >
              {system}
            </span>
          ))}
        </div>
      )}
    </Block>
  );
}
