// scripts/set-admin.mjs
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync } from 'fs';

// --- Configuration ---
// 1. Path to your Firebase service account JSON file.
//    Download this from your Firebase Project Settings > Service accounts.
const serviceAccountPath = './service-account.json';

// 2. The email of the user you want to make an admin.
//    You can pass this as a command-line argument.
const userEmail = process.argv[2];
// ---------------------

if (!userEmail) {
  console.error('Error: Please provide the user\'s email as a command-line argument.');
  console.log('Usage: node scripts/set-admin.mjs <user_email_to_make_admin>');
  process.exit(1);
}

try {
  // Initialize the Firebase Admin SDK
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
  initializeApp({
    credential: cert(serviceAccount),
  });

  console.log(`Attempting to set admin claim for user: ${userEmail}`);

  // Get the user by email
  getAuth()
    .getUserByEmail(userEmail)
    .then((user) => {
      // Set the custom claim { admin: true }
      return getAuth().setCustomUserClaims(user.uid, { admin: true });
    })
    .then(() => {
      console.log(`✅ Success! Custom claim { admin: true } has been set for ${userEmail}.`);
      console.log('The user will have admin privileges on their next sign-in or token refresh.');
      process.exit(0);
    })
    .catch((error) => {
      if (error.code === 'auth/user-not-found') {
        console.error(`Error: User with email "${userEmail}" not found.`);
      } else {
        console.error('Error setting custom claims:', error);
      }
      process.exit(1);
    });
} catch (error) {
  if (error.code === 'ENOENT') {
    console.error(`\n❌ Error: Service account file not found at "${serviceAccountPath}".`);
    console.error('Please download your service account key from the Firebase Console:');
    console.error('Project Settings > Service accounts > Generate new private key');
    console.error('and place it in the project root as "service-account.json".\n');
  } else {
    console.error('An unexpected error occurred:', error.message);
  }
  process.exit(1);
}
