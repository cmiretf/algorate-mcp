/**
 * Data Structures for Fullstack Applications
 * ============================================
 * Common data structures used in backend services, caching layers, search
 * systems, and real-time data processing. Includes priority queues, tries,
 * linked lists, hash tables, and ring buffers.
 *
 * How to test with algorate MCP tool:
 *
 * 1. priorityQueue
 *    - entryFunction: "priorityQueue"
 *    - inputGenerator: `function generateInput(n) {
 *        return Array.from({length: n}, (_, i) => ({
 *          value: 'task_' + i,
 *          priority: Math.floor(Math.random() * 1000)
 *        }));
 *      }`
 *    - Expected complexity: O(n log n) due to n insertions each O(log n)
 *
 * 2. trieOperations
 *    - entryFunction: "trieOperations"
 *    - inputGenerator: `function generateInput(n) {
 *        const chars = 'abcdefghijklmnopqrstuvwxyz';
 *        return Array.from({length: n}, () => {
 *          const len = Math.floor(Math.random() * 10) + 3;
 *          let word = '';
 *          for (let j = 0; j < len; j++) word += chars[Math.floor(Math.random() * 26)];
 *          return word;
 *        });
 *      }`
 *    - Expected complexity: O(n * L) where L = avg word length
 *
 * 3. linkedListOperations
 *    - entryFunction: "linkedListOperations"
 *    - inputGenerator: `function generateInput(n) {
 *        return Array.from({length: n}, (_, i) => i * 2 + 1);
 *      }`
 *    - Expected complexity: O(n)
 *
 * 4. hashTableWithChaining
 *    - entryFunction: "hashTableWithChaining"
 *    - inputGenerator: `function generateInput(n) {
 *        return {
 *          entries: Array.from({length: n}, (_, i) => ({
 *            key: 'key_' + Math.floor(Math.random() * n),
 *            value: 'val_' + i
 *          })),
 *          buckets: Math.max(1, Math.floor(n / 4))
 *        };
 *      }`
 *    - Expected complexity: O(n) average, O(n^2) worst case with poor hash
 *
 * 5. ringBuffer
 *    - entryFunction: "ringBuffer"
 *    - inputGenerator: `function generateInput(n) {
 *        return {
 *          capacity: Math.max(1, Math.floor(n / 3)),
 *          items: Array.from({length: n}, (_, i) => ({ id: i, data: 'log_entry_' + i, timestamp: Date.now() + i }))
 *        };
 *      }`
 *    - Expected complexity: O(n)
 */

/**
 * Implements a min-heap based priority queue. Inserts all items and then
 * extracts them in priority order (lowest priority value first).
 * @param {Array<Object>} items - Array of { value, priority } objects
 * @returns {Object} Priority queue operations result with insertion and extraction traces
 * @complexity O(n log n) due to n insertions/extractions each O(log n)
 */
export function priorityQueue(items) {
  const heap = [];

  function swap(i, j) {
    const tmp = heap[i];
    heap[i] = heap[j];
    heap[j] = tmp;
  }

  function siftUp(idx) {
    let current = idx;
    while (current > 0) {
      const parent = Math.floor((current - 1) / 2);
      if (heap[current].priority < heap[parent].priority) {
        swap(current, parent);
        current = parent;
      } else {
        break;
      }
    }
  }

  function siftDown(idx) {
    const length = heap.length;
    let current = idx;
    while (true) {
      let smallest = current;
      const left = 2 * current + 1;
      const right = 2 * current + 2;

      if (left < length && heap[left].priority < heap[smallest].priority) {
        smallest = left;
      }
      if (right < length && heap[right].priority < heap[smallest].priority) {
        smallest = right;
      }

      if (smallest !== current) {
        swap(current, smallest);
        current = smallest;
      } else {
        break;
      }
    }
  }

  function insert(item) {
    heap.push(item);
    siftUp(heap.length - 1);
  }

  function extractMin() {
    if (heap.length === 0) return null;
    const min = heap[0];
    const last = heap.pop();
    if (heap.length > 0) {
      heap[0] = last;
      siftDown(0);
    }
    return min;
  }

  let totalComparisons = 0;
  const insertTrace = [];

  for (let i = 0; i < items.length; i++) {
    insert(items[i]);
    insertTrace.push({
      index: i,
      value: items[i].value,
      priority: items[i].priority,
      heapSize: heap.length
    });
  }

  const extracted = [];
  let prevPriority = -Infinity;
  let isCorrectOrder = true;

  while (heap.length > 0) {
    const item = extractMin();
    if (item.priority < prevPriority) isCorrectOrder = false;
    prevPriority = item.priority;
    extracted.push({
      value: item.value,
      priority: item.priority,
      remainingSize: heap.length
    });
    totalComparisons++;
  }

  return {
    totalInserted: items.length,
    totalExtracted: extracted.length,
    isCorrectOrder,
    minPriority: extracted.length > 0 ? extracted[0].priority : null,
    maxPriority: extracted.length > 0 ? extracted[extracted.length - 1].priority : null,
    extracted: extracted.slice(0, 20),
    insertTrace: insertTrace.slice(0, 20)
  };
}

