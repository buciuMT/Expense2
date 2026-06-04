const bcrypt = require('bcryptjs');
const { User, UserProfile, Category, Expense, Tag, Budget } = require('./models');

const seed = async () => {
  const admin = await User.create({
    name: 'Admin',
    email: 'admin@admin.com',
    password: bcrypt.hashSync('admin123', 10),
    role: 'admin',
  });

  const user = await User.create({
    name: 'User',
    email: 'user@test.com',
    password: bcrypt.hashSync('user123', 10),
    role: 'user',
  });

  const viewer = await User.create({
    name: 'Viewer',
    email: 'viewer@test.com',
    password: bcrypt.hashSync('viewer123', 10),
    role: 'viewer',
  });

  await UserProfile.create({ bio: 'System administrator', currency: 'USD', userId: admin.id });
  await UserProfile.create({ bio: 'Regular user', currency: 'EUR', userId: user.id });
  await UserProfile.create({ bio: 'Read-only viewer', currency: 'RON', userId: viewer.id });

  const food = await Category.create({ name: 'Food', type: 'expense', userId: null });
  const transport = await Category.create({ name: 'Transport', type: 'expense', userId: null });
  const utilities = await Category.create({ name: 'Utilities', type: 'expense', userId: null });
  const entertainment = await Category.create({ name: 'Entertainment', type: 'expense', userId: null });
  const salary = await Category.create({ name: 'Salary', type: 'income', userId: null });

  const essential = await Tag.create({ name: 'essential' });
  const recurring = await Tag.create({ name: 'recurring' });
  const luxury = await Tag.create({ name: 'luxury' });

  const e1 = await Expense.create({ amount: 25.50, description: 'Lunch at cafeteria', date: '2025-06-01', userId: user.id, categoryId: food.id });
  const e2 = await Expense.create({ amount: 8.00, description: 'Bus pass', date: '2025-06-02', userId: user.id, categoryId: transport.id });
  const e3 = await Expense.create({ amount: 120.00, description: 'Electricity bill', date: '2025-06-03', userId: user.id, categoryId: utilities.id });
  const e4 = await Expense.create({ amount: 15.00, description: 'Netflix subscription', date: '2025-06-04', userId: user.id, categoryId: entertainment.id });
  const e5 = await Expense.create({ amount: 45.00, description: 'Groceries', date: '2025-06-05', userId: user.id, categoryId: food.id });
  const e6 = await Expense.create({ amount: 60.00, description: 'Dinner out', date: '2025-06-06', userId: user.id, categoryId: entertainment.id });

  const e7 = await Expense.create({ amount: 9.99, description: 'Coffee supplies', date: '2025-06-01', userId: admin.id, categoryId: food.id });
  const e8 = await Expense.create({ amount: 30.00, description: 'Gas', date: '2025-06-02', userId: admin.id, categoryId: transport.id });

  await e1.setTags([essential.id, recurring.id]);
  await e2.setTags([essential.id]);
  await e3.setTags([essential.id, recurring.id]);
  await e4.setTags([recurring.id, luxury.id]);
  await e5.setTags([essential.id]);
  await e6.setTags([luxury.id]);
  await e7.setTags([essential.id]);
  await e8.setTags([essential.id, recurring.id]);

  await Budget.create({ amount: 500.00, month: '2025-06', userId: user.id, categoryId: food.id });
  await Budget.create({ amount: 200.00, month: '2025-06', userId: user.id, categoryId: entertainment.id });
};

module.exports = seed;
