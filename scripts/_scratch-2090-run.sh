#!/usr/bin/env bash
# proto THR-2090: census arms for the doom-wears-life question (never merge)
cd "$(dirname "$0")/.."
R=scripts/_scratch-2090-results
run() { local out=$1; shift; env "$@" node .cache/c2090.mjs sweep seeded "${HUNGER}" 2>&1 | grep -v "^    at " > "$R/$out.txt"; }
HUNGER=gather run gather-nostage SYNTH=1 NOSTAGE=1 &
HUNGER=gather run gather-stagefree SYNTH=1 STAGEFREE=1 &
HUNGER=haunt run haunt-nostage SYNTH=1 NOSTAGE=1 &
wait
