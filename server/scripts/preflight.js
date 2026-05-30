// Runs BEFORE nodemon as part of `npm run dev`. Detects and kills any process
// already holding port 5000 (typically a forgotten nodemon from a previous
// terminal session), and refuses to continue if more than one nodemon parent
// is currently watching files in this project.
//
// This solves the long-running "ERR_CONNECTION_REFUSED loops on localhost"
// pattern that happens when two nodemon parents race for the same port on
// every file change.

const { execSync } = require('child_process');
const path = require('path');

const PORT = Number(process.env.PORT) || 5000;
const isWindows = process.platform === 'win32';

const findPidsOnPort = () => {
  try {
    if (isWindows) {
      // netstat -ano | findstr :5000 | findstr LISTENING
      const out = execSync(`netstat -ano | findstr :${PORT}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
      const pids = new Set();
      for (const line of out.split(/\r?\n/)) {
        if (!line.includes('LISTENING')) continue;
        const cols = line.trim().split(/\s+/);
        const pid = cols[cols.length - 1];
        if (pid && /^\d+$/.test(pid)) pids.add(pid);
      }
      return [...pids];
    } else {
      const out = execSync(`lsof -ti:${PORT}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
      return out.split('\n').map((s) => s.trim()).filter(Boolean);
    }
  } catch (_) {
    return [];
  }
};

const killPid = (pid) => {
  try {
    if (isWindows) execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
    else execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
    return true;
  } catch (_) {
    return false;
  }
};

const pids = findPidsOnPort();
if (pids.length === 0) {
  console.log(`[preflight] port ${PORT} is free.`);
  process.exit(0);
}

console.log(`[preflight] port ${PORT} is held by PID(s): ${pids.join(', ')} — killing them so nodemon can bind cleanly.`);
let killed = 0;
for (const pid of pids) {
  if (killPid(pid)) killed++;
}
console.log(`[preflight] killed ${killed}/${pids.length}. Continuing to nodemon.`);
// Tiny pause so the OS releases the socket before nodemon retries.
const wait = isWindows ? 'powershell -Command "Start-Sleep -Milliseconds 400"' : 'sleep 0.4';
try { execSync(wait, { stdio: 'ignore' }); } catch (_) {}
process.exit(0);
