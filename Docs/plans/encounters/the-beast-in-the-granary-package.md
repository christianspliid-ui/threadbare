# Package critique — The Beast in the Granary

> Pass 3b (Package critic) · Slug: `the-beast-in-the-granary` · Date: 2026-08-26
> Judged against: `the-beast-in-the-granary-final.md` (merged final), the batch brief,
> `reference/anchor-catalog.generated.md`, and `nudge-authoring-spec.md` § Consequences rules 0 / 0b / 0c.

templateId: encounter.hunt.the_beast_in_the_granary
packageVerdict: connected
packageLeaves: The settlement itself ends the night carrying a named season — a Festival if its winter was saved, a Blighted Harvest if it was lost — written onto the location's own sheet where the player can open it and read it, and where the travel system already charges every later journey against it; the agent walks away with their recovered pack, possibly a wound, and on the martyr pole a place on the settlement's watch roll.

---

## Half A — anchoring

Twelve authored chips across seven faces (`positive` base and `fallback` carry `changes: []`).

| # | Chip | Referent | In the catalog? | Prose names it? | Verdict |
|---|---|---|---|---|---|
| 1 | `positive`/`critical_success` · `BOON · a feast day` | The settlement the encounter spawned at, and the Festival condition now on it | ✅ `location` 🔗 linked (`$target`, `visualKind: 'location'`) + `attachment · condition` 🔗 linked (template id) | Yes — `{location}` enriches to the settlement's real name in `detail` | **anchored** |
| 2 | `positive`/`critical_success` · `PATH · a place in the watch` | The `civic_guard` body the keeper belongs to | ✅ `actor · faction` 🔗 linked (`$faction:civic_guard`) | Yes — "The watch at {location}", localised by the settlement's name, and promised in the spine ("{cast:keeper} of the watch") | **anchored** (two flags, below) |
| 3 | `positive`/`success` · `BOON · a feast day` | As #1 | ✅ as #1 | Yes | **anchored** |
| 4 | `positive`/`critical_failure` · `SCAR · a wound` | The Wounded condition on the agent | ✅ `attachment · condition` 🔗 linked (`trait.condition.wounded`) | Yes — `stateNoun` names the mechanic, `detail` names `{actor}` | **anchored** |
| 5 | `positive`/`critical_failure` · `SCAR · a hungry season` | The settlement, and Blighted Harvest on it | ✅ `location` 🔗 linked + `attachment · condition` 🔗 linked | Yes — `{location}` and "its own store" (a real, must-persist sublocation) | **anchored** |
| 6 | `negative`/`success` · `BOON · their own goods, back` | The recovered pack, reported at its holder | ✅ `actor · individual` 🔗 linked (`$actor`) — the brief's one permitted individual anchor | Yes for the anchor (`{actor}`); the artifact itself is named by relation, not by name — **structurally unavoidable, see finding P2** | **anchored** |
| 7 | `negative`/`success` · `SCAR · a hungry season` | As #5 | ✅ as #5 | Yes | **anchored** |
| 8 | `negative`/`success_at_cost` · `SCAR · a hungry season` | As #5 | ✅ as #5 | Yes | **anchored** |
| 9 | `negative`/`failure` · `SCAR · a wound` | As #4 | ✅ as #4 | Yes | **anchored** |
| 10 | `negative`/`failure` · `SCAR · a hungry season` | As #5 | ✅ as #5 | Yes | **anchored** |
| 11 | `negative`/`critical_failure` · `SCAR · a wound` | As #4 | ✅ as #4 | Yes | **anchored** |
| 12 | `negative`/`critical_failure` · `SCAR · a hungry season` | As #5 | ✅ as #5 | Yes | **anchored** |

**Half A result: 12 anchored, 0 fold, 0 bind.**

