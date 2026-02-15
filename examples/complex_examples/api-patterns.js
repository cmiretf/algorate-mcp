/**
 * API & Backend Patterns
 * =======================
 * Common patterns found in API servers, microservices, and backend systems.
 * Includes rate limiting, retry logic, batching, caching, and query building.
 *
 * How to test with algorate MCP tool:
 *
 * 1. rateLimiter
 *    - entryFunction: "rateLimiter"
 *    - inputGenerator: `function generateInput(n) {
 *        const now = Date.now();
 *        return {
 *          requests: Array.from({length: n}, (_, i) => ({
 *            id: 'req_' + i, clientId: 'client_' + (i % Math.max(1, Math.floor(n/10))),
 *            timestamp: now - Math.floor(Math.random() * 60000), endpoint: '/api/v' + (i % 3)
 *          })),
 *          windowMs: 60000, maxRequests: 100
 *        };
 *      }`
 *    - Expected complexity: O(n)
 *
 * 2. retryWithBackoff
 *    - entryFunction: "retryWithBackoff"
 *    - inputGenerator: `function generateInput(n) {
 *        return { failCount: Math.min(n, 5), maxRetries: 5, baseDelay: 10 };
 *      }`
 *    - Expected complexity: O(retries) - note: small n due to delays
 *    - testSizes: [1, 2, 3, 4, 5]
 *
 * 3. batchProcessor
 *    - entryFunction: "batchProcessor"
 *    - inputGenerator: `function generateInput(n) {
 *        return {
 *          items: Array.from({length: n}, (_, i) => ({ id: i, data: 'item_' + i })),
 *          batchSize: Math.max(1, Math.floor(n / 5))
 *        };
 *      }`
 *    - Expected complexity: O(n)
 *
 * 4. cacheWithTTL
 *    - entryFunction: "cacheWithTTL"
 *    - inputGenerator: `function generateInput(n) {
 *        return {
 *          operations: Array.from({length: n}, (_, i) => ({
 *            type: Math.random() > 0.3 ? 'get' : 'set',
 *            key: 'key_' + (i % Math.max(1, Math.floor(n / 5))),
 *            value: i
 *          })),
 *          maxSize: Math.max(10, Math.floor(n / 2)), ttlMs: 5000
 *        };
 *      }`
 *    - Expected complexity: O(n) for n operations, O(1) per operation amortized
 *
 * 5. buildQueryFromFilters
 *    - entryFunction: "buildQueryFromFilters"
 *    - inputGenerator: `function generateInput(n) {
 *        const ops = ['eq','neq','gt','lt','gte','lte','in','like','between'];
 *        const fields = ['name','age','email','status','created_at','score','city'];
 *        return Array.from({length: n}, (_, i) => ({
 *          field: fields[i % 7],
 *          operator: ops[i % 9],
 *          value: ops[i % 9] === 'in' ? ['a','b','c'] : ops[i % 9] === 'between' ? [10, 50] : 'value_' + i
 *        }));
 *      }`
 *    - Expected complexity: O(n) where n = number of filters
 */

/**
 * Sliding window rate limiter. Evaluates a batch of requests and determines
 * which are allowed and which are throttled based on per-client limits.
 * @param {Object} input - { requests, windowMs, maxRequests }
 * @returns {Object} Results with allowed/denied lists and client stats
 * Complexity: O(n) where n = number of requests
 */
