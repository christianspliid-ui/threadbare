# Claude Code Prompt — Tiered Backstory Generation

Paste everything below the line into Claude Code.

---

Implement the Tiered Backstory Generation system from `Docs/plans/2026-03-17-tiered-backstory-generation-design.md`. Read the full design doc before writing any code. Load the `prose-resolver` skill for content authoring guidelines.

## Phased implementation order

### Phase 1: Types and infrastructure

1. Add `BackstoryLayer` (extends `ProseLayer` with `stratum: 1|2|3|4`), `BackstoryResult`, and `BackstoryStratum` types to `src/types/prose.ts`
2. Add `'revelation'` to the `AlertIcon` union in `src/types/notification.ts`
3. Add `readBackstoryTier: 0|1|2|3|4` to `InfluenceRelationshipProperties` in `src/types/influence.ts` (default `0`)
4. Add `BACKSTORY_CONSTANTS` to `src/types/prose.ts` — all tunables from the design doc (`CONTRADICTION_THRESHOLD`, `FEAR_THRESHOLD`, `ESSENCE_BRACKET_LOW/MEDIUM/HIGH`, `NEW_BADGE_FADE_MS`, `BACKSTORY_SECTION_MIN_KNOWLEDGE`)
5. Create `src/data/backstory-content.ts` with all 12 content tables from the design doc. Start with 2-3 templates per key. Follow Threadbare Tone Rules strictly — read the Tonal Bible from Notion (page `31e2b241-dfb0-8135-a77c-c6a3ee05598e`) and Character Archetypes wiki (page `31e2b241-dfb0-8124-aa86-d7afd09df740`) before writing any prose. Each template is 1-3 sentences, uses `{name}`, `{culture}`, `{sphere}`, `{bond}`, `{trait}`, `{value}`, `{fear}`, `{left_pole}`, `{right_pole}` placeholders as specified per table.
6. Write data tests in `src/data/backstory-content.test.ts` — validate structure, placeholder consistency, key coverage, minimum 2 templates per key.

### Phase 2: Resolvers

7. Create `src/engine/backstoryResolvers.ts` with all 9 resolvers following the exact pattern from `src/engine/proseResolvers.ts`:
   - **Stratum 1:** `surfaceOriginResolver` (archetype+culture), `surfaceSphereResolver` (primarySphere)
   - **Stratum 2:** `bondHistoryResolver` (strongest relates_to bond), `traitOriginResolver` (first has_trait edge), `turningPointResolver` (dominant axiological value)
   - **Stratum 3:** `contradictionResolver` (near-zero axiological pairs where |value| < CONTRADICTION_THRESHOLD), `fearResolver` (shadow of strongest values, reuse Psyche Strands fear derivation logic from `src/engine/strands.ts`), `hiddenMotiveResolver` (cooperationStrategy + values)
   - **Stratum 4:** `storyArcResolver` (archetype storyShape + ticksAtCurrentTier for arc phase), `divineTransformationResolver` (worships edge totalEssenceSpent → essence bracket)
   - Every resolver: fail-soft `return []`, use `pickTemplate` + seeded PRNG via `mulberry32` from `src/lib/prng.ts`, use `replacePlaceholder`, set `source` field to function name, include `stratum` field.
8. Write TDD tests in `src/engine/backstoryResolvers.test.ts` — test each resolver returns correct layers for known graph shapes, test fail-soft on missing data, test determinism.

### Phase 3: Generator and composition

9. Create `src/engine/backstoryGenerator.ts` with public API:
   ```typescript
   generateTieredBackstory(agentId, graph, seed, influenceTier): BackstoryResult
   ```
   - Runs all resolvers, filters layers where `stratum <= influenceTier`, groups by stratum, composes each stratum's layers into prose blocks.
   - Seed derivation: follow `proseGenerator.ts` pattern — `seed + Math.abs(idHash)` using the canonical hash.
   - Returns `BackstoryResult` with `text` (all strata joined), `strata` array (individual blocks with titles from design doc), and `maxStratum`.
   - The `isNew` field on each stratum: compare `stratum.tier > readBackstoryTier` from worships edge.
10. Write tests in `src/engine/backstoryGenerator.test.ts` — tier filtering, stratum ordering, determinism, cumulative composition.

### Phase 4: Notification integration

11. Wire backstory unlock events into the tick loop. Find where tier promotions happen (likely orchestrator.ts — note that `checkTierPromotion()` exists in `influence.ts` but may not be called yet). When an agent is promoted to tier >= 1, emit a TickEvent:
    ```typescript
    { type: 'backstory_unlock', message: `${agentName}'s story deepens`, actorId, sphere, notification: { channel: 'alert', icon: 'revelation' } }
    ```
    Add `'backstory_unlock'` to the TickEvent type union in `gameState.ts`.

### Phase 5: UI integration

12. Modify `AgentProfileModal.tsx` — add "Their Story" section below existing content:
    - Call `generateTieredBackstory()` with the agent's influence tier
    - Render unlocked strata as prose blocks with stratum titles ("What They Say", "What They Lived", "What They Hide", "What They Are") as subtle headers in sphere accent color
    - Show `✦ New` badge (sphere-colored, fades after NEW_BADGE_FADE_MS) on the most recently unlocked stratum
    - Show locked strata as dimmed placeholders with evocative locked text from the design doc and the required tier name
    - Two-key gating: only show section if knowledge level >= 'recognised' AND influence tier >= 1. If knowledge is high enough but tier is 0, show: *"You sense there is more to {name}'s story, but the threads between you are too thin to read it."*
    - When opened from a revelation alert, auto-scroll to the newly unlocked stratum

13. Modify `AgentDetailPanel.tsx` — add backstory teaser:
    - One line from Surface Story (stratum 1, first sentence) when tier >= 1 and knowledge >= recognised
    - "Read more →" link that opens AgentProfileModal
    - `✦` indicator next to "Their Story" if unread strata exist

14. Wire `readBackstoryTier` update — when the profile modal renders with the backstory visible, update `readBackstoryTier` on the worships edge to match current tier.

15. Add revelation icon to the alert tray icon set — open book or scroll aesthetic, consistent with existing icon style.

### Phase 6: Content enrichment

16. Expand all content tables to 3-4 templates per key (target ~383 total). Use the Notion Character Archetypes wiki for creative fuel. Ensure each stratum has a distinct narrative voice per the design doc (tavern gossip → biographer → confessor → thread-reader).

## Key constraints

- **No LLM calls.** Everything is template + seeded PRNG.
- **Import `mulberry32` from `src/lib/prng.ts`** — don't inline it.
- **Fail-soft everywhere** — missing graph data → empty array, never throw.
- **Deterministic** — same seed + same graph = same backstory.
- **Threadbare tone** — lead with beauty, let darkness emerge from details. No "eldritch", "arcane", "mystical". Present tense observation. Concrete nouns. See the prose-resolver skill for the full tone rules.
- **Run `npm test` after each phase** and fix any failures before proceeding.
