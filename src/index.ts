import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { Orchestrator } from "./core/orchestrator.js";
import { BenchmarkConfigSchema, type ComparisonResult } from "./types/index.js";
import { AlgorithmDetector } from "./auto-detection/algorithm-detector.js";
import { WorkloadGenerator } from "./auto-detection/workload-generator.js";
import { ChartGenerator } from "./visualization/chart-generator.js";
import { ResultStorage } from "./storage/result-storage.js";
import { QueryEngine } from "./query/query-engine.js";
import { CodeOptimizer } from "./analysis/code-optimizer.js";

const orchestrator = new Orchestrator();
const queryEngine = new QueryEngine(orchestrator);
const detector = new AlgorithmDetector();
const workloadGenerator = new WorkloadGenerator();
const chartGenerator = new ChartGenerator();
const storage = new ResultStorage();
const codeOptimizer = new CodeOptimizer();

const server = new Server(
  {
    name: "algorate",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Helper function to format results similar to console output
function formatBenchmarkOutput(
  results: ComparisonResult[],
  algorithmNames: Map<string, string>,
  implementationNames: Map<string, string>,
  testCaseNames: Map<string, string>,
  implementationCodes?: Map<string, string>
): string {
  let output = "🧪 Algorithm Benchmark\n\n";

  // Group results by algorithm
  const byAlgorithm = new Map<string, ComparisonResult[]>();
  for (const result of results) {
    if (!byAlgorithm.has(result.algorithmId)) {
      byAlgorithm.set(result.algorithmId, []);
    }
    byAlgorithm.get(result.algorithmId)!.push(result);
  }

  for (const [algorithmId, algorithmResults] of byAlgorithm.entries()) {
    const algorithmName =
      algorithmNames.get(algorithmId) || `Algorithm ${algorithmId.slice(0, 8)}`;

    output += `✓ Algorithm registered: ${algorithmName}\n`;

    // Show implementations
    const implIds = new Set<string>();
    for (const result of algorithmResults) {
      for (const impl of result.implementations) {
        implIds.add(impl.implementationId);
      }
    }
    for (const implId of implIds) {
      const implName =
        implementationNames.get(implId) ||
        `Implementation ${implId.slice(0, 8)}`;
      output += `✓ ${implName} registered\n`;

      // Show full code if available
      if (implementationCodes && implementationCodes.has(implId)) {
        const code = implementationCodes.get(implId)!;
        output += `   📝 Code:\n${code
          .split("\n")
          .map((line) => `   ${line}`)
          .join("\n")}\n`;
      }
    }

    // Show test cases
    const testCaseIds = new Set<string>();
    for (const result of algorithmResults) {
      testCaseIds.add(result.testCaseId);
    }
    const testCaseNamesList = Array.from(testCaseIds)
      .map((id) => testCaseNames.get(id) || `Test Case ${id.slice(0, 8)}`)
      .join(", ");
    output += `✓ Test cases registered: ${testCaseNamesList}\n\n`;

    // Show results for each test case
    for (const result of algorithmResults) {
      const testCaseName =
        testCaseNames.get(result.testCaseId) ||
        `Test Case ${result.testCaseId.slice(0, 8)}`;
      output += "=".repeat(60) + "\n\n";
      output += `📊 Running benchmark: ${testCaseName}\n\n`;
      output += "Results:\n\n";

      // Display results for each implementation
      result.implementations.forEach((impl, idx) => {
        const implName =
          implementationNames.get(impl.implementationId) ||
          `Implementation ${impl.implementationId.slice(0, 8)}`;
        output += `${idx + 1}. ${implName}\n`;
        output += `   ✓ Success rate: ${impl.successfulRuns}/${impl.totalRuns}\n`;
        output += `   ⏱️  Avg time: ${impl.executionTime.mean.toFixed(4)} ms\n`;
        output += `   📈 Std dev: ${impl.executionTime.stdDev.toFixed(4)} ms\n`;
        if (impl.memoryPeak) {
          output += `   💾 Memory: ${(impl.memoryPeak.mean / 1024).toFixed(
            2
          )} KB\n`;
        }
        output += "\n";
      });

      // Display ranking
      output += "🏆 Ranking:\n";
      result.ranking.forEach((r) => {
        const implName =
          implementationNames.get(r.implementationId) ||
          `Implementation ${r.implementationId.slice(0, 8)}`;
        output += `   ${r.rank}. ${implName} (score: ${r.score.toFixed(4)})\n`;
      });

      output += "\n💡 Insights:\n";
      result.insights.forEach((insight) => {
        output += `   • ${insight}\n`;
      });

      output += "\n" + "=".repeat(60) + "\n\n";
    }
  }

  output += "✅ Benchmark completed!\n";
  return output;
}

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "register_algorithm",
        description: "Register a new algorithm to benchmark",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", description: "Algorithm name" },
            description: {
              type: "string",
              description: "Algorithm description",
            },
            category: { type: "string", description: "Algorithm category" },
          },
          required: ["name"],
        },
      },
      {
        name: "register_implementation",
        description: "Register an implementation of an algorithm",
        inputSchema: {
          type: "object",
          properties: {
            algorithmId: { type: "string", description: "Algorithm ID" },
            name: { type: "string", description: "Implementation name" },
            language: { type: "string", description: "Programming language" },
            code: { type: "string", description: "Implementation code" },
            entryFunction: {
              type: "string",
              description: "Entry function name",
            },
            description: {
              type: "string",
              description: "Implementation description",
            },
          },
          required: [
            "algorithmId",
            "name",
            "language",
            "code",
            "entryFunction",
          ],
        },
      },
      {
        name: "register_test_case",
        description: "Register a test case for benchmarking",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", description: "Test case name" },
            inputSize: { type: "number", description: "Input size" },
            inputType: {
              type: "string",
              enum: ["array", "string", "number", "object", "custom"],
              description: "Input type",
            },
            input: { description: "Test input data" },
            expectedOutput: { description: "Expected output for validation" },
            description: {
              type: "string",
              description: "Test case description",
            },
          },
          required: ["name", "inputSize", "inputType", "input"],
        },
      },
      {
        name: "run_benchmark",
        description:
          "Run benchmark comparing all implementations of an algorithm",
        inputSchema: {
          type: "object",
          properties: {
            algorithmId: { type: "string", description: "Algorithm ID" },
            testCaseId: { type: "string", description: "Test case ID" },
            warmupRuns: {
              type: "number",
              description: "Number of warmup runs",
              default: 3,
            },
            measurementRuns: {
              type: "number",
              description: "Number of measurement runs",
              default: 10,
            },
            timeoutMs: {
              type: "number",
              description: "Timeout per execution in ms",
              default: 30000,
            },
            validateOutput: {
              type: "boolean",
              description: "Validate output against expected",
              default: true,
            },
          },
          required: ["algorithmId", "testCaseId"],
        },
      },
      {
        name: "list_algorithms",
        description: "List all registered algorithms",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "list_implementations",
        description: "List implementations, optionally filtered by algorithm",
        inputSchema: {
          type: "object",
          properties: {
            algorithmId: {
              type: "string",
              description: "Filter by algorithm ID",
            },
          },
        },
      },
      {
        name: "list_test_cases",
        description: "List all registered test cases",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get_results",
        description:
          "Get benchmark results for a specific implementation and test case",
        inputSchema: {
          type: "object",
          properties: {
            implementationId: {
              type: "string",
              description: "Implementation ID",
            },
            testCaseId: { type: "string", description: "Test case ID" },
          },
          required: ["implementationId", "testCaseId"],
        },
      },
      {
        name: "auto_detect_algorithms",
        description: "Automatically detect algorithms in project files",
        inputSchema: {
          type: "object",
          properties: {
            directories: {
              type: "array",
              items: { type: "string" },
              description: "Directories to scan (default: src, examples)",
            },
          },
        },
      },
      {
        name: "auto_benchmark",
        description:
          "Automatically run benchmarks for detected or registered algorithms",
        inputSchema: {
          type: "object",
          properties: {
            algorithmIds: {
              type: "array",
              items: { type: "string" },
              description: "Algorithm IDs to benchmark (empty = all)",
            },
            forceRefresh: {
              type: "boolean",
              description: "Force refresh even if cached results exist",
            },
          },
        },
      },
      {
        name: "generate_chart",
        description: "Generate performance chart for benchmark results",
        inputSchema: {
          type: "object",
          properties: {
            algorithmId: { type: "string", description: "Algorithm ID" },
            testCaseId: {
              type: "string",
              description: "Test case ID (optional)",
            },
          },
          required: ["algorithmId"],
        },
      },
      {
        name: "query_performance",
        description:
          "Query performance analysis with automatic benchmark and summary",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description:
                'Query about algorithm performance (e.g., "sorting algorithms", "all algorithms")',
            },
            forceRefresh: {
              type: "boolean",
              description: "Force refresh even if cached results exist",
            },
            directories: {
              type: "array",
              items: { type: "string" },
              description: "Directories to scan for algorithms",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "benchmark_all",
        description:
          "Automatically detect all algorithms, run benchmarks, and return formatted results (ONE-CLICK BENCHMARK)",
        inputSchema: {
          type: "object",
          properties: {
            directories: {
              type: "array",
              items: { type: "string" },
              description: "Directories to scan (default: src, examples)",
            },
            filePath: {
              type: "string",
              description:
                "Specific file path to analyze (optional - if provided, only analyzes this file)",
            },
            forceRefresh: {
              type: "boolean",
              description: "Force refresh even if cached results exist",
            },
          },
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "register_algorithm": {
        const schema = z.object({
          name: z.string(),
          description: z.string().optional(),
          category: z.string().optional(),
        });
        const parsed = schema.parse(args);
        const result = orchestrator.registerAlgorithm(
          parsed.name,
          parsed.description,
          parsed.category
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "register_implementation": {
        const schema = z.object({
          algorithmId: z.string(),
          name: z.string(),
          language: z.string(),
          code: z.string(),
          entryFunction: z.string(),
          description: z.string().optional(),
        });
        const parsed = schema.parse(args);
        const result = orchestrator.registerImplementation(
          parsed.algorithmId,
          parsed.name,
          parsed.language,
          parsed.code,
          parsed.entryFunction,
          parsed.description
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "register_test_case": {
        const schema = z.object({
          name: z.string(),
          inputSize: z.number(),
          inputType: z.enum(["array", "string", "number", "object", "custom"]),
          input: z.unknown(),
          expectedOutput: z.unknown().optional(),
          description: z.string().optional(),
        });
        const parsed = schema.parse(args);
        const result = orchestrator.registerTestCase(
          parsed.name,
          parsed.inputSize,
          parsed.inputType,
          parsed.input,
          parsed.expectedOutput,
          parsed.description
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "run_benchmark": {
        const schema = z.object({
          algorithmId: z.string(),
          testCaseId: z.string(),
          warmupRuns: z.number().optional().default(3),
          measurementRuns: z.number().optional().default(10),
          timeoutMs: z.number().optional().default(30000),
          validateOutput: z.boolean().optional().default(true),
        });
        const parsed = schema.parse(args);
        const config = BenchmarkConfigSchema.parse({
          warmupRuns: parsed.warmupRuns,
          measurementRuns: parsed.measurementRuns,
          timeoutMs: parsed.timeoutMs,
          validateOutput: parsed.validateOutput,
        });
        const result = await orchestrator.runBenchmark(
          parsed.algorithmId,
          parsed.testCaseId,
          config
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "list_algorithms": {
        const result = orchestrator.listAlgorithms();
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "list_implementations": {
        const schema = z.object({
          algorithmId: z.string().optional(),
        });
        const parsed = schema.parse(args);
        const result = orchestrator.listImplementations(parsed.algorithmId);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "list_test_cases": {
        const result = orchestrator.listTestCases();
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "get_results": {
        const schema = z.object({
          implementationId: z.string(),
          testCaseId: z.string(),
        });
        const parsed = schema.parse(args);
        const result = orchestrator.getResults(
          parsed.implementationId,
          parsed.testCaseId
        );
        return {
          content: [
            { type: "text", text: JSON.stringify(result ?? [], null, 2) },
          ],
        };
      }

      case "auto_detect_algorithms": {
        const schema = z.object({
          directories: z.array(z.string()).optional(),
        });
        const parsed = schema.parse(args);
        const detected = await detector.detectAlgorithms({
          directories: parsed.directories,
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  count: detected.length,
                  algorithms: detected.map((a) => ({
                    name: a.name,
                    language: a.language,
                    filePath: a.filePath,
                    lineNumber: a.lineNumber,
                    category: a.category,
                    description: a.description,
                  })),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "auto_benchmark": {
        const schema = z.object({
          algorithmIds: z.array(z.string()).optional(),
          forceRefresh: z.boolean().optional().default(false),
        });
        const parsed = schema.parse(args);

        const algorithms =
          parsed.algorithmIds && parsed.algorithmIds.length > 0
            ? parsed.algorithmIds
                .map((id) => orchestrator.getAlgorithm(id))
                .filter(Boolean)
            : orchestrator.listAlgorithms();

        if (algorithms.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  { error: "No algorithms found to benchmark" },
                  null,
                  2
                ),
              },
            ],
            isError: true,
          };
        }

        const results = [];
        for (const algorithm of algorithms) {
          if (!algorithm) continue;

          const category = algorithm.category || "general";
          const workloads = workloadGenerator.generateWorkloadsForCategory(
            category,
            algorithm.name
          );

          for (const workload of workloads) {
            const testCase = orchestrator.registerTestCase(
              workload.name,
              workload.inputSize,
              workload.inputType,
              workload.input,
              workload.expectedOutput,
              workload.description
            );

            const config = BenchmarkConfigSchema.parse({
              warmupRuns: 2,
              measurementRuns: 5,
              timeoutMs: 30000,
              validateOutput: true,
              collectMemoryMetrics: true,
              isolateExecutions: true,
            });

            const result = await orchestrator.runBenchmark(
              algorithm.id,
              testCase.id,
              config
            );
            results.push(result);

            const individualResults =
              orchestrator.getResults(
                result.implementations[0]?.implementationId || "",
                testCase.id
              ) || [];

            await storage.saveResults(
              algorithm.id,
              testCase.id,
              result,
              individualResults
            );
          }
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  algorithmsBenchmarked: algorithms.length,
                  benchmarksExecuted: results.length,
                  results: results.map((r) => ({
                    algorithmId: r.algorithmId,
                    testCaseId: r.testCaseId,
                    implementations: r.implementations.length,
                    ranking: r.ranking,
                  })),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "generate_chart": {
        const schema = z.object({
          algorithmId: z.string(),
          testCaseId: z.string().optional(),
        });
        const parsed = schema.parse(args);

        const stored = await storage.loadResults(
          parsed.algorithmId,
          parsed.testCaseId
        );

        if (!stored) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  { error: "No results found for this algorithm" },
                  null,
                  2
                ),
              },
            ],
            isError: true,
          };
        }

        let comparisonResults: ComparisonResult[] = [];

        if (stored instanceof Map) {
          // Multiple test cases
          for (const storedResult of stored.values()) {
            if (
              storedResult &&
              typeof storedResult === "object" &&
              "comparisonResult" in storedResult
            ) {
              comparisonResults.push(storedResult.comparisonResult);
            }
          }
        } else if (typeof stored === "object" && "comparisonResult" in stored) {
          // Single test case
          comparisonResults = [stored.comparisonResult];
        }

        if (comparisonResults.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  { error: "Invalid stored results" },
                  null,
                  2
                ),
              },
            ],
            isError: true,
          };
        }

        const testCaseId = parsed.testCaseId || "combined";
        const chartPath = `benchmark-results/algorithms/${parsed.algorithmId}/charts/${testCaseId}.html`;

        const generatedPath = await chartGenerator.generateChart(
          comparisonResults,
          chartPath,
          {
            title: `Benchmark Results - ${parsed.algorithmId.slice(0, 8)}`,
            showMemory: true,
            showErrorBars: true,
          }
        );

        // Read the generated HTML and save it
        const { readFile } = await import("fs/promises");
        const chartHtml = await readFile(generatedPath, "utf-8");
        await storage.saveChart(parsed.algorithmId, testCaseId, chartHtml);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  chartPath: generatedPath,
                  algorithmId: parsed.algorithmId,
                  testCaseId: testCaseId,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "query_performance": {
        const schema = z.object({
          query: z.string(),
          forceRefresh: z.boolean().optional().default(false),
          directories: z.array(z.string()).optional(),
        });
        const parsed = schema.parse(args);

        const response = await queryEngine.queryPerformance(parsed.query, {
          forceRefresh: parsed.forceRefresh,
          directories: parsed.directories,
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  summary: response.summary,
                  chartPath: response.chartPath,
                  metrics: response.metrics,
                  alerts: response.alerts,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "benchmark_all": {
        const schema = z.object({
          directories: z.array(z.string()).optional(),
          filePath: z.string().optional(),
          forceRefresh: z.boolean().optional().default(false),
        });
        const parsed = schema.parse(args);

        await storage.initialize();

        // Step 1: Detect algorithms (from specific file or directories)
        const detected = await detector.detectAlgorithms({
          directories: parsed.directories,
          filePath: parsed.filePath,
        });

        // Step 2: Register detected algorithms
        const algorithmNames = new Map<string, string>();
        const implementationNames = new Map<string, string>();
        const implementationCodes = new Map<string, string>();

        for (const algo of detected) {
          const algorithm = orchestrator.registerAlgorithm(
            algo.name,
            algo.description,
            algo.category
          );
          algorithmNames.set(algorithm.id, algorithm.name);

          const implementation = orchestrator.registerImplementation(
            algorithm.id,
            algo.name,
            algo.language,
            algo.code,
            algo.entryFunction,
            algo.description
          );
          implementationNames.set(implementation.id, implementation.name);
          implementationCodes.set(implementation.id, algo.code);
        }

        // Step 3: Get algorithms (only newly detected if filePath specified, otherwise all)
        let allAlgorithms: Array<{
          id: string;
          name: string;
          category?: string;
        }>;
        if (parsed.filePath) {
          // If specific file, only use newly detected algorithms
          allAlgorithms = detected
            .map((algo) => {
              const algoObj = orchestrator
                .listAlgorithms()
                .find((a) => algorithmNames.get(a.id) === algo.name);
              return algoObj!;
            })
            .filter(Boolean);
        } else {
          // Otherwise, get all algorithms
          allAlgorithms = orchestrator.listAlgorithms();
          for (const algo of allAlgorithms) {
            algorithmNames.set(algo.id, algo.name);
          }
        }

        // Get implementations for the algorithms we're analyzing
        for (const algo of allAlgorithms) {
          const impls = orchestrator.listImplementations(algo.id);
          for (const impl of impls) {
            implementationNames.set(impl.id, impl.name);
            // Get code from stored implementation if not already in map
            if (!implementationCodes.has(impl.id)) {
              // Try to get code from orchestrator (we'd need to add a method for this)
              // For now, we'll rely on the codes we already stored
            }
          }
        }

        // Step 3.5: Generate optimized versions for single-implementation algorithms
        for (const algorithm of allAlgorithms) {
          const implementations = orchestrator.listImplementations(
            algorithm.id
          );

          // If only one implementation, generate optimized versions
          if (implementations.length === 1) {
            const impl = implementations[0];
            const analysis = codeOptimizer.analyzeCode(
              impl.code,
              impl.entryFunction
            );

            // Register optimized versions only if code is valid and executable
            for (const optimized of analysis.optimizedVersions) {
              // Skip if code contains placeholders or is incomplete
              if (
                optimized.code.includes("/*") ||
                optimized.code.includes("// ...") ||
                optimized.code.includes("/* original") ||
                optimized.code.includes("/* optimized")
              ) {
                continue;
              }

              try {
                // Basic validation: check if function can be parsed
                const hasFunction =
                  /function\s+\w+\s*\(/.test(optimized.code) ||
                  /(?:const|let|var)\s+\w+\s*=\s*(?:\([^)]*\)|[^=]+)\s*=>/.test(
                    optimized.code
                  );

                if (!hasFunction) {
                  continue;
                }

                const optimizedImpl = orchestrator.registerImplementation(
                  algorithm.id,
                  optimized.name,
                  impl.language,
                  optimized.code,
                  impl.entryFunction,
                  optimized.description
                );
                implementationNames.set(optimizedImpl.id, optimizedImpl.name);
                implementationCodes.set(optimizedImpl.id, optimized.code);
              } catch (e) {
                // Skip if optimization code is invalid
                console.error(
                  `Failed to register optimized version ${optimized.name}: ${e}`
                );
              }
            }
          }
        }

        // Step 4: Run benchmarks for all algorithms
        const results: ComparisonResult[] = [];
        const testCaseNames = new Map<string, string>();

        for (const algorithm of allAlgorithms) {
          // Check cache if not forcing refresh
          if (!parsed.forceRefresh) {
            const cached = await storage.loadResults(algorithm.id);
            if (cached instanceof Map) {
              for (const [testCaseId, storedResult] of cached.entries()) {
                if (
                  storedResult &&
                  typeof storedResult === "object" &&
                  "comparisonResult" in storedResult
                ) {
                  results.push(storedResult.comparisonResult);
                  const testCase = orchestrator.getTestCase(testCaseId);
                  if (testCase) {
                    testCaseNames.set(testCaseId, testCase.name);
                  }
                }
              }
              continue;
            }
          }

          const category = algorithm.category || "general";
          const workloads = workloadGenerator.generateWorkloadsForCategory(
            category,
            algorithm.name
          );

          for (const workload of workloads) {
            const testCase = orchestrator.registerTestCase(
              workload.name,
              workload.inputSize,
              workload.inputType,
              workload.input,
              workload.expectedOutput,
              workload.description
            );
            testCaseNames.set(testCase.id, testCase.name);

            const config = BenchmarkConfigSchema.parse({
              warmupRuns: 2,
              measurementRuns: 5,
              timeoutMs: 30000,
              validateOutput: true,
              collectMemoryMetrics: true,
              isolateExecutions: true,
            });

            const result = await orchestrator.runBenchmark(
              algorithm.id,
              testCase.id,
              config
            );
            results.push(result);

            const individualResults =
              orchestrator.getResults(
                result.implementations[0]?.implementationId || "",
                testCase.id
              ) || [];

            await storage.saveResults(
              algorithm.id,
              testCase.id,
              result,
              individualResults
            );
          }
        }

        // Step 5: Format and return results
        const formattedOutput = formatBenchmarkOutput(
          results,
          algorithmNames,
          implementationNames,
          testCaseNames,
          implementationCodes
        );

        return {
          content: [
            {
              type: "text",
              text: formattedOutput,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: "text", text: `Error: ${message}` }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Algorate MCP Server running on stdio");
}

main().catch(console.error);
