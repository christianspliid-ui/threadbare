#!/usr/bin/env bash
# Gate 4: Cowork Role Boundary
# Blocks code writes and git mutations in Cowork sessions.
# In Claude Code sessions, exits immediately (no blocking).

set -euo pipefail

HOOK_DIR="$(cd "$(dirname "$0")" && pwd)"
INPUT=$(cat)
TOOL=$(echo "$INPUT" | node "$HOOK_DIR/lib/json-get.js" tool_name)

# --- Cowork detection ---
MARKER="/tmp/.cowork-session-marker"
IS_COWORK=false

if [[ -f "$MARKER" ]] && grep -q "COWORK_SESSION=1" "$MARKER" 2>/dev/null; then
  IS_COWORK=true
fi

# Fallback: check cwd heuristic
if [[ "$IS_COWORK" == "false" ]]; then
  CWD=$(echo "$INPUT" | node "$HOOK_DIR/lib/json-get.js" cwd)
  if [[ "$CWD" == */sessions/* ]]; then
    IS_COWORK=true
  fi
fi

# Not Cowork → allow everything
if [[ "$IS_COWORK" == "false" ]]; then
  exit 0
fi

# --- Cowork session: enforce role boundary ---

if [[ "$TOOL" == "Write" || "$TOOL" == "Edit" ]]; then
  FILE_PATH=$(echo "$INPUT" | node "$HOOK_DIR/lib/json-get.js" tool_input.file_path)

  # Normalize path separators
  FILE_PATH="${FILE_PATH//\\//}"

  # ALLOW: .planning/ coordination files
  if [[ "$FILE_PATH" == */.planning/* ]] || [[ "$FILE_PATH" == */.planning ]]; then
    exit 0
  fi

  # ALLOW: Docs/ directory (design docs, plans, changelog, ways of working)
  if [[ "$FILE_PATH" == */Docs/* ]] || [[ "$FILE_PATH" == */docs/* ]]; then
    exit 0
  fi

  # ALLOW: outputs directory (Cowork workspace artifacts)
  if [[ "$FILE_PATH" == */outputs/* ]]; then
    exit 0
  fi

  # ALLOW: Obsidian vault .md files (not in src/)
  if [[ "$FILE_PATH" == */TheFantasyWorldSimulator/*.md ]] && [[ "$FILE_PATH" != */src/* ]]; then
    exit 0
  fi

  # ALLOW: .claude/settings.json (hook config itself)
  if [[ "$FILE_PATH" == */.claude/settings.json ]]; then
    exit 0
  fi

  # BLOCK: src/ directory (production code)
  if [[ "$FILE_PATH" == */src/* ]]; then
    echo "Cowork role boundary: Write/Edit to src/ is not allowed in Cowork sessions. Cowork does design, planning, and documentation — not implementation. Write a plan in Docs/plans/ and hand off to Claude Code via Linear." >&2
    exit 2
  fi

  # BLOCK: scripts/ directory
  if [[ "$FILE_PATH" == */scripts/* ]]; then
    echo "Cowork role boundary: Write/Edit to scripts/ is not allowed in Cowork sessions. Hand off to Claude Code via Linear." >&2
    exit 2
  fi

  # BLOCK: code file extensions in project root
  if [[ "$FILE_PATH" =~ \.(ts|tsx|js|jsx|css|scss)$ ]] && [[ "$FILE_PATH" != */Docs/* ]] && [[ "$FILE_PATH" != */.planning/* ]]; then
    echo "Cowork role boundary: Writing code files (${FILE_PATH##*.}) is not allowed in Cowork sessions. Write a plan and hand off to Claude Code." >&2
    exit 2
  fi

  # BLOCK: package.json, tsconfig, vite config, etc.
  if [[ "$FILE_PATH" == */package.json ]] || [[ "$FILE_PATH" == */tsconfig*.json ]] || [[ "$FILE_PATH" == */vite.config.* ]] || [[ "$FILE_PATH" == */vercel.json ]]; then
    echo "Cowork role boundary: Config file changes are not allowed in Cowork sessions. Hand off to Claude Code." >&2
    exit 2
  fi

  # Default: allow (unknown paths get through — better than false-blocking docs)
  exit 0
fi

if [[ "$TOOL" == "Bash" ]]; then
  COMMAND=$(echo "$INPUT" | node "$HOOK_DIR/lib/json-get.js" tool_input.command)

  # BLOCK: git mutation commands
  if [[ "$COMMAND" == git\ add* ]] || \
     [[ "$COMMAND" == git\ commit* ]] || \
     [[ "$COMMAND" == git\ push* ]] || \
     [[ "$COMMAND" == git\ merge* ]] || \
     [[ "$COMMAND" == git\ checkout* ]] || \
     [[ "$COMMAND" == git\ rebase* ]] || \
     [[ "$COMMAND" == git\ reset* ]] || \
     [[ "$COMMAND" == git\ stash* ]] || \
     [[ "$COMMAND" == git\ cherry-pick* ]]; then
    echo "Cowork role boundary: git mutation commands are not allowed in Cowork sessions. Cowork does not touch git. Hand off to Claude Code via Linear." >&2
    exit 2
  fi

  # ALLOW: read-only git commands
  if [[ "$COMMAND" == git\ log* ]] || \
     [[ "$COMMAND" == git\ diff* ]] || \
     [[ "$COMMAND" == git\ status* ]] || \
     [[ "$COMMAND" == git\ show* ]] || \
     [[ "$COMMAND" == git\ blame* ]] || \
     [[ "$COMMAND" == git\ ls-files* ]] || \
     [[ "$COMMAND" == git\ remote* ]]; then
    exit 0
  fi

  # BLOCK: build/test commands (Cowork VM can't run them reliably anyway)
  if [[ "$COMMAND" == npm\ test* ]] || \
     [[ "$COMMAND" == npm\ run\ build* ]] || \
     [[ "$COMMAND" == npm\ run\ dev* ]] || \
     [[ "$COMMAND" == npx\ vite* ]]; then
    echo "Cowork role boundary: Build/test commands are not allowed in Cowork sessions (VM lacks native modules). Use 'npx tsc --noEmit' for read-only type checking, or hand off to Claude Code." >&2
    exit 2
  fi

  # ALLOW: npx tsc --noEmit (read-only analysis)
  if [[ "$COMMAND" == *"tsc --noEmit"* ]]; then
    exit 0
  fi

  # Default: allow other bash commands
  exit 0
fi

# Other tools (Read, etc.) → always allow
exit 0
