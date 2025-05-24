import { initializeApp, FirebaseApp } from 'firebase/app';
import { getDatabase, Database } from 'firebase/database';

// Ensure environment variable typing
const firebaseApiKey: string | undefined = process.env.NEXT_PUBLIC_FIREBASE;

if (!firebaseApiKey) {
  throw new Error('Missing FIREBASE API key in environment variables');
}

const firebaseConfig = {
  apiKey: firebaseApiKey,
  authDomain: 'ghibli-mode.firebaseapp.com',
  databaseURL: 'https://ghibli-mode-default-rtdb.firebaseio.com',
  projectId: 'ghibli-mode',
  storageBucket: 'ghibli-mode.firebasestorage.app',
  messagingSenderId: '1047132661226',
  appId: '1:1047132661226:web:502dd94acd2fb1cae9be93',
};

const app: FirebaseApp = initializeApp(firebaseConfig);
export const db: Database = getDatabase(app);
