# Execution Checklist for Documentation Update

Use this checklist to track execution of all 13 tool calls in sequence.

---

## Pre-Execution Verification

Before running any tools, verify these prerequisites:

- [ ] Current working directory is `/sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator`
- [ ] CLAUDE.md file exists and is readable
- [ ] Git is configured (user.name and user.email set)
- [ ] Obsidian vault is accessible via MCP
- [ ] Notion page 3182b241dfb081b9af78c279eef405cf is accessible
- [ ] Both design docs exist:
  - [ ] `Docs/plans/2026-03-07-culture-content-design.md`
  - [ ] `Docs/plans/2026-03-07-narrative-context-design.md`
- [ ] Both implementation files exist:
  - [ ] `src/data/culture-content.ts` (950 lines)
  - [ ] `src/engine/narrativeContext.ts` (200 lines)
- [ ] Both test files exist:
  - [ ] `src/data/__tests__/culture-content.test.ts` (45 tests)
  - [ ] `src/engine/__tests__/narrativeContext.test.ts` (12 tests)

---

## Layer 1: CLAUDE.md Updates (5 tool calls)

### Tool 1: Edit CLAUDE.md — Add Changelog Rows
- [ ] Read `tool-calls-detailed.md` Tool Call 1
- [ ] Verify old_string exists in CLAUDE.md (Phase 6F rows)
- [ ] Execute Edit tool with exact parameters
- [ ] Verify output: file saved, 2 new rows added to changelog
- [ ] Check date: 2026-03-07
- [ ] Check culture-content.ts row: 950 lines mentioned
- [ ] Check narrativeContext.ts row: 200 lines, 12 tests mentioned

### Tool 2: Edit CLAUDE.md — Add Phase Status Line
- [ ] Read `tool-calls-detailed.md` Tool Call 2
- [ ] Verify old_string exists (Phase 6F line)
- [ ] Execute Edit tool with exact parameters
- [ ] Verify output: new line added after Phase 6F
- [ ] Check completion status: ✅ Complete
- [ ] Check file counts: culture-content.ts (950 lines, 45 tests), narrativeContext.ts (200 lines, 12 tests)

### Tool 3: Edit CLAUDE.md — Update Current Phase Line
- [ ] Read `tool-calls-detailed.md` Tool Call 3
- [ ] Verify old_string exists (Playable map line)
- [ ] Execute Edit tool with exact parameters
- [ ] Verify output: current phase updated to "Culture & narrative context complete"
- [ ] Verify next up suggestion updated

### Tool 4: Edit CLAUDE.md — Update Engine Stats
- [ ] Read `tool-calls-detailed.md` Tool Call 4
- [ ] Verify old_string exists (~67 modules line)
- [ ] Execute Edit tool with exact parameters
- [ ] Verify output: modules updated to ~69
- [ ] Verify lines updated to ~10,850
- [ ] Verify tests updated to ~1,084
- [ ] Verify test files updated to 81

### Tool 5: Edit CLAUDE.md — Update Content Stats
- [ ] Read `tool-calls-detailed.md` Tool Call 5
- [ ] Verify old_string exists (culture-content.ts scoped line)
- [ ] Execute Edit tool with exact parameters
- [ ] Verify output: packages updated to 9
- [ ] Verify culture-content.ts now "implemented at 950 lines" (not "scoped")
- [ ] Verify narrative context builder mentioned (200 lines)

---

## Layer 2: Obsidian System Notes (4 tool calls)

### Tool 6: Obsidian Append — Culture Content Data.md
- [ ] Read `tool-calls-detailed.md` Tool Call 6
- [ ] Verify filepath: `TheFantasyWorldSimulator/Systems/Culture Content Data.md`
- [ ] Execute obsidian_append_content with full markdown
- [ ] Verify output: new file created with:
  - [ ] YAML frontmatter: tags [system, content, culture]
  - [ ] Heading: # Culture Content Data
  - [ ] Added date: *(added 2026-03-07 — Content Strategy & Architecture Task 1)*
  - [ ] Overview section explaining the package
  - [ ] Structure table with 6 fields
  - [ ] Content Layers section (4 layers)
  - [ ] Implementation section with 2 files
  - [ ] Connections section with 5 wikilinks

