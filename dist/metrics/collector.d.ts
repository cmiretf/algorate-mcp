export interface MemorySnapshot {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    arrayBuffers: number;
}
export interface CpuUsageSnapshot {
    user: number;
    system: number;
}
export declare class MetricsCollector {
    collectMemory(): MemorySnapshot;
    collectCpuUsage(): CpuUsageSnapshot;
    calculateCpuTime(before: CpuUsageSnapshot, after: CpuUsageSnapshot): number;
    formatMemory(bytes: number): string;
    formatTime(ms: number): string;
}
//# sourceMappingURL=collector.d.ts.map