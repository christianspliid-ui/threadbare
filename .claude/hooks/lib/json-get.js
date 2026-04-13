#!/usr/bin/env node
// Shared helper: extract a dot-path from JSON on stdin.
// Usage: echo '{"a":{"b":"c"}}' | node json-get.js a.b
//        → prints "c"
// Missing keys print empty string. "false" and "null" print as-is.
const chunks = [];
process.stdin.setEncoding('utf8');
process.stdin.on('data', c => chunks.push(c));
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(chunks.join(''));
    const path = process.argv[2] || '';
    let val = data;
    for (const p of path.split('.')) {
      if (val == null) break;
      val = val[p];
    }
    console.log(val == null ? '' : String(val));
  } catch {
    console.log('');
  }
});