### Tool 7: Obsidian Append — Narrative Context Pipeline.md
- [ ] Read `tool-calls-detailed.md` Tool Call 7
- [ ] Verify filepath: `TheFantasyWorldSimulator/Systems/Narrative Context Pipeline.md`
- [ ] Execute obsidian_append_content with full markdown
- [ ] Verify output: new file created with:
  - [ ] YAML frontmatter: tags [system, engine, narrative, content]
  - [ ] Heading: # Narrative Context Pipeline
  - [ ] Added date: *(added 2026-03-07 — Content Strategy & Architecture Task 2)*
  - [ ] Overview section with 3-stage architecture
  - [ ] Three Stages subsections (Harvest, Score, Select & Feed)
  - [ ] Implementation section with 2 files
  - [ ] Connections section with 5 wikilinks

### Tool 8: Obsidian Read — Index.md
- [ ] Read `tool-calls-detailed.md` Tool Call 8
- [ ] Execute obsidian_get_file_contents with `filepath: "TheFantasyWorldSimulator/Index.md"`
- [ ] Verify output: file content returned (read-only, no modifications)
- [ ] Note: Use result to verify current structure before Tool 9

### Tool 9: Obsidian Append — Index.md New Section
- [ ] Read `tool-calls-detailed.md` Tool Call 9
- [ ] Verify filepath: `TheFantasyWorldSimulator/Index.md`
- [ ] Execute obsidian_append_content with new section markdown
- [ ] Verify output: new section added at end of file:
  - [ ] Heading: ## Content Strategy & Architecture — Phase Completion *(added 2026-03-07)*
  - [ ] Two bullet points with [[Culture Content Data]] and [[Narrative Context Pipeline]] links
  - [ ] Each link has added date and description

---

## Layer 3: Notion Backlog (3 tool calls)

### Tool 10: Notion Fetch — Read Backlog
- [ ] Read `tool-calls-detailed.md` Tool Call 10
- [ ] Execute notion-fetch with `id: "3182b241dfb081b9af78c279eef405cf"`
- [ ] Verify output: page content returned (current state)
- [ ] **IMPORTANT:** Use this output to determine `selection_with_ellipsis` values for Tools 11-12
- [ ] Note the exact structure of Content Strategy & Architecture section
- [ ] Note the exact location of Reference Documents section

### Tool 11: Notion Update — Replace Content Strategy Section
- [ ] Read `tool-calls-detailed.md` Tool Call 11
- [ ] From Tool 10 output, identify the `selection_with_ellipsis` value:
  - [ ] Start with "## Content Strategy" (first ~10 chars)
  - [ ] Add "..."
  - [ ] End with last pending item text (last ~10 chars)
  - [ ] Example: "## Content St... Pending task 5"
- [ ] Update the tool parameters with actual `selection_with_ellipsis` value
- [ ] Execute notion-update-page with `command: "replace_content_range"`
- [ ] Verify output: section replaced with:
  - [ ] Header: ## Content Strategy & Architecture ✅ Complete (2026-03-07)
  - [ ] Summary line with design doc links and stats (57 tests, 1,150 lines)
  - [ ] 4 completed checkboxes with task descriptions
  - [ ] All tasks marked [x] (completed)

### Tool 12: Notion Update — Insert Reference Docs
- [ ] Read `tool-calls-detailed.md` Tool Call 12
- [ ] From Tool 10 output, identify the `selection_with_ellipsis` value for Reference Documents:
  - [ ] Could be section header "## Reference Documents" or last entry
  - [ ] Use ~10 chars from start + "..." + ~10 chars from end
