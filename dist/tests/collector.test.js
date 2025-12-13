import { describe, it } from 'node:test';
import assert from 'node:assert';
import { MetricsCollector } from '../metrics/collector.js';
describe('MetricsCollector', () => {
    const collector = new MetricsCollector();
    describe('collectMemory', () => {
        it('should return memory snapshot with all fields', () => {
            const snapshot = collector.collectMemory();
            assert.ok(typeof snapshot.rss === 'number');
            assert.ok(typeof snapshot.heapTotal === 'number');
            assert.ok(typeof snapshot.heapUsed === 'number');
            assert.ok(typeof snapshot.external === 'number');
            assert.ok(typeof snapshot.arrayBuffers === 'number');
        });
        it('should return positive values', () => {
            const snapshot = collector.collectMemory();
            assert.ok(snapshot.rss > 0);
            assert.ok(snapshot.heapTotal > 0);
            assert.ok(snapshot.heapUsed > 0);
        });
    });
    describe('collectCpuUsage', () => {
        it('should return CPU usage snapshot', () => {
            const snapshot = collector.collectCpuUsage();
            assert.ok(typeof snapshot.user === 'number');
            assert.ok(typeof snapshot.system === 'number');
        });
    });
    describe('calculateCpuTime', () => {
        it('should calculate CPU time difference', () => {
            const before = { user: 1000, system: 500 };
            const after = { user: 2000, system: 1000 };
            const cpuTime = collector.calculateCpuTime(before, after);
            assert.strictEqual(cpuTime, 1.5);
        });
    });
    describe('formatMemory', () => {
        it('should format bytes correctly', () => {
            assert.strictEqual(collector.formatMemory(500), '500.00 B');
            assert.strictEqual(collector.formatMemory(1024), '1.00 KB');
            assert.strictEqual(collector.formatMemory(1048576), '1.00 MB');
            assert.strictEqual(collector.formatMemory(1073741824), '1.00 GB');
        });
    });
    describe('formatTime', () => {
        it('should format time correctly', () => {
            assert.ok(collector.formatTime(0.5).includes('μs'));
            assert.ok(collector.formatTime(100).includes('ms'));
            assert.ok(collector.formatTime(1500).includes('s'));
        });
    });
});
//# sourceMappingURL=collector.test.js.map