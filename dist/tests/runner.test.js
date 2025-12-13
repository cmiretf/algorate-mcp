import { describe, it } from 'node:test';
import assert from 'node:assert';
import { BenchmarkRunner } from '../execution/runner.js';
describe('BenchmarkRunner', () => {
    const runner = new BenchmarkRunner();
    const createImplementation = (code, entryFunction) => ({
        id: 'test-impl',
        algorithmId: 'test-algo',
        name: 'Test Implementation',
        language: 'javascript',
        code,
        entryFunction,
        createdAt: new Date(),
    });
    const createTestCase = (input, expectedOutput) => ({
        id: 'test-case',
        name: 'Test Case',
        inputSize: 10,
        inputType: 'array',
        input,
        expectedOutput,
    });
    const defaultConfig = {
        warmupRuns: 0,
        measurementRuns: 1,
        timeoutMs: 5000,
        validateOutput: false,
        collectMemoryMetrics: true,
        isolateExecutions: false,
    };
    describe('execute', () => {
        it('should execute a simple function', async () => {
            const impl = createImplementation('function sum(arr) { return arr.reduce((a, b) => a + b, 0); }', 'sum');
            const testCase = createTestCase([1, 2, 3, 4, 5]);
            const result = await runner.execute(impl, testCase, defaultConfig);
            assert.strictEqual(result.success, true);
            assert.strictEqual(result.output, 15);
            assert.ok(result.metrics.executionTimeMs >= 0);
        });
        it('should validate output when enabled', async () => {
            const impl = createImplementation('function sort(arr) { return [...arr].sort((a, b) => a - b); }', 'sort');
            const testCase = createTestCase([3, 1, 2], [1, 2, 3]);
            const result = await runner.execute(impl, testCase, {
                ...defaultConfig,
                validateOutput: true,
            });
            assert.strictEqual(result.success, true);
        });
        it('should fail validation for wrong output', async () => {
            const impl = createImplementation('function wrong(arr) { return arr; }', 'wrong');
            const testCase = createTestCase([3, 1, 2], [1, 2, 3]);
            const result = await runner.execute(impl, testCase, {
                ...defaultConfig,
                validateOutput: true,
            });
            assert.strictEqual(result.success, false);
            assert.ok(result.error?.includes('validation'));
        });
        it('should handle errors gracefully', async () => {
            const impl = createImplementation('function broken(x) { throw new Error("Test error"); }', 'broken');
            const testCase = createTestCase([1, 2, 3]);
            const result = await runner.execute(impl, testCase, defaultConfig);
            assert.strictEqual(result.success, false);
            assert.ok(result.error?.includes('Test error'));
        });
        it('should collect memory metrics', async () => {
            const impl = createImplementation('function alloc(n) { return new Array(n).fill(0); }', 'alloc');
            const testCase = createTestCase(10000);
            const result = await runner.execute(impl, testCase, {
                ...defaultConfig,
                collectMemoryMetrics: true,
            });
            assert.strictEqual(result.success, true);
            assert.ok(result.metrics.memoryPeakBytes > 0);
        });
    });
});
//# sourceMappingURL=runner.test.js.map