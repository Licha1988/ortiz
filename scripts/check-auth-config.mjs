import { readFileSync, existsSync } from "node:fs";
import bcrypt from "bcryptjs";

const path = ".env.local";
if (!existsSync(path)) {
  console.log("Falta .env.local");
  process.exit(1);
}

const text = readFileSync(path, "utf8");
const env = {};
for (const line of text.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eq = trimmed.indexOf("=");
  if (eq <= 0) continue;
  env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
}

const secret = env.AUTH_SECRET ?? "";
const usersRaw = env.AUTH_USERS ?? "";

console.log("AUTH_SECRET:", secret ? `set (${secret.length} chars, valid=${secret.length >= 32})` : "MISSING");
console.log("AUTH_USERS:", usersRaw ? `set (${usersRaw.length} chars)` : "MISSING");

if (!usersRaw) process.exit(0);

try {
  const users = JSON.parse(usersRaw);
  console.log("users:", users.length);
  for (const user of users) {
    console.log(`  - ${user.username}`);
  }

  const testPassword = process.argv[2];
  if (testPassword && users[0]) {
    const ok = await bcrypt.compare(testPassword, users[0].passwordHash);
    console.log(`test password for ${users[0].username}:`, ok ? "OK" : "FAIL");
  }
} catch (error) {
  console.log("AUTH_USERS parse error:", error.message);
}
