/**
 * PlaceOfPowerInspector — compact info panel shown inside LocationView when the
 * location's subtype is `place_of_power` (THR-153). Reports who holds the place,
 * what its stream gives and how long it has left, the god's two standing marks
 * on the holder, and the ruin it rose from.
 *
 * Data comes straight from graph properties and the incoming
 * `holds_place_of_power` edge. Fail-soft on missing fields — every clause is
 * gated by a local typeof check.
 *
 * ## THR-1104 — why this is prose and chips, not a label strip
 *
 * Until this ticket the whole panel was six `label / value` rows in a
 * `space-between` flex pair, which is Law 16 in its purest violation:
 * *"Key:value labels bolted onto prose are unfinished UX. Information reaches
 * the player woven into sentences or as designed chips — never as a debug-style
 * label strip."* THR-1080 had already cleaned the *values* inside those rows (a
 * per-tick rate, a tick countdown, a raw ruin node id); the row shape itself was
 * left as a separate defect class, and this is it.
 *
 * The reading is now three short sentences whose clauses vary independently, so
 * every combination of held/unclaimed × alive/dormant × known/unknown origin
 * stays grammatical without a template engine. The god's two marks became chips
 * rather than sentences because they are categorical standing states, not
 * narration — the mockup chip anatomy (a kind tag *plus* a sentence) is exactly
 * their shape.
 *
 * ## Entity presentation (Laws 1, 21, 22)
 *
 * - **Holder** — art via `EntityVisual` (Law 1's image half, one resolver per
 *   Law 3), name linked through the shared `NarrativeSegments` renderer so the
 *   link/tooltip/plain three-tier rules live in one place rather than being
 *   re-implemented here (Laws 3, 27).
 * - **The link is gated on `holderType === 'actor'`.** The edge schema allows
 *   `actor | god | faction`, but the only handler this panel is given opens the
 *   *agent* surface. Law 21: *"a wrong-kind link that opens the wrong drawer is
 *   a dead link that looks live"* — so a god or faction holder is named in plain
 *   styled text, fail-open, rather than linked somewhere it does not belong.
 * - **Origin ruin** — a ruin has no drawer of its own; its page is its place on
 *   the map, so it carries the sanctioned zoom-to-map eye affordance (Law 22,
 *   `Docs/ui-patterns.md` §1) and the name itself stays plain styled text per
 *   Law 21's fail-open clause.
 *
 *   THR-1172 widened `NarrativeEntityKind` with a `location` member, so the
 *   original reason recorded here — that the union could not be widened without
 *   making every existing `openEntity` contravariant against it — is spent, and
 *   the variance never bit: this panel's `openEntity` types `kind` as `string |
 *   undefined`, which is wider than the union and so accepts it. **The behaviour
 *   is unchanged and still correct**, on the surviving reason rather than the
 *   retired one: this panel is handed `onOpenHolder` and nothing else, so it has
 *   no location destination to route to, and Law 21's fail-open clause keeps an
 *   unroutable name as text. A ruin is also the one location whose page really is
 *   the map. If this panel is ever given a location handler, the kind is now
 *   there to declare.
 * - **Sphere** — `SphereIcon` (Law 9's one icon vocabulary) inside the sphere's
 *   registry tooltip (Law 17), both guarded so an unknown sphere string degrades
 *   to the bare word instead of a broken icon (NFP #4).
 */

import React, { useMemo } from 'react';
import type { GraphNode } from '../../types/graph';
import type { WorldGraph } from '../../engine/graph';
import { getStreamYieldWord } from '../../data/ruin-words';
import { getDurationWord } from '../../data/domain-words';
import { EntityVisual } from '../shared/EntityVisual';
import { SphereIcon } from '../shared/SphereIcon';
import { Tooltip } from '../shared/Tooltip';
import { tooltipResolves } from '../../engine/tooltipResolver';
import { NarrativeSegments } from '../Game/encounter-stage/NarrativeSegments';
import type { EncounterStageNarrativeParagraph } from '../Game/encounter-stage/types';
import { SPHERE_NAMES } from '../../types/index';
import type { SphereName } from '../../types/index';

interface Props {
  location: GraphNode;
  graph?: WorldGraph;
  tick: number;
  /**
   * Opens the holder's agent surface. Absent ⇒ the name renders as plain styled
   * text (Law 21 fail-open), never as a link that goes nowhere.
   */
  onOpenHolder?: (agentId: string) => void;
  /** Zooms the map to the origin ruin. Absent ⇒ no eye affordance renders (Law 25). */
  onNavigateToRuin?: (locationId: string) => void;
}

// ── Layout + type constants (NFP #1) ────────────────────────────────

