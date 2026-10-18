/**
 * IA manifest v1 — commitment document of what the player should see.
 *
 * Source of truth for interface-audit and playtest tooling.
 * Originally transliterated from Docs/ia-manifest.yaml for THR-206; that YAML
 * was deleted once this module became the locked source of truth — this file
 * is now hand-maintained (THR-1357).
 */

export type SurfaceMount = 'always' | 'modal' | 'drillin';
export type SurfaceView = 'start' | 'ascendant' | 'game' | 'codex' | 'styleguide' | 'cms' | 'ul';

export interface IAReader {
  state_path: string;
  reader: string;
  visible_when: string;
}

export interface IASurface {
  surface: string;
  view: SurfaceView;
  mount: SurfaceMount;
  reads: IAReader[];
  optional_readers?: string[];
  notes?: string;
  openUrl?: string;
}

export const IA_SURFACES: IASurface[] = [
  {
    "surface": "start.page",
    "view": "start",
    "mount": "always",
    "reads": [
      {
        "state_path": "(none — pre-game state)",
        "reader": "StartPage",
        "visible_when": "view === 'start'"
      }
    ],
    "notes": "Landing view. Entry point for new game, continue, credits, settings.\n",
    "openUrl": "/"
  },
  {
    "surface": "start.credits-modal",
    "view": "start",
    "mount": "modal",
    "reads": [
      {
        "state_path": "(none)",
        "reader": "CreditsModal",
        "visible_when": "credits button clicked"
      }
    ],
    "notes": "Static credits content. No GameState dependency.\n"
  },
  {
    "surface": "start.settings-modal",
    "view": "start",
    "mount": "modal",
    "reads": [
      {
        "state_path": "(none — app-level settings)",
        "reader": "SettingsModal",
        "visible_when": "settings button clicked"
      }
    ],
    "notes": "Audio, display, debug toggles. App-level, not per-game.\n"
  },
  {
    "surface": "ascendant.selection",
    "view": "ascendant",
    "mount": "always",
    "reads": [
      {
        "state_path": "ascendantIdentity",
        "reader": "AscendantSelection",
        "visible_when": "ascendantIdentity === null"
      }
    ],
    "notes": "Archetype + identity selection for new game.\n",
    "openUrl": "/?view=ascendant"
  },
  {
    "surface": "ascendant.cosmology-panel",
    "view": "ascendant",
    "mount": "drillin",
    "reads": [
      {
        "state_path": "cosmology.sphereWeights",
        "reader": "CosmologyPanel",
        "visible_when": "cosmology drill-in during selection"
      }
    ],
    "notes": "Shows sphere weighting and derived rivals.\n"
  },
  {
    "surface": "game.hex-map",
    "view": "game",
    "mount": "always",
    "reads": [
      {
        "state_path": "graph",
        "reader": "HexMapV2",
        "visible_when": "always"
      },
      {
        "state_path": "tiles",
        "reader": "HexMapV2",
        "visible_when": "always"
      },
      {
        "state_path": "visibilityMap",
        "reader": "HexMapV2",
        "visible_when": "always"
      }
    ],
    "notes": "The core map. WebGL scene — assertions via __DEBUG.snapshotScene(), not pixels.\n",
    "openUrl": "/?view=game&seeded"
  },
  {
    "surface": "game.essence-panel",
    "view": "game",
    "mount": "always",
    "reads": [
      {
        "state_path": "essencePool",
        "reader": "EssencePanel",
        "visible_when": "always"
      }
    ],
    "notes": "Player's essence reserves across spheres. Must always be visible.\n",
    "openUrl": "/?view=game&seeded"
  },
  {
    "surface": "game.simulation-controls",
    "view": "game",
    "mount": "always",
    "reads": [
      {
        "state_path": "clock",
        "reader": "SimulationControls",
        "visible_when": "always"
      }
    ],
    "notes": "Pause/play, the speed stepper (moved here from World Pulse, THR-1893), then season and year over the status line, in one row of the top bar (THR-1875). The status line names a hold, an answer, or the named pause (\"paused · Your ascendant has arrived at …\").\n",
    "openUrl": "/?view=game&seeded"
  },
  {
    "surface": "game.doom-bar",
    "view": "game",
    "mount": "always",
    "reads": [
      {
        "state_path": "doomClock",
        "reader": "DoomBar",
        "visible_when": "always"
      },
      {
        "state_path": "doomDefinition",
        "reader": "DoomBar",
        "visible_when": "always"
      }
    ],
    "notes": "Top-level doom progression indicator. Click expands to DoomClockDetail.\n",
    "openUrl": "/?view=game&seeded"
  },
  {
    "surface": "game.doom-clock-detail",
    "view": "game",
    "mount": "modal",
    "reads": [
      {
        "state_path": "doomClock",
        "reader": "DoomClockDetail",
        "visible_when": "always"
      },
      {
        "state_path": "doomDefinition",
        "reader": "DoomClockDetail",
        "visible_when": "always"
      },
      {
        "state_path": "doomIdentityMatrix",
        "reader": "DoomClockDetail",
        "visible_when": "always"
      }
    ],
    "notes": "Expanded doom view with archetype details.\n"
  },
  {
    "surface": "game.omen-indicator",
    "view": "game",
    "mount": "always",
    "reads": [
      {
        "state_path": "omenState",
        "reader": "OmenIndicator",
        "visible_when": "omenState !== undefined"
      },
      {
        "state_path": "tick",
        "reader": "OmenIndicator",
        "visible_when": "always"
      }
    ],
    "notes": "Atmospheric pressure indicator (THR-19). Click opens OmenDetail.\n",
    "openUrl": "/?view=game&seeded"
  },
  {
    "surface": "game.omen-detail",
    "view": "game",
    "mount": "modal",
    "reads": [
      {
        "state_path": "omenState",
        "reader": "OmenDetail",
        "visible_when": "always"
      },
      {
        "state_path": "tick",
        "reader": "OmenDetail",
        "visible_when": "always"
      }
    ],
    "notes": "Detail modal for active omens.\n"
  },
  {
    "surface": "game.mandate-tracker",
    "view": "game",
    "mount": "always",
    "reads": [
      {
        "state_path": "mandateState",
        "reader": "MandateTracker",
        "visible_when": "mandateState !== null"
      },
      {
        "state_path": "mandateDefinition",
        "reader": "MandateTracker",
        "visible_when": "always"
      }
    ],
    "notes": "Mandate progress at a glance. Click opens MandateDetail.\n",
    "openUrl": "/?view=game&seeded"
  },
  {
    "surface": "game.mandate-detail",
    "view": "game",
    "mount": "modal",
    "reads": [
      {
        "state_path": "mandateState",
        "reader": "MandateDetail",
        "visible_when": "always"
      },
      {
        "state_path": "mandateDefinition",
        "reader": "MandateDetail",
        "visible_when": "always"
      }
    ],
    "notes": "Mandate stakes, progress, completion criteria.\n"
  },
  {
    "surface": "game.ascendant-bar",
    "view": "game",
    "mount": "always",
    "reads": [
      {
        "state_path": "ascendantIdentity",
        "reader": "AscendantBar",
        "visible_when": "ascendantIdentity !== null"
      },
      {
        "state_path": "essencePool",
        "reader": "AscendantBar",
        "visible_when": "always"
      },
      {
        "state_path": "unlockedActionIds",
        "reader": "HandSection",
        "visible_when": "always"
      }
    ],
    "notes": "The god rail (THR-1894), drawn from GOD_RAIL_SECTIONS: identity (the name opens the god page in the Inspector, wide; \"Your First\" after the bond), essence with Attention under it, the hand headed \"Your cards\" (Move, Investiture and every revealed god card at its par price; whole while it fits, grouped by paying sphere at the rail's limit; resting while a moment is open; a press opens the card's Codex entry), and the folded rows Reaches, Mandate, Covenants, Signatures and Hooks. State via __DEBUG.getFrameState().godRail and getView('godRail').\n",
    "openUrl": "/?view=game&seeded"
  },
  {
    "surface": "game.identity-chip",
    "view": "game",
    "mount": "always",
    "reads": [
      {
        "state_path": "ascendantIdentity",
        "reader": "IdentityChip",
        "visible_when": "ascendantIdentity !== null"
      }
    ],
    "notes": "Compact identity display. Synchronizes with AscendantBar.\n",
    "openUrl": "/?view=game&seeded"
  },
  {
    "surface": "game.attention-pool-indicator",
    "view": "game",
    "mount": "always",
    "reads": [
      {
        "state_path": "activeThreadTugs",
        "reader": "AttentionPoolIndicator",
        "visible_when": "always"
      }
    ],
    "notes": "Attention tier capacity indicator (THR-19 / attention-tier-model). Sits in the god rail under essence since THR-1894 (it left the top bar).\n",
    "openUrl": "/?view=game&seeded"
  },
  {
    "surface": "game.rivals-button",
    "view": "game",
    "mount": "always",
    "reads": [
      {
        "state_path": "rivalStates",
        "reader": "RivalsButton",
        "visible_when": "always"
      },
      {
        "state_path": "rivalDefinitions",
        "reader": "RivalsButton",
        "visible_when": "always"
      }
    ],
    "notes": "Compact rivals status. Click opens RivalPanel.\n",
    "openUrl": "/?view=game&seeded"
  },
  {
    "surface": "game.rival-panel",
    "view": "game",
    "mount": "modal",
    "reads": [
      {
        "state_path": "rivalStates",
        "reader": "RivalPanel",
        "visible_when": "always"
      },
      {
        "state_path": "rivalDefinitions",
        "reader": "RivalPanel",
        "visible_when": "always"
      }
    ],
    "notes": "Full rival status list.\n"
  },
  {
    "surface": "game.toast-stack",
    "view": "game",
    "mount": "always",
    "reads": [
      {
        "state_path": "tickEvents",
        "reader": "ToastStack",
        "visible_when": "tickEvents with notification directive"
      }
    ],
    "notes": "Transient event notifications. Player-facing only (filtered).\n",
    "openUrl": "/?view=game&seeded"
  },
  {
    "surface": "game.needs-you",
    "view": "game",
    "mount": "always",
    "reads": [
      {
        "state_path": "ascendantBeats.pending",
        "reader": "NeedsYou",
        "visible_when": "a beat is offered and not entered (a Waiting row)"
      },
      {
        "state_path": "playerActionReceipts",
        "reader": "NeedsYou",
        "visible_when": "a toast-tier receipt is unacknowledged (a Waiting row)"
      },
      {
        "state_path": "tickEvents",
        "reader": "NeedsYou",
        "visible_when": "alert-channel news inside NEEDS_YOU_NEWS_KEEP_DAYS (News rows), or an avatar arrival (the named pause)"
      }
    ],
    "notes": "Needs you (THR-1875): the gold count pill in the top bar, shown only while something waits; N or a press opens its list of three groups — Waiting for you, Held behind this chapter, News. The list grows to 60vh before it folds rows into \"and N more\"; a same-kind burst in one tick is one News row \"· and N more like it\". Opening it never clears the count. Rows are read-only while an interrupt holds the clock. State via __DEBUG.getFrameState().needsYou and getView('needsYou').\n",
    "openUrl": "/?view=game&seeded&size=medium"
  },
  {
    "surface": "game.chronicle-panel",
    "view": "game",
    "mount": "always",
    "reads": [
      {
        "state_path": "chronicleEntries",
        "reader": "ChroniclePanel",
        "visible_when": "always"
      },
      {
        "state_path": "chapterArchive",
        "reader": "ChroniclePanel",
        "visible_when": "the Ledger tab, once The First's first chapter reveals it"
      }
    ],
    "notes": "The Chronicle in the Ledger rail (THR-1893): the World-Soul line heads it; tabs Now (the last four seasons, Before you woke pinned, the voice toggle), Years (from the second calendar year) and Ledger (the threaded chapters, unread marked new; replaces the Chapter Ledger launcher). Grows to the rail's free height.\n",
    "openUrl": "/?view=game&seeded"
  },
  {
    "surface": "game.world-soul-line",
    "view": "game",
    "mount": "always",
    "reads": [
      {
        "state_path": "worldSoul.aggregate",
        "reader": "ChroniclePanel",
        "visible_when": "after A Path Opens (THR-1837), once an aggregate exists"
      },
      {
        "state_path": "doomClock.currentStage",
        "reader": "ChroniclePanel",
        "visible_when": "with the World-Soul line"
      }
    ],
    "notes": "The World-Soul sentence for the dominant sphere and the world's mood for the doom stage, one line per season, heading the Chronicle (moved from the top bar, THR-1893).\n",
    "openUrl": "/?view=game&seeded"
  },
  {
    "surface": "game.ledger-strip",
    "view": "game",
    "mount": "always",
    "reads": [
      {
        "state_path": "chronicleEntries",
        "reader": "LedgerStrip",
        "visible_when": "the Ledger rail is folded (L, the Fold control) or the Inspector is open"
      },
      {
        "state_path": "chapterArchive",
        "reader": "LedgerStrip",
        "visible_when": "the Ledger rail is folded, once the Chapter Ledger is revealed"
      }
    ],
    "notes": "The Ledger rail folded to a 56 px strip: unfold, then Threads (chapters waiting), Chronicle (new entries) and Chapter Ledger (new chapters), each an icon with a count; the word is in the tooltip (THR-1893).\n",
    "openUrl": "/?view=game&seeded"
  },
  {
    "surface": "game.threads-panel",
    "view": "game",
    "mount": "drillin",
    "reads": [
      {
        "state_path": "graph",
        "reader": "ThreadsPanel",
        "visible_when": "always"
      }
    ],
    "notes": "Player's woven threads (relationships, stakes). Click opens the thread's page in the Inspector.\n"
  },
  {
    "surface": "game.strand-view",
    "view": "game",
    "mount": "drillin",
    "reads": [
      {
        "state_path": "graph",
        "reader": "StrandView",
        "visible_when": "always"
      }
    ],
    "notes": "Strand visualization — subset of thread view focused on specific entity pairs.\n"
  },
  {
    "surface": "game.chapter-ledger",
    "view": "game",
    "mount": "drillin",
    "reads": [
      {
        "state_path": "chapterArchive",
        "reader": "ChapterLedger",
        "visible_when": "always"
      },
      {
        "state_path": "unifiedActions",
        "reader": "ChapterLedger",
        "visible_when": "always"
      }
    ],
    "notes": "Chapter Ledger (THR-603): one list merging active encounters (live unifiedActions) and resolved chapters (chapterArchive), newest first, filtered/paginated. Player-authored density's load-management surface.\n"
  },
  {
    "surface": "game.chapter-view",
    "view": "game",
    "mount": "drillin",
    "reads": [
      {
        "state_path": "chapterArchive",
        "reader": "ChapterView",
        "visible_when": "always"
      },
      {
        "state_path": "unifiedActions",
        "reader": "ChapterView",
        "visible_when": "active chapter"
      }
    ],
    "notes": "Chapter View (THR-603): full reading surface for one chapter — per-step prose as enriched, step outcomes in the narrative lexicon, the player's own choices, complications, aftermath. Drill-in from a ledger row or Chapters tab.\n"
  },
  {
    "surface": "game.harvest-screen",
    "view": "game",
    "mount": "modal",
    "reads": [
      {
        "state_path": "chronicle",
        "reader": "HarvestScreen",
        "visible_when": "always"
      },
      {
        "state_path": "echoStates",
        "reader": "HarvestScreen",
        "visible_when": "always"
      },
      {
        "state_path": "worldSoul",
        "reader": "HarvestScreen",
        "visible_when": "always"
      },
      {
        "state_path": "cycle",
        "reader": "HarvestScreen",
        "visible_when": "always"
      }
    ],
    "notes": "End-of-cycle harvest ritual. Only appears when phase === 'harvest'.\n"
  },
  {
    "surface": "game.intervention-confirm",
    "view": "game",
    "mount": "modal",
    "reads": [
      {
        "state_path": "essencePool",
        "reader": "InterventionConfirm",
        "visible_when": "always"
      }
    ],
    "notes": "Divine intervention confirmation step. Nudge / whisper / vision selection.\n"
  },
  {
    "surface": "game.choice-set-modal",
    "view": "game",
    "mount": "modal",
    "reads": [
      {
        "state_path": "unifiedActions",
        "reader": "ChoiceSetModal",
        "visible_when": "active encounter with choice set pending (THR-73)"
      }
    ],
    "notes": "Player choice-set resolution within an encounter.\n"
  },
  {
    "surface": "game.agenda-picker",
    "view": "game",
    "mount": "modal",
    "reads": [
      {
        "state_path": "strategicState",
        "reader": "AgendaPicker",
        "visible_when": "always"
      }
    ],
    "notes": "Agenda selection for strategic actions.\n"
  },
  {
    "surface": "game.scry-overlay",
    "view": "game",
    "mount": "modal",
    "reads": [
      {
        "state_path": "graph",
        "reader": "ScryOverlay",
        "visible_when": "always"
      }
    ],
    "notes": "Scry (divine vision) overlay. Reveals hex contents per scry state.\n"
  },
  {
    "surface": "game.journey-vignette-modal",
    "view": "game",
    "mount": "modal",
    "reads": [
      {
        "state_path": "pendingVignettes",
        "reader": "JourneyVignetteModal",
        "visible_when": "pendingVignettes non-empty"
      }
    ],
    "notes": "Journey-beat vignette popup.\n"
  },
  {
    "surface": "game.encounter-veil",
    "view": "game",
    "mount": "modal",
    "reads": [
      {
        "state_path": "unifiedActions",
        "reader": "EncounterVeil",
        "visible_when": "watched encounter active"
      },
      {
        "state_path": "graph",
        "reader": "EncounterVeil",
        "visible_when": "always"
      }
    ],
    "notes": "Encounter-in-progress overlay (watched mode).\n"
  },
  {
    "surface": "game.inspector",
    "view": "game",
    "mount": "always",
    "reads": [
      {
        "state_path": "graph",
        "reader": "InspectorHost",
        "visible_when": "a subject is open (any link, card, map click or notification — every open goes through useRefRouter)"
      },
      {
        "state_path": "graph",
        "reader": "InspectorPage",
        "visible_when": "a subject is open; docked, wide or Full"
      }
    ],
    "notes": "The Inspector (THR-1876 / THR-1911; the retired sheets, detail column, hex-zoom and location views and the ActionDrawer deleted in THR-1912). One docked panel for every place, person and power: the subject's page is selectSubjectPage over the page-layout table (DETAIL_PAGE_REGISTRY), read from the view models, never from a component's own memo. Sizes docked / wide / Full; history, trail, pin, Follow; the Act row casts (plan § D9 way 1). Every caller opens through useRefRouter — card at the registry row's opensAt, sheet wide.\n"
  },
  {
    "surface": "game.inspector.land-page",
    "view": "game",
    "mount": "always",
    "reads": [
      {
        "state_path": "graph",
        "reader": "InspectorPage",
        "visible_when": "a hex is open (a click on open land, or on a city's hex)"
      },
      {
        "state_path": "hexRevelation",
        "reader": "InspectorPage",
        "visible_when": "the hex holds discovered sites (In this land)"
      }
    ],
    "notes": "The land page (plan § D10): the hex's own page in the Inspector, carrying the land prose HexChronicle used to tell and the In this land index (People, Holder, sites). Replaces the hex-zoom view and its HexBreadcrumb / HexSidebar / HexChronicle (THR-1912).\n"
  },
  {
    "surface": "game.inspector-lab",
    "view": "game",
    "mount": "drillin",
    "reads": [
      {
        "state_path": "graph",
        "reader": "InspectorLab",
        "visible_when": "?view=inspector-lab (dev view)"
      }
    ],
    "notes": "The Inspector lab (plan § D12): one real example of every page kind plus the stress case at docked, wide and Full. A dev view — may scroll, never a player path.\n"
  },
  {
    "surface": "game.hover-card",
    "view": "game",
    "mount": "modal",
    "reads": [
      {
        "state_path": "graph",
        "reader": "HoverCard",
        "visible_when": "an EntityLink was dwelt on for HOVER_CARD_DELAY_MS"
      }
    ],
    "notes": "Law 20 Tier 1½ (THR-1490) — the glance between a tooltip and a card: header plus HOVER_CARD_MAX_SECTIONS sections, anchored beside the name, dismissed on leave. Never interactive (pointerEvents: none), so there is no hover-gap to fall into.\n"
  },
  {
    "surface": "game.debug-panel",
    "view": "game",
    "mount": "modal",
    "reads": [
      {
        "state_path": "graph",
        "reader": "DebugPanel",
        "visible_when": "always"
      },
      {
        "state_path": "unifiedActions",
        "reader": "DebugPanel",
        "visible_when": "always"
      },
      {
        "state_path": "tickEvents",
        "reader": "DebugPanel",
        "visible_when": "always"
      }
    ],
    "notes": "Dev-only diagnostic panel. Keyboard: ` toggles, F1 opens to CLI tab. Not prod-visible but part of the dev IA. The 'Prose QA' tab (THR-490) audits the static authored-content library via collectAuthoredProse + the prose-quality scorer — reads content tables, not GameState; scriptable via __DEBUG.proseQualityReport() / scoreProseEntry(id).\n"
  },
  {
    "surface": "game.narrative-feed",
    "view": "game",
    "mount": "drillin",
    "reads": [
      {
        "state_path": "recentEvents",
        "reader": "NarrativeFeed",
        "visible_when": "always"
      }
    ],
    "notes": "Rolling narrative prose feed. Drives player's sense of what's happening.\n"
  },
  {
    "surface": "codex.main",
    "view": "codex",
    "mount": "always",
    "reads": [
      {
        "state_path": "(content tables — not GameState)",
        "reader": "Codex",
        "visible_when": "view === 'codex'"
      }
    ],
    "notes": "Browsable catalog of divine actions, possessions, conditions, agreements,\nmortal actions. Content-driven, not game-state-driven. Drives CodexSidebar +\nCodexCard + CodexDetailPanel.\n",
    "openUrl": "/?view=codex"
  },
  {
    "surface": "codex.sidebar",
    "view": "codex",
    "mount": "drillin",
    "reads": [
      {
        "state_path": "(content tables)",
        "reader": "CodexSidebar",
        "visible_when": "always"
      }
    ],
    "notes": "Codex category nav.\n"
  },
  {
    "surface": "codex.detail-panel",
    "view": "codex",
    "mount": "drillin",
    "reads": [
      {
        "state_path": "(selected content item)",
        "reader": "CodexDetailPanel",
        "visible_when": "always"
      }
    ],
    "notes": "Codex item detail view.\n"
  },
  {
    "surface": "styleguide.main",
    "view": "styleguide",
    "mount": "always",
    "reads": [
      {
        "state_path": "(none — static component samples)",
        "reader": "StyleGuide",
        "visible_when": "view === 'styleguide'"
      }
    ],
    "notes": "Visual component reference at src/components/StyleGuide/StyleGuide.tsx.\nAll shared primitives rendered with sample data.\n",
    "openUrl": "/?view=styleguide"
  },
  {
    "surface": "cms.content-browser",
    "view": "cms",
    "mount": "always",
    "reads": [
      {
        "state_path": "(content tables — not GameState)",
        "reader": "ContentBrowser",
        "visible_when": "view === 'cms'"
      }
    ],
    "notes": "Top-level CMS browser. Drives CMSMainPanel + CMSDetailPanel.\n",
    "openUrl": "/?view=cms"
  },
  {
    "surface": "cms.main-panel",
    "view": "cms",
    "mount": "drillin",
    "reads": [
      {
        "state_path": "(content table selection)",
        "reader": "CMSMainPanel",
        "visible_when": "always"
      }
    ],
    "notes": "CMS table view — active content table being browsed.\n"
  },
  {
    "surface": "cms.detail-panel",
    "view": "cms",
    "mount": "drillin",
    "reads": [
      {
        "state_path": "(content item selection)",
        "reader": "CMSDetailPanel",
        "visible_when": "always"
      }
    ],
    "notes": "CMS item detail view.\n"
  },
  {
    "surface": "ul.dashboard",
    "view": "ul",
    "mount": "always",
    "reads": [
      {
        "state_path": "(static UL JSON snapshot)",
        "reader": "UbiquitousLanguageDashboard",
        "visible_when": "view === 'ul'"
      }
    ],
    "notes": "Browseable Ubiquitous Language dashboard. Reads ul-dashboard.generated.json.\nDrives ULSidebar + ULTermTable + ULDetailPane + ULSearchBox + ULDriftBadge.\n",
    "openUrl": "/?view=ul"
  },
  {
    "surface": "ul.sidebar",
    "view": "ul",
    "mount": "drillin",
    "reads": [
      {
        "state_path": "(static UL JSON snapshot)",
        "reader": "ULSidebar",
        "visible_when": "always"
      }
    ],
    "notes": "Shard tabs and filter chips for the UL dashboard.\n"
  },
  {
    "surface": "ul.detail-pane",
    "view": "ul",
    "mount": "drillin",
    "reads": [
      {
        "state_path": "(selected term)",
        "reader": "ULDetailPane",
        "visible_when": "always"
      }
    ],
    "notes": "Selected-term detail view with markdown body and See-Also chips.\n"
  }
];
