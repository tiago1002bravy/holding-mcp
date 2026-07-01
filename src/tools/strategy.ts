import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { HoldingClient } from "../http-client.js";

export function registerStrategyTools(server: McpServer, client: HoldingClient): void {
  server.registerTool(
    "strategy_get",
    {
      title: "Obter estratégia da família",
      description: "Obtém a estratégia da holding de uma família, incluindo dados patrimoniais e minutas selecionadas.",
      inputSchema: {
        familyId: z.string().uuid(),
      },
    },
    async ({ familyId }) => {
      try {
        const data = await client.get(`/families/${familyId}/strategy`);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: (err as Error).message }], isError: true };
      }
    },
  );

  server.registerTool(
    "strategy_upsert",
    {
      title: "Salvar estratégia da família",
      description:
        "Cria ou atualiza (upsert) a estratégia da holding de uma família. Permite definir os dados " +
        "patrimoniais da holding e a lista de minutas selecionadas.",
      inputSchema: {
        familyId: z.string().uuid(),
        holding_data: z
          .object({
            estimated_patrimony: z.union([z.string(), z.number()]).optional(),
            capital_destino: z.union([z.string(), z.number()]).optional(),
            capital_veiculo: z.union([z.string(), z.number()]).optional(),
            capital_operacional: z.union([z.string(), z.number()]).optional(),
            has_golden_share: z.boolean().optional(),
            forum_location: z.string().optional(),
            notes: z.string().optional(),
            output_folder_id: z.string().optional(),
          })
          .partial()
          .optional(),
        minutes: z.array(z.record(z.unknown())).optional(),
      },
    },
    async ({ familyId, holding_data, minutes }) => {
      try {
        const data = await client.put(`/families/${familyId}/strategy`, { holding_data, minutes });
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: (err as Error).message }], isError: true };
      }
    },
  );

  server.registerTool(
    "strategy_missing_data",
    {
      title: "Dados faltantes da estratégia",
      description:
        "Lista os dados faltantes necessários para gerar as minutas da estratégia da família " +
        "(campos obrigatórios ainda não preenchidos).",
      inputSchema: {
        familyId: z.string().uuid(),
      },
    },
    async ({ familyId }) => {
      try {
        const data = await client.get(`/families/${familyId}/strategy/missing-data`);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: (err as Error).message }], isError: true };
      }
    },
  );

  server.registerTool(
    "strategy_minute_add",
    {
      title: "Adicionar minuta à estratégia",
      description:
        "Adiciona uma minuta à estratégia da família a partir de um modelo (template), " +
        "indicando a fase (1 ou 2) em que ela será gerada.",
      inputSchema: {
        familyId: z.string().uuid(),
        template_id: z.string().uuid(),
        phase: z.union([z.literal(1), z.literal(2)]),
      },
    },
    async ({ familyId, template_id, phase }) => {
      try {
        const data = await client.post(`/families/${familyId}/strategy/minutes`, {
          template_id,
          phase,
        });
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: (err as Error).message }], isError: true };
      }
    },
  );

  server.registerTool(
    "strategy_minute_update",
    {
      title: "Atualizar minuta da estratégia",
      description:
        "Atualiza uma minuta da estratégia da família: dados da minuta, empresa vinculada, fase, " +
        "ordem de exibição ou uso da variante CU.",
      inputSchema: {
        familyId: z.string().uuid(),
        minuteId: z.string().uuid(),
        minute_data: z.record(z.unknown()).optional(),
        company_id: z.string().uuid().nullable().optional(),
        phase: z.union([z.literal(1), z.literal(2)]).optional(),
        order_index: z.number().optional(),
        use_cu_variant: z.boolean().optional(),
      },
    },
    async ({ familyId, minuteId, minute_data, company_id, phase, order_index, use_cu_variant }) => {
      try {
        const data = await client.put(`/families/${familyId}/strategy/minutes/${minuteId}`, {
          minute_data,
          company_id,
          phase,
          order_index,
          use_cu_variant,
        });
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: (err as Error).message }], isError: true };
      }
    },
  );

  server.registerTool(
    "strategy_minute_remove",
    {
      title: "Remover minuta da estratégia",
      description: "Remove uma minuta da estratégia da família pelo seu ID.",
      inputSchema: {
        familyId: z.string().uuid(),
        minuteId: z.string().uuid(),
      },
    },
    async ({ familyId, minuteId }) => {
      try {
        const data = await client.del(`/families/${familyId}/strategy/minutes/${minuteId}`);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: (err as Error).message }], isError: true };
      }
    },
  );

  server.registerTool(
    "strategy_generate_phase1",
    {
      title: "Gerar minutas da fase 1",
      description:
        "Gera todas as minutas da fase 1 da estratégia da família. " +
        "Pode exigir Google Drive conectado e pasta de saída configurada; " +
        "erros de pré-requisito são retornados pela API.",
      inputSchema: {
        familyId: z.string().uuid(),
      },
    },
    async ({ familyId }) => {
      try {
        const data = await client.post(`/families/${familyId}/strategy/generate/phase1`);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: (err as Error).message }], isError: true };
      }
    },
  );

  server.registerTool(
    "strategy_generate_all",
    {
      title: "Gerar todas as minutas",
      description:
        "Gera todas as minutas (todas as fases) da estratégia da família. " +
        "Pode exigir Google Drive conectado e pasta de saída configurada; " +
        "erros de pré-requisito são retornados pela API.",
      inputSchema: {
        familyId: z.string().uuid(),
      },
    },
    async ({ familyId }) => {
      try {
        const data = await client.post(`/families/${familyId}/strategy/generate/all`);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: (err as Error).message }], isError: true };
      }
    },
  );

  server.registerTool(
    "strategy_generate_one",
    {
      title: "Gerar uma minuta",
      description:
        "Gera uma única minuta da estratégia da família pelo seu ID. " +
        "Pode exigir Google Drive conectado e pasta de saída configurada; " +
        "erros de pré-requisito são retornados pela API.",
      inputSchema: {
        familyId: z.string().uuid(),
        minuteId: z.string().uuid(),
      },
    },
    async ({ familyId, minuteId }) => {
      try {
        const data = await client.post(`/families/${familyId}/strategy/generate/${minuteId}`);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: (err as Error).message }], isError: true };
      }
    },
  );

  server.registerTool(
    "strategy_regenerate",
    {
      title: "Regerar uma minuta",
      description:
        "Regera (substitui) uma minuta já gerada da estratégia da família pelo seu ID. " +
        "Pode exigir Google Drive conectado e pasta de saída configurada; " +
        "erros de pré-requisito são retornados pela API.",
      inputSchema: {
        familyId: z.string().uuid(),
        minuteId: z.string().uuid(),
      },
    },
    async ({ familyId, minuteId }) => {
      try {
        const data = await client.post(`/families/${familyId}/strategy/regenerate/${minuteId}`);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: (err as Error).message }], isError: true };
      }
    },
  );

  server.registerTool(
    "generated_minute_list",
    {
      title: "Listar minutas geradas",
      description: "Lista as minutas já geradas para uma família.",
      inputSchema: {
        familyId: z.string().uuid(),
      },
    },
    async ({ familyId }) => {
      try {
        const data = await client.get(`/families/${familyId}/minutes`);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: (err as Error).message }], isError: true };
      }
    },
  );

  server.registerTool(
    "generated_minute_delete",
    {
      title: "Excluir minuta gerada",
      description: "Exclui uma minuta gerada de uma família pelo seu ID.",
      inputSchema: {
        familyId: z.string().uuid(),
        generatedMinuteId: z.string().uuid(),
      },
    },
    async ({ familyId, generatedMinuteId }) => {
      try {
        const data = await client.del(`/families/${familyId}/minutes/${generatedMinuteId}`);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: (err as Error).message }], isError: true };
      }
    },
  );
}
