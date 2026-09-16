/**
 * Concept spans on a Codex detail row (THR-1507) — the producer declares, the surface
 * never parses English (UI Law 2).
 *
 * A detail row is `{ label, value }`, and its value is dense with concept words — a reach,
 * a Sphere, a scale, a price. Law 17 says every one of them hovers from the one registry.
 * Before this module only the Undertakings section did that, with a whole-value
 * `tooltipId`, and every other section shipped its rows plain. The whole-value field
 * cannot cover a value like *a slight edge in Gold, a faint edge in Heart*, which names
 * two concepts, so the shape here is the aftermath chip's (`EncounterAftermathChange
 * .concepts`, THR-1004): a list of `{ text, tooltipId }` spans, each the exact substring
 * of the value it occupies, and the panel underlines exactly those.
 *
 * Three rules, each with its reason:
 *
 *   - **A concept is declared only when the registry resolves it.** `reachConcept`,
 *     `sphereConcept` and `scaleConcept` return `null` for a key the registry has no
 *     entry for (`reach.time`, a `sphereAffinity` of `void`), so the panel never draws a
 *     dotted underline that opens nothing — the dead link Law 21 names by hand.
 *   - **The text is the value's own word, passed by the caller.** A mapper resolves a
 *     key through its display vocabulary and hands the *resolved* word here, so the span
 *     cannot drift from what the row paints. `conceptRow` drops a concept whose text is
 *     not a substring of the value, and says so once, rather than shipping a span the
 *     panel could never place.
 *   - **Matching is first-occurrence substring, in declaration order** — the same
 *     algorithm `applyConceptDecorations` runs on a consequence chip. Concept text comes
 *     from vocabularies, so it is literal by construction and a regex would only add
 *     escaping bugs. It also means a homonym stays where the producer left it: the card
 *     keyword *Veil* declares no reach concept, so it never hovers as one.
 *
 * `tooltipId` on the row itself survives as the single-concept shorthand — the value
 * *is* the concept (*The verb* → `ui.verb.create`) — and `detailConcepts` folds it into
 * the same list, so the panel has one render path, not two vocabularies.
 */

import { tooltipResolves } from '../../engine/tooltipResolver';
import { reachTooltipId } from '../../engine/aftermathWords';

/** One concept span inside a detail value — the exact substring and the registry id it hovers from. */
export interface CodexDetailConcept {
  readonly text: string;
  readonly tooltipId: string;
}

/** A row of the detail panel. See the module comment for how `tooltipId` and `concepts` relate. */
export interface CodexDetail {
  label: string;
  value: string;
  /** Whole-value hover (Law 17) — the shorthand for a value that *is* one concept. */
  tooltipId?: string;
  /** Concept spans inside a value that names more than one (Law 2). */
  concepts?: readonly CodexDetailConcept[];
}

/** One text run of a rendered value; `tooltipId` present means it hovers. */
export interface CodexDetailSegment {
  readonly text: string;
  readonly tooltipId?: string;
}

/** Resolvability is asked once per id — the catalog builds ~500 entries with a handful of rows each. */
const _resolvable = new Map<string, boolean>();

function resolves(tooltipId: string): boolean {
  let known = _resolvable.get(tooltipId);
  if (known === undefined) {
    known = tooltipResolves(tooltipId);
    _resolvable.set(tooltipId, known);
  }
  return known;
}

/** A span for `text` hovering from `tooltipId`, or `null` when the registry has no such entry. */
export function registryConcept(text: string, tooltipId: string | undefined): CodexDetailConcept | null {
  if (!text || !tooltipId || !resolves(tooltipId)) return null;
  return { text, tooltipId };
}

/** A reach word — `null` for the two keys with no world-model node (`time`, `life`). */
export function reachConcept(rawKey: string | undefined, text: string): CodexDetailConcept | null {
  return rawKey ? registryConcept(text, reachTooltipId(rawKey)) : null;
}

/** A Sphere word — `null` for a `sphereAffinity` that is not one of the twelve (THR-1114's `void`). */
export function sphereConcept(rawKey: string | undefined, text: string): CodexDetailConcept | null {
  return rawKey ? registryConcept(text, `sphere.${rawKey}`) : null;
}

/** An action's scale word, from the card-face vocabulary the hand already uses. */
export function scaleConcept(rawKey: string | undefined, text: string): CodexDetailConcept | null {
  return rawKey ? registryConcept(text, `ui.card.scale.${rawKey}`) : null;
}

/** Misplaced concepts already warned about, so a mapper defect reports once per row shape. */
const _warnedMisplaced = new Set<string>();

/**
 * A detail row with its concept spans. Nulls (unresolvable concepts) are dropped; a concept
 * whose text the value does not contain is dropped with one warning, because a span the panel
 * cannot place is a mapper bug, not a rendering choice. An empty list leaves the field off.
 */
export function conceptRow(
  label: string,
  value: string,
  concepts: readonly (CodexDetailConcept | null)[],
): CodexDetail {
  const placed: CodexDetailConcept[] = [];
  for (const concept of concepts) {
    if (!concept) continue;
    if (!value.includes(concept.text)) {
      const key = `${label}:${concept.tooltipId}`;
      if (!_warnedMisplaced.has(key)) {
        _warnedMisplaced.add(key);
        console.warn(
          `[codexConcepts] '${label}' declares concept '${concept.text}' (${concept.tooltipId}) ` +
          `but its value "${value}" does not contain it — dropped (UI Law 2: the text must be the value's own word).`,
        );
      }
      continue;
    }
    placed.push(concept);
  }
  return placed.length > 0 ? { label, value, concepts: placed } : { label, value };
}

/**
 * The reach concepts named by a banded contribution phrase (`a slight edge in Gold, …`).
 * `displayName` is the same resolver the phrase was built with, so the text matches it exactly.
 */
export function contributionConcepts(
  record: Record<string, number>,
  displayName: (rawKey: string) => string,
): CodexDetailConcept[] {
  const out: CodexDetailConcept[] = [];
  for (const rawKey of Object.keys(record)) {
    const concept = reachConcept(rawKey, displayName(rawKey));
    if (concept) out.push(concept);
  }
  return out;
}

/** Every concept a row declares, with the whole-value shorthand folded in — one list for one render path. */
export function detailConcepts(detail: CodexDetail): readonly CodexDetailConcept[] {
  if (detail.tooltipId) return [{ text: detail.value, tooltipId: detail.tooltipId }];
  return detail.concepts ?? [];
}

/**
 * Split a value into plain runs and hovering runs — first occurrence, declaration order,
 * never re-splitting a run an earlier concept claimed. A concept the value does not contain
 * is skipped, so the surface degrades to plain text rather than to nothing (NFP #4).
 */
export function splitDetailValue(
  value: string,
  concepts: readonly CodexDetailConcept[],
): CodexDetailSegment[] {
  let segments: CodexDetailSegment[] = [{ text: value }];
  for (const concept of concepts) {
    if (!concept.text) continue;
    const next: CodexDetailSegment[] = [];
    let placed = false;
    for (const segment of segments) {
      if (placed || segment.tooltipId) { next.push(segment); continue; }
      const at = segment.text.indexOf(concept.text);
      if (at < 0) { next.push(segment); continue; }
      const before = segment.text.slice(0, at);
      const after = segment.text.slice(at + concept.text.length);
      if (before) next.push({ text: before });
      next.push({ text: concept.text, tooltipId: concept.tooltipId });
      if (after) next.push({ text: after });
      placed = true;
    }
    segments = next;
  }
  return segments;
}
