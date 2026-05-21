// Strip `console.log(...)` statements that are clearly debug noise.
// Preserves console.error and console.warn (intentional error/warning output).
// Preserves console.log lines that contain "online", "CONNECTED", "FATAL", or "Seeded" (boot/setup messages).
const fs = require('fs');
const path = require('path');

const KEEP_KEYWORDS = ['online', 'CONNECTED', 'FATAL', 'Seeded', 'Refused', 'refuses to'];
const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', 'uploads', 'scripts']);

const walk = (dir, out = []) => {
  for (const name of fs.readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(?:jsx?|cjs|mjs)$/.test(p)) out.push(p);
  }
  return out;
};

const roots = [
  path.join(__dirname, 'client', 'src'),
  path.join(__dirname, 'server'),
];

let stripped = 0;
let kept = 0;
const summary = {};

for (const root of roots) {
  if (!fs.existsSync(root)) continue;
  for (const file of walk(root)) {
    const text = fs.readFileSync(file, 'utf8');
    const lines = text.split(/\r?\n/);
    const out = [];
    let fileStripped = 0;

    for (const line of lines) {
      // Match a line whose ONLY content is a console.log(...) statement (possibly indented, terminated by ; or })
      const stripCandidate = /^\s*console\.log\s*\(.*\)\s*;?\s*$/.test(line);
      if (stripCandidate) {
        const shouldKeep = KEEP_KEYWORDS.some(k => line.includes(k));
        if (shouldKeep) {
          kept++;
          out.push(line);
        } else {
          stripped++;
          fileStripped++;
          // drop the line entirely
        }
      } else {
        out.push(line);
      }
    }

    if (fileStripped > 0) {
      fs.writeFileSync(file, out.join('\n'));
      summary[path.relative(__dirname, file)] = fileStripped;
    }
  }
}

console.log('Stripped console.log lines per file:');
for (const [f, n] of Object.entries(summary).sort((a, b) => b[1] - a[1])) {
  console.log('  ' + f + ': ' + n);
}
console.log('Total console.log stripped:', stripped);
console.log('console.log kept (boot/setup):', kept);