/**
 * Builds a trie from a list of words and performs search and autocomplete operations.
 * Supports insert, exact search, prefix search, and autocomplete with results.
 * @param {Array<string>} words - Array of words to insert into the trie
 * @returns {Object} Trie statistics, search results, and autocomplete suggestions
 * @complexity O(n * L) where n = number of words, L = avg word length
 */
export function trieOperations(words) {
  const root = { children: {}, isEnd: false, count: 0 };
  let totalNodes = 1;
  let totalCharsInserted = 0;

  function insertWord(word) {
    let node = root;
    for (let i = 0; i < word.length; i++) {
      const ch = word[i];
      if (!node.children[ch]) {
        node.children[ch] = { children: {}, isEnd: false, count: 0 };
        totalNodes++;
      }
      node = node.children[ch];
      node.count++;
    }
    node.isEnd = true;
    totalCharsInserted += word.length;
  }

  function search(word) {
    let node = root;
    for (let i = 0; i < word.length; i++) {
      if (!node.children[word[i]]) return false;
      node = node.children[word[i]];
    }
    return node.isEnd;
  }

  function startsWith(prefix) {
    let node = root;
    for (let i = 0; i < prefix.length; i++) {
      if (!node.children[prefix[i]]) return { found: false, count: 0 };
      node = node.children[prefix[i]];
    }
    return { found: true, count: node.count };
  }

  function autocomplete(prefix, maxResults) {
    let node = root;
    for (let i = 0; i < prefix.length; i++) {
      if (!node.children[prefix[i]]) return [];
      node = node.children[prefix[i]];
    }

    const results = [];
    const stack = [{ node, word: prefix }];

    while (stack.length > 0 && results.length < maxResults) {
      const { node: curr, word } = stack.pop();
      if (curr.isEnd) results.push(word);

      const childKeys = Object.keys(curr.children).sort().reverse();
      for (let k = 0; k < childKeys.length; k++) {
        stack.push({ node: curr.children[childKeys[k]], word: word + childKeys[k] });
      }
    }

    return results;
  }

  for (let i = 0; i < words.length; i++) {
    insertWord(words[i].toLowerCase());
  }

  const uniqueWords = words.filter((w, i) => words.indexOf(w) === i);
  const searchResults = [];
  const sampleSize = Math.min(10, words.length);

  for (let i = 0; i < sampleSize; i++) {
    const word = words[i].toLowerCase();
    searchResults.push({ word, found: search(word) });
  }

  const prefixes = [];
  const prefixSet = new Set();
  for (let i = 0; i < Math.min(5, words.length); i++) {
    const prefix = words[i].substring(0, Math.min(3, words[i].length)).toLowerCase();
    if (!prefixSet.has(prefix)) {
      prefixSet.add(prefix);
      const prefixResult = startsWith(prefix);
      const suggestions = autocomplete(prefix, 5);
      prefixes.push({ prefix, ...prefixResult, suggestions });
    }
  }

  return {
    totalWords: words.length,
    uniqueWords: uniqueWords.length,
    totalNodes,
    totalCharsInserted,
    avgWordLength: words.length > 0 ? +(totalCharsInserted / words.length).toFixed(2) : 0,
    searchResults,
    prefixResults: prefixes
  };
}

