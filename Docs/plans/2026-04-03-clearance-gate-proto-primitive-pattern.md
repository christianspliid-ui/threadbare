# Clearance Gate Proto-Primitive Pattern

**Date:** 2026-04-03  
**Status:** Design seed / proto-primitive pattern  
**Backlog:** TB-104  
**Primary pressure source:** `cg.quest.gate_duty` and future checkpoint, quarantine, customs, shrine-admission, tribunal, and proof-of-innocence content

---

## Why This Exists

`cg.quest.gate_duty` is the first encounter packet that clearly exposes a quality boundary we should not fake.

The encounter is already strong on:

- pressure knot
- cast
- place support
- reputation/faction fallout
- reward and burden wiring

But its richest version wants more than plain success/failure and more than a simple hidden attachment:

- forged papers that may or may not hold up
- hidden cargo that can be discovered, planted, or misread
- a claim of innocence that can later be proven
- witnesses whose testimony can harden or soften suspicion
- clearance attempts that are not just “roll once and move on”

That is not a one-off encounter quirk. It is a reusable content shape.

So this document defines `clearance_gate` as a **proto-primitive pattern**:

- reusable across many encounters
- additive to the current effect/attachment runtime
- explicit about what it owns
- maintainable because it centralizes the shell instead of hiding logic inside each encounter

---

## Design Intent

A `clearance_gate` is a reusable authored shell for situations where:

1. an actor, item, attachment, document, person, or claim is under scrutiny
2. there are one or more attempts to clear, expose, inspect, validate, or condemn it
3. the result should change later options, not just the immediate outcome text
4. the world should remember whether the subject was cleared, exposed, compromised, or unresolved

This is a shell for **inspection drama** and **proof drama**.

It should support:

- border gates
- contraband checks
- forged seals
- legal warrants
- shrine admission
- plague/quarantine passes
- letters of introduction
- proof of innocence
- planted evidence
- access tokens that can later be revoked

---

## What Good Looks Like

The shell should help encounters create:

- visible stakes before the roll
- meaningful `success_at_cost`
- cool failure instead of dead-end rejection
- persistent state that other encounters can read later
- world coherence without duplicate bespoke logic

The shell should **not** be:

- a generic stat penalty
- a hidden boolean flag with no authored meaning
- a pile of per-encounter custom code
- a reason to duplicate NPCs, locations, or scene props

---

## Core Pattern

A `clearance_gate` has four parts:

### 1. Subject

What is under scrutiny.

Examples:

- a courier
- a cargo crate
- a writ of passage
- a holy seal
- a refugee family
- a suspect official
- a rumor or accusation

The subject must be a real bound object or cast member already attached to the encounter packet or support bundle.

### 2. Gate

The authority, threshold, or social mechanism that decides whether the subject passes.

Examples:

- checkpoint guard
- quarantine inspector
- shrine attendant
- city clerk
- tribunal scribe
- customs captain
- suspicious crowd

The gate should usually bind to pre-seeded or reuse-first support objects, not conjure a fake authority.

### 3. Signals

The evidence pressure around the subject.

Examples:

- forged papers
- hidden compartment
- contradictory witness
- legitimate seal
- missing inventory mark
- known faction insignia
- visible fear
- proof of service

Signals can be:

- known from the start
- hidden until a reveal
- introduced by later action
- strengthened or weakened by prior steps

### 4. Gate State

The shell’s lasting state.

Minimal state vocabulary:

- `pending`
- `cleared`
- `flagged`
- `exposed`
- `compromised`
- `unresolved`

This state must be inspectable by later content and should be meaningful enough to drive follow-on hooks.

---

## Authoring Rules

### Reuse-first

The shell must bind to existing world support before creating anything new.

Examples:

- reuse the existing gate captain
- reuse the actual courier if one is already seeded into the scene
- reuse the actual pass, seal, or witness object if the encounter packet already attached it

### Subject-specific, not scene-global

The shell should attach to a concrete subject, not a vague encounter mood.

Good:

- “this courier’s papers were flagged”
- “this witness later confirms the actor’s restraint”

Bad:

- “the gate was suspicious” with no object of memory

### Persistent enough to matter

If the shell affects future content, its state must persist in a readable way.

That does not always mean a new graph node.
It can be:

- attachment state
- effect shell state
- encounter aftermath state keyed to a subject
- a support object with a durable property

But it must not vanish if later content is supposed to care.

### Reveal is authored, not pure randomness

Reveals should come from:

- step success/failure
- explicit inspection actions
- pressure escalation
- authored hidden variants

The shell may use seeded authored tables, but it should not become an opaque RNG slot machine.

### Failure must create pressure

A failed clearance should usually do one of:

- delay and increase scrutiny
- harden future gates
- create a witness
- add suspicion
- force a costed second route
- produce mixed truth, not instant content death

---

## Proto Data Model

This is the target shape, not final code.

```ts
type ClearanceGateState =
  | 'pending'
  | 'cleared'
  | 'flagged'
  | 'exposed'
  | 'compromised'
  | 'unresolved';

type ClearanceSignalVisibility = 'known' | 'hidden' | 'revealed';

interface ClearanceSignalConfig {
  key: string;
  label: string;
  visibility: ClearanceSignalVisibility;
  weight?: number;
  tags?: string[];
  revealOn?: string[];
  suppressOn?: string[];
}

interface ClearanceGateConfig {
  id: string;
  subjectBindingKey: string;
  authorityBindingKey: string;
  witnessBindingKeys?: string[];
  locationBindingKey?: string;
  initialState?: ClearanceGateState;
  signals: ClearanceSignalConfig[];
  passState?: ClearanceGateState;
  failState?: ClearanceGateState;
  escalateState?: ClearanceGateState;
  retryPolicy?: 'none' | 'costed_retry' | 'new_evidence_only';
  persistence: 'scene-only' | 'must-persist';
  followOnTags?: string[];
}
```