/** Edge length of the holder's art tile. Matches `EntityVisual`'s chip size. */
const HOLDER_CHIP_PX = 40;
/** Inline sphere glyph size — Law 11's ~14px floor for a meaning-bearing glyph. */
const SPHERE_GLYPH_PX = 14;

const BLOCK: React.CSSProperties = {
  marginTop: '12px',
  padding: '10px 12px',
  border: '1px solid var(--border-gold, #8b7355)',
  borderRadius: '4px',
  background: 'rgba(201, 162, 39, 0.06)',
  fontFamily: 'var(--font-body, sans-serif)',
  fontSize: 'var(--text-xs, 11px)',
  color: 'var(--text-primary, #e8dcc8)',
};

const HEADER: React.CSSProperties = {
  font: '700 10px/1.2 var(--font-display, serif)',
  color: 'var(--accent-gold, #c9a227)',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  marginBottom: '6px',
};

/** Art tile beside the reading, so the holder arrives as a face and not a word. */
const READING_ROW: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '8px',
};

const PROSE: React.CSSProperties = {
  margin: 0,
  lineHeight: 1.55,
  color: 'var(--text-secondary, #b8a894)',
};

const MARK_ROW: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '4px',
  marginTop: '8px',
};

/**
 * Chip anatomy: a kind tag plus its sentence. Polarity is never hue-only
 * (Law 31) — the tag word carries the reading on its own.
 */
const MARK_CHIP: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'baseline',
  gap: '4px',
  padding: '2px 6px',
  borderRadius: '3px',
  border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
  background: 'var(--bg-raised, #222228)',
  lineHeight: 1.4,
};

const MARK_TAG: React.CSSProperties = {
  font: '700 9px/1.2 var(--font-display, serif)',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
};

const MARK_SENTENCE: React.CSSProperties = {
  color: 'var(--text-muted, #8a7d6b)',
};

const EYE_BUTTON: React.CSSProperties = {
  background: 'none',
  border: 'none',
  padding: '0 2px',
  marginLeft: '2px',
  cursor: 'pointer',
  color: 'var(--accent-gold-dim, #8b7355)',
  fontSize: 'var(--text-xs, 11px)',
  lineHeight: 1,
};

/** Link/underline/plain tones handed to the shared segment renderer. */
const LINK_COLOR = 'var(--accent-gold, #c9a227)';
const UNDERLINE_COLOR = 'var(--accent-gold-dim, #8b7355)';
const PLAIN_COLOR = 'var(--text-primary, #e8dcc8)';

function isSphereName(value: string | undefined): value is SphereName {
  return value !== undefined && (SPHERE_NAMES as readonly string[]).includes(value);
}

/** Warn-once ledger, so a bad sphere on a re-rendering panel logs a line, not a stream. */
const warnedSpheres = new Set<string>();
function warnUnknownSphere(value: string): void {
  if (warnedSpheres.has(value)) return;
  warnedSpheres.add(value);
  console.warn(`[PlaceOfPowerInspector] unknown sphere "${value}" — rendering as "essence" (Law 14).`);
}

