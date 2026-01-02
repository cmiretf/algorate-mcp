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

      const functionPatterns = [
        // Function declarations: function name(...) { ... }
        /function\s+(\w+)\s*\([^)]*\)\s*\{[\s\S]*?\n(?=\}|function|const|let|var|export|import|$)/g,
        // Arrow functions: const name = (...) => { ... }
        /(?:const|let|var|export\s+(?:const|let|var)?)\s+(\w+)\s*=\s*(?:\([^)]*\)|[^=]+)\s*=>\s*\{[\s\S]*?\n(?=\}|const|let|var|export|import|function|$)/g,
        // Method definitions: name(...) { ... }
        /\b(\w+)\s*\([^)]*\)\s*\{[\s\S]*?\n(?=\}|[a-zA-Z_$]\w*\s*\(|$)/g,
      ];

      for (const pattern of functionPatterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          const functionName = match[1];
          const functionCode = match[0];
          const lineNumber = content
            .substring(0, match.index)
            .split("\n").length;

          if (this.isLikelyAlgorithm(functionName, functionCode)) {
            detected.push({
              name: this.generateAlgorithmName(functionName, filePath),
              code: this.extractFunctionCode(functionCode, functionName),
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

    // Check if name matches algorithm patterns
    const nameMatches = this.algorithmNamePatterns.some((pattern) =>
      pattern.test(name)
    );

    // Check if code contains algorithm keywords
    const hasKeywords = this.algorithmKeywords.some((keyword) =>
      codeLower.includes(keyword)
    );

    // Check if function has complexity indicators (loops, recursion)
    const hasComplexity = /(?:for|while|do\s*\{|recursive|recurse)/i.test(code);

    // Check if function is not a simple getter/setter
    const isNotSimple = !/^(get|set|is|has|can|should|will)[A-Z]/.test(name);

    return (nameMatches || hasKeywords) && hasComplexity && isNotSimple;
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
    // Try to extract just the function body
    const functionMatch = code.match(
      /function\s+\w+\s*\([^)]*\)\s*\{([\s\S]*)\}/
    );
    if (functionMatch) {
      return `function ${functionName}${functionMatch[0].substring(
        functionMatch[0].indexOf("(")
      )}`;
    }

    // For arrow functions, try to extract the body
    const arrowMatch = code.match(/(?:\([^)]*\)|[^=]+)\s*=>\s*\{([\s\S]*)\}/);
    if (arrowMatch) {
      return `function ${functionName}(input) {\n${arrowMatch[1]}\n}`;
    }

    // Fallback: return the full code
    return code;
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

