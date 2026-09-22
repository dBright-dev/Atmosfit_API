// backend/api/server.js

require('dotenv').config();
const path = require('path');
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
    const rawValue = process.env.FIREBASE_SERVICE_ACCOUNT.trim();
    let jsonString;

    // Detect the format: if it starts with "{" it's raw JSON.
    // Otherwise, assume it's Base64-encoded.
    // Reference: Buffer.from() - https://nodejs.org/api/buffer.html#static-method-bufferfromstring-encoding
    if (rawValue.startsWith('{')) {
      jsonString = rawValue;
      console.log("🔍 Detected raw JSON credentials.");
    } else {
      jsonString = Buffer.from(rawValue, 'base64').toString('utf8');
      console.log("🔍 Detected Base64 credentials.");
    }

    // Parse the JSON string.
    // Reference: JSON.parse() - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse
    serviceAccount = JSON.parse(jsonString);

    // Firebase private keys sometimes come through with escaped newlines.
    // We replace the literal "\n" with real newlines.
    // Reference: Replace all - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replaceAll
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

    console.log("✅ Loaded Firebase credentials from Environment variable.");
  } catch (error) {
    console.error("❌ Failed to parse FIREBASE_SERVICE_ACCOUNT.");
    console.error("Error details:", error.message);
    console.error("First 50 chars of env var:", process.env.FIREBASE_SERVICE_ACCOUNT?.substring(0, 50));
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
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes')
const cartRoutes = require('./routes/cartRoutes');
const preferencesRoutes = require('./routes/preferencesRoutes');
const messageRoutes = require('./routes/messageRoutes');
const voteRoutes = require('./routes/voteRoutes');
const wardrobeRoutes = require('./routes/wardrobeRoutes');
const productRoutes = require('./routes/productRoutes');
const chatListRoutes = require('./routes/chatListRoutes');
const sharedCartRoutes = require('./routes/sharedCartRoutes');
const userRoutes = require('./routes/userRoutes');

// Basic API routes (products, user-specific prefs)
app.use('/api/v1', apiV1Routes);

// Auth routes (matches ApiService.kt @POST("api/auth/register"))
app.use('/api/auth', authRoutes);

app.use('/api/v1/admin', adminRoutes)

// Consolidated Chat-related routes (Messages, Cart, Voting)
app.use('/api/v1/chats', messageRoutes);
app.use('/api/v1/chats', cartRoutes);
app.use('/api/v1/chats', voteRoutes);

// Global Preferences routes
app.use('/api/v1/preferences', preferencesRoutes);

app.use('api/v1', wardrobeRoutes);

app.use('/api/v1/products', productRoutes);
app.use('/api/chats', chatListRoutes);
app.use('/api/v1/users', userRoutes);


app.use('/admin', express.static(path.join(__dirname, 'public', 'admin')));

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html'));
});

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
