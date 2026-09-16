const functions = require('firebase-functions');

const app = require('./api/server');

exports.api = functions.https.onRequest(app);