/**
 * Performs linked list operations: build, reverse, find middle, and detect cycles.
 * Builds a singly linked list from values and performs various operations.
 * @param {Array<number>} values - Array of values to build the linked list from
 * @returns {Object} Results of linked list operations including reverse and middle element
 * @complexity O(n) for all operations
 */
export function linkedListOperations(values) {
  function createNode(val) {
    return { value: val, next: null };
  }

  let head = null;
  let tail = null;
  let nodeCount = 0;

  for (let i = 0; i < values.length; i++) {
    const node = createNode(values[i]);
    if (!head) {
      head = node;
      tail = node;
    } else {
      tail.next = node;
      tail = node;
    }
    nodeCount++;
  }

  function toArray(node) {
    const arr = [];
    let current = node;
    let safety = 0;
    while (current && safety < nodeCount + 1) {
      arr.push(current.value);
      current = current.next;
      safety++;
    }
    return arr;
  }

  const originalOrder = toArray(head);

  let prev = null;
  let current = head;
  while (current) {
    const next = current.next;
    current.next = prev;
    prev = current;
    current = next;
  }
  const reversedHead = prev;
  const reversedOrder = toArray(reversedHead);

  prev = null;
  current = reversedHead;
  while (current) {
    const next = current.next;
    current.next = prev;
    prev = current;
    current = next;
  }
  head = prev;

  let slow = head;
  let fast = head;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
  }
  const middleValue = slow ? slow.value : null;

  let hasCycle = false;
  slow = head;
  fast = head;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) {
      hasCycle = true;
      break;
    }
  }

  let nthFromEnd = null;
  const n = Math.min(3, nodeCount);
  if (n > 0 && nodeCount >= n) {
    let ahead = head;
    let behind = head;
    for (let i = 0; i < n; i++) {
      if (ahead) ahead = ahead.next;
    }
    while (ahead) {
      ahead = ahead.next;
      behind = behind.next;
    }
    nthFromEnd = behind ? behind.value : null;
  }

  let sumValues = 0;
  let minValue = Infinity;
  let maxValue = -Infinity;
  current = head;
  while (current) {
    sumValues += current.value;
    if (current.value < minValue) minValue = current.value;
    if (current.value > maxValue) maxValue = current.value;
    current = current.next;
  }

  return {
    nodeCount,
    originalOrder: originalOrder.slice(0, 20),
    reversedOrder: reversedOrder.slice(0, 20),
    middleValue,
    hasCycle,
    nthFromEnd: { n, value: nthFromEnd },
    stats: {
      sum: sumValues,
      min: nodeCount > 0 ? minValue : null,
      max: nodeCount > 0 ? maxValue : null,
      avg: nodeCount > 0 ? +(sumValues / nodeCount).toFixed(2) : null
    }
  };
}

/**
 * Implements a hash table with separate chaining for collision resolution.
 * Uses a simple hash function and linked-list chains per bucket.
 * @param {Object} input - { entries, buckets }
 * @param {Array<Object>} input.entries - Array of { key, value } pairs to insert
 * @param {number} input.buckets - Number of hash table buckets
 * @returns {Object} Hash table statistics including collision info and load factor
 * @complexity O(n) average for n insertions, O(n/b) average per lookup where b = buckets
 */
