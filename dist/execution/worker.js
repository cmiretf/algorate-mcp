import { parentPort, workerData } from 'worker_threads';
import { performance } from 'perf_hooks';
async function executeInWorker() {
    const { code, entryFunction, input } = workerData;
    const memoryBefore = process.memoryUsage();
    const cpuBefore = process.cpuUsage();
    const startTime = performance.now();
    let peakMemory = memoryBefore.heapUsed;
    let memoryInterval;
    memoryInterval = setInterval(() => {
        const current = process.memoryUsage().heapUsed;
        if (current > peakMemory) {
            peakMemory = current;
        }
    }, 1);
    let result;
    try {
        const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
        const wrappedCode = `
      ${code}
      return await ${entryFunction}(input);
    `;
        let fn;
        try {
            fn = new AsyncFunction('input', wrappedCode);
        }
        catch {
            const SyncFunction = Function;
            const syncWrappedCode = `
        ${code}
        return ${entryFunction}(input);
      `;
            const syncFn = new SyncFunction('input', syncWrappedCode);
            fn = async (i) => syncFn(i);
        }
        const output = await fn(input);
        const endTime = performance.now();
        const cpuAfter = process.cpuUsage(cpuBefore);
        const memoryAfter = process.memoryUsage();
        if (memoryInterval)
            clearInterval(memoryInterval);
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
    }
    catch (err) {
        const endTime = performance.now();
        const cpuAfter = process.cpuUsage(cpuBefore);
        const memoryAfter = process.memoryUsage();
        if (memoryInterval)
            clearInterval(memoryInterval);
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
//# sourceMappingURL=worker.js.map