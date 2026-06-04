const typeDefs = `
  type User {
    id: ID
    name: String
    email: String
    role: String
    profile: UserProfile
    expenses: [Expense]
    categories: [Category]
    budgets: [Budget]
  }

  type UserProfile {
    id: ID
    bio: String
    avatar: String
    currency: String
    user: User
  }

  type Category {
    id: ID
    name: String
    type: String
    user: User
  }

  type Expense {
    id: ID
    amount: Float
    description: String
    date: String
    user: User
    category: Category
    tags: [Tag]
  }

  type Tag {
    id: ID
    name: String
    expenses: [Expense]
  }

  type Budget {
    id: ID
    amount: Float
    month: String
    spent: Float
    remaining: Float
    user: User
    category: Category
  }

  type AuthPayload {
    token: String
    user: User
  }

  type PaginatedExpenses {
    items: [Expense]
    total: Int
    offset: Int
    limit: Int
  }

  type CategoryReport {
    category: Category
    total: Float
    count: Int
  }

  type MonthReport {
    month: String
    total: Float
    count: Int
  }

  type DeleteResult {
    success: Boolean
  }

  input ExpenseFilters {
    categoryId: ID
    startDate: String
    endDate: String
  }

  input BudgetFilters {
    month: String
    categoryId: ID
  }

  type Query {
    me: User
    users: [User]
    user(id: ID!): User
    categories: [Category]
    category(id: ID!): Category
    expenses(offset: Int, limit: Int, filters: ExpenseFilters): PaginatedExpenses
    expense(id: ID!): Expense
    budgets(filters: BudgetFilters): [Budget]
    budget(id: ID!): Budget
    tags: [Tag]
    reportByCategory(startDate: String!, endDate: String!): [CategoryReport]
    reportByMonth(startDate: String!, endDate: String!): [MonthReport]
  }

  type Mutation {
    register(name: String!, email: String!, password: String!): AuthPayload
    login(email: String!, password: String!): AuthPayload
    updateProfile(bio: String, avatar: String, currency: String): UserProfile
    createCategory(name: String!, type: String!): Category
    updateCategory(id: ID!, name: String, type: String): Category
    deleteCategory(id: ID!): DeleteResult
    createExpense(amount: Float!, description: String, date: String!, categoryId: ID!, tagIds: [ID]): Expense
    updateExpense(id: ID!, amount: Float, description: String, date: String, categoryId: ID, tagIds: [ID]): Expense
    deleteExpense(id: ID!): DeleteResult
    createBudget(amount: Float!, month: String!, categoryId: ID!): Budget
    updateBudget(id: ID!, amount: Float, month: String): Budget
    deleteBudget(id: ID!): DeleteResult
    createTag(name: String!): Tag
    deleteTag(id: ID!): DeleteResult
    deleteUser(id: ID!): DeleteResult
  }
`;

module.exports = typeDefs;
