import type { ComplexityEstimate } from './complexity.js';

export interface AnalysisInput {
  algorithmName: string;
  code: string;
  testSizes: number[];
  timings: number[];
  memoryUsages: number[];
  complexity: ComplexityEstimate;
  outputs: { input: unknown; output: unknown; size: number }[];
}

export class AnalysisFormatter {
  formatAnalysisParagraph(data: AnalysisInput): string {
    const { algorithmName, testSizes, timings, complexity, outputs } = data;

    let paragraph = `**Algorithmic Analysis: ${algorithmName}**\n\n`;

    paragraph += `**Input/Output Behavior:** `;

    if (outputs.length > 0) {
      const examples = outputs.slice(0, 3);
      const exampleTexts = examples.map((ex) => {
        const inputStr = this.truncate(JSON.stringify(ex.input), 80);
        const outputStr = this.truncate(JSON.stringify(ex.output), 80);
        return `with an input of size n=${ex.size} (${inputStr}), the output is ${outputStr}`;
      });
      paragraph += exampleTexts.join('; ') + '. ';
    }

    const minTime = Math.min(...timings);
    const maxTime = Math.max(...timings);
    const minSize = Math.min(...testSizes);
    const maxSize = Math.max(...testSizes);

    if (testSizes.length >= 2) {
      const timeGrowth = maxTime / (minTime || 0.001);
      const sizeGrowth = maxSize / (minSize || 1);
      paragraph += `When scaling from n=${minSize} to n=${maxSize} (${sizeGrowth.toFixed(1)}x growth), execution time grows from ${this.formatTime(minTime)} to ${this.formatTime(maxTime)} (${timeGrowth.toFixed(1)}x increase). `;
    }

    const improvementSuggestions: Record<string, string> = {
      'O(n²)': 'This can potentially be improved using divide-and-conquer strategies, hash maps, or sorting-based approaches to achieve O(n log n) or even O(n).',
      'O(n³)': 'This cubic complexity is a strong candidate for optimization. Consider matrix decomposition, dynamic programming, or reducing nested iterations.',
      'O(2^n)': 'This exponential complexity is unsustainable for large inputs. Memoization, dynamic programming, or greedy approximations could dramatically reduce this.',
      'O(n log n)': 'This is already efficient for comparison-based problems. Further gains might come from cache optimization or parallel processing.',
      'O(n)': 'This is already linear and generally optimal. Micro-optimizations (loop unrolling, memory layout) could provide marginal improvements.',
      'O(log n)': 'This is already highly efficient. Further optimization is rarely necessary.',
      'O(1)': 'This is constant time and already optimal in terms of complexity.',
    };

    paragraph += `\n\n**Complexity Analysis:** The empirical analysis estimates this algorithm as **${complexity.estimatedClass}** (confidence: ${(complexity.confidence * 100).toFixed(1)}%). `;
    paragraph += `${complexity.explanation} `;
    paragraph += improvementSuggestions[complexity.estimatedClass] || '';

    return paragraph;
  }

  private formatTime(ms: number): string {
    if (ms < 0.001) return `${(ms * 1000000).toFixed(2)}ns`;
    if (ms < 1) return `${(ms * 1000).toFixed(2)}μs`;
    if (ms < 1000) return `${ms.toFixed(2)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  }

  private truncate(str: string, maxLen: number): string {
    if (str.length <= maxLen) return str;
    return str.substring(0, maxLen - 3) + '...';
  }
}
