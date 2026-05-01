# Ubiquitous Language — Prose

Content-adjacent shard. Terms covering the prose pipeline: resolvers, enrichment, strata, lexicon, and narrative output.

---

### IPK (Instant Prose Kernel)

**Aliases:** Instant Prose Kernel, Prose Kernel
**Also see:** `[[Resolver]]`, `[[Enrichment Placeholder]]`
**Status:** canonical

The minimal prose fragment that forms the core of a narrative beat before enrichment. An IPK contains the essential action and outcome in the most compact prose form. Enrichment Placeholders within the IPK are resolved at display time by the Resolver, expanding it into contextually rich narrative.

---

### Enrichment Placeholder

**Aliases:** Placeholder, Dynamic Variable, Enrichment Variable
**Also see:** `[[IPK]]`, `[[Resolver]]`
**Status:** canonical

A template variable (e.g., `{name}`, `{artifact}`, `{ally}`) embedded in prose that the Resolver fills in at display time by walking the world graph. Placeholders make static template prose dynamically alive — the same IPK produces different prose for different agents, locations, and world states. Pure template-based prose (without enrichment) was rejected as an architecture.

---

### Resolver

**Aliases:** Prose Resolver, Enrichment Resolver
**Also see:** `[[IPK]]`, `[[Enrichment Placeholder]]`, `[[Prose Pipeline]]`
**Status:** canonical

The prose pipeline component that walks the world graph to fill in Enrichment Placeholders at display time. The Resolver takes a prose template with placeholders and a world graph context and returns fully-formed prose. Resolvers are the boundary between static templates and dynamic narrative. Implemented in `enrichProse()`.

---

### Strata

**Aliases:** Prose Strata, Narrative Strata, Prose Layer
**Also see:** `[[IPK]]`, `[[Resolver]]`
**Status:** canonical

Layered prose tiers that compose a full narrative beat from engine signals. Different strata contribute different narrative registers (immediate action, context, consequence, atmosphere). Strata are assembled by the prose pipeline from multiple sources and then resolved together, allowing modular prose composition without monolithic templates.

---

### Narrative Lexicon

**Aliases:** Domain Lexicon, Reach Lexicon, 10-tier Lexicon
**Also see:** `[[Reach]]`, `[[Domain Capability]]`
**Status:** canonical

The 10-tier, per-Reach vocabulary table (`NARRATIVE_LEXICON` in `src/types/traits.ts`) that translates domain capability scores into prose labels. Example: stone Reach tier 5 = "Rooted", tier 9 = "Eternal". The lexicon ensures that capability levels have consistent, evocative prose expressions across all narrative contexts.

---

### Chronicle Entry

**Aliases:** Chronicle, History Entry
**Also see:** `[[Narrative Event]]`
**Status:** canonical

A persistent record of a significant event in an agent or faction's history (`ChronicleEntry` type). Chronicle entries accumulate as agents participate in encounters and world events, forming a personal narrative history. The Great Chronicle collects entries world-wide. The UI exposes agent chronicles through the agent detail panel.

---

### Narrative Event

**Aliases:** Tick Event, World Event, TickEvent
**Also see:** `[[Chronicle Entry]]`, `[[Thread Tug]]`
**Status:** canonical

A `TickEvent` produced during the tick loop carrying a prose message and optional sphere coloring, significance score, and spatial coordinates. Narrative events flow to the UI's event feed and may trigger notifications. The significance score (0–1) controls UI prominence — high-significance events produce alerts; low-significance events appear in the chronicle.

---

### Thread Tug

**Aliases:** Tug, Attention Signal
**Also see:** `[[Thread]]`, `[[Narrative Event]]`
**Status:** canonical

An attention signal (`ThreadTug`) created when a divine thread is under stress or producing notable events. Thread Tugs surface in the player's digest and thread panel to direct attention toward agents who need divine involvement. They are the bridge between the engine's continuous simulation and the player's turn-by-turn decision-making.