export function PlaceOfPowerInspector({
  location,
  graph,
  tick,
  onOpenHolder,
  onNavigateToRuin,
}: Props) {
  const props = location.properties as Record<string, unknown>;
  const essencePerTick = props.popEssencePerTick as number | undefined;
  const sphere = props.popSphere as string | undefined;
  const countdown = props.popStreamDecayCountdown as number | undefined;
  const streamDead = props.popStreamDead === true;
  const transformedFrom = props.transformedFromRuinId as string | undefined;

  const holder = useMemo(() => {
    if (!graph) return null;
    const actors = graph.getNodesByType('actor');
    for (const a of actors) {
      const hit = graph.getOutgoingEdges(a.id, 'holds_place_of_power').find(e => e.target === location.id);
      if (hit) {
        const holderType = (hit.properties.holderType as string | undefined) ?? 'actor';
        return { node: a, holderType, edgeProps: hit.properties as Record<string, unknown> };
      }
    }
    return null;
  }, [graph, location.id, tick]);

  const originName = transformedFrom
    ? // Law 14 — the raw node id never reaches the player; it fails open to plain
      // English when the ruin has left the graph. The tick it transformed on is
      // designer data and stays on the trace: "which tick" is not a question the
      // player is asking.
      (graph?.getNode(transformedFrom)?.name ?? 'a fallen ruin')
    : null;

  // The reading, as sentences whose clauses vary independently. Segments rather
  // than one interpolated string so the holder's name stays a *declared* entity
  // reference (Law 2) instead of English the renderer would have to parse.
  // Law 14 — a sphere the vocabulary cannot resolve renders as its best plain
  // English ("essence" is what every stream gives, whatever its alignment) and
  // warns once. It never renders as the raw key, and it never guesses a
  // *specific* sphere, which would state something false rather than vague.
  const sphereIsKnown = isSphereName(sphere);
  const sphereWord = sphereIsKnown ? sphere : 'essence';
  if (sphere !== undefined && !sphereIsKnown) warnUnknownSphere(sphere);

  const openingSegments: EncounterStageNarrativeParagraph = {
    id: 'pop-reading-open',
    segments: [
      holder
        ? {
            text: holder.node.name,
            // See the header note: only a mortal actor gets the link, because the
            // agent surface is the only page this panel can open.
            ...(holder.holderType === 'actor'
              ? { entityId: holder.node.id, entityKind: 'agent' as const }
              : {}),
          }
        : { text: 'No one' },
      {
        text: streamDead
          ? ' holds this place. Its stream lies dormant.'
          : ` holds this place. Its stream gives ${getStreamYieldWord(essencePerTick ?? 0)} of `,
      },
    ],
  };

  const closingSegments: EncounterStageNarrativeParagraph = {
    id: 'pop-reading-close',
    segments: [
      { text: `, and fades ${getDurationWord(countdown ?? 0)}.` },
    ],
  };

  const originSegments: EncounterStageNarrativeParagraph = {
    id: 'pop-reading-origin',
    segments: [{ text: ` It rose from ${originName}.` }],
  };

  const openEntity = (entityId: string | undefined, kind: string | undefined) => {
    if (!entityId) return undefined;
    if (kind && kind !== 'agent') return undefined;
    return onOpenHolder ? () => onOpenHolder(entityId) : undefined;
  };

  const sphereTooltipId = `sphere.${sphereWord}`;
  const sphereBody = (
    <span style={{ whiteSpace: 'nowrap' }}>
      {sphereIsKnown && (
        <SphereIcon
          sphere={sphere}
          size={SPHERE_GLYPH_PX}
          style={{ verticalAlign: '-2px', marginRight: '2px' }}
        />
      )}
      {sphereWord}
    </span>
  );

  const marks: Array<{ key: string; tag: string; tone: string; sentence: string }> = [];
  if (holder?.edgeProps?.corruptMark === true) {
    marks.push({
      key: 'corrupt',
      tag: 'Corrupt',
      tone: 'var(--accent-red, #a44)',
      sentence: 'the god siphons a share',
    });
  }
  if (holder?.edgeProps?.bargainFavor === true) {
    marks.push({
      key: 'bond',
      tag: 'Bound',
      tone: 'var(--accent-gold, #c9a227)',
      sentence: 'the god owes its holder a favor',
    });
  }

  return (
    <div style={BLOCK} data-testid="place-of-power-inspector">
      <div style={HEADER}>Place of Power</div>

      <div style={READING_ROW}>
        {holder && (
          <EntityVisual
            size="chip"
            entity={{ id: holder.node.id, name: holder.node.name }}
            graph={graph}
            style={{ width: HOLDER_CHIP_PX, height: HOLDER_CHIP_PX }}
            data-testid="pop-holder-art"
          />
        )}
        <p style={PROSE} data-testid="pop-reading">
          <NarrativeSegments
            paragraph={openingSegments}
            openEntity={openEntity}
            linkColor={LINK_COLOR}
            underlineColor={UNDERLINE_COLOR}
            plainColor={PLAIN_COLOR}
            testIdPrefix="pop-open"
          />
          {!streamDead && (
            <>
              {tooltipResolves(sphereTooltipId) ? (
                <Tooltip id={sphereTooltipId}>{sphereBody}</Tooltip>
              ) : (
                sphereBody
              )}
              <NarrativeSegments
                paragraph={closingSegments}
                openEntity={openEntity}
                linkColor={LINK_COLOR}
                underlineColor={UNDERLINE_COLOR}
                plainColor={PLAIN_COLOR}
              />
            </>
          )}
          {originName && (
            <>
              <NarrativeSegments
                paragraph={originSegments}
                openEntity={openEntity}
                linkColor={LINK_COLOR}
                underlineColor={UNDERLINE_COLOR}
                plainColor={PLAIN_COLOR}
              />
              {onNavigateToRuin && transformedFrom && (
                <button
                  type="button"
                  className="focus-ring"
                  style={EYE_BUTTON}
                  aria-label={`Show ${originName} on the map`}
                  title={`Show ${originName} on the map`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigateToRuin(transformedFrom);
                  }}
                >
                  &#x1F441;
                </button>
              )}
            </>
          )}
        </p>
      </div>

      {marks.length > 0 && (
        <div style={MARK_ROW} data-testid="pop-marks">
          {marks.map(mark => (
            <span key={mark.key} style={MARK_CHIP}>
              <span style={{ ...MARK_TAG, color: mark.tone }}>{mark.tag}</span>
              <span style={MARK_SENTENCE}>{mark.sentence}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
