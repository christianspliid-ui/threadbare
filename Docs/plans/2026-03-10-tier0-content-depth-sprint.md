# Tier 0: Content Depth Sprint — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Expand the thinnest prose pools to eliminate the most visible repetition in playtests — focusing on profile backstory templates (the worst bottleneck) and dilemma stakes prose (the most frequently surfaced).

**Architecture:** Pure data expansion in existing content packages. No engine changes. Each task adds new entries to existing TypeScript arrays/records, updates minimum-count test assertions, and commits. All prose follows the Threadbare Tonal Bible: lead with sensory detail, let darkness emerge from details, no superlatives, no generic fantasy language, wonder layered over grief.

**Tech Stack:** TypeScript content arrays, Vitest for validation.

**Recalibration Note:** The Golden Path sprint already expanded many pools (dilemma words 4→13-15, born names 10→28, agendas 5→8, ascendant titles 3→8 per sphere, rival profiles 8→16). This plan targets the **remaining genuine bottlenecks** — pools where 3-5 playtest sessions expose noticeable repetition.

---

## Priority Ranking (by repetition impact)

| # | Target | Current | Goal | Impact | Why |
|---|--------|---------|------|--------|-----|
| 1 | Profile MIDDLE_TEMPLATES | 8 | 16 | **Critical** | Every Tier 3 scry shows a backstory. 8 middles = visible repeats by 4th agent |
| 2 | Profile CLOSING_TEMPLATES | 8 | 16 | **Critical** | Same issue — closing lines are memorable, repeats stand out |
| 3 | DILEMMA_STAKES_PROSE | 12 (4×3) | 24 (4×6) | **High** | Dilemmas fire every ~5 ticks. 12 templates cycle fast |
| 4 | Profile QUOTE_TEMPLATES | 16 | 24 | **Medium** | Quotes are the first line players read in agent modal |
| 5 | BORN_NAMES | 28 | 40 | **Medium** | Birth events are common, names need culture tint variety |

**Estimated total time:** ~90 minutes content authoring + ~30 minutes test updates + verification.

---

### Task 1: Expand MIDDLE_TEMPLATES (8 → 16)

**Files:**
- Modify: `src/data/profile-content.ts:83-99` (MIDDLE_TEMPLATES array)
- Modify: `src/data/__tests__/profile-content.test.ts` (minimum count assertion)

**Step 1: Update the minimum-count test to expect 16**

In `src/data/__tests__/profile-content.test.ts`, find the MIDDLE_TEMPLATES describe block. Change the minimum count assertion from whatever it currently is to 16:

```typescript
it('exports at least 16 middle templates', () => {
  expect(MIDDLE_TEMPLATES.length).toBeGreaterThanOrEqual(16);
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/data/__tests__/profile-content.test.ts --reporter=verbose`
Expected: FAIL — currently 8 entries, test expects ≥16

**Step 3: Write 8 new MIDDLE_TEMPLATES entries**

Add after line 98 in `src/data/profile-content.ts`, before the closing `];`:

All new entries MUST:
- Contain `{name}`, `{trait}`, `{bond}` placeholders (matching existing pattern)
- Contain `{sphere}` placeholder (most existing entries have it)
- Be 1-2 sentences, present tense observation, Threadbare tone
- Cover different emotional registers: isolation, ambition, tenderness, dread, quiet strength, defiance, loss, transformation

**New entries to add (8):**

