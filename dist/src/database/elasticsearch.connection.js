"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const elasticsearch_1 = require("@elastic/elasticsearch");
const client = new elasticsearch_1.Client({
    node: "http://localhost:9200",
    auth: {
        username: "elastic",
        password: "QwertyWeb123",
    },
    tls: {
        rejectUnauthorized: false,
    },
});
exports.default = client;
