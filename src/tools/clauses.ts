import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { HoldingClient } from "../http-client.js";

export function registerClauseTools(server: McpServer, client: HoldingClient): void {
  server.registerTool(
    "clause_list",
    {
      description:
        "Lista as cláusulas da biblioteca (clause-library). Aceita um termo de busca opcional para filtrar por nome/conteúdo.",
      inputSchema: {
        search: z.string().optional().describe("Termo de busca opcional para filtrar as cláusulas."),
      },
    },
    async (args) => {
      try {
        const qs = args.search ? `?search=${encodeURIComponent(args.search)}` : "";
        const data = await client.get(`/clause-library${qs}`);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: error instanceof Error ? error.message : String(error) }],
        };
      }
    },
  );

  server.registerTool(
    "clause_create",
    {
      description:
        "Cria uma nova cláusula na biblioteca (clause-library). O slug é gerado automaticamente quando omitido.",
      inputSchema: {
        name: z.string().min(1).describe("Nome da cláusula (obrigatório)."),
        body: z.string().min(1).describe("Conteúdo/corpo da cláusula (obrigatório)."),
        slug: z.string().optional().describe("Slug opcional; gerado automaticamente se omitido."),
        description: z.string().optional().describe("Descrição opcional da cláusula."),
      },
    },
    async (args) => {
      try {
        const data = await client.post("/clause-library", {
          name: args.name,
          body: args.body,
          slug: args.slug,
          description: args.description,
        });
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: error instanceof Error ? error.message : String(error) }],
        };
      }
    },
  );

  server.registerTool(
    "clause_update",
    {
      description:
        "Atualiza uma cláusula existente da biblioteca (clause-library) pelo ID. Name e body são obrigatórios (UpsertClauseDto).",
      inputSchema: {
        id: z.string().uuid().describe("ID (UUID) da cláusula a atualizar."),
        name: z.string().min(1).describe("Nome da cláusula (obrigatório)."),
        body: z.string().min(1).describe("Conteúdo/corpo da cláusula (obrigatório)."),
        slug: z.string().optional().describe("Slug opcional; gerado automaticamente se omitido."),
        description: z.string().optional().describe("Descrição opcional da cláusula."),
      },
    },
    async (args) => {
      try {
        const data = await client.patch(`/clause-library/${args.id}`, {
          name: args.name,
          body: args.body,
          slug: args.slug,
          description: args.description,
        });
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: error instanceof Error ? error.message : String(error) }],
        };
      }
    },
  );

  server.registerTool(
    "clause_delete",
    {
      description: "Remove uma cláusula da biblioteca (clause-library) pelo ID.",
      inputSchema: {
        id: z.string().uuid().describe("ID (UUID) da cláusula a remover."),
      },
    },
    async (args) => {
      try {
        const data = await client.del(`/clause-library/${args.id}`);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: error instanceof Error ? error.message : String(error) }],
        };
      }
    },
  );

  server.registerTool(
    "clause_detect_vars",
    {
      description:
        "Detecta as variáveis {{var}} presentes no corpo de uma cláusula, classificando-as por categoria (automatico|estrategia|papel).",
      inputSchema: {
        body: z.string().describe("Corpo da cláusula a analisar em busca de variáveis {{var}}."),
      },
    },
    async (args) => {
      try {
        const data = await client.post("/clause-library/detect-vars", {
          body: args.body,
        });
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: error instanceof Error ? error.message : String(error) }],
        };
      }
    },
  );

  server.registerTool(
    "clause_ai_rewrite",
    {
      description:
        "Reescreve um trecho selecionado de uma cláusula usando IA. Atenção: consome créditos e depende de um LLM configurado; eventuais erros são retornados diretamente pela API.",
      inputSchema: {
        selection_html: z.string().describe("HTML do trecho selecionado a ser reescrito."),
        selection_text: z.string().describe("Texto puro do trecho selecionado."),
        instruction: z
          .string()
          .max(500)
          .optional()
          .describe("Instrução opcional (até 500 caracteres) orientando a reescrita."),
      },
    },
    async (args) => {
      try {
        const data = await client.post("/clause-library/ai/rewrite-selection", {
          selection_html: args.selection_html,
          selection_text: args.selection_text,
          instruction: args.instruction,
        });
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: error instanceof Error ? error.message : String(error) }],
        };
      }
    },
  );
}
