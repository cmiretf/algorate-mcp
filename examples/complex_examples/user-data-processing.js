/**
 * User Data Processing Patterns
 * ==============================
 * Real-world functions for processing user data in a typical SaaS application.
 * These patterns are common in admin dashboards, CRM systems, and analytics platforms.
 *
 * How to test with algorate MCP tool:
 *
 * 1. filterActiveUsers
 *    - entryFunction: "filterActiveUsers"
 *    - inputGenerator: `function generateInput(n) {
 *        const statuses = ['active', 'inactive', 'suspended', 'pending'];
 *        const plans = ['free', 'starter', 'pro', 'enterprise'];
 *        const now = Date.now();
 *        return Array.from({length: n}, (_, i) => ({
 *          id: i, name: 'User ' + i, email: 'user' + i + '@example.com',
 *          status: statuses[Math.floor(Math.random() * 4)],
 *          plan: plans[Math.floor(Math.random() * 4)],
 *          lastLogin: now - Math.floor(Math.random() * 90 * 86400000),
 *          createdAt: now - Math.floor(Math.random() * 365 * 86400000),
 *          metadata: { loginCount: Math.floor(Math.random() * 500), region: ['US','EU','APAC'][Math.floor(Math.random()*3)] }
 *        }));
 *      }`
 *    - Expected complexity: O(n)
 *
 * 2. paginateResults
 *    - entryFunction: "paginateResults"
 *    - inputGenerator: `function generateInput(n) {
 *        return { data: Array.from({length: n}, (_, i) => ({id: i, value: Math.random()})), page: Math.floor(n/20) || 1, pageSize: 20 };
 *      }`
 *    - Expected complexity: O(n) due to slice
 *
 * 3. aggregateUserMetrics
 *    - entryFunction: "aggregateUserMetrics"
 *    - inputGenerator: `function generateInput(n) {
 *        const types = ['page_view','click','purchase','signup','logout'];
 *        const now = Date.now();
 *        return Array.from({length: n}, (_, i) => ({
 *          userId: 'user_' + Math.floor(Math.random() * (n/5)),
 *          type: types[Math.floor(Math.random() * 5)],
 *          timestamp: now - Math.floor(Math.random() * 30 * 86400000),
 *          value: Math.random() * 100
 *        }));
 *      }`
 *    - Expected complexity: O(n)
 *
 * 4. deduplicateContacts
 *    - entryFunction: "deduplicateContacts"
 *    - inputGenerator: `function generateInput(n) {
 *        const firstNames = ['John','Jane','Bob','Alice','Charlie','Diana','Eve','Frank'];
 *        const lastNames = ['Smith','Jones','Brown','Wilson','Taylor','Clark'];
 *        return Array.from({length: n}, (_, i) => {
 *          const fn = firstNames[Math.floor(Math.random()*8)];
 *          const ln = lastNames[Math.floor(Math.random()*6)];
 *          const dupChance = Math.random();
 *          return {
 *            id: i, firstName: fn, lastName: ln,
 *            email: (dupChance < 0.3 ? fn.toLowerCase() : fn.toLowerCase()+i) + '@' + ['gmail','yahoo','outlook'][Math.floor(Math.random()*3)] + '.com',
 *            phone: dupChance < 0.2 ? '555-0100' : '555-' + String(Math.floor(Math.random()*9000)+1000)
 *          };
 *        });
 *      }`
 *    - Expected complexity: O(n) average with hash map, O(n²) worst case with fuzzy
 *
 * 5. buildUserHierarchy
 *    - entryFunction: "buildUserHierarchy"
 *    - inputGenerator: `function generateInput(n) {
 *        return Array.from({length: n}, (_, i) => ({
 *          id: i, name: 'Employee ' + i, title: ['Engineer','Manager','Director','VP','CEO'][Math.min(4, Math.floor(Math.log2(i+1)))],
 *          managerId: i === 0 ? null : Math.floor((i - 1) / 3)
 *        }));
 *      }`
 *    - Expected complexity: O(n)
 */

/**
 * Filters active users based on multiple criteria: status, recent login,
 * plan type, and minimum engagement. Returns transformed user summaries.
 * @param {Array<Object>} users - Array of user objects
 * @returns {Array<Object>} Filtered and transformed user summaries
 * Complexity: O(n) - single pass filter and map
 */
export function filterActiveUsers(users) {
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

  return users
    .filter(user => {
      if (user.status !== 'active') return false;
      if (user.lastLogin < thirtyDaysAgo) return false;
      if (user.metadata && user.metadata.loginCount < 5) return false;
      return true;
    })
    .map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      plan: user.plan,
      daysSinceLogin: Math.floor((Date.now() - user.lastLogin) / 86400000),
      accountAgeDays: Math.floor((Date.now() - user.createdAt) / 86400000),
      engagementTier: user.metadata.loginCount > 100 ? 'power' :
                      user.metadata.loginCount > 30 ? 'regular' : 'casual',
      region: user.metadata.region
    }))
    .sort((a, b) => a.daysSinceLogin - b.daysSinceLogin);
}

/**
 * Paginates a dataset and returns page data with comprehensive metadata.
 * @param {Object} input - { data: Array, page: number, pageSize: number }
 * @returns {Object} Paginated result with metadata
 * Complexity: O(n) for slice operation
 */
export function paginateResults(input) {
  const { data, page, pageSize } = input;
  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const currentPage = Math.max(1, Math.min(page, totalPages));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  return {
    items: data.slice(startIndex, endIndex),
    pagination: {
      currentPage,
      pageSize,
      totalItems,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
      startIndex,
      endIndex: endIndex - 1,
      isFirstPage: currentPage === 1,
      isLastPage: currentPage === totalPages
    }
  };
}

