const { getAuth } = require('firebase-admin/auth');

async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({error: 'Missing or malformed authorization header.'});
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await getAuth().verifyIdToken(idToken, true);

    req.user = decodedToken;

    next();
  } catch (error) {
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({error: 'Session expired. Please sign in again'});
    }
    if (error.code === 'auth/id-token-revoked') {
      return res.status(401).json({error: 'Session revoked. Please sign in again'});
    }
    return res.status(401).json({error: 'Invalid authentication token.'});
  }
}

function requireClaim(claimName, claimValue) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({error: 'Authincation required.'});
    }

    if (req.user[claimName] !== claimValue) {
      return res.status(403).json({error: `Requires ${claimName}: ${claimValue}`});
    }

    next();
  };
}

module.exports = {
  verifyToken,
  requireClaim,
};

/*
Reference List:
https://firebase.google.com/docs/auth/admin/verify-id-tokens
https://firebase.google.com/docs/auth/admin/custom-claims
https://expressjs.com/en/guide/using-middleware/
*/
