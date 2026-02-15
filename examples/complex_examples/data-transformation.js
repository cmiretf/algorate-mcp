/**
 * Data Transformation & ETL Patterns
 * ====================================
 * Functions for transforming, reshaping, and comparing data structures.
 * Common in data pipelines, import/export features, and analytics dashboards.
 *
 * How to test with algorate MCP tool:
 *
 * 1. flattenNestedJSON
 *    - entryFunction: "flattenNestedJSON"
 *    - inputGenerator: `function generateInput(n) {
 *        function buildNested(depth, breadth) {
 *          if (depth === 0) return Math.random();
 *          const obj = {};
 *          for (let i = 0; i < breadth; i++) {
 *            obj['key' + i] = buildNested(depth - 1, breadth);
 *          }
 *          return obj;
 *        }
 *        const depth = Math.max(2, Math.floor(Math.log2(n)));
 *        const breadth = Math.max(2, Math.floor(Math.sqrt(n)));
 *        return buildNested(depth, breadth);
 *      }`
 *    - Expected complexity: O(n) where n = total number of leaf values
 *
 * 2. csvToJSON
 *    - entryFunction: "csvToJSON"
 *    - inputGenerator: `function generateInput(n) {
 *        const headers = 'id,name,email,age,city,score';
 *        const cities = ['NYC','LA','Chicago','Houston','Phoenix'];
 *        const rows = [headers];
 *        for (let i = 0; i < n; i++) {
 *          rows.push(i + ',User ' + i + ',user' + i + '@test.com,' + (20+Math.floor(Math.random()*40)) + ',' + cities[i%5] + ',' + (Math.random()*100).toFixed(2));
 *        }
 *        return rows.join('\\n');
 *      }`
 *    - Expected complexity: O(n * m) where m = number of columns
 *
 * 3. groupByMultipleKeys
 *    - entryFunction: "groupByMultipleKeys"
 *    - inputGenerator: `function generateInput(n) {
 *        const regions = ['US','EU','APAC'];
 *        const categories = ['electronics','clothing','food','books'];
 *        return {
 *          data: Array.from({length: n}, (_, i) => ({
 *            region: regions[i % 3], category: categories[i % 4],
 *            amount: Math.floor(Math.random() * 1000), quantity: Math.floor(Math.random() * 50)
 *          })),
 *          keys: ['region', 'category']
 *        };
 *      }`
 *    - Expected complexity: O(n)
 *
 * 4. pivotTable
 *    - entryFunction: "pivotTable"
 *    - inputGenerator: `function generateInput(n) {
 *        const months = ['Jan','Feb','Mar','Apr','May','Jun'];
 *        const products = ['Widget','Gadget','Doohickey','Thingamajig'];
 *        return {
 *          data: Array.from({length: n}, (_, i) => ({
 *            month: months[i % 6], product: products[i % 4], revenue: Math.floor(Math.random() * 10000)
 *          })),
 *          rowKey: 'product', colKey: 'month', valueKey: 'revenue'
 *        };
 *      }`
 *    - Expected complexity: O(n)
 *
 * 5. diffObjects
 *    - entryFunction: "diffObjects"
 *    - inputGenerator: `function generateInput(n) {
 *        const obj1 = {}, obj2 = {};
 *        for (let i = 0; i < n; i++) {
 *          obj1['key' + i] = { value: i, nested: { a: i * 2 } };
 *          if (Math.random() > 0.3) obj2['key' + i] = { value: Math.random() > 0.5 ? i : i + 1, nested: { a: i * 2 } };
 *          if (Math.random() > 0.7) obj2['new' + i] = { value: i * 3 };
 *        }
 *        return { obj1, obj2 };
 *      }`
 *    - Expected complexity: O(n * d) where d = max depth
 */

/**
 * Flattens a deeply nested JSON object into a single-level object
 * with dot-notation keys.
 * @param {Object} obj - The nested object to flatten
 * @param {string} [prefix=''] - Key prefix for recursion
 * @returns {Object} Flattened object with dot-notation keys
 * Complexity: O(n) where n = total number of leaf values
 */
export function flattenNestedJSON(obj, prefix) {
  if (prefix === undefined) prefix = '';
  const result = {};

  function flatten(current, currentPrefix) {
    if (current === null || current === undefined) {
      result[currentPrefix] = current;
      return;
    }

    if (Array.isArray(current)) {
      if (current.length === 0) {
        result[currentPrefix] = [];
        return;
      }
      for (let i = 0; i < current.length; i++) {
        flatten(current[i], currentPrefix ? currentPrefix + '.' + i : '' + i);
      }
      return;
    }

    if (typeof current === 'object') {
      const keys = Object.keys(current);
      if (keys.length === 0) {
        result[currentPrefix] = {};
        return;
      }
      for (let i = 0; i < keys.length; i++) {
        const newKey = currentPrefix ? currentPrefix + '.' + keys[i] : keys[i];
        flatten(current[keys[i]], newKey);
      }
      return;
    }

    result[currentPrefix] = current;
  }

  flatten(obj, prefix);
  return result;
}

