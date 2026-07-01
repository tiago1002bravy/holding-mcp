# holding-mcp

Servidor **MCP** que expõe o cadastro do Holding Manager (famílias, membros, imóveis, empresas/sócios, estratégia, minutas, cláusulas e templates) como **tools** para o Claude operar em linguagem natural.

Ele **não acessa o banco direto**: envolve a API REST do `holding-backend`, reaproveitando toda a validação, isolamento por tenant, créditos e detecção de variáveis. Autentica com uma **API key** enviada no header `x-api-key`.

Roda em **dois transportes** com o mesmo conjunto de 54 tools:

- **stdio** (`build/index.js`) — processo local, para **Claude Code**.
- **HTTP remoto** (`build/http.js`) — servidor hospedado, para **Claude web / Cowork** como *custom connector*. No ar em `https://mcp.holding.bravy.com.br/mcp` (ver §3b).

```
Claude Code   ──stdio──▶ holding-mcp (local)  ─┐
                                               ├─ HTTP (x-api-key) ─▶ holding-backend (NestJS) ─▶ PostgreSQL
Claude web/   ──HTTPS──▶ mcp.holding... (remoto)┘
Cowork
```

---

## 1. Pré-requisitos

- **Node 20+**
- `holding-backend` rodando e acessível (local ou produção)
- Uma **API key** do tenant (ver seção 2)

---

## 2. Backend: habilitar e emitir a API key

O mecanismo de API token faz parte do `holding-backend` (entidade `ApiToken`, strategy Passport `api-token`, endpoints `/auth/api-tokens`). Qualquer endpoint protegido passa a aceitar `x-api-key` além do JWT.

**Passo 1 — aplicar a migration** (cria a tabela `api_tokens`):

```bash
cd ../holding-backend
yarn migration:run
```

**Passo 2 — emitir a key** (precisa de um login de `tenant_admin`/`super_admin`):

```bash
# login → pega o access_token
curl -sX POST http://localhost:3001/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"admin@example.com","password":"..."}'

# cria a API key (retorna o valor cru "hm_..." UMA ÚNICA VEZ)
curl -sX POST http://localhost:3001/auth/api-tokens \
  -H 'content-type: application/json' \
  -H 'authorization: Bearer <ACCESS_TOKEN>' \
  -d '{"name":"mcp"}'
```

A key vem no formato `hm_<hex>`. Guarde num lugar seguro — o backend só armazena o hash (sha256), então ela não pode ser recuperada depois. Endpoints auxiliares: `GET /auth/api-tokens` (lista, sem o valor), `DELETE /auth/api-tokens/:id` (revoga).

> A key liga o MCP a **um tenant**. Para operar outro tenant, emita outra key logado nesse tenant.

---

## 3. Instalar, buildar e registrar

```bash
npm install
npm run build          # gera build/
```

Registrar no Claude Code (escopo `project` grava `.mcp.json` versionável):

```bash
claude mcp add holding -s project \
  -e HOLDING_API_URL=https://api.holding.bravy.com.br \
  -e HOLDING_API_KEY=hm_xxx \
  -- node <ABS>/holding-mcp/build/index.js
```

> Produção: `https://api.holding.bravy.com.br`. Use `http://localhost:3001` só se estiver rodando o backend localmente.

Substitua `<ABS>` pelo caminho absoluto. **Não versione a key**: no `.mcp.json` use `"${HOLDING_API_KEY}"` e mantenha o valor real no `.env`/secret.

Sem clonar (pega a versão mais recente do GitHub e builda sozinho via `prepare`):

```bash
claude mcp add holding \
  -e HOLDING_API_URL=https://api.holding.bravy.com.br \
  -e HOLDING_API_KEY=hm_xxx \
  -- npx -y github:tiago1002bravy/holding-mcp
```

---

## 3b. Modo remoto HTTP (Claude web / Cowork)

O stdio só funciona no Claude Code (processo local). Para o **Claude web / Cowork** (nuvem, não sobe processo local) há o transporte **HTTP remoto** (`src/http.ts`), já hospedado:

