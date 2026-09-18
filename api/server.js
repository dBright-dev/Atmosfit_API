// backend/api/server.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

// --- FIREBASE CREDENTIALS SETUP ---
let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    // Decode Base64 string back to JSON (for production/Render)
    const decodedString = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString('utf8');
    serviceAccount = JSON.parse(decodedString);
    console.log("✅ Loaded Firebase credentials from Environment variable.");
  } catch (error) {
    console.error("❌ Failed to parse FIREBASE_SERVICE_ACCOUNT.");
    console.error(error.message);
    process.exit(1);
  }
} else {
  // Fallback for Local Development (reads the physical JSON file)
  try {
    serviceAccount = require('./config/serviceAccountKey.json');
    console.log("⚠️ Loaded Firebase credentials from local JSON file.");
  } catch (error) {
    console.error("❌ Local service account file not found and FIREBASE_SERVICE_ACCOUNT env var is missing.");
    process.exit(1);
  }
}

// --- INITIALIZE FIREBASE ADMIN (Namespaced API) ---
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount), 
  databaseURL: process.env.FIREBASE_DB_URL,
});

// Initialize database instances using the namespaced API
const dbFirestore = admin.firestore();
const dbRealtime = admin.database();

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

module.exports = app;

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
