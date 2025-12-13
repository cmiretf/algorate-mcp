import type { Algorithm, Implementation, TestCase, BenchmarkConfig, BenchmarkResult, ComparisonResult } from '../types/index.js';
export declare class Orchestrator {
    private algorithms;
    private implementations;
    private testCases;
    private results;
    private runner;
    private metricsCollector;
    private analyzer;
    constructor();
    registerAlgorithm(name: string, description?: string, category?: string): Algorithm;
    registerImplementation(algorithmId: string, name: string, language: string, code: string, entryFunction: string, description?: string): Implementation;
    registerTestCase(name: string, inputSize: number, inputType: TestCase['inputType'], input: unknown, expectedOutput?: unknown, description?: string): TestCase;
    runBenchmark(algorithmId: string, testCaseId: string, config: BenchmarkConfig): Promise<ComparisonResult>;
    private benchmarkImplementation;
    getAlgorithm(id: string): Algorithm | undefined;
    getImplementation(id: string): Implementation | undefined;
    getTestCase(id: string): TestCase | undefined;
    listAlgorithms(): Algorithm[];
    listImplementations(algorithmId?: string): Implementation[];
    listTestCases(): TestCase[];
    getResults(implementationId: string, testCaseId: string): BenchmarkResult[] | undefined;
}
//# sourceMappingURL=orchestrator.d.ts.map