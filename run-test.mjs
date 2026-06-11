import { readFileSync } from "fs";
const token = readFileSync(".test-token", "utf-8").trim();
process.env.AGENT_TEST_TOKEN = token;
process.env.AGENT_TEST_URL = "http://192.168.1.135:48080";
await import("./agent-test.mjs");