Every declared `entityId` is a form `classifyAnchorDeclaration` returns `ok` for — `$target`,
`$faction:civic_guard`, `$actor`, and literal attachment **template** ids. No chip's referent is
scene fiction, and no chip's referent depends on a world feature the encounter might spawn without
(the Bridge's failure mode): the settlement is `$target` and always exists; the store is a
`must-persist` support object the bundle materialises rather than assumes; the conditions are
committed content.

**The trap was checked and not fallen into.** Nothing here was folded for being unclickable. Both
`location` anchors declare `visualKind: 'location'` and therefore carry the click (THR-1172), and
the attachment concepts are `linked` by template id. The brief's anchor targets are all met: ≥1
location chip carrying the click ✅, the membership chip anchored at the group rather than a person
✅, ≥1 attachment anchored at the template node ✅, exactly one `individual` anchor against a cap of
one ✅, and no `reputation_tally` chip anywhere ✅.

### One check nobody upstream ran: do the faces survive band aggregation?

Law 56 clause 1 asks whether a write backs the chip **on the face that shows it**. Every chip here
is backed by a *step* write (only #2 is reaction-backed), and step writes are conditional on step
outcomes — so the honest question is whether a player can reach a face while the backing write did
not fire. Traced against `computeFinalActionOutcome` (`src/engine/unifiedActionLifecycle.ts:300`):

- Any step failure anywhere ⇒ the action resolves `success_at_cost` at best. So an action-level
  `success` or `critical_success` **proves** every step succeeded.
- Step 1 is `fail_action` on both poles, so a step-1 failure resolves the action to
  `failure` / `critical_failure` immediately and can never surface on a success face.

Consequences, all clean: the possession chip (#6) sits on `negative`/`success` only, and `success`
provably implies a clean step 0, so the pack was minted. The feast-day chips sit on the two
all-success bands, so the `positive` step's `successMetadata` Festival fired. The hungry-season and
wound chips sit on bands that provably ran the writing step. **The packet's face-to-backing map
holds under real aftermath aggregation.** This is not automatic — chipping the possession one band
wider, onto `success_at_cost`, would have made it false, since that band is exactly the one a failed
step 0 lands on. Editorial caught the same hazard in the beat-2 *prose* (self-audit row 24); the
chip table independently gets it right.

### Flags on chip #2 — recorded, not folded

Neither flag changes the verdict, and neither has a content-side fix.

1. **Reaction-conditional backing.** `PATH · a place in the watch` is backed only by the optional
   `granary.swear_them_in` reaction, so it renders before the player has chosen and can report an
   enrolment the player is about to decline. This is the packet's own Finding #5, it is legal under
   `chipBackingForFace` today, and it has shipped precedent (`the-unfinished-rite.ts`'s
   `rite.crit.telling`). The sentence hedges it about as well as the model allows — it reports the
   *asking* ("has asked {actor} to stand with them"), which the settlement did regardless — but the
   `stateNoun` still names a membership. Ruling belongs to a human, not to a redraft.
2. **The packet overstates the anchoring half of its own Finding #2.** `findFactionNodeId`
   (`chipAnchorDeclarations.ts:190`) returns the first chapter *by design*, and says so: "a chip
   naming 'The Dawn' is about the order, and the order's sheet is what the player wants." So the
   **chip** is lawful and opens the right sheet. The real defect is one layer down — the
   `membership_change` **effect** resolving through the same def id can enrol the agent in a chapter
   on the other side of the map. Worth separating in the report, because §17 row 30 files the
   caveat against the anchor when the anchor is fine and the write is not.

---

## Half B — what it leaves behind

**The answer, long form.** The durable thing this encounter leaves is not on the agent — it is on
the **place**. Whichever pole the mortal takes, the settlement ends the night carrying a named
season on its own sheet: `Festival` if the store was saved, `Blighted Harvest` if it was lost, both
written by `condition_attachment` with `targetLocationId: '$target'` onto a persistent location node
with a duration edge. Both clauses of the test hold, and I checked each rather than taking the
packet's word:

- **A system reads it.** `src/engine/movementCost.ts:114` charges
  `LOCATION_CONDITION_MOVEMENT_TAX` against exactly these ids — `harvest_blight` at the avoided
  multiplier, `festival` at the crowded one. Every agent routing through that settlement for the rest
  of the season pays or avoids because of what happened in the store. That is a live consumer, not a
  documented intention.
- **The player can see it.** `LocationProfileModal` renders a `location-profile-conditions` section
  naming the condition in plain register — the player opens the settlement and reads *Blighted
  Harvest* with a tooltip. This is the precise clause the Bridge's intelligence record failed: there,
  a real write with no surface. Here the surface exists and is tested.

Around that spine sit five more real leaves, in descending order of how much a later thing can do
with them: a `member_of` edge onto the watch roster (the pole ending the brief drew for); a minted
artifact in the agent's possessions; a `Wounded` condition with a duration edge that fires the wound
signal and drags `iron`/`stone`; a `must-persist` store sublocation and a named `civic_guard` keeper
that the *next* `encounter.hunt.*` member can reuse instead of re-inventing; and — the quietest and
most interesting — `granary.narrow_their_sight`'s reach-scoped `axiological_mark_apply` on `star`,
which bends the very axis this encounter read, so a later `decidedBy` fork meets a mortal this night
changed.

**Verdict: `connected`.** It leaves durable, system-read, player-legible state on a persistent world
object, and it hands the next member of its own family a pre-built stage.

**What keeps it from being unqualified, stated plainly.** The single most interesting leave-behind —
the settlement swearing the agent in, which would be among the first membership consequences in the
corpus — is the most fragile thing in the packet. It is optional (the player may take
`pay_and_part` instead), it is reaction-carried rather than written on the step, and if taken it may
enrol the agent in the wrong chapter of the watch. None of those is the author's fault; all three are
filed. But the honest reading for the director is that the *place* consequence is the one this
encounter can be trusted to deliver, and the *membership* consequence is the one the batch is
proving rather than shipping. Second, nothing here **schedules** anything: no `encounter_seed` is
authored (correctly — `encounter.hunt.*` has one member, so a seed would loop on itself), so the bear
loose in the fields after a `positive`/`critical_failure` is prose, not a queued event. The world
changes; nothing is yet queued to notice.

---

## Fix list

**None binding.** Half A found no chip requiring `fold` or `bind`, and Half B is `connected`.
Nothing in this section blocks implementation.

### Package-level findings for the batch report

**P1 · The `possession` family cannot anchor at the possession.** There is no `$artifact` sentinel.
The forms `classifyAnchorDeclaration` accepts are `$actor`, `$target`, `$cast:<key>`,
`$faction:<defId>`, and literal **attachment template** ids — and a `spawn_artifact` mint has a
per-world node id no author can write. So a chip reporting a recovered or granted possession can
only anchor the *holder*, never the object, and the artifact's own name can never appear in the
sentence. This matters beyond one encounter: the brief warns against "`individual` as the only anchor
kind … the corpus's habit is to make every chip about a person," and for possession chips that habit
is **structurally enforced** rather than lazy. Two candidate fixes, neither this packet's to make: an
`$artifact:<slot>` sentinel resolving the artifact this encounter's own `spawn_artifact` minted (the
catalog already ratifies "an object the encounter itself creates counts as existing"), or an explicit
statement in the catalog that possession chips anchor the holder by design. Worth deciding before the
first full 6-batch, since `possession` is a common draw.

**P2 · Chip #6's sentence is as specific as the model permits, and that is worth recording as the
ceiling rather than as a defect.** "What {actor} was owed came out of the store in {their} own hands"
names the actor (real, linked), the store (real, must-persist) and the relation. It cannot name the
artifact, per P1. Rule 0c is satisfied — the `stateNoun` "their own goods, back" reads as game state
at a glance and the `detail` names the endpoints — but a reader comparing it against the location
chips will notice it is the vaguest of the twelve, and the reason is the engine's, not the author's.

**P3 · Separate the two halves of the packet's Finding #2 before it reaches the report.** The chip
anchor (`$faction:civic_guard`) is lawful and behaves as `chipAnchorDeclarations.ts` documents it
should. The `membership_change` **effect**'s chapter resolution is the actual defect. Filing them as
one finding invites a fix aimed at the wrong layer.

**P4 · Endorsing the packet's Finding #7 from the package side.** Two of three composed hands, both
pole-specific step definitions, their forecast headroom and their card grants sit inside
`ActionStepBranch` variants that `check:encounter` does not descend into. For a Personality Fork —
the shape whose entire value is the branch — the machine gate is green over the half that matters,
and the only things that read beat 2 are the register detectors, the editorial pass and this one.
The Bridge shipped a dead chip because every stage was individually satisfied; a fork whose branch
half is unreachable by the structural gates is the same hazard with a wider blast radius. This
packet's beat 2 is sound as far as three human passes can establish, which is the point: it should
not have to be.

---

`PACKAGE PASS`
