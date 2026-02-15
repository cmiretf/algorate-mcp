/**
 * Search & Matching Patterns
 * ===========================
 * Functions for text search, fuzzy matching, autocomplete, and similarity scoring.
 * Common in search bars, recommendation engines, and hiring/matching platforms.
 *
 * How to test with algorate MCP tool:
 *
 * 1. fuzzySearch
 *    - entryFunction: "fuzzySearch"
 *    - inputGenerator: `function generateInput(n) {
 *        const words = ['apple','application','apply','banana','bandana','candle','candy','handle','random','sandbox'];
 *        return {
 *          query: 'aple',
 *          items: Array.from({length: n}, (_, i) => ({
 *            id: i, name: words[i % words.length] + '_' + i, description: 'Item number ' + i
 *          })),
 *          key: 'name'
 *        };
 *      }`
 *    - Expected complexity: O(n * m * k) where m = query length, k = avg item name length
 *
 * 2. fullTextIndex
 *    - entryFunction: "fullTextIndex"
 *    - inputGenerator: `function generateInput(n) {
 *        const phrases = ['the quick brown fox','jumps over the lazy dog','a fast red car','drives down the road','in the sunny morning','under a blue sky'];
 *        return Array.from({length: n}, (_, i) => ({
 *          id: i, title: 'Doc ' + i, body: phrases[i % 6] + ' ' + phrases[(i+1) % 6] + ' extra words ' + i
 *        }));
 *      }`
 *    - Expected complexity: O(n * w) where w = avg words per document
 *
 * 3. autocomplete
 *    - entryFunction: "autocomplete"
 *    - inputGenerator: `function generateInput(n) {
 *        const words = [];
 *        const bases = ['app','api','auto','auth','admin','account','alert','archive'];
 *        for (let i = 0; i < n; i++) words.push(bases[i % bases.length] + '_' + i);
 *        return { words, prefix: 'app', maxResults: 10 };
 *      }`
 *    - Expected complexity: O(n * L) for build, O(p + k) for search where L = avg word length, p = prefix length, k = results
 *
 * 4. matchSkillsToJobs
 *    - entryFunction: "matchSkillsToJobs"
 *    - inputGenerator: `function generateInput(n) {
 *        const allSkills = ['javascript','python','react','node','sql','aws','docker','kubernetes','graphql','typescript','rust','go','java','c++','redis','mongodb','postgresql','linux','git','ci/cd'];
 *        function randomSkills(count) { const s = new Set(); while(s.size < count) s.add(allSkills[Math.floor(Math.random()*allSkills.length)]); return Array.from(s); }
 *        return {
 *          candidate: { name: 'Alice', skills: randomSkills(5), experience: 3 },
 *          jobs: Array.from({length: n}, (_, i) => ({
 *            id: i, title: 'Job ' + i, required: randomSkills(3 + Math.floor(Math.random()*3)),
 *            preferred: randomSkills(2), minExperience: Math.floor(Math.random()*5)
 *          }))
 *        };
 *      }`
 *    - Expected complexity: O(n * s) where s = avg skills per job
 *
 * 5. findSimilarProducts
 *    - entryFunction: "findSimilarProducts"
 *    - inputGenerator: `function generateInput(n) {
 *        function randFeatures() { return { price: Math.random()*1000, rating: 1+Math.random()*4, weight: Math.random()*50, popularity: Math.random()*100 }; }
 *        return {
 *          product: { id: -1, name: 'Target', features: randFeatures() },
 *          catalog: Array.from({length: n}, (_, i) => ({ id: i, name: 'Product ' + i, features: randFeatures() })),
 *          topN: 5
 *        };
 *      }`
 *    - Expected complexity: O(n * f + n log k) where f = features, k = topN
 */

/**
 * Fuzzy text search using Levenshtein distance with scoring and ranking.
 * @param {Object} input - { query, items, key }
 * @returns {Array<Object>} Matched items sorted by relevance score
 * Complexity: O(n * m * k) where m = query length, k = item key length
 */
export function fuzzySearch(input) {
  const { query, items, key } = input;
  const q = query.toLowerCase();

  function levenshtein(a, b) {
    const m = a.length;
    const n = b.length;
    const dp = [];

    for (let i = 0; i <= m; i++) {
      dp[i] = [i];
    }
    for (let j = 0; j <= n; j++) {
      dp[0][j] = j;
    }

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + cost
        );
      }
    }
    return dp[m][n];
  }

  function score(text) {
    const t = text.toLowerCase();
    if (t === q) return 1.0;
    if (t.startsWith(q)) return 0.9;
    if (t.includes(q)) return 0.8;

    const dist = levenshtein(q, t.slice(0, Math.max(q.length + 2, t.length)));
    const maxLen = Math.max(q.length, t.length);
    const similarity = maxLen > 0 ? 1 - dist / maxLen : 0;
    return Math.max(0, similarity);
  }

  const threshold = 0.3;
  const results = [];

  for (let i = 0; i < items.length; i++) {
    const text = items[i][key] || '';
    const s = score(text);
    if (s >= threshold) {
      results.push({ item: items[i], score: s });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, 20);
}

/**
 * Builds a simple inverted index from documents and performs a search.
 * Returns documents ranked by TF-IDF-like score.
 * @param {Array<Object>} documents - Array of { id, title, body }
 * @returns {Object} Index stats and search function result for "quick fox"
 * Complexity: O(n * w) for indexing, O(k * d) for search where k = query terms, d = matching docs
 */
