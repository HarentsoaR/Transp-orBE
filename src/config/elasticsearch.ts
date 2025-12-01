import { Client } from "@elastic/elasticsearch";
import { env } from "./env";
import { logger } from "./logger";

let client: Client | null = null;

export const getElasticClient = (): Client | null => {
  if (client) return client;

  if (!env.ELASTICSEARCH_NODE) {
    logger.info("Elasticsearch node not configured. Search endpoints will be disabled.");
    return null;
  }

  client = new Client({
    node: env.ELASTICSEARCH_NODE,
    auth: env.ELASTICSEARCH_USERNAME
      ? { username: env.ELASTICSEARCH_USERNAME, password: env.ELASTICSEARCH_PASSWORD ?? "" }
      : undefined,
  });

  return client;
};
