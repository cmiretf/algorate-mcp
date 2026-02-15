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
    const sections: string[] = [];

    sections.push(`## 📊 Analysis: ${data.algorithmName}\n`);
    sections.push(this.buildInputOutputSection(data));
    sections.push(this.buildComplexitySection(data));

    return sections.join('\n');
  }

  formatCompactSummary(data: AnalysisInput): string {
    const { algorithmName, complexity, testSizes, timings } = data;
    const minSize = Math.min(...testSizes);
    const maxSize = Math.max(...testSizes);
    const minTime = timings[0];
    const maxTime = timings[timings.length - 1];

    return [
      `**${algorithmName}** → ${complexity.estimatedClass} (${(complexity.confidence * 100).toFixed(0)}% confidence)`,
      `n=${minSize}: ${this.formatTime(minTime)} → n=${maxSize}: ${this.formatTime(maxTime)}`,
      this.getVerdict(complexity.estimatedClass),
    ].join('\n');
  }

  private buildInputOutputSection(data: AnalysisInput): string {
    const { outputs, testSizes, timings, memoryUsages } = data;
    const lines: string[] = [];

    lines.push(`### 📊 Input/Output Analysis & Optimization\n`);

    if (outputs.length > 0) {
      lines.push(`**Concrete Examples:**\n`);
      const examples = outputs.slice(0, 4);
      for (const ex of examples) {
        const inputStr = this.truncate(this.formatValue(ex.input), 100);
        const outputStr = this.truncate(this.formatValue(ex.output), 100);
        lines.push(`- **Input** (n=${ex.size}): \`${inputStr}\``);
        lines.push(`  **Output**: \`${outputStr}\``);
      }
      lines.push('');
    }

    if (testSizes.length >= 2) {
      lines.push(`**Performance Scaling:**\n`);
      for (let i = 0; i < testSizes.length; i++) {
        const memStr = memoryUsages[i] > 0
          ? ` | Memory: ${this.formatMemory(memoryUsages[i])}`
          : '';
        lines.push(`- n=${testSizes[i]}: ${this.formatTime(timings[i])}${memStr}`);
      }
      lines.push('');

      const minTime = Math.min(...timings);
      const maxTime = Math.max(...timings);
      const minSize = Math.min(...testSizes);
      const maxSize = Math.max(...testSizes);
      const timeGrowth = maxTime / (minTime || 0.001);
      const sizeGrowth = maxSize / (minSize || 1);

      lines.push(`When scaling from **n=${minSize}** to **n=${maxSize}** (${sizeGrowth.toFixed(0)}x input growth), execution time increases from **${this.formatTime(minTime)}** to **${this.formatTime(maxTime)}** (${timeGrowth.toFixed(1)}x slower).`);
      lines.push('');
    }

    lines.push(`**How to Improve:**\n`);
    lines.push(this.getImprovementSuggestions(data));
    lines.push('');

    return lines.join('\n');
  }

  private buildComplexitySection(data: AnalysisInput): string {
    const { complexity } = data;
    const lines: string[] = [];

    lines.push(`### ⚙️ Algorithmic Complexity\n`);
    lines.push(`- **Estimated Complexity**: ${complexity.estimatedClass}`);
    lines.push(`- **Confidence**: ${(complexity.confidence * 100).toFixed(1)}%`);
    lines.push(`- **Growth Pattern**: ${complexity.growthRate}`);
    lines.push('');
    lines.push(`${complexity.explanation}`);
    lines.push('');
    lines.push(`**Verdict:** ${this.getVerdict(complexity.estimatedClass)}`);

    return lines.join('\n');
  }

  private getVerdict(complexityClass: string): string {
    const verdicts: Record<string, string> = {
      'O(1)': '✅ Excellent — Constant time. This is the best possible complexity. No optimization needed.',
      'O(log n)': '✅ Excellent — Logarithmic. Highly scalable, handles millions of elements efficiently.',
      'O(n)': '✅ Good — Linear. Scales well for most real-world datasets. Optimal for problems requiring full data traversal.',
      'O(n log n)': '🟡 Acceptable — Linearithmic. Good for sorting/divide-and-conquer. Consider if a linear solution exists.',
      'O(n²)': '🔴 Needs Optimization — Quadratic. Will become slow with inputs > 10,000 elements. Refactoring recommended.',
      'O(n³)': '🔴 Critical — Cubic. Unsuitable for inputs > 1,000 elements. Significant refactoring required.',
      'O(2^n)': '🔴 Critical — Exponential. Only viable for very small inputs (n < 25). Must redesign algorithm.',
    };
    return verdicts[complexityClass] || '⚪ Unknown complexity pattern detected.';
  }

  private getImprovementSuggestions(data: AnalysisInput): string {
    const { complexity } = data;
    const suggestions: Record<string, string[]> = {
      'O(1)': [
        '- Already optimal in terms of time complexity.',
        '- Consider memory optimization if processing large objects.',
        '- Verify edge cases and error handling are robust.',
      ],
      'O(log n)': [
        '- Already highly efficient. Minor gains from bit manipulation or lookup tables.',
        '- Ensure the data structure supports efficient access (e.g., balanced trees).',
        '- Consider caching results for repeated queries with the same parameters.',
      ],
      'O(n)': [
        '- Check if early termination is possible when the answer is found.',
        '- Consider using typed arrays (Float64Array, Int32Array) for numeric data.',
        '- Evaluate if a hash-based approach (Map/Set) can reduce constant factors.',
        '- For I/O-bound operations, consider streaming or chunked processing.',
      ],
      'O(n log n)': [
        '- If sorting is the bottleneck, verify you\'re using the most efficient sort for your data type.',
        '- Consider counting sort or radix sort if values have a bounded range.',
        '- Check if the problem can be solved with a single linear pass using a different strategy.',
        '- Pre-sort data if it will be queried multiple times.',
      ],
      'O(n²)': [
        '- Replace nested loops with hash maps (Map/Set) for O(1) lookups, reducing to O(n).',
        '- Consider divide-and-conquer approaches to reduce to O(n log n).',
        '- Use sliding window or two-pointer techniques for contiguous subarray problems.',
        '- Evaluate if sorting first (O(n log n)) eliminates the need for inner iterations.',
        '- Consider spatial indexing (quadtree, k-d tree) for geometric/distance problems.',
      ],
      'O(n³)': [
        '- Apply dynamic programming with memoization to avoid redundant calculations.',
        '- Consider matrix exponentiation for path/reachability problems.',
        '- Use Strassen\'s algorithm or similar for matrix multiplication variants.',
        '- Reduce dimensionality: can one of the loops be eliminated with preprocessing?',
        '- Consider approximation algorithms if exact solutions are not required.',
      ],
      'O(2^n)': [
        '- Apply memoization or tabulation (dynamic programming) to cache subproblems.',
        '- Consider greedy or heuristic approaches for approximate solutions.',
        '- Use branch-and-bound with pruning to eliminate invalid branches early.',
        '- Evaluate if bitmask DP can reduce the search space.',
        '- For NP-hard problems, consider polynomial-time approximation schemes (PTAS).',
      ],
    };

    const items = suggestions[complexity.estimatedClass] || ['- Analyze the algorithm structure for optimization opportunities.'];
    return items.join('\n');
  }

  private formatValue(value: unknown): string {
    if (value === null || value === undefined) return 'null';
    if (Array.isArray(value)) {
      if (value.length <= 10) return JSON.stringify(value);
      return `[${value.slice(0, 5).join(', ')}, ... (${value.length} items)]`;
    }
    if (typeof value === 'object') {
      const str = JSON.stringify(value);
      if (str.length > 100) return str.substring(0, 97) + '...';
      return str;
    }
    return String(value);
  }

  private formatTime(ms: number): string {
    if (ms < 0.001) return `${(ms * 1000000).toFixed(2)}ns`;
    if (ms < 1) return `${(ms * 1000).toFixed(2)}μs`;
    if (ms < 1000) return `${ms.toFixed(2)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  }

  private formatMemory(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }

  private truncate(str: string, maxLen: number): string {
    if (str.length <= maxLen) return str;
    return str.substring(0, maxLen - 3) + '...';
  }
}
