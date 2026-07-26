const { execSync } = require("child_process");
const fs = require("fs");

// Kill whatever is holding port 3000, without killing ourselves
try {
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

// Clean the Next.js cache
try {
  fs.rmSync(".next", { recursive: true, force: true });
} catch {}
