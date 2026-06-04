const { Op } = require('sequelize');
const { User, UserProfile, Category, Expense, Tag, Budget } = require('../models');
const { register, login } = require('./authResolvers');
const { requireAuth, requireRole } = require('../middleware/guard');

const resolvers = {
  Query: {
    me: requireAuth()(async (_, __, { user }) => {
      return User.findByPk(user.id);
    }),

    users: requireRole('admin')(async () => {
      return User.findAll();
    }),

    user: requireRole('admin')(async (_, { id }) => {
      return User.findByPk(id);
    }),

    categories: async (_, __, { user }) => {
      const where = user ? { [Op.or]: [{ userId: null }, { userId: user.id }] } : { userId: null };
      return Category.findAll({ where });
    },

    category: async (_, { id }) => {
      return Category.findByPk(id);
    },

    expenses: requireAuth()(async (_, { offset = 0, limit = 20, filters }, { user }) => {
      const where = {};
      if (user.role !== 'admin') {
        where.userId = user.id;
      }
      if (filters) {
        if (filters.categoryId) where.categoryId = filters.categoryId;
        if (filters.startDate || filters.endDate) {
          where.date = {};
          if (filters.startDate) where.date[Op.gte] = filters.startDate;
          if (filters.endDate) where.date[Op.lte] = filters.endDate;
        }
      }
      const { rows, count } = await Expense.findAndCountAll({
        where,
        offset: parseInt(offset),
        limit: parseInt(limit),
        order: [['date', 'DESC']],
      });
      return { items: rows, total: count, offset, limit };
    }),

    expense: requireAuth()(async (_, { id }, { user }) => {
      const where = { id };
      if (user.role !== 'admin') where.userId = user.id;
      return Expense.findOne({ where });
    }),

    budgets: requireAuth()(async (_, { filters }, { user }) => {
      const where = {};
      if (user.role !== 'admin') where.userId = user.id;
      if (filters) {
        if (filters.month) where.month = filters.month;
        if (filters.categoryId) where.categoryId = filters.categoryId;
      }
      return Budget.findAll({ where });
    }),

    budget: requireAuth()(async (_, { id }, { user }) => {
      const where = { id };
      if (user.role !== 'admin') where.userId = user.id;
      return Budget.findOne({ where });
    }),

    tags: async () => {
      return Tag.findAll();
    },

    reportByCategory: requireAuth()(async (_, { startDate, endDate }, { user }) => {
      const where = { date: { [Op.between]: [startDate, endDate] } };
      if (user.role !== 'admin') where.userId = user.id;
      const expenses = await Expense.findAll({ where, include: [Category] });
      const map = {};
      for (const exp of expenses) {
        const key = exp.categoryId;
        if (!map[key]) map[key] = { category: exp.category, total: 0, count: 0 };
        map[key].total += exp.amount;
        map[key].count += 1;
      }
      return Object.values(map);
    }),

    reportByMonth: requireAuth()(async (_, { startDate, endDate }, { user }) => {
      const where = { date: { [Op.between]: [startDate, endDate] } };
      if (user.role !== 'admin') where.userId = user.id;
      const expenses = await Expense.findAll({ where });
      const map = {};
      for (const exp of expenses) {
        const key = exp.date.substring(0, 7);
        if (!map[key]) map[key] = { month: key, total: 0, count: 0 };
        map[key].total += exp.amount;
        map[key].count += 1;
      }
      return Object.values(map).sort((a, b) => a.month.localeCompare(b.month));
    }),
  },

  Mutation: {
    register,
    login,

    updateProfile: requireAuth()(async (_, args, { user }) => {
      const profile = await UserProfile.findOne({ where: { userId: user.id } });
      if (!profile) throw new Error('Profile not found');
      await profile.update(args);
      return profile;
    }),

    createCategory: requireAuth()(async (_, { name, type }, { user }) => {
      return Category.create({ name, type, userId: user.id });
    }),

    updateCategory: requireRole('admin')(async (_, { id, name, type }) => {
      const category = await Category.findByPk(id);
      if (!category) throw new Error('Category not found');
      await category.update({ ...(name && { name }), ...(type && { type }) });
      return category;
    }),

    deleteCategory: requireRole('admin')(async (_, { id }) => {
      const count = await Category.destroy({ where: { id } });
      return { success: count > 0 };
    }),

    createExpense: requireAuth()(async (_, { amount, description, date, categoryId, tagIds }, { user }) => {
      if (user.role === 'viewer') throw new Error('Viewers cannot create expenses');
      const expense = await Expense.create({ amount, description, date, categoryId, userId: user.id });
      if (tagIds && tagIds.length) {
        const tags = await Tag.findAll({ where: { id: tagIds } });
        await expense.setTags(tags);
      }
      return expense;
    }),

    updateExpense: requireAuth()(async (_, { id, amount, description, date, categoryId, tagIds }, { user }) => {
      const where = { id };
      if (user.role !== 'admin') where.userId = user.id;
      const expense = await Expense.findOne({ where });
      if (!expense) throw new Error('Expense not found');
      if (user.role === 'viewer') throw new Error('Viewers cannot update expenses');
      await expense.update({ ...(amount && { amount }), ...(description && { description }), ...(date && { date }), ...(categoryId && { categoryId }) });
      if (tagIds) {
        const tags = await Tag.findAll({ where: { id: tagIds } });
        await expense.setTags(tags);
      }
      return expense;
    }),

    deleteExpense: requireAuth()(async (_, { id }, { user }) => {
      const where = { id };
      if (user.role !== 'admin') where.userId = user.id;
      const expense = await Expense.findOne({ where });
      if (!expense) throw new Error('Expense not found');
      if (user.role === 'viewer') throw new Error('Viewers cannot delete expenses');
      await expense.destroy();
      return { success: true };
    }),

    createBudget: requireAuth()(async (_, { amount, month, categoryId }, { user }) => {
      if (user.role === 'viewer') throw new Error('Viewers cannot create budgets');
      return Budget.create({ amount, month, categoryId, userId: user.id });
    }),

    updateBudget: requireAuth()(async (_, { id, amount, month }, { user }) => {
      const where = { id };
      if (user.role !== 'admin') where.userId = user.id;
      const budget = await Budget.findOne({ where });
      if (!budget) throw new Error('Budget not found');
      if (user.role === 'viewer') throw new Error('Viewers cannot update budgets');
      await budget.update({ ...(amount && { amount }), ...(month && { month }) });
      return budget;
    }),

    deleteBudget: requireAuth()(async (_, { id }, { user }) => {
      const where = { id };
      if (user.role !== 'admin') where.userId = user.id;
      const budget = await Budget.findOne({ where });
      if (!budget) throw new Error('Budget not found');
      if (user.role === 'viewer') throw new Error('Viewers cannot delete budgets');
      await budget.destroy();
      return { success: true };
    }),

    createTag: requireRole('admin')(async (_, { name }) => {
      const [tag] = await Tag.findOrCreate({ where: { name } });
      return tag;
    }),

    deleteTag: requireRole('admin')(async (_, { id }) => {
      const count = await Tag.destroy({ where: { id } });
      return { success: count > 0 };
    }),

    deleteUser: requireRole('admin')(async (_, { id }) => {
      const count = await User.destroy({ where: { id } });
      return { success: count > 0 };
    }),
  },

  User: {
    profile: (parent) => UserProfile.findOne({ where: { userId: parent.id } }),
    expenses: (parent) => Expense.findAll({ where: { userId: parent.id } }),
    categories: (parent) => Category.findAll({ where: { userId: parent.id } }),
    budgets: (parent) => Budget.findAll({ where: { userId: parent.id } }),
  },

  UserProfile: {
    user: (parent) => User.findByPk(parent.userId),
  },

  Category: {
    user: (parent) => parent.userId ? User.findByPk(parent.userId) : null,
  },

  Expense: {
    user: (parent) => User.findByPk(parent.userId),
    category: (parent) => Category.findByPk(parent.categoryId),
    tags: (parent) => parent.getTags(),
  },

  Tag: {
    expenses: (parent) => parent.getExpenses(),
  },

  Budget: {
    spent: async (parent) => {
      const startDate = parent.month + '-01';
      const endDate = parent.month + '-31';
      const expenses = await Expense.findAll({
        where: { userId: parent.userId, categoryId: parent.categoryId, date: { [Op.between]: [startDate, endDate] } },
      });
      return expenses.reduce((sum, e) => sum + e.amount, 0);
    },
    remaining: async (parent) => {
      const startDate = parent.month + '-01';
      const endDate = parent.month + '-31';
      const expenses = await Expense.findAll({
        where: { userId: parent.userId, categoryId: parent.categoryId, date: { [Op.between]: [startDate, endDate] } },
      });
      const spent = expenses.reduce((sum, e) => sum + e.amount, 0);
      return parent.amount - spent;
    },
    user: (parent) => User.findByPk(parent.userId),
    category: (parent) => Category.findByPk(parent.categoryId),
  },
};

module.exports = resolvers;
