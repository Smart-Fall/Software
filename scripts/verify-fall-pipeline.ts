/*
 * Verifies the fall ingestion pipeline from device API -> falls listing API.
 *
 * Required environment variables:
 *   BASE_URL                 default: http://localhost:3000
 *   DEVICE_INGEST_API_KEY    required
 *
 * Optional:
 *   DEVICE_ID                default: TEST-DEVICE-<timestamp>
 *   SESSION_COOKIE           if provided, also checks /api/falls/recent
 */

interface FallRecord {
  id: string;
}

interface FallsListResponse {
  falls?: FallRecord[];
}

const baseUrl = process.env.BASE_URL || "http://localhost:3000";
const apiKey = process.env.DEVICE_INGEST_API_KEY;
const deviceId = process.env.DEVICE_ID || `TEST-DEVICE-${Date.now()}`;
const sessionCookie = process.env.SESSION_COOKIE;

if (!apiKey) {
  console.error("Missing DEVICE_INGEST_API_KEY");
  process.exit(1);
}

const verifiedApiKey: string = apiKey;

function buildHeaders(
  extra: Record<string, string> = {},
): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "X-Device-Api-Key": verifiedApiKey,
    ...extra,
  };
}

async function main(): Promise<void> {
  const now = new Date().toISOString();
  const payload = {
    device_id: deviceId,
    confidence_score: 92,
    confidence_level: "CONFIRMED",
    sos_triggered: false,
    battery_level: 76.5,
    sensor_data: {
      accel_x: 0.12,
      accel_y: -0.08,
      accel_z: 2.78,
      gyro_x: 195.2,
      gyro_y: 22.1,
      gyro_z: 14.7,
      pressure: 1012.34,
    },
    test_event_time: now,
  };

  console.log(`[1/3] POST ${baseUrl}/api/falls`);
  const postRes = await fetch(`${baseUrl}/api/falls`, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify(payload),
  });

  if (!postRes.ok) {
    const body = await postRes.text();
    console.error(`POST failed with ${postRes.status}: ${body}`);
    process.exit(1);
  }

  const postBody = (await postRes.json()) as { fall_id?: string };
  if (!postBody.fall_id) {
    console.error("POST succeeded but response did not include fall_id.");
    process.exit(1);
  }

  console.log(`POST success: fall_id=${postBody.fall_id}`);

  console.log(`[2/3] GET ${baseUrl}/api/falls?limit=10`);
  const listRes = await fetch(`${baseUrl}/api/falls?limit=10`);
  if (!listRes.ok) {
    const body = await listRes.text();
    console.error(`GET /api/falls failed with ${listRes.status}: ${body}`);
    process.exit(1);
  }

  const listBody = (await listRes.json()) as FallsListResponse;
  const falls = Array.isArray(listBody.falls) ? listBody.falls : [];
  const inserted = falls.find((f) => f.id === postBody.fall_id);

  if (!inserted) {
    console.error("New fall was not found in /api/falls listing.");
    process.exit(1);
  }

  console.log("Falls listing check passed.");

  console.log("[3/3] Optional caregiver poll endpoint check");
  if (!sessionCookie) {
    console.log(
      "Skipped /api/falls/recent check (set SESSION_COOKIE to enable).",
    );
    console.log("Pipeline API verification completed.");
    return;
  }

  const sinceIso = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const recentRes = await fetch(
    `${baseUrl}/api/falls/recent?since=${encodeURIComponent(sinceIso)}`,
    {
      headers: {
        Cookie: sessionCookie,
      },
    },
  );

  if (!recentRes.ok) {
    const body = await recentRes.text();
    console.error(
      `GET /api/falls/recent failed with ${recentRes.status}: ${body}`,
    );
    process.exit(1);
  }

  const recentBody = (await recentRes.json()) as FallsListResponse;
  const recentFalls = Array.isArray(recentBody.falls) ? recentBody.falls : [];
  console.log(`/api/falls/recent returned ${recentFalls.length} fall(s).`);
  console.log("Pipeline API verification completed.");
}

main().catch((err: unknown) => {
  console.error("Verification script crashed:", err);
  process.exit(1);
});