export function hashTableWithChaining(input) {
  const { entries, buckets } = input;
  const table = new Array(buckets).fill(null).map(() => []);
  let collisions = 0;
  let totalProbes = 0;
  let maxChainLength = 0;

  function hash(key) {
    let h = 0;
    const str = String(key);
    for (let i = 0; i < str.length; i++) {
      h = (h * 31 + str.charCodeAt(i)) & 0x7FFFFFFF;
    }
    return h % buckets;
  }

  function put(key, value) {
    const idx = hash(key);
    const chain = table[idx];
    let probes = 0;

    for (let i = 0; i < chain.length; i++) {
      probes++;
      if (chain[i].key === key) {
        chain[i].value = value;
        totalProbes += probes;
        return false;
      }
    }

    if (chain.length > 0) collisions++;
    chain.push({ key, value });
    if (chain.length > maxChainLength) maxChainLength = chain.length;
    totalProbes += probes + 1;
    return true;
  }

  function get(key) {
    const idx = hash(key);
    const chain = table[idx];
    let probes = 0;

    for (let i = 0; i < chain.length; i++) {
      probes++;
      if (chain[i].key === key) {
        return { found: true, value: chain[i].value, probes };
      }
    }

    return { found: false, value: null, probes };
  }

  let insertedCount = 0;
  let updatedCount = 0;

  for (let i = 0; i < entries.length; i++) {
    const isNew = put(entries[i].key, entries[i].value);
    if (isNew) insertedCount++;
    else updatedCount++;
  }

  let totalEntries = 0;
  let emptyBuckets = 0;
  let chainLengths = [];

  for (let i = 0; i < buckets; i++) {
    const len = table[i].length;
    totalEntries += len;
    chainLengths.push(len);
    if (len === 0) emptyBuckets++;
  }

  const loadFactor = +(totalEntries / buckets).toFixed(4);
  const avgChainLength = buckets > 0 ? +(totalEntries / (buckets - emptyBuckets || 1)).toFixed(4) : 0;

  const lookupSample = [];
  const sampleSize = Math.min(10, entries.length);
  for (let i = 0; i < sampleSize; i++) {
    const result = get(entries[i].key);
    lookupSample.push({ key: entries[i].key, ...result });
  }

  return {
    bucketCount: buckets,
    totalInserted: insertedCount,
    totalUpdated: updatedCount,
    totalEntries,
    collisions,
    loadFactor,
    emptyBuckets,
    maxChainLength,
    avgChainLength,
    totalProbes,
    avgProbesPerOp: entries.length > 0 ? +(totalProbes / entries.length).toFixed(4) : 0,
    lookupSample
  };
}

/**
 * Implements a circular ring buffer for streaming data and log rotation.
 * Supports write (overwrite oldest on full) and read operations.
 * @param {Object} input - { capacity, items }
 * @param {number} input.capacity - Maximum number of items the buffer can hold
 * @param {Array<Object>} input.items - Array of items to write into the buffer
 * @returns {Object} Ring buffer state with overwrite stats and current contents
 * @complexity O(n) where n = number of items written
 */
export function ringBuffer(input) {
  const { capacity, items } = input;
  const buffer = new Array(capacity).fill(null);
  let writeHead = 0;
  let count = 0;
  let overwrites = 0;
  let totalWritten = 0;
  const overwrittenItems = [];

  for (let i = 0; i < items.length; i++) {
    if (count >= capacity) {
      const overwritten = buffer[writeHead];
      if (overwritten !== null) {
        overwrittenItems.push(overwritten);
        overwrites++;
      }
    }

    buffer[writeHead] = items[i];
    writeHead = (writeHead + 1) % capacity;
    if (count < capacity) count++;
    totalWritten++;
  }

  const contents = [];
  const readHead = count >= capacity ? writeHead : 0;
  for (let i = 0; i < count; i++) {
    const idx = (readHead + i) % capacity;
    contents.push(buffer[idx]);
  }

  const oldestItem = count > 0 ? contents[0] : null;
  const newestItem = count > 0 ? contents[count - 1] : null;

  const utilizationHistory = [];
  let runningCount = 0;
  const step = Math.max(1, Math.floor(items.length / 20));
  for (let i = 0; i < items.length; i++) {
    if (runningCount < capacity) runningCount++;
    if (i % step === 0 || i === items.length - 1) {
      utilizationHistory.push({
        writeIndex: i,
        utilization: +(runningCount / capacity * 100).toFixed(1),
        isFull: runningCount >= capacity
      });
    }
  }

  return {
    capacity,
    totalWritten,
    currentCount: count,
    overwrites,
    overwriteRate: totalWritten > 0 ? +((overwrites / totalWritten) * 100).toFixed(2) : 0,
    isFull: count >= capacity,
    utilization: +(count / capacity * 100).toFixed(2),
    oldestItem,
    newestItem,
    contents: contents.slice(0, 20),
    overwrittenSample: overwrittenItems.slice(0, 10),
    utilizationHistory
  };
}
