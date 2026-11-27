import { createSign } from "node:crypto";

const DB_URL = (
  process.env.FIREBASE_DB_URL || "https://fav-932a6-default-rtdb.firebaseio.com"
).replace(/\/+$/, "");
const TTL_MS = 24 * 60 * 60 * 1000;

function base64Url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

async function getAccessToken(serviceAccountJson) {
  const sa = JSON.parse(serviceAccountJson);
  const now = Math.floor(Date.now() / 1000);
  const tokenUri = sa.token_uri || "https://oauth2.googleapis.com/token";

  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64Url(
    JSON.stringify({
      iss: sa.client_email,
      scope:
        "https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/userinfo.email",
      aud: tokenUri,
      iat: now,
      exp: now + 3600,
    }),
  );

  const signingInput = `${header}.${payload}`;
  const signer = createSign("RSA-SHA256");
  signer.update(signingInput);
  const signature = signer
    .sign(sa.private_key, "base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  const res = await fetch(tokenUri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${signingInput}.${signature}`,
    }),
  });

  if (!res.ok) {
    throw new Error(`OAuth token request failed (${res.status}): ${await res.text()}`);
  }
  const data = await res.json();
  return data.access_token;
}

async function main() {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT?.trim();
  if (!serviceAccount) {
    console.log("FIREBASE_SERVICE_ACCOUNT secret is not set. Skipping room cleanup.");
    return;
  }

  const token = await getAccessToken(serviceAccount);
  const authQuery = `access_token=${encodeURIComponent(token)}`;

  const listRes = await fetch(`${DB_URL}/rooms.json?shallow=true&${authQuery}`);
  if (!listRes.ok) {
    throw new Error(`Failed to list rooms (${listRes.status}): ${await listRes.text()}`);
  }

  const shallow = await listRes.json();
  if (!shallow || typeof shallow !== "object") {
    console.log("No rooms found.");
    return;
  }

  const roomIds = Object.keys(shallow);
  const now = Date.now();
  let deleted = 0;

  for (const roomId of roomIds) {
    const [createdRes, updatedRes] = await Promise.all([
      fetch(`${DB_URL}/rooms/${encodeURIComponent(roomId)}/createdAt.json?${authQuery}`),
      fetch(`${DB_URL}/rooms/${encodeURIComponent(roomId)}/updatedAt.json?${authQuery}`),
    ]);
    const createdAt = createdRes.ok ? Number(await createdRes.json()) : NaN;
    const updatedAt = updatedRes.ok ? Number(await updatedRes.json()) : NaN;
    const baseTime =
      Number.isFinite(createdAt) && createdAt > 0
        ? createdAt
        : Number.isFinite(updatedAt) && updatedAt > 0
          ? updatedAt
          : NaN;
    if (!Number.isFinite(baseTime) || now - baseTime >= TTL_MS) {
      const delRes = await fetch(`${DB_URL}/rooms/${encodeURIComponent(roomId)}.json?${authQuery}`, {
        method: "DELETE",
      });
      if (delRes.ok) {
        deleted += 1;
        console.log(`Deleted expired room: ${roomId}`);
      }
    }
  }

  const remaining = Math.max(0, roomIds.length - deleted);
  await fetch(`${DB_URL}/total.json?print=silent&${authQuery}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(remaining),
  });

  console.log(
    `Cleanup complete. Checked ${roomIds.length} room(s), deleted ${deleted} expired room(s), remaining ${remaining}.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
