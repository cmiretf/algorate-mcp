import type { TestCase } from "../types/index.js";

export interface WorkloadConfig {
  sizes?: number[];
  inputType?: "array" | "string" | "number" | "object" | "custom";
  customGenerator?: (size: number) => unknown;
}

export class WorkloadGenerator {
  private readonly defaultSizes = [10, 100, 1000, 10000];

  generateWorkloads(baseName: string, config: WorkloadConfig = {}): TestCase[] {
    const sizes = config.sizes || this.defaultSizes;
    const inputType = config.inputType || "array";
    const testCases: TestCase[] = [];

    for (const size of sizes) {
      const input = this.generateInput(size, inputType, config.customGenerator);
      const expectedOutput = this.generateExpectedOutput(input, inputType);

      testCases.push({
        id: this.generateId(),
        name: `${baseName} - Size ${size}`,
        inputSize: size,
        inputType,
        input,
        expectedOutput,
        description: `Test case with ${size} elements`,
      });
    }

    return testCases;
  }

  private generateInput(
    size: number,
    inputType: TestCase["inputType"],
    customGenerator?: (size: number) => unknown
  ): unknown {
    if (customGenerator) {
      return customGenerator(size);
    }

    switch (inputType) {
      case "array":
        return this.generateArray(size);
      case "string":
        return this.generateString(size);
      case "number":
        return size;
      case "object":
        return this.generateObject(size);
      default:
        return this.generateArray(size);
    }
  }

  private generateArray(size: number): number[] {
    return Array.from({ length: size }, () =>
      Math.floor(Math.random() * 10000)
    );
  }

  private generateString(size: number): string {
    const chars =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    return Array.from(
      { length: size },
      () => chars[Math.floor(Math.random() * chars.length)]
    ).join("");
  }

  private generateObject(size: number): Record<string, unknown> {
    const obj: Record<string, unknown> = {};
    for (let i = 0; i < size; i++) {
      obj[`key${i}`] = Math.floor(Math.random() * 1000);
    }
    return obj;
  }

  private generateExpectedOutput(
    input: unknown,
    inputType: TestCase["inputType"]
  ): unknown | undefined {
    // For sorting algorithms, generate expected sorted output
    if (inputType === "array" && Array.isArray(input)) {
      return [...(input as number[])].sort((a, b) => a - b);
    }

    // For other types, we can't easily predict the output
    return undefined;
  }

  generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  generateWorkloadsForCategory(category: string, baseName: string): TestCase[] {
    switch (category.toLowerCase()) {
      case "sorting":
        return this.generateWorkloads(baseName, {
          inputType: "array",
          sizes: [10, 100, 1000, 5000, 10000],
        });

      case "search":
        return this.generateWorkloads(baseName, {
          inputType: "array",
          sizes: [100, 1000, 10000, 100000],
        });

      case "graph":
        return this.generateWorkloads(baseName, {
          inputType: "object",
          sizes: [10, 50, 100, 500],
          customGenerator: (size) => this.generateGraphData(size),
        });

      case "tree":
        return this.generateWorkloads(baseName, {
          inputType: "array",
          sizes: [10, 100, 1000, 5000],
        });

      case "hashing":
        return this.generateWorkloads(baseName, {
          inputType: "string",
          sizes: [10, 100, 1000, 10000],
        });

      default:
        return this.generateWorkloads(baseName, {
          inputType: "array",
          sizes: [10, 100, 1000, 10000],
        });
    }
  }

  private generateGraphData(size: number): Record<string, unknown> {
    const nodes = Array.from({ length: size }, (_, i) => i);
    const edges: Array<[number, number]> = [];

    // Create a connected graph
    for (let i = 0; i < size - 1; i++) {
      edges.push([i, i + 1]);
    }

    // Add some random edges
    const additionalEdges = Math.floor(size * 0.1);
    for (let i = 0; i < additionalEdges; i++) {
      const from = Math.floor(Math.random() * size);
      const to = Math.floor(Math.random() * size);
      if (from !== to) {
        edges.push([from, to]);
      }
    }

    return {
      nodes,
      edges,
      size,
    };
  }
}

