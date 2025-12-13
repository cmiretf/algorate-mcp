import type {
  BenchmarkResult,
  AggregatedResult,
  ComparisonResult,
  Statistics,
} from '../types/index.js';

export class Analyzer {
  calculateStatistics(values: number[]): Statistics {
    if (values.length === 0) {
      return {
        mean: 0,
        median: 0,
        min: 0,
        max: 0,
        stdDev: 0,
        variance: 0,
        p95: 0,
        p99: 0,
      };
    }

    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;

    const mean = values.reduce((sum, v) => sum + v, 0) / n;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    const median = n % 2 === 0
      ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
      : sorted[Math.floor(n / 2)];

    const p95Index = Math.floor(n * 0.95);
    const p99Index = Math.floor(n * 0.99);

    return {
      mean,
      median,
      min: sorted[0],
      max: sorted[n - 1],
      stdDev,
      variance,
      p95: sorted[Math.min(p95Index, n - 1)],
      p99: sorted[Math.min(p99Index, n - 1)],
    };
  }

  aggregateResults(
    implementationId: string,
    testCaseId: string,
    results: BenchmarkResult[]
  ): AggregatedResult {
    const successfulResults = results.filter((r) => r.success);

    const executionTimes = successfulResults.map((r) => r.metrics.executionTimeMs);
    const cpuTimes = successfulResults.map((r) => r.metrics.cpuTimeMs);
    const memoryPeaks = successfulResults.map((r) => r.metrics.memoryPeakBytes);

    return {
      implementationId,
      testCaseId,
      totalRuns: results.length,
      successfulRuns: successfulResults.length,
      executionTime: this.calculateStatistics(executionTimes),
      cpuTime: this.calculateStatistics(cpuTimes),
      memoryPeak: this.calculateStatistics(memoryPeaks),
    };
  }

  compareImplementations(
    algorithmId: string,
    testCaseId: string,
    results: AggregatedResult[]
  ): ComparisonResult {
    const ranking = this.generateRanking(results);
    const insights = this.generateInsights(results);

    return {
      algorithmId,
      testCaseId,
      implementations: results,
      ranking,
      insights,
      generatedAt: new Date(),
    };
  }

  private generateRanking(
    results: AggregatedResult[]
  ): { implementationId: string; rank: number; score: number }[] {
    const scored = results.map((r) => ({
      implementationId: r.implementationId,
      score: this.calculateScore(r),
    }));

    scored.sort((a, b) => a.score - b.score);

    return scored.map((s, index) => ({
      ...s,
      rank: index + 1,
    }));
  }

  private calculateScore(result: AggregatedResult): number {
    const timeWeight = 0.6;
    const memoryWeight = 0.3;
    const consistencyWeight = 0.1;

    const normalizedTime = result.executionTime.mean;
    const normalizedMemory = result.memoryPeak.mean / (1024 * 1024);
    const consistency = result.executionTime.stdDev / (result.executionTime.mean || 1);

    return (
      normalizedTime * timeWeight +
      normalizedMemory * memoryWeight +
      consistency * consistencyWeight
    );
  }

  private generateInsights(results: AggregatedResult[]): string[] {
    const insights: string[] = [];

    if (results.length < 2) {
      insights.push('Need at least 2 implementations to compare');
      return insights;
    }

    const sorted = [...results].sort(
      (a, b) => a.executionTime.mean - b.executionTime.mean
    );

    const fastest = sorted[0];
    const slowest = sorted[sorted.length - 1];

    if (fastest && slowest) {
      const speedup = slowest.executionTime.mean / fastest.executionTime.mean;
      insights.push(
        `Fastest implementation is ${speedup.toFixed(2)}x faster than the slowest`
      );
    }

    const sortedByMemory = [...results].sort(
      (a, b) => a.memoryPeak.mean - b.memoryPeak.mean
    );

    const leastMemory = sortedByMemory[0];
    const mostMemory = sortedByMemory[sortedByMemory.length - 1];

    if (leastMemory && mostMemory) {
      const memoryRatio = mostMemory.memoryPeak.mean / leastMemory.memoryPeak.mean;
      if (memoryRatio > 1.5) {
        insights.push(
          `Memory usage varies by ${memoryRatio.toFixed(2)}x between implementations`
        );
      }
    }

    for (const result of results) {
      const cv = result.executionTime.stdDev / (result.executionTime.mean || 1);
      if (cv > 0.2) {
        insights.push(
          `Implementation ${result.implementationId.slice(0, 8)} shows high variability (CV: ${(cv * 100).toFixed(1)}%)`
        );
      }
    }

    return insights;
  }
}