```typescript
  // Isolation and self-reliance
  '{name} walked alone for a long time. Their {trait} nature kept others at a careful distance, and only {bond} ever saw what that distance cost.',

  // Ambition and consequence
  'The {sphere} called to {name} with promises that matched their {trait} hunger. {bond} watched the transformation and said nothing — there was nothing left to say.',

  // Tenderness beneath armor
  'For all their {trait} reputation, {name} kept one thing gentle: the bond with {bond}. It was the crack in the armor that made everything else bearable.',

  // Dread and premonition
  'Something changed in {name} the season the {sphere} went quiet. Their {trait} certainty wavered, and {bond} noticed the way they started watching the horizon.',

  // Quiet strength
  '{name} never spoke of what the {sphere} demanded. Their {trait} silence said enough, and {bond} learned to read the weight in it.',

  // Defiance
  'When the {sphere} tried to claim {name} entirely, their {trait} stubbornness held. {bond} was the anchor — the one thread even divine power could not sever.',

  // Loss that reshapes
  'After the loss, {name} became something new — still {trait}, but colder, more precise. {bond} remembered who they had been before and grieved quietly.',

  // Transformation accepted
  '{name} did not resist the change. Their {trait} nature made them suited to what the {sphere} required, and {bond} could only watch as the person they knew became something else entirely.',
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/data/__tests__/profile-content.test.ts --reporter=verbose`
Expected: PASS — now 16 entries

**Step 5: Commit**

```bash
git add src/data/profile-content.ts src/data/__tests__/profile-content.test.ts
git commit -m "content: expand MIDDLE_TEMPLATES 8→16 for backstory variety"
```

---

### Task 2: Expand CLOSING_TEMPLATES (8 → 16)

**Files:**
- Modify: `src/data/profile-content.ts:103-119` (CLOSING_TEMPLATES array)
- Modify: `src/data/__tests__/profile-content.test.ts` (minimum count assertion)

**Step 1: Update the minimum-count test to expect 16**

