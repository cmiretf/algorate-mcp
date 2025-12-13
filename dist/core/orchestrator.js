import { randomUUID } from 'crypto';
import { BenchmarkRunner } from '../execution/runner.js';
import { MetricsCollector } from '../metrics/collector.js';
import { Analyzer } from '../analysis/analyzer.js';
export class Orchestrator {
    algorithms = new Map();
    implementations = new Map();
    testCases = new Map();
    results = new Map();
    runner;
    metricsCollector;
    analyzer;
    constructor() {
        this.runner = new BenchmarkRunner();
        this.metricsCollector = new MetricsCollector();
        this.analyzer = new Analyzer();
    }
    registerAlgorithm(name, description, category) {
        const algorithm = {
            id: randomUUID(),
            name,
            description,
            category,
            createdAt: new Date(),
        };
        this.algorithms.set(algorithm.id, algorithm);
        return algorithm;
    }
    registerImplementation(algorithmId, name, language, code, entryFunction, description) {
        if (!this.algorithms.has(algorithmId)) {
            throw new Error(`Algorithm with id ${algorithmId} not found`);
        }
        const implementation = {
            id: randomUUID(),
            algorithmId,
            name,
            language,
            code,
            entryFunction,
            description,
            createdAt: new Date(),
        };
        this.implementations.set(implementation.id, implementation);
        return implementation;
    }
    registerTestCase(name, inputSize, inputType, input, expectedOutput, description) {
        const testCase = {
            id: randomUUID(),
            name,
            inputSize,
            inputType,
            input,
            expectedOutput,
            description,
        };
        this.testCases.set(testCase.id, testCase);
        return testCase;
    }
    async runBenchmark(algorithmId, testCaseId, config) {
        const algorithm = this.algorithms.get(algorithmId);
        if (!algorithm) {
            throw new Error(`Algorithm with id ${algorithmId} not found`);
        }
        const testCase = this.testCases.get(testCaseId);
        if (!testCase) {
            throw new Error(`TestCase with id ${testCaseId} not found`);
        }
        const implementations = Array.from(this.implementations.values()).filter((impl) => impl.algorithmId === algorithmId);
        if (implementations.length === 0) {
            throw new Error(`No implementations found for algorithm ${algorithmId}`);
        }
        const allResults = [];
        const aggregatedResults = [];
        for (const impl of implementations) {
            const implResults = await this.benchmarkImplementation(impl, testCase, config);
            allResults.push(...implResults);
            const aggregated = this.analyzer.aggregateResults(impl.id, testCaseId, implResults);
            aggregatedResults.push(aggregated);
            const key = `${impl.id}-${testCaseId}`;
            this.results.set(key, implResults);
        }
        return this.analyzer.compareImplementations(algorithmId, testCaseId, aggregatedResults);
    }
    async benchmarkImplementation(implementation, testCase, config) {
        for (let i = 0; i < config.warmupRuns; i++) {
            await this.runner.execute(implementation, testCase, config);
        }
        const results = [];
        for (let i = 0; i < config.measurementRuns; i++) {
            const result = await this.runner.execute(implementation, testCase, config);
            const benchmarkResult = {
                id: randomUUID(),
                implementationId: implementation.id,
                testCaseId: testCase.id,
                runNumber: i + 1,
                metrics: result.metrics,
                output: result.output,
                success: result.success,
                error: result.error,
                timestamp: new Date(),
            };
            results.push(benchmarkResult);
        }
        return results;
    }
    getAlgorithm(id) {
        return this.algorithms.get(id);
    }
    getImplementation(id) {
        return this.implementations.get(id);
    }
    getTestCase(id) {
        return this.testCases.get(id);
    }
    listAlgorithms() {
        return Array.from(this.algorithms.values());
    }
    listImplementations(algorithmId) {
        const all = Array.from(this.implementations.values());
        if (algorithmId) {
            return all.filter((impl) => impl.algorithmId === algorithmId);
        }
        return all;
    }
    listTestCases() {
        return Array.from(this.testCases.values());
    }
    getResults(implementationId, testCaseId) {
        return this.results.get(`${implementationId}-${testCaseId}`);
    }
}
//# sourceMappingURL=orchestrator.js.map