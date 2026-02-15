/**
 * Caching Strategies & Memoization Patterns
 * ===========================================
 * Advanced caching patterns used in fullstack applications including
 * LRU caches, TTL memoization, dependency invalidation, bloom filters,
 * and tiered caching.
 *
 * How to test with algorate MCP tool:
 *
 * 1. lruCache
 *    - entryFunction: "lruCache"
 *    - inputGenerator: `function generateInput(n) {
 *        var operations = [];
 *        for (var i = 0; i < n; i++) {
 *          var r = Math.random();
 *          if (r < 0.4) {
 *            operations.push({ type: 'put', key: 'key_' + (i % Math.max(1, Math.floor(n / 3))), value: 'value_' + i });
 *          } else if (r < 0.85) {
 *            operations.push({ type: 'get', key: 'key_' + Math.floor(Math.random() * Math.max(1, Math.floor(n / 3))) });
 *          } else {
 *            operations.push({ type: 'delete', key: 'key_' + Math.floor(Math.random() * Math.max(1, Math.floor(n / 3))) });
 *          }
 *        }
 *        return { capacity: Math.max(5, Math.floor(n / 4)), operations: operations };
 *      }`
 *    - Expected complexity: O(n) for n operations, O(1) per operation
 *
 * 2. memoizeWithTTL
 *    - entryFunction: "memoizeWithTTL"
 *    - inputGenerator: `function generateInput(n) {
 *        var calls = [];
 *        for (var i = 0; i < n; i++) {
 *          calls.push({ args: [Math.floor(Math.random() * Math.max(1, Math.floor(n / 5))), Math.floor(Math.random() * 10)] });
 *        }
 *        return { ttlMs: 5000, calls: calls };
 *      }`
 *    - Expected complexity: O(n) for n calls, cache hit is O(1)
 *
 * 3. cacheInvalidation
 *    - entryFunction: "cacheInvalidation"
 *    - inputGenerator: `function generateInput(n) {
 *        var cache = {};
 *        var dependencies = {};
 *        for (var i = 0; i < n; i++) {
 *          var key = 'cache_' + i;
 *          cache[key] = { value: 'data_' + i, computedAt: Date.now() - Math.floor(Math.random() * 10000) };
 *          var deps = [];
 *          for (var d = 0; d < Math.min(3, Math.floor(n / 5)); d++) {
 *            deps.push('source_' + Math.floor(Math.random() * Math.max(1, Math.floor(n / 3))));
 *          }
 *          dependencies[key] = deps;
 *        }
 *        return { cache: cache, dependencies: dependencies, changedKey: 'source_0' };
 *      }`
 *    - Expected complexity: O(n * d) where n = cache entries, d = avg dependencies
 *
 * 4. bloomFilter
 *    - entryFunction: "bloomFilter"
 *    - inputGenerator: `function generateInput(n) {
 *        var insertItems = [];
 *        var testItems = [];
 *        for (var i = 0; i < n; i++) {
 *          insertItems.push('item_' + i);
 *          testItems.push(Math.random() < 0.5 ? 'item_' + i : 'missing_' + i);
 *        }
 *        return { size: Math.max(n * 10, 64), hashCount: 7, insertItems: insertItems, testItems: testItems };
 *      }`
 *    - Expected complexity: O(n * k) where n = items, k = hash functions
 *
 * 5. tieredCache
 *    - entryFunction: "tieredCache"
 *    - inputGenerator: `function generateInput(n) {
 *        var operations = [];
 *        for (var i = 0; i < n; i++) {
 *          var r = Math.random();
 *          if (r < 0.3) {
 *            operations.push({ type: 'set', key: 'key_' + (i % Math.max(1, Math.floor(n / 4))), value: 'data_' + i });
 *          } else {
 *            operations.push({ type: 'get', key: 'key_' + Math.floor(Math.random() * Math.max(1, Math.floor(n / 4))) });
 *          }
 *        }
 *        return { l1Size: Math.max(3, Math.floor(n / 10)), l2Size: Math.max(10, Math.floor(n / 3)), operations: operations };
 *      }`
 *    - Expected complexity: O(n) for n operations
 */

