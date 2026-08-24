# Encounter Pipeline: One Body Short — Package critic (Pass 3b)

> Scale: short (1 step) | Slug: one-body-short | Pass: package
> Date: 2026-08-24 | Pipeline version: 3.0 (Encounter Factory) | Batch: border-perils (THR-1221), row 5

Judged as one composed package: the prose, the chips, and the connections into game state read
together. Editorial judged the sentences; systems judged whether the ids resolve. This pass asks
the two questions neither could: **was the prose written toward its chips**, and **does the
encounter make the world larger when it ends**.

```
templateId: encounter.border.one_body_short
packageVerdict: connected
packageLeaves: The survivor from Standing the Line walks off this ground carrying a mark nobody can see — the death with no body under it, which the next border road they take can put in the open — plus, on the failure side, a grieving condition on the agent that measurably lowers their next reading of anything, and, if the god lets them speak, a cultural omen the chronicle names aloud.
```

> **Correction, 2026-08-24 — read this before the rest of the pass.** This critique judged
> `short.the_unsaid` as the encounter's strongest connection on the strength of a `knows_secret_of`
> edge minted by `secret_discovery`. **That edge never existed on any firing route.**
> `action.targetId` is `sel.entry.targetAgentId ?? sel.entry.locationId`, and
> `entry.targetAgentId` is written only for scenes aimed at an agent who already exists — never
> for a `supportBundle` actor, which is spawned *using* the resolved target. So the target was the
> location every time, `createSecretEdge` refused it, and the chip reported a write the engine had
> never performed: the Unsafe Bridge defect, in the one chip this pass nominated as exemplary.
>
> The write is now a `hidden_mark` on the survivor (`targetAgentId: '$cast:survivor'`), and the
> chip was rewritten to say so. Every claim below about the edge, the two agent sheets, and the
> divine verbs that spend leverage is **false as written** and corrected in place. Note 3 of Half A
> — *"Do not make that swap"* — is the one to read carefully: its reasoning was sound and its
> conclusion is now wrong, for a reason it could not have seen.

---

## Half A — anchoring

Four distinct chips across six band slots. Every referent checked against
`reference/anchor-catalog.generated.md` and the sentence checked for whether it names *that
particular object*.

| Chip | Band(s) | Referent | In the catalog? | Prose names it? | Verdict |
|---|---|---|---|---|---|
| `short.the_unsaid` | `critical_success`, `success` | **Corrected 2026-08-24.** The `hidden_mark` the encounter mints *on the survivor* — `secret_knowledge`, revealing on `encounter.border`. Anchored on the bearer via `$cast:survivor`, an `actor` node of `actorType: individual`. *(Was: a `knows_secret_of` edge anchored on `$target`. The edge was never written — see the correction above.)* | **Yes.** The bearer is 🔗 linked (Actors · `individual`), `visualKind: 'agent'`; the mark itself has no page, so the catalog's rule is to anchor the bearer, which is what this does | **Yes.** `detail` names the person through `{cast:survivor}` — the same binding the write uses, so the sentence and the mark cannot disagree | **anchored** |
| `short.the_faces` | `success_at_cost` | The `grieving` condition attachment template on the acting agent | **Yes.** Attachments · `condition`, 🔗 linked, `entityId` = the template node id, `visualKind: 'attachment'` — exactly as declared | **Yes.** "grieving", by the condition's own name, in both `stateNoun` and `detail` | **anchored** |
| `short.grief_without_a_grave` | `failure`, `critical_failure` | Same condition template, written from `failureMetadata` instead of band reactions | **Yes**, same row | **Yes**, same name | **anchored** |
| `short.something_gave` | `critical_failure` | The acting agent's quintessence — bearer anchored `$actor`, stat named in words | **Bearer yes** (Actors · `individual`, 🔗 linked). The Stats row asks for bearer **and** a stat `tooltipId`; the stat half has no author-writable id, recorded honestly in the packet rather than faked | **Yes.** "their quintessence", and the bearer is the person the sentence is about | **anchored**, with the stat-half gap recorded |