- [ ] Update the tool parameters with actual `selection_with_ellipsis` value
- [ ] Execute notion-update-page with `command: "insert_content_after"`
- [ ] Verify output: two new reference doc lines added:
  - [ ] `Docs/plans/2026-03-07-culture-content-design.md` — Culture content data design
  - [ ] `Docs/plans/2026-03-07-narrative-context-design.md` — Narrative context pipeline design

---

## Layer 4: Git Commit (1 tool call)

### Tool 13: Bash Git Commit
- [ ] Read `tool-calls-detailed.md` Tool Call 13
- [ ] Change to correct directory: `/sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator`
- [ ] Execute bash with full git add + commit command
- [ ] Verify output: commit succeeds with:
  - [ ] Message: "docs: update project status for culture content & narrative context completion"
  - [ ] CLAUDE.md file added to commit
  - [ ] Co-Authored-By footer included
  - [ ] Commit hash shown

---

## Post-Execution Validation

After all 13 tools complete, verify these outcomes:

### CLAUDE.md Changes
- [ ] Changelog has 2 new rows for 2026-03-07
- [ ] Project Status shows Culture & Narrative Context ✅ Complete
- [ ] Engine stats: ~69 modules, ~10,850 lines, ~1,084 tests, 81 files
- [ ] Content stats: 9 packages (culture-content.ts implemented)
- [ ] Current phase updated to reflect new completion
- [ ] File is committed to git

### Obsidian Vault Changes
- [ ] Systems/Culture Content Data.md exists with correct structure
- [ ] Systems/Narrative Context Pipeline.md exists with correct structure
- [ ] Index.md has new section "Content Strategy & Architecture — Phase Completion"
- [ ] New links in Index.md point to both new system notes
- [ ] All wikilinks are properly formatted [[Like This]]

### Notion Backlog Changes
- [ ] Content Strategy & Architecture section marked ✅ Complete (2026-03-07)
- [ ] Summary line shows correct stats: 57 tests, 1,150 lines
- [ ] All 4 tasks in section marked [x] (completed)
- [ ] Both new reference docs in Reference Documents section
- [ ] Notion page displays correctly in web UI

### Git Changes
- [ ] CLAUDE.md is staged and committed
- [ ] Commit message follows format (title + body + Co-Authored-By)
- [ ] `git log` shows new commit at top
- [ ] `git status` shows working tree clean

---

## Common Issues & Resolutions

### Issue: CLAUDE.md Edit Tool Fails — "old_string not found"
**Resolution:**
1. Verify you're using the exact text from the current CLAUDE.md
2. Check for hidden characters (copy directly from file, not hand-typed)
3. Check line endings (Windows vs Unix)
4. If multiple identical strings exist, try adding more context (previous/next line)

### Issue: Obsidian Patch Fails with "invalid-target"
**Resolution:**
✓ This is expected behavior — we use `obsidian_append_content` instead of patch for all operations

### Issue: Notion Update Fails — "could not find content"
**Resolution:**
1. Re-run Tool 10 (notion-fetch) to get current page state
2. Verify `selection_with_ellipsis` exactly matches text in fetched content
3. If still failing, try increasing the character count (~10 chars → ~15 chars)
4. Verify no special characters in selection (they must be included exactly as in page)

### Issue: Git Commit Fails — "nothing to commit"
**Resolution:**
1. Verify CLAUDE.md was actually modified by Edit tools (check file timestamp)
2. Verify working directory is correct: `/sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator`
3. Run `git status` to see what's staged
4. Try `git add CLAUDE.md` again before commit

---

## Final Sign-Off

When all 13 tools complete successfully and all validations pass:

- [ ] All three documentation layers updated
- [ ] All changes reflect completed work accurately
- [ ] No errors or missing content
- [ ] Ready for next phase of development
- [ ] Documentation is current as of 2026-03-07

**Execution Completed:** _________________ (date/time)
**Executor:** _________________________
**Notes:** ___________________________
