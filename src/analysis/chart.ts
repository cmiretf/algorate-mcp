export interface ChartData {
    label: string;
    values: { x: number; y: number }[];
  }
  
  export interface ChartOptions {
    title: string;
    xLabel: string;
    yLabel: string;
    width: number;
    height: number;
  }
  
  export class AsciiChart {
    generate(datasets: ChartData[], options: ChartOptions): string {
      const width = options.width || 50;
      const height = options.height || 12;
  
      const allValues = datasets.flatMap((d) => d.values);
      const maxY = Math.max(...allValues.map((v) => v.y));
      const minY = Math.min(...allValues.map((v) => v.y), 0);
      const range = maxY - minY || 1;
  
      const lines: string[] = [];
      lines.push(`  ${options.title}`);
      lines.push(`  ${'─'.repeat(width + 6)}`);
  
      const symbols = ['█', '▓', '░', '▒', '◆', '●'];
  
      for (let row = height; row >= 0; row--) {
        const yValue = minY + (range * row) / height;
        const yLabel = this.formatNumber(yValue).padStart(8);
        let line = `${yLabel} │`;
  
        for (let col = 0; col < width; col++) {
          let charPlaced = false;
          for (let dIdx = 0; dIdx < datasets.length; dIdx++) {
            const ds = datasets[dIdx];
            const xMin = Math.min(...ds.values.map((v) => v.x));
            const xMax = Math.max(...ds.values.map((v) => v.x));
            const xRange = xMax - xMin || 1;
  
            for (const point of ds.values) {
              const px = Math.round(((point.x - xMin) / xRange) * (width - 1));
              const py = Math.round(((point.y - minY) / range) * height);
              if (px === col && py === row) {
                line += symbols[dIdx % symbols.length];
                charPlaced = true;
                break;
              }
            }
            if (charPlaced) break;
          }
          if (!charPlaced) {
            line += ' ';
          }
        }
  
        lines.push(line);
      }
  
      lines.push(`${''.padStart(9)}└${'─'.repeat(width)}`);
  
      const xLabels = allValues.map((v) => v.x);
      const xMin = Math.min(...xLabels);
      const xMax = Math.max(...xLabels);
      lines.push(`${''.padStart(10)}${String(xMin).padEnd(width / 2)}${String(xMax)}`);
      lines.push(`${''.padStart(10 + Math.floor(width / 2) - Math.floor(options.xLabel.length / 2))}${options.xLabel}`);
  
      if (datasets.length > 1) {
        lines.push('');
        lines.push('  Legend:');
        datasets.forEach((ds, idx) => {
          lines.push(`    ${symbols[idx % symbols.length]} ${ds.label}`);
        });
      }
  
      return lines.join('\n');
    }
  
    generateBarChart(labels: string[], values: number[], title: string): string {
      const maxVal = Math.max(...values);
      const barWidth = 30;
      const lines: string[] = [];
  
      lines.push(`  ${title}`);
      lines.push(`  ${'─'.repeat(barWidth + 20)}`);
  
      for (let i = 0; i < labels.length; i++) {
        const normalized = maxVal > 0 ? Math.round((values[i] / maxVal) * barWidth) : 0;
        const bar = '█'.repeat(normalized) + '░'.repeat(barWidth - normalized);
        const label = labels[i].padEnd(15).substring(0, 15);
        const value = this.formatNumber(values[i]);
        lines.push(`  ${label} │${bar}│ ${value}`);
      }
  
      lines.push(`  ${'─'.repeat(barWidth + 20)}`);
      return lines.join('\n');
    }
  
    private formatNumber(n: number): string {
      if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
      if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
      if (n < 0.001) return `${(n * 1000000).toFixed(1)}μs`;
      if (n < 1) return `${(n * 1000).toFixed(1)}μs`;
      return n.toFixed(2);
    }
  }
  