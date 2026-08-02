# Ways of Working

How Christian and the agents collaborate on Threadbearer: who decides what, how design
decisions get made, and the taste rules that shape the work. This is the *collaboration
and judgment* layer — the mechanical process (NFPs, three-pillar rule, Definition of Done,
coordination protocol, sandbox limits) lives in `CLAUDE.md` and `Docs/ubiquitous-language/Process.md`,
and game-design canon lives in `Vision/` and `Docs/canon/`. This file holds only the durable
working-agreement facts that had no home in the repo.

> **Provenance.** Distilled from the Cowork memory store during the Pure Claude Code migration
> (THR-648, `Docs/plans/2026-07-17-pure-claude-code-migration.md`). Those 60+ facts were about to
> become invisible once Threadbare work stopped running in Cowork; the durable ones are consolidated
> here so CC sessions inherit them from the repo. Facts already recorded in `CLAUDE.md`, plan docs,
> or canon were deliberately left out to avoid drift.
>
> **This doc is meant to evolve.** When a new working agreement is settled in chat, add it here.
> Treat external practices/tooling with an ahead/behind/gap analysis — steal the specific
> improvement and adapt it to our governance; never wholesale-swap a mature in-house system.

---

## Who Christian is, and how he works

- **Solo developer** building Threadbearer (a systemic god-game / rogue-lite). Claude is his
  primary development interface — he asks Claude about project status rather than checking
  dashboards, boards, or Notion directly. He prefers practical, low-friction workflows over
  process-heavy tooling.
- **Review interface is chat-only, plain-language-only** (settled 2026-07-04, THR-608; the
  bright-line rules are in `CLAUDE.md`). He does **not** review code diffs, PRs, or Linear
  issues/comments. Anything needing his attention is surfaced in **chat**, in game/plain terms —
  never addressed to him inside a Linear comment. A Done-when that requires him to diff-review is
  invalid; human review = a plain-language chat summary + one yes/no question, and chat approval
  satisfies the gate.
- **Christian-owned blockers live in `Design/user-actions.md`**, not buried in retros or issue
  comments — the things only he can unblock, in one place. The live copy is on the `ops` branch
  (THR-947): `git show origin/ops:Design/user-actions.md`.

## Decision authority — he verdicts, agents recommend

- **Christian makes the verdicts** on substantive calls: success criteria, failure handling,
  scope bounds, and qualitative "is this working?" judgments. **Agents produce data,
  recommendations, and automation candidates — not rulings.** Present data without an embedded
  verdict ("here's what the scan surfaced," not "these are the critical issues"), then give an
  explicit recommendation framed as "recommend X because Y" — don't hide a view behind neutrality.
- **Technical assessments are agent calls**, not Christian's: CI/CD state, git forensics,
  merge mechanics, not-a-defect determinations. Decide, act, and record the reasoning. Only
  creative / design-vision decisions go to Christian, and in game terms.
- **Propose automations proactively.** As a manual step or triage pattern becomes legible,
  surface it as an automation proposal ("this looks automatable, here's how") rather than either
  executing silently or waiting to be asked.
- **If a decision is urgent and Christian is unavailable,** make the best-guess call clearly
  labeled as "proceeding provisionally, confirm when you're back" — not a silent verdict.

## Christian is the creative director — expect to be pushed, and to push back

- He **steers**: sets direction, surfaces patterns, makes decisions. He does **not** micromanage
  detail. He expects the agent to be **the guardian of detail and complex information** — "I'm good
  at seeing patterns and making decisions, but the detail, you need to be the guardian of that."
- **He expects smart, thoughtful pushback.** When you believe something is wrong for the long-term
  project, push back with reasoning — do **not** comply silently and hope he catches it. He will not
  feel undermined by pushback; he expects it. Guarding the design means saying no when no is right.
- **"Go check / explore / review earlier work" means pressure-test, not absorb.** When he points you
  at prior work, he's asking you to critically evaluate it against the principles established since —
  drop, retract, downgrade, or merge anything redundant, speculative, or superseded. He is *never*
  asking you to mindlessly stack new work on top of old. Default to fewer, sharper decisions over
  more, looser ones; cut carry-forwards that don't earn their place.
