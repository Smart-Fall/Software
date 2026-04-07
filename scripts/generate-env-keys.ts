/*
 * Generates secure keys used by SmartFall backend/device ingestion.
 *
 * Usage:
 *   npm run generate:keys
 *   npm run generate:keys -- --write
 *
 * By default, keys are printed only.
 * With --write, JWT_SECRET and DEVICE_INGEST_API_KEY are upserted into .env.
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const args = new Set(process.argv.slice(2));
const writeEnv = args.has("--write");

const jwtSecret = crypto.randomBytes(48).toString("hex");
const deviceIngestApiKey = crypto.randomBytes(32).toString("hex");

const envAssignments: Record<string, string> = {
  JWT_SECRET: jwtSecret,
  DEVICE_INGEST_API_KEY: deviceIngestApiKey,
};

function upsertEnv(content: string, key: string, value: string): string {
  const escaped = value.replace(/\\/g, "\\\\").replace(/\"/g, '\\\"');
  const line = `${key}="${escaped}"`;
  const regex = new RegExp(`^${key}=.*$`, "m");

  if (regex.test(content)) {
    return content.replace(regex, line);
  }

  const suffix = content.endsWith("\n") ? "" : "\n";
  return `${content}${suffix}${line}\n`;
}

if (writeEnv) {
  const envPath = path.resolve(process.cwd(), ".env");
  let envContent = "";

  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, "utf8");
  }

  for (const [k, v] of Object.entries(envAssignments)) {
    envContent = upsertEnv(envContent, k, v);
  }

  fs.writeFileSync(envPath, envContent, "utf8");
  console.log(`Updated ${envPath} with generated keys.`);
}

console.log("\nGenerated keys:");
console.log(`JWT_SECRET=${jwtSecret}`);
console.log(`DEVICE_INGEST_API_KEY=${deviceIngestApiKey}`);
console.log("\nFirmware config line (Hardware/SmartFall/Config.h):");
console.log(`#define DEVICE_API_KEY         \"${deviceIngestApiKey}\"`);

if (!writeEnv) {
  console.log("\nTip: run with --write to auto-update Software/.env");
  console.log("Example: npm run generate:keys -- --write");
}
