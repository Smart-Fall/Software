/**
 * Admin Seed Script
 * Creates an admin user account in the database.
 *
 * Usage:
 *   npx ts-node --compiler-options '{"module":"commonjs"}' scripts/seed-admin.ts
 *   -- or --
 *   npm run seed:admin
 *
 * Environment variables:
 *   ADMIN_EMAIL     - Admin email (default: admin@smartfall.com)
 *   ADMIN_PASSWORD  - Admin password (required for create/reset)
 *   ADMIN_FIRST     - Admin first name (default: System)
 *   ADMIN_LAST      - Admin last name (default: Admin)
 */

import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env file manually (Next.js auto-loads it, but standalone scripts don't)
try {
  const envPath = resolve(__dirname, "..", ".env");
  const envContent = readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    // Strip surrounding quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    // Strip inline comments (e.g. "value # comment")
    const commentIdx = value.indexOf(" #");
    if (commentIdx !== -1) value = value.slice(0, commentIdx).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
  console.log("✅ Loaded .env file");
} catch {
  console.log("⚠️  No .env file found, using existing environment variables");
}

import bcrypt from "bcryptjs";

async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL || "admin@smartfall.com")
    .trim()
    .toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    console.error("❌ ADMIN_PASSWORD environment variable is required");
    process.exit(1);
  }
  const firstName = process.env.ADMIN_FIRST || "System";
  const lastName = process.env.ADMIN_LAST || "Admin";

  console.log(`\n🔧 SmartFall Admin Seed Script`);
  console.log(`================================`);
  console.log(`Email: ${email}`);
  console.log(`Name: ${firstName} ${lastName}\n`);

  // Dynamically import to allow env vars to be read
  const { getDbServiceAsync } = await import("../lib/db/service");
  const dbService = await getDbServiceAsync();

  // Check if user already exists for this email
  const existing = await dbService.users.findByEmail(email);
  if (existing) {
    console.log(
      `ℹ️  User with email ${email} already exists. Updating admin credentials...`,
    );

    const passwordHash = await bcrypt.hash(password, 12);
    const updated = await dbService.users.update(existing.id, {
      accountType: "admin",
      passwordHash,
      firstName,
      lastName,
    });

    console.log("✅ Admin credentials updated successfully!");
    console.log(`   ID: ${updated.id}`);
    console.log(`   Email: ${updated.email}`);
    console.log(`   Account Type: ${updated.accountType}`);
    process.exit(0);
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);

  // Create admin user (no associated Patient or Caregiver record)
  const admin = await dbService.users.create({
    email,
    passwordHash,
    accountType: "admin",
    firstName,
    lastName,
  });

  console.log(`✅ Admin user created successfully!`);
  console.log(`   ID: ${admin.id}`);
  console.log(`   Email: ${admin.email}`);
  console.log(`   Account Type: ${admin.accountType}\n`);
  console.log(
    `⚠️  Remember to change the default password after first login!\n`,
  );

  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error("❌ Failed to seed admin:", err);
  process.exit(1);
});
