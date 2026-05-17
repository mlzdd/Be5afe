/**
 * Grant the Firebase custom claim used by the admin portal.
 * Run with:
 *   npm run admin:grant -- operator@example.com
 */

import * as dotenv from 'dotenv';
dotenv.config();

import * as admin from 'firebase-admin';

const {
  FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY,
  ADMIN_EMAIL_ALLOWLIST,
} = process.env;

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  const allowlist = new Set(
    (ADMIN_EMAIL_ALLOWLIST ?? '')
      .split(',')
      .map((value: string) => value.trim().toLowerCase())
      .filter(Boolean),
  );

  if (!email) throw new Error('Provide an email address');
  if (!allowlist.has(email)) throw new Error('Email is not present in ADMIN_EMAIL_ALLOWLIST');
  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    throw new Error('Missing Firebase Admin credentials in .env');
  }

  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: FIREBASE_PROJECT_ID,
        clientEmail: FIREBASE_CLIENT_EMAIL,
        privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
  }

  const user = await admin.auth().getUserByEmail(email);
  await admin.auth().setCustomUserClaims(user.uid, { admin: true });
  console.log(`✅ Granted admin claim to ${email}`);
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error('Admin grant failed:', error);
    process.exit(1);
  });
