# Algorate MCP — AGENTS.md

> Instrucciones portables, vendor-neutral, para cualquier agente de IA que opere sobre este repositorio.

## 1. Qué es este repo

`@cmiretf/algorate-mcp` — Model Context Protocol server para benchmarking empírico de algoritmos, análisis de rendimiento y sugerencias de optimización. Compara implementaciones, detecta cuellos de botella y da insights cross-lenguaje (JavaScript, TypeScript, Python).

Publicado en npm: `@cmiretf/algorate-mcp`. Repo público: `cmiretf/algorate-mcp`.

## 2. Setup

```bash
npm install
npm run build
```

## 3. Comandos canónicos

| Acción | Comando |
| --- | --- |
| Build | `npm run build` |
| Tests | `npm test` |
| Dev (build + run) | `npm run dev` |
| Inspector interactivo | `npm run inspector` |
| Ejemplo sorting | `npm run example:sorting` |

Tests usan `node --test` sobre `src/tests/*.test.ts`. NO usar otros runners (jest, vitest) sin actualizar este archivo.

## 4. Estructura

```
src/
├── analysis/        # Análisis de complejidad y patrones
├── auto-detection/  # Detección automática de implementación
├── core/            # Núcleo MCP server
├── execution/       # Ejecución de benchmarks
├── metrics/         # Métricas (tiempo, memoria, throughput)
├── query/           # Queries sobre resultados
├── storage/         # Persistencia de resultados
├── tests/           # Tests (node --test)
├── types/           # Definiciones TypeScript
├── visualization/   # Plotly.js para visualizar
└── index.ts         # Entry point del MCP server
examples/            # Ejemplos ejecutables
```

## 5. Convenciones

- TypeScript estricto. ESM modules (`"type": "module"` en package.json).
- Build output: `dist/`.
- Tests `*.test.ts` co-localizados en `src/tests/`.
- Validación de schemas con `zod` (ya es dependencia).
- Visualización con `plotly.js`.
- Compatible con MCP SDK `^1.11.1`.

## 6. Añadir una tool MCP nueva

1. Definir el schema en `src/types/` con zod.
2. Implementar el handler en el módulo correspondiente (analysis/, execution/, query/...).
3. Registrarla en `src/core/` (donde se construye el server MCP).
4. Añadir test en `src/tests/`.
5. Actualizar `README.md` con el contrato público.

## 7. Distribución

Paquete publicado como `@cmiretf/algorate-mcp` en npm. Versiones siguen semver. Para release:

```bash
npm version <patch|minor|major>
npm publish --access public
```

El `prepare` hook ejecuta build automáticamente al instalar.

## 8. Notas para agentes

- Este repo es PÚBLICO — cuidar tono, no incluir info personal ni secretos.
- Para overrides específicos de Claude Code, Cursor, etc., usar `CLAUDE.md` / `.cursorrules` como capa delgada sobre este AGENTS.md.
- Si vas a integrar con Claude Desktop, ver la sección "With Claude Desktop" del README para `claude_desktop_config.json`.
