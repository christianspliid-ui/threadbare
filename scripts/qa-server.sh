#!/usr/bin/env bash
# qa-server.sh — Start an isolated Vite dev server for QA on a free port.
#
# Usage:
#   ./scripts/qa-server.sh start   → starts server, prints JSON {port, pid, url}
#   ./scripts/qa-server.sh stop    → kills the QA server if running
#   ./scripts/qa-server.sh status  → prints current status
#
# The server PID and port are stored in .qa-server.json so other scripts
# (and the QA orchestrator) can find and clean up the process.

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STATE_FILE="$PROJECT_ROOT/.qa-server.json"

find_free_port() {
  # Try ports 5180–5199 (well away from the default 5173 dev server)
  for port in $(seq 5180 5199); do
    if ! netstat -an 2>/dev/null | grep -q ":${port} " && \
       ! ss -tlnp 2>/dev/null | grep -q ":${port} "; then
      echo "$port"
      return 0
    fi
  done
  # Fallback: let the OS pick
  echo "0"
}

cmd_start() {
  # If already running, report it
  if [ -f "$STATE_FILE" ]; then
    existing_pid=$(cat "$STATE_FILE" | grep -o '"pid":[0-9]*' | grep -o '[0-9]*')
    if kill -0 "$existing_pid" 2>/dev/null; then
      echo "QA server already running (PID $existing_pid)." >&2
      cat "$STATE_FILE"
      return 0
    else
      # Stale state file
      rm -f "$STATE_FILE"
    fi
  fi

  port=$(find_free_port)

  # Start Vite on the chosen port, backgrounded, with output captured
  cd "$PROJECT_ROOT"
  npx vite --port "$port" --strictPort > /tmp/qa-vite-$port.log 2>&1 &
  vite_pid=$!

  # Wait up to 15s for the server to be ready
  for i in $(seq 1 30); do
    if curl -s -o /dev/null "http://localhost:$port" 2>/dev/null; then
      break
    fi
    sleep 0.5
  done

  # Verify it actually started
  if ! kill -0 "$vite_pid" 2>/dev/null; then
    echo "ERROR: Vite failed to start. Check /tmp/qa-vite-$port.log" >&2
    return 1
  fi

  # Write state
  cat > "$STATE_FILE" <<EOF
{"port":$port,"pid":$vite_pid,"url":"http://localhost:$port"}
EOF

  echo "QA server started on port $port (PID $vite_pid)"
  cat "$STATE_FILE"
}

cmd_stop() {
  if [ ! -f "$STATE_FILE" ]; then
    echo "No QA server running (no state file)."
    return 0
  fi

  pid=$(cat "$STATE_FILE" | grep -o '"pid":[0-9]*' | grep -o '[0-9]*')
  port=$(cat "$STATE_FILE" | grep -o '"port":[0-9]*' | grep -o '[0-9]*')

  if kill -0 "$pid" 2>/dev/null; then
    kill "$pid" 2>/dev/null || true
    # Wait briefly for clean shutdown
    for i in $(seq 1 10); do
      kill -0 "$pid" 2>/dev/null || break
      sleep 0.5
    done
    # Force kill if still alive
    kill -9 "$pid" 2>/dev/null || true
    echo "QA server stopped (was PID $pid on port $port)."
  else
    echo "QA server process $pid already dead."
  fi

  rm -f "$STATE_FILE"
  rm -f "/tmp/qa-vite-$port.log"
}

cmd_status() {
  if [ ! -f "$STATE_FILE" ]; then
    echo '{"running":false}'
    return 0
  fi

  pid=$(cat "$STATE_FILE" | grep -o '"pid":[0-9]*' | grep -o '[0-9]*')
  if kill -0 "$pid" 2>/dev/null; then
    echo -n '{"running":true,'
    cat "$STATE_FILE" | tr -d '{}\n'
    echo '}'
  else
    echo '{"running":false,"stale":true}'
    rm -f "$STATE_FILE"
  fi
}

case "${1:-}" in
  start)  cmd_start ;;
  stop)   cmd_stop ;;
  status) cmd_status ;;
  *)
    echo "Usage: $0 {start|stop|status}" >&2
    exit 1
    ;;
esac
