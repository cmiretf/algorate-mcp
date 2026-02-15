/**
 * Database Operations Patterns
 * =============================
 * Simulated database query patterns common in backend applications.
 * Includes indexed lookups, joins, aggregations, pagination, and search indexing.
 *
 * How to test with algorate MCP tool:
 *
 * 1. indexedLookup
 *    - entryFunction: "indexedLookup"
 *    - inputGenerator: `function generateInput(n) {
 *        var records = [];
 *        for (var i = 0; i < n; i++) {
 *          records.push({ id: i, email: 'user' + i + '@example.com', name: 'User ' + i, age: 18 + (i % 60), department: ['eng','sales','hr','ops','marketing'][i % 5] });
 *        }
 *        return { records: records, indexField: 'email', searchValue: 'user' + Math.floor(n / 2) + '@example.com' };
 *      }`
 *    - Expected complexity: O(n) to build index, O(1) lookup
 *
 * 2. joinTables
 *    - entryFunction: "joinTables"
 *    - inputGenerator: `function generateInput(n) {
 *        var tableA = [];
 *        var tableB = [];
 *        for (var i = 0; i < n; i++) {
 *          tableA.push({ id: i, userId: 'user_' + i, orderId: 'order_' + i, amount: Math.floor(Math.random() * 1000) });
 *          tableB.push({ id: i, userId: 'user_' + (i % Math.max(1, Math.floor(n / 3))), productName: 'Product ' + (i % 20), category: ['A','B','C'][i % 3] });
 *        }
 *        return { tableA: tableA, tableB: tableB, keyA: 'userId', keyB: 'userId' };
 *      }`
 *    - Expected complexity: O(n + m) with hash join
 *
 * 3. aggregateQuery
 *    - entryFunction: "aggregateQuery"
 *    - inputGenerator: `function generateInput(n) {
 *        var records = [];
 *        for (var i = 0; i < n; i++) {
 *          records.push({
 *            id: i, category: ['electronics','clothing','food','books','toys'][i % 5],
 *            region: ['US','EU','APAC'][i % 3], amount: Math.floor(Math.random() * 500) + 10,
 *            quantity: Math.floor(Math.random() * 20) + 1, discount: Math.random() * 0.3
 *          });
 *        }
 *        return { records: records, groupBy: ['category', 'region'], aggregations: [
 *          { field: 'amount', op: 'SUM' }, { field: 'amount', op: 'AVG' },
 *          { field: 'quantity', op: 'COUNT' }, { field: 'discount', op: 'MAX' }, { field: 'amount', op: 'MIN' }
 *        ]};
 *      }`
 *    - Expected complexity: O(n) single pass aggregation
 *
 * 4. paginateWithCursor
 *    - entryFunction: "paginateWithCursor"
 *    - inputGenerator: `function generateInput(n) {
 *        var records = [];
 *        for (var i = 0; i < n; i++) {
 *          records.push({ id: i, createdAt: Date.now() - (n - i) * 1000, title: 'Item ' + i, score: Math.random() * 100 });
 *        }
 *        records.sort(function(a, b) { return a.createdAt - b.createdAt; });
 *        var cursorIdx = Math.floor(n * 0.3);
 *        return { sortedRecords: records, cursor: cursorIdx > 0 ? records[cursorIdx].id : null, limit: 20 };
 *      }`
 *    - Expected complexity: O(n) worst case, O(log n) with binary search on sorted data
 *
 * 5. buildSearchIndex
 *    - entryFunction: "buildSearchIndex"
 *    - inputGenerator: `function generateInput(n) {
 *        var words = ['the','quick','brown','fox','jumps','over','lazy','dog','lorem','ipsum','dolor','sit','amet','hello','world','data','search','index','query','fast'];
 *        var documents = [];
 *        for (var i = 0; i < n; i++) {
 *          var title = '';
 *          var body = '';
 *          for (var w = 0; w < 5; w++) title += (w > 0 ? ' ' : '') + words[Math.floor(Math.random() * words.length)];
 *          for (var w = 0; w < 20; w++) body += (w > 0 ? ' ' : '') + words[Math.floor(Math.random() * words.length)];
 *          documents.push({ id: i, title: title, body: body, tags: [words[i % 20], words[(i+3) % 20]] });
 *        }
 *        return { documents: documents, fields: ['title', 'body'] };
 *      }`
 *    - Expected complexity: O(n * w) where n = documents, w = avg words per document
 */

/**
 * Builds a hash index on a specified field and performs O(1) lookup.
 * Also compares with a linear scan to demonstrate the difference.
 * @param {Object} input - { records: Array, indexField: string, searchValue: any }
 * @returns {Object} Lookup results with both methods and comparison stats
 * @complexity O(n) to build index, O(1) for indexed lookup
 */
