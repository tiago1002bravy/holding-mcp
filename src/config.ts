import type { HoldingClientConfig } from "./http-client.js";

export function loadConfig(): HoldingClientConfig {
  const baseUrlRaw = process.env.HOLDING_API_URL;
  const apiKey = process.env.HOLDING_API_KEY;

  const missing: string[] = [];
  if (!baseUrlRaw) missing.push("HOLDING_API_URL");
  if (!apiKey) missing.push("HOLDING_API_KEY");

  if (missing.length > 0) {
    const msg = `Variáveis de ambiente faltando: ${missing.join(", ")}. Defina-as antes de iniciar o servidor MCP.`;
    console.error(msg);
    throw new Error(msg);
  }

  const baseUrl = baseUrlRaw!.replace(/\/+$/, "");

  return { baseUrl, apiKey: apiKey! };
}