**Half A result: 0 folds, 0 binds.** Nothing in this encounter is scene fiction wearing a chip
frame. Every referent is a graph object the encounter itself writes, which the catalog's first
ratified clarification explicitly admits ("an object the encounter itself creates counts as
existing"), and every sentence names the specific object rather than a category. The Bridge's
failure mode — *"the river crossing"*, landscape fiction with no node behind it — has no analogue
here.

Three notes that are observations, not verdicts:

1. **The trap was live and correctly avoided.** Two of the four chips anchor an *attachment
   template*, which does click; the other two anchor agents, which click. Nothing in this
   encounter depends on a `named`-only anchor, so the "do not fold what cannot be clicked" trap
   never had to fire. It is worth recording anyway that the quintessence chip is anchored at the
   bearer and would have been legal even if the bearer did not route a click.
2. **`concepts` decorates a substring that is not the object's name.** `short.the_unsaid` now
   declares `{ text: 'a mark nobody can see', entityId: '$cast:survivor' }` — so that phrase
   carries the bearer's link. Same reading as before: the mark has no page of its own, so the
   catalog's rule is to anchor the bearer, and `applyConceptDecorations` runs *after* the
   narrative linker, which has already linked the survivor's name in the same sentence. Two
   routes to the same person from one sentence. Harmless, mildly redundant, and unfixable without
   a `secret.*` tooltip — which the packet files as a corpus-wide ask (§ 8.4c). Left alone.
   *(Was `{ text: 'a secret', entityId: '$target' }`.)*
3. ~~**The `$target` anchor is the right choice and the tempting alternative is worse.**~~
   **This note was right about the rule and wrong about the facts, and it is the most instructive
   thing in the pass.** It reasoned: `secret_discovery` reads `action.targetId`, so `$target` is
   *the same value the write used* — rule 0c, correctly applied — and re-anchoring to
   `$cast:survivor` would make the chip render correctly while the write silently refused,
   converting a visible failure into an invisible one. Every step of that is sound **given that
   the write could ever land.** It could not. `action.targetId` is the location on every firing
   route, so the write refused on all of them and `$target` was faithfully pointing at a campsite
   — rule 0c satisfied by a write that never happened.

   The swap that was actually made is not the one this note refused. It did not move the anchor
   and leave the write alone; it **moved the write** to `hidden_mark`, which carries its own
   `targetAgentId`, and then followed it with the anchor. Anchor and write are on
   `$cast:survivor` together, so rule 0c holds in the sense this note meant it — the chip points
   at the exact endpoint the write used — and now the write happens.

   **The lesson for the next critic: rule 0c is a check that the anchor matches the write, not
   that the write is live.** Both must be asked, and this pass asked only the first.

---

## The `?spawn=` problem — **resolved 2026-08-24, and it was never only a `?spawn=` problem**

**This whole section is superseded.** It read the falsity as a review-tooling gap: `?spawn=`
targets a location, so `$target` renders a campsite, while "under every route the game actually
uses — the parent's seed, and the CLI's `spawn encounter-context … --agent <survivor>` —
`$target` is the survivor and the chip is exactly true." **The premise is false.** `?spawn=` was
not the odd route out; it was the honest one. `action.targetId` is
`sel.entry.targetAgentId ?? sel.entry.locationId`, `entry.targetAgentId` is written only for
scenes aimed at a pre-existing agent, and the seeded route copies the parent's `targetId`, a
location by the same argument. The chip was false on **every** route — `?spawn=` merely made it
visible by putting a campsite's name in the sentence.

With the write moved to `hidden_mark` on `$cast:survivor` and the chip re-anchored to match, all
five failures below are gone, on all routes: `prepareDebugEncounterSpawn` prepares the support
bundle before creating the action, so `$cast:survivor` binds under `?spawn=` too. **The review
link now renders these two bands honestly and the CLI workaround is unnecessary.** The
`DebugSpawnEncounterOptions.targetQuery` deferral is no longer needed for this encounter; whether
it is worth having for others is a separate question this pass should not have bundled with a
content defect.

<details>
<summary>The section as originally written (superseded)</summary>

The systems pass traced this end to end and it is real. Stated here in review terms, because it
lands on the director's own link.

**Affected: `short.the_unsaid` only — the `critical_success` and `success` bands.** The other
four chip slots (`success_at_cost`, `failure`, `critical_failure`) anchor
`trait.condition.grieving` and `$actor`, both of which resolve identically under every firing
route. Those three bands review honestly.

Clicking
`?view=game&seeded&size=medium&spawn=encounter.border.one_body_short&outcome=critical_success`,
the director will see:

- **A chip that renders and is false.** `prepareDebugEncounterSpawn`
  (`src/engine/debugEncounterTools.ts:434-440`) always sets `targetId: locationId`, so `$target`
  resolves to the agent's own location node. The chip renders `BOND · a secret held`, declaring
  `visualKind: 'agent'` for a node that is not an agent.
- **A sentence that is grammatical and untrue.** `{target}` substitutes the location's *name*
  twice: *"They now hold a secret about Thornwood Camp: what Thornwood Camp watched leave this
  ground and did not report."* A place does not watch and does not fail to report.
- **No edge behind either of them.** `createSecretEdge` refuses a non-actor endpoint
  (`secretGeneration.ts:325-337`), traces it, and writes nothing. The agent's Secrets list stays
  empty.
- **A correct overview immediately above the false chip.** The `critical_success` overview uses
  `{cast:survivor}`, not `{target}`, so the survivor's real name appears one line above a chip
  naming a campsite. That juxtaposition is what will read as a content defect and is not one.
- **Reproducible, not intermittent.** `?outcome=` pins the band at the tail of resolution and
  does not touch the target, so the falsity appears on every click, and
  `getOutcomePinVerdict()` will report `band_rendered` — the pin is working; the target is not.

**This is a review-tooling defect, not a chip defect, and the chip must not be folded to hide
it.** Under every route the game actually uses — the parent's seed, and the CLI's
`spawn encounter-context … --agent <survivor>` — `$target` is the survivor and the chip is exactly
true. Folding the encounter's single strongest connection to accommodate a debug URL would be the
Bridge failure in reverse. The fix is the `targetQuery` deferral the systems pass already scoped
(`DebugSpawnEncounterOptions`, two files); until it lands, **review these two bands through the
CLI, and treat the `?spawn=` rendering of them as known-false.** That belongs in the batch report
as a caveat on the review link, in the director's words, not as a note in this file only.

</details>

---

## Half B — what this encounter leaves behind

| What it leaves | Written by | What reads it | Would the player see it happen? |
|---|---|---|---|
| **A hidden mark on the survivor** — `secret_knowledge`, severity 0.45, revealing on `encounter.border` *(corrected 2026-08-24; this row read "a `knows_secret_of` edge, actor → the survivor", which no route ever wrote)* | `hidden_mark` on `successMetadata`, `targetAgentId: '$cast:survivor'` (fires on `critical_success`, `success`, `near_miss`) | `encounterScoring.ts:1261` → `evaluateMarkReveals` boosts the *survivor's* later `encounter.border` candidates every tick they score; `consumeMatchingMarks` rolls it at the resolution of one, at ~40% (severity × `REVEAL_PROBABILITY_MULT`), and a reveal writes a chronicle line through `hiddenMarkProse.ts`'s `secret_knowledge` table; mark decay runs it out on its own clock | **Once, and loudly, when it fires.** The chip at the ending, then a chronicle line naming the label the day the survivor's silence cracks. **Not on any agent sheet** — hidden marks surface only in the debug panel, which is the point of them and the honest limit of this row. The old claim of *"the Secrets row on two agent sheets"* was inspectability the write never had, and would not have had even if the edge had been minted, since it was not being minted |
| **`grieving` on the acting agent** | `condition_attachment` — `failureMetadata` on the two failure bands, and both re-declared band reactions on `success_at_cost` | The condition's `domainContributions { heart: -0.08, eye: -0.05 }` feed capability scoring, so the next `eye` test is measurably harder; duration/expiry runs it out | **Yes.** The chip, then the Attachments tab with a live duration, then a visibly lower forecast the next time the agent is asked to read anything |
| **A cultural omen, global scope** | `emit_omen` on the `short.say_the_count` reaction (god-chosen); a second, different one on the Omen card's grant | `phaseAgentDecision.ts:620` → `deriveEmittedOmenEncounterBias` biases `assist` / `trade` / `lead` draws for every agent in scope; `phaseOmenAgenda` runs its life; omen vocabulary feeds `{omen_*}` enrichment in other encounters' prose | **The telling, yes — the drift, no.** `emit_omen` posts a chronicle event carrying the `narrativeHook` verbatim at ~0.6 significance, so the player reads *"A death was counted on the border with no body under it, and the telling has started."* The encounter-draw bias it also causes is invisible, and correctly not chipped |
| **A second hidden mark, `secret_knowledge`, revealing on `encounter.border` — on the *actor*** | The Long Game card's grant (severity 0.55), which names no target and so falls through to the acting agent. Different bearer, different label and different route from the step's mark above: this one exists only if the god spends on the card | `evaluateMarkReveals` / `consumeMatchingMarks` at the next `encounter.border.*` resolution the bearer draws — every row of this batch and every later one in the family | **Yes when it fires.** ~50% at first eligible draw, and a reveal writes a `ripple_consequence` chronicle event at 0.7 significance — above the toast threshold |
| **An intelligence record, `military_position`** | The Whisper card's grant | `encounterScoring.ts:1267` → `findActionableIntelligence`, whose `military_position` matchers are `war` / `siege` / `patrol` / `garrison` / `ambush`. Two of those match live template ids by substring — **`encounter.border.the_garrisons_price` (this batch's row 6) and the road-ambush family** | **Partly.** It renders on the intelligence surface and it biases the agent toward two specific later encounters, but the bias itself is silent |
| **A possession** | `rewardPool` draw on step success, tier scaling with the band | The engine's own PRIZE chip; the agent's possessions thereafter | **Yes.** An object with a page, on the sheet, permanently |
| **A quintessence loss (−0.06, and −0.04 more if the god chooses silence)** | `quintessence_shift` on `failureMetadata`, and on the `carry_it_alone` reaction | `phaseQuintessence` applies it next tick with clamping, dissolution checks and loss-prevention intact | **Weakly — this is the one honest soft spot.** See below |
| **(Inbound) it consumes the parent's mark** | — | This template *is* `encounter.border.*`, so `standing_the_line`'s `hidden_mark` — *"The count on the road came up one short"*, bearer = the actor, severity 0.35 — is eligible for consumption **by this very encounter**, at ~31.5% | **Yes when it rolls.** A toast-level chronicle line naming the parent's own label, fired at the moment the agent walks onto the ground to count |

