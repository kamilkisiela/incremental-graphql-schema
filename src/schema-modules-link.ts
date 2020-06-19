import { toast } from "react-toastify";

import { ApolloLink, fromPromise } from "apollo-link";
import {
  OperationDefinitionNode,
  DefinitionNode,
  ExecutionArgs,
  DocumentNode,
  FieldNode,
  execute,
  Kind,
  ExecutionResult,
  GraphQLSchema,
  OperationTypeNode,
  concatAST,
} from "graphql";

type OperationType = "Query" | "Mutation" | "Subscription";

/**
 * Represents the exported keywords of a module
 */
type SchemaModule = {
  typeDefs: DocumentNode;
  resolvers?: {};
};
/**
 * A function that loads a module
 */
type SchemaModuleLoader = () => Promise<SchemaModule>;
/**
 * A map between fields of Queries, Mutations or Subscriptions and Schema Modules
 */
export type SchemaModuleMap = {
  modules: SchemaModuleLoader[];
  sharedModule: SchemaModuleLoader;
  Query: Record<string, number>;
  Mutation: Record<string, number>;
  Subscription: Record<string, number>;
};

export type SchemaModuleLinkOptions = {
  map: SchemaModuleMap;
  schemaBuilder(input: {
    typeDefs: DocumentNode;
    resolvers: any[];
  }): GraphQLSchema;
};

/**
 * Creates an ApolloLink that lazy-loads parts of schema, with resolvers and context.
 */
export function createSchemaModulesLink({
  map,
  schemaBuilder,
}: SchemaModuleLinkOptions) {
  const manager = SchemaModulesManager({ map, schemaBuilder });

  return new ApolloLink((op) =>
    fromPromise(
      manager.execute({
        document: op.query,
        variableValues: op.variables,
        operationName: op.operationName,
      })
    )
  );
}

/**
 * Manages Schema Module, orchestrates the lazy-loading, deals with schema building etc
 */
function SchemaModulesManager({ map, schemaBuilder }: SchemaModuleLinkOptions) {
  let usedModules: number[] = [];

  /**
   * Collects a list of required modules (based on root-level fields)
   * and a kind of an operation (Q, M or S)
   */
  function collectRequiredModules(doc: DocumentNode): number[] {
    const [rootFields, operationKind] = findRootFieldsAndKind(doc);

    return rootFields
      .map((field) => map[operationKind][field])
      .filter(onlyUnique);
  }

  /**
   * Stores the hash of previously built schema
   */
  let currentHash: string | null = null;
  let memoizedSchema: GraphQLSchema | null;

  /**
   * Loads all requested modules by their id + shared module
   */
  async function loadModules(ids: number[]) {
    const mods = await Promise.all(ids.map((mod) => map.modules[mod]()));
    const shared = await map.sharedModule();

    return mods.concat([shared]);
  }

  /**
   * Builds GraphQLSchema object based on a list of module ids
   * Does the memoization internally to avoid unnecessary computations
   */
  async function buildSchema(ids: number[]) {
    const hash = ids.slice().sort().join("-");

    if (hash === currentHash) {
      toast("Used memoized schema");
      return memoizedSchema!;
    }

    const modules = await loadModules(ids);

    // saves a list of used modules including those requested by operation
    usedModules = usedModules.concat(ids).filter(onlyUnique);

    toast("Built schema");

    const schema = schemaBuilder({
      typeDefs: concatAST(modules.map((m) => m.typeDefs)),
      resolvers: modules.map((m) => m.resolvers || {}),
    });

    currentHash = hash;
    memoizedSchema = schema;

    return schema;
  }

  return {
    async execute({
      document,
      variableValues,
      operationName,
    }: Pick<
      ExecutionArgs,
      "document" | "variableValues" | "operationName"
    >): Promise<ExecutionResult> {
      const modules = collectRequiredModules(document);
      const modulesToLoad = modules.filter((mod) => !usedModules.includes(mod));

      return execute({
        schema: await buildSchema(modulesToLoad.concat(usedModules)),
        document,
        variableValues,
        operationName,
      });
    },
  };
}

function findRootFieldsAndKind(doc: DocumentNode): [string[], OperationType] {
  const op = doc.definitions.find(isOperationNode)!;

  const rootFields = op.selectionSet.selections.map(
    (field) => (field as FieldNode).name.value
  );

  return [rootFields, capitalizeFirst(op.operation)];
}

function isOperationNode(def: DefinitionNode): def is OperationDefinitionNode {
  return def.kind === Kind.OPERATION_DEFINITION;
}

function capitalizeFirst(str: OperationTypeNode): OperationType {
  return (str.charAt(0).toUpperCase() + str.slice(1)) as OperationType;
}

function onlyUnique<T>(val: T, i: number, list: T[]) {
  return list.indexOf(val) === i;
}
