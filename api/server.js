require('dotenv').config();

const express = require('express');

const cors = require('cors');

const admin = require('firebase-admin');


admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: process.env.FIREBASE_DB_URL,
});

const app = express();
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;

    console.log(
        `[${new Date().toISOString()}]` +
      `${req.method} ${req.originalUrl} - Status: ${res.statusCode} - ${duration}ms`,
    );
  });
  next();
});

const apiV1Routes = require('./routes/apiRoutes');
app.use('/api/v1', apiV1Routes);

app.get('/', (req, res) => {
  res.send('AtmosFit API is running!');
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({error: 'Something went wrong on the server!'});
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
/*
Reference List
https://expressjs.com/en/starter/installing/
https://expressjs.com/en/resources/middleware/cors/
https://firebase.google.com/docs/admin/setup
https://expressjs.com/en/guide/routing/
https://expressjs.com/en/guide/error-handling/
*/
