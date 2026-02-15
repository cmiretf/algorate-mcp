/**
 * File & Text Processing Patterns
 * =================================
 * Functions for parsing CSV files, computing line diffs, run-length encoding
 * compression/decompression, and template-based data extraction. Common in
 * ETL pipelines, file converters, and data processing utilities.
 *
 * How to test with algorate MCP tool:
 *
 * 1. parseCSVWithQuotes
 *    - entryFunction: "parseCSVWithQuotes"
 *    - inputGenerator: `function generateInput(n) {
 *        const rows = ['name,age,city,bio'];
 *        for (let i = 0; i < n; i++) {
 *          const hasQuotes = i % 3 === 0;
 *          const hasComma = i % 5 === 0;
 *          const name = hasQuotes ? '"Smith, John ""JJ""' + i + '"' : 'User' + i;
 *          const bio = hasComma ? '"Likes coding, reading, and ' + i + '"' : 'bio' + i;
 *          rows.push(name + ',' + (20 + i % 50) + ',' + 'City' + (i % 20) + ',' + bio);
 *        }
 *        return rows.join('\\n');
 *      }`
 *    - Expected complexity: O(n * L) where n = rows, L = avg row length
 *
 * 2. diffLines
 *    - entryFunction: "diffLines"
 *    - inputGenerator: `function generateInput(n) {
 *        var linesA = [];
 *        var linesB = [];
 *        for (var i = 0; i < n; i++) {
 *          var line = 'line ' + i + ' content here';
 *          linesA.push(line);
 *          if (i % 7 === 0) linesB.push('MODIFIED ' + line);
 *          else if (i % 11 !== 0) linesB.push(line);
 *        }
 *        for (var j = 0; j < Math.floor(n / 10); j++) linesB.push('new line ' + j);
 *        return { textA: linesA.join('\\n'), textB: linesB.join('\\n') };
 *      }`
 *    - Expected complexity: O(n * m) where n, m = line counts of each text
 *
 * 3. compressText
 *    - entryFunction: "compressText"
 *    - inputGenerator: `function generateInput(n) {
 *        var text = '';
 *        for (var i = 0; i < n; i++) {
 *          var ch = String.fromCharCode(65 + (i % 26));
 *          var rep = Math.floor(Math.random() * 8) + 1;
 *          text += ch.repeat(rep);
 *        }
 *        return text;
 *      }`
 *    - Expected complexity: O(n) where n = text length
 *
 * 4. decompressText
 *    - entryFunction: "decompressText"
 *    - inputGenerator: `function generateInput(n) {
 *        var compressed = '';
 *        for (var i = 0; i < n; i++) {
 *          var ch = String.fromCharCode(65 + (i % 26));
 *          var count = Math.floor(Math.random() * 8) + 2;
 *          compressed += count + ch;
 *        }
 *        return compressed;
 *      }`
 *    - Expected complexity: O(n + total_decompressed_length)
 *
 * 5. extractStructuredData
 *    - entryFunction: "extractStructuredData"
 *    - inputGenerator: `function generateInput(n) {
 *        var lines = [];
 *        for (var i = 0; i < n; i++) {
 *          lines.push('Name: User' + i + ' | Email: user' + i + '@example.com | Age: ' + (20 + i % 50) + ' | Score: ' + (Math.random() * 100).toFixed(1));
 *        }
 *        return {
 *          template: 'Name: {{name}} | Email: {{email}} | Age: {{age}} | Score: {{score}}',
 *          text: lines.join('\\n')
 *        };
 *      }`
 *    - Expected complexity: O(n * T) where n = lines, T = template token count
 */

/**
 * Parses CSV text handling quoted fields, escaped quotes, commas within quotes,
 * and newlines within quoted values. Returns parsed rows and column metadata.
 * @param {string} csvText - Raw CSV text string
 * @returns {Object} Parsed rows, headers, and parsing statistics
 * @complexity O(n * L) where n = number of rows, L = avg row length
 */
