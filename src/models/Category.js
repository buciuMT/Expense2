const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Category = sequelize.define('Category', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.ENUM('expense', 'income'), allowNull: false },
  userId: { type: DataTypes.INTEGER, allowNull: true },
}, { tableName: 'categories', timestamps: true });

module.exports = Category;
