export interface OptimizedVersion {
  name: string;
  code: string;
  description: string;
  optimizationType: string;
  expectedImprovement?: string;
}

export interface CodeAnalysis {
  suggestions: string[];
  optimizedVersions: OptimizedVersion[];
  complexity: {
    time: string;
    space: string;
    notes: string;
  };
}

export class CodeOptimizer {
  analyzeCode(code: string, functionName: string): CodeAnalysis {
    const suggestions: string[] = [];
    const optimizedVersions: OptimizedVersion[] = [];
    const codeLower = code.toLowerCase();

    // Detect nested loops (O(n²) or worse)
    const nestedLoopPattern = /for\s*\([^)]*\)\s*\{[^}]*for\s*\([^)]*\)\s*\{/;
    if (nestedLoopPattern.test(code)) {
      suggestions.push('Nested loops detected - consider using hash maps or sorting to reduce complexity');
      
      // Try to generate optimized version with hash map
      const hashOptimized = this.optimizeWithHashMap(code, functionName);
      if (hashOptimized) {
        optimizedVersions.push({
          name: `${functionName} (Hash Map Optimized)`,
          code: hashOptimized,
          description: 'Uses hash map to reduce nested loop complexity from O(n²) to O(n)',
          optimizationType: 'complexity_reduction',
          expectedImprovement: '50-90% faster for large inputs'
        });
      }
    }

    // Detect array.filter().map() chains
    if (code.includes('.filter(') && code.includes('.map(')) {
      suggestions.push('Multiple array iterations detected - combine filter and map operations');
      
      const combined = this.combineArrayOperations(code, functionName);
      if (combined) {
        optimizedVersions.push({
          name: `${functionName} (Combined Operations)`,
          code: combined,
          description: 'Combines filter and map into single reduce operation',
          optimizationType: 'iteration_reduction',
          expectedImprovement: '20-40% faster'
        });
      }
    }

    // Detect array.slice() or array spread in loops
    if (code.includes('slice(') || code.includes('...')) {
      const inLoop = /(for|while)\s*\([^)]*\)\s*\{[^}]*\.(slice|\.\.\.)/.test(code);
      if (inLoop) {
        suggestions.push('Array copying in loops detected - avoid unnecessary array operations');
        
        const optimized = this.removeUnnecessaryCopies(code, functionName);
        if (optimized) {
          optimizedVersions.push({
            name: `${functionName} (No Unnecessary Copies)`,
            code: optimized,
            description: 'Removes unnecessary array copies in loops',
            optimizationType: 'memory_optimization',
            expectedImprovement: '10-30% faster, lower memory usage'
          });
        }
      }
    }

    // Detect recursive calls without memoization
    if (code.includes(functionName) && /function\s+\w+.*\{[\s\S]*\b\w+\s*\(/.test(code)) {
      const recursivePattern = new RegExp(`\\b${functionName}\\s*\\(`);
      if (recursivePattern.test(code)) {
        suggestions.push('Recursive function detected - consider memoization for repeated calculations');
        
        const memoized = this.addMemoization(code, functionName);
        if (memoized) {
          optimizedVersions.push({
            name: `${functionName} (Memoized)`,
            code: memoized,
            description: 'Adds memoization to cache recursive results',
            optimizationType: 'memoization',
            expectedImprovement: 'Exponential speedup for repeated subproblems'
          });
        }
      }
    }

    // Detect string concatenation in loops
    if (code.includes('+=') || (code.includes('+') && /(for|while)\s*\([^)]*\)\s*\{[^}]*\+/.test(code))) {
      suggestions.push('String concatenation in loops detected - use array.join() for better performance');
      
      const optimized = this.optimizeStringConcatenation(code, functionName);
      if (optimized) {
        optimizedVersions.push({
          name: `${functionName} (String Builder)`,
          code: optimized,
          description: 'Uses array.join() instead of string concatenation',
          optimizationType: 'string_optimization',
          expectedImprovement: '30-70% faster for large strings'
        });
      }
    }

    // Detect Math.max/Math.min in loops
    if (code.includes('Math.max') || code.includes('Math.min')) {
      const inLoop = /(for|while)\s*\([^)]*\)\s*\{[^}]*Math\.(max|min)/.test(code);
      if (inLoop) {
        suggestions.push('Math.max/min in loops - consider tracking min/max with variables');
        
        const optimized = this.optimizeMathOperations(code, functionName);
        if (optimized) {
          optimizedVersions.push({
            name: `${functionName} (Optimized Math)`,
            code: optimized,
            description: 'Replaces Math.max/min with direct comparisons',
            optimizationType: 'math_optimization',
            expectedImprovement: '5-15% faster'
          });
        }
      }
    }

    // Detect inefficient array operations
    if (code.includes('.indexOf(') && /(for|while)\s*\([^)]*\)\s*\{[^}]*\.indexOf/.test(code)) {
      suggestions.push('indexOf in loops detected - use Set or Map for O(1) lookups');
      
      const optimized = this.optimizeArrayLookups(code, functionName);
      if (optimized) {
        optimizedVersions.push({
          name: `${functionName} (Set Lookup)`,
          code: optimized,
          description: 'Uses Set for O(1) lookups instead of O(n) indexOf',
          optimizationType: 'lookup_optimization',
          expectedImprovement: '50-90% faster for large arrays'
        });
      }
    }

    // Analyze complexity
    const complexity = this.analyzeComplexity(code);

    return {
      suggestions,
      optimizedVersions,
      complexity
    };
  }

  private optimizeWithHashMap(code: string, functionName: string): string | null {
    // Only generate if we can extract a valid function signature
    // Don't generate placeholder code - skip if we can't create real executable code
    return null; // Skip for now - would need AST parsing for real optimization
  }

  private combineArrayOperations(code: string, functionName: string): string | null {
    // Skip - would need AST parsing to properly combine operations
    return null;
  }

  private removeUnnecessaryCopies(code: string, functionName: string): string | null {
    // Skip - would need AST parsing to properly remove copies
    return null;
  }

  private addMemoization(code: string, functionName: string): string | null {
    // Only generate memoization if we can detect recursive calls and extract the logic
    // For now, skip to avoid placeholder code
    return null;
  }

  private optimizeStringConcatenation(code: string, functionName: string): string | null {
    // Skip - would need AST parsing to properly optimize string concatenation
    return null;
  }

  private optimizeMathOperations(code: string, functionName: string): string | null {
    // Skip - would need AST parsing to properly optimize math operations
    return null;
  }

  private optimizeArrayLookups(code: string, functionName: string): string | null {
    // Skip - would need AST parsing to properly optimize lookups
    return null;
  }

  private analyzeComplexity(code: string): { time: string; space: string; notes: string } {
    const hasNestedLoops = /for\s*\([^)]*\)\s*\{[^}]*for\s*\([^)]*\)\s*\{/.test(code);
    const hasRecursion = /function\s+\w+.*\{[\s\S]*\b\w+\s*\(/.test(code);
    const hasSort = code.includes('.sort(');
    const hasIndexOf = code.includes('.indexOf(');
    
    let time = 'O(n)';
    let space = 'O(1)';
    const notes: string[] = [];

    if (hasNestedLoops) {
      time = 'O(n²)';
      notes.push('Nested loops detected');
    }
    
    if (hasRecursion) {
      time = 'O(2^n) or better';
      notes.push('Recursive implementation');
    }
    
    if (hasSort) {
      time = 'O(n log n)';
      notes.push('Uses sorting');
    }

    if (hasIndexOf && /(for|while)\s*\([^)]*\)\s*\{[^}]*\.indexOf/.test(code)) {
      time = 'O(n²)';
      notes.push('indexOf in loops');
    }

    if (code.includes('new Array') || (code.includes('[]') && code.includes('push'))) {
      space = 'O(n)';
      notes.push('Creates new arrays');
    }

    if (code.includes('Map') || code.includes('Set')) {
      space = 'O(n)';
      notes.push('Uses hash structures');
    }

    return {
      time,
      space,
      notes: notes.join('; ')
    };
  }

  generateOptimizedImplementation(
    originalCode: string,
    functionName: string,
    optimizationType: string
  ): string | null {
    const analysis = this.analyzeCode(originalCode, functionName);
    const optimized = analysis.optimizedVersions.find(v => 
      v.optimizationType === optimizationType
    );
    return optimized?.code || null;
  }
}
