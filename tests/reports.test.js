const { executeQuery, loginAs } = require('./setup');

describe('Reports', () => {
  let token;

  beforeAll(async () => {
    token = await loginAs('user@test.com', 'user123');
  });

  describe('reportByCategory', () => {
    it('happy: returns spending grouped by category', async () => {
      const query = `
        query {
          reportByCategory(startDate: "2025-06-01", endDate: "2025-06-30") {
            category { id name type }
            total
            count
          }
        }
      `;
      const res = await executeQuery(query, {}, token);
      expect(res.data.reportByCategory.length).toBeGreaterThan(0);
      expect(res.data.reportByCategory[0].category.name).toBeDefined();
      expect(typeof res.data.reportByCategory[0].total).toBe('number');
    });

    it('sad: rejects report without auth', async () => {
      const query = `
        query {
          reportByCategory(startDate: "2025-06-01", endDate: "2025-06-30") { total }
        }
      `;
      const res = await executeQuery(query, {}, '');
      expect(res.errors).toBeDefined();
    });
  });

  describe('reportByMonth', () => {
    it('happy: returns spending grouped by month', async () => {
      const query = `
        query {
          reportByMonth(startDate: "2025-01-01", endDate: "2025-12-31") {
            month
            total
            count
          }
        }
      `;
      const res = await executeQuery(query, {}, token);
      expect(res.data.reportByMonth.length).toBeGreaterThan(0);
      expect(res.data.reportByMonth[0].month).toMatch(/^\d{4}-\d{2}$/);
      expect(typeof res.data.reportByMonth[0].total).toBe('number');
    });

    it('sad: rejects report without auth', async () => {
      const query = `
        query {
          reportByMonth(startDate: "2025-01-01", endDate: "2025-12-31") { month }
        }
      `;
      const res = await executeQuery(query, {}, '');
      expect(res.errors).toBeDefined();
    });
  });
});
