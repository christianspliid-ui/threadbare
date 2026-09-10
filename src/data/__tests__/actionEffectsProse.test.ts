/**
 * `actionEffectsProse` — the card's one line (THR-1002).
 *
 * The effect line is the only text an action card carries, so a card whose line
 * falls through to the composed fallback says nothing the player can act on: every
 * `update`-on-agent card in the game shares one sentence there. That was the state
 * before this ticket for 32 of the ids in the two decks a player can actually hold.
 *
 * These arms are **predicates, not counts** (THR-688 rule A). They enumerate the
 * two decks from their own sources — `collectGrantedActionIds()` and the
 * actor-targeted half of `AGENT_INTERVENTION_TEMPLATES` — so a beat that grants a
 * new action, or a new agent-hand template, fails here the moment it lands rather
 * than the moment someone notices a blank-sounding card. A snapshot count would
 * have gone stale on the next content PR.
 */
import { describe, it, expect } from 'vitest';
import { ACTION_EFFECTS_PROSE, actionEffectsProse, EFFECTS_LINE_MAX_CHARS } from '../actionEffectsProse';
import { collectGrantedActionIds } from '../ascendant-beat-content';
import { UNIFIED_ACTION_TEMPLATES, AGENT_INTERVENTION_TEMPLATES } from '../unified-action-templates';
import type { UnifiedActionTemplate } from '../../types/unifiedAction';

/**
 * The agent hand: templates whose target is a mortal (or is unstated, which the
 * template contract defaults to `actor`). These are the cards the drawer offers
 * when a mortal is selected, which is where most casts happen.
 */
function actorTargetedAgentTemplates(): UnifiedActionTemplate[] {
  return AGENT_INTERVENTION_TEMPLATES.filter((t) => {
    const categories = (t.targetCategories ?? []) as readonly string[];
    return categories.length === 0 || categories.includes('actor') || categories.includes('agent');
  });
}

/** The beat-grantable deck, resolved to templates. */
function grantedTemplates(): UnifiedActionTemplate[] {
  const granted = new Set(collectGrantedActionIds());
  return (UNIFIED_ACTION_TEMPLATES as readonly UnifiedActionTemplate[]).filter((t) => granted.has(t.id));
}

describe('actionEffectsProse — the two decks are fully authored', () => {
  it('enumerates decks large enough for the predicates to mean anything', () => {
    // The vacuous-probe guard: both assertions below pass trivially over an empty
    // list. Measured at authoring: 30 granted ids, 30 actor-targeted agent
    // templates. Bounds are loose — this guards emptiness, not a snapshot.
    expect(collectGrantedActionIds().length).toBeGreaterThan(20);
    expect(actorTargetedAgentTemplates().length).toBeGreaterThan(20);
  });

  it('gives every beat-grantable action an authored line', () => {
    const missing = collectGrantedActionIds().filter((id) => !ACTION_EFFECTS_PROSE[id]);
    expect(missing).toEqual([]);
  });

  it('gives every actor-targeted agent-hand template an authored line', () => {
    const missing = actorTargetedAgentTemplates()
      .filter((t) => !ACTION_EFFECTS_PROSE[t.id])
      .map((t) => t.id);
    expect(missing).toEqual([]);
  });
});

describe('actionEffectsProse — the line obeys the card it prints on', () => {
  /** Every authored line, plus the composed line for each deck member. */
  function everyPlayerFacingLine(): { id: string; line: string }[] {
    const lines = Object.entries(ACTION_EFFECTS_PROSE).map(([id, line]) => ({ id, line }));
    for (const template of [...grantedTemplates(), ...actorTargetedAgentTemplates()]) {
      lines.push({ id: template.id, line: actionEffectsProse(template) });
    }
    return lines;
  }

  it('never carries a numeral (Law 13)', () => {
    // The card's price is framed pips and its odds are a word. A number in the
    // prose is a third rendering of a quantity, and the one nobody maintains.
    const offenders = everyPlayerFacingLine().filter(({ line }) => /\d/.test(line));
    expect(offenders.map((o) => o.id)).toEqual([]);
  });

  it('never re-states the essence price the card already draws', () => {
    // The retired cost clause. It read *" Costs 3 essence."* on every line.
    const offenders = everyPlayerFacingLine().filter(({ line }) => /costs?\s/i.test(line));
    expect(offenders.map((o) => o.id)).toEqual([]);
  });

  it('stays inside the one length guardrail the card actually has', () => {
    // `EFFECTS_LINE_MAX_CHARS`, and only that. The plan also specified a 14-word
    // cap; it was dropped as a second guardrail on the same question, because what
    // constrains the line is the card's fixed width and characters measure that
    // directly where words only proxy for it (see `action-card-display.ts`).
    //
    // Asserted on the authored table alone — the composed fallback is a fixed
    // shape that cannot exceed it.
    const tooLong = Object.entries(ACTION_EFFECTS_PROSE)
      .filter(([, line]) => line.length > EFFECTS_LINE_MAX_CHARS)
      .map(([id, line]) => `${id} (${line.length}c)`);
    expect(tooLong).toEqual([]);
  });

  it('reads as a sentence, not a fragment', () => {
    const offenders = Object.entries(ACTION_EFFECTS_PROSE)
      .filter(([, line]) => !/^[A-Z]/.test(line) || !/[.!?]$/.test(line))
      .map(([id]) => id);
    expect(offenders).toEqual([]);
  });
});