/**
 * LRU (Least Recently Used) cache implementation using Map for O(1) operations.
 * Processes a sequence of get/put/delete operations and returns cache statistics.
 * @param {Object} input - { capacity: number, operations: Array<{type, key, value}> }
 * @returns {Object} Cache statistics including hit rate, eviction count
 * @complexity O(1) per operation amortized, O(n) for n operations total
 */
export function lruCache(input) {
  var capacity = input.capacity;
  var operations = input.operations;

  var cache = new Map();
  var hits = 0;
  var misses = 0;
  var evictions = 0;
  var puts = 0;
  var deletes = 0;
  var operationLog = [];

  for (var i = 0; i < operations.length; i++) {
    var op = operations[i];

    switch (op.type) {
      case 'get': {
        if (cache.has(op.key)) {
          var value = cache.get(op.key);
          cache.delete(op.key);
          cache.set(op.key, value);
          hits++;
          operationLog.push({ index: i, type: 'get', key: op.key, result: 'hit' });
        } else {
          misses++;
          operationLog.push({ index: i, type: 'get', key: op.key, result: 'miss' });
        }
        break;
      }

      case 'put': {
        if (cache.has(op.key)) {
          cache.delete(op.key);
        } else if (cache.size >= capacity) {
          var lruKey = cache.keys().next().value;
          cache.delete(lruKey);
          evictions++;
          operationLog.push({ index: i, type: 'evict', key: lruKey, result: 'evicted' });
        }
        cache.set(op.key, op.value);
        puts++;
        operationLog.push({ index: i, type: 'put', key: op.key, result: 'stored' });
        break;
      }

      case 'delete': {
        if (cache.has(op.key)) {
          cache.delete(op.key);
          deletes++;
          operationLog.push({ index: i, type: 'delete', key: op.key, result: 'deleted' });
        } else {
          operationLog.push({ index: i, type: 'delete', key: op.key, result: 'not_found' });
        }
        break;
      }
    }
  }

  var cacheContents = [];
  var iter = cache.entries();
  var entry;
  while (!(entry = iter.next()).done) {
    cacheContents.push({ key: entry.value[0], value: entry.value[1] });
  }

  var totalGets = hits + misses;

  return {
    capacity: capacity,
    finalSize: cache.size,
    totalOperations: operations.length,
    gets: totalGets,
    hits: hits,
    misses: misses,
    hitRate: totalGets > 0 ? hits / totalGets : 0,
    puts: puts,
    evictions: evictions,
    evictionRate: puts > 0 ? evictions / puts : 0,
    deletes: deletes,
    utilization: cache.size / capacity,
    cacheContents: cacheContents,
    recentOps: operationLog.slice(-20)
  };
}

/**
 * Function memoization with TTL-based expiration. Simulates memoizing
 * a computation-heavy function and processes a series of calls.
 * @param {Object} input - { ttlMs: number, calls: Array<{args}> }
 * @returns {Object} Memoization statistics with hit/miss details
 * @complexity O(1) per cache hit, O(f(n)) per cache miss where f is the function
 */
