# Brainstorm companion — Pure Claude Code Migration (2026-07-17)

Written alongside `2026-07-17-pure-claude-code-migration.md`. Records what was considered and why the plan landed where it did. Source: chat session with Christian, 2026-07-17.

## Alternatives considered

**Status quo (rejected).** Keep the dual runtime, keep hardening the bridges. Rejected because the friction is structural, not incidental: ~half of ~192 impediments trace to the split, and every hardening layer (flush-close-guard, skill-sync hook, sandbox-limitations doc) is itself new surface area that has already generated its own impediments (≈28 skill-sync pickup-tax recurrences; flush false-closes ×4). The 07-03 retro's own framing: feature work self-heals, bridge machinery decays.

**Option A — Cowork as messenger only (initially recommended, then rejected).** Keep Cowork as a read-only chat/inbox surface; all repo writes move to CC. Rejected after Christian challenged the premise that Cowork's interface value is high. On inspection, the only structural Cowork-exclusive for his usage was scheduled-task chat surfacing — and retro evidence shows asks staled across 3 retros in chat anyway, so the chat inbox wasn't out-performing a briefing file. Keeping Cowork as messenger preserves a second runtime, memory system, task registry, and OAuth surface to deliver a feature replicable with one markdown file.

**Option B — pure Claude Code (chosen).** Everything in CC. Chosen for lowest total system complexity and elimination (not mitigation) of the corruption/flush/sync classes.

**Big-bang cutover (rejected in favor of phased).** Christian chose phased-one-week via AskUserQuestion: CC equivalents verified before Cowork disabled, deletion last, everything revertable.

## Tensions surfaced

- **Chat register vs chat app.** THR-608 ("Christian is chat-only, plain-language-only") was initially misread as evidence for the Cowork app. Resolved: it's a communication-register requirement, satisfiable in CC interactive sessions. THR-608 itself is unchanged by this migration.
- **Role separation without runtime separation.** The design/executor split has real value (prevents design-on-the-fly during implementation). Resolved: it becomes a session-type distinction enforced by the `design-session` skill, not by a separate runtime.
- **The inbox gap.** Headless CC can't tap Christian on the shoulder. Accepted as a real regression on paper, mitigated by the briefing file + morning-session habit; monitored with an additive escape hatch (notification connector) if it bites.
- **Additive-over-destructive (NFP #6) vs a plan whose value is deletion.** Resolved by sequencing: additive until Phase 2 verification passes, destructive only after, all revertable.

## Premises invoked

- Precedent: Codex-lane retirement (THR-486) — eliminating a lane structurally closed its impediment cluster; cheaper than fixing its plumbing.
- "Anything not in Linear does not happen" (07-03 retro, proven 3×) — hence the full issue breakdown up front.
- Good-enough-for-now / safe-enough-to-try: phased + revertable satisfies both parts.

## Deliberately out of scope

- Personal (non-Threadbare) Cowork scheduled tasks (`weekly-invoice-check`).
- Any change to Linear as the queue, CI as the merge gate, or the hourly Opus pickup — all confirmed working; the migration touches only the Cowork side.
- Vision/rulebook/game content — untouched.
