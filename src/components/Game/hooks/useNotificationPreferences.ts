import { useState, useCallback, useEffect } from 'react';
import type {
  NotificationPreferences, NotificationCategoryKey, NotificationMode,
} from '../../../types/notification';
import {
  DEFAULT_NOTIFICATION_PREFS, NOTIFICATION_PREFS_STORAGE_KEY,
} from '../../../types/notification';
import { resolvePreferences } from '../../../engine/notificationRouter';

/** Load preferences from localStorage, returning undefined if unavailable */
function loadStoredPrefs(): Partial<NotificationPreferences> | undefined {
  try {
    const raw = localStorage.getItem(NOTIFICATION_PREFS_STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return undefined;
    return parsed as Partial<NotificationPreferences>;
  } catch {
    return undefined;
  }
}

/** Save preferences to localStorage (best-effort) */
function saveStoredPrefs(prefs: NotificationPreferences): void {
  try {
    localStorage.setItem(NOTIFICATION_PREFS_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Private browsing or quota exceeded — silently ignore
  }
}

export interface UseNotificationPreferencesReturn {
  preferences: NotificationPreferences;
  toggleCategory: (key: NotificationCategoryKey) => void;
  setMode: (key: NotificationCategoryKey, mode: NotificationMode) => void;
  resetToDefaults: () => void;
}

/**
 * Manages notification preferences with localStorage persistence.
 * GameState override support can be added later via the optional gameStatePrefs param.
 */
export function useNotificationPreferences(
  gameStatePrefs?: Partial<NotificationPreferences>,
): UseNotificationPreferencesReturn {
  const [prefs, setPrefs] = useState<NotificationPreferences>(() => {
    return resolvePreferences(gameStatePrefs, loadStoredPrefs());
  });

  // Re-resolve if gameState prefs change
  useEffect(() => {
    setPrefs(resolvePreferences(gameStatePrefs, loadStoredPrefs()));
  }, [gameStatePrefs]);

  const toggleCategory = useCallback((key: NotificationCategoryKey) => {
    setPrefs(prev => {
      const next = {
        ...prev,
        [key]: { ...prev[key], enabled: !prev[key].enabled },
      };
      saveStoredPrefs(next);
      return next;
    });
  }, []);

  const setMode = useCallback((key: NotificationCategoryKey, mode: NotificationMode) => {
    setPrefs(prev => {
      const next = {
        ...prev,
        [key]: { ...prev[key], mode },
      };
      saveStoredPrefs(next);
      return next;
    });
  }, []);

  const resetToDefaults = useCallback(() => {
    setPrefs(DEFAULT_NOTIFICATION_PREFS);
    try {
      localStorage.removeItem(NOTIFICATION_PREFS_STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  return { preferences: prefs, toggleCategory, setMode, resetToDefaults };
}
