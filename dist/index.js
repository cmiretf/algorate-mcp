import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { Orchestrator } from './core/orchestrator.js';
import { BenchmarkConfigSchema } from './types/index.js';
const orchestrator = new Orchestrator();
const server = new Server({
    name: 'algorate',
    version: '1.0.0',
}, {
    capabilities: {
        tools: {},
    },
});
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: 'register_algorithm',
                description: 'Register a new algorithm to benchmark',
                inputSchema: {
                    type: 'object',
                    properties: {
                        name: { type: 'string', description: 'Algorithm name' },
                        description: { type: 'string', description: 'Algorithm description' },
                        category: { type: 'string', description: 'Algorithm category' },
                    },
                    required: ['name'],
                },
            },
            {
                name: 'register_implementation',
                description: 'Register an implementation of an algorithm',
                inputSchema: {
                    type: 'object',
                    properties: {
                        algorithmId: { type: 'string', description: 'Algorithm ID' },
                        name: { type: 'string', description: 'Implementation name' },
                        language: { type: 'string', description: 'Programming language' },
                        code: { type: 'string', description: 'Implementation code' },
                        entryFunction: { type: 'string', description: 'Entry function name' },
                        description: { type: 'string', description: 'Implementation description' },
                    },
                    required: ['algorithmId', 'name', 'language', 'code', 'entryFunction'],
                },
            },
            {
                name: 'register_test_case',
                description: 'Register a test case for benchmarking',
                inputSchema: {
                    type: 'object',
                    properties: {
                        name: { type: 'string', description: 'Test case name' },
                        inputSize: { type: 'number', description: 'Input size' },
                        inputType: {
                            type: 'string',
                            enum: ['array', 'string', 'number', 'object', 'custom'],
                            description: 'Input type',
                        },
                        input: { description: 'Test input data' },
                        expectedOutput: { description: 'Expected output for validation' },
                        description: { type: 'string', description: 'Test case description' },
                    },
                    required: ['name', 'inputSize', 'inputType', 'input'],
                },
            },
            {
                name: 'run_benchmark',
                description: 'Run benchmark comparing all implementations of an algorithm',
                inputSchema: {
                    type: 'object',
                    properties: {
                        algorithmId: { type: 'string', description: 'Algorithm ID' },
                        testCaseId: { type: 'string', description: 'Test case ID' },
                        warmupRuns: { type: 'number', description: 'Number of warmup runs', default: 3 },
                        measurementRuns: { type: 'number', description: 'Number of measurement runs', default: 10 },
                        timeoutMs: { type: 'number', description: 'Timeout per execution in ms', default: 30000 },
                        validateOutput: { type: 'boolean', description: 'Validate output against expected', default: true },
                    },
                    required: ['algorithmId', 'testCaseId'],
                },
            },
            {
                name: 'list_algorithms',
                description: 'List all registered algorithms',
                inputSchema: {
                    type: 'object',
                    properties: {},
                },
            },
            {
                name: 'list_implementations',
                description: 'List implementations, optionally filtered by algorithm',
                inputSchema: {
                    type: 'object',
                    properties: {
                        algorithmId: { type: 'string', description: 'Filter by algorithm ID' },
                    },
                },
            },
            {
                name: 'list_test_cases',
                description: 'List all registered test cases',
                inputSchema: {
                    type: 'object',
                    properties: {},
                },
            },
            {
                name: 'get_results',
                description: 'Get benchmark results for a specific implementation and test case',
                inputSchema: {
                    type: 'object',
                    properties: {
                        implementationId: { type: 'string', description: 'Implementation ID' },
                        testCaseId: { type: 'string', description: 'Test case ID' },
                    },
                    required: ['implementationId', 'testCaseId'],
                },
            },
        ],
    };
});
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
        switch (name) {
            case 'register_algorithm': {
                const schema = z.object({
                    name: z.string(),
                    description: z.string().optional(),
                    category: z.string().optional(),
                });
                const parsed = schema.parse(args);
                const result = orchestrator.registerAlgorithm(parsed.name, parsed.description, parsed.category);
                return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
            }
            case 'register_implementation': {
                const schema = z.object({
                    algorithmId: z.string(),
                    name: z.string(),
                    language: z.string(),
                    code: z.string(),
                    entryFunction: z.string(),
                    description: z.string().optional(),
                });
                const parsed = schema.parse(args);
                const result = orchestrator.registerImplementation(parsed.algorithmId, parsed.name, parsed.language, parsed.code, parsed.entryFunction, parsed.description);
                return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
            }
            case 'register_test_case': {
                const schema = z.object({
                    name: z.string(),
                    inputSize: z.number(),
                    inputType: z.enum(['array', 'string', 'number', 'object', 'custom']),
                    input: z.unknown(),
                    expectedOutput: z.unknown().optional(),
                    description: z.string().optional(),
                });
                const parsed = schema.parse(args);
                const result = orchestrator.registerTestCase(parsed.name, parsed.inputSize, parsed.inputType, parsed.input, parsed.expectedOutput, parsed.description);
                return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
            }
            case 'run_benchmark': {
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
                const result = await orchestrator.runBenchmark(parsed.algorithmId, parsed.testCaseId, config);
                return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
            }
            case 'list_algorithms': {
                const result = orchestrator.listAlgorithms();
                return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
            }
            case 'list_implementations': {
                const schema = z.object({
                    algorithmId: z.string().optional(),
                });
                const parsed = schema.parse(args);
                const result = orchestrator.listImplementations(parsed.algorithmId);
                return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
            }
            case 'list_test_cases': {
                const result = orchestrator.listTestCases();
                return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
            }
            case 'get_results': {
                const schema = z.object({
                    implementationId: z.string(),
                    testCaseId: z.string(),
                });
                const parsed = schema.parse(args);
                const result = orchestrator.getResults(parsed.implementationId, parsed.testCaseId);
                return { content: [{ type: 'text', text: JSON.stringify(result ?? [], null, 2) }] };
            }
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text', text: `Error: ${message}` }], isError: true };
    }
});
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Algorate MCP Server running on stdio');
}
main().catch(console.error);
//# sourceMappingURL=index.js.map