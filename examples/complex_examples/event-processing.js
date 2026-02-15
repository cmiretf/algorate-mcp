/**
 * Event & Log Processing Patterns
 * =================================
 * Functions for parsing logs, sessionizing event streams, detecting anomalies,
 * funnel analysis, and timeseries aggregation. Common in observability platforms,
 * analytics dashboards, and real-time monitoring systems.
 *
 * How to test with algorate MCP tool:
 *
 * 1. parseLogEntries
 *    - entryFunction: "parseLogEntries"
 *    - inputGenerator: `function generateInput(n) {
 *        const levels = ['INFO','WARN','ERROR','DEBUG'];
 *        const services = ['api-gateway','user-service','payment-service','notification'];
 *        const now = new Date();
 *        return Array.from({length: n}, (_, i) => {
 *          const d = new Date(now.getTime() - i * 1000);
 *          const level = levels[Math.floor(Math.random()*4)];
 *          const service = services[Math.floor(Math.random()*4)];
 *          return d.toISOString() + ' [' + level + '] [' + service + '] Request processed in ' + Math.floor(Math.random()*500) + 'ms - requestId=' + i + ' userId=user_' + (i%100);
 *        }).join('\\n');
 *      }`
 *    - Expected complexity: O(n * L) where L = avg line length
 *
 * 2. sessionize
 *    - entryFunction: "sessionize"
 *    - inputGenerator: `function generateInput(n) {
 *        const now = Date.now();
 *        const events = [];
 *        let time = now;
 *        for (let i = 0; i < n; i++) {
 *          time += Math.random() > 0.1 ? Math.floor(Math.random() * 60000) : Math.floor(Math.random() * 3600000);
 *          events.push({
 *            userId: 'user_' + Math.floor(Math.random() * Math.max(1, n/20)),
 *            type: ['page_view','click','scroll','form_submit','navigate'][Math.floor(Math.random()*5)],
 *            timestamp: time, page: '/page/' + Math.floor(Math.random()*10)
 *          });
 *        }
 *        return { events, gapMs: 1800000 };
 *      }`
 *    - Expected complexity: O(n log n) due to sorting
 *
 * 3. detectAnomalies
 *    - entryFunction: "detectAnomalies"
 *    - inputGenerator: `function generateInput(n) {
 *        const baseline = 100;
 *        const points = Array.from({length: n}, (_, i) => ({
 *          timestamp: Date.now() - (n - i) * 60000,
 *          value: baseline + Math.sin(i * 0.1) * 20 + (Math.random() - 0.5) * 10 + (Math.random() > 0.95 ? 80 * (Math.random() > 0.5 ? 1 : -1) : 0)
 *        }));
 *        return { timeSeries: points, sensitivity: 2.0 };
 *      }`
 *    - Expected complexity: O(n)
 *
 * 4. calculateFunnelConversion
 *    - entryFunction: "calculateFunnelConversion"
 *    - inputGenerator: `function generateInput(n) {
 *        const steps = ['visit','signup','activate','subscribe','refer'];
 *        const events = [];
 *        for (let i = 0; i < n; i++) {
 *          const userId = 'user_' + Math.floor(Math.random() * Math.max(1, n/5));
 *          const maxStep = Math.floor(Math.random() * 5);
 *          for (let s = 0; s <= maxStep; s++) {
 *            events.push({ userId, step: steps[s], timestamp: Date.now() - (n - i) * 1000 + s * 100 });
 *          }
 *        }
 *        return { events, steps };
 *      }`
 *    - Expected complexity: O(n) with hash-based grouping
 *
 * 5. aggregateTimeseriesData
 *    - entryFunction: "aggregateTimeseriesData"
 *    - inputGenerator: `function generateInput(n) {
 *        return {
 *          points: Array.from({length: n}, (_, i) => ({
 *            timestamp: Date.now() - (n - i) * 60000,
 *            value: 50 + Math.sin(i * 0.05) * 30 + (Math.random() - 0.5) * 10
 *          })),
 *          interval: 300000
 *        };
 *      }`
 *    - Expected complexity: O(n)
 */

/**
 * Parses structured log entries from a raw log string.
 * Extracts timestamp, level, service, message, and key-value pairs.
 * @param {string} rawLogs - Raw log string with newline-separated entries
 * @returns {Object} Parsed entries with summary statistics
 * Complexity: O(n * L) where n = lines, L = avg line length
 */
