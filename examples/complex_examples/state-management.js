/**
 * State Management Patterns
 * ==========================
 * Frontend state management patterns commonly found in React/Redux/MobX applications.
 * Includes immutable updates, selectors, diffing, normalization, and undo/redo.
 *
 * How to test with algorate MCP tool:
 *
 * 1. immutableUpdate
 *    - entryFunction: "immutableUpdate"
 *    - inputGenerator: `function generateInput(n) {
 *        function buildNested(depth, breadth) {
 *          if (depth <= 0) return 'leaf_' + Math.floor(Math.random() * 1000);
 *          var obj = {};
 *          for (var i = 0; i < breadth; i++) {
 *            obj['key_' + i] = buildNested(depth - 1, Math.max(1, breadth - 1));
 *          }
 *          return obj;
 *        }
 *        var depth = Math.min(Math.floor(Math.log2(n + 1)) + 1, 8);
 *        var breadth = Math.min(Math.ceil(n / depth), 10);
 *        var path = [];
 *        for (var i = 0; i < depth; i++) path.push('key_0');
 *        return { state: buildNested(depth, breadth), path: path, value: 'updated_value_' + n };
 *      }`
 *    - Expected complexity: O(d) where d = path depth (shallow copies per level)
 *
 * 2. computeSelectors
 *    - entryFunction: "computeSelectors"
 *    - inputGenerator: `function generateInput(n) {
 *        var users = {};
 *        for (var i = 0; i < n; i++) {
 *          users['user_' + i] = { id: 'user_' + i, name: 'User ' + i, age: 18 + (i % 50), active: i % 3 !== 0, score: Math.floor(Math.random() * 100) };
 *        }
 *        var state = { users: users, config: { theme: 'dark', pageSize: 20 }, meta: { total: n } };
 *        var selectors = [
 *          { name: 'activeUsers', path: 'users', filter: { field: 'active', value: true } },
 *          { name: 'highScorers', path: 'users', filter: { field: 'score', op: 'gt', value: 70 } },
 *          { name: 'userCount', path: 'users', aggregate: 'count' },
 *          { name: 'avgAge', path: 'users', aggregate: 'avg', field: 'age' },
 *          { name: 'maxScore', path: 'users', aggregate: 'max', field: 'score' }
 *        ];
 *        return { state: state, selectors: selectors };
 *      }`
 *    - Expected complexity: O(n * s) where n = entities, s = selectors
 *
 * 3. diffState
 *    - entryFunction: "diffState"
 *    - inputGenerator: `function generateInput(n) {
 *        var prev = {};
 *        var next = {};
 *        for (var i = 0; i < n; i++) {
 *          prev['item_' + i] = { id: i, value: 'val_' + i, nested: { a: i, b: i * 2 } };
 *          if (i % 3 === 0) {
 *            next['item_' + i] = { id: i, value: 'changed_' + i, nested: { a: i, b: i * 3 } };
 *          } else if (i % 5 !== 0) {
 *            next['item_' + i] = prev['item_' + i];
 *          }
 *        }
 *        for (var i = n; i < n + Math.floor(n * 0.1); i++) {
 *          next['item_' + i] = { id: i, value: 'new_' + i, nested: { a: i, b: 0 } };
 *        }
 *        return { prevState: prev, nextState: next };
 *      }`
 *    - Expected complexity: O(n * d) where n = keys, d = depth of nesting
 *
 * 4. normalizeEntities
 *    - entryFunction: "normalizeEntities"
 *    - inputGenerator: `function generateInput(n) {
 *        var data = [];
 *        for (var i = 0; i < n; i++) {
 *          data.push({
 *            id: 'post_' + i, title: 'Post ' + i,
 *            author: { id: 'user_' + (i % Math.max(1, Math.floor(n / 5))), name: 'Author ' + (i % Math.max(1, Math.floor(n / 5))) },
 *            comments: [
 *              { id: 'comment_' + (i * 2), body: 'Comment A on ' + i, author: { id: 'user_' + ((i + 1) % Math.max(1, Math.floor(n / 5))), name: 'Commenter ' + ((i + 1) % Math.max(1, Math.floor(n / 5))) } },
 *              { id: 'comment_' + (i * 2 + 1), body: 'Comment B on ' + i, author: { id: 'user_' + ((i + 2) % Math.max(1, Math.floor(n / 5))), name: 'Commenter ' + ((i + 2) % Math.max(1, Math.floor(n / 5))) } }
 *            ],
 *            tags: [{ id: 'tag_' + (i % 10), name: 'Tag ' + (i % 10) }]
 *          });
 *        }
 *        var schema = {
 *          entity: 'posts', id: 'id',
 *          relations: {
 *            author: { entity: 'users', id: 'id' },
 *            comments: { entity: 'comments', id: 'id', relations: { author: { entity: 'users', id: 'id' } } },
 *            tags: { entity: 'tags', id: 'id' }
 *          }
 *        };
 *        return { data: data, schema: schema };
 *      }`
 *    - Expected complexity: O(n * r) where n = entities, r = relations per entity
 *
 * 5. undoRedoManager
 *    - entryFunction: "undoRedoManager"
 *    - inputGenerator: `function generateInput(n) {
 *        var actions = [];
 *        var state = { counter: 0, items: [] };
 *        for (var i = 0; i < n; i++) {
 *          var r = Math.random();
 *          if (r < 0.5) {
 *            actions.push({ type: 'SET', path: ['counter'], value: i });
 *          } else if (r < 0.7) {
 *            actions.push({ type: 'UNDO' });
 *          } else if (r < 0.85) {
 *            actions.push({ type: 'REDO' });
 *          } else {
 *            actions.push({ type: 'SET', path: ['items'], value: Array.from({length: Math.min(i, 10)}, function(_, j) { return j; }) });
 *          }
 *        }
 *        return { history: { past: [], present: state, future: [] }, actions: actions };
 *      }`
 *    - Expected complexity: O(n) where n = number of actions
 */

