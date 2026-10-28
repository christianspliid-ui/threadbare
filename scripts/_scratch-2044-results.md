# THR-2044 prototype results (never merged)

node .cache/s2044.mjs --delay {0,12,24} --seeds 42,99,7 --ticks 600, medium, main @ 4f165a9f + scripts/_scratch-2044.ts

```
delay 0 seed 42 (300 s) | Loan resolved 26, debts 26 | Collection resolved 12, settles 12: paid 0, written off 0, no_debt_owed 12 (100%) | seeds planted 0, fired 0, place never reached 0, other discard 0, latency p50 NaN p90 NaN
delay 0 seed 99 (343 s) | Loan resolved 22, debts 22 | Collection resolved 13, settles 13: paid 0, written off 1, no_debt_owed 12 (92%) | seeds planted 0, fired 0, place never reached 0, other discard 0, latency p50 NaN p90 NaN
delay 0 seed 7 (433 s) | Loan resolved 17, debts 17 | Collection resolved 7, settles 7: paid 1, written off 0, no_debt_owed 6 (86%) | seeds planted 0, fired 0, place never reached 0, other discard 0, latency p50 NaN p90 NaN
delay 12 seed 42 (300 s) | Loan resolved 22, debts 22 | Collection resolved 41, settles 41: paid 19, written off 3, no_debt_owed 19 (46%) | seeds planted 22, fired 22, place never reached 0, other discard 0, latency p50 13 p90 17
delay 12 seed 99 (351 s) | Loan resolved 22, debts 22 | Collection resolved 37, settles 37: paid 13, written off 5, no_debt_owed 19 (51%) | seeds planted 22, fired 19, place never reached 2, other discard 0, latency p50 13 p90 20
delay 12 seed 7 (424 s) | Loan resolved 19, debts 19 | Collection resolved 30, settles 30: paid 16, written off 3, no_debt_owed 11 (37%) | seeds planted 19, fired 19, place never reached 0, other discard 0, latency p50 13 p90 26
delay 24 seed 42 (297 s) | Loan resolved 28, debts 28 | Collection resolved 42, settles 42: paid 22, written off 5, no_debt_owed 15 (36%) | seeds planted 28, fired 27, place never reached 1, other discard 0, latency p50 25 p90 27
delay 24 seed 99 (369 s) | Loan resolved 21, debts 21 | Collection resolved 40, settles 40: paid 17, written off 4, no_debt_owed 19 (48%) | seeds planted 21, fired 21, place never reached 0, other discard 0, latency p50 25 p90 29
delay 24 seed 7 (419 s) | Loan resolved 23, debts 23 | Collection resolved 36, settles 36: paid 14, written off 8, no_debt_owed 14 (39%) | seeds planted 23, fired 23, place never reached 0, other discard 0, latency p50 25 p90 29
```
