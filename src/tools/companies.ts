import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { HoldingClient } from "../http-client.js";

export function registerCompanyTools(server: McpServer, client: HoldingClient): void {
  server.registerTool(
    "company_list",
    {
      title: "Listar empresas",
      description: "Lista todas as empresas de uma família.",
      inputSchema: {
        familyId: z.string().uuid(),
      },
    },
    async ({ familyId }) => {
      try {
        const data = await client.get(`/families/${familyId}/companies`);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: (err as Error).message }], isError: true };
      }
    },
  );

  server.registerTool(
    "company_create",
    {
      title: "Criar empresa",
      description:
        "Cria uma nova empresa em uma família. Os campos company_type, razao_social, tax_regime e " +
        "capital_social são obrigatórios; os demais são opcionais.",
      inputSchema: {
        familyId: z.string().uuid(),
        company_type: z.enum(["cofre", "veiculo", "destino"]),
        razao_social: z.string().min(2),
        tax_regime: z.enum(["lucro_presumido", "lucro_real", "simples"]),
        capital_social: z.number(),
        cnpj: z.string().optional(),
        nire: z.string().optional(),
        opened_at: z.string().optional(),
        cnae_code: z.string().optional(),
        cnae_description: z.string().optional(),
        total_quotas: z.number().optional(),
        zip_code: z.string().optional(),
        street: z.string().optional(),
        street_number: z.string().optional(),
        complement: z.string().optional(),
        neighborhood: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        administrator_member_id: z.string().uuid().optional(),
        administrator_powers: z.enum(["isoladamente", "conjuntamente"]).optional(),
        partners_state: z.string().optional(),
        signature_place_date: z.string().optional(),
        variables: z.record(z.unknown()).optional(),
      },
    },
    async (args) => {
      try {
        const { familyId, ...body } = args;
        const data = await client.post(`/families/${familyId}/companies`, body);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: (err as Error).message }], isError: true };
      }
    },
  );

  server.registerTool(
    "company_get",
    {
      title: "Obter empresa",
      description: "Obtém os detalhes de uma empresa de uma família.",
      inputSchema: {
        familyId: z.string().uuid(),
        companyId: z.string().uuid(),
      },
    },
    async ({ familyId, companyId }) => {
      try {
        const data = await client.get(`/families/${familyId}/companies/${companyId}`);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: (err as Error).message }], isError: true };
      }
    },
  );

  server.registerTool(
    "company_update",
    {
      title: "Atualizar empresa",
      description:
        "Atualiza os dados de uma empresa. Todos os campos são opcionais; apenas os campos " +
        "informados serão enviados. O campo company_type não é atualizável.",
      inputSchema: {
        familyId: z.string().uuid(),
        companyId: z.string().uuid(),
        razao_social: z.string().min(2).optional(),
        tax_regime: z.enum(["lucro_presumido", "lucro_real", "simples"]).optional(),
        capital_social: z.number().optional(),
        cnpj: z.string().optional(),
        nire: z.string().optional(),
        opened_at: z.string().optional(),
        cnae_code: z.string().optional(),
        cnae_description: z.string().optional(),
        total_quotas: z.number().optional(),
        zip_code: z.string().optional(),
        street: z.string().optional(),
        street_number: z.string().optional(),
        complement: z.string().optional(),
        neighborhood: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        administrator_member_id: z.string().uuid().optional(),
        administrator_powers: z.enum(["isoladamente", "conjuntamente"]).optional(),
        partners_state: z.string().optional(),
        signature_place_date: z.string().optional(),
        variables: z.record(z.unknown()).optional(),
      },
    },
    async (args) => {
      try {
        const { familyId, companyId, ...body } = args;
        const data = await client.patch(`/families/${familyId}/companies/${companyId}`, body);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: (err as Error).message }], isError: true };
      }
    },
  );

  server.registerTool(
    "company_delete",
    {
      title: "Excluir empresa",
      description: "Exclui uma empresa de uma família.",
      inputSchema: {
        familyId: z.string().uuid(),
        companyId: z.string().uuid(),
      },
    },
    async ({ familyId, companyId }) => {
      try {
        const data = await client.del(`/families/${familyId}/companies/${companyId}`);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: (err as Error).message }], isError: true };
      }
    },
  );

  server.registerTool(
    "company_add_partner",
    {
      title: "Adicionar sócio à empresa",
      description: "Adiciona um sócio (membro) a uma empresa, definindo participação e quotas.",
      inputSchema: {
        familyId: z.string().uuid(),
        companyId: z.string().uuid(),
        member_id: z.string().uuid(),
        participation_percentage: z.number(),
        quota_count: z.number().optional(),
        quota_value: z.number().optional(),
      },
    },
    async ({ familyId, companyId, member_id, participation_percentage, quota_count, quota_value }) => {
      try {
        const data = await client.post(
          `/families/${familyId}/companies/${companyId}/partners`,
          { member_id, participation_percentage, quota_count, quota_value },
        );
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: (err as Error).message }], isError: true };
      }
    },
  );

  server.registerTool(
    "company_update_partner",
    {
      title: "Atualizar sócio da empresa",
      description:
        "Atualiza a participação e as quotas de um sócio de uma empresa. Todos os campos de " +
        "dados são opcionais; apenas os informados serão enviados.",
      inputSchema: {
        familyId: z.string().uuid(),
        companyId: z.string().uuid(),
        partnerId: z.string().uuid(),
        participation_percentage: z.number().optional(),
        quota_count: z.number().optional(),
        quota_value: z.number().optional(),
      },
    },
    async ({ familyId, companyId, partnerId, participation_percentage, quota_count, quota_value }) => {
      try {
        const data = await client.patch(
          `/families/${familyId}/companies/${companyId}/partners/${partnerId}`,
          { participation_percentage, quota_count, quota_value },
        );
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: (err as Error).message }], isError: true };
      }
    },
  );

  server.registerTool(
    "company_remove_partner",
    {
      title: "Remover sócio da empresa",
      description: "Remove um sócio de uma empresa.",
      inputSchema: {
        familyId: z.string().uuid(),
        companyId: z.string().uuid(),
        partnerId: z.string().uuid(),
      },
    },
    async ({ familyId, companyId, partnerId }) => {
      try {
        const data = await client.del(
          `/families/${familyId}/companies/${companyId}/partners/${partnerId}`,
        );
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: (err as Error).message }], isError: true };
      }
    },
  );
}
