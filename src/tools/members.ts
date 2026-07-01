import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { HoldingClient } from "../http-client.js";

export function registerMemberTools(server: McpServer, client: HoldingClient): void {
  server.registerTool(
    "member_list",
    {
      title: "Listar membros",
      description: "Lista todos os membros de uma família.",
      inputSchema: {
        familyId: z.string().uuid(),
      },
    },
    async ({ familyId }) => {
      try {
        const data = await client.get(`/families/${familyId}/members`);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: (err as Error).message }], isError: true };
      }
    },
  );

  server.registerTool(
    "member_register",
    {
      title: "Registrar membro",
      description:
        "Registra um novo membro em uma família. Retorna o membro criado com o form_token para " +
        "preenchimento dos dados.",
      inputSchema: {
        familyId: z.string().uuid(),
        name: z.string().min(2),
      },
    },
    async ({ familyId, name }) => {
      try {
        const data = await client.post(`/families/${familyId}/members/register`, { name });
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: (err as Error).message }], isError: true };
      }
    },
  );

  server.registerTool(
    "member_create",
    {
      title: "Cadastrar membro completo (sem extração)",
      description:
        "Cadastra um membro já com todos os dados de ficha, sem depender de extração de documentos. " +
        "Orquestra: cria um token de formulário (type=member) e submete os dados no formulário público, " +
        "que cria o membro. Preenche parentesco, e-mail, telefone, profissão, estado civil e regime de bens — " +
        "campos que o registro simples (member_register) não define. Para dados de qualificação (CPF, RG, " +
        "nascimento, endereço, cônjuge, texto de qualificação), use member_update_extracted depois com o " +
        "memberId retornado. Observação: se as regras de documentos da família marcarem algum documento como " +
        "'required', a API pode recusar o cadastro sem os arquivos — nesse caso ajuste as regras ou use " +
        "member_register + member_update_extracted.",
      inputSchema: {
        familyId: z.string().uuid(),
        name: z.string().min(2),
        kinship: z
          .enum(["patriarca", "matriarca", "filho", "neto", "sobrinho", "outro"])
          .optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        profession: z.string().optional(),
        marital_status: z
          .enum(["solteiro", "casado", "viuvo", "divorciado", "uniao_estavel"])
          .optional(),
        marital_regime: z
          .enum([
            "comunhao_parcial",
            "comunhao_universal",
            "separacao_total",
            "participacao_final",
          ])
          .optional(),
      },
    },
    async ({ familyId, ...fields }) => {
      try {
        const tokenObj = await client.post(`/families/${familyId}/tokens`, {
          type: "member",
        });
        const token = (tokenObj as any).token as string;
        const member = await client.postForm(`/public/form/${token}/member`, fields);
        return {
          content: [
            { type: "text", text: JSON.stringify({ token, member }, null, 2) },
          ],
        };
      } catch (err) {
        return { content: [{ type: "text", text: (err as Error).message }], isError: true };
      }
    },
  );

  server.registerTool(
    "member_get",
    {
      title: "Obter membro",
      description: "Obtém os detalhes de um membro de uma família.",
      inputSchema: {
        familyId: z.string().uuid(),
        memberId: z.string().uuid(),
      },
    },
    async ({ familyId, memberId }) => {
      try {
        const data = await client.get(`/families/${familyId}/members/${memberId}`);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: (err as Error).message }], isError: true };
      }
    },
  );

  server.registerTool(
    "member_delete",
    {
      title: "Excluir membro",
      description: "Exclui um membro de uma família.",
      inputSchema: {
        familyId: z.string().uuid(),
        memberId: z.string().uuid(),
      },
    },
    async ({ familyId, memberId }) => {
      try {
        const data = await client.del(`/families/${familyId}/members/${memberId}`);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: (err as Error).message }], isError: true };
      }
    },
  );

  server.registerTool(
    "member_get_qualification",
    {
      title: "Obter qualificação do membro",
      description: "Obtém a qualificação de um membro de uma família.",
      inputSchema: {
        familyId: z.string().uuid(),
        memberId: z.string().uuid(),
      },
    },
    async ({ familyId, memberId }) => {
      try {
        const data = await client.get(`/families/${familyId}/members/${memberId}/qualification`);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: (err as Error).message }], isError: true };
      }
    },
  );

  server.registerTool(
    "member_update_extracted",
    {
      title: "Atualizar dados extraídos do membro",
      description:
        "Atualiza os dados extraídos de um membro. Todos os campos são opcionais; apenas os campos " +
        "informados serão enviados.",
      inputSchema: {
        familyId: z.string().uuid(),
        memberId: z.string().uuid(),
        gender: z.string().optional(),
        nationality: z.string().optional(),
        cpf: z.string().optional(),
        birth_date: z.string().optional(),
        birth_place: z.string().optional(),
        profession: z.string().optional(),
        rg_number: z.string().optional(),
        issuing_body: z.string().optional(),
        spouse_name: z.string().optional(),
        marriage_date: z.string().optional(),
        marriage_place: z.string().optional(),
        marital_regime: z.string().optional(),
        street: z.string().optional(),
        street_number: z.string().optional(),
        complement: z.string().optional(),
        neighborhood: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zip_code: z.string().optional(),
        qualification_text: z.string().optional(),
        extraction_status: z.string().optional(),
        full_name: z.string().optional(),
        manually_edited: z.boolean().optional(),
      },
    },
    async (args) => {
      try {
        const { familyId, memberId, ...body } = args;
        const data = await client.patch(
          `/families/${familyId}/members/${memberId}/extracted`,
          body,
        );
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: (err as Error).message }], isError: true };
      }
    },
  );
}