- **URL do conector:** `https://mcp.holding.bravy.com.br/mcp`
- **Auth:** sua chave `hm_...` como `Authorization: Bearer hm_...`. Se a UI do conector não aceitar header/token, use a chave embutida no caminho: `https://mcp.holding.bravy.com.br/hm_sua_chave/mcp`.

Funciona em **modo stateless**: cada request cria um `HoldingClient`/`McpServer` novos com a key daquele cliente. A key é aceita de 4 formas — `Authorization: Bearer`, header `x-api-key`, no path `/<hm_...>/mcp`, ou `?api_key=`. A URL do backend (`HOLDING_API_URL`) é fixa no servidor.

**Rodar você mesmo** (Docker; o `Dockerfile` roda o HTTP por padrão, porta `3005`):

```bash
docker compose up http          # sobe o serviço HTTP local em :3005
# ou:
HOLDING_API_URL=https://api.holding.bravy.com.br npm run start:http
```

Health check: `GET /health`. Deploy de produção: Coolify (app `holding-mcp`), domínio `mcp.holding.bravy.com.br`, env `HOLDING_API_URL`.

### Variáveis de ambiente

| Var | Descrição |
|-----|-----------|
| `HOLDING_API_URL` | Base URL da API (ex: `http://localhost:3001`) |
| `HOLDING_API_KEY` | A key `hm_...` enviada no header `x-api-key` |

---

## 4. Testar com o MCP Inspector

```bash
HOLDING_API_URL=http://localhost:3001 HOLDING_API_KEY=hm_xxx \
  npx @modelcontextprotocol/inspector node build/index.js
```

Abre uma UI web para listar e chamar as tools.

---

## 5. Catálogo de tools (54)

Nomenclatura `recurso_acao`. Campos seguem os DTOs do backend (snake_case). IDs são UUID.

### Famílias
- `family_list` · `family_create {name}` · `family_get {id}` · `family_update {id, name?}` · `family_delete {id}`
- `family_get_document_rules {id}` · `family_update_document_rules {id, type, rules}` — `rules` mapeia cada documento (`rg_cnh`, `matricula`, …) para `required | optional | hidden`

### Membros
- `member_list {familyId}`
- `member_register {familyId, name}` — cria com o nome e devolve um `form_token`
- **`member_create {familyId, name, kinship?, email?, phone?, profession?, marital_status?, marital_regime?}`** — cadastro completo **sem extração** (ver §6)
- `member_get` · `member_delete` · `member_get_qualification`
- `member_update_extracted {familyId, memberId, cpf?, birth_date?, rg_number?, issuing_body?, spouse_name?, marriage_date?, marital_regime?, street?, city?, state?, zip_code?, qualification_text?, full_name?, manually_edited?, …}` — preenche os dados de qualificação **manualmente**

### Imóveis
- `property_list {familyId}` · `property_get` · `property_delete` · `property_get_qualification`
- **`property_create {familyId, label, property_type?, has_registration?, registration_number?, registry_office?, city_uf?, inscricao_imobiliaria?, has_rental_income?, rental_income_value?, rental_income_declared?}`** — cadastro **sem extração** (ver §6)
- `property_update_extracted {familyId, propertyId, registration_number?, registry_office?, property_description?, valor_mercado?, valor_ir?, …}`

### Empresas / sócios
- `company_list {familyId}` · `company_create {familyId, company_type, razao_social, tax_regime, capital_social, …}` · `company_get` · `company_update` · `company_delete`
- `company_add_partner {familyId, companyId, member_id, participation_percentage, quota_count?, quota_value?}` · `company_update_partner` · `company_remove_partner`

### Estratégia, minutas e geração
- `strategy_get {familyId}` · `strategy_upsert {familyId, holding_data?, minutes?}` · `strategy_missing_data {familyId}`
- `strategy_minute_add {familyId, template_id, phase}` · `strategy_minute_update {familyId, minuteId, minute_data?, …}` · `strategy_minute_remove`
- `strategy_generate_phase1` · `strategy_generate_all` · `strategy_generate_one {familyId, minuteId}` · `strategy_regenerate {familyId, minuteId}`
- `generated_minute_list {familyId}` · `generated_minute_delete {familyId, generatedMinuteId}`

