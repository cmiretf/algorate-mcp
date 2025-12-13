/**
 * Complete sorting algorithm benchmark example
 */

import { Orchestrator } from "../dist/core/orchestrator.js";

async function sortingBenchmark() {
  const orchestrator = new Orchestrator();

  console.log("🧪 Sorting Algorithm Benchmark\n");

  // Register sorting algorithm
  const algo = orchestrator.registerAlgorithm(
    "Array Sorting",
    "Compare different sorting implementations",
    "sorting"
  );
  console.log("✓ Algorithm registered:", algo.name);

  // Register bubble sort implementation
  const bubbleSort = orchestrator.registerImplementation(
    algo.id,
    "Bubble Sort",
    "javascript",
    `function bubbleSort(arr) {
      const result = [...arr];
      for (let i = 0; i < result.length; i++) {
        for (let j = 0; j < result.length - i - 1; j++) {
          if (result[j] > result[j + 1]) {
            [result[j], result[j + 1]] = [result[j + 1], result[j]];
          }
        }
      }
      return result;
    }`,
    "bubbleSort",
    "Classic O(n²) sorting algorithm"
  );
  console.log("✓ Bubble Sort registered");

  // Register quick sort implementation
  const quickSort = orchestrator.registerImplementation(
    algo.id,
    "Quick Sort",
    "javascript",
    `function quickSort(arr) {
      if (arr.length <= 1) return arr;
      const pivot = arr[Math.floor(arr.length / 2)];
      const left = arr.filter(x => x < pivot);
      const middle = arr.filter(x => x === pivot);
      const right = arr.filter(x => x > pivot);
      return [...quickSort(left), ...middle, ...quickSort(right)];
    }`,
    "quickSort",
    "Efficient O(n log n) divide-and-conquer algorithm"
  );
  console.log("✓ Quick Sort registered");

  // Register native sort implementation
  const nativeSort = orchestrator.registerImplementation(
    algo.id,
    "Native Sort",
    "javascript",
    `function nativeSort(arr) {
      return [...arr].sort((a, b) => a - b);
    }`,
    "nativeSort",
    "JavaScript built-in sort method"
  );
  console.log("✓ Native Sort registered\n");

  // Create test cases with different sizes
  const testCases = [
    {
      name: "Small Array (10 elements)",
      size: 10,
      data: [64, 34, 25, 12, 22, 11, 90, 88, 45, 50],
      expected: [11, 12, 22, 25, 34, 45, 50, 64, 88, 90],
    },
    {
      name: "Medium Array (100 elements)",
      size: 100,
      data: Array.from({ length: 100 }, () => Math.floor(Math.random() * 1000)),
      expected: null, // Will be calculated
    },
  ];

  // Calculate expected output for medium array
  testCases[1].expected = [...testCases[1].data].sort((a, b) => a - b);

  const registeredTests = testCases.map((tc) =>
    orchestrator.registerTestCase(
      tc.name,
      tc.size,
      "array",
      tc.data,
      tc.expected,
      `Test case with ${tc.size} random numbers`
    )
  );

  console.log(
    "✓ Test cases registered:",
    testCases.map((t) => t.name).join(", ")
  );
  console.log("\n" + "=".repeat(60) + "\n");

  // Run benchmarks for each test case
  for (const testCase of registeredTests) {
    console.log(`📊 Running benchmark: ${testCase.name}\n`);

    const result = await orchestrator.runBenchmark(algo.id, testCase.id, {
      warmupRuns: 2,
      measurementRuns: 5,
      timeoutMs: 10000,
      validateOutput: true,
      collectMemoryMetrics: true,
      isolateExecutions: false,
    });

    console.log("Results:\n");

    // Display results for each implementation
    result.implementations.forEach((impl, idx) => {
      console.log(
        `${idx + 1}. ${
          impl.implementationId === bubbleSort.id
            ? "Bubble Sort"
            : impl.implementationId === quickSort.id
            ? "Quick Sort"
            : "Native Sort"
        }`
      );
      console.log(
        `   ✓ Success rate: ${impl.successfulRuns}/${impl.totalRuns}`
      );
      console.log(`   ⏱️  Avg time: ${impl.executionTime.mean.toFixed(4)} ms`);
      console.log(`   📈 Std dev: ${impl.executionTime.stdDev.toFixed(4)} ms`);
      console.log(
        `   💾 Memory: ${(impl.memoryPeak.mean / 1024).toFixed(2)} KB`
      );
      console.log("");
    });

    // Display ranking
    console.log("🏆 Ranking:");
    result.ranking.forEach((r) => {
      const implName =
        r.implementationId === bubbleSort.id
          ? "Bubble Sort"
          : r.implementationId === quickSort.id
          ? "Quick Sort"
          : "Native Sort";
      console.log(`   ${r.rank}. ${implName} (score: ${r.score.toFixed(4)})`);
    });

    console.log("\n💡 Insights:");
    result.insights.forEach((insight) => {
      console.log(`   • ${insight}`);
    });

    console.log("\n" + "=".repeat(60) + "\n");
  }

  console.log("✅ Benchmark completed!\n");
}

sortingBenchmark().catch(console.error);