Find CLOSING_TEMPLATES describe block, change assertion to 16.

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/data/__tests__/profile-content.test.ts --reporter=verbose`
Expected: FAIL

**Step 3: Write 8 new CLOSING_TEMPLATES entries**

Add after line 118 in `src/data/profile-content.ts`, before the closing `];`:

Closing templates must:
- NOT require `{bond}` or `{trait}` (existing pattern uses only `{name}` and optionally `{culture}`)
- Be 1-2 sentences, future-facing or reflective tone
- Cover: uncertainty, inevitability, quiet resolve, approaching storm, legacy, cost of power, earned peace, ironic reversal

```typescript
  // Uncertainty as power
  'No one can predict what {name} will do next. That uncertainty is itself a kind of power — and {name} knows it.',

  // Approaching storm
  'The threads around {name} are tightening. Whether this means triumph or unraveling, even the gods cannot say.',

  // Quiet resolve
  '{name} has stopped asking for permission. Whatever comes next, they will meet it standing.',

  // Legacy already forming
  'Already the {culture} speak of {name} in tones reserved for legends. Whether that legend ends in glory or cautionary tale remains unwritten.',

  // Cost acknowledged
  '{name} knows the price of what they carry. They have counted the cost and chosen to pay it — not because they must, but because no one else will.',

  // Earned peace (rare, wonder-tinted)
  'For now, {name} rests. Not in defeat, not in victory, but in the brief stillness between storms. It will not last. It never does.',

  // Ironic reversal
  'Everything {name} fought to avoid has come to pass. And yet — here they stand, unbroken. Perhaps that was the point all along.',

  // The world watching
  'The weave bends around {name} like water around a stone. They may not know it yet, but the world is already reshaping itself to accommodate what they will become.',
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/data/__tests__/profile-content.test.ts --reporter=verbose`
Expected: PASS

**Step 5: Commit**

```bash
git add src/data/profile-content.ts src/data/__tests__/profile-content.test.ts
git commit -m "content: expand CLOSING_TEMPLATES 8→16 for backstory variety"
```

---

### Task 3: Expand DILEMMA_STAKES_PROSE (12 → 24)

**Files:**
- Modify: `src/data/narrative-content.ts:503-523` (DILEMMA_STAKES_PROSE record)
- Modify: `src/data/__tests__/narrative-content.test.ts` (count assertion if one exists)

**Step 1: Check if there's a minimum-count test for DILEMMA_STAKES_PROSE**

Run: `npx vitest run src/data/__tests__/narrative-content.test.ts --reporter=verbose` to see current test names. If a count assertion exists, update it to 24.

**Step 2: Run test to verify current state**

Expected: Either PASS (no count test) or FAIL (if count test updated)

**Step 3: Add variant B templates for each outcome×stakes combo**

The current structure has 4 outcomes × 3 stakes = 12 entries keyed as `{outcome}.{stakes}`. The engine picks by exact key, so we need a NEW keying strategy. Two options:

**Option A (recommended — array per key):** Change the record value type from `string` to `string[]` and keep both variants. This requires a small engine change in orchestrator.ts to pick from the array.

**Option B (no engine change):** Add `_v2` suffix keys and have the engine try both. More hacky.

**Go with Option A.** The change is small and correct:

In `src/data/narrative-content.ts`, change the type and add a second variant for each key:

```typescript
export const DILEMMA_STAKES_PROSE: Record<string, string[]> = {
  // MUTUAL TRUST outcomes
  'mutual_trust.low': [
    '{actor} and {target} found common ground — nothing grand, but {noun} enough to build on.',
    '{actor} nodded to {target} across the distance. A small thing. But small things are how trust begins.',
  ],
  'mutual_trust.medium': [
    '{actor} and {target} forged a bond of {adj} trust, their {noun} intertwining in ways both knew would matter.',
    'Something shifted between {actor} and {target} — a {adj} recognition, like two stones settling into the same foundation.',
  ],
  'mutual_trust.high': [
    '{actor} and {target}\'s covenant blazed eternal — {adj} and transcendent, a {noun} that would echo through ages unborn.',
    'What {actor} and {target} built together was {adj} beyond reckoning — a {noun} so complete it frightened those who witnessed it.',
  ],

  // BETRAYED outcomes
  'betrayed.low': [
    '{actor} felt a {adj} pang when {target} slipped away, leaving a small wound of {noun}.',
    '{target} was gone before {actor} understood what had happened. A {adj} absence, nothing more — but absences have weight.',
  ],
  'betrayed.medium': [
    '{actor}\'s heart shattered as {target}\'s {adj} betrayal revealed itself — the {noun} of trust unmade.',
    'The look on {actor}\'s face when {target}\'s {adj} deception surfaced — that look would haunt everyone who saw it. {noun} made visible.',
  ],
  'betrayed.high': [
    '{actor} plunged into profound {noun} as {target}\'s {adj} treachery laid bare the abyss within. A wound this {adj} would never truly heal.',
    '{actor} stood in the wreckage of everything {target} had promised. The {noun} was {adj} and absolute — the kind that remakes a person entirely.',
  ],

  // EXPLOITATION outcomes
  'exploitation.low': [
    '{actor} took what {target} offered without thought — a {noun} gesture of {adj} self-interest.',
    '{actor} barely noticed the cost to {target}. That was the {adj} part — how easy it was, how little {noun} it required.',
  ],
  'exploitation.medium': [
    '{actor} wielded {target}\'s {adj} faith like a {noun}, twisting their generosity into {noun} and {adj} dominion.',
    '{target}\'s trust became {actor}\'s instrument — shaped with {adj} precision into a tool of {noun} that served only one master.',
  ],
  'exploitation.high': [
    '{actor}\'s {adj} cruelty consumed {target}\'s very essence, leaving behind only {noun} and the {adj} ghost of who they once were.',
    'What {actor} did to {target} went beyond betrayal into something {adj} and systematic — a dismantling of {noun} so thorough it became its own kind of monument.',
  ],

  // MUTUAL DISTRUST outcomes
  'mutual_distrust.low': [
    '{actor} and {target} kept their distance — {adj}, wary, cautious in ways neither could name.',
    '{actor} and {target} passed each other like strangers. The {adj} space between them was its own kind of {noun}.',
  ],
  'mutual_distrust.medium': [
    '{actor} and {target} {verb} as one, locked in {adj} {noun}, each seeing only the other\'s {adj} potential for {noun}.',
    'Neither {actor} nor {target} would move first. The {adj} standoff hardened into something that resembled {noun} but was only fear.',
  ],
  'mutual_distrust.high': [
    '{actor} and {target} spiraled into {adj} {noun}, neither able to bridge the chasm. The distance between them grew {adj}, absolute, legendary in its {noun}.',
    '{actor} and {target} became a parable — two forces locked in {adj} opposition, their {noun} so complete it warped everything around them.',
  ],
};
```

**Step 4: Update the engine consumer**

In `src/engine/orchestrator.ts` (or wherever DILEMMA_STAKES_PROSE is consumed), find the lookup and change from direct string access to array pick:

```typescript
// Before:
const prose = DILEMMA_STAKES_PROSE[key];