export function parseLogEntries(rawLogs) {
  if (!rawLogs || typeof rawLogs !== 'string') return { entries: [], summary: {} };

  const lines = rawLogs.split('\n').filter(l => l.trim().length > 0);
  const entries = [];
  const levelCounts = {};
  const serviceCounts = {};

  const logPattern = /^(\d{4}-\d{2}-\d{2}T[\d:.]+Z?)\s+\[(\w+)\]\s+\[([^\]]+)\]\s+(.+)$/;
  const kvPattern = /(\w+)=([\w._-]+)/g;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(logPattern);

    if (match) {
      const [, timestamp, level, service, message] = match;
      const metadata = {};
      let kvMatch;
      while ((kvMatch = kvPattern.exec(message)) !== null) {
        metadata[kvMatch[1]] = kvMatch[2];
      }
      kvPattern.lastIndex = 0;

      const durationMatch = message.match(/(\d+)ms/);

      entries.push({
        timestamp,
        level,
        service,
        message: message.replace(kvPattern, '').trim(),
        metadata,
        duration: durationMatch ? parseInt(durationMatch[1]) : null
      });

      levelCounts[level] = (levelCounts[level] || 0) + 1;
      serviceCounts[service] = (serviceCounts[service] || 0) + 1;
    } else {
      entries.push({
        timestamp: null,
        level: 'UNKNOWN',
        service: 'unknown',
        message: line,
        metadata: {},
        duration: null
      });
      levelCounts['UNKNOWN'] = (levelCounts['UNKNOWN'] || 0) + 1;
    }
  }

  const durations = entries.filter(e => e.duration !== null).map(e => e.duration);
  const avgDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
  const p95Index = Math.floor(durations.length * 0.95);
  durations.sort((a, b) => a - b);

  return {
    entries,
    summary: {
      totalLines: lines.length,
      parsedSuccessfully: entries.filter(e => e.timestamp !== null).length,
      levelCounts,
      serviceCounts,
      avgDuration: +avgDuration.toFixed(2),
      p95Duration: durations.length > 0 ? durations[p95Index] || durations[durations.length - 1] : 0,
      errorRate: +((levelCounts['ERROR'] || 0) / lines.length * 100).toFixed(2)
    }
  };
}

/**
 * Groups events into sessions per user based on a time gap threshold.
 * Events within the gap are part of the same session.
 * @param {Object} input - { events, gapMs }
 * @returns {Object} Sessions with duration, event counts, and user stats
 * Complexity: O(n log n) due to sorting
 */
export function sessionize(input) {
  const { events, gapMs } = input;

  const byUser = {};
  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    if (!byUser[e.userId]) byUser[e.userId] = [];
    byUser[e.userId].push(e);
  }

  const sessions = [];

  for (const userId in byUser) {
    const userEvents = byUser[userId];
    userEvents.sort((a, b) => a.timestamp - b.timestamp);

    let sessionStart = 0;
    for (let i = 1; i <= userEvents.length; i++) {
      if (i === userEvents.length || userEvents[i].timestamp - userEvents[i - 1].timestamp > gapMs) {
        const sessionEvents = userEvents.slice(sessionStart, i);
        const duration = sessionEvents[sessionEvents.length - 1].timestamp - sessionEvents[0].timestamp;
        const pages = new Set(sessionEvents.map(e => e.page).filter(Boolean));

        sessions.push({
          userId,
          sessionId: userId + '_' + sessions.length,
          startTime: sessionEvents[0].timestamp,
          endTime: sessionEvents[sessionEvents.length - 1].timestamp,
          duration,
          eventCount: sessionEvents.length,
          uniquePages: pages.size,
          events: sessionEvents.map(e => e.type)
        });

        sessionStart = i;
      }
    }
  }

  const durations = sessions.map(s => s.duration);
  const avgDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;

  return {
    totalSessions: sessions.length,
    uniqueUsers: Object.keys(byUser).length,
    avgSessionDuration: +avgDuration.toFixed(0),
    avgEventsPerSession: sessions.length > 0 ? +(events.length / sessions.length).toFixed(2) : 0,
    sessions: sessions.slice(0, 50)
  };
}

/**
 * Detects anomalies in timeseries data using z-score method.
 * Points with z-scores exceeding the sensitivity threshold are flagged.
 * @param {Object} input - { timeSeries, sensitivity }
 * @returns {Object} Anomalies with statistics
 * Complexity: O(n)
 */