/**
 * Deep immutable state update that creates shallow copies along
 * the update path, leaving unaffected branches untouched.
 * @param {Object} input - { state: Object, path: Array<string>, value: any }
 * @returns {Object} New state with the update applied and change metadata
 * @complexity O(d) where d = path depth
 */
export function immutableUpdate(input) {
  var state = input.state;
  var path = input.path;
  var value = input.value;

  function countNodes(obj) {
    if (obj === null || typeof obj !== 'object') return 1;
    var count = 1;
    var keys = Object.keys(obj);
    for (var i = 0; i < keys.length; i++) {
      count += countNodes(obj[keys[i]]);
    }
    return count;
  }

  var totalNodesBefore = countNodes(state);

  function shallowClone(obj) {
    if (Array.isArray(obj)) return obj.slice();
    var result = {};
    var keys = Object.keys(obj);
    for (var i = 0; i < keys.length; i++) {
      result[keys[i]] = obj[keys[i]];
    }
    return result;
  }

  if (path.length === 0) {
    return {
      state: value,
      changed: true,
      pathDepth: 0,
      totalNodes: totalNodesBefore,
      nodesCloned: 1,
      previousValue: state
    };
  }

  var newState = shallowClone(state);
  var current = newState;
  var nodesCloned = 1;
  var previousValue = undefined;

  for (var i = 0; i < path.length - 1; i++) {
    var key = path[i];
    if (current[key] !== undefined && typeof current[key] === 'object' && current[key] !== null) {
      current[key] = shallowClone(current[key]);
      nodesCloned++;
      current = current[key];
    } else {
      current[key] = {};
      nodesCloned++;
      current = current[key];
    }
  }

  var lastKey = path[path.length - 1];
  previousValue = current[lastKey];
  current[lastKey] = value;

  var referencesPreserved = 0;
  var referencesChanged = 0;
  function checkReferences(orig, updated, depth) {
    if (depth > 5 || orig === null || typeof orig !== 'object') return;
    if (updated === null || typeof updated !== 'object') return;
    var keys = Object.keys(orig);
    for (var i = 0; i < keys.length; i++) {
      if (orig[keys[i]] === updated[keys[i]]) {
        referencesPreserved++;
      } else {
        referencesChanged++;
        if (typeof orig[keys[i]] === 'object' && typeof updated[keys[i]] === 'object') {
          checkReferences(orig[keys[i]], updated[keys[i]], depth + 1);
        }
      }
    }
  }
  checkReferences(state, newState, 0);

  return {
    state: newState,
    changed: true,
    pathDepth: path.length,
    totalNodes: totalNodesBefore,
    nodesCloned: nodesCloned,
    referencesPreserved: referencesPreserved,
    referencesChanged: referencesChanged,
    previousValue: typeof previousValue === 'object' ? '[object]' : previousValue,
    updatePath: path.join('.')
  };
}

