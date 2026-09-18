// backend/api/server.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');

// --- MODULAR FIREBASE IMPORTS ---
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getDatabase } = require('firebase-admin/database');
const { getAuth } = require('firebase-admin/auth');

// --- FIREBASE CREDENTIALS SETUP ---
let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const decodedString = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString('utf8');
    serviceAccount = JSON.parse(decodedString);
    console.log("✅ Loaded Firebase credentials from Environment variable.");
  } catch (error) {
    console.error("❌ Failed to parse FIREBASE_SERVICE_ACCOUNT.");
    console.error(error.message);
    process.exit(1);
  }
} else {
  try {
    serviceAccount = require('./config/serviceAccountKey.json');
    console.log("⚠️ Loaded Firebase credentials from local JSON file.");
  } catch (error) {
    console.error("❌ Local service account file not found and FIREBASE_SERVICE_ACCOUNT env var is missing.");
    process.exit(1);
  }
}

// --- INITIALIZE FIREBASE APP (modular) ---
let firebaseApp;
if (getApps().length === 0) {
  firebaseApp = initializeApp({
    credential: cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DB_URL,
  });
  console.log("🔥 Firebase Admin initialized.");
} else {
  firebaseApp = getApps()[0];
}

// --- INITIALIZE SERVICES ---
const dbFirestore = getFirestore(firebaseApp);
const dbRealtime = getDatabase(firebaseApp);
const auth = getAuth(firebaseApp);

// --- EXPRESS APP SETUP ---
const app = express();
app.use(cors());
app.use(express.json());

// Custom Logging Middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - Status: ${res.statusCode} - ${duration}ms`
    );
  });
  next();
});

// --- ROUTES ---
const apiV1Routes = require('./routes/apiRoutes');
app.use('/api/v1', apiV1Routes);

app.get('/', (req, res) => {
  res.send('AtmosFit API is running!');
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong on the server!' });
});

// --- START SERVER ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

module.exports = { app, auth, dbFirestore, dbRealtime };

/*
Reference List
process.env - https://nodejs.org/api/process.html#processenv
JSON.parse() - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse
https://expressjs.com/en/starter/installing/
https://expressjs.com/en/resources/middleware/cors/
https://firebase.google.com/docs/admin/setup
https://expressjs.com/en/guide/routing/
https://expressjs.com/en/guide/error-handling/
*/
