import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { HoldingClient } from "../http-client.js";

export function registerFamilyTools(server: McpServer, client: HoldingClient): void {
  server.registerTool(
    "family_list",
    {
      title: "Listar famílias",
      description: "Lista todas as famílias do tenant.",
      inputSchema: {},
    },
    async () => {
      try {
        const data = await client.get(`/families`);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: (err as Error).message }], isError: true };
      }
    },
  );

  server.registerTool(
    "family_create",
    {
      title: "Criar família",
      description: "Cria uma nova família no tenant.",
      inputSchema: {
        name: z.string().min(2),
      },
    },
    async ({ name }) => {
      try {
        const data = await client.post(`/families`, { name });
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: (err as Error).message }], isError: true };
      }
    },
  );

  server.registerTool(
    "family_get",
    {
      title: "Obter família",
      description: "Obtém os detalhes de uma família pelo ID.",
      inputSchema: {
        id: z.string().uuid(),
      },
    },
    async ({ id }) => {
      try {
        const data = await client.get(`/families/${id}`);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: (err as Error).message }], isError: true };
      }
    },
  );

  server.registerTool(
    "family_update",
    {
      title: "Atualizar família",
      description: "Atualiza os dados de uma família pelo ID.",
      inputSchema: {
        id: z.string().uuid(),
        name: z.string().min(2).optional(),
      },
    },
    async ({ id, name }) => {
      try {
        const data = await client.patch(`/families/${id}`, { name });
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: (err as Error).message }], isError: true };
      }
    },
  );

  server.registerTool(
    "family_delete",
    {
      title: "Excluir família",
      description: "Exclui uma família pelo ID.",
      inputSchema: {
        id: z.string().uuid(),
      },
    },
    async ({ id }) => {
      try {
        const data = await client.del(`/families/${id}`);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: (err as Error).message }], isError: true };
      }
    },
  );

  server.registerTool(
    "family_get_document_rules",
    {
      title: "Obter regras de documentos da família",
      description: "Obtém as regras de documentos configuradas para uma família pelo ID.",
      inputSchema: {
        id: z.string().uuid(),
      },
    },
    async ({ id }) => {
      try {
        const data = await client.get(`/families/${id}/document-rules`);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: (err as Error).message }], isError: true };
      }
    },
  );

  server.registerTool(
    "family_update_document_rules",
    {
      title: "Atualizar regras de documentos da família",
      description:
        "Atualiza as regras de documentos de uma família para um tipo (member ou property). " +
        "O campo `rules` mapeia cada tipo de documento (ex.: rg_cnh, matricula) para o seu estado " +
        "(required, optional ou hidden).",
      inputSchema: {
        id: z.string().uuid(),
        type: z.enum(["member", "property"]),
        rules: z.record(z.enum(["required", "optional", "hidden"])),
      },
    },
    async ({ id, type, rules }) => {
      try {
        const data = await client.patch(`/families/${id}/document-rules`, { type, rules });
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: (err as Error).message }], isError: true };
      }
    },
  );
}