/**
 * Computes derived state using selector definitions with filtering
 * and aggregation operations, similar to Reselect/MobX computed values.
 * @param {Object} input - { state: Object, selectors: Array }
 * @returns {Object} Computed selector results with performance metadata
 * @complexity O(n * s) where n = entities in state, s = selectors
 */
export function computeSelectors(input) {
  var state = input.state;
  var selectors = input.selectors;

  function getByPath(obj, pathStr) {
    var parts = pathStr.split('.');
    var current = obj;
    for (var i = 0; i < parts.length; i++) {
      if (current === null || current === undefined) return undefined;
      current = current[parts[i]];
    }
    return current;
  }

  var results = {};
  var computationStats = [];

  for (var s = 0; s < selectors.length; s++) {
    var selector = selectors[s];
    var source = getByPath(state, selector.path);
    var itemsProcessed = 0;
    var result;

    if (source === null || source === undefined) {
      results[selector.name] = null;
      computationStats.push({ name: selector.name, itemsProcessed: 0, resultType: 'null' });
      continue;
    }

    var entries = [];
    if (typeof source === 'object' && !Array.isArray(source)) {
      var keys = Object.keys(source);
      for (var k = 0; k < keys.length; k++) {
        entries.push(source[keys[k]]);
      }
    } else if (Array.isArray(source)) {
      entries = source;
    }

    if (selector.filter) {
      var filtered = [];
      for (var i = 0; i < entries.length; i++) {
        itemsProcessed++;
        var fieldVal = entries[i][selector.filter.field];
        var passes = false;
        var op = selector.filter.op || 'eq';

        switch (op) {
          case 'eq': passes = fieldVal === selector.filter.value; break;
          case 'neq': passes = fieldVal !== selector.filter.value; break;
          case 'gt': passes = fieldVal > selector.filter.value; break;
          case 'lt': passes = fieldVal < selector.filter.value; break;
          case 'gte': passes = fieldVal >= selector.filter.value; break;
          case 'lte': passes = fieldVal <= selector.filter.value; break;
          default: passes = fieldVal === selector.filter.value;
        }

        if (passes) filtered.push(entries[i]);
      }
      result = filtered;
    } else if (selector.aggregate) {
      itemsProcessed = entries.length;
      switch (selector.aggregate) {
        case 'count':
          result = entries.length;
          break;
        case 'sum':
          result = 0;
          for (var i = 0; i < entries.length; i++) {
            result += Number(entries[i][selector.field] || 0);
          }
          break;
        case 'avg':
          var sum = 0;
          for (var i = 0; i < entries.length; i++) {
            sum += Number(entries[i][selector.field] || 0);
          }
          result = entries.length > 0 ? sum / entries.length : 0;
          break;
        case 'max':
          result = -Infinity;
          for (var i = 0; i < entries.length; i++) {
            var v = Number(entries[i][selector.field] || 0);
            if (v > result) result = v;
          }
          result = result === -Infinity ? null : result;
          break;
        case 'min':
          result = Infinity;
          for (var i = 0; i < entries.length; i++) {
            var v = Number(entries[i][selector.field] || 0);
            if (v < result) result = v;
          }
          result = result === Infinity ? null : result;
          break;
        default:
          result = entries;
      }
    } else {
      result = entries;
      itemsProcessed = entries.length;
    }

    results[selector.name] = result;
    computationStats.push({
      name: selector.name,
      itemsProcessed: itemsProcessed,
      resultType: Array.isArray(result) ? 'array(' + result.length + ')' : typeof result,
      resultSize: Array.isArray(result) ? result.length : 1
    });
  }

  return {
    results: results,
    selectorCount: selectors.length,
    stats: computationStats,
    totalItemsProcessed: computationStats.reduce(function(s, c) { return s + c.itemsProcessed; }, 0)
  };
}

/**
 * Deep diff between two state objects. Detects additions, removals,
 * and modifications at every level of nesting.
 * @param {Object} input - { prevState: Object, nextState: Object }
 * @returns {Object} Diff results with categorized changes
 * @complexity O(n * d) where n = total keys, d = max nesting depth
 */
