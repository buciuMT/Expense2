const bcrypt = require('bcryptjs');
const { User, UserProfile } = require('../models');
const { signToken } = require('../middleware/auth');

const register = async (_, { name, email, password }) => {
  const existing = await User.findOne({ where: { email } });
  if (existing) {
    throw new Error('Email already registered');
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hashed });

  await UserProfile.create({ userId: user.id });

  const token = signToken(user);
  return { token, user };
};

const login = async (_, { email, password }) => {
  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new Error('Invalid credentials');
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw new Error('Invalid credentials');
  }

  const token = signToken(user);
  return { token, user };
};

module.exports = { register, login };
