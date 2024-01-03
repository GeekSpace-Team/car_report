import { Client } from "@elastic/elasticsearch";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

const node = process.env.ES_NODE;
const port = process.env.ES_PORT;
const username = process.env.ES_USERNAME;
const password = process.env.ES_PASSWORD;
const cert_path = process.env.ES_CERT_PATH;
// process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
console.log(node, port, username, password, cert_path);

const client = new Client({
  node: `${node}:${port}`,
  auth: {
    username: `${username}`,
    password: `${password}`,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

export default client;
