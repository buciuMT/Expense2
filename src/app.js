const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { makeExecutableSchema } = require('@graphql-tools/schema');

const createApp = (typeDefs, resolvers, authMiddleware) => {
  const app = express();

  app.use(express.json());

  app.get('/', (req, res) => res.redirect('/graphql'));

  app.use(authMiddleware);

  const schema = makeExecutableSchema({ typeDefs, resolvers });

  app.use(
    '/graphql',
    graphqlHTTP((req) => ({
      schema,
      graphiql: true,
      context: {
        user: req.user,
        req,
      },
    }))
  );

  return app;
};

module.exports = createApp;
