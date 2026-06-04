const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Budget = sequelize.define('Budget', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  amount: { type: DataTypes.FLOAT, allowNull: false },
  month: { type: DataTypes.STRING, allowNull: false },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  categoryId: { type: DataTypes.INTEGER, allowNull: false },
}, { tableName: 'budgets', timestamps: true });

module.exports = Budget;
