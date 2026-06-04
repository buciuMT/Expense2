const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const UserProfile = sequelize.define('UserProfile', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  bio: { type: DataTypes.TEXT, allowNull: true },
  avatar: { type: DataTypes.STRING, allowNull: true },
  currency: { type: DataTypes.STRING, defaultValue: 'USD' },
  userId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
}, { tableName: 'user_profiles', timestamps: true });

module.exports = UserProfile;
