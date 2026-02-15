/**
 * Social & Network Graph Patterns
 * =================================
 * Functions for social graph analysis, community detection, influence scoring,
 * and connection suggestions. Common in social networks, org tools, and network analysis.
 *
 * Graph format: adjacency list as object { nodeId: [{ target, weight? }] }
 *
 * How to test with algorate MCP tool:
 *
 * 1. findMutualConnections
 *    - entryFunction: "findMutualConnections"
 *    - inputGenerator: `function generateInput(n) {
 *        const graph = {};
 *        for (let i = 0; i < n; i++) {
 *          graph[i] = [];
 *          const connectionCount = Math.min(n-1, 3 + Math.floor(Math.random() * 10));
 *          const connected = new Set();
 *          for (let j = 0; j < connectionCount; j++) {
 *            let target = Math.floor(Math.random() * n);
 *            while (target === i || connected.has(target)) target = (target + 1) % n;
 *            connected.add(target);
 *            graph[i].push({ target });
 *          }
 *        }
 *        return { graph, userA: 0, userB: Math.min(1, n-1) };
 *      }`
 *    - Expected complexity: O(degree(A) + degree(B))
 *
 * 2. suggestConnections
 *    - entryFunction: "suggestConnections"
 *    - inputGenerator: `function generateInput(n) {
 *        const graph = {};
 *        for (let i = 0; i < n; i++) {
 *          graph[i] = [];
 *          const count = Math.min(n-1, 2 + Math.floor(Math.random() * 5));
 *          const connected = new Set();
 *          for (let j = 0; j < count; j++) {
 *            let t = Math.floor(Math.random() * n);
 *            while (t === i || connected.has(t)) t = (t + 1) % n;
 *            connected.add(t);
 *            graph[i].push({ target: t });
 *          }
 *        }
 *        return { graph, userId: 0, depth: 2 };
 *      }`
 *    - Expected complexity: O(V + E) for BFS traversal
 *
 * 3. detectCommunities
 *    - entryFunction: "detectCommunities"
 *    - inputGenerator: `function generateInput(n) {
 *        const graph = {};
 *        const communitySize = Math.max(3, Math.floor(n / 4));
 *        for (let i = 0; i < n; i++) {
 *          graph[i] = [];
 *          const community = Math.floor(i / communitySize);
 *          const start = community * communitySize;
 *          const end = Math.min(start + communitySize, n);
 *          for (let j = start; j < end; j++) {
 *            if (j !== i) graph[i].push({ target: j });
 *          }
 *          if (Math.random() < 0.1 && i + communitySize < n) {
 *            graph[i].push({ target: Math.min(i + communitySize, n - 1) });
 *          }
 *        }
 *        return graph;
 *      }`
 *    - Expected complexity: O(V + E)
 *
 * 4. shortestPath
 *    - entryFunction: "shortestPath"
 *    - inputGenerator: `function generateInput(n) {
 *        const graph = {};
 *        for (let i = 0; i < n; i++) {
 *          graph[i] = [];
 *          const count = Math.min(n-1, 2 + Math.floor(Math.random() * 4));
 *          const connected = new Set();
 *          for (let j = 0; j < count; j++) {
 *            let t = Math.floor(Math.random() * n);
 *            while (t === i || connected.has(t)) t = (t + 1) % n;
 *            connected.add(t);
 *            graph[i].push({ target: t, weight: 1 + Math.floor(Math.random() * 10) });
 *          }
 *        }
 *        return { graph, start: 0, end: Math.min(n-1, n-1) };
 *      }`
 *    - Expected complexity: O((V + E) log V) with min-heap
 *
 * 5. calculateInfluenceScore
 *    - entryFunction: "calculateInfluenceScore"
 *    - inputGenerator: `function generateInput(n) {
 *        const graph = {};
 *        for (let i = 0; i < n; i++) {
 *          graph[i] = [];
 *          const count = Math.min(n-1, 1 + Math.floor(Math.random() * 5));
 *          const connected = new Set();
 *          for (let j = 0; j < count; j++) {
 *            let t = Math.floor(Math.random() * n);
 *            while (t === i || connected.has(t)) t = (t + 1) % n;
 *            connected.add(t);
 *            graph[i].push({ target: t });
 *          }
 *        }
 *        return { graph, userId: 0 };
 *      }`
 *    - Expected complexity: O(iterations * (V + E))
 */