### On the `quintessence_shift` (the batch's only one)

The chip is legal and backed — `quintessence_shift` is a `CHIP_BACKING_EFFECT_KINDS` member and
the write is real. The question is Law 13 parity: can the player watch it happen?

**Partly, and less than the chip implies.** Quintessence is player-inspectable — `AgentDetailPanel`
renders it, but as a *word*: `quintessenceToWord` buckets 0–1 into ten bands of 0.1. So a −0.06
shift moves the word on the sheet roughly six times in ten and is otherwise a number nobody can
read. The chip says *"Worn through"* and *"wore at their quintessence"*; four times in ten, the
player who follows that chip to the agent sheet finds the same word they would have found anyway.

That is not a defect to fix in this encounter and it is not a reason to fold the chip — the state
genuinely moved, the bearer is anchored, and the packet's refusal to invent a `tooltipId` for a
band-keyed lexicon is the right call ("half an anchor honestly beats a whole one that lies"). But
it is the batch's honest answer to *"does the player perceive it?"*: **the shift is the least
perceptible thing this encounter writes**, and it is on the band the player is least likely to
reach. Recorded, not blocked. If the corpus wants quintessence to be a chip-able consequence at
this magnitude, the fix is upstream — a finer readout or an author-writable stat tooltip — not a
bigger delta.