Important maintainability rule:

- the shell config names **bindings**, not hard-coded node ids
- the encounter support bundle remains responsible for binding real objects
- `clearance_gate` remains responsible for state transitions and reveal logic

That separation keeps the shell reusable.

---

## Runtime Ownership

To stay maintainable, the shell should be split into three responsibilities:

### 1. Encounter/support bundle layer

Owns:

- reuse-first binding of subject, authority, witnesses, place
- lazy materialization when allowed
- persistence contracts for bound objects

Does **not** own:

- pass/fail reveal logic
- shell transitions

### 2. Shell runtime layer

Owns:

- shell state
- reveal state for signals
- clearance attempts
- transitions like `pending -> flagged -> exposed`
- retry policy

Likely home:

- a future `contentShellRuntime` or `effectShellRuntime` extension under TB-104

### 3. Encounter outcome layer

Owns:

- what the current encounter does with the shell state now
- rewards/burdens
- faction and reputation fallout
- follow-up hook seeding

This split keeps the shell generic while leaving authored encounter meaning local.

---

## Result-Band Semantics

`clearance_gate` should be compatible with the existing five-tier ladder.

### `critical_success`

- clean clearance or clean exposure
- authority gains confidence
- witnesses align in your favor
- later gates may soften or trust may rise

### `success`

- immediate objective succeeds
- shell resolves in your favor, but without surplus advantage

### `success_at_cost`

- subject clears or is exposed, but:
  - you gain scrutiny
  - a witness turns uncertain
  - a favor is spent
  - a lesser suspect slips away
  - the gate hardens for later traffic

### `failure`

- the shell does not resolve cleanly
- the subject remains flagged, delayed, or partially condemned
- later action is still possible, but under pressure

### `critical_failure`

- false arrest
- planted evidence takes hold
- the wrong subject clears while the scene turns against you
- a later proof burden is created

This is the heart of the shell’s value: it makes “inspection” content produce motion instead of a binary stop sign.

---

## Reusable Scenario Families

If this shell is good, it should immediately generalize to:

### Border / customs

- forged papers
- hidden cargo
- suspicious travelers

### Quarantine / plague

- fever pass
- false symptom claims
- contaminated goods

### Social admission

- letters of introduction
- patron endorsement
- shrine or court access

### Legal / tribunal

- proof of innocence
- planted evidence
- hostile witness
- delayed exoneration

### Faction access

- guild permit
- military writ
- black-market token
- revoked standing

If it only works for `Gate Duty`, it is not a good primitive.

---

## Interaction With Existing Systems

This shell is valuable because it naturally connects to the rest of the game.

### NPCs

- authority figures, witnesses, subjects, informants
- later recurrence as allies, rivals, or liabilities

### Factions

- clearance outcomes move trust, suspicion, leverage, and access

### Reputation

- being known as fair, harsh, corruptible, competent, or reckless

### Rewards and burdens

- commendations
- scrutiny
- warrants
- obligations
- contraband salvage

### Omens and run identity

- tyranny version emphasizes surveillance
- decay version emphasizes contagion
- conspiracy version emphasizes forged signals and planted proof

### Follow-on encounters

- appeal hearing
- witness intimidation
- second checkpoint
- merchant grievance
- exoneration request

That network coherence is exactly why this should be a primitive shell instead of bespoke flavor.

---

## Minimum Viable Version

We do not need the final grand version first.

The first strong reusable slice should support:

1. one subject
2. one authority
3. optional witness list
4. hidden or known signals
5. one reveal/update API
6. persistent gate state
7. one retry/escalation rule
8. follow-on tags for later content

That is enough to power:

- Gate Duty
- Letters of Introduction style access checks
- one proof-of-innocence or false-accusation encounter

---

## Explicit Non-Goals For Slice 1

- full legal simulation
- giant evidence graph
- universal truth-tracking engine
- multi-location pursuit logic
- replacing all suspicion or reputation systems

The point is a reusable shell, not a courtroom simulator.

---

## Acceptance Bar

We should not call `clearance_gate` ready until all of these are true:

- it binds to support-bundle objects rather than hard-coded scene entities
- it is reuse-first and idempotent
- it can express hidden and revealed signals
- it persists a meaningful state other encounters can inspect
- it supports fail-forward outcomes
- it works for at least 3 scenario families, not only Gate Duty
- it avoids bespoke logic in each encounter

---

## Recommended Next Slice

1. Add shared shell types:
   - `ClearanceGateConfig`
   - `ClearanceSignalConfig`
   - `ClearanceGateState`
2. Add shell runtime state ownership under TB-104.
3. Build one proof pack:
   - `cg.quest.gate_duty`
   - one social admission encounter using `Letters of Introduction`
   - one accusation / exoneration encounter
4. Verify:
   - reuse-first support binding
   - persistent state visibility
   - follow-on encounter hooks

---

## Main Lesson

`clearance_gate` is worth building because it solves a recurring quality problem:

encounters that want scrutiny, proof, reveal, and lingering social consequences currently have to choose between being underbuilt or becoming bespoke.

This shell gives them a third option:

**a reusable, inspectable, fail-forward state machine bound to real world objects.**
