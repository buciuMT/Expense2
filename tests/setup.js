process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgres://postgres:postgres@localhost:5433/expense_test';

const sequelize = require('../src/db');
const { User, UserProfile, Category, Expense, Tag, Budget } = require('../src/models');
const typeDefs = require('../src/schema/typeDefs');
const resolvers = require('../src/schema/resolvers');
const authMiddleware = require('../src/middleware/auth');
const createApp = require('../src/app');
const request = require('supertest');
const bcrypt = require('bcryptjs');

let app;

const createTestData = async () => {
  const adminPass = await bcrypt.hash('admin123', 10);
  const userPass = await bcrypt.hash('user123', 10);
  const viewerPass = await bcrypt.hash('viewer123', 10);

  const admin = await User.create({ name: 'Admin', email: 'admin@admin.com', password: adminPass, role: 'admin' });
  const normal = await User.create({ name: 'Normal', email: 'user@test.com', password: userPass, role: 'user' });
  const viewer = await User.create({ name: 'Viewer', email: 'viewer@test.com', password: viewerPass, role: 'viewer' });

  await UserProfile.create({ userId: admin.id });
  await UserProfile.create({ userId: normal.id });
  await UserProfile.create({ userId: viewer.id });

  const food = await Category.create({ name: 'Food', type: 'expense', userId: normal.id });
  const transport = await Category.create({ name: 'Transport', type: 'expense', userId: normal.id });
  const salary = await Category.create({ name: 'Salary', type: 'income' });
  const utilities = await Category.create({ name: 'Utilities', type: 'expense', userId: normal.id });

  const tag1 = await Tag.create({ name: 'essential' });
  const tag2 = await Tag.create({ name: 'leisure' });

  const exp1 = await Expense.create({ amount: 25.50, description: 'Lunch', date: '2025-06-01', userId: normal.id, categoryId: food.id });
  const exp2 = await Expense.create({ amount: 15.00, description: 'Bus pass', date: '2025-06-02', userId: normal.id, categoryId: transport.id });
  await exp1.setTags([tag1]);
  await exp2.setTags([tag2]);

  await Budget.create({ amount: 500, month: '2025-06', userId: normal.id, categoryId: food.id });
  await Budget.create({ amount: 100, month: '2025-06', userId: normal.id, categoryId: transport.id });

  return { admin, normal, viewer, food, transport, salary, utilities, tag1, tag2 };
};

const executeQuery = async (query, variables = {}, token = '') => {
  const response = await request(app)
    .post('/graphql')
    .set('Authorization', `Bearer ${token}`)
    .send({ query, variables });
  return response.body;
};

const loginAs = async (email, password) => {
  const query = `mutation { login(email: "${email}", password: "${password}") { token } }`;
  const res = await executeQuery(query);
  return res.data.login.token;
};

beforeAll(async () => {
  await sequelize.sync({ force: true });
  await createTestData();
  app = createApp(typeDefs, resolvers, authMiddleware);
});

afterAll(async () => {
  await sequelize.close();
});

module.exports = { executeQuery, loginAs, createTestData };
