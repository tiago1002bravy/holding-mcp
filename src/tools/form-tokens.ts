import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { HoldingClient } from "../http-client.js";

export function registerFormTokenTools(server: McpServer, client: HoldingClient): void {
  server.registerTool(
    "form_token_create",
    {
      title: "Criar token de formulário",
      description:
        "Cria (ou reusa o token ativo existente) de um formulário público para uma família, " +
        "conforme o tipo (member ou property).",
      inputSchema: {
        familyId: z.string().uuid(),
        type: z.enum(["member", "property"]),
      },
    },
    async ({ familyId, type }) => {
      try {
        const data = await client.post(`/families/${familyId}/tokens`, { type });
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: (err as Error).message }], isError: true };
      }
    },
  );

  server.registerTool(
    "form_token_list",
    {
      title: "Listar tokens de formulário",
      description: "Lista os tokens de formulário público de uma família pelo ID.",
      inputSchema: {
        familyId: z.string().uuid(),
      },
    },
    async ({ familyId }) => {
      try {
        const data = await client.get(`/families/${familyId}/tokens`);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: (err as Error).message }], isError: true };
      }
    },
  );

  server.registerTool(
    "form_token_revoke",
    {
      title: "Revogar token de formulário",
      description: "Revoga um token de formulário público de uma família pelo ID do token.",
      inputSchema: {
        familyId: z.string().uuid(),
        tokenId: z.string().uuid(),
      },
    },
    async ({ familyId, tokenId }) => {
      try {
        const data = await client.del(`/families/${familyId}/tokens/${tokenId}`);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: (err as Error).message }], isError: true };
      }
    },
  );
}
