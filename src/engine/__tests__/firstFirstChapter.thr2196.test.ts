/**
 * THR-2196 — The First's first chapter contradicted itself (cold playtest round 7).
 *
 * 1. A lost guild join test showed the welcome reaction and paid its tally.
 * 2. bf.join had no hand, so The First's first chapter after the bond played alone.
 * 3. The meeting told a smith's apprenticeship and the bond wrote Shrine-keeper.
 *
 * Asserted on the SHIPPED objects (`getUnifiedTemplateById`), never the raw
 * authoring arrays — a converter once dropped fields silently (THR-1634 E1).
 */
import { describe, expect, it } from 'vitest';
import { getUnifiedTemplateById } from '../../data/unified-action-templates';
import { stepOffersPlayerMove, chapterOffersPlayerMove } from '../playerStepHold';
import { resolveAftermathVariant, type UnifiedActionOutcome } from '../../types/unifiedAction';
import { ENRICHED_DILEMMA_LIBRARY } from '../../data/meeting-dilemma-library';
import { CANDIDATE_VIGNETTES } from '../../data/candidate-vignettes';
import { dilemmaFitsTrade, selectDilemmasScored } from '../meetingEncounter';
import { REACH_VALUE_PAIR } from '../../types/agent';
import { REACH_DOMAINS, type ReachDomain } from '../../types/traits';

/** The join chapters whose only ending was the welcome. */
const JOIN_IDS = [
  'bf.join', 'ac.join', 'mct.join', 'rb.join', 'tg.join', 'uk.join', 'ag.join', 'lk.join', 'mc.join',
] as const;
const LOSING: readonly UnifiedActionOutcome[] = ['failure', 'critical_failure', 'contested_lost'];

describe('THR-2196 item 1 — a lost join test is not a joining', () => {
  it('bf.join on failure shows the sent-back reaction with no tally', () => {
    const t = getUnifiedTemplateById('bf.join')!;
    const v = resolveAftermathVariant(t.aftermathConfig!, [], 'failure');
    expect(v.reactions.map(r => r.label)).toEqual(['Sent back to make cleaner joints.']);
    expect(v.reactions.flatMap(r => r.effects)).toEqual([]);
    expect(v.changes).toEqual([]);
  });

  it('bf.join on success still welcomes the Fellow', () => {
    const t = getUnifiedTemplateById('bf.join')!;
    const v = resolveAftermathVariant(t.aftermathConfig!, [], 'success');
    expect(v.reactions[0].label).toBe('{name} is a Fellow.');
  });

  it.each(JOIN_IDS)('%s carries no effect on any losing outcome', (id) => {
    const t = getUnifiedTemplateById(id);
    expect(t, `${id} is registered`).toBeDefined();
    for (const outcome of LOSING) {
      const v = resolveAftermathVariant(t!.aftermathConfig!, [], outcome);
      expect(v.reactions.map(r => r.id), `${id} ${outcome}`).toEqual(['join_deferred']);
      expect(v.reactions.flatMap(r => r.effects), `${id} ${outcome}`).toEqual([]);
    }
  });

  it('the shared ag ending is unchanged for ag templates other than ag.join', () => {
    const t = getUnifiedTemplateById('ag.join')!;
    const other = getUnifiedTemplateById('ag.join.1') ?? undefined;
    // ag.join's band is keyed to ag.join alone; the success ending keeps its tally.
    const win = resolveAftermathVariant(t.aftermathConfig!, [], 'success');
    expect(win.reactions[0].effects.length).toBeGreaterThan(0);
    if (other?.aftermathConfig) {
      expect(other.aftermathConfig.fallback.byOutcome).toBeUndefined();
    }
  });
});

describe('THR-2196 item 2 — bf.join waits on the god\'s hand', () => {
  it('step 0 offers the player a move', () => {
    const t = getUnifiedTemplateById('bf.join');
    expect(stepOffersPlayerMove(t, 0)).toBe(true);
    expect(chapterOffersPlayerMove(t)).toBe(true);
  });
});

/** Backstory that casts the mortal in a trade. Any dilemma matching must declare `castsTrade`. */
const TRADE_CASTING = [
  /\{agent\.name\} has served the settlement\\?'s [a-z]+/,
  /takes \{agent\.name\} as an apprentice/,
  /Working at the settlement\\?'s forge/,
];

describe('THR-2196 item 3 — the meeting tells the trade the bond writes', () => {
  it('every dilemma whose setup casts a trade declares castsTrade', () => {
    const untagged = ENRICHED_DILEMMA_LIBRARY
      .filter(d => TRADE_CASTING.some(re => re.test(d.setup)))
      .filter(d => !d.castsTrade || d.castsTrade.length === 0)
      .map(d => d.id);
    expect(untagged).toEqual([]);
  });

  it('no vignette can be dealt a dilemma casting a trade it does not hold', () => {
    const clashes: string[] = [];
    for (const vignette of CANDIDATE_VIGNETTES) {
      for (const d of ENRICHED_DILEMMA_LIBRARY) {
        if (!d.castsTrade?.length) continue;
        if (d.castsTrade.includes(vignette.trade.role)) continue;
        if (dilemmaFitsTrade(d, vignette.trade.role)) clashes.push(`${vignette.id} × ${d.id}`);
      }
    }
    expect(clashes).toEqual([]);
  });

  it('a Shrine-keeper candidate is never dealt the smith\'s-apprentice dilemma', () => {
    const martyr = CANDIDATE_VIGNETTES.find(v => v.id === 'vignette.heart.martyr')!;
    expect(martyr.trade.word).toBe('Shrine-keeper');
    const reach = REACH_DOMAINS.find(r => REACH_VALUE_PAIR[r] === 'loyalty_ambition') as ReachDomain;
    const secondary = REACH_DOMAINS.find(r => r !== reach) as ReachDomain;
    let dealtWithoutGate = 0;
    for (let seed = 0; seed < 200; seed++) {
      const gated = selectDilemmasScored(
        [...ENRICHED_DILEMMA_LIBRARY], reach, secondary, 'life', '', 'village', seed, undefined, martyr.trade.role,
      );
      expect(gated.dilemmas.map(d => d.templateId)).not.toContain('AX-HEART-01');
      const ungated = selectDilemmasScored(
        [...ENRICHED_DILEMMA_LIBRARY], reach, secondary, 'life', '', 'village', seed,
      );
      if (ungated.dilemmas.some(d => d.templateId === 'AX-HEART-01')) dealtWithoutGate++;
    }
    // The control: without a trade the dilemma is still in the deal, so the gate is what removed it.
    expect(dealtWithoutGate).toBeGreaterThan(0);
  });

  it('a candidate with no known trade is never filtered', () => {
    for (const d of ENRICHED_DILEMMA_LIBRARY) expect(dilemmaFitsTrade(d, undefined)).toBe(true);
  });
});
