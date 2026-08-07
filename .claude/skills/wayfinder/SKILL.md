---
name: wayfinder
description: >
  Chart a design effort too big for one session — a large game system or a web of
  connected systems still wrapped in fog — as a shared map of decision tickets in
  Linear, then resolve them one at a time until the way to the destination is clear.
  Explicitly invoked (/wayfinder); design sessions may SUGGEST charting a map but
  never auto-chart. Adapted for Threadbare from mattpocock/skills `wayfinder`
  (THR-900). Plans, never builds — cleared maps hand off to design-session plan docs.
last_validated_against: 2026-08-06
---

# Wayfinder

A loose idea has arrived — too big for one agent session, and wrapped in fog: the way
from here to the **destination** isn't visible yet. Wayfinding is about finding that
way, not charging at the destination. This skill charts the way as a **shared map** in
Linear, then works its **decision tickets** — questions whose resolution is a decision,
not slices of a build to execute — one at a time until the route is clear.

The destination varies per effort, and naming it is the first act of charting — it
shapes every ticket. For Threadbare it is usually *"a plan doc (or set of plan docs)
ready for the normal design-session → Ready for Dev handoff"*, but it can also be a
decision to lock (a THR-870-style verdict) or a migration done in place. The map is
**domain-agnostic** — game systems are the motivating case, but content pipelines,
the marketing site, or ops efforts chart the same way (the author plans course
content and building projects with it).

## Where this sits in the Threadbare workflow

```
loose big idea ──/wayfinder chart──▶ map + decision tickets
                                         │  (grilling / prototype / research / task)
        attended chat sessions ──────────┤  resolve one HITL ticket per session
        orchestrator (hourly) ───────────┤  burns down AFK tickets, surfaces HITL frontier
                                         ▼
                          way is clear: map closes
                                         │
                       design-session per plan doc ──▶ Ready for Dev ──▶ executor
```

Wayfinder sits **upstream of `design-session`**: it decides *what the plan docs should
say*; design-session still authors each plan doc with the full governance checklist
(NFP audit, intent-judge, design-audit, three-pillar handoff). A cleared map's
"Decisions so far" is the raw material those plan docs compress.

**Plan, don't do.** Every ticket resolves a decision. The pull to just start building
is the signal you've reached the edge of the map — hand off to design-session instead.

## Hard rules (Threadbare-specific)

- **A wayfinder issue NEVER enters `Ready for Dev`.** Decision tickets are not
  executor work; the map and its children live in `Todo` (open) and `Done` (resolved)
  only. The orchestrator's T1 sweep skips anything carrying a `wayfinder:*` label.
- **Done carve-out:** the "never `save_issue(state:"Done")`" rule protects
  merge-gated executor work. A wayfinder ticket has no merge gate — the resolving
  session closes it with `save_issue(state:"Done")` after posting the resolution
  comment. This carve-out is scoped to issues carrying a `wayfinder:*` label, nothing
  else.
- **Never write `Fixes` / `Closes` / `Resolves` before any issue id** in map bodies,
  ticket bodies, or resolution comments — bare `THR-XXX` only (THR-738 hazard class).
- **HITL means Christian, live, in chat** (THR-608 — he is chat-only,
  plain-language-only). A grilling or prototype ticket only resolves through that
  exchange; an agent that answers its own questions has broken the ticket. AFK
  tickets (research, agent-doable tasks) may run unattended.
- **One HITL ticket per session.** Research tickets excepted — they run as background
  subagents and several may burn down in parallel.
- **Refer by name.** In everything Christian reads — chat, briefing lines, the map's
  Decisions-so-far — call maps and tickets by their **title** (with the id riding
  inside the link), never a bare id. A wall of `THR-903, THR-904` is illegible.

## The map (Linear representation)

The map is a single Linear issue labelled **`wayfinder:map`**, in the project the
effort belongs to (every issue belongs to a project). Its tickets are **sub-issues**
(`parentId` = the map). The map is an **index, not a store**: each decision lives in
exactly one place — its ticket — and the map only gists and links.

### Map body

