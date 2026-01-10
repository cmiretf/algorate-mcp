import { readdir, readFile, stat } from "fs/promises";
import { join, extname } from "path";
import type { Algorithm, Implementation } from "../types/index.js";

export interface DetectedAlgorithm {
  name: string;
  code: string;
  entryFunction: string;
  language: string;
  filePath: string;
  lineNumber: number;
  description?: string;
  category?: string;
}

export interface DetectionOptions {
  directories?: string[];
  filePath?: string; // Specific file to analyze
  includePatterns?: string[];
  excludePatterns?: string[];
}

export class AlgorithmDetector {
  private readonly algorithmKeywords = [
    "sort",
    "search",
    "find",
    "traverse",
    "iterate",
    "recursive",
    "binary",
    "linear",
    "hash",
    "tree",
    "graph",
    "queue",
    "stack",
    "merge",
    "quick",
    "bubble",
    "insertion",
    "selection",
    "heap",
    "dijkstra",
    "bfs",
    "dfs",
    "dynamic",
    "greedy",
    "backtrack",
  ];

  private readonly algorithmNamePatterns = [
    /^(sort|search|find|traverse|iterate|compute|calculate|process|solve|optimize)/i,
    /(algorithm|algo|solver|processor)$/i,
    /(binary|linear|hash|tree|graph|queue|stack)/i,
  ];

  async detectAlgorithms(
    options: DetectionOptions = {}
  ): Promise<DetectedAlgorithm[]> {
    // If specific file path provided, only analyze that file
    if (options.filePath) {
      try {
        return await this.detectInFile(options.filePath);
      } catch (error) {
        console.error(`Error analyzing file ${options.filePath}:`, error);
        return [];
      }
    }

    const directories = options.directories || ["src", "examples"];
    const includePatterns = options.includePatterns || [".js", ".ts"];
    const excludePatterns = options.excludePatterns || [
      "node_modules",
      "dist",
      ".test.",
      ".spec.",
    ];

    const detected: DetectedAlgorithm[] = [];

    for (const dir of directories) {
      const algorithms = await this.scanDirectory(
        dir,
        includePatterns,
        excludePatterns
      );
      detected.push(...algorithms);
    }

    return detected;
  }