### On `emit_omen` being unchipped

Correct and better than a chip would have been. `emit_omen` is deliberately outside
`PERSISTENT_EFFECT_KINDS`, so a chip over it would be rejected — but the omen is not therefore
silent. Its `narrativeHook` *is* the chronicle event's message, so the words the author wrote
reach the player as a chronicle line at ~0.6 significance, and the `intent` on the reaction is
read at the moment of choosing. The packet's refusal to put the telling into any band `overview`
is exactly right: an overview renders whichever stance the god took, so an overview asserting the
telling started would be false on every run where the god chose silence. **This is the one place
in the packet where prose placement was decided by what the engine will actually do, and it shows.**

### Solitariness

Not solitary, on either end. Inbound: three reads from the parent (the same person node, the bond
edge, and the consumable mark), plus the ground itself. Outbound: seven writes, five of which a
named system acts on and **three** of which the player can look at afterwards — corrected from
four with the 2026-08-24 fix, since a hidden mark is on no agent sheet where the vanished
`knows_secret_of` edge would have been on two.

**Half B verdict: `connected`.**

---

## Does the sequel payoff actually pay off?

**Yes mechanically, and only two-fifths of the time textually.** This is the finding worth the
director's attention.

**Mechanically it is the strongest sequel wiring in the batch.** Three concrete inbound reads,
all verified from both sides:

1. **The same person, not a lookalike.** `inheritContext` copies `supportBindings`, the parent
   declares `key: 'survivor'` with `must-persist`, and this packet declares the same key. So
   `{cast:survivor}` renders the parent's own pilgrim — same node, same name, same portrait.
2. **A bond the encounter is performed in front of.** The parent's `bond_change` fires on both
   reaction arms of all four seeded bands, so by the time this scene opens the agent and the
   survivor are measurably tied, on both sheets.
3. **A mark this encounter can consume.** The parent plants `hidden_mark` on the *actor* with
   `revealFamilies: ['encounter.border']`. This template is an `encounter.border.*` template, so
   the parent's label — *"The count on the road came up one short"* — can surface as a toast-level
   chronicle line at the exact moment the agent starts counting. That is the callback firing as a
   game event rather than as a sentence, and it is the best thing about this pair.