export function indexedLookup(input) {
  var records = input.records;
  var indexField = input.indexField;
  var searchValue = input.searchValue;

  var index = {};
  var collisions = 0;
  for (var i = 0; i < records.length; i++) {
    var key = records[i][indexField];
    if (key !== undefined && key !== null) {
      var keyStr = String(key);
      if (!index[keyStr]) {
        index[keyStr] = [];
      } else {
        collisions++;
      }
      index[keyStr].push({ record: records[i], position: i });
    }
  }

  var indexedResult = index[String(searchValue)] || [];

  var linearResult = [];
  var linearComparisons = 0;
  for (var i = 0; i < records.length; i++) {
    linearComparisons++;
    if (String(records[i][indexField]) === String(searchValue)) {
      linearResult.push({ record: records[i], position: i });
    }
  }

  var uniqueKeys = Object.keys(index).length;
  var avgBucketSize = records.length / Math.max(1, uniqueKeys);
  var maxBucketSize = 0;
  var bucketSizes = {};
  var indexKeys = Object.keys(index);
  for (var k = 0; k < indexKeys.length; k++) {
    var size = index[indexKeys[k]].length;
    if (size > maxBucketSize) maxBucketSize = size;
    bucketSizes[size] = (bucketSizes[size] || 0) + 1;
  }

  return {
    found: indexedResult.length > 0,
    matchCount: indexedResult.length,
    results: indexedResult.slice(0, 10),
    indexStats: {
      totalRecords: records.length,
      uniqueKeys: uniqueKeys,
      collisions: collisions,
      avgBucketSize: avgBucketSize,
      maxBucketSize: maxBucketSize,
      bucketDistribution: bucketSizes
    },
    comparison: {
      indexedComparisons: 1,
      linearComparisons: linearComparisons,
      speedupFactor: linearComparisons > 0 ? linearComparisons / 1 : 0,
      indexMemoryKeys: uniqueKeys
    }
  };
}

/**
 * Simulates an SQL JOIN operation using a hash join strategy.
 * Groups records from tableB by the join key, then iterates tableA.
 * @param {Object} input - { tableA: Array, tableB: Array, keyA: string, keyB: string }
 * @returns {Object} Joined results with join statistics
 * @complexity O(n + m) where n = tableA.length, m = tableB.length (hash join)
 */
export function joinTables(input) {
  var tableA = input.tableA;
  var tableB = input.tableB;
  var keyA = input.keyA;
  var keyB = input.keyB;

  var hashTable = {};
  for (var i = 0; i < tableB.length; i++) {
    var key = String(tableB[i][keyB]);
    if (!hashTable[key]) {
      hashTable[key] = [];
    }
    hashTable[key].push(tableB[i]);
  }

  var innerJoin = [];
  var leftUnmatched = [];
  var matchedAKeys = new Set();
  var matchedBIndices = new Set();

  for (var i = 0; i < tableA.length; i++) {
    var lookupKey = String(tableA[i][keyA]);
    var matches = hashTable[lookupKey];

    if (matches && matches.length > 0) {
      matchedAKeys.add(i);
      for (var j = 0; j < matches.length; j++) {
        var joined = {};
        var aKeys = Object.keys(tableA[i]);
        for (var k = 0; k < aKeys.length; k++) {
          joined['a_' + aKeys[k]] = tableA[i][aKeys[k]];
        }
        var bKeys = Object.keys(matches[j]);
        for (var k = 0; k < bKeys.length; k++) {
          joined['b_' + bKeys[k]] = matches[j][bKeys[k]];
        }
        innerJoin.push(joined);

        for (var bi = 0; bi < tableB.length; bi++) {
          if (tableB[bi] === matches[j]) matchedBIndices.add(bi);
        }
      }
    } else {
      leftUnmatched.push(tableA[i]);
    }
  }

  var rightUnmatched = [];
  for (var i = 0; i < tableB.length; i++) {
    if (!matchedBIndices.has(i)) {
      rightUnmatched.push(tableB[i]);
    }
  }

  var hashBuckets = Object.keys(hashTable).length;

  return {
    innerJoinCount: innerJoin.length,
    innerJoinSample: innerJoin.slice(0, 10),
    leftUnmatchedCount: leftUnmatched.length,
    rightUnmatchedCount: rightUnmatched.length,
    stats: {
      tableASize: tableA.length,
      tableBSize: tableB.length,
      hashBuckets: hashBuckets,
      avgMatchesPerKey: innerJoin.length / Math.max(1, matchedAKeys.size),
      joinSelectivity: innerJoin.length / Math.max(1, tableA.length * tableB.length),
      matchRateA: matchedAKeys.size / Math.max(1, tableA.length),
      matchRateB: matchedBIndices.size / Math.max(1, tableB.length)
    }
  };
}