export function rateLimiter(input) {
  const { requests, windowMs, maxRequests } = input;
  const clientWindows = {};
  const allowed = [];
  const denied = [];

  const sorted = requests.slice().sort((a, b) => a.timestamp - b.timestamp);

  for (let i = 0; i < sorted.length; i++) {
    const req = sorted[i];
    const clientId = req.clientId;

    if (!clientWindows[clientId]) {
      clientWindows[clientId] = { timestamps: [], totalAllowed: 0, totalDenied: 0 };
    }

    const window = clientWindows[clientId];
    const windowStart = req.timestamp - windowMs;

    while (window.timestamps.length > 0 && window.timestamps[0] < windowStart) {
      window.timestamps.shift();
    }

    if (window.timestamps.length < maxRequests) {
      window.timestamps.push(req.timestamp);
      window.totalAllowed++;
      allowed.push({ ...req, status: 'allowed' });
    } else {
      window.totalDenied++;
      denied.push({
        ...req,
        status: 'denied',
        retryAfter: window.timestamps[0] + windowMs - req.timestamp
      });
    }
  }

  const clientStats = {};
  for (const clientId in clientWindows) {
    const w = clientWindows[clientId];
    clientStats[clientId] = {
      allowed: w.totalAllowed,
      denied: w.totalDenied,
      utilization: w.totalAllowed / maxRequests
    };
  }

  return {
    totalRequests: requests.length,
    allowed: allowed.length,
    denied: denied.length,
    clientStats
  };
}

/**
 * Simulates retry with exponential backoff. Returns the execution trace
 * showing each attempt, delay, and outcome.
 * @param {Object} input - { failCount, maxRetries, baseDelay }
 * @returns {Object} Execution trace with timing information
 * Complexity: O(retries)
 */
export function retryWithBackoff(input) {
  const { failCount, maxRetries, baseDelay } = input;
  const trace = [];
  let totalDelay = 0;
  let attempt = 0;
  let success = false;

  while (attempt <= maxRetries) {
    const shouldFail = attempt < failCount;
    const delay = attempt === 0 ? 0 : Math.min(baseDelay * Math.pow(2, attempt - 1), 30000);
    const jitter = Math.floor(Math.random() * delay * 0.1);

    totalDelay += delay + jitter;

    trace.push({
      attempt: attempt + 1,
      delay: delay + jitter,
      cumulativeDelay: totalDelay,
      outcome: shouldFail ? 'failure' : 'success',
      error: shouldFail ? 'Simulated error on attempt ' + (attempt + 1) : null
    });

    if (!shouldFail) {
      success = true;
      break;
    }

    attempt++;
  }

  return {
    success,
    totalAttempts: trace.length,
    totalDelay,
    trace,
    wouldTimeout: totalDelay > 60000
  };
}

/**
 * Processes items in fixed-size batches, simulating concurrent batch processing.
 * Returns processing results with timing metadata.
 * @param {Object} input - { items, batchSize }
 * @returns {Object} Batch processing results with stats
 * Complexity: O(n) where n = number of items
 */
export function batchProcessor(input) {
  const { items, batchSize } = input;
  const batches = [];
  const results = [];
  let processedCount = 0;

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, Math.min(i + batchSize, items.length));
    const batchResults = [];

    for (let j = 0; j < batch.length; j++) {
      const item = batch[j];
      const processingTime = Math.random() * 10;
      const success = Math.random() > 0.05;
      batchResults.push({
        itemId: item.id,
        success,
        processingTime,
        error: success ? null : 'Random processing failure'
      });
      if (success) processedCount++;
    }

    batches.push({
      batchIndex: batches.length,
      size: batch.length,
      successCount: batchResults.filter(r => r.success).length,
      failureCount: batchResults.filter(r => !r.success).length,
      avgProcessingTime: batchResults.reduce((s, r) => s + r.processingTime, 0) / batchResults.length
    });

    results.push(...batchResults);
  }

  return {
    totalItems: items.length,
    totalBatches: batches.length,
    processedSuccessfully: processedCount,
    failedCount: items.length - processedCount,
    successRate: processedCount / items.length,
    batches
  };
}

/**
 * LRU cache with TTL expiration. Processes a sequence of get/set operations
 * and returns cache statistics.
 * @param {Object} input - { operations, maxSize, ttlMs }
 * @returns {Object} Cache performance statistics
 * Complexity: O(n) for n operations, O(1) amortized per operation
 */
