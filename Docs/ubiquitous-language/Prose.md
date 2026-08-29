# Ubiquitous Language — Prose

Content-adjacent shard. Terms covering the prose doctrine (narrator mode, registers), the prose pipeline (resolvers, enrichment, strata, lexicon), and narrative output. *(Shard refreshed 2026-08-29, THR-1372 — it predated the register model and Prose Doctrine v2 entirely; the doctrine-era terms below were added then.)*

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

Layered prose tiers that compose a full narrative beat from engine signals. Different strata contribute different narrative roles (immediate action, context, consequence). Strata are assembled by the prose pipeline from multiple sources and then resolved together, allowing modular prose composition without monolithic templates. *(Entry corrected 2026-08-29, THR-1372: the original listed "atmosphere" as a stratum register — under Narrator Mode, atmosphere without a job is banned on encounter surfaces; strata carry roles, and every stratum's prose holds to the doctrine of its surface.)*

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

---

### Narrator Mode

**Aliases:** Prose Doctrine v2, GM Narration
**Also see:** `[[Register]]`, `[[Band Fragment]]`
**Status:** canonical (added 2026-08-29, THR-1372; doctrine landed 2026-08-25, THR-1250/1251/1252)

The binding mode for every encounter surface since 2026-08-25: prose is written as a game master reading a module aloud — a narrator reporting events from outside the scene to a god reading a chronicle. Bans in-situ writing (interior sensation, camera work, atmosphere without a job) and encoded facts (state "no one dares approach it"; never the chalk line that implies it). Two v1 rules are reversed by name: foreshadow-never-announce (now: announce plainly) and show-don't-tell (now: tell). Authoritative text: the nudge authoring spec § Prose doctrine v2; navigation: `Docs/canon/prose.md`.

---

### Register

**Aliases:** Prose Register, Register Model, Plainspoken Malazan
**Also see:** `[[Narrator Mode]]`
**Status:** canonical (added 2026-08-29, THR-1372; model landed THR-609, narrowed by Doctrine v2)

The three-way classification of every player-facing string: **baseline** (the default — plain, concrete, one idea per sentence), **character** (dialogue, idiosyncratic but comprehension-first, at most one florid voice per scene), and **peak** (rationed lyricism, restricted since 2026-08-25 to the non-encounter surfaces: doom stage transitions, the Twilight Phase, World-Soul/Echo prose). Declared via the additive `register?` field; absent means baseline. Interactive text (labels, card names, effect lines) is always plain. Canon: `Docs/canon/prose.md` § the register model.

---

### Band Fragment

**Aliases:** Nudge Fragment, `bandProse` entry
**Also see:** `[[Narrator Mode]]`, the Encounters shard's `Nudge` / `Rider`
**Status:** canonical (added 2026-08-29, THR-1372; shard-crossing term — the Encounters shard owns the mechanics)

A line of prose appended to a step's outcome text when a specific nudge was active for the rolled `StepOutcome` band (`StepNudge.bandProse[outcome]`). A fragment says the god was there when the outcome happened; a **rider** (contrast) mechanically remaps the band. Every nudge owes at least one failure-band fragment — the god's hand must be traceable in failure. Base band text must read correctly with any subset of the hand active.

---

### Vagueness Field Class

**Aliases:** Scoped Vagueness, Field-Class Scoping
**Also see:** `[[Register]]`
**Status:** canonical (added 2026-08-29, THR-1372; scoping ruled THR-899, 2026-08-01)

The scope a prose field is linted under by the vagueness detectors: `outcome` (post-roll prose — band text, fragments, afterimages, aftermath overviews; evasive terms **and** natural indefinites banned), `scene` (openings, spines, vignettes; evasive only — "someone is asking around after the agent" is correct scene prose), and `interactive` (labels; evasive only, with plainness as the real bar). Intensifiers warn everywhere, fail nowhere. Single authority for the term lists: `src/data/content-eval/nudgeAuditDetectors.ts` (`countVagueness(text, fieldClass)`).

---

### Register Compliance

**Aliases:** `registerCompliance`, Register Scorer
**Also see:** `[[Register]]`
**Status:** canonical (added 2026-08-29, THR-1372; calibration verdict THR-1250)

The deterministic prose-QA dimension (`window.__DEBUG.proseQualityReport()`) measuring register drift: sentence length, rare-word density, figurative-image density, interactive-label plainness. **Report-only by settled verdict (THR-1250, 2026-08-25)** — it ranks, it does not identify defects, and a blocking version damaged the prose it protected (THR-899 precedent). Re-open only when the corpus's doctrine-v2 warning count reaches zero *and* a register regression ships through a clean brief.
