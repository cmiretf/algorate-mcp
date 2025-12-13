import { z } from 'zod';
export declare const AlgorithmSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodDate;
}, z.core.$strip>;
export type Algorithm = z.infer<typeof AlgorithmSchema>;
export declare const ImplementationSchema: z.ZodObject<{
    id: z.ZodString;
    algorithmId: z.ZodString;
    name: z.ZodString;
    language: z.ZodString;
    code: z.ZodString;
    entryFunction: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodDate;
}, z.core.$strip>;
export type Implementation = z.infer<typeof ImplementationSchema>;
export declare const TestCaseSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    inputSize: z.ZodNumber;
    inputType: z.ZodEnum<{
        string: "string";
        number: "number";
        object: "object";
        array: "array";
        custom: "custom";
    }>;
    input: z.ZodUnknown;
    expectedOutput: z.ZodOptional<z.ZodUnknown>;
    description: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type TestCase = z.infer<typeof TestCaseSchema>;
export declare const MetricsSchema: z.ZodObject<{
    executionTimeMs: z.ZodNumber;
    cpuTimeMs: z.ZodNumber;
    memoryPeakBytes: z.ZodNumber;
    memoryDeltaBytes: z.ZodNumber;
}, z.core.$strip>;
export type Metrics = z.infer<typeof MetricsSchema>;
export declare const BenchmarkResultSchema: z.ZodObject<{
    id: z.ZodString;
    implementationId: z.ZodString;
    testCaseId: z.ZodString;
    runNumber: z.ZodNumber;
    metrics: z.ZodObject<{
        executionTimeMs: z.ZodNumber;
        cpuTimeMs: z.ZodNumber;
        memoryPeakBytes: z.ZodNumber;
        memoryDeltaBytes: z.ZodNumber;
    }, z.core.$strip>;
    output: z.ZodUnknown;
    success: z.ZodBoolean;
    error: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodDate;
}, z.core.$strip>;
export type BenchmarkResult = z.infer<typeof BenchmarkResultSchema>;
export declare const StatisticsSchema: z.ZodObject<{
    mean: z.ZodNumber;
    median: z.ZodNumber;
    min: z.ZodNumber;
    max: z.ZodNumber;
    stdDev: z.ZodNumber;
    variance: z.ZodNumber;
    p95: z.ZodNumber;
    p99: z.ZodNumber;
}, z.core.$strip>;
export type Statistics = z.infer<typeof StatisticsSchema>;
export declare const AggregatedResultSchema: z.ZodObject<{
    implementationId: z.ZodString;
    testCaseId: z.ZodString;
    totalRuns: z.ZodNumber;
    successfulRuns: z.ZodNumber;
    executionTime: z.ZodObject<{
        mean: z.ZodNumber;
        median: z.ZodNumber;
        min: z.ZodNumber;
        max: z.ZodNumber;
        stdDev: z.ZodNumber;
        variance: z.ZodNumber;
        p95: z.ZodNumber;
        p99: z.ZodNumber;
    }, z.core.$strip>;
    cpuTime: z.ZodObject<{
        mean: z.ZodNumber;
        median: z.ZodNumber;
        min: z.ZodNumber;
        max: z.ZodNumber;
        stdDev: z.ZodNumber;
        variance: z.ZodNumber;
        p95: z.ZodNumber;
        p99: z.ZodNumber;
    }, z.core.$strip>;
    memoryPeak: z.ZodObject<{
        mean: z.ZodNumber;
        median: z.ZodNumber;
        min: z.ZodNumber;
        max: z.ZodNumber;
        stdDev: z.ZodNumber;
        variance: z.ZodNumber;
        p95: z.ZodNumber;
        p99: z.ZodNumber;
    }, z.core.$strip>;
}, z.core.$strip>;
export type AggregatedResult = z.infer<typeof AggregatedResultSchema>;
export declare const ComparisonResultSchema: z.ZodObject<{
    algorithmId: z.ZodString;
    testCaseId: z.ZodString;
    implementations: z.ZodArray<z.ZodObject<{
        implementationId: z.ZodString;
        testCaseId: z.ZodString;
        totalRuns: z.ZodNumber;
        successfulRuns: z.ZodNumber;
        executionTime: z.ZodObject<{
            mean: z.ZodNumber;
            median: z.ZodNumber;
            min: z.ZodNumber;
            max: z.ZodNumber;
            stdDev: z.ZodNumber;
            variance: z.ZodNumber;
            p95: z.ZodNumber;
            p99: z.ZodNumber;
        }, z.core.$strip>;
        cpuTime: z.ZodObject<{
            mean: z.ZodNumber;
            median: z.ZodNumber;
            min: z.ZodNumber;
            max: z.ZodNumber;
            stdDev: z.ZodNumber;
            variance: z.ZodNumber;
            p95: z.ZodNumber;
            p99: z.ZodNumber;
        }, z.core.$strip>;
        memoryPeak: z.ZodObject<{
            mean: z.ZodNumber;
            median: z.ZodNumber;
            min: z.ZodNumber;
            max: z.ZodNumber;
            stdDev: z.ZodNumber;
            variance: z.ZodNumber;
            p95: z.ZodNumber;
            p99: z.ZodNumber;
        }, z.core.$strip>;
    }, z.core.$strip>>;
    ranking: z.ZodArray<z.ZodObject<{
        implementationId: z.ZodString;
        rank: z.ZodNumber;
        score: z.ZodNumber;
    }, z.core.$strip>>;
    insights: z.ZodArray<z.ZodString>;
    generatedAt: z.ZodDate;
}, z.core.$strip>;
export type ComparisonResult = z.infer<typeof ComparisonResultSchema>;
export declare const BenchmarkConfigSchema: z.ZodObject<{
    warmupRuns: z.ZodDefault<z.ZodNumber>;
    measurementRuns: z.ZodDefault<z.ZodNumber>;
    timeoutMs: z.ZodDefault<z.ZodNumber>;
    validateOutput: z.ZodDefault<z.ZodBoolean>;
    collectMemoryMetrics: z.ZodDefault<z.ZodBoolean>;
    isolateExecutions: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
export type BenchmarkConfig = z.infer<typeof BenchmarkConfigSchema>;
//# sourceMappingURL=index.d.ts.map