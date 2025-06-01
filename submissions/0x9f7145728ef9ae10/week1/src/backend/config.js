import 'dotenv/config';
import admin from "firebase-admin";

// Decode the Base64 Firebase credentials
const credentials = JSON.parse(
  Buffer.from(process.env.FIREBASE, "base64").toString("utf8")
);

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(credentials),
  databaseURL: "https://ghibli-mode-default-rtdb.firebaseio.com/",
});

const db = admin.database();

export default db;