export function cacheWithTTL(input) {
  const { operations, maxSize, ttlMs } = input;
  const cache = new Map();
  const timestamps = new Map();
  let hits = 0;
  let misses = 0;
  let evictions = 0;
  let expired = 0;
  const now = Date.now();

  for (let i = 0; i < operations.length; i++) {
    const op = operations[i];
    const opTime = now + i;

    if (op.type === 'get') {
      if (cache.has(op.key)) {
        const ts = timestamps.get(op.key);
        if (opTime - ts > ttlMs) {
          cache.delete(op.key);
          timestamps.delete(op.key);
          expired++;
          misses++;
        } else {
          const value = cache.get(op.key);
          cache.delete(op.key);
          cache.set(op.key, value);
          hits++;
        }
      } else {
        misses++;
      }
    } else if (op.type === 'set') {
      if (cache.has(op.key)) {
        cache.delete(op.key);
      } else if (cache.size >= maxSize) {
        const oldest = cache.keys().next().value;
        cache.delete(oldest);
        timestamps.delete(oldest);
        evictions++;
      }
      cache.set(op.key, op.value);
      timestamps.set(op.key, opTime);
    }
  }

  return {
    totalOperations: operations.length,
    hits,
    misses,
    hitRate: (hits + misses) > 0 ? hits / (hits + misses) : 0,
    evictions,
    expired,
    finalCacheSize: cache.size,
    maxSize
  };
}

/**
 * Builds a parameterized SQL-like WHERE clause from a filter object array.
 * Supports operators: eq, neq, gt, lt, gte, lte, in, like, between, is_null.
 * @param {Array<Object>} filters - Array of filter objects
 * @returns {Object} Query string and parameter values
 * Complexity: O(n) where n = number of filters
 */
export function buildQueryFromFilters(filters) {
  if (!filters || filters.length === 0) {
    return { where: '1=1', params: [], paramCount: 0 };
  }

  const conditions = [];
  const params = [];
  let paramIndex = 1;

  for (let i = 0; i < filters.length; i++) {
    const f = filters[i];
    const field = f.field.replace(/[^a-zA-Z0-9_.]/g, '');

    switch (f.operator) {
      case 'eq':
        conditions.push(field + ' = $' + paramIndex++);
        params.push(f.value);
        break;
      case 'neq':
        conditions.push(field + ' != $' + paramIndex++);
        params.push(f.value);
        break;
      case 'gt':
        conditions.push(field + ' > $' + paramIndex++);
        params.push(f.value);
        break;
      case 'lt':
        conditions.push(field + ' < $' + paramIndex++);
        params.push(f.value);
        break;
      case 'gte':
        conditions.push(field + ' >= $' + paramIndex++);
        params.push(f.value);
        break;
      case 'lte':
        conditions.push(field + ' <= $' + paramIndex++);
        params.push(f.value);
        break;
      case 'in':
        if (Array.isArray(f.value)) {
          const placeholders = f.value.map(() => '$' + paramIndex++).join(', ');
          conditions.push(field + ' IN (' + placeholders + ')');
          params.push(...f.value);
        }
        break;
      case 'like':
        conditions.push(field + ' LIKE $' + paramIndex++);
        params.push('%' + f.value + '%');
        break;
      case 'between':
        if (Array.isArray(f.value) && f.value.length === 2) {
          conditions.push(field + ' BETWEEN $' + paramIndex++ + ' AND $' + paramIndex++);
          params.push(f.value[0], f.value[1]);
        }
        break;
      case 'is_null':
        conditions.push(field + (f.value ? ' IS NULL' : ' IS NOT NULL'));
        break;
      default:
        conditions.push(field + ' = $' + paramIndex++);
        params.push(f.value);
    }
  }

  return {
    where: conditions.length > 0 ? conditions.join(' AND ') : '1=1',
    params,
    paramCount: params.length
  };
}
