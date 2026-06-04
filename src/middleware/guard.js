const requireAuth = () => (resolve, parent, args, context, info) => {
  if (!context.user) {
    throw new Error('Authentication required');
  }
  return resolve(parent, args, context, info);
};

const requireRole = (...roles) => (resolve, parent, args, context, info) => {
  if (!context.user) {
    throw new Error('Authentication required');
  }
  if (!roles.includes(context.user.role)) {
    throw new Error(`Forbidden: requires role ${roles.join(' or ')}`);
  }
  return resolve(parent, args, context, info);
};

module.exports = { requireAuth, requireRole };
