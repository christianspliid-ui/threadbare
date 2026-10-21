/**
 * Trade words — what the player reads for a mortal's work (THR-1982).
 *
 * The First carries an authored `tradeWord` from her meeting vignette
 * (`candidate-vignettes.ts`). Every other mortal falls back to the word for its
 * `npcRole` here. Surfaces read both through `displayTradeWord`
 * (`engine/firstTrade.ts`), so the sheet, the location people list and the
 * chronicle soul cards agree word for word.
 */
import type { NpcRole } from '../types/npc';

/** Master switch: the bond writes The First's trade (`npcRole` + `tradeWord`). */
export const FIRST_TRADE_ENABLED = true;

/** Master switch for the `protagonist_role_fit` encounter filter stage. Off: it passes everything. */
export const PROTAGONIST_ROLE_FIT_ENABLED = true;

/** Content-test cap on a vignette's trade word. */
export const TRADE_WORD_MAX_WORDS = 3;

/** What `{trade}` renders for an actor with no trade and no role. */
export const TRADE_TOKEN_FALLBACK_WORD = 'person';

/**
 * The fallback word for each role — the role with `_` as a space, apart from three
 * cleaned-up words. Lower case; surfaces capitalise as their register needs.
 */
export const NPC_ROLE_WORD: Readonly<Record<NpcRole, string>> = {
  innkeeper: 'innkeeper',
  guard: 'guard',
  merchant: 'merchant',
  healer: 'healer',
  priest: 'priest',
  acolyte: 'acolyte',
  pilgrim: 'pilgrim',
  scholar: 'scholar',
  spy: 'spy',
  noble: 'noble',
  entertainer: 'entertainer',
  faction_rep: 'envoy',
  commander: 'commander',
  quartermaster: 'quartermaster',
  scout: 'scout',
  hermit: 'hermit',
  ranger: 'ranger',
  wanderer: 'wanderer',
  clerk: 'clerk',
  appraiser: 'appraiser',
  fence: 'fence',
  informant: 'informant',
  lookout: 'lookout',
  steward: 'steward',
  herald: 'herald',
  attendant: 'attendant',
  scribe: 'scribe',
  librarian: 'librarian',
  researcher: 'researcher',
  weaver: 'weaver',
  mason: 'mason',
  brewer: 'brewer',
  trader: 'trader',
  guard_captain: 'captain',
  elder: 'elder',
  smith: 'smith',
  broker: 'broker',
  mercenary: 'mercenary',
  spellsword: 'spellsword',
  paladin: 'paladin',
  alchemist: 'alchemist',
  assassin: 'assassin',
  burglar: 'burglar',
  hexer: 'hexer',
  warmage: 'warmage',
  enchanter: 'enchanter',
  illusionist: 'illusionist',
  bard: 'bard',
  marshal: 'marshal',
  sage: 'sage',
  monk: 'monk',
  hunter: 'hunter',
  warrior_priest: 'warrior-priest',
  chaplain: 'chaplain',
  exorcist: 'exorcist',
  oracle: 'oracle',
};
