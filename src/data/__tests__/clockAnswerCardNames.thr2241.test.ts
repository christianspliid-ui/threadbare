/**
 * THR-2241 — each clock-answer card has one player-facing name.
 *
 * The hand, the god's page, the "A new card is yours" toast, the targeting prompt and
 * the codex all show `spellName ?? name`. The Doom lines and the rival lines name the
 * card in words. Both must say the same name, or a player sent to find the card by its
 * line finds nothing by that name.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { UNIFIED_ACTION_TEMPLATES } from '../unified-action-templates';
import { DOOM_STAY_HINT, DOOM_STAY_TEMPLATE_ID } from '../doom-stay-content';
import { RIVAL_REBUKE_RECEIPT_TITLE, RIVAL_REBUKE_TEMPLATE_ID } from '../rival-rebuke-content';

const ROOT = resolve(__dirname, '..', '..', '..');
const read = (rel: string): string => readFileSync(resolve(ROOT, rel), 'utf8');

function faceName(id: string): { name: string; face: string } {
  const template = UNIFIED_ACTION_TEMPLATES.find(t => t.id === id);
  if (!template) throw new Error(`template ${id} missing`);
  return { name: template.name, face: template.spellName ?? template.name };
}

/** Old spell names that must not reach a player-facing string again. */
const RETIRED_FACE_NAMES = ['Hold the Hour', 'The Turned Hand'];

describe('THR-2241 clock-answer cards: one name per card', () => {
  it('the Doom card shows the name its lines use', () => {
    const { name, face } = faceName(DOOM_STAY_TEMPLATE_ID);
    expect(face).toBe(name);
    expect(face).toBe('Stay the Unmaking');
    expect(DOOM_STAY_HINT).toContain(face);
    expect(read('src/engine/views/warmRecap.ts')).toContain(`'${face} slows it.'`);
    expect(read('src/data/ascendant-milestone-beats.ts')).toContain(`It is yours now as ${face}.`);
  });

  it('the rival card shows the name its lines use', () => {
    const { name, face } = faceName(RIVAL_REBUKE_TEMPLATE_ID);
    expect(face).toBe(name);
    expect(face).toBe('Rebuke');
    expect(RIVAL_REBUKE_RECEIPT_TITLE).toBe(face);
    const rivalEntry = read('src/engine/views/rivalEntry.ts');
    expect(rivalEntry).toContain(`'${face} it at {place}`);
    expect(rivalEntry).toContain(`'${face} it here`);
  });

  it('neither retired spell name is left in a template or a line', () => {
    const sources = [
      'src/data/unified-action-templates.ts',
      'src/data/doom-stay-content.ts',
      'src/data/rival-rebuke-content.ts',
      'src/data/ascendant-beat-content.ts',
      'src/data/ascendant-milestone-beats.ts',
      'src/data/ui-content.ts',
      'src/engine/views/doomStayNotice.ts',
      'src/engine/views/rivalEntry.ts',
      'src/engine/views/warmRecap.ts',
    ];
    for (const rel of sources) {
      const text = read(rel);
      for (const retired of RETIRED_FACE_NAMES) {
        expect(text.includes(retired), `${rel} still says "${retired}"`).toBe(false);
      }
    }
    for (const template of UNIFIED_ACTION_TEMPLATES) {
      for (const retired of RETIRED_FACE_NAMES) {
        expect(template.spellName === retired || template.name === retired).toBe(false);
      }
    }
  });
});
