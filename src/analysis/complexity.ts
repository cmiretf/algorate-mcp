export type ComplexityClass = 'O(1)' | 'O(log n)' | 'O(n)' | 'O(n log n)' | 'O(n²)' | 'O(n³)' | 'O(2^n)';

export interface ComplexityEstimate {
  estimatedClass: ComplexityClass;
  confidence: number;
  growthRate: string;
  explanation: string;
}

export class ComplexityEstimator {
  estimate(dataSizes: number[], timings: number[]): ComplexityEstimate {
    const candidates: { name: ComplexityClass; fn: (n: number) => number }[] = [
      { name: 'O(1)', fn: () => 1 },
      { name: 'O(log n)', fn: (n) => Math.log2(Math.max(n, 1)) },
      { name: 'O(n)', fn: (n) => n },
      { name: 'O(n log n)', fn: (n) => n * Math.log2(Math.max(n, 1)) },
      { name: 'O(n²)', fn: (n) => n * n },
      { name: 'O(n³)', fn: (n) => n * n * n },
      { name: 'O(2^n)', fn: (n) => Math.pow(2, Math.min(n, 30)) },
    ];

    let bestFit: ComplexityClass = 'O(n)';
    let bestR2 = -Infinity;

    for (const candidate of candidates) {
      const r2 = this.calculateR2(dataSizes, timings, candidate.fn);
      if (r2 > bestR2) {
        bestR2 = r2;
        bestFit = candidate.name;
      }
    }

    const confidence = Math.max(0, Math.min(1, bestR2));

    const growthDescriptions: Record<ComplexityClass, string> = {
      'O(1)': 'constant - performance does not change with input size',
      'O(log n)': 'logarithmic - performance grows very slowly with input size',
      'O(n)': 'linear - performance grows proportionally with input size',
      'O(n log n)': 'linearithmic - slightly worse than linear growth',
      'O(n²)': 'quadratic - performance degrades quickly with input size',
      'O(n³)': 'cubic - performance degrades very quickly with input size',
      'O(2^n)': 'exponential - performance degrades extremely fast',
    };

    return {
      estimatedClass: bestFit,
      confidence,
      growthRate: growthDescriptions[bestFit],
      explanation: `Based on empirical analysis across ${dataSizes.length} input sizes (n=${dataSizes.join(', ')}), the algorithm exhibits ${bestFit} complexity (R²=${confidence.toFixed(3)}). This means ${growthDescriptions[bestFit]}.`,
    };
  }

  private calculateR2(sizes: number[], timings: number[], fn: (n: number) => number): number {
    if (sizes.length < 2) return 0;

    const predicted = sizes.map(fn);
    const scale = this.fitScale(predicted, timings);
    const scaledPredicted = predicted.map((p) => p * scale);

    const meanTiming = timings.reduce((a, b) => a + b, 0) / timings.length;
    const ssTot = timings.reduce((sum, t) => sum + Math.pow(t - meanTiming, 2), 0);
    const ssRes = timings.reduce((sum, t, i) => sum + Math.pow(t - scaledPredicted[i], 2), 0);

    if (ssTot === 0) return 1;
    return 1 - ssRes / ssTot;
  }

  private fitScale(predicted: number[], actual: number[]): number {
    let numerator = 0;
    let denominator = 0;
    for (let i = 0; i < predicted.length; i++) {
      numerator += predicted[i] * actual[i];
      denominator += predicted[i] * predicted[i];
    }
    return denominator === 0 ? 1 : numerator / denominator;
  }
}
