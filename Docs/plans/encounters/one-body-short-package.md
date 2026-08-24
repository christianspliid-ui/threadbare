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
packageLeaves: The agent walks off this ground holding a real secret about the survivor from Standing the Line — an edge on both their sheets that a god can later spend as leverage — plus, on the failure side, a grieving condition that measurably lowers their next reading of anything, and, if the god lets them speak, a cultural omen the chronicle names aloud.
```

---

## Half A — anchoring

Four distinct chips across six band slots. Every referent checked against
`reference/anchor-catalog.generated.md` and the sentence checked for whether it names *that
particular object*.

| Chip | Band(s) | Referent | In the catalog? | Prose names it? | Verdict |
|---|---|---|---|---|---|
| `short.the_unsaid` | `critical_success`, `success` | The `knows_secret_of` edge the encounter itself mints, actor → the survivor. Anchored at the far endpoint — the survivor, an `actor` node of `actorType: individual` | **Yes, twice over.** `knows_secret_of` is 📍 named (edges declare by endpoint); the endpoint itself is 🔗 linked (Actors · `individual`), `visualKind: 'agent'` | **Yes.** `detail` names the person through `{target}`, which the narrative linker resolves to the survivor's own name and link; the `critical_success` overview names the same person again as `{cast:survivor}` | **anchored** |
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
2. **`concepts` decorates a substring that is not the object's name.** `short.the_unsaid`
   declares `{ text: 'a secret', entityId: '$target' }` — so the words *"a secret"* carry the
   survivor's link. That is not wrong (the edge has no page of its own, so the catalog's rule is
   to anchor an endpoint), and `applyConceptDecorations` runs *after* the narrative linker, which
   has already linked the survivor's name in the same sentence. Net effect: two routes to the
   same person from one sentence. Harmless, mildly redundant, and unfixable without a `secret.*`
   tooltip — which the packet already files as a corpus-wide ask (§ 8.4c). Left alone.
3. **The `$target` anchor is the right choice and the tempting alternative is worse.** Because
   `secret_discovery` reads `action.targetId` and has no `targetAgentId` override, `$target` is
   the *same value the write used* — rule 0c, correctly applied. Re-anchoring to `$cast:survivor`
   would make the chip render correctly under `?spawn=` while the write still silently refused,
   converting a visible failure into an invisible one. **Do not make that swap.**

---

## The `?spawn=` problem — exactly which chips render false, and what the director will see

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

---

## Half B — what this encounter leaves behind

| What it leaves | Written by | What reads it | Would the player see it happen? |
|---|---|---|---|
| **A `knows_secret_of` edge, actor → the survivor** | `secret_discovery` on `successMetadata` (fires on `critical_success`, `success`, `near_miss`) | `agentDetail.ts:549,564` lists it as *secrets held* on the actor's sheet and *secrets about* on the survivor's; `intelligence.ts:389` projects it into the intelligence readout; two divine verbs act on it (`graphOpExecutor.ts:694` surfaces held leverage, `:1435` flips an unrevealed secret to revealed); `phaseSecretsFavors.ts:96` decays it on its own clock | **Yes, three times.** The chip at the ending, the Secrets row on two agent sheets afterwards, and again whenever the god spends it |
| **`grieving` on the acting agent** | `condition_attachment` — `failureMetadata` on the two failure bands, and both re-declared band reactions on `success_at_cost` | The condition's `domainContributions { heart: -0.08, eye: -0.05 }` feed capability scoring, so the next `eye` test is measurably harder; duration/expiry runs it out | **Yes.** The chip, then the Attachments tab with a live duration, then a visibly lower forecast the next time the agent is asked to read anything |
| **A cultural omen, global scope** | `emit_omen` on the `short.say_the_count` reaction (god-chosen); a second, different one on the Omen card's grant | `phaseAgentDecision.ts:620` → `deriveEmittedOmenEncounterBias` biases `assist` / `trade` / `lead` draws for every agent in scope; `phaseOmenAgenda` runs its life; omen vocabulary feeds `{omen_*}` enrichment in other encounters' prose | **The telling, yes — the drift, no.** `emit_omen` posts a chronicle event carrying the `narrativeHook` verbatim at ~0.6 significance, so the player reads *"A death was counted on the border with no body under it, and the telling has started."* The encounter-draw bias it also causes is invisible, and correctly not chipped |
| **A hidden mark, `secret_knowledge`, revealing on `encounter.border`** | The Long Game card's grant (severity 0.55) | `evaluateMarkReveals` / `consumeMatchingMarks` at the next `encounter.border.*` resolution the bearer draws — every row of this batch and every later one in the family | **Yes when it fires.** ~50% at first eligible draw, and a reveal writes a `ripple_consequence` chronicle event at 0.7 significance — above the toast threshold |
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
named system acts on and four of which the player can look at afterwards.

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

**The target question is closed, and the systems pass's caveat 1 is stale.** It records that
neither parent draft declares an `action.targetId`. `standing-the-line-revised.md` declares it
twice — § 9.5 in prose (*"`encounter.border.standing_the_line` targets the crossing person… not
the location, not the hex, not the actor themselves"*) and again in the template summary at
`:1126` (`target: the agent bound under cast key survivor`). What remains is an implementation
obligation on row 4's compile, not an open design question. **The batch report should say so** —
carrying it forward as "unresolved" would ask the director to adjudicate something both authors
have already agreed.

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

- **Strongest: the `knows_secret_of` edge.** It is minted by the encounter, it is the encounter's
  *ending* rather than an ornament bolted to one, it lands on two agent sheets where the player
  can read it, it decays on its own clock, and it is already the input to two existing divine
  verbs — so a god who took this encounter can spend it later without anyone building anything.
  It is also the piece the prose was most clearly written toward: the `critical_success` overview
  and the chip's `detail` describe the same write from two angles, and neither could be deleted
  without the other reading strangely.
- **Weakest: the quintessence shift.** Real write, real bearer, correctly anchored, honestly
  short of a stat tooltip — and the least observable thing the encounter does, on the band the
  fewest players will reach. It is the one consequence here that a player could experience without
  ever noticing it happened.

---

## Fix list

**None binding.** Half A is clean; no chip needs folding or binding.

Carried to the batch report as caveats on the *review*, not on the content:

1. `short.the_unsaid` renders false under a bare `?spawn=` link on `critical_success` and
   `success` — the chip anchors and the `{target}` token both resolve to the agent's location.
   Known tooling gap (`prepareDebugEncounterSpawn` always targets the location); review those two
   bands via CLI until `DebugSpawnEncounterOptions.targetQuery` lands.
2. The parent's `action.targetId` **is** declared (`standing-the-line-revised.md` § 9.5 and
   `:1126`). Update the systems pass's caveat 1 rather than forwarding it as open.

Recommended to the author, cheap, non-blocking:

3. Add `{cast:survivor}` to the `success` and `failure` overviews so the sequel callback is
   certain on the two likeliest bands, not just on the two rarest.

---

PACKAGE PASS
