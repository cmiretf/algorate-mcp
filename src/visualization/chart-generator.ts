import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import type { ComparisonResult, AggregatedResult } from '../types/index.js';

export interface ChartData {
  implementationName: string;
  inputSizes: number[];
  executionTimes: number[];
  memoryUsage: number[];
  stdDev: number[];
}

export interface ChartOptions {
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  showMemory?: boolean;
  showErrorBars?: boolean;
}

export class ChartGenerator {
  async generateChart(
    results: ComparisonResult[],
    outputPath: string,
    options: ChartOptions = {}
  ): Promise<string> {
    const chartData = this.prepareChartData(results);
    const html = this.generateHTML(chartData, options);

    // Ensure directory exists
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, html, 'utf-8');

    return outputPath;
  }

  private prepareChartData(results: ComparisonResult[]): ChartData[] {
    const dataMap = new Map<string, ChartData>();

    for (const result of results) {
      // Extract size from test case ID or use a sequential index
      const testCaseSize = this.extractTestCaseSize(result.testCaseId);
      
      for (const impl of result.implementations) {
        const key = impl.implementationId;
        
        if (!dataMap.has(key)) {
          dataMap.set(key, {
            implementationName: `Implementation ${impl.implementationId.slice(0, 8)}`,
            inputSizes: [],
            executionTimes: [],
            memoryUsage: [],
            stdDev: []
          });
        }

        const data = dataMap.get(key)!;
        
        data.inputSizes.push(testCaseSize);
        data.executionTimes.push(impl.executionTime.mean);
        data.memoryUsage.push(impl.memoryPeak.mean / (1024 * 1024)); // Convert to MB
        data.stdDev.push(impl.executionTime.stdDev);
      }
    }

    // Sort by input size for each implementation
    for (const data of dataMap.values()) {
      const indices = data.inputSizes
        .map((_, i) => i)
        .sort((a, b) => data.inputSizes[a] - data.inputSizes[b]);
      
      data.inputSizes = indices.map(i => data.inputSizes[i]);
      data.executionTimes = indices.map(i => data.executionTimes[i]);
      data.memoryUsage = indices.map(i => data.memoryUsage[i]);
      data.stdDev = indices.map(i => data.stdDev[i]);
    }

    return Array.from(dataMap.values());
  }

  private extractTestCaseSize(testCaseId: string): number {
    // Try to extract size from test case ID
    // Patterns: "Size 100", "size-100", "100 elements", etc.
    const patterns = [
      /size[_\s-]?(\d+)/i,
      /(\d+)[_\s-]?elements?/i,
      /(\d+)[_\s-]?items?/i,
      /^(\d+)$/
    ];

    for (const pattern of patterns) {
      const match = testCaseId.match(pattern);
      if (match) {
        return parseInt(match[1], 10);
      }
    }

    // Fallback: use hash of test case ID to generate a consistent size
    let hash = 0;
    for (let i = 0; i < testCaseId.length; i++) {
      hash = ((hash << 5) - hash) + testCaseId.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash % 10000) + 10;
  }

  private generateHTML(chartData: ChartData[], options: ChartOptions): string {
    const title = options.title || 'Benchmark Results';
    const xAxisLabel = options.xAxisLabel || 'Input Size';
    const yAxisLabel = options.yAxisLabel || 'Execution Time (ms)';

    const traces = chartData.map((data, index) => {
      const colors = [
        '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
        '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'
      ];
      const color = colors[index % colors.length];

      const trace: any = {
        x: data.inputSizes,
        y: data.executionTimes,
        type: 'scatter',
        mode: 'lines+markers',
        name: data.implementationName,
        line: { color, width: 2 },
        marker: { size: 8 }
      };

      if (options.showErrorBars && data.stdDev.length > 0) {
        trace.error_y = {
          type: 'data',
          array: data.stdDev,
          visible: true
        };
      }

      return trace;
    });

    const memoryTraces = options.showMemory
      ? chartData.map((data, index) => {
          const colors = [
            '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
            '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'
          ];
          const color = colors[index % colors.length];
          
          return {
            x: data.inputSizes,
            y: data.memoryUsage,
            type: 'scatter',
            mode: 'lines+markers',
            name: `${data.implementationName} (Memory)`,
            line: { color, width: 2, dash: 'dash' },
            marker: { size: 8 },
            yaxis: 'y2'
          };
        })
      : [];

    const layout = {
      title: {
        text: title,
        font: { size: 20 }
      },
      xaxis: {
        title: xAxisLabel,
        type: 'log',
        showgrid: true
      },
      yaxis: {
        title: yAxisLabel,
        showgrid: true
      },
      ...(options.showMemory && {
        yaxis2: {
          title: 'Memory Usage (MB)',
          overlaying: 'y',
          side: 'right',
          showgrid: false
        }
      }),
      hovermode: 'closest',
      legend: {
        x: 0,
        y: 1,
        bgcolor: 'rgba(255, 255, 255, 0.8)'
      },
      plot_bgcolor: 'rgba(240, 240, 240, 0.5)',
      paper_bgcolor: 'white'
    };

    const config = {
      responsive: true,
      displayModeBar: true,
      modeBarButtonsToRemove: ['lasso2d', 'select2d']
    };

    const plotlyScript = `
      <script src="https://cdn.plot.ly/plotly-2.27.0.min.js"></script>
      <script>
        const data = ${JSON.stringify([...traces, ...memoryTraces])};
        const layout = ${JSON.stringify(layout)};
        const config = ${JSON.stringify(config)};
        
        Plotly.newPlot('chart', data, layout, config);
      </script>
    `;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      margin: 0;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background-color: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    #chart {
      width: 100%;
      height: 600px;
    }
    .info {
      margin-top: 20px;
      padding: 15px;
      background-color: #f9f9f9;
      border-radius: 4px;
      font-size: 14px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <div id="chart"></div>
    <div class="info">
      <p><strong>Chart Information:</strong></p>
      <p>This chart shows the performance comparison across different input sizes.</p>
      <p>Hover over data points to see detailed metrics. Use the toolbar to zoom, pan, or download the chart.</p>
    </div>
  </div>
  ${plotlyScript}
</body>
</html>
    `.trim();
  }

  async generateComparisonChart(
    aggregatedResults: AggregatedResult[],
    implementationNames: Map<string, string>,
    outputPath: string
  ): Promise<string> {
    const chartData: ChartData[] = aggregatedResults.map(result => {
      // Extract size from test case ID or use a default
      const testCaseSize = this.extractTestCaseSize(result.testCaseId);
      
      return {
        implementationName: implementationNames.get(result.implementationId) || 
                           `Implementation ${result.implementationId.slice(0, 8)}`,
        inputSizes: [testCaseSize],
        executionTimes: [result.executionTime.mean],
        memoryUsage: [result.memoryPeak.mean / (1024 * 1024)],
        stdDev: [result.executionTime.stdDev]
      };
    });

    return this.generateChart(
      [{
        algorithmId: '',
        testCaseId: '',
        implementations: aggregatedResults,
        ranking: [],
        insights: [],
        generatedAt: new Date()
      }],
      outputPath,
      {
        title: 'Performance Comparison',
        showMemory: true,
        showErrorBars: true
      }
    );
  }
}

