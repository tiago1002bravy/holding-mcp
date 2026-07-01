import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import type { HoldingClient } from "./http-client.js";

import { registerFamilyTools } from "./tools/families.js";
import { registerMemberTools } from "./tools/members.js";
import { registerPropertyTools } from "./tools/properties.js";
import { registerCompanyTools } from "./tools/companies.js";
import { registerStrategyTools } from "./tools/strategy.js";
import { registerClauseTools } from "./tools/clauses.js";
import { registerMinuteTemplateTools } from "./tools/minute-templates.js";
import { registerFormTokenTools } from "./tools/form-tokens.js";

/**
 * Cria uma instância do servidor MCP com todas as tools registradas, ligada
 * ao `client` fornecido. Reutilizado tanto pelo transporte stdio (index.ts)
 * quanto pelo HTTP remoto (http.ts) — no HTTP, um client/servidor novo é
 * criado por request, cada um com a API key do cliente.
 */
export function createServer(client: HoldingClient): McpServer {
  const server = new McpServer({ name: "holding-manager", version: "0.1.0" });

  registerFamilyTools(server, client);
  registerMemberTools(server, client);
  registerPropertyTools(server, client);
  registerCompanyTools(server, client);
  registerStrategyTools(server, client);
  registerClauseTools(server, client);
  registerMinuteTemplateTools(server, client);
  registerFormTokenTools(server, client);

  return server;
}
