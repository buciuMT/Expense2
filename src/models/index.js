const User = require('./User');
const UserProfile = require('./UserProfile');
const Category = require('./Category');
const Expense = require('./Expense');
const Tag = require('./Tag');
const Budget = require('./Budget');

User.hasOne(UserProfile, { foreignKey: 'userId' });
UserProfile.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Expense, { foreignKey: 'userId' });
Expense.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Category, { foreignKey: 'userId' });
Category.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Budget, { foreignKey: 'userId' });
Budget.belongsTo(User, { foreignKey: 'userId' });

Category.hasMany(Expense, { foreignKey: 'categoryId' });
Expense.belongsTo(Category, { foreignKey: 'categoryId' });

Category.hasMany(Budget, { foreignKey: 'categoryId' });
Budget.belongsTo(Category, { foreignKey: 'categoryId' });

Expense.belongsToMany(Tag, { through: 'expense_tags', foreignKey: 'expenseId', otherKey: 'tagId' });
Tag.belongsToMany(Expense, { through: 'expense_tags', foreignKey: 'tagId', otherKey: 'expenseId' });

module.exports = { User, UserProfile, Category, Expense, Tag, Budget };