/**
 * Finds mutual connections between two users in a social graph.
 * @param {Object} input - { graph, userA, userB }
 * @returns {Object} Mutual connections with metadata
 * Complexity: O(degree(A) + degree(B))
 */
export function findMutualConnections(input) {
  const { graph, userA, userB } = input;
  const connectionsA = new Set((graph[userA] || []).map(c => String(c.target)));
  const connectionsB = graph[userB] || [];

  const mutual = [];
  for (let i = 0; i < connectionsB.length; i++) {
    if (connectionsA.has(String(connectionsB[i].target))) {
      mutual.push(connectionsB[i].target);
    }
  }

  return {
    userA,
    userB,
    mutualCount: mutual.length,
    mutualConnections: mutual,
    connectionStrength: connectionsA.size > 0 && connectionsB.length > 0
      ? mutual.length / Math.min(connectionsA.size, connectionsB.length)
      : 0,
    userADegree: connectionsA.size,
    userBDegree: connectionsB.length
  };
}

/**
 * Suggests new connections based on friend-of-friend relationships using BFS.
 * Ranks suggestions by number of mutual connections.
 * @param {Object} input - { graph, userId, depth }
 * @returns {Array<Object>} Suggested connections sorted by relevance
 * Complexity: O(V + E) for BFS traversal
 */
export function suggestConnections(input) {
  const { graph, userId, depth } = input;
  const directConnections = new Set((graph[userId] || []).map(c => String(c.target)));
  directConnections.add(String(userId));

  const visited = new Set([String(userId)]);
  const suggestions = {};
  let queue = [{ node: String(userId), level: 0 }];

  while (queue.length > 0) {
    const nextQueue = [];
    for (let q = 0; q < queue.length; q++) {
      const { node, level } = queue[q];
      if (level >= depth) continue;

      const neighbors = graph[node] || [];
      for (let i = 0; i < neighbors.length; i++) {
        const target = String(neighbors[i].target);
        if (!directConnections.has(target)) {
          if (!suggestions[target]) suggestions[target] = { mutualCount: 0, paths: 0, minDepth: level + 1 };
          suggestions[target].mutualCount++;
          suggestions[target].paths++;
        }
        if (!visited.has(target)) {
          visited.add(target);
          nextQueue.push({ node: target, level: level + 1 });
        }
      }
    }
    queue = nextQueue;
  }

  const result = Object.entries(suggestions)
    .map(([nodeId, data]) => ({
      userId: Number(nodeId),
      mutualConnections: data.mutualCount,
      depth: data.minDepth,
      relevanceScore: data.mutualCount / (data.minDepth * data.minDepth)
    }))
    .sort((a, b) => b.relevanceScore - a.relevanceScore);

  return result.slice(0, 20);
}

/**
 * Detects communities in a graph using connected components (BFS).
 * @param {Object} graph - Adjacency list
 * @returns {Object} Communities with sizes and members
 * Complexity: O(V + E)
 */
export function detectCommunities(graph) {
  const nodes = Object.keys(graph);
  const visited = new Set();
  const communities = [];

  for (let n = 0; n < nodes.length; n++) {
    const startNode = nodes[n];
    if (visited.has(startNode)) continue;

    const community = [];
    const queue = [startNode];
    visited.add(startNode);

    while (queue.length > 0) {
      const current = queue.shift();
      community.push(current);

      const neighbors = graph[current] || [];
      for (let i = 0; i < neighbors.length; i++) {
        const target = String(neighbors[i].target);
        if (!visited.has(target) && graph[target] !== undefined) {
          visited.add(target);
          queue.push(target);
        }
      }
    }

    communities.push({
      id: communities.length,
      size: community.length,
      members: community.map(Number),
      density: community.length > 1
        ? community.reduce((s, m) => s + (graph[m] || []).filter(c => community.includes(String(c.target))).length, 0) / (community.length * (community.length - 1))
        : 0
    });
  }

  communities.sort((a, b) => b.size - a.size);

  return {
    totalNodes: nodes.length,
    communityCount: communities.length,
    largestCommunity: communities.length > 0 ? communities[0].size : 0,
    communities
  };
}

