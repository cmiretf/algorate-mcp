import { z } from 'zod';
export const AlgorithmSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1),
    description: z.string().optional(),
    category: z.string().optional(),
    createdAt: z.date(),
});
export const ImplementationSchema = z.object({
    id: z.string().uuid(),
    algorithmId: z.string().uuid(),
    name: z.string().min(1),
    language: z.string().min(1),
    code: z.string(),
    entryFunction: z.string(),
    description: z.string().optional(),
    createdAt: z.date(),
});
export const TestCaseSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1),
    inputSize: z.number().positive(),
    inputType: z.enum(['array', 'string', 'number', 'object', 'custom']),
    input: z.unknown(),
    expectedOutput: z.unknown().optional(),
    description: z.string().optional(),
});
export const MetricsSchema = z.object({
    executionTimeMs: z.number(),
    cpuTimeMs: z.number(),
    memoryPeakBytes: z.number(),
    memoryDeltaBytes: z.number(),
});
export const BenchmarkResultSchema = z.object({
    id: z.string().uuid(),
    implementationId: z.string().uuid(),
    testCaseId: z.string().uuid(),
    runNumber: z.number().int().positive(),
    metrics: MetricsSchema,
    output: z.unknown(),
    success: z.boolean(),
    error: z.string().optional(),
    timestamp: z.date(),
});
export const StatisticsSchema = z.object({
    mean: z.number(),
    median: z.number(),
    min: z.number(),
    max: z.number(),
    stdDev: z.number(),
    variance: z.number(),
    p95: z.number(),
    p99: z.number(),
});
export const AggregatedResultSchema = z.object({
    implementationId: z.string().uuid(),
    testCaseId: z.string().uuid(),
    totalRuns: z.number().int().positive(),
    successfulRuns: z.number().int().nonnegative(),
    executionTime: StatisticsSchema,
    cpuTime: StatisticsSchema,
    memoryPeak: StatisticsSchema,
});
export const ComparisonResultSchema = z.object({
    algorithmId: z.string().uuid(),
    testCaseId: z.string().uuid(),
    implementations: z.array(AggregatedResultSchema),
    ranking: z.array(z.object({
        implementationId: z.string().uuid(),
        rank: z.number().int().positive(),
        score: z.number(),
    })),
    insights: z.array(z.string()),
    generatedAt: z.date(),
});
export const BenchmarkConfigSchema = z.object({
    warmupRuns: z.number().int().nonnegative().default(3),
    measurementRuns: z.number().int().positive().default(10),
    timeoutMs: z.number().positive().default(30000),
    validateOutput: z.boolean().default(true),
    collectMemoryMetrics: z.boolean().default(true),
    isolateExecutions: z.boolean().default(true),
});
//# sourceMappingURL=index.js.map