// After:
const proseOptions = DILEMMA_STAKES_PROSE[key];
const prose = Array.isArray(proseOptions)
  ? proseOptions[Math.floor(rng() * proseOptions.length)]
  : proseOptions;
```

Search for all usages of `DILEMMA_STAKES_PROSE` to find the exact consumer.

**Step 5: Run tests**

Run: `npx vitest run --reporter=verbose`
Expected: All tests pass. Fix any type errors from the `string` → `string[]` change.

**Step 6: Commit**

```bash
git add src/data/narrative-content.ts src/engine/orchestrator.ts src/data/__tests__/narrative-content.test.ts
git commit -m "content: expand DILEMMA_STAKES_PROSE to 2 variants per outcome (12→24)"
```

---

### Task 4: Expand QUOTE_TEMPLATES (16 → 24)

**Files:**
- Modify: `src/data/profile-content.ts:13-39` (QUOTE_TEMPLATES array)
- Modify: `src/data/__tests__/profile-content.test.ts` (minimum count assertion — currently expects ≥12)

**Step 1: Update the minimum-count test to expect 24**

```typescript
it('exports at least 24 quote templates', () => {
  expect(QUOTE_TEMPLATES.length).toBeGreaterThanOrEqual(24);
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/data/__tests__/profile-content.test.ts --reporter=verbose`
Expected: FAIL — currently 16 entries

**Step 3: Write 8 new QUOTE_TEMPLATES entries**

Add before the closing `];` of QUOTE_TEMPLATES. Each must contain `{name}` and at least one of `{sphere}` or `{value}`. Cover emotional registers not yet present: dark humor, regret, pragmatism, awe, defiance against fate, tenderness, weariness, clarity.

```typescript
  // Dark humor
  '"{name} laughed when asked about the {sphere}. It was not a kind laugh. \'You want to know what I learned? Run.\'"',

  // Regret
  '"I was {value} once," {name} said. "Before the {sphere} taught me what that word actually costs."',

  // Pragmatism
  '"Prophecy is a luxury," {name} observed. "In the {sphere}, we deal in what is, not what should be."',

  // Awe before the divine
  '"I have seen the {sphere} move," {name} whispered. "Not as metaphor. It moved. And the world bent around it like grass before wind."',

  // Defiance against fate
  '"The threads say I am {value}," {name} told the silence. "The threads are wrong. They have been wrong before."',

  // Tenderness
  '"There is a kindness in the {sphere} that nobody speaks of," {name} said quietly. "Not because it is secret, but because it is fragile."',

  // Weariness
  '"I have been {value} for so long," {name} admitted, "that I have forgotten what the alternative feels like."',

  // Clarity after suffering
  '"Pain clarifies," {name} said, with the calm of someone who had tested the theory. "The {sphere} knows this. That is why it hurts."',
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/data/__tests__/profile-content.test.ts --reporter=verbose`
Expected: PASS — now 24 entries

**Step 5: Commit**

```bash
git add src/data/profile-content.ts src/data/__tests__/profile-content.test.ts
git commit -m "content: expand QUOTE_TEMPLATES 16→24 for agent personality variety"
```

---

### Task 5: Expand BORN_NAMES with Foundation-Tinted Names (28 → 40)

**Files:**
- Modify: `src/data/narrative-content.ts:684-702` (BORN_NAMES array)
- Modify: `src/data/__tests__/narrative-content.test.ts` (count assertion if one exists)

**Step 1: Check for minimum-count test**

Search `narrative-content.test.ts` for `BORN_NAMES`. Update any count assertion to 40.

**Step 2: Run test to verify current state**

Run: `npx vitest run src/data/__tests__/narrative-content.test.ts --reporter=verbose`

**Step 3: Write 12 new foundation-tinted born names**

The existing pool has sphere-tinted and culture-neutral names. The gap is **foundation-tinted** names (Chaos/Order/Light/Darkness axis). Add after the `// Wonder-tinted` section:

```typescript
  // Foundation-tinted (Chaos)
  'Storm Without Warning', 'The Unplanned', 'Crack in the Pattern',

  // Foundation-tinted (Order)
  'The Expected', 'Measure of the Day', 'Child of the Sequence',

  // Foundation-tinted (Light)
  'Born in Full View', 'Morning\'s Witness', 'The Clearly Seen',

  // Foundation-tinted (Darkness)
  'Shadow\'s New Thread', 'The Hidden Arrival', 'Dusk-Cradled',
```

**Step 4: Run tests**

Run: `npx vitest run src/data/__tests__/narrative-content.test.ts --reporter=verbose`
Expected: PASS

**Step 5: Commit**

```bash
git add src/data/narrative-content.ts src/data/__tests__/narrative-content.test.ts
git commit -m "content: expand BORN_NAMES 28→40 with foundation-tinted names"
```

---

### Task 6: Verification Sweep

**Step 1: Run full test suite**

Run: `npm test`
Expected: All tests pass (2,389+ tests)

**Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: No type errors

**Step 3: Run build**

Run: `npx vite build`
Expected: Clean build

**Step 4: Commit (if any fixes needed)**

---

### Task 7: Update Docs and Changelog

**Files:**
- Modify: `Docs/changelog.md`
- Modify: `Docs/project-status.md`

**Step 1: Append to changelog**

```markdown
| 2026-03-10 | src/data/profile-content.ts | Expanded MIDDLE_TEMPLATES 8→16, CLOSING_TEMPLATES 8→16, QUOTE_TEMPLATES 16→24 | Reduce backstory repetition in Tier 3 scry |
| 2026-03-10 | src/data/narrative-content.ts | Expanded DILEMMA_STAKES_PROSE 12→24 (2 variants per key), BORN_NAMES 28→40 with foundation-tinted names | Reduce dilemma and birth event repetition |
```

**Step 2: Update project-status.md**

Add entry after the CRUD Action Unification line:

```markdown
- Tier 0 Content Depth Sprint: ✅ Complete — profile backstory templates doubled (MIDDLE 8→16, CLOSING 8→16, QUOTE 16→24), dilemma stakes prose doubled (12→24 with array variants), born names expanded (28→40 with foundation-tinted names)
```

**Step 3: Commit**

```bash
git add Docs/changelog.md Docs/project-status.md
git commit -m "docs: record Tier 0 content depth sprint completion"
```

---

## Summary

| Task | Content Change | New Entries | Risk |
|------|---------------|-------------|------|
| 1 | MIDDLE_TEMPLATES | +8 (8→16) | Zero — pure data addition |
| 2 | CLOSING_TEMPLATES | +8 (8→16) | Zero — pure data addition |
| 3 | DILEMMA_STAKES_PROSE | +12 (12→24) | Low — type change `string` → `string[]` requires engine consumer update |
| 4 | QUOTE_TEMPLATES | +8 (16→24) | Zero — pure data addition |
| 5 | BORN_NAMES | +12 (28→40) | Zero — pure data addition |
| 6 | Verification | — | — |
| 7 | Docs | — | — |

**Total new prose entries: 48**
**Only engine change: Task 3** (DILEMMA_STAKES_PROSE type from string to string[], consumer update in orchestrator.ts)
**Everything else: pure content expansion with test threshold bumps.**