/**
 * Parses a CSV string into an array of objects using the first row as headers.
 * Handles quoted fields, escaped quotes, and various line endings.
 * @param {string} csvString - Raw CSV string
 * @returns {Array<Object>} Array of row objects
 * Complexity: O(n * m) where n = rows, m = columns
 */
export function csvToJSON(csvString) {
  if (!csvString || typeof csvString !== 'string') return [];

  const lines = csvString.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) return [];

  function parseLine(line) {
    const fields = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          current += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ',') {
          fields.push(current.trim());
          current = '';
        } else {
          current += ch;
        }
      }
    }
    fields.push(current.trim());
    return fields;
  }

  const headers = parseLine(lines[0]);
  const result = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      const val = j < values.length ? values[j] : '';
      const num = Number(val);
      row[headers[j]] = val !== '' && !isNaN(num) && val === String(num) ? num : val;
    }
    result.push(row);
  }

  return result;
}

/**
 * Groups an array of objects by multiple keys, creating a nested grouping structure.
 * Similar to SQL GROUP BY with multiple columns.
 * @param {Object} input - { data: Array, keys: string[] }
 * @returns {Object} Nested grouped object with items at the leaf level
 * Complexity: O(n) where n = data length
 */
export function groupByMultipleKeys(input) {
  const { data, keys } = input;
  if (!keys || keys.length === 0) return { items: data, count: data.length };

  const result = {};

  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    let current = result;

    for (let k = 0; k < keys.length; k++) {
      const keyValue = String(item[keys[k]] !== undefined ? item[keys[k]] : 'undefined');
      if (k === keys.length - 1) {
        if (!current[keyValue]) current[keyValue] = { items: [], count: 0 };
        current[keyValue].items.push(item);
        current[keyValue].count++;
      } else {
        if (!current[keyValue]) current[keyValue] = {};
        current = current[keyValue];
      }
    }
  }

  return result;
}

/**
 * Creates a pivot table from flat data, aggregating values by sum.
 * @param {Object} input - { data: Array, rowKey: string, colKey: string, valueKey: string }
 * @returns {Object} Pivot table with row totals and column totals
 * Complexity: O(n) where n = data length
 */
export function pivotTable(input) {
  const { data, rowKey, colKey, valueKey } = input;
  const table = {};
  const allColumns = new Set();
  const rowTotals = {};
  const colTotals = {};
  let grandTotal = 0;

  for (let i = 0; i < data.length; i++) {
    const row = String(data[i][rowKey]);
    const col = String(data[i][colKey]);
    const val = Number(data[i][valueKey]) || 0;

    allColumns.add(col);
    if (!table[row]) table[row] = {};
    table[row][col] = (table[row][col] || 0) + val;
    rowTotals[row] = (rowTotals[row] || 0) + val;
    colTotals[col] = (colTotals[col] || 0) + val;
    grandTotal += val;
  }

  const columns = Array.from(allColumns).sort();
  const rows = Object.keys(table).sort();

  const pivoted = rows.map(row => {
    const entry = { [rowKey]: row };
    for (let i = 0; i < columns.length; i++) {
      entry[columns[i]] = table[row][columns[i]] || 0;
    }
    entry['_total'] = rowTotals[row] || 0;
    return entry;
  });

  return { rows: pivoted, columns, colTotals, grandTotal };
}

/**
 * Deep diff two objects and return detailed changes: added, removed, modified.
 * @param {Object} input - { obj1: Object, obj2: Object }
 * @returns {Object} Diff result with added, removed, and modified paths
 * Complexity: O(n * d) where n = keys, d = nesting depth
 */
export function diffObjects(input) {
  const { obj1, obj2 } = input;
  const changes = { added: [], removed: [], modified: [], unchanged: 0 };

  function deepEqual(a, b) {
    if (a === b) return true;
    if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false;
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    for (let i = 0; i < keysA.length; i++) {
      if (!b.hasOwnProperty(keysA[i]) || !deepEqual(a[keysA[i]], b[keysA[i]])) return false;
    }
    return true;
  }

  function diff(a, b, path) {
    if (a === null || a === undefined || typeof a !== 'object') {
      if (!deepEqual(a, b)) {
        changes.modified.push({ path, from: a, to: b });
      } else {
        changes.unchanged++;
      }
      return;
    }

    const keysA = Object.keys(a);
    const keysB = new Set(Object.keys(b || {}));

    for (let i = 0; i < keysA.length; i++) {
      const key = keysA[i];
      const newPath = path ? path + '.' + key : key;
      if (!keysB.has(key)) {
        changes.removed.push({ path: newPath, value: a[key] });
      } else {
        diff(a[key], b[key], newPath);
        keysB.delete(key);
      }
    }

    for (const key of keysB) {
      const newPath = path ? path + '.' + key : key;
      changes.added.push({ path: newPath, value: b[key] });
    }
  }

  diff(obj1, obj2, '');

  changes.totalChanges = changes.added.length + changes.removed.length + changes.modified.length;
  return changes;
}