  private async scanDirectory(
    dir: string,
    includePatterns: string[],
    excludePatterns: string[]
  ): Promise<DetectedAlgorithm[]> {
    const detected: DetectedAlgorithm[] = [];

    try {
      const entries = await readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dir, entry.name);

        if (entry.isDirectory()) {
          if (
            !excludePatterns.some((pattern) => entry.name.includes(pattern))
          ) {
            const subAlgorithms = await this.scanDirectory(
              fullPath,
              includePatterns,
              excludePatterns
            );
            detected.push(...subAlgorithms);
          }
        } else if (entry.isFile()) {
          const ext = extname(entry.name);
          if (includePatterns.includes(ext)) {
            if (
              !excludePatterns.some((pattern) => entry.name.includes(pattern))
            ) {
              const algorithms = await this.detectInFile(fullPath);
              detected.push(...algorithms);
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${dir}:`, error);
    }

    return detected;
  }

  private async detectInFile(filePath: string): Promise<DetectedAlgorithm[]> {
    try {
      const content = await readFile(filePath, "utf-8");
      const detected: DetectedAlgorithm[] = [];

      // Track if we're inside a string to avoid detecting functions in strings
      const isInString = (index: number): boolean => {
        let inString = false;
        let stringChar = '';
        let i = 0;
        while (i < index) {
          const char = content[i];
          const prevChar = i > 0 ? content[i - 1] : '';
          
          if (!inString && (char === '"' || char === "'" || char === '`')) {
            inString = true;
            stringChar = char;
          } else if (inString && char === stringChar && prevChar !== '\\') {
            inString = false;
          }
          i++;
        }
        return inString;
      };

      // Extract standalone function declarations (not class methods, not in strings)
      const standaloneFunctionPattern = /function\s+(\w+)\s*\([^)]*\)\s*\{/g;
      let match;
      
      while ((match = standaloneFunctionPattern.exec(content)) !== null) {
        // Skip if inside a string
        if (isInString(match.index)) continue;
        
        const functionName = match[1];
        const startIndex = match.index;
        
        // Extract complete function body by counting braces
        let braceCount = 0;
        let inString = false;
        let stringChar = '';
        let i = startIndex;
        
        // Find the opening brace
        while (i < content.length && content[i] !== '{') i++;
        if (i >= content.length) continue;
        
        braceCount = 1;
        i++;
        
        // Find matching closing brace
        while (i < content.length && braceCount > 0) {
          const char = content[i];
          const prevChar = i > 0 ? content[i - 1] : '';
          
          // Handle string literals
          if (!inString && (char === '"' || char === "'" || char === '`')) {
            inString = true;
            stringChar = char;
          } else if (inString && char === stringChar && prevChar !== '\\') {
            inString = false;
          }
          
          if (!inString) {
            if (char === '{') braceCount++;
            if (char === '}') braceCount--;
          }
          i++;
        }
        
        if (braceCount === 0) {
          const functionCode = content.substring(startIndex, i);
          
          if (this.isLikelyAlgorithm(functionName, functionCode)) {
            const lineNumber = content.substring(0, startIndex).split("\n").length;
            const extractedCode = this.extractFunctionCode(functionCode, functionName);
            
            detected.push({
              name: this.generateAlgorithmName(functionName, filePath),
              code: extractedCode,
              entryFunction: functionName,
              language: filePath.endsWith(".ts") ? "typescript" : "javascript",
              filePath,
              lineNumber,
              description: this.generateDescription(functionName, functionCode),
              category: this.detectCategory(functionName, functionCode),
            });
          }
        }
      }

      // Also extract arrow functions assigned to const/let/var (standalone, not in strings)
      const arrowFunctionPattern = /(?:^|\n)(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:\([^)]*\)|(\w+))\s*=>\s*\{/gm;
      while ((match = arrowFunctionPattern.exec(content)) !== null) {
        // Skip if inside a string
        if (isInString(match.index)) continue;
        
        const functionName = match[1] || match[2];
        if (!functionName) continue;
        
        const startIndex = match.index;
        const arrowIndex = match[0].indexOf('=>');
        let braceCount = 0;
        let inString = false;
        let stringChar = '';
        let i = startIndex + arrowIndex;
        
        // Find the opening brace
        while (i < content.length && content[i] !== '{') i++;
        if (i >= content.length) continue;
        
        braceCount = 1;
        i++;
        
        // Find matching closing brace
        while (i < content.length && braceCount > 0) {
          const char = content[i];
          const prevChar = i > 0 ? content[i - 1] : '';
          
          if (!inString && (char === '"' || char === "'" || char === '`')) {
            inString = true;
            stringChar = char;
          } else if (inString && char === stringChar && prevChar !== '\\') {
            inString = false;
          }
          
          if (!inString) {
            if (char === '{') braceCount++;
            if (char === '}') braceCount--;
          }
          i++;
        }
        
        if (braceCount === 0) {
          const functionCode = content.substring(startIndex, i);
          
          if (this.isLikelyAlgorithm(functionName, functionCode)) {
            const lineNumber = content.substring(0, startIndex).split("\n").length;
            const extractedCode = this.extractFunctionCode(functionCode, functionName);
            
            detected.push({
              name: this.generateAlgorithmName(functionName, filePath),
              code: extractedCode,
              entryFunction: functionName,
              language: filePath.endsWith(".ts") ? "typescript" : "javascript",
              filePath,
              lineNumber,
              description: this.generateDescription(functionName, functionCode),
              category: this.detectCategory(functionName, functionCode),
            });
          }
        }
      }

      return detected;
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
      return [];
    }
  }

  private isLikelyAlgorithm(name: string, code: string): boolean {
    const nameLower = name.toLowerCase();
    const codeLower = code.toLowerCase();

    // Exclude main/setup functions
    const excludedNames = [
      'main', 'init', 'setup', 'run', 'start', 'execute', 'benchmark',
      'test', 'describe', 'it', 'before', 'after', 'beforeEach', 'afterEach'
    ];
    
    if (excludedNames.includes(nameLower)) {
      return false;
    }

    // Exclude class methods, constructors, and internal methods
    const excludedPatterns = [
      /^(constructor|__dirname|__filename)$/i,
      /^(get|set|is|has|can|should|will|to|from|parse|stringify|create|build|init|setup|teardown|cleanup)[A-Z]/,
      /^(private|public|protected|static)\s+/,
      /^_(internal|private|helper|util)/i,
      /^(on|off|emit|add|remove|clear|update|delete|save|load|find|list|get|set)[A-Z]/,
      /^(console|log|error|warn|info|debug)/i,
    ];

    if (excludedPatterns.some(pattern => pattern.test(name))) {
      return false;
    }

    // Exclude async functions that are main/setup functions (usually have orchestrator, console.log, etc.)
    if (code.includes('async') && (
      code.includes('orchestrator') || 
      code.includes('console.log') || 
      code.includes('console.') ||
      code.includes('registerAlgorithm') ||
      code.includes('registerImplementation') ||
      code.includes('runBenchmark') ||
      code.includes('registerTestCase') ||
      code.includes('listAlgorithms') ||
      code.includes('listImplementations') ||
      code.match(/\.catch\(/) ||
      code.match(/\.then\(/)))
    {
      return false;
    }

    // Exclude functions that are clearly setup/main functions (have multiple console.logs, orchestrator calls, etc.)
    const setupIndicators = [
      'orchestrator',
      'registerAlgorithm',
      'registerImplementation', 
      'registerTestCase',
      'runBenchmark',
      'listAlgorithms',
      'listImplementations',
      'formatBenchmarkOutput',
      'console.log',
      'console.error',
      'console.warn'
    ];
    
    const setupIndicatorCount = setupIndicators.filter(indicator => 
      codeLower.includes(indicator.toLowerCase())
    ).length;
    
    // If function has 2+ setup indicators, it's likely a setup function
    if (setupIndicatorCount >= 2) {
      return false;
    }

    // Exclude if it's a class method (has 'this.' in code but not a standalone function)
    if (code.includes('this.') && !code.match(/^function\s+\w+\s*\(/)) {
      return false;
    }

    // Exclude functions that are just wrappers or have no algorithm logic
    if (code.split('\n').length < 5) {
      return false;
    }

    // Check if name matches algorithm patterns
    const nameMatches = this.algorithmNamePatterns.some((pattern) =>
      pattern.test(name)
    );

    // Check if code contains algorithm keywords
    const hasKeywords = this.algorithmKeywords.some((keyword) =>
      codeLower.includes(keyword)
    );

    // Check if function has complexity indicators (loops, recursion, conditionals with logic)
    const hasComplexity = /(?:for|while|do\s*\{|recursive|recurse|if\s*\([^)]+\)\s*\{[^}]{10,})/i.test(code);

    // Must return a value or have side effects that suggest algorithm logic
    const hasReturnOrLogic = /return\s+/.test(code) || hasComplexity;

    // Must have actual algorithm logic (not just setup/teardown)
    const hasAlgorithmLogic = hasComplexity && (hasReturnOrLogic || hasKeywords);

    return (nameMatches || hasKeywords) && hasAlgorithmLogic;
  }

  private generateAlgorithmName(
    functionName: string,
    filePath: string
  ): string {
    const fileName =
      filePath
        .split("/")
        .pop()
        ?.replace(/\.(js|ts)$/, "") || "";
    const capitalized =
      functionName.charAt(0).toUpperCase() + functionName.slice(1);
    return `${capitalized} (${fileName})`;
  }

  private extractFunctionCode(code: string, functionName: string): string {
    // Extract function declaration: function name(...) { ... }
    const functionMatch = code.match(/function\s+(\w+)\s*(\([^)]*\))\s*\{([\s\S]*)\}/);
    if (functionMatch) {
      const params = functionMatch[2];
      const body = functionMatch[3];
      return `function ${functionName}${params} {\n${body}\n}`;
    }

    // Extract arrow function: const name = (...) => { ... }
    const arrowMatch = code.match(/(?:const|let|var)\s+\w+\s*=\s*(\([^)]*\)|[^=]+)\s*=>\s*\{([\s\S]*)\}/);
    if (arrowMatch) {
      const params = arrowMatch[1].startsWith('(') ? arrowMatch[1] : `(${arrowMatch[1]})`;
      const body = arrowMatch[2];
      return `function ${functionName}${params} {\n${body}\n}`;
    }

    // Fallback: try to extract function signature and body
    const fallbackMatch = code.match(/(\w+)\s*(\([^)]*\))\s*\{([\s\S]*)\}/);
    if (fallbackMatch) {
      const params = fallbackMatch[2];
      const body = fallbackMatch[3];
      return `function ${functionName}${params} {\n${body}\n}`;
    }

    // Last resort: return as-is but ensure it's a function
    if (code.includes('function') || code.includes('=>')) {
      return code;
    }

    // If nothing matches, wrap it as a function
    return `function ${functionName}(input) {\n${code}\n}`;
  }

  private generateDescription(name: string, code: string): string {
    const nameLower = name.toLowerCase();
    const codeLower = code.toLowerCase();

    if (nameLower.includes("sort")) {
      return "Sorting algorithm";
    }
    if (nameLower.includes("search") || nameLower.includes("find")) {
      return "Search algorithm";
    }
    if (nameLower.includes("traverse") || codeLower.includes("traverse")) {
      return "Traversal algorithm";
    }
    if (codeLower.includes("recursive") || codeLower.includes("recurse")) {
      return "Recursive algorithm";
    }
    if (codeLower.includes("dynamic") || codeLower.includes("memo")) {
      return "Dynamic programming algorithm";
    }

    return `Algorithm implementation: ${name}`;
  }

  private detectCategory(name: string, code: string): string {
    const nameLower = name.toLowerCase();
    const codeLower = code.toLowerCase();

    if (nameLower.includes("sort") || codeLower.includes("sort")) {
      return "sorting";
    }
    if (
      nameLower.includes("search") ||
      nameLower.includes("find") ||
      codeLower.includes("binary") ||
      codeLower.includes("linear")
    ) {
      return "search";
    }
    if (
      codeLower.includes("graph") ||
      codeLower.includes("node") ||
      codeLower.includes("edge")
    ) {
      return "graph";
    }
    if (
      codeLower.includes("tree") ||
      codeLower.includes("bst") ||
      codeLower.includes("binary tree")
    ) {
      return "tree";
    }
    if (
      codeLower.includes("hash") ||
      codeLower.includes("map") ||
      codeLower.includes("dictionary")
    ) {
      return "hashing";
    }

    return "general";
  }

  convertToImplementation(
    detected: DetectedAlgorithm,
    algorithmId: string
  ): Omit<Implementation, "id" | "createdAt"> {
    return {
      algorithmId,
      name: detected.name,
      language: detected.language,
      code: detected.code,
      entryFunction: detected.entryFunction,
      description: detected.description,
    };
  }
}