export function diffState(input) {
  var prevState = input.prevState;
  var nextState = input.nextState;

  var changes = [];

  function deepDiff(prev, next, path) {
    if (prev === next) return;

    if (prev === null || prev === undefined || next === null || next === undefined ||
        typeof prev !== 'object' || typeof next !== 'object') {
      changes.push({ type: 'modified', path: path, from: prev, to: next });
      return;
    }

    var prevIsArray = Array.isArray(prev);
    var nextIsArray = Array.isArray(next);

    if (prevIsArray !== nextIsArray) {
      changes.push({ type: 'type_change', path: path, from: prevIsArray ? 'array' : 'object', to: nextIsArray ? 'array' : 'object' });
      return;
    }

    if (prevIsArray) {
      var maxLen = Math.max(prev.length, next.length);
      for (var i = 0; i < maxLen; i++) {
        var itemPath = path + '[' + i + ']';
        if (i >= prev.length) {
          changes.push({ type: 'added', path: itemPath, value: next[i] });
        } else if (i >= next.length) {
          changes.push({ type: 'removed', path: itemPath, value: prev[i] });
        } else {
          deepDiff(prev[i], next[i], itemPath);
        }
      }
      return;
    }

    var prevKeys = Object.keys(prev);
    var nextKeys = Object.keys(next);
    var allKeys = {};
    for (var i = 0; i < prevKeys.length; i++) allKeys[prevKeys[i]] = true;
    for (var i = 0; i < nextKeys.length; i++) allKeys[nextKeys[i]] = true;
    var keys = Object.keys(allKeys);

    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var childPath = path ? path + '.' + key : key;

      if (!(key in prev)) {
        changes.push({ type: 'added', path: childPath, value: next[key] });
      } else if (!(key in next)) {
        changes.push({ type: 'removed', path: childPath, value: prev[key] });
      } else if (prev[key] !== next[key]) {
        if (typeof prev[key] === 'object' && typeof next[key] === 'object' &&
            prev[key] !== null && next[key] !== null) {
          deepDiff(prev[key], next[key], childPath);
        } else {
          changes.push({ type: 'modified', path: childPath, from: prev[key], to: next[key] });
        }
      }
    }
  }

  deepDiff(prevState, nextState, '');

  var summary = { added: 0, removed: 0, modified: 0, type_change: 0 };
  var changedPaths = {};
  for (var i = 0; i < changes.length; i++) {
    summary[changes[i].type] = (summary[changes[i].type] || 0) + 1;
    var topLevel = changes[i].path.split('.')[0].split('[')[0];
    if (topLevel) {
      if (!changedPaths[topLevel]) changedPaths[topLevel] = { added: 0, removed: 0, modified: 0 };
      changedPaths[topLevel][changes[i].type] = (changedPaths[topLevel][changes[i].type] || 0) + 1;
    }
  }

  return {
    hasChanges: changes.length > 0,
    totalChanges: changes.length,
    summary: summary,
    affectedTopLevelKeys: Object.keys(changedPaths).length,
    topLevelBreakdown: changedPaths,
    changes: changes.slice(0, 50),
    truncated: changes.length > 50
  };
}

/**
 * Normalizes nested API response data into flat entity maps, extracting
 * relationships into ID references (like normalizr/Redux patterns).
 * @param {Object} input - { data: Array, schema: Object }
 * @returns {Object} Normalized entities map with relationship indexes
 * @complexity O(n * r) where n = entities, r = relations per entity
 */
