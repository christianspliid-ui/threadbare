/**
 * HandPressContext — the god rail hand's press seam (THR-1894, frame plan § F6, § F12).
 *
 * A card row's press calls `useHandPress()(cardId)`. The frame owns where the hand sits
 * and what a press calls; what the press *does* is the provider's. The god rail's
 * default provider opens the card's Codex entry ("read the work", Law 25). THR-1876's
 * S6 (THR-1914) replaces it with arming and passes `armedActionId` back, so the armed
 * row shows the selected state. The rail never sets the armed state itself.
 */
import { createContext, useContext, type ReactNode } from 'react';

export interface HandPressValue {
  /** What a card row's press does. */
  press: (cardId: string) => void;
  /** The armed card's template id, when the provider arms cards; null otherwise. */
  armedActionId: string | null;
}

const HandPressContext = createContext<HandPressValue | null>(null);

export function HandPressProvider({ value, children }: { value: HandPressValue; children: ReactNode }) {
  return <HandPressContext.Provider value={value}>{children}</HandPressContext.Provider>;
}

/** The provider above, or null — the god rail mounts its default only when there is none. */
export function useHandPressProvider(): HandPressValue | null {
  return useContext(HandPressContext);
}

/** What a hand row's press calls. Outside any provider, a press does nothing (fail-soft). */
export function useHandPress(): (cardId: string) => void {
  return useContext(HandPressContext)?.press ?? noop;
}

/** The armed card, or null while nothing is armed (or no provider arms). */
export function useArmedCard(): string | null {
  return useContext(HandPressContext)?.armedActionId ?? null;
}

function noop(): void {}
