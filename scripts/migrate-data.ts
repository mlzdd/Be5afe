/**
 * Migration script — seeds global safety data into Firestore.
 * Run with: npx ts-node --project scripts/tsconfig.json scripts/migrate-data.ts
 *
 * Requires in .env:
 *   FIREBASE_PROJECT_ID
 *   FIREBASE_CLIENT_EMAIL
 *   FIREBASE_PRIVATE_KEY
 */

import * as dotenv from 'dotenv';
dotenv.config();

import * as admin from 'firebase-admin';
import { countrySafetyRatings } from '../src/products/bsafe/safety-data/countrySafetyRatings';
import { countryScams } from '../src/products/bsafe/safety-data/countryScams';

const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;

if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
  console.error('Missing Firebase Admin credentials in .env');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: FIREBASE_PROJECT_ID,
    clientEmail: FIREBASE_CLIENT_EMAIL,
    privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
});

const db = admin.firestore();

async function migrateCountries() {
  console.log('Migrating country safety ratings...');
  const batch = db.batch();
  let count = 0;

  for (const [name, data] of Object.entries(countrySafetyRatings)) {
    const id = name.toLowerCase().replace(/\s+/g, '-');
    const scams = countryScams[name] ?? [];

    batch.set(db.collection('countries').doc(id), {
      id,
      name,
      overallSafety: data.overallSafety,
      categories: data.categories,
      description: data.description,
      commonRisks: data.commonRisks,
      safestAreas: data.safestAreas,
      areasToAvoid: data.areasToAvoid,
      bestTimeToVisit: data.bestTimeToVisit,
      // Denormalized top scams for cheap list-view reads
      topScams: scams.slice(0, 3),
      scamCount: scams.length,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    count++;

    // Firestore batch limit is 500 — flush and start new batch if needed
    if (count % 400 === 0) {
      await batch.commit();
      console.log(`  Flushed ${count} country docs`);
    }
  }

  await batch.commit();
  console.log(`✅ Migrated ${count} countries`);
}

async function migrateScams() {
  console.log('Migrating scams...');
  let total = 0;

  for (const [country, scams] of Object.entries(countryScams)) {
    const countryId = country.toLowerCase().replace(/\s+/g, '-');
    const batch = db.batch();

    for (let i = 0; i < scams.length; i++) {
      const scam = scams[i];
      const id = `${countryId}-${i}`;
      batch.set(db.collection('scams').doc(id), {
        id,
        countryId,
        countryName: country,
        ...scam,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      total++;
    }

    await batch.commit();
  }

  console.log(`✅ Migrated ${total} scams`);
}

async function main() {
  console.log(`\nMigrating to Firebase project: ${FIREBASE_PROJECT_ID}\n`);
  try {
    await migrateCountries();
    await migrateScams();
    console.log('\n✅ Migration complete.');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
  process.exit(0);
}

main();
