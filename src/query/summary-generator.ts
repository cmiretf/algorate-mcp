import type { ComparisonResult, AggregatedResult } from '../types/index.js';

export interface PerformanceSummary {
  text: string;
  algorithmsEvaluated: string[];
  overallPerformance: 'excellent' | 'good' | 'acceptable' | 'poor' | 'critical';
  bottlenecks: string[];
  alerts: string[];
  recommendations: string[];
  metrics: {
    fastestImplementation: string;
    slowestImplementation: string;
    averageTime: number;
    memoryUsage: number;
    consistency: number;
  };
}

export class SummaryGenerator {
  generateSummary(
    results: ComparisonResult[],
    algorithmNames: Map<string, string>,
    implementationNames: Map<string, string>
  ): PerformanceSummary {
    const algorithmsEvaluated = results.map(r => 
      algorithmNames.get(r.algorithmId) || `Algorithm ${r.algorithmId.slice(0, 8)}`
    );

    const allInsights: string[] = [];
    const bottlenecks: string[] = [];
    const alerts: string[] = [];
    const recommendations: string[] = [];

    let fastestTime = Infinity;
    let slowestTime = 0;
    let fastestImpl = '';
    let slowestImpl = '';
    let totalTime = 0;
    let totalMemory = 0;
    let totalConsistency = 0;
    let count = 0;

    for (const result of results) {
      allInsights.push(...result.insights);

      for (const impl of result.implementations) {
        const implName = implementationNames.get(impl.implementationId) || 
                        `Implementation ${impl.implementationId.slice(0, 8)}`;
        
        const avgTime = impl.executionTime.mean;
        const memory = impl.memoryPeak.mean / (1024 * 1024); // MB
        const consistency = 1 - (impl.executionTime.stdDev / (impl.executionTime.mean || 1));

        totalTime += avgTime;
        totalMemory += memory;
        totalConsistency += consistency;
        count++;

        if (avgTime < fastestTime) {
          fastestTime = avgTime;
          fastestImpl = implName;
        }

        if (avgTime > slowestTime) {
          slowestTime = avgTime;
          slowestImpl = implName;
        }

        // Detect bottlenecks
        if (avgTime > 1000) {
          bottlenecks.push(`${implName} shows high execution time: ${avgTime.toFixed(2)}ms`);
        }

        if (memory > 100) {
          bottlenecks.push(`${implName} uses high memory: ${memory.toFixed(2)}MB`);
        }

        // Detect alerts
        const cv = impl.executionTime.stdDev / (impl.executionTime.mean || 1);
        if (cv > 0.3) {
          alerts.push(`${implName} shows high variability (CV: ${(cv * 100).toFixed(1)}%)`);
        }

        if (impl.successfulRuns < impl.totalRuns) {
          alerts.push(`${implName} has ${impl.totalRuns - impl.successfulRuns} failed runs`);
        }
      }
    }

    const averageTime = count > 0 ? totalTime / count : 0;
    const memoryUsage = count > 0 ? totalMemory / count : 0;
    const consistency = count > 0 ? totalConsistency / count : 0;

    const overallPerformance = this.assessOverallPerformance(
      averageTime,
      memoryUsage,
      consistency,
      alerts.length
    );

    // Generate recommendations
    if (slowestTime / fastestTime > 2) {
      recommendations.push(
        `Consider optimizing ${slowestImpl} - it's ${(slowestTime / fastestTime).toFixed(1)}x slower than ${fastestImpl}`
      );
    }

    if (memoryUsage > 50) {
      recommendations.push('High memory usage detected. Consider memory optimization strategies.');
    }

    if (consistency < 0.7) {
      recommendations.push('Low consistency detected. Consider increasing warmup runs or fixing variability issues.');
    }

    if (bottlenecks.length > 0) {
      recommendations.push('Bottlenecks detected. Review and optimize the slowest implementations.');
    }

    // Generate summary text
    const summaryText = this.generateSummaryText(
      algorithmsEvaluated,
      overallPerformance,
      bottlenecks,
      alerts,
      averageTime,
      memoryUsage
    );

    return {
      text: summaryText,
      algorithmsEvaluated,
      overallPerformance,
      bottlenecks,
      alerts,
      recommendations,
      metrics: {
        fastestImplementation: fastestImpl,
        slowestImplementation: slowestImpl,
        averageTime,
        memoryUsage,
        consistency
      }
    };
  }

