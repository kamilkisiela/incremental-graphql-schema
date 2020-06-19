import { execute, toPromise, ApolloLink, GraphQLRequest } from "apollo-link";
import gql from "graphql-tag";
import { makeExecutableSchema } from "@graphql-tools/schema";
import {
  createSchemaModulesLink,
  SchemaModuleMap,
} from "./schema-modules-link";

const schemaModuleMap: SchemaModuleMap = {
  modules: [() => import("./schema/calendar"), () => import("./schema/chats")],
  sharedModule: () => import("./schema/shared"),
  Query: {
    events: 0,
    chats: 1,
  },
  Mutation: {
    addEvent: 0,
  },
  Subscription: {},
};

function executeLink(link: ApolloLink, operation: GraphQLRequest) {
  return toPromise(execute(link, operation));
}

beforeEach(() => {
  jest.restoreAllMocks();
});

test("load shared module + a used module", async () => {
  const sharedSpy = jest.spyOn(schemaModuleMap, "sharedModule");
  const chatsSpy = jest.fn(schemaModuleMap.modules[1]);
  const calendarSpy = jest.fn(schemaModuleMap.modules[0]);
  const link = createSchemaModulesLink({
    map: {
      ...schemaModuleMap,
      modules: [calendarSpy, chatsSpy],
    },
    schemaBuilder: makeExecutableSchema,
  });
  const result = await executeLink(link, {
    query: gql`
      {
        chats {
          id
        }
      }
    `,
  });

  expect(result.data!.chats).toBeDefined();

  expect(sharedSpy).toBeCalledTimes(1);
  expect(chatsSpy).toBeCalledTimes(1);
  expect(calendarSpy).not.toBeCalled();
});

test("load shared module + multiple requested modules", async () => {
  const sharedSpy = jest.spyOn(schemaModuleMap, "sharedModule");
  const chatsSpy = jest.fn(schemaModuleMap.modules[1]);
  const calendarSpy = jest.fn(schemaModuleMap.modules[0]);
  const link = createSchemaModulesLink({
    map: {
      ...schemaModuleMap,
      modules: [calendarSpy, chatsSpy],
    },
    schemaBuilder: makeExecutableSchema,
  });
  const result = await executeLink(link, {
    query: gql`
      {
        chats {
          id
        }
        events {
          id
        }
      }
    `,
  });

  expect(result.data!.chats).toBeDefined();
  expect(result.data!.events).toBeDefined();

  expect(sharedSpy).toBeCalledTimes(1);
  expect(chatsSpy).toBeCalledTimes(1);
  expect(calendarSpy).toBeCalledTimes(1);
});

test("memoize the result of schema building over time", async () => {
  const buildSpy = jest.fn(makeExecutableSchema);
  const link = createSchemaModulesLink({
    map: schemaModuleMap,
    schemaBuilder: buildSpy,
  });
  
  await executeLink(link, {
    query: gql`
      {
        chats {
          id
        }
      }
    `,
  });

  await executeLink(link, {
    query: gql`
      {
        chats {
          id
        }
      }
    `,
  });

  expect(buildSpy).toBeCalledTimes(1);

  await executeLink(link, {
    query: gql`
      {
        events {
          id
        }
      }
    `,
  });

  expect(buildSpy).toBeCalledTimes(2);

  await executeLink(link, {
    query: gql`
      {
        chats {
          id
        }
      }
    `,
  });

  await executeLink(link, {
    query: gql`
      {
        events {
          id
        }
      }
    `,
  });

  await executeLink(link, {
    query: gql`
      {
        chats {
          id
          title
        }
      }
    `,
  });
  
  expect(buildSpy).toBeCalledTimes(2);
});
