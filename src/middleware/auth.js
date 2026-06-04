const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'expense-tracker-secret-key-2025';

const signToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

const authMiddleware = (req, res, next) => {
  req.user = null;
  const header = req.headers.authorization || '';
  const token = header.replace('Bearer ', '');

  if (token) {
    try {
      const decoded = verifyToken(token);
      req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
    } catch (_) {}
  }

  next();
};

module.exports = authMiddleware;
module.exports.signToken = signToken;
module.exports.JWT_SECRET = JWT_SECRET;
