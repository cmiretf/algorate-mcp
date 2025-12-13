import { Worker } from 'worker_threads';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import type { Implementation, TestCase, BenchmarkConfig, Metrics } from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface ExecutionResult {
  metrics: Metrics;
  output: unknown;
  success: boolean;
  error?: string;
}

interface WorkerResult {
  success: boolean;
  output?: unknown;
  error?: string;
  metrics: {
    executionTimeMs: number;
    cpuTimeMs: number;
    memoryPeakBytes: number;
    memoryDeltaBytes: number;
  };
}

export class BenchmarkRunner {
  async execute(
    implementation: Implementation,
    testCase: TestCase,
    config: BenchmarkConfig
  ): Promise<ExecutionResult> {
    if (config.isolateExecutions) {
      return this.executeIsolated(implementation, testCase, config);
    }
    return this.executeInProcess(implementation, testCase, config);
  }

  private async executeIsolated(
    implementation: Implementation,
    testCase: TestCase,
    config: BenchmarkConfig
  ): Promise<ExecutionResult> {
    return new Promise((resolve) => {
      const workerPath = join(__dirname, 'worker.js');
      
      const worker = new Worker(workerPath, {
        workerData: {
          code: implementation.code,
          entryFunction: implementation.entryFunction,
          input: testCase.input,
        },
      });

      const timeout = setTimeout(() => {
        worker.terminate();
        resolve({
          metrics: {
            executionTimeMs: config.timeoutMs,
            cpuTimeMs: 0,
            memoryPeakBytes: 0,
            memoryDeltaBytes: 0,
          },
          output: undefined,
          success: false,
          error: `Execution timed out after ${config.timeoutMs}ms`,
        });
      }, config.timeoutMs);

      worker.on('message', (result: WorkerResult) => {
        clearTimeout(timeout);
        worker.terminate();

        let finalSuccess = result.success;
        let error = result.error;

        if (config.validateOutput && testCase.expectedOutput !== undefined && result.success) {
          const isValid = this.validateOutput(result.output, testCase.expectedOutput);
          if (!isValid) {
            finalSuccess = false;
            error = 'Output validation failed';
          }
        }

        resolve({
          metrics: result.metrics,
          output: result.output,
          success: finalSuccess,
          error,
        });
      });

      worker.on('error', (err) => {
        clearTimeout(timeout);
        worker.terminate();
        resolve({
          metrics: {
            executionTimeMs: 0,
            cpuTimeMs: 0,
            memoryPeakBytes: 0,
            memoryDeltaBytes: 0,
          },
          output: undefined,
          success: false,
          error: err.message,
        });
      });
    });
  }

  private async executeInProcess(
    implementation: Implementation,
    testCase: TestCase,
    config: BenchmarkConfig
  ): Promise<ExecutionResult> {
    const { performance } = await import('perf_hooks');
    
    const memoryBefore = process.memoryUsage();
    const cpuBefore = process.cpuUsage();
    const startTime = performance.now();

    let peakMemory = memoryBefore.heapUsed;
    let memoryInterval: ReturnType<typeof setInterval> | undefined;

    if (config.collectMemoryMetrics) {
      memoryInterval = setInterval(() => {
        const current = process.memoryUsage().heapUsed;
        if (current > peakMemory) {
          peakMemory = current;
        }
      }, 1);
    }

    let output: unknown;
    let success = true;
    let error: string | undefined;

    try {
      output = await this.executeWithTimeout(
        implementation,
        testCase.input,
        config.timeoutMs
      );

      if (config.validateOutput && testCase.expectedOutput !== undefined) {
        const isValid = this.validateOutput(output, testCase.expectedOutput);
        if (!isValid) {
          success = false;
          error = 'Output validation failed';
        }
      }
    } catch (err) {
      success = false;
      error = err instanceof Error ? err.message : String(err);
      output = undefined;
    }

    if (memoryInterval) clearInterval(memoryInterval);

    const endTime = performance.now();
    const cpuAfter = process.cpuUsage(cpuBefore);
    const memoryAfter = process.memoryUsage();

    const metrics: Metrics = {
      executionTimeMs: endTime - startTime,
      cpuTimeMs: (cpuAfter.user + cpuAfter.system) / 1000,
      memoryPeakBytes: config.collectMemoryMetrics ? Math.max(peakMemory, memoryAfter.heapUsed) : memoryAfter.heapUsed,
      memoryDeltaBytes: memoryAfter.heapUsed - memoryBefore.heapUsed,
    };

    return { metrics, output, success, error };
  }

  private async executeWithTimeout(
    implementation: Implementation,
    input: unknown,
    timeoutMs: number
  ): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Execution timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      try {
        const fn = this.compileFunction(implementation);
        const result = fn(input);

        if (result instanceof Promise) {
          result
            .then((res) => {
              clearTimeout(timer);
              resolve(res);
            })
            .catch((err) => {
              clearTimeout(timer);
              reject(err);
            });
        } else {
          clearTimeout(timer);
          resolve(result);
        }
      } catch (err) {
        clearTimeout(timer);
        reject(err);
      }
    });
  }

  private compileFunction(implementation: Implementation): (input: unknown) => unknown {
    const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
    
    const wrappedCode = `
      ${implementation.code}
      return ${implementation.entryFunction}(input);
    `;

    try {
      const fn = new AsyncFunction('input', wrappedCode);
      return fn as (input: unknown) => unknown;
    } catch {
      const fn = new Function('input', wrappedCode);
      return fn as (input: unknown) => unknown;
    }
  }

  private validateOutput(actual: unknown, expected: unknown): boolean {
    return JSON.stringify(actual) === JSON.stringify(expected);
  }
}
