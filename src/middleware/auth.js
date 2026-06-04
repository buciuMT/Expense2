const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'expense-tracker-secret-key-2025';

const authMiddleware = (req, res, next) => {
  req.user = null;
  const header = req.headers.authorization || '';
  const token = header.replace('Bearer ', '');

  if (token) {
    try {
      req.user = jwt.verify(token, JWT_SECRET);
    } catch (_) {}
  }

  next();
};

module.exports = authMiddleware;
module.exports.JWT_SECRET = JWT_SECRET;
