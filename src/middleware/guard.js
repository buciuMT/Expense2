const requireAuth = () => (next) => {
  return async (parent, args, context, info) => {
    if (!context || !context.user) {
      throw new Error('Authentication required');
    }
    return next(parent, args, context, info);
  };
};

const requireRole = (...roles) => (next) => {
  return async (parent, args, context, info) => {
    if (!context || !context.user) {
      throw new Error('Authentication required');
    }
    if (!roles.includes(context.user.role)) {
      throw new Error(`Forbidden: requires role ${roles.join(' or ')}`);
    }
    return next(parent, args, context, info);
  };
};

module.exports = { requireAuth, requireRole };