export function detectAnomalies(input) {
  const { timeSeries, sensitivity } = input;
  const values = timeSeries.map(p => p.value);

  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  const anomalies = [];
  const normal = [];

  for (let i = 0; i < timeSeries.length; i++) {
    const zScore = stdDev > 0 ? (timeSeries[i].value - mean) / stdDev : 0;

    if (Math.abs(zScore) > sensitivity) {
      anomalies.push({
        index: i,
        timestamp: timeSeries[i].timestamp,
        value: timeSeries[i].value,
        zScore: +zScore.toFixed(4),
        direction: zScore > 0 ? 'spike' : 'dip',
        deviation: +Math.abs(timeSeries[i].value - mean).toFixed(4)
      });
    } else {
      normal.push(timeSeries[i]);
    }
  }

  return {
    totalPoints: timeSeries.length,
    anomalyCount: anomalies.length,
    anomalyRate: +(anomalies.length / timeSeries.length * 100).toFixed(2),
    mean: +mean.toFixed(4),
    stdDev: +stdDev.toFixed(4),
    sensitivity,
    anomalies,
    normalRange: { lower: +(mean - sensitivity * stdDev).toFixed(4), upper: +(mean + sensitivity * stdDev).toFixed(4) }
  };
}

/**
 * Calculates funnel conversion rates across ordered steps.
 * Tracks how many users reach each step and where they drop off.
 * @param {Object} input - { events, steps }
 * @returns {Object} Funnel analysis with conversion rates per step
 * Complexity: O(n) with hash-based grouping
 */
export function calculateFunnelConversion(input) {
  const { events, steps } = input;
  const userSteps = {};

  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    if (!userSteps[e.userId]) userSteps[e.userId] = new Set();
    userSteps[e.userId].add(e.step);
  }

  const totalUsers = Object.keys(userSteps).length;
  const stepCounts = [];

  for (let s = 0; s < steps.length; s++) {
    let count = 0;
    for (const userId in userSteps) {
      let reachedAll = true;
      for (let j = 0; j <= s; j++) {
        if (!userSteps[userId].has(steps[j])) { reachedAll = false; break; }
      }
      if (reachedAll) count++;
    }
    stepCounts.push(count);
  }

  const funnel = steps.map((step, i) => ({
    step,
    users: stepCounts[i],
    percentOfTotal: totalUsers > 0 ? +(stepCounts[i] / totalUsers * 100).toFixed(2) : 0,
    conversionFromPrevious: i === 0 ? 100 : (stepCounts[i - 1] > 0 ? +(stepCounts[i] / stepCounts[i - 1] * 100).toFixed(2) : 0),
    dropoff: i === 0 ? 0 : stepCounts[i - 1] - stepCounts[i]
  }));

  return {
    totalUsers,
    totalEvents: events.length,
    overallConversion: totalUsers > 0 ? +(stepCounts[steps.length - 1] / totalUsers * 100).toFixed(2) : 0,
    funnel,
    biggestDropoff: funnel.reduce((max, f) => f.dropoff > max.dropoff ? f : max, { dropoff: 0 })
  };
}

/**
 * Resamples timeseries data to a different interval by aggregating points.
 * Computes min, max, mean, and count for each bucket.
 * @param {Object} input - { points, interval }
 * @returns {Object} Aggregated timeseries with bucket stats
 * Complexity: O(n)
 */
export function aggregateTimeseriesData(input) {
  const { points, interval } = input;
  if (points.length === 0) return { buckets: [], totalPoints: 0 };

  const sorted = points.slice().sort((a, b) => a.timestamp - b.timestamp);
  const buckets = [];
  let bucketStart = Math.floor(sorted[0].timestamp / interval) * interval;
  let current = { min: Infinity, max: -Infinity, sum: 0, count: 0, start: bucketStart };

  for (let i = 0; i < sorted.length; i++) {
    const p = sorted[i];
    const pBucket = Math.floor(p.timestamp / interval) * interval;

    if (pBucket !== current.start) {
      if (current.count > 0) {
        buckets.push({
          timestamp: current.start,
          min: +current.min.toFixed(4),
          max: +current.max.toFixed(4),
          mean: +(current.sum / current.count).toFixed(4),
          count: current.count
        });
      }
      current = { min: Infinity, max: -Infinity, sum: 0, count: 0, start: pBucket };
    }

    current.min = Math.min(current.min, p.value);
    current.max = Math.max(current.max, p.value);
    current.sum += p.value;
    current.count++;
  }

  if (current.count > 0) {
    buckets.push({
      timestamp: current.start,
      min: +current.min.toFixed(4),
      max: +current.max.toFixed(4),
      mean: +(current.sum / current.count).toFixed(4),
      count: current.count
    });
  }

  return {
    originalPoints: points.length,
    bucketCount: buckets.length,
    interval,
    compressionRatio: buckets.length > 0 ? +(points.length / buckets.length).toFixed(2) : 0,
    buckets
  };
}
