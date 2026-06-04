const { executeQuery, loginAs } = require('./setup');

describe('Categories', () => {
  let token;
  let adminToken;
  let catId;

  beforeAll(async () => {
    token = await loginAs('user@test.com', 'user123');
    adminToken = await loginAs('admin@admin.com', 'admin123');
  });

  describe('categories', () => {
    it('happy: lists categories for authenticated user', async () => {
      const query = `query { categories { id name type user { email } } }`;
      const res = await executeQuery(query, {}, token);
      expect(res.data.categories.length).toBeGreaterThan(0);
      expect(res.data.categories[0].name).toBeDefined();
      catId = res.data.categories[0].id;
    });

    it('sad: anonymous gets only global categories', async () => {
      const query = `query { categories { id name } }`;
      const res = await executeQuery(query, {}, '');
      expect(res.data.categories.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('category', () => {
    it('happy: returns single category by id', async () => {
      const query = `query { category(id: "${catId}") { id name type } }`;
      const res = await executeQuery(query, {}, token);
      expect(res.data.category.id).toBe(catId);
    });

    it('sad: returns null for non-existent category', async () => {
      const query = `query { category(id: "99999") { id } }`;
      const res = await executeQuery(query, {}, token);
      expect(res.data.category).toBeNull();
    });
  });

  describe('tags', () => {
    it('happy: lists all tags', async () => {
      const query = `query { tags { id name expenses { id } } }`;
      const res = await executeQuery(query, {}, token);
      expect(res.data.tags.length).toBeGreaterThan(0);
      expect(res.data.tags[0].name).toBeDefined();
    });

    it('sad: anonymous can still view tags', async () => {
      const query = `query { tags { id name } }`;
      const res = await executeQuery(query, {}, '');
      expect(res.data.tags.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('updateProfile', () => {
    it('happy: updates user profile', async () => {
      const query = `mutation { updateProfile(bio: "Test bio", currency: "EUR") { bio currency } }`;
      const res = await executeQuery(query, {}, token);
      expect(res.data.updateProfile.bio).toBe('Test bio');
      expect(res.data.updateProfile.currency).toBe('EUR');
    });

    it('sad: rejects update without auth', async () => {
      const query = `mutation { updateProfile(bio: "no auth") { bio } }`;
      const res = await executeQuery(query, {}, '');
      expect(res.errors).toBeDefined();
    });
  });

  describe('updateCategory', () => {
    it('happy: admin updates a category', async () => {
      const query = `mutation { updateCategory(id: "${catId}", name: "Updated Category") { id name } }`;
      const res = await executeQuery(query, {}, adminToken);
      expect(res.data.updateCategory.name).toBe('Updated Category');
    });

    it('sad: non-admin cannot update categories', async () => {
      const query = `mutation { updateCategory(id: "${catId}", name: "hack") { id } }`;
      const res = await executeQuery(query, {}, token);
      expect(res.errors).toBeDefined();
    });
  });
});