export function memoizeWithTTL(input) {
  var ttlMs = input.ttlMs;
  var calls = input.calls;

  var cache = {};
  var hits = 0;
  var misses = 0;
  var expirations = 0;
  var computations = 0;
  var now = Date.now();
  var callLog = [];

  function computeExpensive(args) {
    var result = 0;
    var a = args[0] || 0;
    var b = args[1] || 1;
    for (var i = 0; i < 100; i++) {
      result += Math.sin(a * i * 0.1) * Math.cos(b * i * 0.1);
      result = Math.abs(result) % 10000;
    }
    computations++;
    return result;
  }

  function makeKey(args) {
    var parts = [];
    for (var i = 0; i < args.length; i++) {
      parts.push(String(args[i]));
    }
    return parts.join(':');
  }

  for (var i = 0; i < calls.length; i++) {
    var call = calls[i];
    var key = makeKey(call.args);
    var callTime = now + i;
    var logEntry = { index: i, key: key, args: call.args };

    if (cache[key]) {
      var entry = cache[key];
      if (callTime - entry.cachedAt > ttlMs) {
        expirations++;
        var result = computeExpensive(call.args);
        cache[key] = { value: result, cachedAt: callTime, hitCount: 0 };
        misses++;
        logEntry.result = 'expired_recomputed';
        logEntry.value = result;
      } else {
        entry.hitCount++;
        hits++;
        logEntry.result = 'cache_hit';
        logEntry.value = entry.value;
        logEntry.age = callTime - entry.cachedAt;
      }
    } else {
      var result = computeExpensive(call.args);
      cache[key] = { value: result, cachedAt: callTime, hitCount: 0 };
      misses++;
      logEntry.result = 'cache_miss';
      logEntry.value = result;
    }

    callLog.push(logEntry);
  }

  var cacheEntries = Object.keys(cache);
  var totalHitsInCache = 0;
  var maxHits = 0;
  var hotKeys = [];
  for (var k = 0; k < cacheEntries.length; k++) {
    var entry = cache[cacheEntries[k]];
    totalHitsInCache += entry.hitCount;
    if (entry.hitCount > maxHits) maxHits = entry.hitCount;
    if (entry.hitCount > 2) {
      hotKeys.push({ key: cacheEntries[k], hits: entry.hitCount });
    }
  }

  hotKeys.sort(function(a, b) { return b.hits - a.hits; });

  return {
    totalCalls: calls.length,
    hits: hits,
    misses: misses,
    expirations: expirations,
    hitRate: calls.length > 0 ? hits / calls.length : 0,
    computations: computations,
    computationsSaved: hits,
    cacheSize: cacheEntries.length,
    uniqueKeys: cacheEntries.length,
    hotKeys: hotKeys.slice(0, 10),
    maxKeyHits: maxHits,
    ttlMs: ttlMs,
    recentCalls: callLog.slice(-15)
  };
}

/**
 * Dependency-based cache invalidation. When a source key changes,
 * all cache entries depending on it are invalidated recursively.
 * @param {Object} input - { cache: Object, dependencies: Object, changedKey: string }
 * @returns {Object} Invalidation results with cascade analysis
 * @complexity O(n * d) where n = cache entries, d = avg dependency chain depth
 */
export function cacheInvalidation(input) {
  var cache = input.cache;
  var dependencies = input.dependencies;
  var changedKey = input.changedKey;

  var reverseDeps = {};
  var depKeys = Object.keys(dependencies);
  for (var i = 0; i < depKeys.length; i++) {
    var cacheKey = depKeys[i];
    var deps = dependencies[cacheKey];
    for (var d = 0; d < deps.length; d++) {
      var dep = deps[d];
      if (!reverseDeps[dep]) reverseDeps[dep] = [];
      reverseDeps[dep].push(cacheKey);
    }
  }

  var invalidated = new Set();
  var cascadeLog = [];
  var visited = new Set();

  function cascadeInvalidation(sourceKey, depth) {
    if (visited.has(sourceKey)) return;
    visited.add(sourceKey);

    var dependents = reverseDeps[sourceKey] || [];
    for (var i = 0; i < dependents.length; i++) {
      var dep = dependents[i];
      if (!invalidated.has(dep)) {
        invalidated.add(dep);
        cascadeLog.push({
          cacheKey: dep,
          invalidatedBy: sourceKey,
          depth: depth,
          hadValue: cache[dep] !== undefined
        });
        cascadeInvalidation(dep, depth + 1);
      }
    }
  }

  cascadeInvalidation(changedKey, 1);

  var totalCacheEntries = Object.keys(cache).length;
  var survivingEntries = totalCacheEntries - invalidated.size;

  var depChainLengths = {};
  for (var i = 0; i < cascadeLog.length; i++) {
    var depth = cascadeLog[i].depth;
    depChainLengths[depth] = (depChainLengths[depth] || 0) + 1;
  }

  var maxDepth = 0;
  var depthKeys = Object.keys(depChainLengths);
  for (var i = 0; i < depthKeys.length; i++) {
    var d = Number(depthKeys[i]);
    if (d > maxDepth) maxDepth = d;
  }

  var directDependents = reverseDeps[changedKey] ? reverseDeps[changedKey].length : 0;

  var depStats = {};
  for (var i = 0; i < depKeys.length; i++) {
    var numDeps = dependencies[depKeys[i]].length;
    depStats[numDeps] = (depStats[numDeps] || 0) + 1;
  }

  var mostConnected = depKeys.slice().sort(function(a, b) {
    return (reverseDeps[b] ? reverseDeps[b].length : 0) - (reverseDeps[a] ? reverseDeps[a].length : 0);
  }).slice(0, 5).map(function(k) {
    return { key: k, dependentCount: reverseDeps[k] ? reverseDeps[k].length : 0 };
  });

  return {
    changedKey: changedKey,
    invalidatedCount: invalidated.size,
    totalCacheEntries: totalCacheEntries,
    survivingEntries: survivingEntries,
    invalidationRate: totalCacheEntries > 0 ? invalidated.size / totalCacheEntries : 0,
    directDependents: directDependents,
    cascadeDepth: maxDepth,
    depthDistribution: depChainLengths,
    cascadeLog: cascadeLog.slice(0, 30),
    dependencyDistribution: depStats,
    mostConnectedKeys: mostConnected
  };
}

