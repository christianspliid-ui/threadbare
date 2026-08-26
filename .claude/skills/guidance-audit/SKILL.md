---
name: guidance-audit
description: Semantic divergence audit across a doctrine's operative surfaces — finds guidance pulling in different directions, guidance still teaching a retired mode, and guidance whose replacement already exists. Run after any direction change (recording a ruling is not finished until this has run), from the weekly retrospective when a doctrine version has moved, and monthly regardless. Triggers on "/guidance-audit", "guidance audit", "audit the guidance", "does anything still teach the old mode", "guidance drift", "doctrine divergence", "stale guidance sweep".
model: opus
last_validated_against: 2026-08-26
validated_doctrine: prose@2
---

# Guidance Audit

## Purpose

**A ruling lands in the canonical chain; agents obey the operative chain.** The surfaces an
agent loads first — prompts, compiled briefs, exemplars, skill bodies, vault samples — are
where direction actually takes effect, and nothing about editing canon touches them. The
2026-08-25 prose-guidance audit measured the gap: three director-level register rulings sat
in `Docs/canon/prose.md` while every operative surface kept teaching the retired mode, and
the pipeline drafted against inverted rules for weeks.

`check:guidance-freshness` (THR-1253) closes the *mechanical* half — an authority edited
without touching its declared dependents is flagged at change time. This skill is the
*semantic* half, and it exists because the mechanical half cannot see the failures that
matter most:

| Failure | Can a gate see it? |
|---|---|
| Authority edited, dependent untouched | **Yes** — that is `check:guidance-freshness` |
| Dependent *touched* but still teaching the old rule | No — the diff looks swept |
| Two live surfaces stating opposite rules, neither edited recently | No — no diff exists |
| A whole doc that a newer doc has silently replaced | No — nothing is broken, just redundant |
| A surface outside the repo (vault) | No — outside CI's reach entirely |

Rows 2–5 are what this audit is for. They need reading, not matching.

## Scope

- **Input:** `Docs/guidance-manifest.json` — the doctrine registry.
- **Output:** a written report, plus impediment-log rows. **Never tickets** — see § Findings go to the log, not the board.
- **Not in scope:** fixing what it finds. The audit reports; remediation is separate work, prioritised at the retro.

## Workflow

### Step 1 — Read the manifest, then read the authorities live

```bash
cat Docs/guidance-manifest.json
```

For the doctrine under audit, read **every file in `authorities`, in full, right now**.

> **The baseline is always live canon, never a cached summary — and never text embedded in
> this skill.** An embedded baseline is itself a copy of the doctrine, and a copy that
> drifts is the exact disease this audit treats. If you ever find yourself wanting to paste
> the current rules into this file "so the audit is self-contained", that is the failure
> mode announcing itself. Do not.

Write down, in your own words, the doctrine's **operative rules** as they stand today —
the specific, checkable claims, not the vibe. For prose doctrine v2 that means things like
*who narrates*, *what person and tense*, *what the prose may and may not do that the cards
do*. Five to fifteen numbered rules. This list is the yardstick every partition is measured
against, so it must come from the authorities and nowhere else.

Also record the doctrine's `version` and `versionNote`. A surface that predates the version
is a *candidate* for drift, not a finding — age is a search hint, never evidence.

### Step 2 — Build the three partitions

| Partition | Membership |
|---|---|
| **skills** | `dependents` under `.claude/skills/`, plus a bounded discovery grep for unlisted skill files that talk about the doctrine's subject |
| **Docs** | `dependents` under `Docs/`, plus the same bounded discovery grep across `Docs/` |
| **vault** | every `manualDependents` entry (`vault:` prefix), read from `$OBSIDIAN_VAULT_PATH` |

**The discovery grep is what makes this more than a manifest re-read.** The manifest lists
what someone remembered to register; the audit's job includes finding what nobody did. Keep
it bounded — a handful of doctrine-specific terms, not an open sweep — and feed any surface
it turns up into the partition *and* into a manifest-gap finding.

```bash
# Illustrative for the prose doctrine — derive your own terms from the Step 1 rule list.
grep -rniE 'prose|register|narrat|voice|tone' .claude/skills --include=*.md -l
grep -rniE 'prose (style|standard|doctrine)|writing guideline|tone sample' Docs --include=*.md -l
```

Vault access is filesystem-only via `OBSIDIAN_VAULT_PATH` (there is no Obsidian MCP —
THR-654). If the variable is unset, mark the vault partition **`not audited`** and say so;
do not silently skip it.

### Step 3 — One auditor per partition, in parallel

Dispatch one subagent per partition. Give each: the Step 1 rule list verbatim, its file
list, and the verdict vocabulary below. Do **not** give an auditor the other partitions'
files — the partitions are separate so that a large corpus fits in a context that can still
read carefully, and merging them defeats that.

Each auditor returns **one row per file**:

| Verdict | Means | Required evidence |
|---|---|---|
| `CURRENT` | Consistent with the doctrine as stated | none |
| `DRIFTED` | Teaches something the doctrine has retired or inverted | **quote the offending line** |
| `INTERNALLY-CONTRADICTORY` | States the doctrine in one place and contradicts it in another *within the same file* | **quote both sides** |
| `DELETE-CANDIDATE` | Wholly superseded; a live surface already covers it | **name the replacement path** |
| `NOT-AUDITED` | Could not be read | say why |