/**
 * Performs GROUP BY with multiple aggregation operations (SUM, AVG, COUNT, MAX, MIN).
 * Groups records by one or more fields and computes aggregations per group.
 * @param {Object} input - { records: Array, groupBy: Array<string>, aggregations: Array<{field, op}> }
 * @returns {Object} Grouped aggregation results
 * @complexity O(n * g) where n = records, g = number of groupBy fields
 */
export function aggregateQuery(input) {
  var records = input.records;
  var groupBy = input.groupBy;
  var aggregations = input.aggregations;

  var groups = {};

  for (var i = 0; i < records.length; i++) {
    var keyParts = [];
    for (var g = 0; g < groupBy.length; g++) {
      keyParts.push(String(records[i][groupBy[g]] || 'NULL'));
    }
    var groupKey = keyParts.join('|');

    if (!groups[groupKey]) {
      var meta = {};
      for (var g = 0; g < groupBy.length; g++) {
        meta[groupBy[g]] = records[i][groupBy[g]];
      }
      groups[groupKey] = { meta: meta, values: {} };
      for (var a = 0; a < aggregations.length; a++) {
        var aggKey = aggregations[a].op + '_' + aggregations[a].field;
        groups[groupKey].values[aggKey] = { sum: 0, count: 0, min: Infinity, max: -Infinity };
      }
    }

    var group = groups[groupKey];
    for (var a = 0; a < aggregations.length; a++) {
      var agg = aggregations[a];
      var aggKey = agg.op + '_' + agg.field;
      var val = records[i][agg.field];
      if (val !== undefined && val !== null) {
        var numVal = Number(val);
        group.values[aggKey].sum += numVal;
        group.values[aggKey].count++;
        if (numVal < group.values[aggKey].min) group.values[aggKey].min = numVal;
        if (numVal > group.values[aggKey].max) group.values[aggKey].max = numVal;
      }
    }
  }

  var results = [];
  var groupKeys = Object.keys(groups);
  for (var k = 0; k < groupKeys.length; k++) {
    var g = groups[groupKeys[k]];
    var row = {};
    var metaKeys = Object.keys(g.meta);
    for (var m = 0; m < metaKeys.length; m++) {
      row[metaKeys[m]] = g.meta[metaKeys[m]];
    }

    for (var a = 0; a < aggregations.length; a++) {
      var agg = aggregations[a];
      var aggKey = agg.op + '_' + agg.field;
      var v = g.values[aggKey];
      switch (agg.op) {
        case 'SUM': row[aggKey] = v.sum; break;
        case 'AVG': row[aggKey] = v.count > 0 ? v.sum / v.count : 0; break;
        case 'COUNT': row[aggKey] = v.count; break;
        case 'MAX': row[aggKey] = v.max === -Infinity ? null : v.max; break;
        case 'MIN': row[aggKey] = v.min === Infinity ? null : v.min; break;
        default: row[aggKey] = v.sum;
      }
    }
    results.push(row);
  }

  results.sort(function(a, b) {
    for (var g = 0; g < groupBy.length; g++) {
      var field = groupBy[g];
      if (a[field] < b[field]) return -1;
      if (a[field] > b[field]) return 1;
    }
    return 0;
  });

  return {
    totalRecords: records.length,
    groupCount: results.length,
    groupByFields: groupBy,
    aggregationOps: aggregations.map(function(a) { return a.op + '(' + a.field + ')'; }),
    results: results
  };
}

/**
 * Cursor-based pagination that finds the cursor position via binary search
 * on sorted records and returns the next page of results.
 * @param {Object} input - { sortedRecords: Array, cursor: any, limit: number }
 * @returns {Object} Page results with cursor metadata
 * @complexity O(log n) with binary search for cursor, O(limit) for page extraction
 */
