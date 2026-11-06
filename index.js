// Root entrypoint for the Render web service.
//
// api/server.js builds the Express app and already starts the HTTP listener on
// process.env.PORT, so requiring it here is all the boot the service needs.
// The previous firebase-functions wrapper could never run on Render: it needed a
// dependency that is not installed and exported a handler instead of listening.
module.exports = require('./api/server');
