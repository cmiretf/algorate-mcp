# Guía de Pruebas - Algorate MCP

## Flujo Recomendado para Probar el Benchmark

### 🎯 Objetivo

Validar que el sistema de benchmarking funciona correctamente y produce resultados precisos.

### 📋 Pasos del Flujo

#### 1. **Preparación**

```bash
cd algorate-mcp
npm install
npm run build
```

#### 2. **Prueba Rápida (Validación Básica)**

```bash
npm run example:simple
```

Esta prueba valida:

- ✓ Registro de algoritmos
- ✓ Registro de implementaciones
- ✓ Registro de casos de prueba
- ✓ Ejecución de benchmark
- ✓ Validación de resultados
- ✓ Recolección de métricas

#### 3. **Prueba Completa (Comparación de Implementaciones)**

```bash
npm run example:sorting
```

Esta prueba demuestra:

- ✓ Comparación de múltiples implementaciones
- ✓ Análisis estadístico completo
- ✓ Ranking automático
- ✓ Generación de insights
- ✓ Métricas de rendimiento y memoria

#### 4. **Pruebas Unitarias**

```bash
npm test
```

### 🔍 Qué Observar en los Resultados

#### Métricas Clave:

1. **Execution Time**: Tiempo promedio de ejecución
2. **Memory Peak**: Pico de uso de memoria
3. **Success Rate**: Tasa de éxito de las ejecuciones
4. **Consistency**: Desviación estándar (menor = más consistente)

#### Insights Automáticos:

- Comparación de velocidad entre implementaciones
- Análisis de uso de memoria
- Detección de variabilidad en resultados

### 💡 Mejores Prácticas

1. **Warmup Runs**: Usar al menos 2-3 ejecuciones de calentamiento
2. **Measurement Runs**: 5-10 ejecuciones para resultados confiables
3. **Timeout**: Ajustar según la complejidad del algoritmo
4. **Validation**: Siempre validar salidas en fase de prueba
5. **Isolation**: Usar `isolateExecutions: true` para mayor precisión

### 🎨 Personalización de Pruebas

Para crear tus propias pruebas:

```javascript
import { Orchestrator } from "./src/core/orchestrator.js";

const orchestrator = new Orchestrator();

// 1. Registrar algoritmo
const algo = orchestrator.registerAlgorithm("MyAlgorithm");

// 2. Registrar implementación(es)
const impl = orchestrator.registerImplementation(
  algo.id,
  "Implementation Name",
  "javascript",
  "function myFunc(input) { /* código */ }",
  "myFunc"
);

// 3. Registrar caso de prueba
const test = orchestrator.registerTestCase(
  "Test Name",
  inputSize,
  "array",
  inputData,
  expectedOutput
);

// 4. Ejecutar benchmark
const result = await orchestrator.runBenchmark(algo.id, test.id, {
  warmupRuns: 3,
  measurementRuns: 10,
  validateOutput: true,
});
```

### 🐛 Troubleshooting

**Problema**: Timeouts frecuentes

- **Solución**: Aumentar `timeoutMs` o reducir tamaño de entrada

**Problema**: Alta variabilidad en resultados

- **Solución**: Aumentar `warmupRuns` y `measurementRuns`

**Problema**: Fallos de validación

- **Solución**: Verificar que `expectedOutput` sea correcto

### 📊 Interpretación de Resultados

- **Score bajo** = Mejor rendimiento general
- **Mean < Median** = Algunos outliers lentos
- **StdDev alta** = Resultados inconsistentes
- **P95/P99** = Latencia en el peor caso