/**
 * Bloom filter for probabilistic set membership testing. Inserts items
 * and tests membership with configurable false positive rate.
 * @param {Object} input - { size: number, hashCount: number, insertItems: Array, testItems: Array }
 * @returns {Object} Bloom filter test results with false positive analysis
 * @complexity O(n * k) where n = items, k = number of hash functions
 */
export function bloomFilter(input) {
  var size = input.size;
  var hashCount = input.hashCount;
  var insertItems = input.insertItems;
  var testItems = input.testItems;

  var bits = new Array(size);
  for (var i = 0; i < size; i++) bits[i] = 0;

  function hashString(str, seed) {
    var hash = seed;
    for (var i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash + str.charCodeAt(i)) & 0x7FFFFFFF;
      hash = (hash ^ (hash >>> 16)) & 0x7FFFFFFF;
      hash = (hash * 0x45d9f3b + seed) & 0x7FFFFFFF;
    }
    return hash;
  }

  function getHashes(item) {
    var hashes = [];
    for (var h = 0; h < hashCount; h++) {
      var hash1 = hashString(item, h * 0x9e3779b9);
      var hash2 = hashString(item, h * 0x517cc1b7 + 1);
      var combined = Math.abs((hash1 + h * hash2) % size);
      hashes.push(combined);
    }
    return hashes;
  }

  var bitsSetBefore = 0;
  var insertedSet = {};

  for (var i = 0; i < insertItems.length; i++) {
    var hashes = getHashes(insertItems[i]);
    for (var h = 0; h < hashes.length; h++) {
      bits[hashes[h]] = 1;
    }
    insertedSet[insertItems[i]] = true;
  }

  var bitsSet = 0;
  for (var i = 0; i < size; i++) {
    if (bits[i]) bitsSet++;
  }

  var truePositives = 0;
  var trueNegatives = 0;
  var falsePositives = 0;
  var falseNegatives = 0;
  var testResults = [];

  for (var i = 0; i < testItems.length; i++) {
    var item = testItems[i];
    var hashes = getHashes(item);
    var mightExist = true;

    for (var h = 0; h < hashes.length; h++) {
      if (!bits[hashes[h]]) {
        mightExist = false;
        break;
      }
    }

    var actuallyExists = insertedSet[item] === true;

    if (mightExist && actuallyExists) {
      truePositives++;
      testResults.push({ item: item, bloomResult: true, actual: true, correct: true });
    } else if (mightExist && !actuallyExists) {
      falsePositives++;
      testResults.push({ item: item, bloomResult: true, actual: false, correct: false });
    } else if (!mightExist && actuallyExists) {
      falseNegatives++;
      testResults.push({ item: item, bloomResult: false, actual: true, correct: false });
    } else {
      trueNegatives++;
      testResults.push({ item: item, bloomResult: false, actual: false, correct: true });
    }
  }

  var fillRatio = bitsSet / size;
  var theoreticalFPR = Math.pow(fillRatio, hashCount);
  var actualFPR = (falsePositives + trueNegatives) > 0 ? falsePositives / (falsePositives + trueNegatives) : 0;

  return {
    filterSize: size,
    hashCount: hashCount,
    insertedCount: insertItems.length,
    testedCount: testItems.length,
    bitsSet: bitsSet,
    fillRatio: fillRatio,
    truePositives: truePositives,
    trueNegatives: trueNegatives,
    falsePositives: falsePositives,
    falseNegatives: falseNegatives,
    accuracy: testItems.length > 0 ? (truePositives + trueNegatives) / testItems.length : 0,
    theoreticalFalsePositiveRate: theoreticalFPR,
    actualFalsePositiveRate: actualFPR,
    sampleResults: testResults.slice(0, 15)
  };
}