/**
 * Finds shortest path using Dijkstra's algorithm with a simple priority queue.
 * @param {Object} input - { graph, start, end }
 * @returns {Object} Shortest path with distance and route
 * Complexity: O((V + E) log V) with binary heap
 */
export function shortestPath(input) {
  const { graph, start, end } = input;
  const dist = {};
  const prev = {};
  const visited = new Set();

  const pq = [];
  const nodes = Object.keys(graph);

  for (let i = 0; i < nodes.length; i++) {
    dist[nodes[i]] = Infinity;
  }

  dist[start] = 0;
  pq.push({ node: String(start), dist: 0 });

  while (pq.length > 0) {
    pq.sort((a, b) => a.dist - b.dist);
    const { node: current } = pq.shift();

    if (visited.has(current)) continue;
    visited.add(current);

    if (current === String(end)) break;

    const neighbors = graph[current] || [];
    for (let i = 0; i < neighbors.length; i++) {
      const { target, weight } = neighbors[i];
      const t = String(target);
      const w = weight || 1;
      const newDist = dist[current] + w;

      if (newDist < (dist[t] || Infinity)) {
        dist[t] = newDist;
        prev[t] = current;
        pq.push({ node: t, dist: newDist });
      }
    }
  }

  const path = [];
  let current = String(end);
  while (current !== undefined) {
    path.unshift(Number(current));
    current = prev[current];
  }

  const found = dist[String(end)] !== Infinity;

  return {
    start,
    end,
    found,
    distance: found ? dist[String(end)] : null,
    path: found ? path : [],
    nodesExplored: visited.size
  };
}

/**
 * Calculates a PageRank-like influence score for all nodes,
 * returning the target user's score and ranking.
 * @param {Object} input - { graph, userId }
 * @returns {Object} Influence scores and rankings
 * Complexity: O(iterations * (V + E))
 */
export function calculateInfluenceScore(input) {
  const { graph, userId } = input;
  const nodes = Object.keys(graph);
  const n = nodes.length;
  const damping = 0.85;
  const iterations = 20;
  const convergenceThreshold = 0.0001;

  let scores = {};
  for (let i = 0; i < n; i++) {
    scores[nodes[i]] = 1 / n;
  }

  const outDegree = {};
  for (let i = 0; i < n; i++) {
    outDegree[nodes[i]] = (graph[nodes[i]] || []).length;
  }

  for (let iter = 0; iter < iterations; iter++) {
    const newScores = {};
    let maxDiff = 0;

    for (let i = 0; i < n; i++) {
      newScores[nodes[i]] = (1 - damping) / n;
    }

    for (let i = 0; i < n; i++) {
      const node = nodes[i];
      const neighbors = graph[node] || [];
      const share = outDegree[node] > 0 ? scores[node] / outDegree[node] : 0;

      for (let j = 0; j < neighbors.length; j++) {
        const target = String(neighbors[j].target);
        if (newScores[target] !== undefined) {
          newScores[target] += damping * share;
        }
      }
    }

    for (let i = 0; i < n; i++) {
      maxDiff = Math.max(maxDiff, Math.abs(newScores[nodes[i]] - scores[nodes[i]]));
    }

    scores = newScores;
    if (maxDiff < convergenceThreshold) break;
  }

  const ranked = nodes
    .map(node => ({ userId: Number(node), score: +scores[node].toFixed(8) }))
    .sort((a, b) => b.score - a.score);

  const targetRank = ranked.findIndex(r => r.userId === userId) + 1;

  return {
    targetUser: userId,
    targetScore: scores[String(userId)] ? +scores[String(userId)].toFixed(8) : 0,
    targetRank,
    totalNodes: n,
    topInfluencers: ranked.slice(0, 10),
    percentile: +((1 - targetRank / n) * 100).toFixed(2)
  };
}
