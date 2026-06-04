const { executeQuery, loginAs } = require('./setup');

describe('Auth', () => {
  describe('register', () => {
    it('happy: registers a new user and returns token', async () => {
      const query = `
        mutation {
          register(name: "New User", email: "new@test.com", password: "pass123") {
            token
            user { id name email role }
          }
        }
      `;
      const res = await executeQuery(query);
      expect(res.data.register.token).toBeDefined();
      expect(res.data.register.user.email).toBe('new@test.com');
      expect(res.data.register.user.role).toBe('user');
    });

    it('sad: rejects duplicate email', async () => {
      const query = `
        mutation {
          register(name: "Dup", email: "user@test.com", password: "pass123") {
            token
            user { id }
          }
        }
      `;
      const res = await executeQuery(query);
      expect(res.errors).toBeDefined();
      expect(res.errors[0].message).toMatch(/Email already registered/i);
    });
  });

  describe('login', () => {
    it('happy: logs in with valid credentials', async () => {
      const query = `
        mutation {
          login(email: "admin@admin.com", password: "admin123") {
            token
            user { email role }
          }
        }
      `;
      const res = await executeQuery(query);
      expect(res.data.login.token).toBeDefined();
      expect(res.data.login.user.email).toBe('admin@admin.com');
      expect(res.data.login.user.role).toBe('admin');
    });

    it('sad: rejects wrong password', async () => {
      const query = `
        mutation {
          login(email: "admin@admin.com", password: "wrong") {
            token
            user { id }
          }
        }
      `;
      const res = await executeQuery(query);
      expect(res.errors).toBeDefined();
      expect(res.errors[0].message).toMatch(/Invalid credentials/i);
    });
  });

  describe('me', () => {
    it('happy: returns current user when authenticated', async () => {
      const token = await loginAs('user@test.com', 'user123');
      const query = `query { me { email role profile { currency } } }`;
      const res = await executeQuery(query, {}, token);
      expect(res.data.me.email).toBe('user@test.com');
      expect(res.data.me.profile.currency).toBe('USD');
    });

    it('sad: returns null when not authenticated', async () => {
      const query = `query { me { email } }`;
      const res = await executeQuery(query, {}, '');
      expect(res.errors).toBeDefined();
      expect(res.errors[0].message).toMatch(/Authentication required/i);
    });
  });
});