export function parseCSVWithQuotes(csvText) {
  if (!csvText || typeof csvText !== 'string') {
    return { headers: [], rows: [], totalRows: 0, errors: [] };
  }

  const rows = [];
  let currentRow = [];
  let currentField = '';
  let inQuotes = false;
  let i = 0;
  const errors = [];
  let fieldCount = 0;

  while (i < csvText.length) {
    const ch = csvText[i];

    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < csvText.length && csvText[i + 1] === '"') {
          currentField += '"';
          i += 2;
          continue;
        } else {
          inQuotes = false;
          i++;
          continue;
        }
      } else {
        currentField += ch;
        i++;
        continue;
      }
    }

    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }

    if (ch === ',') {
      currentRow.push(currentField.trim());
      currentField = '';
      fieldCount++;
      i++;
      continue;
    }

    if (ch === '\n' || (ch === '\r' && i + 1 < csvText.length && csvText[i + 1] === '\n')) {
      currentRow.push(currentField.trim());
      currentField = '';
      fieldCount++;

      if (currentRow.length > 0 && currentRow.some(f => f.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];

      if (ch === '\r') i += 2;
      else i++;
      continue;
    }

    if (ch === '\r') {
      currentRow.push(currentField.trim());
      currentField = '';
      fieldCount++;
      if (currentRow.length > 0 && currentRow.some(f => f.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      i++;
      continue;
    }

    currentField += ch;
    i++;
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    fieldCount++;
    if (currentRow.some(f => f.length > 0)) {
      rows.push(currentRow);
    }
  }

  if (inQuotes) {
    errors.push('Unterminated quoted field at end of input');
  }

  const headers = rows.length > 0 ? rows[0] : [];
  const dataRows = rows.slice(1);

  const columnStats = {};
  for (let c = 0; c < headers.length; c++) {
    const colName = headers[c] || ('column_' + c);
    const values = dataRows.map(r => r[c] || '');
    const nonEmpty = values.filter(v => v.length > 0);
    const numeric = nonEmpty.filter(v => !isNaN(Number(v)));

    columnStats[colName] = {
      totalValues: values.length,
      nonEmpty: nonEmpty.length,
      emptyCount: values.length - nonEmpty.length,
      isNumeric: numeric.length > nonEmpty.length * 0.8,
      uniqueValues: new Set(values).size,
      maxLength: Math.max(0, ...values.map(v => v.length))
    };
  }

  const inconsistentRows = [];
  for (let r = 0; r < dataRows.length; r++) {
    if (dataRows[r].length !== headers.length) {
      inconsistentRows.push({ row: r + 1, expected: headers.length, actual: dataRows[r].length });
    }
  }

  return {
    headers,
    rows: dataRows.slice(0, 50),
    totalRows: dataRows.length,
    columnCount: headers.length,
    totalFields: fieldCount,
    columnStats,
    inconsistentRows: inconsistentRows.slice(0, 10),
    errors
  };
}

/**
 * Computes a line-by-line diff between two texts using a simplified LCS algorithm.
 * Returns added, removed, and unchanged lines with indices.
 * @param {Object} input - { textA, textB }
 * @param {string} input.textA - Original text
 * @param {string} input.textB - Modified text
 * @returns {Object} Diff result with changes, statistics, and hunks
 * @complexity O(n * m) where n, m = line counts of each text
 */
export function diffLines(input) {
  const { textA, textB } = input;
  const linesA = textA.split('\n');
  const linesB = textB.split('\n');
  const n = linesA.length;
  const m = linesB.length;

  const maxSize = 2000;
  if (n > maxSize || m > maxSize) {
    const changes = [];
    let ia = 0, ib = 0;
    while (ia < n || ib < m) {
      if (ia < n && ib < m && linesA[ia] === linesB[ib]) {
        changes.push({ type: 'unchanged', lineA: ia, lineB: ib, content: linesA[ia] });
        ia++; ib++;
      } else if (ib < m && (ia >= n || linesA[ia] !== linesB[ib])) {
        changes.push({ type: 'added', lineB: ib, content: linesB[ib] });
        ib++;
      } else {
        changes.push({ type: 'removed', lineA: ia, content: linesA[ia] });
        ia++;
      }
    }
    const added = changes.filter(c => c.type === 'added').length;
    const removed = changes.filter(c => c.type === 'removed').length;
    const unchanged = changes.filter(c => c.type === 'unchanged').length;
    return {
      changes: changes.slice(0, 100),
      totalChanges: changes.length,
      added, removed, unchanged,
      similarity: n + m > 0 ? +((2 * unchanged) / (n + m) * 100).toFixed(2) : 100,
      linesA: n, linesB: m, algorithm: 'linear'
    };
  }

  const dp = [];
  for (let i = 0; i <= n; i++) {
    dp[i] = new Array(m + 1).fill(0);
  }

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (linesA[i - 1] === linesB[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const changes = [];
  let i = n, j = m;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && linesA[i - 1] === linesB[j - 1]) {
      changes.unshift({ type: 'unchanged', lineA: i - 1, lineB: j - 1, content: linesA[i - 1] });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      changes.unshift({ type: 'added', lineB: j - 1, content: linesB[j - 1] });
      j--;
    } else {
      changes.unshift({ type: 'removed', lineA: i - 1, content: linesA[i - 1] });
      i--;
    }
  }

  const added = changes.filter(c => c.type === 'added').length;
  const removed = changes.filter(c => c.type === 'removed').length;
  const unchanged = changes.filter(c => c.type === 'unchanged').length;

  const hunks = [];
  let hunkStart = -1;
  let currentHunk = [];

  for (let k = 0; k < changes.length; k++) {
    if (changes[k].type !== 'unchanged') {
      if (hunkStart === -1) hunkStart = k;
      currentHunk.push(changes[k]);
    } else if (currentHunk.length > 0) {
      hunks.push({
        startIndex: hunkStart,
        changes: currentHunk,
        size: currentHunk.length
      });
      currentHunk = [];
      hunkStart = -1;
    }
  }
  if (currentHunk.length > 0) {
    hunks.push({ startIndex: hunkStart, changes: currentHunk, size: currentHunk.length });
  }

  return {
    changes: changes.slice(0, 100),
    totalChanges: changes.length,
    added,
    removed,
    unchanged,
    similarity: n + m > 0 ? +((2 * unchanged) / (n + m) * 100).toFixed(2) : 100,
    linesA: n,
    linesB: m,
    hunkCount: hunks.length,
    hunks: hunks.slice(0, 20),
    algorithm: 'lcs'
  };
}

/**
 * Compresses text using run-length encoding. Consecutive repeated characters
 * are encoded as count + character pairs.
 * @param {string} text - The text to compress
 * @returns {Object} Compressed text with compression statistics
 * @complexity O(n) where n = length of input text
 */
export function compressText(text) {
  if (!text || typeof text !== 'string' || text.length === 0) {
    return { compressed: '', originalSize: 0, compressedSize: 0, ratio: 1, runs: 0 };
  }

  let compressed = '';
  let i = 0;
  let runs = 0;
  let maxRun = 0;
  let singleCharRuns = 0;
  const charFrequency = {};

  while (i < text.length) {
    const ch = text[i];
    charFrequency[ch] = (charFrequency[ch] || 0) + 1;
    let count = 1;

    while (i + count < text.length && text[i + count] === ch) {
      count++;
      charFrequency[ch]++;
    }

    if (count > 1) {
      compressed += count + ch;
      if (count > maxRun) maxRun = count;
    } else {
      compressed += ch;
      singleCharRuns++;
    }

    runs++;
    i += count;
  }

  const originalSize = text.length;
  const compressedSize = compressed.length;
  const ratio = originalSize > 0 ? +(compressedSize / originalSize).toFixed(4) : 1;

  const topChars = Object.entries(charFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([ch, freq]) => ({ char: ch, frequency: freq, percent: +((freq / originalSize) * 100).toFixed(1) }));

  return {
    compressed,
    originalSize,
    compressedSize,
    ratio,
    savings: originalSize - compressedSize,
    savingsPercent: +((1 - ratio) * 100).toFixed(2),
    runs,
    maxRunLength: maxRun,
    singleCharRuns,
    uniqueChars: Object.keys(charFrequency).length,
    topChars,
    effective: compressedSize < originalSize
  };
}

/**
 * Decompresses run-length encoded text. Reads count + character pairs and
 * expands them back to the original text.
 * @param {string} compressed - The run-length encoded string
 * @returns {Object} Decompressed text with expansion statistics
 * @complexity O(n + total_decompressed_length) where n = compressed length
 */
export function decompressText(compressed) {
  if (!compressed || typeof compressed !== 'string' || compressed.length === 0) {
    return { decompressed: '', compressedSize: 0, decompressedSize: 0, expansionRatio: 1, runs: 0 };
  }

  let decompressed = '';
  let i = 0;
  let runs = 0;
  let maxExpansion = 0;
  let totalExpanded = 0;
  let errors = [];

  while (i < compressed.length) {
    let numStr = '';

    while (i < compressed.length && compressed[i] >= '0' && compressed[i] <= '9') {
      numStr += compressed[i];
      i++;
    }

    if (i >= compressed.length) {
      if (numStr.length > 0) {
        errors.push('Trailing number without character: ' + numStr);
      }
      break;
    }

    const ch = compressed[i];
    i++;

    if (numStr.length > 0) {
      const count = parseInt(numStr);
      if (count > 10000) {
        errors.push('Extremely large run count: ' + count + ' for char ' + ch);
        decompressed += ch.repeat(Math.min(count, 10000));
        totalExpanded += Math.min(count, 10000);
      } else {
        decompressed += ch.repeat(count);
        totalExpanded += count;
      }
      if (count > maxExpansion) maxExpansion = count;
    } else {
      decompressed += ch;
      totalExpanded += 1;
    }

    runs++;
  }

  const compressedSize = compressed.length;
  const decompressedSize = decompressed.length;
  const expansionRatio = compressedSize > 0 ? +(decompressedSize / compressedSize).toFixed(4) : 1;

  const charCounts = {};
  for (let c = 0; c < decompressed.length; c++) {
    charCounts[decompressed[c]] = (charCounts[decompressed[c]] || 0) + 1;
  }

  return {
    decompressed: decompressed.length > 10000 ? decompressed.substring(0, 10000) + '...' : decompressed,
    compressedSize,
    decompressedSize,
    expansionRatio,
    runs,
    maxExpansion,
    uniqueChars: Object.keys(charCounts).length,
    errors
  };
}

/**
 * Extracts structured data from unstructured text using a template with
 * named placeholders ({{fieldName}}). Matches each line against the template
 * and extracts values for each field.
 * @param {Object} input - { template, text }
 * @param {string} input.template - Template string with {{field}} placeholders
 * @param {string} input.text - Multi-line text to extract data from
 * @returns {Object} Extracted records with field statistics
 * @complexity O(n * T) where n = lines, T = number of template tokens
 */
export function extractStructuredData(input) {
  const { template, text } = input;

  const placeholderRegex = /\{\{(\w+)\}\}/g;
  const fieldNames = [];
  let match;
  while ((match = placeholderRegex.exec(template)) !== null) {
    fieldNames.push(match[1]);
  }

  const parts = template.split(/\{\{\w+\}\}/);
  const regexParts = parts.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  let regexStr = '^';
  for (let i = 0; i < regexParts.length; i++) {
    regexStr += regexParts[i];
    if (i < fieldNames.length) {
      regexStr += '(.+?)';
    }
  }
  regexStr += '$';

  let lineRegex;
  try {
    lineRegex = new RegExp(regexStr);
  } catch (e) {
    return { records: [], fieldNames, totalLines: 0, matchedLines: 0, errors: ['Invalid template regex: ' + e.message] };
  }

  const lines = text.split('\n').filter(l => l.trim().length > 0);
  const records = [];
  let matchedLines = 0;
  let unmatchedLines = 0;
  const fieldStats = {};

  for (let f = 0; f < fieldNames.length; f++) {
    fieldStats[fieldNames[f]] = { count: 0, minLength: Infinity, maxLength: 0, samples: [] };
  }

  for (let i = 0; i < lines.length; i++) {
    const lineMatch = lines[i].match(lineRegex);

    if (lineMatch) {
      matchedLines++;
      const record = {};

      for (let f = 0; f < fieldNames.length; f++) {
        const value = lineMatch[f + 1] ? lineMatch[f + 1].trim() : '';
        record[fieldNames[f]] = value;

        const stats = fieldStats[fieldNames[f]];
        stats.count++;
        if (value.length < stats.minLength) stats.minLength = value.length;
        if (value.length > stats.maxLength) stats.maxLength = value.length;
        if (stats.samples.length < 3) stats.samples.push(value);
      }

      records.push(record);
    } else {
      unmatchedLines++;
    }
  }

  for (const f in fieldStats) {
    if (fieldStats[f].minLength === Infinity) fieldStats[f].minLength = 0;
    const numericCount = records.filter(r => !isNaN(Number(r[f]))).length;
    fieldStats[f].isNumeric = numericCount > records.length * 0.8;
    fieldStats[f].uniqueValues = new Set(records.map(r => r[f])).size;
  }

  return {
    records: records.slice(0, 50),
    totalRecords: records.length,
    fieldNames,
    fieldCount: fieldNames.length,
    totalLines: lines.length,
    matchedLines,
    unmatchedLines,
    matchRate: lines.length > 0 ? +((matchedLines / lines.length) * 100).toFixed(2) : 0,
    fieldStats,
    templatePattern: regexStr
  };
}
