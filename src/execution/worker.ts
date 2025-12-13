import { parentPort, workerData } from 'worker_threads';
import { performance } from 'perf_hooks';

interface WorkerInput {
  code: string;
  entryFunction: string;
  input: unknown;
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

async function executeInWorker(): Promise<void> {
  const { code, entryFunction, input } = workerData as WorkerInput;

  const memoryBefore = process.memoryUsage();
  const cpuBefore = process.cpuUsage();
  const startTime = performance.now();

  let peakMemory = memoryBefore.heapUsed;
  let memoryInterval: ReturnType<typeof setInterval> | undefined;

  memoryInterval = setInterval(() => {
    const current = process.memoryUsage().heapUsed;
    if (current > peakMemory) {
      peakMemory = current;
    }
  }, 1);

  let result: WorkerResult;

  try {
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    const wrappedCode = `
      ${code}
      return await ${entryFunction}(input);
    `;

    let fn: (input: unknown) => Promise<unknown>;
    try {
      fn = new AsyncFunction('input', wrappedCode) as (input: unknown) => Promise<unknown>;
    } catch {
      const SyncFunction = Function;
      const syncWrappedCode = `
        ${code}
        return ${entryFunction}(input);
      `;
      const syncFn = new SyncFunction('input', syncWrappedCode) as (input: unknown) => unknown;
      fn = async (i: unknown) => syncFn(i);
    }

    const output = await fn(input);
    const endTime = performance.now();
    const cpuAfter = process.cpuUsage(cpuBefore);
    const memoryAfter = process.memoryUsage();

    if (memoryInterval) clearInterval(memoryInterval);

    const finalPeak = Math.max(peakMemory, memoryAfter.heapUsed);

    result = {
      success: true,
      output,
      metrics: {
        executionTimeMs: endTime - startTime,
        cpuTimeMs: (cpuAfter.user + cpuAfter.system) / 1000,
        memoryPeakBytes: finalPeak,
        memoryDeltaBytes: memoryAfter.heapUsed - memoryBefore.heapUsed,
      },
    };
  } catch (err) {
    const endTime = performance.now();
    const cpuAfter = process.cpuUsage(cpuBefore);
    const memoryAfter = process.memoryUsage();

    if (memoryInterval) clearInterval(memoryInterval);

    result = {
      success: false,
      error: err instanceof Error ? err.message : String(err),
      metrics: {
        executionTimeMs: endTime - startTime,
        cpuTimeMs: (cpuAfter.user + cpuAfter.system) / 1000,
        memoryPeakBytes: peakMemory,
        memoryDeltaBytes: memoryAfter.heapUsed - memoryBefore.heapUsed,
      },
    };
  }

  parentPort?.postMessage(result);
}

executeInWorker();
