const { executeQuery, loginAs } = require('./setup');

describe('Admin', () => {
  let adminToken;
  let userToken;

  beforeAll(async () => {
    adminToken = await loginAs('admin@admin.com', 'admin123');
    userToken = await loginAs('user@test.com', 'user123');
  });

  describe('users (admin only)', () => {
    it('happy: admin lists all users', async () => {
      const query = `query { users { id name email role profile { currency } } }`;
      const res = await executeQuery(query, {}, adminToken);
      expect(res.data.users.length).toBeGreaterThanOrEqual(3);
      expect(res.data.users[0].profile.currency).toBeDefined();
    });

    it('sad: non-admin cannot list users', async () => {
      const query = `query { users { id } }`;
      const res = await executeQuery(query, {}, userToken);
      expect(res.errors).toBeDefined();
      expect(res.errors[0].message).toMatch(/Forbidden/i);
    });
  });

  describe('user (admin only)', () => {
    it('happy: admin views any user', async () => {
      const listQ = `query { users { id email } }`;
      const listRes = await executeQuery(listQ, {}, adminToken);
      const targetId = listRes.data.users.find(u => u.email === 'user@test.com').id;

      const query = `query { user(id: "${targetId}") { id name email role } }`;
      const res = await executeQuery(query, {}, adminToken);
      expect(res.data.user.email).toBe('user@test.com');
    });

    it('sad: non-admin cannot view any user', async () => {
      const query = `query { user(id: "1") { id } }`;
      const res = await executeQuery(query, {}, userToken);
      expect(res.errors).toBeDefined();
    });
  });

  describe('deleteUser (admin only)', () => {
    it('happy: admin deletes a user', async () => {
      const listQ = `query { users { id email } }`;
      const listRes = await executeQuery(listQ, {}, adminToken);
      const target = listRes.data.users.find(u => u.email === 'viewer@test.com');
      if (!target) return;

      const query = `mutation { deleteUser(id: "${target.id}") { success } }`;
      const res = await executeQuery(query, {}, adminToken);
      expect(res.data.deleteUser.success).toBe(true);
    });

    it('sad: non-admin cannot delete users', async () => {
      const query = `mutation { deleteUser(id: "1") { success } }`;
      const res = await executeQuery(query, {}, userToken);
      expect(res.errors).toBeDefined();
    });
  });

  describe('categories (admin CRUD)', () => {
    it('happy: admin creates and deletes a global category', async () => {
      const createQ = `mutation { createCategory(name: "Investment", type: "income") { id name type } }`;
      const createRes = await executeQuery(createQ, {}, adminToken);
      expect(createRes.data.createCategory.name).toBe('Investment');

      const delQ = `mutation { deleteCategory(id: "${createRes.data.createCategory.id}") { success } }`;
      const delRes = await executeQuery(delQ, {}, adminToken);
      expect(delRes.data.deleteCategory.success).toBe(true);
    });

    it('sad: non-admin cannot delete categories', async () => {
      const catQ = `query { categories { id } }`;
      const catRes = await executeQuery(catQ, {}, userToken);
      if (catRes.data.categories.length === 0) return;
      const query = `mutation { deleteCategory(id: "${catRes.data.categories[0].id}") { success } }`;
      const res = await executeQuery(query, {}, userToken);
      expect(res.errors).toBeDefined();
    });
  });

  describe('tags (admin only)', () => {
    it('happy: admin creates and deletes a tag', async () => {
      const createQ = `mutation { createTag(name: "urgent") { id name } }`;
      const createRes = await executeQuery(createQ, {}, adminToken);
      expect(createRes.data.createTag.name).toBe('urgent');

      const delQ = `mutation { deleteTag(id: "${createRes.data.createTag.id}") { success } }`;
      const delRes = await executeQuery(delQ, {}, adminToken);
      expect(delRes.data.deleteTag.success).toBe(true);
    });

    it('sad: non-admin cannot create tags', async () => {
      const query = `mutation { createTag(name: "test") { id } }`;
      const res = await executeQuery(query, {}, userToken);
      expect(res.errors).toBeDefined();
    });
  });

  describe('viewer restrictions', () => {
    it('sad: viewer cannot create expenses', async () => {
      const viewerToken = await loginAs('viewer@test.com', 'viewer123');
      const catQ = `query { categories { id } }`;
      const catRes = await executeQuery(catQ, {}, viewerToken);
      const catId = catRes.data.categories[0]?.id;
      if (!catId) return;

      const query = `mutation { createExpense(amount: 10, description: "test", date: "2025-06-10", categoryId: "${catId}") { id } }`;
      const res = await executeQuery(query, {}, viewerToken);
      expect(res.errors).toBeDefined();
      expect(res.errors[0].message).toMatch(/Viewers cannot create expenses/i);
    });
  });
});
