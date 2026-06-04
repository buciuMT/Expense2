const { executeQuery, loginAs } = require('./setup');

describe('Budgets', () => {
  let token;
  let catId;
  let budgetId;

  beforeAll(async () => {
    token = await loginAs('user@test.com', 'user123');
    const query = `query { categories { id name } }`;
    const res = await executeQuery(query, {}, token);
    catId = res.data.categories[0].id;
  });

  describe('createBudget', () => {
    it('happy: creates a budget for a category', async () => {
      const query = `
        mutation {
          createBudget(amount: 300, month: "2025-07", categoryId: "${catId}") {
            id amount month category { id name }
          }
        }
      `;
      const res = await executeQuery(query, {}, token);
      expect(parseFloat(res.data.createBudget.amount)).toBe(300);
      expect(res.data.createBudget.month).toBe('2025-07');
      expect(res.data.createBudget.category.name).toBeDefined();
      budgetId = res.data.createBudget.id;
    });

    it('sad: rejects budget creation by viewer', async () => {
      const viewerToken = await loginAs('viewer@test.com', 'viewer123');
      const query = `
        mutation {
          createBudget(amount: 100, month: "2025-07", categoryId: "${catId}") { id }
        }
      `;
      const res = await executeQuery(query, {}, viewerToken);
      expect(res.errors).toBeDefined();
      expect(res.errors[0].message).toMatch(/Viewers cannot create budgets/i);
    });
  });

  describe('budget', () => {
    it('happy: returns budget with computed spent and remaining', async () => {
      const query = `query { budget(id: "${budgetId}") { id amount month spent remaining } }`;
      const res = await executeQuery(query, {}, token);
      expect(res.data.budget.id).toBe(budgetId);
      expect(parseFloat(res.data.budget.amount)).toBe(300);
      expect(typeof res.data.budget.spent).toBe('number');
      expect(typeof res.data.budget.remaining).toBe('number');
    });

    it('sad: returns null for non-existent budget', async () => {
      const query = `query { budget(id: "99999") { id } }`;
      const res = await executeQuery(query, {}, token);
      expect(res.data.budget).toBeNull();
    });
  });

  describe('budgets', () => {
    it('happy: lists budgets for authenticated user', async () => {
      const query = `query { budgets { id amount month category { name } spent remaining } }`;
      const res = await executeQuery(query, {}, token);
      expect(res.data.budgets.length).toBeGreaterThan(0);
      expect(res.data.budgets[0].category.name).toBeDefined();
    });

    it('sad: rejects query without auth', async () => {
      const query = `query { budgets { id } }`;
      const res = await executeQuery(query, {}, '');
      expect(res.errors).toBeDefined();
    });
  });

  describe('updateBudget', () => {
    it('happy: updates budget amount', async () => {
      const query = `mutation { updateBudget(id: "${budgetId}", amount: 350) { id amount } }`;
      const res = await executeQuery(query, {}, token);
      expect(parseFloat(res.data.updateBudget.amount)).toBe(350);
    });

    it('sad: rejects viewer updating budget', async () => {
      const viewerToken = await loginAs('viewer@test.com', 'viewer123');
      const query = `mutation { updateBudget(id: "${budgetId}", amount: 999) { id } }`;
      const res = await executeQuery(query, {}, viewerToken);
      expect(res.errors).toBeDefined();
    });
  });

  describe('deleteBudget', () => {
    it('happy: deletes own budget', async () => {
      const createQ = `
        mutation {
          createBudget(amount: 50, month: "2025-08", categoryId: "${catId}") { id }
        }
      `;
      const createRes = await executeQuery(createQ, {}, token);
      const toDel = createRes.data.createBudget.id;

      const delQ = `mutation { deleteBudget(id: "${toDel}") { success } }`;
      const delRes = await executeQuery(delQ, {}, token);
      expect(delRes.data.deleteBudget.success).toBe(true);
    });

    it('sad: rejects delete without auth', async () => {
      const query = `mutation { deleteBudget(id: "${budgetId}") { success } }`;
      const res = await executeQuery(query, {}, '');
      expect(res.errors).toBeDefined();
    });
  });
});