Plus, per partition, a **ranked pollution list**: the surfaces whose drift will do the most
damage, worst first. Rank by *blast radius, not severity* — a mildly stale line in a prompt
that every draft loads outranks a badly wrong paragraph in a doc nobody opens. That ranking
is the audit's most useful output and the thing a raw verdict table cannot express.

**A quote is mandatory for every non-`CURRENT` verdict.** An unquoted finding cannot be
verified, cannot be remediated by someone who was not in the room, and — measured across
this repo's audit history — is the shape that turns into a ticket nobody can action. An
auditor that returns a verdict without its quote has returned nothing; ask again.

**Absence must be explicit.** A partition whose auditor fails or times out is reported
`not audited`, never omitted. A missing row reads as a clean row, and an audit that
silently under-reports is worse than one that did not run — it manufactures confidence.

### Step 4 — Merge, and separate the two questions

Assemble one report. Keep two things apart that are easy to blur:

1. **Is this surface wrong?** (`DRIFTED` / `INTERNALLY-CONTRADICTORY`) — a correctness
   finding. It teaches something the director has retired.
2. **Should this surface exist?** (`DELETE-CANDIDATE`) — a simplification finding. It may
   be perfectly correct and still be redundant weight in every agent's context.

Both matter and they remediate differently: (1) is an edit, (2) is a deletion or a
supersede-banner. Christian's direction covers both halves — *"look for guidance and patterns
that pull in different directions"* **and** *"investigate if we can simplify by deleting old
guidance"*.

Also emit a **manifest-gap** section: every surface the discovery grep found that the
manifest does not list, and every listed dependent that no longer exists. The manifest is
corrected as part of the audit's own remediation — a manifest that does not match reality
makes the change-time gate lie in both directions.

### Step 5 — Findings go to the log, not the board

**This audit does not file tickets.** Per the 2026-08-10 process-work throttle, scheduled
and semi-scheduled lanes log findings; **the weekly retro is the single promotion point**,
where sub-bar rows are batched and only the few that clear the materiality bar become
tickets, with the accumulated cost quoted.

- Every finding → an **impediment-log row** (`impediment-reporter` skill; allocate the id
  with `npm run impediment:next-id`), or a section in the run's own report.
- **Sole exception** — the throttle's own: a finding showing **active corruption right
  now** (a surface actively producing wrong artifacts as the audit runs) may be filed
  immediately. This is a narrow exception about work being damaged in the present tense,
  not a licence for "this seems important".
- Do not file one ticket per finding. That is precisely the pattern that put 32 of 35
  Ready-for-Dev items into Low-priority process cleanup with zero feature work behind them.

### Step 6 — Close the loop on the manifest and the stamps

Two cheap writes the audit is uniquely placed to make, and which nothing else will:

1. **Correct the manifest** — add the surfaces the discovery grep found, remove the
   dependents that no longer exist. One PR, in this run.
2. **Bump the stamps you actually validated.** A dependent you read in full and judged
   `CURRENT` against doctrine `v<N>` earns `validated_doctrine: <id>@<N>` in its
   frontmatter — that is what the stamp *means*, and this audit is the only process that
   ever legitimately produces one. **Never bump a stamp on a file you did not read**; a
   stamp bumped on trust is the date-bump theater `last_validated_against` already
   demonstrated, and it is worse than no stamp because it launders the next audit's
   baseline.

## When to run

| Trigger | Cadence |
|---|---|
| **After any direction change** | Immediately — recording a ruling is not finished until the audit has run against it. Bump the doctrine `version` in the same PR. |
| **From `retrospective`** | Weekly check, runs when any doctrine version has moved since the last retro, or monthly regardless (Step 5d there) |
| **On demand** | Any time a surface is suspected of teaching the old mode |

The manifest's `version` field is what makes the retro trigger cheap: comparing two integers
tells you whether direction moved, without reading a word of doctrine.

## Sunset

This skill, the `check:guidance-freshness` gate and the `validated_doctrine` stamps enter the
standing **six-week sunset presumption** (CLAUDE.md § process-work throttle): each is renewed
at retro by citing a catch — a named drift found before it shipped, or an audit finding
promoted to a ticket — else deleted. Keeping a dead rule requires evidence, not caution.

**Kill criteria specific to this skill** (from `Docs/plans/2026-08-25-thr-1253-guidance-governance.md`):
if two consecutive audits find nothing across all partitions, drop the retro trigger to
on-version-bump-only. If the manifest costs more edits than it prevents — measured as
manifest-fix commits against drift catches — collapse to stamps-and-audit and retire the gate.

## Rules

1. **Read authorities live, every run.** No embedded doctrine text, ever. (§ Step 1)
2. **Every non-`CURRENT` verdict carries its quote.** No quote, no finding.
3. **Absence is explicit.** `not audited` is a valid result; a missing row is not.
4. **Rank by blast radius**, not by how wrong the sentence is.
5. **The audit reports; the retro promotes.** No tickets from here, bar active corruption.
6. **Never stamp a file you did not read.**

## Related

- `Docs/guidance-manifest.json` — the doctrine registry this audit reads
- `scripts/check-guidance-freshness.ts` — the change-time gate (mechanical half)
- `Docs/plans/2026-08-25-thr-1253-guidance-governance.md` — the design and its kill criteria
- `.claude/skills/impediment-reporter/SKILL.md` — where findings land
- `.claude/skills/retrospective/SKILL.md` § Step 5d — the recurring trigger
