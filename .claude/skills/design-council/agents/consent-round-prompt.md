# Design Council Consent Round Prompt

### Phase 3 — Consent round (on any concrete proposal)

When a proposal is posted, pause the discussion and run the consent sequence. Each sub-phase is a separate orchestrator call so agents do not mix phases in one turn.

1. **Clarifying questions.** Each agent, in order, asks *one* question or says "no questions." Proposer answers inline.
2. **Quick reactions.** Each agent writes a gut-level response — support, concern, suggested amendment. Not yet consent.
3. **Amend.** Proposer revises or withdraws. Written to the page.
4. **Consent.** Each agent writes *exactly* one of:
   - `CONSENT`
   - `OBJECT: &lt;which half of the test fails, concrete reason&gt;` (good-enough-for-now OR safe-enough-to-try)
5. **Integration.** If any objection, proposer + objectors revise to address the objection. Re-run consent. Maximum 2 integration loops, then escalate.
6. **Decide.** All consent → log as `DEC-N` in the Decisions section at the top of the page.
