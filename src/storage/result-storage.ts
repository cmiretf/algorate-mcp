import { writeFile, readFile, mkdir, stat } from 'fs/promises';
import { join } from 'path';
import type { ComparisonResult, BenchmarkResult } from '../types/index.js';

export interface StoredResults {
  algorithmId: string;
  testCaseId: string;
  comparisonResult: ComparisonResult;
  individualResults: BenchmarkResult[];
  chartPath?: string;
  timestamp: Date;
}

export interface DetectionCache {
  lastDetection: Date;
  detectedAlgorithms: Array<{
    filePath: string;
    name: string;
    hash: string;
  }>;
}

export class ResultStorage {
  private readonly baseDir = 'benchmark-results';
  private readonly algorithmsDir = join(this.baseDir, 'algorithms');
  private readonly cacheDir = join(this.baseDir, 'cache');

  async initialize(): Promise<void> {
    await mkdir(this.algorithmsDir, { recursive: true });
    await mkdir(this.cacheDir, { recursive: true });
  }

  async saveResults(
    algorithmId: string,
    testCaseId: string,
    comparisonResult: ComparisonResult,
    individualResults: BenchmarkResult[],
    chartPath?: string
  ): Promise<string> {
    await this.initialize();

    const algorithmDir = join(this.algorithmsDir, algorithmId);
    await mkdir(algorithmDir, { recursive: true });
    await mkdir(join(algorithmDir, 'charts'), { recursive: true });

    const stored: StoredResults = {
      algorithmId,
      testCaseId,
      comparisonResult,
      individualResults,
      chartPath,
      timestamp: new Date()
    };

    const resultsPath = join(algorithmDir, 'results.json');
    const existing = await this.loadExistingResults(algorithmId);

    // Merge with existing results
    const updated = {
      ...existing,
      [testCaseId]: stored
    };

    await writeFile(resultsPath, JSON.stringify(updated, null, 2), 'utf-8');

    return resultsPath;
  }

  async loadResults(algorithmId: string, testCaseId?: string): Promise<StoredResults | Map<string, StoredResults> | null> {
    await this.initialize();

    const resultsPath = join(this.algorithmsDir, algorithmId, 'results.json');

    try {
      await stat(resultsPath);
      const existing = await this.loadExistingResults(algorithmId);

      if (testCaseId) {
        return existing[testCaseId] || null;
      }

      return new Map(Object.entries(existing));
    } catch {
      return null;
    }
  }

  private async loadExistingResults(algorithmId: string): Promise<Record<string, StoredResults>> {
    const resultsPath = join(this.algorithmsDir, algorithmId, 'results.json');

    try {
      const content = await readFile(resultsPath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return {};
    }
  }

  async saveChart(algorithmId: string, testCaseId: string, chartHtml: string): Promise<string> {
    await this.initialize();

    const chartsDir = join(this.algorithmsDir, algorithmId, 'charts');
    await mkdir(chartsDir, { recursive: true });

    const chartPath = join(chartsDir, `${testCaseId}.html`);
    await writeFile(chartPath, chartHtml, 'utf-8');

    return chartPath;
  }

  async getChartPath(algorithmId: string, testCaseId: string): Promise<string | null> {
    const chartPath = join(this.algorithmsDir, algorithmId, 'charts', `${testCaseId}.html`);

    try {
      await stat(chartPath);
      return chartPath;
    } catch {
      return null;
    }
  }

  async saveDetectionCache(cache: DetectionCache): Promise<void> {
    await this.initialize();

    const cachePath = join(this.cacheDir, 'detection-cache.json');
    await writeFile(cachePath, JSON.stringify(cache, null, 2), 'utf-8');
  }

  async loadDetectionCache(): Promise<DetectionCache | null> {
    await this.initialize();

    const cachePath = join(this.cacheDir, 'detection-cache.json');

    try {
      await stat(cachePath);
      const content = await readFile(cachePath, 'utf-8');
      const parsed = JSON.parse(content);
      
      return {
        ...parsed,
        lastDetection: new Date(parsed.lastDetection)
      };
    } catch {
      return null;
    }
  }

  async isResultFresh(
    algorithmId: string,
    testCaseId: string,
    maxAgeMs: number = 3600000 // 1 hour default
  ): Promise<boolean> {
    const result = await this.loadResults(algorithmId, testCaseId);

    if (!result || !(result instanceof Object && 'timestamp' in result)) {
      return false;
    }

    const stored = result as StoredResults;
    const age = Date.now() - new Date(stored.timestamp).getTime();

    return age < maxAgeMs;
  }

  async listAlgorithms(): Promise<string[]> {
    await this.initialize();

    try {
      const entries = await import('fs/promises').then(m => m.readdir(this.algorithmsDir));
      return entries;
    } catch {
      return [];
    }
  }

  async listTestCases(algorithmId: string): Promise<string[]> {
    await this.initialize();

    const algorithmDir = join(this.algorithmsDir, algorithmId);
    
    try {
      const results = await this.loadExistingResults(algorithmId);
      return Object.keys(results);
    } catch {
      return [];
    }
  }

  getResultsDirectory(): string {
    return this.baseDir;
  }
}


