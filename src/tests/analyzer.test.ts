import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Analyzer } from '../analysis/analyzer.js';

describe('Analyzer', () => {
  const analyzer = new Analyzer();

  describe('calculateStatistics', () => {
    it('should calculate statistics for a set of values', () => {
      const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const stats = analyzer.calculateStatistics(values);

      assert.strictEqual(stats.mean, 5.5);
      assert.strictEqual(stats.median, 5.5);
      assert.strictEqual(stats.min, 1);
      assert.strictEqual(stats.max, 10);
      assert.ok(stats.stdDev > 0);
      assert.ok(stats.variance > 0);
    });

    it('should handle empty array', () => {
      const stats = analyzer.calculateStatistics([]);

      assert.strictEqual(stats.mean, 0);
      assert.strictEqual(stats.median, 0);
      assert.strictEqual(stats.min, 0);
      assert.strictEqual(stats.max, 0);
    });

    it('should handle single value', () => {
      const stats = analyzer.calculateStatistics([42]);

      assert.strictEqual(stats.mean, 42);
      assert.strictEqual(stats.median, 42);
      assert.strictEqual(stats.min, 42);
      assert.strictEqual(stats.max, 42);
      assert.strictEqual(stats.stdDev, 0);
    });

    it('should calculate correct percentiles', () => {
      const values = Array.from({ length: 100 }, (_, i) => i + 1);
      const stats = analyzer.calculateStatistics(values);

      assert.strictEqual(stats.p95, 96);
      assert.strictEqual(stats.p99, 100);
    });
  });

  describe('aggregateResults', () => {
    it('should aggregate benchmark results', () => {
      const results = [
        {
          id: '1',
          implementationId: 'impl1',
          testCaseId: 'test1',
          runNumber: 1,
          metrics: {
            executionTimeMs: 10,
            cpuTimeMs: 8,
            memoryPeakBytes: 1000,
            memoryDeltaBytes: 100,
          },
          output: null,
          success: true,
          timestamp: new Date(),
        },
        {
          id: '2',
          implementationId: 'impl1',
          testCaseId: 'test1',
          runNumber: 2,
          metrics: {
            executionTimeMs: 12,
            cpuTimeMs: 10,
            memoryPeakBytes: 1200,
            memoryDeltaBytes: 150,
          },
          output: null,
          success: true,
          timestamp: new Date(),
        },
      ];

      const aggregated = analyzer.aggregateResults('impl1', 'test1', results);

      assert.strictEqual(aggregated.implementationId, 'impl1');
      assert.strictEqual(aggregated.testCaseId, 'test1');
      assert.strictEqual(aggregated.totalRuns, 2);
      assert.strictEqual(aggregated.successfulRuns, 2);
      assert.strictEqual(aggregated.executionTime.mean, 11);
    });

    it('should only count successful runs for statistics', () => {
      const results = [
        {
          id: '1',
          implementationId: 'impl1',
          testCaseId: 'test1',
          runNumber: 1,
          metrics: {
            executionTimeMs: 10,
            cpuTimeMs: 8,
            memoryPeakBytes: 1000,
            memoryDeltaBytes: 100,
          },
          output: null,
          success: true,
          timestamp: new Date(),
        },
        {
          id: '2',
          implementationId: 'impl1',
          testCaseId: 'test1',
          runNumber: 2,
          metrics: {
            executionTimeMs: 0,
            cpuTimeMs: 0,
            memoryPeakBytes: 0,
            memoryDeltaBytes: 0,
          },
          output: null,
          success: false,
          error: 'Timeout',
          timestamp: new Date(),
        },
      ];

      const aggregated = analyzer.aggregateResults('impl1', 'test1', results);

      assert.strictEqual(aggregated.totalRuns, 2);
      assert.strictEqual(aggregated.successfulRuns, 1);
      assert.strictEqual(aggregated.executionTime.mean, 10);
    });
  });
});
