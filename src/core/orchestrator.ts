import { randomUUID } from 'crypto';
import type {
  Algorithm,
  Implementation,
  TestCase,
  BenchmarkConfig,
  BenchmarkResult,
  AggregatedResult,
  ComparisonResult,
} from '../types/index.js';
import { BenchmarkRunner } from '../execution/runner.js';
import { MetricsCollector } from '../metrics/collector.js';
import { Analyzer } from '../analysis/analyzer.js';

export class Orchestrator {
  private algorithms: Map<string, Algorithm> = new Map();
  private implementations: Map<string, Implementation> = new Map();
  private testCases: Map<string, TestCase> = new Map();
  private results: Map<string, BenchmarkResult[]> = new Map();

  private runner: BenchmarkRunner;
  private metricsCollector: MetricsCollector;
  private analyzer: Analyzer;

  constructor() {
    this.runner = new BenchmarkRunner();
    this.metricsCollector = new MetricsCollector();
    this.analyzer = new Analyzer();
  }

  registerAlgorithm(name: string, description?: string, category?: string): Algorithm {
    const algorithm: Algorithm = {
      id: randomUUID(),
      name,
      description,
      category,
      createdAt: new Date(),
    };
    this.algorithms.set(algorithm.id, algorithm);
    return algorithm;
  }

  registerImplementation(
    algorithmId: string,
    name: string,
    language: string,
    code: string,
    entryFunction: string,
    description?: string
  ): Implementation {
    if (!this.algorithms.has(algorithmId)) {
      throw new Error(`Algorithm with id ${algorithmId} not found`);
    }

    const implementation: Implementation = {
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

  registerTestCase(
    name: string,
    inputSize: number,
    inputType: TestCase['inputType'],
    input: unknown,
    expectedOutput?: unknown,
    description?: string
  ): TestCase {
    const testCase: TestCase = {
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

  async runBenchmark(
    algorithmId: string,
    testCaseId: string,
    config: BenchmarkConfig
  ): Promise<ComparisonResult> {
    const algorithm = this.algorithms.get(algorithmId);
    if (!algorithm) {
      throw new Error(`Algorithm with id ${algorithmId} not found`);
    }

    const testCase = this.testCases.get(testCaseId);
    if (!testCase) {
      throw new Error(`TestCase with id ${testCaseId} not found`);
    }

    const implementations = Array.from(this.implementations.values()).filter(
      (impl) => impl.algorithmId === algorithmId
    );

    if (implementations.length === 0) {
      throw new Error(`No implementations found for algorithm ${algorithmId}`);
    }

    const allResults: BenchmarkResult[] = [];
    const aggregatedResults: AggregatedResult[] = [];

    for (const impl of implementations) {
      const implResults = await this.benchmarkImplementation(impl, testCase, config);
      allResults.push(...implResults);

      const aggregated = this.analyzer.aggregateResults(impl.id, testCaseId, implResults);
      aggregatedResults.push(aggregated);

      const key = `${impl.id}-${testCaseId}`;
      this.results.set(key, implResults);
    }

    // Pass the first implementation if only one exists for optimization analysis
    const singleImpl = implementations.length === 1 ? implementations[0] : undefined;
    return this.analyzer.compareImplementations(algorithmId, testCaseId, aggregatedResults, singleImpl);
  }

  private async benchmarkImplementation(
    implementation: Implementation,
    testCase: TestCase,
    config: BenchmarkConfig
  ): Promise<BenchmarkResult[]> {
    for (let i = 0; i < config.warmupRuns; i++) {
      await this.runner.execute(implementation, testCase, config);
    }

    const results: BenchmarkResult[] = [];

    for (let i = 0; i < config.measurementRuns; i++) {
      const result = await this.runner.execute(implementation, testCase, config);
      
      const benchmarkResult: BenchmarkResult = {
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

  getAlgorithm(id: string): Algorithm | undefined {
    return this.algorithms.get(id);
  }

  getImplementation(id: string): Implementation | undefined {
    return this.implementations.get(id);
  }

  getTestCase(id: string): TestCase | undefined {
    return this.testCases.get(id);
  }

  listAlgorithms(): Algorithm[] {
    return Array.from(this.algorithms.values());
  }

  listImplementations(algorithmId?: string): Implementation[] {
    const all = Array.from(this.implementations.values());
    if (algorithmId) {
      return all.filter((impl) => impl.algorithmId === algorithmId);
    }
    return all;
  }

  listTestCases(): TestCase[] {
    return Array.from(this.testCases.values());
  }

  getResults(implementationId: string, testCaseId: string): BenchmarkResult[] | undefined {
    return this.results.get(`${implementationId}-${testCaseId}`);
  }
}