  private assessOverallPerformance(
    avgTime: number,
    memoryUsage: number,
    consistency: number,
    alertCount: number
  ): PerformanceSummary['overallPerformance'] {
    if (alertCount > 3 || avgTime > 5000 || memoryUsage > 200) {
      return 'critical';
    }
    if (alertCount > 1 || avgTime > 1000 || memoryUsage > 100 || consistency < 0.5) {
      return 'poor';
    }
    if (avgTime > 500 || memoryUsage > 50 || consistency < 0.7) {
      return 'acceptable';
    }
    if (avgTime < 100 && memoryUsage < 20 && consistency > 0.9) {
      return 'excellent';
    }
    return 'good';
  }

  private generateSummaryText(
    algorithms: string[],
    performance: PerformanceSummary['overallPerformance'],
    bottlenecks: string[],
    alerts: string[],
    avgTime: number,
    memoryUsage: number
  ): string {
    const performanceLabels = {
      excellent: 'excelente',
      good: 'bueno',
      acceptable: 'aceptable',
      poor: 'deficiente',
      critical: 'crítico'
    };

    let text = `Se evaluaron los algoritmos: ${algorithms.join(', ')}. `;
    
    text += `En general, el rendimiento es ${performanceLabels[performance]}. `;

    if (avgTime < 100) {
      text += `Los tiempos de ejecución son rápidos (promedio: ${avgTime.toFixed(2)}ms). `;
    } else if (avgTime < 500) {
      text += `Los tiempos de ejecución son adecuados para cargas pequeñas y medianas (promedio: ${avgTime.toFixed(2)}ms). `;
    } else {
      text += `Los tiempos de ejecución muestran un incremento significativo en cargas altas (promedio: ${avgTime.toFixed(2)}ms). `;
    }

    if (memoryUsage < 20) {
      text += `El uso de memoria es eficiente (${memoryUsage.toFixed(2)}MB). `;
    } else if (memoryUsage < 50) {
      text += `El uso de memoria es moderado (${memoryUsage.toFixed(2)}MB). `;
    } else {
      text += `El uso de memoria es alto (${memoryUsage.toFixed(2)}MB). `;
    }

    if (bottlenecks.length > 0) {
      text += `Se detectaron cuellos de botella: ${bottlenecks.slice(0, 2).join('; ')}. `;
    }

    if (alerts.length > 0) {
      text += `Alertas: ${alerts.slice(0, 2).join('; ')}. `;
    }

    if (performance === 'poor' || performance === 'critical') {
      text += 'Se recomienda optimizar los algoritmos identificados.';
    } else if (performance === 'acceptable') {
      text += 'Los tiempos de ejecución son adecuados según la carga simulada, aunque hay margen de mejora.';
    } else {
      text += 'Los tiempos de ejecución son adecuados según la carga simulada.';
    }

    return text.trim();
  }

  generateQuickSummary(result: ComparisonResult): string {
    if (result.implementations.length === 0) {
      return 'No hay implementaciones para comparar.';
    }

    const fastest = result.ranking[0];
    const slowest = result.ranking[result.ranking.length - 1];

    if (!fastest || !slowest) {
      return 'Resultados insuficientes para generar resumen.';
    }

    const fastestImpl = result.implementations.find(i => i.implementationId === fastest.implementationId);
    const slowestImpl = result.implementations.find(i => i.implementationId === slowest.implementationId);

    if (!fastestImpl || !slowestImpl) {
      return 'Error al procesar resultados.';
    }

    const speedup = slowestImpl.executionTime.mean / fastestImpl.executionTime.mean;

    return `Comparación de ${result.implementations.length} implementaciones. ` +
           `La más rápida es ${speedup.toFixed(2)}x más rápida que la más lenta. ` +
           `Tiempo promedio: ${fastestImpl.executionTime.mean.toFixed(2)}ms (más rápida) vs ` +
           `${slowestImpl.executionTime.mean.toFixed(2)}ms (más lenta).`;
  }
}


