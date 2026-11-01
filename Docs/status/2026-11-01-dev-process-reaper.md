# Dev-process reaper — orphaned Vite servers, runaway Playwright browsers

**Shipped 2026-11-01** from an attended session (no ticket; Christian's 2026-10-09 ruling that harness tweaks ship directly).

**Trigger.** Christian's YouTube stuttered. The cause was a Playwright-controlled Chrome owned by the Claude app's Playwright MCP, left on a WebGL page since the night before. With no GPU it rendered through SwiftShader with background throttling off: ~47% of all 32 threads. Nine Vite servers from ended sessions were also still running (up to 33 h). Their launchers' parents had exited, so nothing would ever stop them. They held their worktrees open, and the git reaper logged "removal FAILED (in use?)" and kept those worktrees and branches.

**What changed.** `clean-stale-git.sh` gains pass 0, a one-line call to the tracked `scripts/reap-dev-processes.ts`, the same split as the donor repair (THR-1115):

- **Orphaned Vite server:** a `vite/bin/vite.js` process under this repo whose ancestor chain hits a dead parent before any live anchor (`claude.exe`, a terminal, an editor, Explorer, Task Scheduler's `svchost.exe`), older than 60 min. The whole abandoned tree is killed from its topmost live process. A PID reused by a newer process counts as dead.
- **Runaway Playwright browser:** a Chrome with `ms-playwright` in its command line whose tree averages more than 2 cores over a 10 s sample on 2 consecutive hourly runs. Strikes persist in `C:/Users/chris/Dev/Projects/clean-stale-procs.state.json`, keyed by pid and creation time.

**Verified on the host.** A deliberately orphaned `npx vite --port 5999` was found and killed with its whole tree, including esbuild. A live Playwright Chrome was detected and held, not killed. 13 unit tests cover the orphan walk, PID reuse, the age and repo filters, the CPU math and the strike rule.
