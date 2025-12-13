export class MetricsCollector {
    collectMemory() {
        const usage = process.memoryUsage();
        return {
            rss: usage.rss,
            heapTotal: usage.heapTotal,
            heapUsed: usage.heapUsed,
            external: usage.external,
            arrayBuffers: usage.arrayBuffers,
        };
    }
    collectCpuUsage() {
        const usage = process.cpuUsage();
        return {
            user: usage.user,
            system: usage.system,
        };
    }
    calculateCpuTime(before, after) {
        const userDiff = (after.user - before.user) / 1000;
        const systemDiff = (after.system - before.system) / 1000;
        return userDiff + systemDiff;
    }
    formatMemory(bytes) {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        return `${size.toFixed(2)} ${units[unitIndex]}`;
    }
    formatTime(ms) {
        if (ms < 1) {
            return `${(ms * 1000).toFixed(2)} μs`;
        }
        if (ms < 1000) {
            return `${ms.toFixed(2)} ms`;
        }
        return `${(ms / 1000).toFixed(2)} s`;
    }
}
//# sourceMappingURL=collector.js.map