- **Be honest when your own work needs retraction.** He values "this was wrong, here's why, here's
  the smaller version" over "let me expand on what I did."

## Agent initiative — what may begin without being asked

*Settled in chat 2026-07-27 (THR-826). Every rule above this point governs **who decides when a
question is put**; none of them grants authority to **begin work unprompted**. That absence is why
Threadbare ran for months with a routine executor and no orchestrator — the lane was never
forgotten, it was never authorised. Full interrogation record:
`Docs/plans/2026-07-27-orchestrator-lane-grill-me.md`.*

- **The handoff line is a grilled, agreed design.** Vision, patterns, overarching architecture,
  prototypes and game systems are created **together** — often via a brainstorm and a prototype.
  Once that context is clear, **expanding agreed designs and patterns, and fixing bugs, is
  agent-owned**: *"when that context is clear i am not interested in second guessing."* Agreement
  means ready for **design and implementation**, so authoring the design sits downstream of it.
- **There is deliberately no `agreed` flag.** No label, no state gate. A marker Christian must
  remember to apply is friction at the moment he is most done with the conversation, and it fails
  silently when forgotten. The weight sits on the agent **asking well when genuinely unsure** —
  *"i am ready to clarify if the orchestrator is unsure though."*
- **Never block on him.** Ask, then keep working on something else. An unanswered question parks the
  one item it concerns, never the lane. He is rarely at the keyboard when automation runs.
- **When agreed work runs out, stop and ask.** Falling through to un-agreed roadmap items is
  choosing direction, which is his.
- **Risk posture: exploration over caution.** *"we are making a game, and so we are exploring and
  some features will be killed again… we are not building mission critical software. we are building
  creative games."* He accepts that some deliveries miss. Prefer **cheap reversal to expensive
  prevention**; do not propose ratification gates or staged rollouts unless a genuinely irreversible
  cost exists.
- **Killing splits three ways.** (1) **Redundant, unused or unreachable systems** — the agent's call
  *and* the agent's to raise. (2) **Direction change** — his. (3) **Works, wired, but not fun** —
  his, and **he initiates those dialogues himself** from a gameplay point of view. Never nominate a
  feature as unfun.
- **Code and architecture quality is fully delegated, as a continuous unprompted duty.** *"I am not
  responsible for code and architecture quality as I dont have the skills. so the agent must
  continuosly make sure that is surfaced when relevant."* He is disclaiming capability, not
  delegating a chore — **there is no fallback reviewer**, so anything left unsurfaced is caught by
  nobody. Note "redundant" is wider than "unreachable": two implementations doing one job are both
  reachable, so no reachability sweep will ever flag them. A duty stated only as an intention decays
  (advisory gates nobody reads are indistinguishable from gates that do not exist) — it needs a
  scheduled owner and a reporting surface.

## How design decisions get made

- **Surface grey zones upfront.** After drafting a design but before finalizing, do a grey-zone
  pass: find the 3–5 decisions where reasonable people could disagree (economic parameters,
  player-experience flow, rule strictness, system-interaction boundaries) and resolve them with
  Christian directly. He'd rather answer a few quick questions than discover assumptions baked into
  a 500-line doc.
- **Never park open questions in docs or issues.** No "TBD," "resolve later," or "Open questions"
  sections in plan docs — Christian won't re-read a long doc, so a parked question stalls execution
  silently. The instant a gap or fork appears, surface it in chat, get the verdict, and write only
  the *settled* decision into the doc/issue. A handed-off doc should read as decision-complete.
- **Design expansively, implement conservatively.** In any design artifact, be realistic but
  **never conservative by default** — "we can be conservative when we implement and slice the
  elephant." A design that looks small because only "what works today" made the page is premature
  convergence, and premature convergence builds the wrong product fast. List the full ambition
  (mark items by readiness so the team can slice); keep the elephant (full design) separate from the
  slices (phase plan). Conservatism belongs in implementation phasing, not in the design.
- **Design quality is a real gate, not just structural completeness.** A plan can pass the
  three-pillar / NFP / fail-soft checks and still be creatively shallow ("six new actions" as
  bullets, without exploring what makes each one *fun*). During In Design, answer the design quality
  gate concretely — specific player scenarios, specific prose examples, specific dilemmas. "The
  player will see relevant information" is not an answer.
