import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { HoldingClient } from "../http-client.js";

export function registerMinuteTemplateTools(server: McpServer, client: HoldingClient): void {
  server.registerTool(
    "minute_template_list",
    {
      title: "Listar templates de minuta",
      description: "Lista todos os templates de minuta do tenant.",
      inputSchema: {},
    },
    async () => {
      try {
        const data = await client.get(`/minutes-templates`);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: (err as Error).message }], isError: true };
      }
    },
  );

  server.registerTool(
    "minute_template_create",
    {
      title: "Criar template de minuta",
      description:
        "Cria um novo template de minuta a partir de um Google Doc. A API busca o HTML do " +
        "documento e detecta as variáveis automaticamente; a fase é derivada do template_type.",
      inputSchema: {
        template_type: z.enum(["abertura", "alteracao"]),
        template_subtype: z.string().min(1),
        google_doc_url: z.string().url(),
        name: z.string().optional(),
        google_doc_cu_url: z.string().url().optional(),
        notes: z.string().optional(),
      },
    },
    async ({ template_type, template_subtype, google_doc_url, name, google_doc_cu_url, notes }) => {
      try {
        const data = await client.post(`/minutes-templates`, {
          template_type,
          template_subtype,
          google_doc_url,
          name,
          google_doc_cu_url,
          notes,
        });
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: (err as Error).message }], isError: true };
      }
    },
  );

  server.registerTool(
    "minute_template_update",
    {
      title: "Atualizar template de minuta",
      description: "Atualiza os dados de um template de minuta existente pelo ID.",
      inputSchema: {
        id: z.string().uuid(),
        name: z.string().optional(),
        google_doc_url: z.string().url().optional(),
        google_doc_cu_url: z.string().url().optional(),
        notes: z.string().optional(),
      },
    },
    async ({ id, name, google_doc_url, google_doc_cu_url, notes }) => {
      try {
        const data = await client.patch(`/minutes-templates/${id}`, {
          name,
          google_doc_url,
          google_doc_cu_url,
          notes,
        });
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: (err as Error).message }], isError: true };
      }
    },
  );

  server.registerTool(
    "minute_template_delete",
    {
      title: "Remover template de minuta",
      description:
        "Remove um template de minuta pelo ID. Remove em cascata as minutas geradas e a " +
        "estratégia vinculada.",
      inputSchema: {
        id: z.string().uuid(),
      },
    },
    async ({ id }) => {
      try {
        const data = await client.del(`/minutes-templates/${id}`);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: (err as Error).message }], isError: true };
      }
    },
  );

  server.registerTool(
    "minute_template_detect_variables",
    {
      title: "Detectar variáveis de template",
      description:
        "Busca o HTML de um Google Doc e retorna as variáveis detectadas junto com o " +
        "html_template, sem criar o template.",
      inputSchema: {
        url: z.string().url(),
      },
    },
    async ({ url }) => {
      try {
        const data = await client.post(`/minutes-templates/detect-variables`, { url });
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: (err as Error).message }], isError: true };
      }
    },
  );
}
