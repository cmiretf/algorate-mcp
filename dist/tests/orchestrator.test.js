import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { Orchestrator } from '../core/orchestrator.js';
describe('Orchestrator', () => {
    let orchestrator;
    beforeEach(() => {
        orchestrator = new Orchestrator();
    });
    describe('registerAlgorithm', () => {
        it('should register an algorithm with required fields', () => {
            const algorithm = orchestrator.registerAlgorithm('QuickSort');
            assert.ok(algorithm.id);
            assert.strictEqual(algorithm.name, 'QuickSort');
            assert.ok(algorithm.createdAt instanceof Date);
        });
        it('should register an algorithm with optional fields', () => {
            const algorithm = orchestrator.registerAlgorithm('MergeSort', 'Divide and conquer sorting', 'sorting');
            assert.strictEqual(algorithm.name, 'MergeSort');
            assert.strictEqual(algorithm.description, 'Divide and conquer sorting');
            assert.strictEqual(algorithm.category, 'sorting');
        });
    });
    describe('registerImplementation', () => {
        it('should register an implementation for an existing algorithm', () => {
            const algorithm = orchestrator.registerAlgorithm('BubbleSort');
            const impl = orchestrator.registerImplementation(algorithm.id, 'Basic Bubble Sort', 'javascript', 'function sort(arr) { return arr.sort((a,b) => a-b); }', 'sort');
            assert.ok(impl.id);
            assert.strictEqual(impl.algorithmId, algorithm.id);
            assert.strictEqual(impl.name, 'Basic Bubble Sort');
            assert.strictEqual(impl.language, 'javascript');
        });
        it('should throw error for non-existent algorithm', () => {
            assert.throws(() => {
                orchestrator.registerImplementation('non-existent-id', 'Test', 'javascript', 'function test() {}', 'test');
            }, /not found/);
        });
    });
    describe('registerTestCase', () => {
        it('should register a test case', () => {
            const testCase = orchestrator.registerTestCase('Small Array', 10, 'array', [5, 3, 8, 1, 9], [1, 3, 5, 8, 9]);
            assert.ok(testCase.id);
            assert.strictEqual(testCase.name, 'Small Array');
            assert.strictEqual(testCase.inputSize, 10);
            assert.strictEqual(testCase.inputType, 'array');
        });
    });
    describe('listAlgorithms', () => {
        it('should return empty array when no algorithms registered', () => {
            const algorithms = orchestrator.listAlgorithms();
            assert.deepStrictEqual(algorithms, []);
        });
        it('should return all registered algorithms', () => {
            orchestrator.registerAlgorithm('Algo1');
            orchestrator.registerAlgorithm('Algo2');
            const algorithms = orchestrator.listAlgorithms();
            assert.strictEqual(algorithms.length, 2);
        });
    });
    describe('listImplementations', () => {
        it('should filter implementations by algorithmId', () => {
            const algo1 = orchestrator.registerAlgorithm('Algo1');
            const algo2 = orchestrator.registerAlgorithm('Algo2');
            orchestrator.registerImplementation(algo1.id, 'Impl1', 'js', 'code', 'fn');
            orchestrator.registerImplementation(algo1.id, 'Impl2', 'js', 'code', 'fn');
            orchestrator.registerImplementation(algo2.id, 'Impl3', 'js', 'code', 'fn');
            const filtered = orchestrator.listImplementations(algo1.id);
            assert.strictEqual(filtered.length, 2);
        });
    });
});
//# sourceMappingURL=orchestrator.test.js.map