import type { BenchmarkResult, AggregatedResult, ComparisonResult, Statistics } from '../types/index.js';
export declare class Analyzer {
    calculateStatistics(values: number[]): Statistics;
    aggregateResults(implementationId: string, testCaseId: string, results: BenchmarkResult[]): AggregatedResult;
    compareImplementations(algorithmId: string, testCaseId: string, results: AggregatedResult[]): ComparisonResult;
    private generateRanking;
    private calculateScore;
    private generateInsights;
}
//# sourceMappingURL=analyzer.d.ts.map