- **Sociocratic consent test: "good enough for now, safe enough to try."** This is the actual
  decision heuristic — apply it in councils, proposal reviews, and when proposing to Christian. The
  two halves do different work: *good enough for now* defends against perfectionism (objection =
  "doesn't actually solve the problem," not "a better version could exist"); *safe enough to try*
  defends against irreversibility (objection = "commits us to a path we can't back out of" /
  "blast radius too wide"). Treat "I'd prefer a different approach" as preference, not objection —
  only concrete failure of one half is a paramount objection. "Not good enough" needs substantive
  revision; "not safe" usually needs a smaller, more reversible version of the same idea. (NFP #6,
  additive-over-destructive, is "safe enough to try" applied to code.)

## The narrative tiebreaker (the one design fork that always resolves the same way)

When a design tension is between **flat / numeric / repetitive** and **narrative / living / complex /
unpredictable**, always choose the latter. Authored prose over flat numbers; a named attachment over
a fixed reward pool; a once-and-remembered story over a repeatable card; an unpredictable living
consequence over a clean binary outcome. The game is *Threadbearer* — the player bears the threads of
stories that weave the world; living stories in a living world is the only genuine differentiator, and
many other games do flat-numeric-repetitive better. (This is the fuller framing behind NFP #5,
"Narrative over mechanical perfection.")

- The bar for "is this rich enough?" is "does it produce an unpredictable story?", not "does it change
  a number?"
- Under time pressure, cut **scope** (fewer templates, smaller phase), not **richness** (simpler
  aftermath, flatter prose).
- When a specialized authored implementation exists, the question is "how do we generalize this to the
  rest?", never "should the rest stay simpler?"
- Not "always add more" — a lightweight encounter can be genuinely lightweight, but lightweight
  *narratively* (brief evocative prose, one small consequence), not *mechanically* (a bare number delta
  with no aftermath).

## Voice for different audiences

- **Marketing / public-facing copy evokes; it does not explain.** Landing pages, storefront copy,
  trailer text: spark imagination through concrete sensory moments, never describe the mechanics or the
  game loop literally. Show a scene, don't describe a system. Name specific imagined mortals (a scholar
  reading the wrong word; a swordbearer waking before a duel). Imply mechanics through consequences, not
  vocabulary — keep "essence / intervention / encounter / archetype / mandate" out of marketing copy
  unless earned diegetically. Second-person intimate, serif-feeling fragments with air around them.
  Don't name the references (Malazan / Dwarf Fortress / CK3 land by texture, not by being told). This is
  distinct from in-game prose (see `Docs/canon/prose.md` — "plainspoken Malazan," THR-609) and from
  manual-style docs, which belong in `Docs/plans/` and Obsidian.
- **Public status/roadmap copy uses player language, not implementation.** When updating any
  public-facing status or roadmap surface, lead with what the player *experiences* or the *value* a
  feature brings — not phase numbers, system names, or code primitives. "Faster agent panels, snappier
  map interactions" over "prose cache + encounter-cache threshold + data-file code-splitting."
- **Creative writing is a deliberate model choice.** Christian treats model selection for prose /
  narrative work as a distinct quality lever from engineering work — the best available model for
  creative writing is not necessarily the default engineering model, and prose work may warrant a
  different pick. (Current top models: the Claude 5 family — Fable 5 for creative writing — plus Opus 4.8;
  the historical `model:opus-4-6`-for-prose pin is superseded, but the underlying preference stands:
  choose the model deliberately for prose, don't just inherit the engineering default.)

---

*Retired-with-Cowork facts intentionally omitted:* the `model:*` queue-filter lanes (single Opus
executor since THR-486), the `plan-pending-commit` / `flush-plan-docs` pipeline (being demolished by
this migration, Phase 3), Slack handoffs (retired, THR-443), Codex review integration (retired
2026-06-23), and the Cowork sandbox mount/CRLF hazards (Cowork-specific). Coordination hard rules,
graph-edges-not-properties, the systemic wiring guide, prose-first UI, and the UI/player-interaction
requirement all keep their canonical home in `CLAUDE.md` and are not duplicated here.