export function paginateWithCursor(input) {
  var sortedRecords = input.sortedRecords;
  var cursor = input.cursor;
  var limit = input.limit;

  var startIdx = 0;

  if (cursor !== null && cursor !== undefined) {
    var lo = 0;
    var hi = sortedRecords.length - 1;
    var found = -1;

    while (lo <= hi) {
      var mid = Math.floor((lo + hi) / 2);
      if (sortedRecords[mid].id === cursor) {
        found = mid;
        break;
      } else if (sortedRecords[mid].id < cursor) {
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }

    if (found === -1) {
      for (var i = 0; i < sortedRecords.length; i++) {
        if (sortedRecords[i].id === cursor) {
          found = i;
          break;
        }
      }
    }

    startIdx = found >= 0 ? found + 1 : 0;
  }

  var endIdx = Math.min(startIdx + limit, sortedRecords.length);
  var page = sortedRecords.slice(startIdx, endIdx);

  var hasMore = endIdx < sortedRecords.length;
  var nextCursor = page.length > 0 ? page[page.length - 1].id : null;
  var prevCursor = startIdx > 0 ? sortedRecords[Math.max(0, startIdx - 1)].id : null;

  var totalPages = Math.ceil(sortedRecords.length / limit);
  var currentPage = Math.floor(startIdx / limit) + 1;

  return {
    data: page,
    pageSize: page.length,
    cursor: {
      current: cursor,
      next: hasMore ? nextCursor : null,
      previous: prevCursor,
      hasMore: hasMore,
      hasPrevious: startIdx > 0
    },
    pagination: {
      totalRecords: sortedRecords.length,
      estimatedTotalPages: totalPages,
      currentPage: currentPage,
      startIndex: startIdx,
      endIndex: endIdx - 1,
      limit: limit
    }
  };
}

/**
 * Builds an inverted index for full-text search across document fields.
 * Tokenizes text, normalizes terms, and creates term-to-document mappings
 * with term frequency and positional information.
 * @param {Object} input - { documents: Array, fields: Array<string> }
 * @returns {Object} Inverted index with search statistics
 * @complexity O(n * w) where n = documents, w = average words per document
 */
export function buildSearchIndex(input) {
  var documents = input.documents;
  var fields = input.fields;

  var invertedIndex = {};
  var docLengths = {};
  var totalTerms = 0;
  var fieldStats = {};

  for (var f = 0; f < fields.length; f++) {
    fieldStats[fields[f]] = { totalTerms: 0, uniqueTerms: new Set(), avgLength: 0 };
  }

  for (var d = 0; d < documents.length; d++) {
    var doc = documents[d];
    var docId = doc.id !== undefined ? doc.id : d;
    docLengths[docId] = 0;

    for (var f = 0; f < fields.length; f++) {
      var fieldName = fields[f];
      var text = doc[fieldName];
      if (!text || typeof text !== 'string') continue;

      var normalized = text.toLowerCase().replace(/[^a-z0-9\s]/g, '');
      var tokens = normalized.split(/\s+/).filter(function(t) { return t.length > 0; });

      var stopWords = { 'the': 1, 'a': 1, 'an': 1, 'is': 1, 'it': 1, 'in': 1, 'on': 1, 'at': 1, 'to': 1, 'of': 1 };

      for (var t = 0; t < tokens.length; t++) {
        var term = tokens[t];
        if (stopWords[term]) continue;

        totalTerms++;
        docLengths[docId]++;
        fieldStats[fieldName].totalTerms++;
        fieldStats[fieldName].uniqueTerms.add(term);

        if (!invertedIndex[term]) {
          invertedIndex[term] = { df: 0, postings: {} };
        }

        var termEntry = invertedIndex[term];
        if (!termEntry.postings[docId]) {
          termEntry.postings[docId] = { tf: 0, fields: {}, positions: [] };
          termEntry.df++;
        }

        termEntry.postings[docId].tf++;
        if (!termEntry.postings[docId].fields[fieldName]) {
          termEntry.postings[docId].fields[fieldName] = 0;
        }
        termEntry.postings[docId].fields[fieldName]++;
        termEntry.postings[docId].positions.push(t);
      }
    }
  }

  var terms = Object.keys(invertedIndex);
  var termsByFrequency = terms.slice().sort(function(a, b) {
    return invertedIndex[b].df - invertedIndex[a].df;
  });

  var topTerms = termsByFrequency.slice(0, 20).map(function(term) {
    return { term: term, documentFrequency: invertedIndex[term].df, idf: Math.log(documents.length / (1 + invertedIndex[term].df)) };
  });

  var fieldStatsResult = {};
  for (var f = 0; f < fields.length; f++) {
    var fs = fieldStats[fields[f]];
    fieldStatsResult[fields[f]] = {
      totalTerms: fs.totalTerms,
      uniqueTerms: fs.uniqueTerms.size,
      avgTermsPerDoc: fs.totalTerms / Math.max(1, documents.length)
    };
  }

  return {
    documentCount: documents.length,
    uniqueTerms: terms.length,
    totalTermOccurrences: totalTerms,
    avgDocLength: totalTerms / Math.max(1, documents.length),
    topTerms: topTerms,
    fieldStats: fieldStatsResult,
    indexSizeEstimate: terms.length * 50 + totalTerms * 20,
    sampleEntries: terms.slice(0, 5).map(function(t) {
      return { term: t, df: invertedIndex[t].df, samplePostings: Object.keys(invertedIndex[t].postings).slice(0, 3) };
    })
  };
}
