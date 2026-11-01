import { describe, expect, it } from "vitest";

import {
  browserKey,
  coresUsed,
  decideBrowsers,
  findOrphanViteServers,
  findPlaywrightBrowsers,
  indexRows,
  orphanRoot,
  type ProcRow,
} from "../reap-dev-processes";

const MINUTE = 60_000;
const NOW = 1_800_000_000_000;
const REPO = "C:/Users/chris/Dev/Projects/TheFantasyWorldSimulator";
const VITE_CMD = `"node" "C:\\Users\\chris\\Dev\\Projects\\TheFantasyWorldSimulator\\.claude\\worktrees\\happy-tree-1a2b3c\\node_modules\\.bin\\..\\vite\\bin\\vite.js" --port 5287 --strictPort`;

function proc(pid: number, ppid: number, name: string, cmd = "", createdMinAgo = 300, cpu = 0): ProcRow {
  return { pid, ppid, name, cmd, created: NOW - createdMinAgo * MINUTE, cpu };
}

/** The shape `preview_start` leaves: bash ← bash ← npx node ← cmd ← vite node. */
function viteChain(topParent: number, createdMinAgo = 300): ProcRow[] {
  return [
    proc(10, topParent, "bash.exe", "bash npx vite", createdMinAgo),
    proc(11, 10, "bash.exe", "bash npx vite", createdMinAgo),
    proc(12, 11, "node.exe", "npx-cli.js vite --port 5287", createdMinAgo),
    proc(13, 12, "cmd.exe", "", createdMinAgo),
    proc(14, 13, "node.exe", VITE_CMD, createdMinAgo),
    proc(15, 14, "esbuild.exe", "esbuild.exe --service", createdMinAgo),
  ];
}

describe("orphanRoot", () => {
  it("returns the topmost live ancestor when the launcher's parent has exited", () => {
    const rows = viteChain(9999); // 9999 is not in the snapshot
    expect(orphanRoot(14, indexRows(rows))?.pid).toBe(10);
  });

  it("keeps a server whose chain still reaches the Claude app", () => {
    const rows = [proc(1, 0, "claude.exe", "", 2000), ...viteChain(1)];
    expect(orphanRoot(14, indexRows(rows))).toBeNull();
  });

  it("keeps a server started from a terminal", () => {
    const rows = [proc(2, 0, "WindowsTerminal.exe", "", 2000), proc(3, 2, "pwsh.exe", "", 1000), ...viteChain(3)];
    expect(orphanRoot(14, indexRows(rows))).toBeNull();
  });

  it("treats a parent PID reused by a newer process as exited", () => {
    // pid 1 is now a claude.exe started AFTER the wrapper — it cannot be its parent.
    const rows = [proc(1, 0, "claude.exe", "", 10), ...viteChain(1, 300)];
    expect(orphanRoot(14, indexRows(rows))?.pid).toBe(10);
  });
});

describe("findOrphanViteServers", () => {
  it("reports an orphaned server with its port, worktree and kill root", () => {
    const [v] = findOrphanViteServers(viteChain(9999), REPO, NOW, 60);
    expect(v).toMatchObject({ vitePid: 14, port: "5287", worktree: "happy-tree-1a2b3c" });
    expect(v.killRoot.pid).toBe(10);
  });

  it("leaves a server younger than the age floor alone", () => {
    expect(findOrphanViteServers(viteChain(9999, 30), REPO, NOW, 60)).toEqual([]);
  });

  it("ignores Vite servers from other projects", () => {
    expect(findOrphanViteServers(viteChain(9999), "C:/Users/chris/Dev/Projects/OtherApp", NOW, 60)).toEqual([]);
  });

  it("ignores non-Vite processes, even orphaned ones under the repo", () => {
    const rows = [proc(20, 9999, "node.exe", `node ${REPO}/scripts/something.ts`)];
    expect(findOrphanViteServers(rows, REPO, NOW, 60)).toEqual([]);
  });
});

describe("Playwright browsers", () => {
  const root = proc(50, 1, "chrome.exe", `chrome.exe --user-data-dir="C:\\Users\\chris\\AppData\\Local\\ms-playwright-mcp\\mcp-chrome-x"`, 600, 1e9);
  const gpu = proc(51, 50, "chrome.exe", "chrome.exe --type=gpu-process --enable-unsafe-swiftshader", 300, 5e9);
  const renderer = proc(52, 50, "chrome.exe", "chrome.exe --type=renderer", 300, 2e9);
  const ownChrome = proc(60, 1, "chrome.exe", "chrome.exe", 600, 9e9);
  const rows = [proc(1, 0, "claude.exe", "", 2000), root, gpu, renderer, ownChrome];

  it("finds only the Playwright profile's root, with its whole tree", () => {
    const trees = findPlaywrightBrowsers(rows);
    expect(trees).toHaveLength(1);
    expect(trees[0].root.pid).toBe(50);
    expect([...trees[0].pids].sort()).toEqual([50, 51, 52]);
  });

  it("measures cores across the tree from two snapshots", () => {
    const [tree] = findPlaywrightBrowsers(rows);
    // 10 s window; GPU burns 8 cores (8e8 * 100ns = 80 s), renderer 1 core (1e8 = 10 s).
    const after = rows.map((r) => (r.pid === 51 ? { ...r, cpu: r.cpu + 8e8 } : r.pid === 52 ? { ...r, cpu: r.cpu + 1e8 } : r));
    expect(coresUsed(tree, indexRows(rows), indexRows(after), 10_000)).toBeCloseTo(9, 5);
  });

  it("holds on the first hot run and kills on the second", () => {
    const [tree] = findPlaywrightBrowsers(rows);
    const first = decideBrowsers([{ tree, cores: 9 }], {}, 2, 2);
    expect(first.decisions[0]).toMatchObject({ strikes: 1, kill: false });
    const second = decideBrowsers([{ tree, cores: 9 }], first.next, 2, 2);
    expect(second.decisions[0]).toMatchObject({ strikes: 2, kill: true });
    expect(second.next).toEqual({});
  });

  it("resets the strike count when a run comes back cool", () => {
    const [tree] = findPlaywrightBrowsers(rows);
    const cooled = decideBrowsers([{ tree, cores: 0.3 }], { [browserKey(tree.root)]: 1 }, 2, 2);
    expect(cooled.decisions[0]).toMatchObject({ strikes: 0, kill: false });
    expect(cooled.next).toEqual({});
  });

  it("does not carry strikes to a new browser that reuses the PID", () => {
    const [tree] = findPlaywrightBrowsers(rows);
    const stale = { [`${tree.root.pid}@${tree.root.created - 1}`]: 1 };
    expect(decideBrowsers([{ tree, cores: 9 }], stale, 2, 2).decisions[0].kill).toBe(false);
  });
});