/**
 * Aggregates raw user activity events into meaningful metrics:
 * daily active users, event counts by type, top users, and retention signals.
 * @param {Array<Object>} events - Array of event objects with userId, type, timestamp, value
 * @returns {Object} Aggregated metrics
 * Complexity: O(n) - single pass with hash maps
 */
export function aggregateUserMetrics(events) {
  const dailyUsers = {};
  const eventCounts = {};
  const userActivity = {};
  const userValues = {};
  let totalValue = 0;

  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const dayKey = new Date(event.timestamp).toISOString().slice(0, 10);

    if (!dailyUsers[dayKey]) dailyUsers[dayKey] = new Set();
    dailyUsers[dayKey].add(event.userId);

    eventCounts[event.type] = (eventCounts[event.type] || 0) + 1;

    if (!userActivity[event.userId]) {
      userActivity[event.userId] = { count: 0, firstSeen: event.timestamp, lastSeen: event.timestamp, types: {} };
    }
    const ua = userActivity[event.userId];
    ua.count++;
    ua.firstSeen = Math.min(ua.firstSeen, event.timestamp);
    ua.lastSeen = Math.max(ua.lastSeen, event.timestamp);
    ua.types[event.type] = (ua.types[event.type] || 0) + 1;

    if (event.value) {
      userValues[event.userId] = (userValues[event.userId] || 0) + event.value;
      totalValue += event.value;
    }
  }

  const dauByDay = {};
  for (const day in dailyUsers) {
    dauByDay[day] = dailyUsers[day].size;
  }

  const topUsers = Object.entries(userActivity)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .map(([userId, data]) => ({ userId, ...data, types: undefined, eventCount: data.count }));

  const uniqueUsers = Object.keys(userActivity).length;
  const retainedUsers = Object.values(userActivity)
    .filter(u => (u.lastSeen - u.firstSeen) > 7 * 86400000).length;

  return {
    totalEvents: events.length,
    uniqueUsers,
    eventCounts,
    dailyActiveUsers: dauByDay,
    averageEventsPerUser: uniqueUsers > 0 ? events.length / uniqueUsers : 0,
    totalValue,
    retentionRate: uniqueUsers > 0 ? retainedUsers / uniqueUsers : 0,
    topUsers
  };
}

/**
 * Finds and merges duplicate contacts by matching on normalized email
 * and phone number. Uses a simple similarity check for fuzzy matching.
 * @param {Array<Object>} contacts - Array of contact objects
 * @returns {Array<Object>} Deduplicated contacts with merge info
 * Complexity: O(n) average case with hash grouping
 */
export function deduplicateContacts(contacts) {
  const emailMap = {};
  const phoneMap = {};
  const groups = [];
  const visited = new Set();

  for (let i = 0; i < contacts.length; i++) {
    const c = contacts[i];
    const normEmail = c.email ? c.email.toLowerCase().trim() : null;
    const normPhone = c.phone ? c.phone.replace(/[\s\-\(\)]/g, '') : null;

    if (normEmail) {
      if (!emailMap[normEmail]) emailMap[normEmail] = [];
      emailMap[normEmail].push(i);
    }
    if (normPhone) {
      if (!phoneMap[normPhone]) phoneMap[normPhone] = [];
      phoneMap[normPhone].push(i);
    }
  }

  for (let i = 0; i < contacts.length; i++) {
    if (visited.has(i)) continue;
    visited.add(i);

    const c = contacts[i];
    const normEmail = c.email ? c.email.toLowerCase().trim() : null;
    const normPhone = c.phone ? c.phone.replace(/[\s\-\(\)]/g, '') : null;

    const duplicateIndices = new Set();
    if (normEmail && emailMap[normEmail]) {
      emailMap[normEmail].forEach(idx => duplicateIndices.add(idx));
    }
    if (normPhone && phoneMap[normPhone]) {
      phoneMap[normPhone].forEach(idx => duplicateIndices.add(idx));
    }

    duplicateIndices.delete(i);
    const dupsArray = [];
    for (const idx of duplicateIndices) {
      if (!visited.has(idx)) {
        visited.add(idx);
        dupsArray.push(contacts[idx]);
      }
    }

    groups.push({
      primary: c,
      duplicates: dupsArray,
      merged: {
        id: c.id,
        firstName: c.firstName,
        lastName: c.lastName,
        email: normEmail,
        phone: normPhone,
        mergedFrom: dupsArray.length > 0 ? dupsArray.map(d => d.id) : []
      }
    });
  }

  return groups;
}

/**
 * Builds an organizational hierarchy tree from a flat list of employees.
 * Each employee has an id and managerId. Returns a tree structure.
 * @param {Array<Object>} employees - Flat array of employee objects
 * @returns {Array<Object>} Tree of employees (roots are those with no manager)
 * Complexity: O(n) - two passes with hash map
 */
export function buildUserHierarchy(employees) {
  const map = {};
  const roots = [];

  for (let i = 0; i < employees.length; i++) {
    map[employees[i].id] = { ...employees[i], children: [], depth: 0, descendantCount: 0 };
  }

  for (let i = 0; i < employees.length; i++) {
    const emp = map[employees[i].id];
    if (emp.managerId != null && map[emp.managerId]) {
      map[emp.managerId].children.push(emp);
    } else {
      roots.push(emp);
    }
  }

  function setDepthAndCount(node, depth) {
    node.depth = depth;
    let count = 0;
    for (let i = 0; i < node.children.length; i++) {
      count += 1 + setDepthAndCount(node.children[i], depth + 1);
    }
    node.descendantCount = count;
    return count;
  }

  for (let i = 0; i < roots.length; i++) {
    setDepthAndCount(roots[i], 0);
  }

  return roots;
}
