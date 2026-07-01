# Publicar o holding-mcp no npm

O pacote já está pronto para publicação. O nome `holding-mcp` está **livre** no npm.

## Pré-checagem (o que vai ser publicado)

```bash
cd holding-mcp
npm run build          # gera build/ (o prepublishOnly já faz isso no publish)
npm pack --dry-run     # confere os arquivos do tarball (só build/, docs/, README, package.json)
```

## Publicar

```bash
npm login              # entre com a conta npm que vai ser dona do pacote
npm whoami             # confirma que está logado

npm publish --access public
```

> `prepublishOnly` roda `npm run build` automaticamente, então o `build/` sempre sai atualizado.

## Versionar as próximas releases

```bash
npm version patch      # 0.1.0 -> 0.1.1  (ou minor / major)
npm publish
```

Como os clientes usam `npx -y holding-mcp`, eles pegam a versão mais recente automaticamente ao reabrir o Claude.

## Depois de publicado — comando que o cliente usa

```bash
claude mcp add holding \
  -e HOLDING_API_URL=https://api.holding.bravy.com.br \
  -e HOLDING_API_KEY=hm_a_chave_do_cliente \
  -- npx -y holding-mcp
```

## Se quiser publicar sob escopo Bravy

Troque `"name": "holding-mcp"` por `"name": "@bravy/holding-mcp"` no `package.json`.
O `publishConfig.access: "public"` já está setado (necessário para pacotes com escopo).
Nesse caso o cliente usa `npx -y @bravy/holding-mcp`.
