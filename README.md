# Algorate MCP Server 📊

A Model Context Protocol (MCP) server for comprehensive algorithm benchmarking, performance analysis, and optimization. Compare multiple implementations, detect performance bottlenecks, and get AI-driven optimization insights across JavaScript, TypeScript, and Python code.

## 🚀 Quick Start

### Installation

Install globally via npm:

```bash
npm install -g @cmiretf/algorate
```

Or add to your project:

```bash
npm install @cmiretf/algorate
```

### Usage

#### With MCP Inspector

Test the server interactively:

```bash
npm install -g @cmiretf/algorate
npx @modelcontextprotocol/inspector algorate
```

Or if installed locally:

```bash
npx @modelcontextprotocol/inspector node node_modules/algorate/dist/index.js
```

#### With Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "algorate": {
      "command": "npx",
      "args": ["-y", "@cmiretf/algorate"]
    }
  }
}
```

Or with a local installation:

```json
{
  "mcpServers": {
    "algorate": {
      "command": "node",
      "args": ["/path/to/node_modules/algorate/dist/index.js"]
    }
  }
}
```

#### With Visual Studio Code / Cursor

Add to your `mcp.json`:

```json
{
  "servers": {
    "algorate": {
      "command": "npx",
      "args": ["-y", "@cmiretf/algorate"]
    }
  }
}
```

Or with a local installation:

```json
{
  "mcpServers": {
    "algorate": {
      "command": "node",
      "args": ["/path/to/node_modules/algorate/dist/index.js"]
    }
  }
}
```

## 🎯 Features

### Algorithm Registration & Management

- **Register Algorithms**: Define custom algorithms with unique identifiers
- **Multiple Implementations**: Compare 2+ implementations of the same algorithm
- **Language Support**: JavaScript, TypeScript, and Python
- **Automatic Detection**: AI-powered algorithm detection from code

### Performance Benchmarking

- **Execution Metrics**: Precise timing with warmup and measurement runs
- **Memory Profiling**: Track peak memory usage and memory trends
- **Statistical Analysis**: Mean, median, std deviation, P95, P99 percentiles
- **Consistency Tracking**: Identify variability and outliers

### Advanced Features

- **Workload Generation**: Automatic test data generation for different input sizes
- **Output Validation**: Ensure correctness across all implementations
- **Isolated Execution**: Worker-based isolation for accurate measurements
- **Result Storage**: Persistent storage of benchmarks with versioning
- **Performance Insights**: Automatic detection of performance patterns

### AI-Powered Analysis

- **Code Optimization**: Receive specific optimization recommendations
- **Performance Comparison**: Automated ranking and insights
- **Bottleneck Detection**: Identify slow operations and memory issues
- **Query Engine**: Natural language queries on benchmark results

## 📖 Available MCP Tools

### Core Benchmarking Tools

#### `register_algorithm`

Register a new algorithm for benchmarking.

**Parameters:**

- `name` (string): Algorithm name (e.g., "Sorting", "Searching")
- `description` (string, optional): Detailed description

**Example:**

```json
{
  "name": "QuickSort",
  "description": "Fast sorting algorithm using divide and conquer"
}
```

#### `register_implementation`

Add an implementation of an algorithm.

**Parameters:**

- `algorithmId` (string): ID of the algorithm
- `name` (string): Implementation name
- `language` (string): "javascript", "typescript", or "python"
- `code` (string): Function code
- `functionName` (string): Name of the exported function

#### `register_test_case`

Create a test case for benchmarking.

**Parameters:**

- `name` (string): Test case name
- `inputSize` (number): Size of input
- `inputType` (string): "array", "number", "string", "object"
- `inputData` (any): The actual input
- `expectedOutput` (any): Expected result for validation

#### `run_benchmark`

Execute a complete benchmark comparing implementations.

**Parameters:**

- `algorithmId` (string): Algorithm to benchmark
- `testCaseId` (string): Test case to use
- `options` (object):
  - `warmupRuns` (number): Warmup executions (default: 3)
  - `measurementRuns` (number): Measurement runs (default: 10)
  - `timeoutMs` (number): Timeout per execution (default: 5000)
  - `validateOutput` (boolean): Enable validation (default: true)
  - `isolateExecutions` (boolean): Worker isolation (default: true)

**Example:**

```json
{
  "algorithmId": "algo-123",
  "testCaseId": "test-456",
  "options": {
    "warmupRuns": 3,
    "measurementRuns": 10,
    "validateOutput": true,
    "isolateExecutions": true
  }
}
```

### Analysis & Insights Tools

#### `get_algorithm_insights`

Get AI-powered insights about algorithm performance.

**Parameters:**

- `algorithmId` (string): Algorithm to analyze

#### `optimize_code`

Receive specific optimization recommendations.

**Parameters:**

- `code` (string): Code to optimize
- `language` (string): "javascript", "typescript", or "python"
- `benchmarkResults` (object, optional): Previous benchmark results

#### `query_results`

Query benchmark results with natural language.

**Parameters:**

- `query` (string): Natural language question about results
- `algorithmId` (string, optional): Specific algorithm to query

#### `generate_summary`

Generate a comprehensive benchmark summary report.

**Parameters:**

- `algorithmId` (string): Algorithm to summarize
- `includeCharts` (boolean): Include visualization data

### Workload & Detection Tools

#### `generate_workload`

Generate test data for different input sizes.

**Parameters:**

- `type` (string): "random", "sorted", "reverse", "nearly_sorted"
- `size` (number): Input size
- `complexity` (string): "low", "medium", "high"

#### `detect_algorithm`

AI-powered algorithm detection from code.

**Parameters:**

- `code` (string): Code to analyze
- `language` (string): "javascript", "typescript", or "python"

## 📊 Metrics Explained

### Key Metrics

- **Execution Time (ms)**: Average time to run the algorithm
- **Memory Peak (MB)**: Maximum memory used during execution
- **Success Rate (%)**: Percentage of successful executions
- **Std Deviation (ms)**: Consistency of results (lower = better)
- **P95/P99**: Latency in worst-case scenarios

### Interpreting Results

- **Lower Score** = Better overall performance
- **Mean < Median** = Some slower outliers detected
- **High StdDev** = Inconsistent results (increase warmup runs)
- **High Success Rate** = Stable implementation

## 🛠️ Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

```bash

