import { ApolloClient } from "apollo-client";
import { InMemoryCache } from "apollo-cache-inmemory";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { createSchemaModulesLink } from "./schema-modules-link";

export const client = new ApolloClient({
  cache: new InMemoryCache(),
  link: createSchemaModulesLink({
    // this map is going to be auto-generated
    map:
      // no need to write it manually
      {
        modules: [
          () => import("./schema/calendar"),
          () => import("./schema/chats"),
        ],
        sharedModule: () => import("./schema/shared"),
        Query: {
          events: 0,
          chats: 1,
        },
        Mutation: {
          addEvent: 0,
        },
        Subscription: {},
      },
    schemaBuilder: makeExecutableSchema,
  }),
});
