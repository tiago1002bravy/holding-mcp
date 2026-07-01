import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { HoldingClient } from "../http-client.js";

export function registerPropertyTools(server: McpServer, client: HoldingClient): void {
  server.tool(
    "property_list",
    "Lista todos os imóveis de uma família.",
    {
      familyId: z.string().uuid().describe("ID da família (UUID)"),
    },
    async ({ familyId }) => {
      try {
        const data = await client.get(`/families/${familyId}/properties`);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: (err as Error).message }], isError: true };
      }
    },
  );

  server.tool(
    "property_get",
    "Busca um imóvel específico de uma família pelo ID.",
    {
      familyId: z.string().uuid().describe("ID da família (UUID)"),
      propertyId: z.string().uuid().describe("ID do imóvel (UUID)"),
    },
    async ({ familyId, propertyId }) => {
      try {
        const data = await client.get(`/families/${familyId}/properties/${propertyId}`);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: (err as Error).message }], isError: true };
      }
    },
  );

  server.tool(
    "property_delete",
    "Remove um imóvel de uma família.",
    {
      familyId: z.string().uuid().describe("ID da família (UUID)"),
      propertyId: z.string().uuid().describe("ID do imóvel (UUID)"),
    },
    async ({ familyId, propertyId }) => {
      try {
        const data = await client.del(`/families/${familyId}/properties/${propertyId}`);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: (err as Error).message }], isError: true };
      }
    },
  );

  server.tool(
    "property_get_qualification",
    "Busca a qualificação (texto jurídico descritivo) de um imóvel.",
    {
      familyId: z.string().uuid().describe("ID da família (UUID)"),
      propertyId: z.string().uuid().describe("ID do imóvel (UUID)"),
    },
    async ({ familyId, propertyId }) => {
      try {
        const data = await client.get(
          `/families/${familyId}/properties/${propertyId}/qualification`,
        );
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: (err as Error).message }], isError: true };
      }
    },
  );

  server.tool(
    "property_update_extracted",
    "Atualiza os dados extraídos (via OCR/IA) de um imóvel. Todos os campos são opcionais.",
    {
      familyId: z.string().uuid().describe("ID da família (UUID)"),
      propertyId: z.string().uuid().describe("ID do imóvel (UUID)"),
      registration_number: z.string().optional().describe("Número da matrícula"),
      registry_office: z.string().optional().describe("Cartório de registro de imóveis"),
      inscricao_imobiliaria: z.string().optional().describe("Inscrição imobiliária municipal"),
      property_description: z.string().optional().describe("Descrição do imóvel"),
      property_name: z.string().optional().describe("Nome do imóvel"),
      area_total: z.string().optional().describe("Área total"),
      area_built: z.string().optional().describe("Área construída"),
      total_area_hectares: z.string().optional().describe("Área total em hectares (rural)"),
      property_address: z.string().optional().describe("Endereço do imóvel"),
      nirf_number: z.string().optional().describe("Número do NIRF (rural)"),
      ccir_number: z.string().optional().describe("Número do CCIR (rural)"),
      car_number: z.string().optional().describe("Número do CAR (rural)"),
      valor_ir: z.string().optional().describe("Valor declarado no Imposto de Renda"),
      valor_ir_ano_calendario: z
        .string()
        .optional()
        .describe("Ano-calendário do valor no IR"),
      valor_mercado: z.string().optional().describe("Valor de mercado"),
      qualification_text: z.string().optional().describe("Texto da qualificação"),
      extraction_status: z.string().optional().describe("Status da extração"),
      manually_edited: z
        .boolean()
        .optional()
        .describe("Indica se foi editado manualmente"),
    },
    async (args) => {
      try {
        const { familyId, propertyId, ...body } = args;
        const data = await client.patch(
          `/families/${familyId}/properties/${propertyId}/extracted`,
          body,
        );
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: (err as Error).message }], isError: true };
      }
    },
  );

  server.tool(
    "property_create",
    "Cria um imóvel para uma família de forma orquestrada: gera um token de formulário público, registra o imóvel e, se informados campos de rascunho, atualiza o draft.",
    {
      familyId: z.string().uuid().describe("ID da família (UUID)"),
      label: z.string().min(2).describe("Rótulo/apelido do imóvel"),
      property_type: z
        .enum(["urbano", "rural"])
        .optional()
        .describe("Tipo do imóvel: urbano ou rural"),
      has_registration: z
        .boolean()
        .optional()
        .describe("Se o imóvel possui matrícula"),
      registration_number: z.string().optional().describe("Número da matrícula"),
      registry_office: z.string().optional().describe("Cartório de registro de imóveis"),
      city_uf: z.string().optional().describe("Cidade/UF do imóvel"),
      inscricao_imobiliaria: z.string().optional().describe("Inscrição imobiliária municipal"),
      has_rental_income: z
        .boolean()
        .optional()
        .describe("Se o imóvel gera renda de aluguel"),
      rental_income_value: z.string().optional().describe("Valor da renda de aluguel"),
      rental_income_declared: z
        .boolean()
        .optional()
        .describe("Se a renda de aluguel é declarada"),
    },
    async (args) => {
      try {
        const {
          familyId,
          label,
          property_type,
          has_registration,
          registration_number,
          registry_office,
          city_uf,
          inscricao_imobiliaria,
          has_rental_income,
          rental_income_value,
          rental_income_declared,
        } = args;

        const tokenObj = await client.post(`/families/${familyId}/tokens`, {
          type: "property",
        });
        const token = (tokenObj as any).token;

        const reg = await client.post(`/public/form/${token}/properties/register`, {
          label,
        });
        const propertyId = (reg as any).id;

        const draftFields = [
          property_type,
          has_registration,
          registration_number,
          registry_office,
          city_uf,
          inscricao_imobiliaria,
          has_rental_income,
          rental_income_value,
          rental_income_declared,
        ];
        const hasDraft = draftFields.some((field) => field !== undefined);

        if (hasDraft) {
          const draftBody = {
            property_type,
            has_registration,
            registration_number,
            registry_office,
            city_uf,
            inscricao_imobiliaria,
            has_rental_income,
            rental_income_value,
            rental_income_declared,
          };
          await client.patch(`/public/form/${token}/property/${propertyId}/draft`, draftBody);
        }

        const data = { token, property_id: propertyId, register: reg };
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: (err as Error).message }], isError: true };
      }
    },
  );
}