```markdown
## Destination

<what reaching the end looks like — usually "plan docs ready for handoff for X, Y, Z".
One or two lines; every session orients to it before choosing a ticket.>

## Notes

<domain; canon pages + skills every session must load (Step 0 for this effort);
standing preferences Christian has stated. **Any effort whose destination touches a
player-facing surface lists `Docs/design-system/laws.md` here** — the UI Laws bind
prototype tickets, verdict sessions, and the plan docs the map produces (THR-1007)>

## Decisions so far

- [<closed ticket title>](url) — <one-line gist of the answer>

## Not yet specified

<in-scope fog you can't ticket yet — see Fog of war>

## Out of scope

<work consciously ruled beyond the destination — never graduates>
```

### Tickets

Each ticket is a child issue whose body is the **question**, sized to one session:

```markdown
## Question

<the decision or investigation this ticket resolves>
```

Each carries exactly one type label — `wayfinder:grilling` (HITL, the default),
`wayfinder:prototype` (HITL), `wayfinder:research` (AFK), `wayfinder:task` (HITL or
AFK) — plus nothing that would attract other lanes.

### Linear operations (the tracker adapter)

| Operation | How |
|---|---|
| Create map | `save_issue(team:"Threadbare", title, project, labels:["wayfinder:map"], state:"Todo", description:<map body>)` |
| Create ticket | `save_issue(team, title, parentId:<map>, labels:["wayfinder:<type>"], state:"Todo", description:<question>)` — then `save_issue(id, assignee:null)` (create defaults the assignee to the API actor, THR-845) and `get_issue(id)` to verify |
| Blocking | **Native relations**: `save_issue(id, blockedBy:["THR-XXX"])`. Wire in a second pass, after all tickets exist. Read back with `get_issue(id, includeRelations:true)`. Do not also write prose `Blocked by:` lines — one representation, not two |
| Claim | `save_issue(id, assignee:"me")` **before any work**, then `get_issue(id)` to confirm the write stuck (impediment #48). The assignee IS the claim; open + unassigned = unclaimed |
| Resolve | Post the answer as a comment (`save_comment`), `save_issue(id, state:"Done")`, verify, then append one gist line to the map's Decisions-so-far via `save_issue(mapId, patch:[…])` |
| Frontier query | List the map's open children (`list_issues(team, state:"Todo", limit:50)` filtered in memory by `parentId` — never one unfiltered sweep), drop any with an assignee or an open blocker (`includeRelations`). First in map order wins |
| Assets | Linked from the ticket (`links:[{url,title}]`), never pasted in. Research findings longer than a comment go to `Docs/audits/YYYY-MM-DD-<topic>-research.md` via a `docs/plan-*`-style PR |

## Ticket types

- **Grilling** (HITL): conversation with Christian via the `grill-me` skill,
  one question at a time, agent recommends and interrogates, Christian decides.
  The default **only when there is nothing concrete to react to**.
  Terminology disagreements route through `ubiquitous-language` (UL wins).
- **Prototype** (HITL): raise the fidelity of the discussion with a cheap concrete
  artifact Christian can react to — an outline, a mock screen (`?view=styleguide`
  conventions **and the UI Laws, `Docs/design-system/laws.md`** — a mock that breaks
  a law teaches the wrong thing; a mock that *needs* to break one surfaces a joint
  amendment decision, which is itself a finding worth the ticket), a CLI-driven
  simulation sketch, a throwaway branch. Link it as an
  asset. Rough by design. **Bias toward prototype over another grilling round**
  whenever the question *could* be answered by reacting to something concrete:
  prototypes are what keeps a big map from becoming waterfall — low-fidelity
  planning punctuated by high-fidelity artifacts — and for a chat-only creative
  director a mock to react to is a better interface than more questions. (This is
  also how Threadbare already works: terrain-lab before hex vignettes, the nudge
  test panel before the real card.)
- **Research** (AFK): surface a fact a decision waits on — codebase reality
  (`systems-inventory`, interface map, actual wiring), prior plan docs/canon, or
  external primary sources. Fired as a **background subagent**; findings land as the
  resolution comment (or a `Docs/audits/` file when long). The THR-614 lesson lives
  here: grep the premise nouns before greenfielding.
- **Task** (HITL or AFK): legwork that must happen before a decision *can* be made —
  provisioning, data moved so its shape can be seen. The one type that does rather
  than decides; it earns its place by unblocking a decision, not by delivering the
  destination. HITL task = a precise checklist handed to Christian in plain language.

## Fog of war

The map is *deliberately* incomplete: don't chart what you can't yet see. **Fog or
ticket?** — the test is whether you can state the question precisely now, *not*
whether you can answer it now. Ticket when the question is sharp (even if blocked);
"Not yet specified" when it isn't. Don't pre-slice fog into ticket-sized pieces — one
patch may graduate into several tickets, or none, once the frontier reaches it.

Fog only gathers *toward* the destination. Work beyond it goes to **Out of scope** —
closed, never graduating. When an existing ticket turns out to sit past the
destination, close it (state `Canceled`, so it can't read as a resolved decision) and
leave one line in Out of scope linking it. It stays out of Decisions-so-far.

## Invocation

Two modes. Either way, never resolve more than one HITL ticket per session.

### Chart the map (`/wayfinder` with a loose idea)

1. **Name the destination.** Run a `grill-me` pass to pin it down. The destination
   fixes the scope, so it's settled first — with Christian, live.
2. **Map the frontier.** Grill again, **breadth-first**: fan out across the whole
   space, surfacing the open decisions and what's takeable now. **If this surfaces no
   fog** — the way is already clear, the whole journey fits one session — you don't
   need a map. Stop and say so; a normal design-session is cheaper.
3. **Create the map** (label `wayfinder:map`, in its project): Destination + Notes
   filled, Decisions-so-far empty, fog sketched into Not yet specified.
4. **Create the specifiable tickets** as children — then wire `blockedBy` relations
   in a **second pass** (issues need ids before they can reference each other).
5. **Fire the research subagents** for any `wayfinder:research` tickets now on the
   frontier. (Between sessions, the orchestrator's wayfinder sweep does this too.)
6. Stop — charting is one session's work; it hand-resolves nothing.

### Work the map (`/wayfinder` with a map, ticket optional)

1. Load the **map** — the low-res view, not every ticket body. Load the Step-0
   material its Notes name.
2. Choose the ticket: the one Christian named, else the first frontier ticket.
   **Claim it** before any work.
3. Resolve it — zoom into related closed tickets on demand; invoke the skills the
   Notes name; default to `grill-me` when in doubt.
4. Record: resolution comment → close (`Done`) → verify → append the gist line to the
   map's Decisions-so-far.
5. Graduate: create newly-specifiable tickets (create-then-wire), clear each
   graduated patch from Not yet specified, rule mis-scoped tickets out of scope,
   update or cancel tickets the decision invalidated.

### Closing the map

When no open tickets remain and no fog is left, the way is clear. Closing is a
deliberate compression step, not just a state change:

1. **Propose the carve-up in the closing comment**: how the map's decisions divide
   into plan docs (how many, which decisions each draws on). The map→plan-docs
   compression is itself a decision, so it gets recorded like one — on the map,
   where a later session can see why the seams fall where they do.
2. Close the map (`Done`). The Decisions-so-far index is the route summary.
3. Spin up the handoff: one `design-session` per plan doc from the carve-up. Those
   sessions cite the map — its decisions are settled input, not things to
   re-litigate.

**Plan docs link their primary sources.** A plan doc is a summary, and a summary
loses nuance — so each plan doc produced from a map links the specific decision
tickets it draws from, **inline where each decision is used**, not just a blanket
"see the map" at the top. A confused executor (or a later design session) zooms to
the ticket and reads the original exchange.

**A closed map never reopens.** It is a record of the route walked. If the
destination is later redrawn — scope grows, a settled decision is overturned — that
is a **fresh effort with a fresh map**, which may cite the old one as input.

## Who works the map

| Lane | Does |
|---|---|
| **Attended chat session** (Christian present) | Charting; HITL tickets (grilling/prototype/HITL-task); closing the map |
| **Orchestrator** (hourly, § wayfinder sweep in its skill) | Burns down frontier AFK tickets via subagents; surfaces the HITL frontier under `## Needs Christian` → hourly briefing (Christian's decision, 2026-07-31: auto-resolve AFK, briefing for HITL) |
| **Executor / pull-work** | Nothing. Wayfinder issues never reach its queue |

Concurrent sessions are expected — the claim discipline (assignee-before-work,
verify-after-write) is what makes that safe.
