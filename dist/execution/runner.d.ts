import type { Implementation, TestCase, BenchmarkConfig, Metrics } from '../types/index.js';
export interface ExecutionResult {
    metrics: Metrics;
    output: unknown;
    success: boolean;
    error?: string;
}
export declare class BenchmarkRunner {
    execute(implementation: Implementation, testCase: TestCase, config: BenchmarkConfig): Promise<ExecutionResult>;
    private executeIsolated;
    private executeInProcess;
    private executeWithTimeout;
    private compileFunction;
    private validateOutput;
}
//# sourceMappingURL=runner.d.ts.map