# Clone the repository

git clone <your-repo-url>
cd algorate

# Install dependencies

npm install

# Build the project

npm run build
```

### Development Commands

```bash

# Development with auto-reload

npm run dev

# Build TypeScript

npm run build

# Run built version

npm start

# Test with MCP Inspector (built version)

npm run inspect

# Test with MCP Inspector (dev version)

npm run inspect:dev

# Run examples

npm run example:simple
npm run example:sorting

# Run tests

npm test
```

## 🧪 Testing

Test the server interactively with the MCP Inspector:

```bash
npm run inspect
```

Or run the examples:

```bash

# Quick validation

npm run example:simple

# Complete benchmark with multiple implementations

npm run example:sorting
```

See TESTING_GUIDE.md for comprehensive testing instructions.

## 🔗 Integration Examples

### Git Hooks

Add to `.git/hooks/pre-commit`:

```bash
#!/bin/bash

# Run quick benchmark validation

npm run example:simple
```

### CI/CD

```yaml

# GitHub Actions example

- name: Run Algorithm Benchmarks
  run: |
  npm install
  npm run build
  npm test
  npm run example:sorting
```

## 📚 Documentation

- Testing Guide - Comprehensive testing and validation guide
- Inspector Guide - MCP Inspector usage and tips
- API Reference - Detailed tool documentation
- Examples - Code examples and usage patterns

## 💡 Use Cases

- **Algorithm Comparison**: Compare 2+ implementations objectively
- **Performance Regression**: Detect performance degradation in CI/CD
- **Code Optimization**: Get specific recommendations for improvement
- **Learning**: Understand algorithm performance characteristics
- **Benchmark Storage**: Track performance over time and versions
- **Team Standards**: Enforce performance baselines across teams

## 🌟 Supported Languages

- JavaScript (ES6+)
- TypeScript
- Python (3.7+)

## 🎨 Example Workflow

```typescript
import { Orchestrator } from "@cmiretf/algorate";

const orchestrator = new Orchestrator();

// 1. Register algorithm
const algo = orchestrator.registerAlgorithm("BubbleSort");

// 2. Register implementations
const impl1 = orchestrator.registerImplementation(
  algo.id,
  "Basic Implementation",
  "javascript",
  "function bubbleSort(arr) { /_ code _/ }",
  "bubbleSort"
);

const impl2 = orchestrator.registerImplementation(
  algo.id,
  "Optimized Implementation",
  "javascript",
  "function bubbleSortOptimized(arr) { /_ code _/ }",
  "bubbleSortOptimized"
);

// 3. Create test cases
const test = orchestrator.registerTestCase(
  "Random array 1000 elements",
  1000,
  "array",
  Array.from({ length: 1000 }, () => Math.random()),
  "sorted array"
);

// 4. Run benchmark
const result = await orchestrator.runBenchmark(algo.id, test.id, {
  warmupRuns: 3,
  measurementRuns: 10,
  validateOutput: true,
});

// 5. Get insights
const insights = await orchestrator.getAlgorithmInsights(algo.id);
console.log(insights); // Performance analysis and recommendations
```

## 🔍 Severity Levels

- **error**: Critical execution failures or validation errors
- **warning**: Performance anomalies or high variability
- **info**: Optimization suggestions and observations

## 📈 Performance Benchmarking Best Practices

1. **Warmup Runs**: Use 2-3 warmup runs to stabilize the JIT
2. **Measurement Runs**: 5-10 runs for reliable statistics
3. **Consistent Environment**: Close unnecessary applications
4. **Large Inputs**: Test with representative data sizes
5. **Validation**: Always validate correctness before measuring

See TESTING_GUIDE.md for detailed best practices.

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the **MIT License** - an open source license that allows you to use, modify, and distribute this software freely.

### What this means:

- ✅ **Free to use**: You can use this software in any project, commercial or personal
- ✅ **Open source**: The source code is publicly available and can be inspected, modified, and improved
- ✅ **Modify freely**: You can adapt the code to fit your specific needs
- ✅ **Distribute**: You can share the original or modified versions
- ✅ **Private use**: You can use it in proprietary projects without disclosing your source code

### License Text

Copyright (c) 2026 Carlos Miret Fiuza

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## 🌐 Supported Platforms

- Node.js 18+
- Deno (with appropriate configuration)
- Browser environments (with bundling)

## 🔐 Security

- **Isolated Execution**: Uses Worker threads to sandbox code execution
- **Timeout Protection**: Prevents infinite loops and hanging processes
- **Memory Limits**: Monitors and controls memory consumption
- **Input Validation**: Validates all inputs before execution

## 📞 Support

For issues, questions, or suggestions:

- Open an issue on GitHub
- Check TESTING_GUIDE.md for troubleshooting
- Review INSPECTOR_GUIDE.md for MCP usage

---

## 👤 Author

This project is developed and maintained by [Carlos Miret Fiuza](https://www.linkedin.com/in/carlos-miret-fiuza-87026a52/).  
Feel free to connect on LinkedIn for collaborations, suggestions, or any questions related to **Algorate MCP Server**!
