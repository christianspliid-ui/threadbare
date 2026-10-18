/**
 * THR-1978 — when a surface may offer the "Meet The First" card.
 *
 * `MeetTheFirstFlow` mounts only with an ascendant identity (the remembrance
 * step creates it). A run started without one — the dev-only Advanced World
 * Setup path — can never open the flow, so no surface may offer the card there:
 * a card that cannot open promises an action the game cannot give.
 */
export interface MeetTheFirstOfferContext {
  meetTheFirstAvailable: boolean;
  hasAscendantIdentity: boolean;
}

/** The flow can open: the world allows a meeting and the run has an identity. */
export function canOpenMeetTheFirst(ctx: MeetTheFirstOfferContext): boolean {
  return ctx.meetTheFirstAvailable && ctx.hasAscendantIdentity;
}

export interface MeetTheFirstCardContext extends MeetTheFirstOfferContext {
  viewLevel: string;
  hasFocusedLocation: boolean;
}

/** The location view's non-agent slot row offers the card. */
export function offersMeetTheFirstCard(ctx: MeetTheFirstCardContext): boolean {
  return ctx.viewLevel === 'location'
    && ctx.hasFocusedLocation
    && canOpenMeetTheFirst(ctx);
}
