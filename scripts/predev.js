const { execSync } = require("child_process");

/*
 * Runs before `next dev`. Frees port 3000 — and deliberately does NOT touch
 * .next.
 *
 * It used to delete the whole directory on every start, which made every
 * `npm run dev` a cold start: Turbopack's compilation cache lives in
 * .next/cache, so wiping it threw away exactly the work that makes the next
 * start fast. It also let a starting dev server pull .next out from under a
 * `next build` running alongside it, which corrupts both.
 *
 * If the cache does go stale — after a Next upgrade, or a module that will not
 * stop being wrong — `npm run dev:clean` clears it explicitly. That should be
 * the exception you reach for, not a cost paid on every start.
 */
try {
  // Kill whatever is holding port 3000, without killing ourselves
  const out = execSync("netstat -aon").toString();
  const match = out.match(/TCP\s+[\d.:]+:3000\s+[\d.:]+\s+LISTENING\s+(\d+)/);
  if (match) {
    const pid = match[1];
    if (pid !== String(process.ppid)) {
      execSync(`taskkill /F /PID ${pid} /T`, { stdio: "ignore" });
      console.log(`Killed process ${pid} holding port 3000`);
    }
  }
} catch {}