> As tools de **geração** exigem Google Drive conectado e pasta de saída configurada. Erros de pré-requisito são retornados pela API.

### Cláusulas
- `clause_list {search?}` · `clause_create {name, body, slug?, description?}` · `clause_update {id, name, body, …}` · `clause_delete {id}`
- `clause_detect_vars {body}` — pré-visualiza as variáveis `{{...}}`
- `clause_ai_rewrite {selection_html, selection_text, instruction?}` — reescrita via LLM (consome créditos)

### Templates de minuta
- `minute_template_list`
- `minute_template_create {template_type, template_subtype, google_doc_url, name?, google_doc_cu_url?, notes?}` — **cadastra pelo link do Google Docs** (ver §6)
- `minute_template_update {id, …}` · `minute_template_delete {id}`
- `minute_template_detect_variables {url}` — pré-visualiza variáveis do Google Doc, sem salvar

### Tokens de formulário
- `form_token_create {familyId, type}` · `form_token_list {familyId}` · `form_token_revoke {familyId, tokenId}`

---

## 6. Fluxos comuns

### Cadastrar uma pessoa já com os dados (sem extração)
1. `member_create {familyId, name, kinship?, email?, phone?, profession?, marital_status?, marital_regime?}` → cria o membro e retorna o `memberId`. Só `name` é obrigatório; telefone aceita qualquer formato.
2. (opcional) `member_update_extracted {familyId, memberId, cpf, birth_date, rg_number, spouse_name, street, city, state, qualification_text, …}` → grava os dados de qualificação usados na geração de minutas (marcados como `manually_edited`).

> Se as regras de documentos da família marcarem algum doc como `required`, a API pode recusar o `member_create` sem os arquivos. Ajuste com `family_update_document_rules` ou use `member_register` + `member_update_extracted`.

### Cadastrar um imóvel (sem extração)
`property_create` já grava todos os campos direto (via token de formulário + rascunho), sem upload de matrícula.

### Cadastrar um template de minuta
`minute_template_create` com a **URL do Google Docs**: o backend baixa o HTML e detecta as variáveis `{{...}}` automaticamente. O documento precisa estar acessível ("qualquer pessoa com o link pode ver"). Use `minute_template_detect_variables {url}` antes para pré-visualizar as variáveis sem salvar.

---

## 7. Limitações / fora de escopo (fase 2)

- **Upload de documentos** (PDF/imagem de membro e imóvel) — os endpoints são multipart com arquivos locais; ainda não há tool para isso.
- **SSE** de extração em tempo real (`/families/realtime/extraction`) — não mapeado.
- `name` do membro continua **obrigatório** (coluna NOT NULL no banco).

---

## 8. Como funciona por dentro

- `src/config.ts` — lê `HOLDING_API_URL` / `HOLDING_API_KEY`.
- `src/http-client.ts` — `HoldingClient` (`get/post/patch/put/del` + `postForm` para multipart sem arquivos). Injeta `x-api-key`, desembrulha o envelope `{ success, data }` da API, e converte erros (`{ error: { message, details } }`) em `Error` legível. Remove chaves `undefined` (o backend usa `forbidNonWhitelisted`).
- `src/server.ts` — `createServer(client)`: monta o `McpServer` e registra todas as tools. Reutilizado pelos dois transportes.
- `src/tools/*.ts` — um módulo por recurso; cada um exporta `register<Recurso>Tools(server, client)`.
- `src/index.ts` — transporte **stdio**: instancia via `createServer` e conecta com `StdioServerTransport`. Logs só em `stderr`.
- `src/http.ts` — transporte **HTTP remoto**: Express + `StreamableHTTPServerTransport` (stateless), server/client novos por request com a key extraída do request. Rotas `/mcp`, `/:apiKey/mcp`, `/health`.
