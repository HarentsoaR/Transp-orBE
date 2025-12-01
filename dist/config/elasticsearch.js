"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getElasticClient = void 0;
const elasticsearch_1 = require("@elastic/elasticsearch");
const env_1 = require("./env");
const logger_1 = require("./logger");
let client = null;
const getElasticClient = () => {
    if (client)
        return client;
    if (!env_1.env.ELASTICSEARCH_NODE) {
        logger_1.logger.info("Elasticsearch node not configured. Search endpoints will be disabled.");
        return null;
    }
    client = new elasticsearch_1.Client({
        node: env_1.env.ELASTICSEARCH_NODE,
        auth: env_1.env.ELASTICSEARCH_USERNAME
            ? { username: env_1.env.ELASTICSEARCH_USERNAME, password: env_1.env.ELASTICSEARCH_PASSWORD ?? "" }
            : undefined,
    });
    return client;
};
exports.getElasticClient = getElasticClient;
