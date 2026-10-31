#!/usr/bin/env bash
# proto THR-2090: entropy-first and life-second Hungers, baseline + no-stage (never merge)
cd "$(dirname "$0")/.."
R=scripts/_scratch-2090-results
run() { local h=$1 out=$2; shift 2; env "$@" node .cache/c2090.mjs sweep seeded "$h" 2>&1 | grep -v "^    at " > "$R/$out.txt"; }
run consume consume-base SYNTH=1 &
run kindle kindle-base SYNTH=1 &
run kindle kindle-stagefree SYNTH=1 STAGEFREE=1 &
wait
