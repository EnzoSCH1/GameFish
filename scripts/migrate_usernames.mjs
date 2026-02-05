// scripts/migrate_usernames.mjs
import fs from "fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const serviceAccountPath =
  process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  process.env.SERVICE_ACCOUNT_PATH ||
  "";

if (!serviceAccountPath || !fs.existsSync(serviceAccountPath)) {
  console.error("Service account JSON introuvable.");
  console.error("Definis GOOGLE_APPLICATION_CREDENTIALS ou SERVICE_ACCOUNT_PATH.");
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

function normalizeUsername(name) {
  return name.trim().toLowerCase();
}

async function commitBatch(batch, count) {
  if (count > 0) {
    await batch.commit();
  }
}

async function migrateUsernames() {
  const usersSnap = await db.collection("users").get();
  const leaderboardSnap = await db.collection("leaderboard").get();
  const leaderboardNameByUser = new Map();

  leaderboardSnap.forEach((docSnap) => {
    const data = docSnap.data() || {};
    const userId = data.userId;
    const username = (data.username || "").trim();
    if (!userId || !username) return;
    const ts = Number(data.timestamp || 0);

    const existing = leaderboardNameByUser.get(userId);
    if (!existing || ts > existing.timestamp) {
      leaderboardNameByUser.set(userId, { username, timestamp: ts });
    }
  });

  const nameMap = new Map();
  const userUpdates = [];
  const missingUsers = [];

  usersSnap.forEach((docSnap) => {
    const data = docSnap.data() || {};
    let rawName = (data.username || "").trim();

    if (!rawName) {
      const lb = leaderboardNameByUser.get(docSnap.id);
      if (lb && lb.username) rawName = lb.username.trim();
    }

    if (!rawName) {
      missingUsers.push({ userId: docSnap.id });
      return;
    }

    const key = normalizeUsername(rawName);
    const list = nameMap.get(key) || [];
    list.push({ userId: docSnap.id, username: rawName });
    nameMap.set(key, list);

    if (data.username !== rawName || data.usernameLower !== key) {
      userUpdates.push({ userId: docSnap.id, username: rawName, usernameLower: key });
    }
  });

  const conflicts = [];
  const unique = [];

  for (const [key, list] of nameMap.entries()) {
    if (list.length === 1) {
      unique.push({ key, ...list[0] });
    } else {
      conflicts.push({ key, users: list });
    }
  }

  // Update users.usernameLower
  let batch = db.batch();
  let count = 0;
  for (const u of userUpdates) {
    batch.set(
      db.doc(`users/${u.userId}`),
      { username: u.username, usernameLower: u.usernameLower },
      { merge: true }
    );
    count++;
    if (count >= 400) {
      await commitBatch(batch, count);
      batch = db.batch();
      count = 0;
    }
  }
  await commitBatch(batch, count);

  // Mark duplicates with usernameError
  batch = db.batch();
  count = 0;
  for (const conflict of conflicts) {
    for (const u of conflict.users) {
      batch.set(
        db.doc(`users/${u.userId}`),
        { usernameError: "duplicate" },
        { merge: true }
      );
      count++;
      if (count >= 400) {
        await commitBatch(batch, count);
        batch = db.batch();
        count = 0;
      }
    }
  }
  await commitBatch(batch, count);

  // Create usernames registry (unique only)
  batch = db.batch();
  count = 0;
  const now = Date.now();
  for (const entry of unique) {
    batch.set(
      db.doc(`usernames/${entry.key}`),
      {
        userId: entry.userId,
        username: entry.username,
        usernameLower: entry.key,
        updatedAt: now,
        source: "migration"
      },
      { merge: true }
    );

    count++;
    if (count >= 400) {
      await commitBatch(batch, count);
      batch = db.batch();
      count = 0;
    }
  }
  await commitBatch(batch, count);

  // Write conflicts report
  if (conflicts.length > 0) {
    fs.writeFileSync(
      "scripts/username_conflicts.json",
      JSON.stringify(conflicts, null, 2),
      "utf8"
    );
    console.log(`Conflits detectes: ${conflicts.length}`);
    console.log("Voir scripts/username_conflicts.json");
  } else {
    console.log("Aucun conflit detecte.");
  }

  if (missingUsers.length > 0) {
    fs.writeFileSync(
      "scripts/username_missing.json",
      JSON.stringify(missingUsers, null, 2),
      "utf8"
    );
    console.log(`Users sans username: ${missingUsers.length}`);
    console.log("Voir scripts/username_missing.json");
  }

  console.log(`Users analyses: ${usersSnap.size}`);
  console.log(`Usernames uniques crees: ${unique.length}`);
}

migrateUsernames()
  .then(() => {
    console.log("Migration terminee.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Erreur migration:", err);
    process.exit(1);
  });
