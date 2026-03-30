/**
 * Tunable constants for the start page.
 * NFP #1: Every magic number is named — tune game feel by adjusting values here.
 */

// ─── Text Content ────────────────────────────────────────────────
export const START_PAGE_TITLE = 'THREADBEARER';
export const START_PAGE_WORDMARK = '/images/threadbearer-wordmark-spheres-final.png';
export const START_PAGE_LORE_LINE_1 = 'Worlds are woven. Worlds are worn through.';
export const START_PAGE_LORE_LINE_2 = 'The loom turns. The threads remember.';

// ─── Typography ──────────────────────────────────────────────────
export const START_PAGE_TITLE_SIZE = '2.5rem';
export const START_PAGE_TITLE_SPACING = '0.25em';
export const START_PAGE_LORE_MAX_WIDTH = '500px';
export const MENU_ITEM_FONT = 'var(--font-display)';
export const MENU_ITEM_SIZE = 'var(--text-lg)';
export const MENU_ITEM_LETTER_SPACING = '0.08em';
export const MENU_ITEM_GAP = 'var(--space-4)';

// ─── Timing ──────────────────────────────────────────────────────
export const START_PAGE_FADE_DURATION_MS = 600;
export const MENU_HOVER_TRANSITION_MS = 300;

// ─── Gradient ────────────────────────────────────────────────────
export const START_PAGE_GRADIENT_OPACITY_MID = 0.4;
export const START_PAGE_GRADIENT_OPACITY_LOW = 0.95;

// ─── Audio ───────────────────────────────────────────────────────
export const THEME_MUSIC_SRC = '/audio/theme-drone.mp3';
export const THEME_VOLUME_DEFAULT = 0.4;
export const THEME_FADE_IN_MS = 3000;
export const THEME_FADE_OUT_MS = 1500;
export const THEME_MUTE_STORAGE_KEY = 'threadbearer_muted';

// ─── Version ─────────────────────────────────────────────────────
export const VERSION_STAMP_TEXT = 'v0.1.0 · prototype';

// ─── Background ──────────────────────────────────────────────────
export const START_PAGE_BG_IMAGE = '/images/start-page-background.png';
export const START_PAGE_BG_FALLBACK = 'var(--bg-abyss)';
