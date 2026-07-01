#!/usr/bin/env node
/**
 * Transporte HTTP remoto do holding-mcp.
 *
 * Enquanto o `index.ts` roda via stdio (local, para Claude Code), este servidor
 * expõe o mesmo conjunto de tools por HTTP (spec MCP Streamable HTTP), para ser
 * cadastrado como *custom connector* remoto no Claude web / Cowork.
 *
 * Opera em modo STATELESS: a cada request cria-se um `HoldingClient` e um
 * `McpServer` novos, com a API key `hm_...` daquele cliente. A URL do backend
 * (`HOLDING_API_URL`) é fixa por deploy; a key vem por request.
 *
 * A API key pode ser enviada de 4 formas (para maximizar compatibilidade com
 * diferentes clientes MCP):
 *   1. `Authorization: Bearer hm_...`   (padrão para conectores remotos)
 *   2. header `x-api-key: hm_...`
 *   3. no path: `POST /<hm_...>/mcp`     (quando o cliente só aceita uma URL)
 *   4. query string: `?api_key=hm_...`
 */
import express from "express";
import type { Request, Response } from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

import { HoldingClient } from "./http-client.js";
import { createServer } from "./server.js";

function loadBaseUrl(): string {
  const raw = process.env.HOLDING_API_URL;
  if (!raw) {
    const msg =
      "Variável de ambiente HOLDING_API_URL faltando. Defina a URL do backend do Holding Manager.";
    console.error(msg);
    throw new Error(msg);
  }
  return raw.replace(/\/+$/, "");
}

/** Extrai a API key `hm_...` do request (Bearer, x-api-key, path ou query). */
function extractApiKey(req: Request): string | null {
  const auth = req.headers["authorization"];
  if (typeof auth === "string" && auth.toLowerCase().startsWith("bearer ")) {
    const token = auth.slice(7).trim();
    if (token) return token;
  }

  const headerKey = req.headers["x-api-key"];
  if (typeof headerKey === "string" && headerKey.trim()) {
    return headerKey.trim();
  }

  const pathKey = (req.params as Record<string, string>).apiKey;
  if (typeof pathKey === "string" && pathKey.startsWith("hm_")) {
    return pathKey;
  }

  const queryKey = req.query.api_key;
  if (typeof queryKey === "string" && queryKey.trim()) {
    return queryKey.trim();
  }

  return null;
}

const BASE_URL = loadBaseUrl();
const PORT = Number(process.env.PORT ?? process.env.MCP_HTTP_PORT ?? 3005);

const app = express();
app.use(express.json({ limit: "4mb" }));

// CORS permissivo — o connector remoto é chamado server-side, mas isso permite
// inspecionar o endpoint por navegador/MCP Inspector sem atrito.
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, x-api-key, Mcp-Session-Id, Mcp-Protocol-Version, Last-Event-ID",
  );
  res.header("Access-Control-Expose-Headers", "Mcp-Session-Id, Mcp-Protocol-Version");
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "holding-mcp-http" });
});

app.get("/", (_req, res) => {
  res.json({
    service: "holding-manager MCP (HTTP remoto)",
    endpoint: "/mcp",
    auth: "Authorization: Bearer hm_... (ou header x-api-key, ou path /<hm_...>/mcp)",
  });
});

async function handleMcpPost(req: Request, res: Response): Promise<void> {
  const apiKey = extractApiKey(req);
  if (!apiKey) {
    res.status(401).json({
      jsonrpc: "2.0",
      error: {
        code: -32001,
        message:
          "API key ausente. Envie `Authorization: Bearer hm_...`, header `x-api-key`, ou use a URL `/<hm_...>/mcp`.",
      },
      id: null,
    });
    return;
  }

  const client = new HoldingClient({ baseUrl: BASE_URL, apiKey });
  const server = createServer(client);
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless
  });

  res.on("close", () => {
    void transport.close();
    void server.close();
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error("Erro ao processar request MCP:", err);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Erro interno do servidor MCP." },
        id: null,
      });
    }
  }
}

// Stateless: GET (stream) e DELETE (encerrar sessão) não se aplicam.
function methodNotAllowed(_req: Request, res: Response): void {
  res.status(405).json({
    jsonrpc: "2.0",
    error: {
      code: -32000,
      message: "Método não permitido. Este servidor MCP é stateless — use POST.",
    },
    id: null,
  });
}

app.post("/mcp", handleMcpPost);
app.post("/:apiKey/mcp", handleMcpPost);
app.get("/mcp", methodNotAllowed);
app.delete("/mcp", methodNotAllowed);
app.get("/:apiKey/mcp", methodNotAllowed);
app.delete("/:apiKey/mcp", methodNotAllowed);

app.listen(PORT, () => {
  console.error(
    `holding-manager MCP HTTP remoto na porta ${PORT} — backend: ${BASE_URL}`,
  );
});
