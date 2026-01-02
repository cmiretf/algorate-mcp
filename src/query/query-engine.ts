import { Orchestrator } from '../core/orchestrator.js';
import { AlgorithmDetector } from '../auto-detection/algorithm-detector.js';
import { WorkloadGenerator } from '../auto-detection/workload-generator.js';
import { ChartGenerator } from '../visualization/chart-generator.js';
import { ResultStorage } from '../storage/result-storage.js';
import { SummaryGenerator } from './summary-generator.js';
import type { ComparisonResult, BenchmarkConfig } from '../types/index.js';
import type { PerformanceSummary } from './summary-generator.js';

export interface QueryResponse {
  summary: PerformanceSummary;
  chartPath?: string;
  results: ComparisonResult[];
  algorithmsDetected: number;
  benchmarksExecuted: number;
}

export interface QueryOptions {
  forceRefresh?: boolean;
  maxAgeMs?: number;
  directories?: string[];
}

export class QueryEngine {
  private orchestrator: Orchestrator;
  private detector: AlgorithmDetector;
  private workloadGenerator: WorkloadGenerator;
  private chartGenerator: ChartGenerator;
  private storage: ResultStorage;
  private summaryGenerator: SummaryGenerator;

  constructor(orchestrator: Orchestrator) {
    this.orchestrator = orchestrator;
    this.detector = new AlgorithmDetector();
    this.workloadGenerator = new WorkloadGenerator();
    this.chartGenerator = new ChartGenerator();
    this.storage = new ResultStorage();
    this.summaryGenerator = new SummaryGenerator();
  }

  async processQuery(
    query: string,
    options: QueryOptions = {}
  ): Promise<QueryResponse> {
    // Initialize storage
    await this.storage.initialize();

    // Detect algorithms
    const detected = await this.detector.detectAlgorithms({
      directories: options.directories
    });

    // Get already registered algorithms from orchestrator
    const registeredAlgorithms = this.orchestrator.listAlgorithms();
    const registeredImplementations = this.orchestrator.listImplementations();

    // Process detected algorithms
    let algorithmsDetected = detected.length;
    let benchmarksExecuted = 0;
    const results: ComparisonResult[] = [];
    const algorithmNames = new Map<string, string>();
    const implementationNames = new Map<string, string>();

    // Register detected algorithms
    for (const algo of detected) {
      const algorithm = this.orchestrator.registerAlgorithm(
        algo.name,
        algo.description,
        algo.category
      );
      algorithmNames.set(algorithm.id, algorithm.name);

      const implementation = this.orchestrator.registerImplementation(
        algorithm.id,
        algo.name,
        algo.language,
        algo.code,
        algo.entryFunction,
        algo.description
      );
      implementationNames.set(implementation.id, implementation.name);
    }

    // Add registered algorithms to maps
    for (const algo of registeredAlgorithms) {
      algorithmNames.set(algo.id, algo.name);
    }

    for (const impl of registeredImplementations) {
      implementationNames.set(impl.id, impl.name);
    }

    // Get all algorithms (including newly registered ones)
    const allAlgorithms = this.orchestrator.listAlgorithms();
    
    // Determine which algorithms to benchmark
    const algorithmsToBenchmark = this.selectAlgorithmsForQuery(
      query,
      allAlgorithms
    );

    // Run benchmarks
    for (const algorithm of algorithmsToBenchmark) {
      // Check if we have fresh results
      if (!options.forceRefresh) {
        const cached = await this.getCachedResults(algorithm.id);
        if (cached && cached.length > 0) {
          results.push(...cached);
          continue;
        }
      }

      // Generate workloads
      const category = algorithm.category || 'general';
      const workloads = this.workloadGenerator.generateWorkloadsForCategory(
        category,
        algorithm.name
      );

      // Register workloads
      for (const workload of workloads) {
        const testCase = this.orchestrator.registerTestCase(
          workload.name,
          workload.inputSize,
          workload.inputType,
          workload.input,
          workload.expectedOutput,
          workload.description
        );

        // Run benchmark
        const config: BenchmarkConfig = {
          warmupRuns: 2,
          measurementRuns: 5,
          timeoutMs: 30000,
          validateOutput: true,
          collectMemoryMetrics: true,
          isolateExecutions: true
        };

        const result = await this.orchestrator.runBenchmark(
          algorithm.id,
          testCase.id,
          config
        );

        results.push(result);
        benchmarksExecuted++;

        // Save results
        const individualResults = this.orchestrator.getResults(
          result.implementations[0]?.implementationId || '',
          testCase.id
        ) || [];

        await this.storage.saveResults(
          algorithm.id,
          testCase.id,
          result,
          individualResults
        );
      }
    }

    // Generate charts
    let chartPath: string | undefined;
    if (results.length > 0) {
      const chartHtml = await this.generateChartForResults(results);
      const firstResult = results[0];
      chartPath = await this.storage.saveChart(
        firstResult.algorithmId,
        firstResult.testCaseId,
        chartHtml
      );

      // Update stored results with chart path
      for (const result of results) {
        const stored = await this.storage.loadResults(result.algorithmId, result.testCaseId);
        if (stored && typeof stored === 'object' && 'chartPath' in stored) {
          await this.storage.saveResults(
            result.algorithmId,
            result.testCaseId,
            result,
            [],
            chartPath
          );
        }
      }
    }

    // Generate summary
    const summary = this.summaryGenerator.generateSummary(
      results,
      algorithmNames,
      implementationNames
    );

    return {
      summary,
      chartPath,
      results,
      algorithmsDetected,
      benchmarksExecuted
    };
  }