export function fullTextIndex(documents) {
  const index = {};
  const docLengths = {};
  const totalDocs = documents.length;

  for (let i = 0; i < documents.length; i++) {
    const doc = documents[i];
    const text = ((doc.title || '') + ' ' + (doc.body || '')).toLowerCase();
    const words = text.split(/\s+/).filter(w => w.length > 1);
    docLengths[doc.id] = words.length;

    const termFreq = {};
    for (let j = 0; j < words.length; j++) {
      termFreq[words[j]] = (termFreq[words[j]] || 0) + 1;
    }

    for (const term in termFreq) {
      if (!index[term]) index[term] = [];
      index[term].push({ docId: doc.id, tf: termFreq[term] / words.length });
    }
  }

  const queryTerms = ['quick', 'fox'];
  const docScores = {};

  for (let t = 0; t < queryTerms.length; t++) {
    const term = queryTerms[t];
    const postings = index[term];
    if (!postings) continue;

    const idf = Math.log(1 + totalDocs / postings.length);
    for (let p = 0; p < postings.length; p++) {
      const { docId, tf } = postings[p];
      docScores[docId] = (docScores[docId] || 0) + tf * idf;
    }
  }

  const results = Object.entries(docScores)
    .map(([docId, score]) => ({ docId: Number(docId), score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  return {
    indexSize: Object.keys(index).length,
    totalDocuments: totalDocs,
    searchQuery: 'quick fox',
    results
  };
}

/**
 * Trie-based autocomplete with frequency ranking.
 * @param {Object} input - { words, prefix, maxResults }
 * @returns {Array<Object>} Matching completions sorted by frequency
 * Complexity: O(n * L) for build, O(p + k) for search
 */
export function autocomplete(input) {
  const { words, prefix, maxResults } = input;

  const root = {};

  for (let i = 0; i < words.length; i++) {
    let node = root;
    const word = words[i].toLowerCase();
    for (let j = 0; j < word.length; j++) {
      const ch = word[j];
      if (!node[ch]) node[ch] = { _count: 0, _words: [] };
      node = node[ch];
    }
    node._end = true;
    node._count = (node._count || 0) + 1;
    node._word = word;
  }

  function collect(node, results, limit) {
    if (results.length >= limit) return;
    if (node._end) {
      results.push({ word: node._word, frequency: node._count });
    }
    const keys = Object.keys(node).filter(k => !k.startsWith('_'));
    for (let i = 0; i < keys.length && results.length < limit; i++) {
      collect(node[keys[i]], results, limit);
    }
  }

  let current = root;
  const p = prefix.toLowerCase();
  for (let i = 0; i < p.length; i++) {
    if (!current[p[i]]) return [];
    current = current[p[i]];
  }

  const results = [];
  collect(current, results, maxResults || 10);
  results.sort((a, b) => b.frequency - a.frequency);

  return results;
}

/**
 * Matches a candidate's skills to job requirements with weighted scoring.
 * @param {Object} input - { candidate, jobs }
 * @returns {Array<Object>} Jobs ranked by match score
 * Complexity: O(n * s) where n = jobs, s = avg skills per job
 */
export function matchSkillsToJobs(input) {
  const { candidate, jobs } = input;
  const candidateSkills = new Set(candidate.skills.map(s => s.toLowerCase()));

  const scored = [];

  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    const reqSkills = job.required.map(s => s.toLowerCase());
    const prefSkills = (job.preferred || []).map(s => s.toLowerCase());

    let reqMatch = 0;
    for (let j = 0; j < reqSkills.length; j++) {
      if (candidateSkills.has(reqSkills[j])) reqMatch++;
    }

    let prefMatch = 0;
    for (let j = 0; j < prefSkills.length; j++) {
      if (candidateSkills.has(prefSkills[j])) prefMatch++;
    }

    const reqScore = reqSkills.length > 0 ? reqMatch / reqSkills.length : 0;
    const prefScore = prefSkills.length > 0 ? prefMatch / prefSkills.length : 0;
    const expBonus = candidate.experience >= (job.minExperience || 0) ? 0.1 : -0.1;

    const totalScore = reqScore * 0.6 + prefScore * 0.3 + expBonus;

    scored.push({
      jobId: job.id,
      title: job.title,
      score: Math.min(1, Math.max(0, totalScore)),
      requiredMatch: reqMatch + '/' + reqSkills.length,
      preferredMatch: prefMatch + '/' + prefSkills.length,
      meetsExperience: candidate.experience >= (job.minExperience || 0),
      missingRequired: reqSkills.filter(s => !candidateSkills.has(s))
    });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored;
}

/**
 * Finds similar products by computing cosine similarity on feature vectors.
 * @param {Object} input - { product, catalog, topN }
 * @returns {Array<Object>} Top N most similar products
 * Complexity: O(n * f) where n = catalog size, f = number of features
 */
export function findSimilarProducts(input) {
  const { product, catalog, topN } = input;

  function toVector(features) {
    return [features.price || 0, features.rating || 0, features.weight || 0, features.popularity || 0];
  }

  function normalize(vec) {
    const max = [1000, 5, 50, 100];
    return vec.map((v, i) => max[i] > 0 ? v / max[i] : 0);
  }

  function cosineSimilarity(a, b) {
    let dot = 0, magA = 0, magB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      magA += a[i] * a[i];
      magB += b[i] * b[i];
    }
    magA = Math.sqrt(magA);
    magB = Math.sqrt(magB);
    return magA > 0 && magB > 0 ? dot / (magA * magB) : 0;
  }

  const targetVec = normalize(toVector(product.features));
  const scored = [];

  for (let i = 0; i < catalog.length; i++) {
    const item = catalog[i];
    if (item.id === product.id) continue;
    const itemVec = normalize(toVector(item.features));
    const sim = cosineSimilarity(targetVec, itemVec);
    scored.push({ id: item.id, name: item.name, similarity: sim });
  }

  scored.sort((a, b) => b.similarity - a.similarity);
  return scored.slice(0, topN);
}
