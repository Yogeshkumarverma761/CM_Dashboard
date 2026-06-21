import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'delhi-cm-dashboard-secret-key';

/**
 * Middleware to verify JWT token and attach user to req.user
 * For public routes, token is optional (req.user will be null).
 */
export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

/**
 * Optional auth middleware — attaches user if token present but does not block.
 */
export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      req.user = jwt.verify(token, JWT_SECRET);
    } catch (_) {
      req.user = null;
    }
  } else {
    req.user = null;
  }
  next();
}
