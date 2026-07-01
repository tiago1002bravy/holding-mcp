#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { loadConfig } from "./config.js";
import { HoldingClient } from "./http-client.js";
import { createServer } from "./server.js";

async function main(): Promise<void> {
  const client = new HoldingClient(loadConfig());
  const server = createServer(client);

  await server.connect(new StdioServerTransport());
  console.error("holding-manager MCP rodando via stdio");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
