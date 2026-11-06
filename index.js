// Root entrypoint for the Render web service.
//
// api/server.js builds the Express app and already starts the HTTP listener on
// process.env.PORT, so requiring it here is all the boot the service needs.
// The previous firebase-functions wrapper could never run on Render: it needed a
// dependency that is not installed and exported a handler instead of listening.

// Render starts the process from the repo root, so a bare dotenv.config() inside
// api/server.js looks for /app/.env and finds nothing. Point it at the API's env
// file explicitly. Existing environment variables are never overwritten, so
// values set on the Render service still take precedence.
if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  require('dotenv').config({ path: require('path').join(__dirname, 'api', '.env') });
}

module.exports = require('./api/server');
