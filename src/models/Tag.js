const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Tag = sequelize.define('Tag', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false, unique: true },
}, { tableName: 'tags', timestamps: true });

module.exports = Tag;
