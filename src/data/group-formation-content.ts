/**
 * Seeking Companions — Company Formation Prose (THR-74)
 *
 * When a *threaded* company first sets out, its founding is not a silent line in
 * the ledger — it is an authored moment. The prose evokes the formation arc the
 * design names (announcement → sizing up → negotiation → handshake) without ever
 * staging it as an interactive encounter: the company is already bound by the time
 * the moment is told. Two variants, chosen by how warmly it came together (see
 * `groupSeeking.ts`):
 *
 *  - **eager** — kindred spirits who found each other fast: a shared purpose spoken
 *    aloud, a clasp of hands before the ale went cold.
 *  - **wary** — a company assembled from strangers who sized each other up first:
 *    the handshake more contract than kinship, but a handshake all the same.
 *
 * Data only, no logic. The `{company}` token is substituted with the company's
 * generated proper name at fire time. The word "party" never appears here by
 * design (player-facing text says "company" or the generated name — THR-734).
 */

/** Which register a founding is told in. */
export type SeekingVariant = 'eager' | 'wary';

/**
 * Eager foundings — the company came together warmly and fast. Told with the lift
 * of a road just begun and companions gladly chosen.
 */
export const GROUP_SEEKING_EAGER: readonly string[] = [
  'One voice names the road ahead in a crowded room, and by the time the tankards are drained {company} has a name of its own. They set out gladly, already talking over one another.',
  'It takes {company} less than an evening to find each other — a shared purpose said plainly, a clasp of hands, and the matter settled. They leave as though they had always meant to.',
  'The founding of {company} is quick and warm: kindred wants recognized across a table, promises spoken before doubt can get a word in. The road takes them laughing.',
  '{company} forms the way a fire catches — one spark of common cause, and suddenly all of them are leaning in. They swear the road together and mean every word.',
  'Barely a round of introductions, and {company} is bound. They size each other up and like what they see, and the handshakes come easy. Off they go, well met.',
];

/**
 * Wary foundings — the company was assembled from strangers who bargained first.
 * Told cooler; the bond is real but earned, not gifted.
 */
export const GROUP_SEEKING_WARY: readonly string[] = [
  'The founding of {company} is a slow negotiation — terms weighed, glances measured, the handshake more contract than kinship. But it is a handshake, and they set out bound by it.',
  '{company} comes together warily: strangers taking the measure of one another over a long table, deciding the shared road is worth the risk of the shared company. They leave watchful, but together.',
  'It takes some talking to make {company} — old habits of distrust set aside one grudging inch at a time. They shake on it in the end, and a wary bond is still a bond.',
  'No one in {company} quite trusts the others yet, but the errand is bigger than any of them alone. They strike their bargain, name themselves, and ride out keeping one eye open.',
  '{company} is assembled, not born — each companion sizing the others for their worth before committing. The clasp of hands is firm and cautious both. It will have to do, and it does.',
];

/** Fail-soft line used when a pool comes back empty. */
export const GROUP_SEEKING_FALLBACK = '{company} sets out together.';
