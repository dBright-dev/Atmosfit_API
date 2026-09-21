// api/middleware/adminMiddleware.js
//
// Middleware that requires the authenticated user to have role === "admin".
// Must be used AFTER verifyToken (which populates req.user).

const { getAuth } = require('firebase-admin/auth');

/**
 * Checks that req.user has { role: "admin" } in their Firebase custom claims.
 */
async function requireAdmin(req, res, next) {
  try {
    if (!req.user || !req.user.uid) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    // Re-fetch user to check current claims (claims can change without a new token).
    const user = await getAuth().getUser(req.user.uid);
    const claims = user.customClaims || {};

    if (claims.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required.' });
    }

    req.adminUser = user;
    next();
  } catch (e) {
    console.error('adminMiddleware error:', e);
    res.status(500).json({ error: 'Failed to verify admin status.' });
  }
}

module.exports = { requireAdmin };