  private async getCachedResults(algorithmId: string): Promise<ComparisonResult[] | null> {
    const stored = await this.storage.loadResults(algorithmId);
    
    if (!stored || !(stored instanceof Map)) {
      return null;
    }

    const results: ComparisonResult[] = [];
    for (const [testCaseId, storedResult] of stored.entries()) {
      if (storedResult && typeof storedResult === 'object' && 'comparisonResult' in storedResult) {
        results.push(storedResult.comparisonResult);
      }
    }

    return results.length > 0 ? results : null;
  }

  private selectAlgorithmsForQuery(
    query: string,
    algorithms: Array<{ id: string; name: string; category?: string }>
  ): Array<{ id: string; name: string; category?: string }> {
    const queryLower = query.toLowerCase();

    // If query is generic, return all algorithms
    if (queryLower.includes('todos') || queryLower.includes('all') || queryLower.length < 5) {
      return algorithms;
    }

    // Filter by keywords
    const filtered = algorithms.filter(algo => {
      const nameLower = algo.name.toLowerCase();
      const categoryLower = (algo.category || '').toLowerCase();

      return (
        nameLower.includes(queryLower) ||
        categoryLower.includes(queryLower) ||
        queryLower.includes(nameLower) ||
        queryLower.includes(categoryLower)
      );
    });

    return filtered.length > 0 ? filtered : algorithms;
  }

  private async generateChartForResults(results: ComparisonResult[]): Promise<string> {
    if (results.length === 0) {
      throw new Error('No results to generate chart from');
    }

    // Use the first result's algorithm ID for the chart path
    const firstResult = results[0];
    const outputPath = `benchmark-results/algorithms/${firstResult.algorithmId}/charts/combined-${Date.now()}.html`;

    const chartPath = await this.chartGenerator.generateChart(
      results,
      outputPath,
      {
        title: 'Benchmark Results Comparison',
        xAxisLabel: 'Input Size',
        yAxisLabel: 'Execution Time (ms)',
        showMemory: true,
        showErrorBars: true
      }
    );

    return chartPath;
  }

  async queryPerformance(
    query: string,
    options: QueryOptions = {}
  ): Promise<{
    summary: string;
    chartPath?: string;
    metrics: PerformanceSummary['metrics'];
    alerts: string[];
  }> {
    const response = await this.processQuery(query, options);

    return {
      summary: response.summary.text,
      chartPath: response.chartPath,
      metrics: response.summary.metrics,
      alerts: response.summary.alerts
    };
  }
}

