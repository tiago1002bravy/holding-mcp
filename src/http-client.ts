export interface HoldingClientConfig {
  baseUrl: string;
  apiKey: string;
}

/**
 * Remove recursivamente chaves cujo valor é `undefined` de objetos planos.
 * O backend usa `forbidNonWhitelisted`, então enviar chaves `undefined`
 * (que viram ausentes no JSON de qualquer forma) é seguro; mas objetos
 * aninhados também são limpos para evitar payloads inesperados.
 */
function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefined(item)) as unknown as T;
  }
  if (value !== null && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (val === undefined) continue;
      result[key] = stripUndefined(val);
    }
    return result as T;
  }
  return value;
}

export class HoldingClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(config: HoldingClientConfig) {
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
  }

  get(path: string): Promise<unknown> {
    return this.request("GET", path);
  }

  post(path: string, body?: unknown): Promise<unknown> {
    return this.request("POST", path, body);
  }

  patch(path: string, body?: unknown): Promise<unknown> {
    return this.request("PATCH", path, body);
  }

  put(path: string, body?: unknown): Promise<unknown> {
    return this.request("PUT", path, body);
  }

  del(path: string): Promise<unknown> {
    return this.request("DELETE", path);
  }

  /**
   * Envia `multipart/form-data` sem arquivos (apenas campos de texto). Usado
   * pelos endpoints públicos que esperam multipart (ex: cadastro completo de
   * membro). NÃO define `content-type` — o fetch monta o boundary sozinho a
   * partir do FormData. Chaves `undefined`/`null` são omitidas; booleanos e
   * números são convertidos para string.
   */
  postForm(path: string, fields: Record<string, unknown>): Promise<unknown> {
    const form = new FormData();
    for (const [key, val] of Object.entries(fields)) {
      if (val === undefined || val === null) continue;
      form.append(key, typeof val === "string" ? val : String(val));
    }

    return this.send(path, {
      method: "POST",
      headers: { "x-api-key": this.apiKey },
      body: form,
    });
  }

  private request(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<unknown> {
    const init: RequestInit = {
      method,
      headers: {
        "x-api-key": this.apiKey,
        "content-type": "application/json",
      },
    };

    if (body !== undefined) {
      init.body = JSON.stringify(stripUndefined(body));
    }

    return this.send(path, init);
  }

  private async send(path: string, init: RequestInit): Promise<unknown> {
    const res = await fetch(this.baseUrl + path, init);

    let json: any = null;
    try {
      json = await res.json();
    } catch {
      // Sem corpo JSON (ex: 204 No Content)
      json = null;
    }

    if (res.ok && json?.success) {
      return json.data;
    }

    // Resposta sem corpo mas OK (ex: 204)
    if (res.ok && json === null) {
      return null;
    }

    let msg: string = json?.error?.message ?? res.statusText;
    const details = json?.error?.details;
    if (Array.isArray(details) && details.length > 0) {
      msg = msg + ": " + details.join("; ");
    }
    throw new Error(msg);
  }
}
