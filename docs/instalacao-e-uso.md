# Holding Manager MCP — Instalação e Uso

Guia para conectar o **Holding Manager** ao seu Claude e operar os cadastros
(famílias, membros, imóveis, empresas, minutas, cláusulas) em linguagem natural.

O MCP roda **na sua máquina** e conversa com o servidor do Holding Manager pela
internet, autenticando com uma **chave de API** individual (`x-api-key`).

```
Seu Claude Code  ──▶  holding-mcp (local)  ──HTTPS + x-api-key──▶  API do Holding Manager
```

---

## 1. Pré-requisitos

- **Node.js 20 ou superior** — verifique com `node -v`. Instale em https://nodejs.org se necessário.
- **Claude Code** instalado.
- Sua **chave de API** (`hm_...`), fornecida pelo administrador da sua holding
  (ou gerada por você — ver seção 5).

---

## 2. Instalação (npm)

Não precisa clonar nada nem buildar. O comando abaixo já baixa e executa a
versão mais recente automaticamente via `npx`.

Registre o MCP no Claude Code:

```bash
claude mcp add holding \
  -e HOLDING_API_URL=https://api.holding.bravy.com.br \
  -e HOLDING_API_KEY=hm_sua_chave_aqui \
  -- npx -y github:tiago1002bravy/holding-mcp
```

- `HOLDING_API_URL` — endereço do servidor do Holding Manager (informado pelo administrador).
- `HOLDING_API_KEY` — sua chave individual `hm_...`.

Pronto. Reinicie o Claude Code se ele já estiver aberto.

### Verificar se conectou

```bash
claude mcp list
```

Deve aparecer `holding` como conectado. No chat, você pode pedir: *"liste as
famílias"* e o Claude usará a tool `family_list`.

---

## 2b. Usar no Claude web / Cowork (conector remoto)

O modo acima (npx local) só funciona no **Claude Code**, que roda um processo na
sua máquina. Para usar no **Claude web / Cowork** (que roda na nuvem), existe uma
versão **remota HTTP** hospedada, cadastrada como *custom connector*:

- **URL do conector:** `https://mcp.holding.bravy.com.br/mcp`
- **Autenticação:** sua chave `hm_...` — enviada como `Authorization: Bearer hm_...`.

Ao adicionar um conector customizado no Claude, informe essa URL e a chave. Se a
interface **não** permitir cabeçalho/token, use a URL com a chave embutida no
caminho:

```
https://mcp.holding.bravy.com.br/hm_sua_chave_aqui/mcp
```

> A URL do backend é fixa no servidor remoto; você só precisa da sua chave.
> Não é preciso instalar Node nem nada localmente para esse modo.

---

## 3. Alternativa: rodar via Docker (sem instalar Node)

Se preferir não instalar Node, dá para rodar via Docker (precisa apenas do Docker).
A imagem ainda não está num registry público, então builde a partir do repositório:

```bash
git clone https://github.com/tiago1002bravy/holding-mcp.git
cd holding-mcp
docker build -t holding-mcp:latest .

claude mcp add holding -- docker run -i --rm \
  -e HOLDING_API_URL=https://api.holding.bravy.com.br \
  -e HOLDING_API_KEY=hm_sua_chave_aqui \
  holding-mcp:latest
```

> O `-i` é obrigatório (o MCP se comunica por STDIN/STDOUT).

---

## 4. Como usar (exemplos de conversa)

Depois de instalado, é só pedir em português. Exemplos:

- **Criar família e pessoas**
  *"Crie a família Silva. Nela, cadastre o patriarca João Silva (casado, comunhão parcial, engenheiro) e a matriarca Maria Silva."*
  → `family_create`, depois `member_create` para cada pessoa.

- **Completar dados de qualificação (sem precisar de documento)**
  *"No membro João Silva, preencha CPF 123.456.789-00, RG 12.345.678, nascido em 10/05/1970 em São Paulo/SP, endereço Rua X, 100, Centro."*
  → `member_update_extracted`.

- **Cadastrar imóvel**
  *"Adicione um imóvel urbano 'Apartamento Centro' na família Silva, com matrícula 45.678 do 2º CRI de São Paulo."*
  → `property_create`.

- **Empresa e sócios**
  *"Crie a holding (empresa tipo cofre) 'Silva Participações', regime lucro presumido, capital 1.000.000, e coloque João e Maria como sócios 50%/50%."*
  → `company_create` + `company_add_partner`.

- **Cadastrar um modelo de minuta pelo Google Docs**
  *"Cadastre um template de minuta de abertura, subtipo 'cofre', a partir deste link do Google Docs: <URL>."*
  → `minute_template_create` (o sistema lê o documento e detecta as variáveis).

- **Gerar as minutas**
  *"Gere as minutas da fase 1 da família Silva."*
  → `strategy_generate_phase1` (requer Google Drive conectado no sistema).

> Dica: peça *"o que ainda falta para gerar as minutas da família Silva?"* → `strategy_missing_data`.

---

## 5. Obter/gerar sua chave de API

Se você mesmo administra o Holding Manager (perfil admin), gere sua chave assim:

```bash
# 1. login → copie o access_token retornado
curl -sX POST https://api.holding.bravy.com.br/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"voce@holding.com","password":"sua_senha"}'

# 2. gere a chave (o valor "hm_..." aparece UMA ÚNICA VEZ — guarde-o)
curl -sX POST https://api.holding.bravy.com.br/auth/api-tokens \
  -H 'content-type: application/json' \
  -H 'authorization: Bearer <ACCESS_TOKEN>' \
  -d '{"name":"meu-claude"}'
```

- A chave é **individual e ligada à sua holding (tenant)** — não compartilhe.
- Perdeu a chave? Gere outra e revogue a antiga: `DELETE /auth/api-tokens/:id`.
- Listar suas chaves: `GET /auth/api-tokens` (não mostra o valor, só metadados).

---

## 6. Atualizar / remover

- **Atualizar:** com `npx -y github:tiago1002bravy/holding-mcp`, a versão mais recente é baixada
  automaticamente. Basta reabrir o Claude Code.
- **Remover:** `claude mcp remove holding`.

---

## 7. Problemas comuns

| Sintoma | Causa provável | Solução |
|--------|----------------|---------|
| `holding` não aparece em `claude mcp list` | Node < 20 ou caminho errado | `node -v` (precisa ≥ 20); reinstale com o comando da seção 2 |
| Erro 401 / "Invalid API key" | Chave errada, expirada ou revogada | Gere uma nova (seção 5) e reconfigure |
| "Variáveis de ambiente faltando" | Faltou `-e HOLDING_API_URL` ou `-e HOLDING_API_KEY` | Refaça o `claude mcp add` com as duas envs |
| Erros de "Validation failed" ao cadastrar | Campo obrigatório ausente ou valor inválido | O Claude mostra o detalhe; ajuste os dados |
| Geração de minuta falha | Google Drive não conectado / pasta não configurada | Conecte o Google Drive no painel do Holding Manager |

---

## 8. O que dá para fazer (resumo das tools)

Famílias · Membros (incl. cadastro completo sem extração) · Imóveis · Empresas e
sócios · Estratégia e geração de minutas · Cláusulas · Templates de minuta ·
Tokens de formulário. A lista completa e os campos de cada operação estão no
`README.md` do projeto (seção *Catálogo de tools*).