export function normalizeEntities(input) {
  var data = input.data;
  var schema = input.schema;

  var entities = {};
  var result = [];

  function ensureEntityMap(entityType) {
    if (!entities[entityType]) {
      entities[entityType] = {};
    }
  }

  function normalizeItem(item, schemaDef) {
    if (!item || typeof item !== 'object') return item;

    var entityType = schemaDef.entity;
    var idField = schemaDef.id || 'id';
    var entityId = item[idField];

    if (entityId === undefined || entityId === null) return item;

    ensureEntityMap(entityType);

    var normalized = {};
    var keys = Object.keys(item);
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      if (schemaDef.relations && schemaDef.relations[key]) {
        var relSchema = schemaDef.relations[key];
        var relValue = item[key];

        if (Array.isArray(relValue)) {
          var relIds = [];
          for (var r = 0; r < relValue.length; r++) {
            var normalizedRel = normalizeItem(relValue[r], relSchema);
            if (normalizedRel !== null && normalizedRel !== undefined) {
              relIds.push(relValue[r][relSchema.id || 'id']);
            }
          }
          normalized[key] = relIds;
        } else if (relValue && typeof relValue === 'object') {
          normalizeItem(relValue, relSchema);
          normalized[key] = relValue[relSchema.id || 'id'];
        } else {
          normalized[key] = relValue;
        }
      } else {
        normalized[key] = item[key];
      }
    }

    entities[entityType][String(entityId)] = normalized;
    return entityId;
  }

  for (var i = 0; i < data.length; i++) {
    var id = normalizeItem(data[i], schema);
    result.push(id);
  }

  var stats = {};
  var entityTypes = Object.keys(entities);
  var totalEntities = 0;
  for (var e = 0; e < entityTypes.length; e++) {
    var count = Object.keys(entities[entityTypes[e]]).length;
    stats[entityTypes[e]] = count;
    totalEntities += count;
  }

  var relationships = {};
  for (var e = 0; e < entityTypes.length; e++) {
    var type = entityTypes[e];
    var typeEntities = entities[type];
    var typeKeys = Object.keys(typeEntities);
    for (var k = 0; k < typeKeys.length; k++) {
      var entity = typeEntities[typeKeys[k]];
      var entKeys = Object.keys(entity);
      for (var f = 0; f < entKeys.length; f++) {
        var val = entity[entKeys[f]];
        if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'string') {
          var relKey = type + '.' + entKeys[f];
          if (!relationships[relKey]) relationships[relKey] = { count: 0, avgSize: 0, totalRefs: 0 };
          relationships[relKey].count++;
          relationships[relKey].totalRefs += val.length;
          relationships[relKey].avgSize = relationships[relKey].totalRefs / relationships[relKey].count;
        }
      }
    }
  }

  return {
    result: result,
    entities: entities,
    entityCounts: stats,
    totalEntities: totalEntities,
    entityTypes: entityTypes,
    relationships: relationships,
    denormalizationRatio: totalEntities > 0 ? data.length / totalEntities : 0
  };
}

/**
 * Manages undo/redo state by processing a sequence of actions against
 * a history structure with past, present, and future states.
 * @param {Object} input - { history: { past, present, future }, actions: Array }
 * @returns {Object} Final history state with action processing stats
 * @complexity O(n) where n = number of actions
 */
export function undoRedoManager(input) {
  var history = input.history;
  var actions = input.actions;

  var past = history.past.slice();
  var present = JSON.parse(JSON.stringify(history.present));
  var future = history.future.slice();

  var stats = { sets: 0, undos: 0, redos: 0, failedUndos: 0, failedRedos: 0, maxHistoryDepth: 0 };
  var maxHistorySize = 50;
  var actionLog = [];

  function applySet(state, path, value) {
    var newState = JSON.parse(JSON.stringify(state));
    var current = newState;
    for (var i = 0; i < path.length - 1; i++) {
      if (current[path[i]] === undefined) current[path[i]] = {};
      current = current[path[i]];
    }
    if (path.length > 0) {
      current[path[path.length - 1]] = value;
    }
    return newState;
  }

  for (var i = 0; i < actions.length; i++) {
    var action = actions[i];

    switch (action.type) {
      case 'SET':
        past.push(present);
        if (past.length > maxHistorySize) {
          past.shift();
        }
        present = applySet(present, action.path || [], action.value);
        future = [];
        stats.sets++;
        actionLog.push({ index: i, type: 'SET', success: true, historyDepth: past.length });
        break;

      case 'UNDO':
        if (past.length > 0) {
          future.push(present);
          present = past.pop();
          stats.undos++;
          actionLog.push({ index: i, type: 'UNDO', success: true, historyDepth: past.length });
        } else {
          stats.failedUndos++;
          actionLog.push({ index: i, type: 'UNDO', success: false, reason: 'nothing_to_undo' });
        }
        break;

      case 'REDO':
        if (future.length > 0) {
          past.push(present);
          present = future.pop();
          stats.redos++;
          actionLog.push({ index: i, type: 'REDO', success: true, historyDepth: past.length });
        } else {
          stats.failedRedos++;
          actionLog.push({ index: i, type: 'REDO', success: false, reason: 'nothing_to_redo' });
        }
        break;
    }

    if (past.length > stats.maxHistoryDepth) {
      stats.maxHistoryDepth = past.length;
    }
  }

  return {
    history: {
      past: past,
      present: present,
      future: future,
      pastLength: past.length,
      futureLength: future.length,
      canUndo: past.length > 0,
      canRedo: future.length > 0
    },
    stats: stats,
    totalActions: actions.length,
    successRate: actions.length > 0 ? (stats.sets + stats.undos + stats.redos) / actions.length : 0,
    actionLog: actionLog.slice(-20)
  };
}