**The target question is closed — but not the way this paragraph said, and the correction matters
for row 4 too.** It read: the systems pass's caveat 1 is stale, because
`standing-the-line-revised.md` declares its target twice (§ 9.5 in prose — *"targets the crossing
person… not the location, not the hex, not the actor themselves"* — and again in the template
summary at `:1126`), leaving only an implementation obligation on row 4's compile.

**There is no such obligation, because there is no field to discharge it with.** A template does
not choose its action's target: `action.targetId` is
`sel.entry.targetAgentId ?? sel.entry.locationId`, `entry.targetAgentId` is written only by
`socialEncounterGeneration.ts` for scenes aimed at an agent who already exists, and a
`supportBundle` actor is spawned *using* the resolved target. Row 4's two declarations are design
intent that the engine has no way to honour. **Row 4 should be told this before it compiles** — if
any of its own effects reach for `action.targetId` expecting the crossing person, they will refuse
the same way this one did, and its plan doc currently promises they will not.

The question is closed for *this* encounter because the write no longer asks: `hidden_mark` names
its own bearer through `$cast:survivor`. **The batch report should carry the finding, not the old
"already agreed" reading** — what both authors agreed to was something neither could implement.

**Textually, the payoff is thinner than the wiring.** The pole-agnostic contract is impeccably
kept — no line names a pole, assumes the agent fought, or genders the survivor — but it is kept by
subtraction, and the callback pays the price. The only textual bridges back to the parent are the
role noun *"the other survivor"* and `{cast:survivor}`, and the name appears on **two of five
bands** (`critical_success` and `critical_failure`). On `success`, `success_at_cost` and
`failure` — between them by far the likeliest landing at difficulty 0.40 — the survivor is a
nameless "other survivor" and there is no callback in the prose at all. On those three bands
recognition rests entirely on the cast tile's portrait and on whether the parent's mark happens
to reveal (~31.5%).

**Recommendation, non-blocking, cheap:** put `{cast:survivor}` into the `success` and `failure`
overviews. Both already have a natural slot — `success`'s *"the place where the missing one went
down"* is being read in someone's company, and `failure`'s *"there is nobody left here to ask"* is
false-adjacent while a named survivor sits ten feet away not being asked. Two tokens would make
the callback certain on the two most likely endings instead of probabilistic. This is a
recommendation to the author, not a Half A finding, so it does not gate the verdict.

---

## Strongest and weakest connection

- **Strongest: the hidden mark on the survivor** *(corrected 2026-08-24 — this entry named the
  `knows_secret_of` edge, which was never written on any route; the correction at the head of this
  file has the trace)*. It is minted by the encounter, it is the encounter's *ending* rather than
  an ornament bolted to one, it decays on its own clock, and it is read twice by shipped systems
  without anyone building anything: `evaluateMarkReveals` biases the survivor toward the border
  scenes that could surface it, and `consumeMatchingMarks` spends it in a chronicle line when one
  of them resolves. It is also the piece the prose was most clearly written toward: the
  `critical_success` overview and the chip's `detail` describe the same write from two angles, and
  neither could be deleted without the other reading strangely. **Honest limit, which the earlier
  entry did not have:** unlike a secret edge it is on no agent sheet, so the player meets it once
  at the ending and once when it surfaces, not as a standing ledger row.
- **Weakest: the quintessence shift.** Real write, real bearer, correctly anchored, honestly
  short of a stat tooltip — and the least observable thing the encounter does, on the band the
  fewest players will reach. It is the one consequence here that a player could experience without
  ever noticing it happened.

---

## Fix list

**None binding.** Half A is clean; no chip needs folding or binding.

Carried to the batch report as caveats on the *review*, not on the content:

1. ~~`short.the_unsaid` renders false under a bare `?spawn=` link~~ — **wrong diagnosis, closed
   2026-08-24.** It rendered false on *every* route, because the write it reported was refused on
   every route. Fixed in the content (`hidden_mark` on `$cast:survivor`), not in the tooling. The
   `?spawn=` review link is now correct for these two bands and no CLI workaround is needed.
   `DebugSpawnEncounterOptions.targetQuery` is not a dependency of this encounter.
2. The parent's `action.targetId` **is** declared (`standing-the-line-revised.md` § 9.5 and
   `:1126`). Update the systems pass's caveat 1 rather than forwarding it as open.

Recommended to the author, cheap, non-blocking:

3. Add `{cast:survivor}` to the `success` and `failure` overviews so the sequel callback is
   certain on the two likeliest bands, not just on the two rarest.

---

PACKAGE PASS
