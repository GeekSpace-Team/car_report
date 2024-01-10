"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const elasticsearch_1 = require("@elastic/elasticsearch");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const node = process.env.ES_NODE;
const port = process.env.ES_PORT;
const username = process.env.ES_USERNAME;
const password = process.env.ES_PASSWORD;
const cert_path = process.env.ES_CERT_PATH;
// process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
console.log(node, port, username, password, cert_path);
const client = new elasticsearch_1.Client({
    node: `${node}:${port}`,
    auth: {
        username: `${username}`,
        password: `${password}`,
    },
    tls: {
        rejectUnauthorized: false,
    },
});
exports.default = client;