/**
 * Two-tier cache with a small fast L1 (LRU) and a larger L2 (LRU).
 * On L1 miss, checks L2 and promotes to L1. Evicted L1 entries demote to L2.
 * @param {Object} input - { l1Size: number, l2Size: number, operations: Array }
 * @returns {Object} Tiered cache performance statistics
 * @complexity O(1) per operation amortized, O(n) for n operations
 */
export function tieredCache(input) {
  var l1Size = input.l1Size;
  var l2Size = input.l2Size;
  var operations = input.operations;

  var l1 = new Map();
  var l2 = new Map();

  var l1Hits = 0;
  var l2Hits = 0;
  var totalMisses = 0;
  var l1Evictions = 0;
  var l2Evictions = 0;
  var promotions = 0;
  var demotions = 0;
  var sets = 0;
  var operationLog = [];

  function l1Evict() {
    if (l1.size >= l1Size) {
      var lruKey = l1.keys().next().value;
      var lruValue = l1.get(lruKey);
      l1.delete(lruKey);
      l1Evictions++;

      if (l2.size >= l2Size) {
        var l2LruKey = l2.keys().next().value;
        l2.delete(l2LruKey);
        l2Evictions++;
      }
      l2.set(lruKey, lruValue);
      demotions++;
    }
  }

  for (var i = 0; i < operations.length; i++) {
    var op = operations[i];

    if (op.type === 'get') {
      if (l1.has(op.key)) {
        var val = l1.get(op.key);
        l1.delete(op.key);
        l1.set(op.key, val);
        l1Hits++;
        operationLog.push({ index: i, type: 'get', key: op.key, tier: 'L1', result: 'hit' });
      } else if (l2.has(op.key)) {
        var val = l2.get(op.key);
        l2.delete(op.key);
        l2Hits++;
        promotions++;

        l1Evict();
        l1.set(op.key, val);

        operationLog.push({ index: i, type: 'get', key: op.key, tier: 'L2', result: 'hit_promoted' });
      } else {
        totalMisses++;
        operationLog.push({ index: i, type: 'get', key: op.key, tier: 'none', result: 'miss' });
      }
    } else if (op.type === 'set') {
      if (l2.has(op.key)) {
        l2.delete(op.key);
      }

      if (l1.has(op.key)) {
        l1.delete(op.key);
        l1.set(op.key, op.value);
      } else {
        l1Evict();
        l1.set(op.key, op.value);
      }

      sets++;
      operationLog.push({ index: i, type: 'set', key: op.key, result: 'stored_L1' });
    }
  }

  var totalGets = l1Hits + l2Hits + totalMisses;
  var combinedHitRate = totalGets > 0 ? (l1Hits + l2Hits) / totalGets : 0;
  var l1HitRate = totalGets > 0 ? l1Hits / totalGets : 0;
  var l2HitRate = totalGets > 0 ? l2Hits / totalGets : 0;

  var l1Contents = [];
  var l1Iter = l1.entries();
  var e;
  while (!(e = l1Iter.next()).done) l1Contents.push({ key: e.value[0], value: e.value[1] });

  var l2Contents = [];
  var l2Iter = l2.entries();
  while (!(e = l2Iter.next()).done) l2Contents.push({ key: e.value[0], value: e.value[1] });

  return {
    totalOperations: operations.length,
    totalGets: totalGets,
    totalSets: sets,
    l1: {
      size: l1.size,
      capacity: l1Size,
      hits: l1Hits,
      hitRate: l1HitRate,
      evictions: l1Evictions,
      utilization: l1.size / l1Size,
      contents: l1Contents
    },
    l2: {
      size: l2.size,
      capacity: l2Size,
      hits: l2Hits,
      hitRate: l2HitRate,
      evictions: l2Evictions,
      utilization: l2.size / l2Size,
      contents: l2Contents
    },
    combinedHitRate: combinedHitRate,
    missRate: totalGets > 0 ? totalMisses / totalGets : 0,
    promotions: promotions,
    demotions: demotions,
    recentOps: operationLog.slice(-20)
  };
}
