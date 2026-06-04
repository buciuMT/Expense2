const { executeQuery, loginAs } = require('./setup');

describe('Expenses', () => {
  let token;
  let catId;
  let tagId;
  let expId;

  beforeAll(async () => {
    token = await loginAs('user@test.com', 'user123');
    const catQuery = `query { categories { id name type } }`;
    const catRes = await executeQuery(catQuery, {}, token);
    catId = catRes.data.categories[0].id;

    const tagQuery = `query { tags { id name } }`;
    const tagRes = await executeQuery(tagQuery, {}, token);
    tagId = tagRes.data.tags[0].id;
  });

  describe('createExpense', () => {
    it('happy: creates an expense with tags', async () => {
      const query = `
        mutation {
          createExpense(amount: 42.00, description: "Test dinner", date: "2025-06-10", categoryId: "${catId}", tagIds: ["${tagId}"]) {
            id amount description date category { id name } tags { id name }
          }
        }
      `;
      const res = await executeQuery(query, {}, token);
      expect(res.data.createExpense.amount).toBe(42);
      expect(res.data.createExpense.description).toBe('Test dinner');
      expect(res.data.createExpense.category.name).toBeDefined();
      expect(res.data.createExpense.tags.length).toBe(1);
      expId = res.data.createExpense.id;
    });

    it('sad: rejects expense without auth', async () => {
      const query = `
        mutation {
          createExpense(amount: 10, description: "No auth", date: "2025-06-10", categoryId: "${catId}") { id }
        }
      `;
      const res = await executeQuery(query, {}, '');
      expect(res.errors).toBeDefined();
      expect(res.errors[0].message).toMatch(/Authentication required/i);
    });
  });

  describe('expenses', () => {
    it('happy: returns paginated expenses with nested data', async () => {
      const query = `
        query {
          expenses(offset: 0, limit: 5) {
            items { id amount description date category { name } user { email } tags { name } }
            total offset limit
          }
        }
      `;
      const res = await executeQuery(query, {}, token);
      expect(res.data.expenses.items.length).toBeGreaterThan(0);
      expect(res.data.expenses.total).toBeGreaterThan(0);
      expect(res.data.expenses.items[0].category.name).toBeDefined();
      expect(res.data.expenses.items[0].user.email).toBe('user@test.com');
    });

    it('sad: rejects query without auth', async () => {
      const query = `query { expenses(offset: 0, limit: 5) { items { id } } }`;
      const res = await executeQuery(query, {}, '');
      expect(res.errors).toBeDefined();
      expect(res.errors[0].message).toMatch(/Authentication required/i);
    });
  });

  describe('expense', () => {
    it('happy: returns single expense by id', async () => {
      const query = `query { expense(id: "${expId}") { id amount description } }`;
      const res = await executeQuery(query, {}, token);
      expect(res.data.expense.id).toBe(expId);
      expect(parseFloat(res.data.expense.amount)).toBe(42);
    });

    it('sad: returns null for non-existent expense', async () => {
      const query = `query { expense(id: "99999") { id } }`;
      const res = await executeQuery(query, {}, token);
      expect(res.data.expense).toBeNull();
    });
  });

  describe('updateExpense', () => {
    it('happy: updates an expense', async () => {
      const query = `
        mutation {
          updateExpense(id: "${expId}", amount: 50.00, description: "Updated dinner") {
            id amount description
          }
        }
      `;
      const res = await executeQuery(query, {}, token);
      expect(parseFloat(res.data.updateExpense.amount)).toBe(50);
      expect(res.data.updateExpense.description).toBe('Updated dinner');
    });

    it('sad: rejects update of another users expense as non-admin', async () => {
      const userToken = await loginAs('viewer@test.com', 'viewer123');
      const query = `mutation { updateExpense(id: "${expId}", amount: 99) { id } }`;
      const res = await executeQuery(query, {}, userToken);
      expect(res.errors).toBeDefined();
    });
  });

  describe('deleteExpense', () => {
    it('happy: deletes own expense', async () => {
      const createQuery = `
        mutation {
          createExpense(amount: 5, description: "To delete", date: "2025-06-15", categoryId: "${catId}") { id }
        }
      `;
      const createRes = await executeQuery(createQuery, {}, token);
      const toDelete = createRes.data.createExpense.id;

      const delQuery = `mutation { deleteExpense(id: "${toDelete}") { success } }`;
      const delRes = await executeQuery(delQuery, {}, token);
      expect(delRes.data.deleteExpense.success).toBe(true);
    });

    it('sad: rejects delete without auth', async () => {
      const query = `mutation { deleteExpense(id: "${expId}") { success } }`;
      const res = await executeQuery(query, {}, '');
      expect(res.errors).toBeDefined();
    });
  });
});
