/**
 * Real-Time & Event-Driven Patterns
 * ====================================
 * Patterns for pub/sub event systems, debouncing, throttling, stream merging,
 * and conflict resolution. Common in real-time applications, collaborative
 * editing, WebSocket servers, and event-driven architectures.
 *
 * How to test with algorate MCP tool:
 *
 * 1. eventEmitter
 *    - entryFunction: "eventEmitter"
 *    - inputGenerator: `function generateInput(n) {
 *        var events = [];
 *        var types = ['click','scroll','resize','keydown','mousemove','focus','blur','submit'];
 *        for (var i = 0; i < n; i++) {
 *          var action = i % 5;
 *          if (action < 3) {
 *            events.push({ action: 'emit', event: types[i % types.length], data: { id: i, value: 'data_' + i } });
 *          } else if (action === 3) {
 *            events.push({ action: 'on', event: types[i % types.length], listenerId: 'listener_' + (i % Math.max(1, Math.floor(n/10))) });
 *          } else {
 *            events.push({ action: 'on', event: '*', listenerId: 'wildcard_' + i });
 *          }
 *        }
 *        return events;
 *      }`
 *    - Expected complexity: O(n * L) where L = avg listeners per event
 *
 * 2. debounce
 *    - entryFunction: "debounce"
 *    - inputGenerator: `function generateInput(n) {
 *        var events = [];
 *        var time = 0;
 *        for (var i = 0; i < n; i++) {
 *          time += Math.random() > 0.7 ? Math.floor(Math.random() * 500) + 300 : Math.floor(Math.random() * 50) + 5;
 *          events.push({ timestamp: time, type: 'input', value: 'text_' + i });
 *        }
 *        return { events: events, delayMs: 200 };
 *      }`
 *    - Expected complexity: O(n)
 *
 * 3. throttle
 *    - entryFunction: "throttle"
 *    - inputGenerator: `function generateInput(n) {
 *        var events = [];
 *        var time = 0;
 *        for (var i = 0; i < n; i++) {
 *          time += Math.floor(Math.random() * 100) + 1;
 *          events.push({ timestamp: time, type: 'scroll', value: i });
 *        }
 *        return { events: events, intervalMs: 200 };
 *      }`
 *    - Expected complexity: O(n)
 *
 * 4. mergeEventStreams
 *    - entryFunction: "mergeEventStreams"
 *    - inputGenerator: `function generateInput(n) {
 *        var streamCount = Math.max(2, Math.min(5, Math.floor(n / 10)));
 *        var streams = [];
 *        var perStream = Math.floor(n / streamCount);
 *        for (var s = 0; s < streamCount; s++) {
 *          var events = [];
 *          var time = Math.floor(Math.random() * 1000);
 *          for (var i = 0; i < perStream; i++) {
 *            time += Math.floor(Math.random() * 100) + 1;
 *            events.push({ timestamp: time, source: 'stream_' + s, type: 'event', data: { id: s + '_' + i } });
 *          }
 *          streams.push(events);
 *        }
 *        return { streams: streams, windowMs: 500 };
 *      }`
 *    - Expected complexity: O(n log n) where n = total events across streams
 *
 * 5. conflictResolver
 *    - entryFunction: "conflictResolver"
 *    - inputGenerator: `function generateInput(n) {
 *        var changes = [];
 *        var fields = ['title','body','status','assignee','priority','tags','description'];
 *        var users = ['alice','bob','charlie','diana','eve'];
 *        for (var i = 0; i < n; i++) {
 *          changes.push({
 *            documentId: 'doc_' + (i % Math.max(1, Math.floor(n / 5))),
 *            field: fields[i % fields.length],
 *            value: 'value_' + i,
 *            userId: users[i % users.length],
 *            timestamp: Date.now() + i * 10 + Math.floor(Math.random() * 5),
 *            vectorClock: { node: users[i % users.length], counter: Math.floor(i / users.length) + 1 }
 *          });
 *        }
 *        return changes;
 *      }`
 *    - Expected complexity: O(n log n) due to sorting by timestamp
 */

/**
 * Simulates a pub/sub event emitter system with wildcard support.
 * Processes a sequence of on/off/emit actions and tracks listener invocations.
 * @param {Array<Object>} actions - Array of { action: 'on'|'off'|'emit', event, listenerId?, data? }
 * @returns {Object} Event system statistics with emission trace
 * @complexity O(n * L) where n = actions, L = avg listeners per event
 */
export function eventEmitter(actions) {
  const listeners = {};
  const wildcardListeners = {};
  const emitTrace = [];
  let totalEmissions = 0;
  let totalDeliveries = 0;
  let totalRegistrations = 0;
  let totalRemovals = 0;
  const eventCounts = {};

  for (let i = 0; i < actions.length; i++) {
    const act = actions[i];

    if (act.action === 'on') {
      totalRegistrations++;
      if (act.event === '*') {
        const lid = act.listenerId || ('wc_' + i);
        wildcardListeners[lid] = true;
      } else {
        if (!listeners[act.event]) listeners[act.event] = {};
        const lid = act.listenerId || ('l_' + i);
        listeners[act.event][lid] = true;
      }
    } else if (act.action === 'off') {
      totalRemovals++;
      if (act.event === '*') {
        const lid = act.listenerId || '';
        if (wildcardListeners[lid]) delete wildcardListeners[lid];
      } else if (listeners[act.event]) {
        const lid = act.listenerId || '';
        if (listeners[act.event][lid]) delete listeners[act.event][lid];
      }
    } else if (act.action === 'emit') {
      totalEmissions++;
      eventCounts[act.event] = (eventCounts[act.event] || 0) + 1;

      const eventListeners = listeners[act.event] ? Object.keys(listeners[act.event]) : [];
      const wcListeners = Object.keys(wildcardListeners);
      const allNotified = eventListeners.concat(wcListeners);

      totalDeliveries += allNotified.length;

      if (emitTrace.length < 100) {
        emitTrace.push({
          index: i,
          event: act.event,
          listenersNotified: allNotified.length,
          eventListeners: eventListeners.length,
          wildcardListeners: wcListeners.length,
          data: act.data
        });
      }
    }
  }

  const registeredEvents = Object.keys(listeners);
  const listenerCounts = {};
  for (let e = 0; e < registeredEvents.length; e++) {
    listenerCounts[registeredEvents[e]] = Object.keys(listeners[registeredEvents[e]]).length;
  }

  const topEvents = Object.entries(eventCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([event, count]) => ({ event, count }));

  return {
    totalActions: actions.length,
    totalEmissions,
    totalDeliveries,
    totalRegistrations,
    totalRemovals,
    avgDeliveriesPerEmit: totalEmissions > 0 ? +(totalDeliveries / totalEmissions).toFixed(2) : 0,
    registeredEvents: registeredEvents.length,
    wildcardListenerCount: Object.keys(wildcardListeners).length,
    listenerCounts,
    topEvents,
    emitTrace: emitTrace.slice(0, 30)
  };
}

/**
 * Simulates debouncing on an event stream. Only the last event in a burst
 * (no new events within delayMs) is accepted.
 * @param {Object} input - { events, delayMs }
 * @param {Array<Object>} input.events - Array of timestamped events sorted by time
 * @param {number} input.delayMs - Debounce delay in milliseconds
 * @returns {Object} Debounced events with filtering statistics
 * @complexity O(n) where n = number of events
 */
export function debounce(input) {
  const { events, delayMs } = input;

  if (!events || events.length === 0) {
    return { accepted: [], rejected: 0, totalEvents: 0, acceptRate: 0 };
  }

  const sorted = events.slice().sort((a, b) => a.timestamp - b.timestamp);
  const accepted = [];
  const burstSizes = [];
  let currentBurstStart = 0;

  for (let i = 0; i < sorted.length; i++) {
    const isLast = i === sorted.length - 1;
    const nextGap = isLast ? Infinity : sorted[i + 1].timestamp - sorted[i].timestamp;

    if (nextGap >= delayMs) {
      accepted.push({
        ...sorted[i],
        acceptedAt: sorted[i].timestamp + delayMs,
        burstPosition: i - currentBurstStart,
        burstSize: i - currentBurstStart + 1
      });

      burstSizes.push(i - currentBurstStart + 1);
      currentBurstStart = i + 1;
    }
  }

  const rejected = sorted.length - accepted.length;
  const avgBurstSize = burstSizes.length > 0 ? +(burstSizes.reduce((a, b) => a + b, 0) / burstSizes.length).toFixed(2) : 0;
  const maxBurstSize = burstSizes.length > 0 ? Math.max(...burstSizes) : 0;

  const timeSpan = sorted.length > 1 ? sorted[sorted.length - 1].timestamp - sorted[0].timestamp : 0;
  const inputRate = timeSpan > 0 ? +(sorted.length / (timeSpan / 1000)).toFixed(2) : 0;
  const outputRate = timeSpan > 0 ? +(accepted.length / (timeSpan / 1000)).toFixed(2) : 0;

  return {
    totalEvents: sorted.length,
    accepted: accepted.slice(0, 50),
    acceptedCount: accepted.length,
    rejected,
    acceptRate: +(accepted.length / sorted.length * 100).toFixed(2),
    reductionFactor: sorted.length > 0 ? +(sorted.length / Math.max(1, accepted.length)).toFixed(2) : 1,
    totalBursts: burstSizes.length,
    avgBurstSize,
    maxBurstSize,
    delayMs,
    inputRate,
    outputRate,
    timeSpan
  };
}

/**
 * Simulates throttling on an event stream. At most one event is accepted
 * per intervalMs window.
 * @param {Object} input - { events, intervalMs }
 * @param {Array<Object>} input.events - Array of timestamped events
 * @param {number} input.intervalMs - Throttle interval in milliseconds
 * @returns {Object} Throttled events with filtering statistics
 * @complexity O(n) where n = number of events
 */
export function throttle(input) {
  const { events, intervalMs } = input;

  if (!events || events.length === 0) {
    return { accepted: [], rejected: 0, totalEvents: 0, acceptRate: 0 };
  }

  const sorted = events.slice().sort((a, b) => a.timestamp - b.timestamp);
  const accepted = [];
  const rejected = [];
  let lastAcceptedTime = -Infinity;
  let windowCount = 0;
  let currentWindowStart = sorted[0].timestamp;

  for (let i = 0; i < sorted.length; i++) {
    const ev = sorted[i];

    if (ev.timestamp - lastAcceptedTime >= intervalMs) {
      if (ev.timestamp - currentWindowStart >= intervalMs) {
        windowCount++;
        currentWindowStart = ev.timestamp;
      }

      accepted.push({
        ...ev,
        timeSinceLastAccepted: lastAcceptedTime === -Infinity ? 0 : ev.timestamp - lastAcceptedTime,
        windowIndex: windowCount
      });
      lastAcceptedTime = ev.timestamp;
    } else {
      rejected.push({
        timestamp: ev.timestamp,
        timeSinceLastAccepted: ev.timestamp - lastAcceptedTime,
        remainingCooldown: intervalMs - (ev.timestamp - lastAcceptedTime)
      });
    }
  }

  const gaps = [];
  for (let i = 1; i < accepted.length; i++) {
    gaps.push(accepted[i].timestamp - accepted[i - 1].timestamp);
  }
  const avgGap = gaps.length > 0 ? +(gaps.reduce((a, b) => a + b, 0) / gaps.length).toFixed(2) : 0;
  const minGap = gaps.length > 0 ? Math.min(...gaps) : 0;

  const timeSpan = sorted.length > 1 ? sorted[sorted.length - 1].timestamp - sorted[0].timestamp : 0;

  return {
    totalEvents: sorted.length,
    accepted: accepted.slice(0, 50),
    acceptedCount: accepted.length,
    rejectedCount: rejected.length,
    acceptRate: +(accepted.length / sorted.length * 100).toFixed(2),
    reductionFactor: sorted.length > 0 ? +(sorted.length / Math.max(1, accepted.length)).toFixed(2) : 1,
    intervalMs,
    avgGapBetweenAccepted: avgGap,
    minGapBetweenAccepted: minGap,
    windowCount,
    timeSpan,
    theoreticalMaxAccepted: timeSpan > 0 ? Math.floor(timeSpan / intervalMs) + 1 : 1,
    efficiency: timeSpan > 0 ? +((accepted.length / (Math.floor(timeSpan / intervalMs) + 1)) * 100).toFixed(2) : 100
  };
}

/**
 * Merges multiple event streams into a single sorted stream with optional
 * windowed grouping. Events from all streams are interleaved by timestamp.
 * @param {Object} input - { streams, windowMs }
 * @param {Array<Array<Object>>} input.streams - Array of event arrays, each with timestamps
 * @param {number} input.windowMs - Window size for grouping events
 * @returns {Object} Merged stream with windowed groups and source statistics
 * @complexity O(n log n) where n = total events across all streams
 */
export function mergeEventStreams(input) {
  const { streams, windowMs } = input;

  const allEvents = [];
  const sourceStats = {};

  for (let s = 0; s < streams.length; s++) {
    const stream = streams[s];
    const sourceName = 'stream_' + s;
    sourceStats[sourceName] = { count: stream.length, minTs: Infinity, maxTs: -Infinity };

    for (let i = 0; i < stream.length; i++) {
      allEvents.push({
        ...stream[i],
        _sourceIndex: s,
        _source: stream[i].source || sourceName
      });

      const ts = stream[i].timestamp;
      if (ts < sourceStats[sourceName].minTs) sourceStats[sourceName].minTs = ts;
      if (ts > sourceStats[sourceName].maxTs) sourceStats[sourceName].maxTs = ts;
    }
  }

  allEvents.sort((a, b) => a.timestamp - b.timestamp);

  const windows = [];
  if (allEvents.length > 0) {
    let windowStart = allEvents[0].timestamp;
    let currentWindow = { start: windowStart, end: windowStart + windowMs, events: [] };

    for (let i = 0; i < allEvents.length; i++) {
      const ev = allEvents[i];

      while (ev.timestamp >= currentWindow.end) {
        if (currentWindow.events.length > 0) {
          const sources = new Set(currentWindow.events.map(e => e._source));
          windows.push({
            start: currentWindow.start,
            end: currentWindow.end,
            eventCount: currentWindow.events.length,
            sourceCount: sources.size,
            sources: Array.from(sources)
          });
        }
        currentWindow = {
          start: currentWindow.end,
          end: currentWindow.end + windowMs,
          events: []
        };
      }

      currentWindow.events.push(ev);
    }

    if (currentWindow.events.length > 0) {
      const sources = new Set(currentWindow.events.map(e => e._source));
      windows.push({
        start: currentWindow.start,
        end: currentWindow.end,
        eventCount: currentWindow.events.length,
        sourceCount: sources.size,
        sources: Array.from(sources)
      });
    }
  }

  const avgEventsPerWindow = windows.length > 0
    ? +(windows.reduce((s, w) => s + w.eventCount, 0) / windows.length).toFixed(2) : 0;
  const maxEventsInWindow = windows.length > 0
    ? Math.max(...windows.map(w => w.eventCount)) : 0;

  let isSorted = true;
  for (let i = 1; i < allEvents.length; i++) {
    if (allEvents[i].timestamp < allEvents[i - 1].timestamp) {
      isSorted = false;
      break;
    }
  }

  return {
    totalEvents: allEvents.length,
    streamCount: streams.length,
    isSorted,
    windowMs,
    windowCount: windows.length,
    avgEventsPerWindow,
    maxEventsInWindow,
    sourceStats,
    windows: windows.slice(0, 30),
    mergedSample: allEvents.slice(0, 20).map(e => ({
      timestamp: e.timestamp,
      source: e._source,
      type: e.type,
      data: e.data
    }))
  };
}

/**
 * CRDT-like last-write-wins conflict resolver for collaborative editing.
 * Groups changes by document and field, resolving conflicts using timestamps
 * and vector clocks.
 * @param {Array<Object>} changes - Array of change objects with documentId, field, value, userId, timestamp, vectorClock
 * @returns {Object} Resolved document states with conflict statistics
 * @complexity O(n log n) due to sorting by timestamp
 */
export function conflictResolver(changes) {
  if (!changes || changes.length === 0) {
    return { documents: {}, totalChanges: 0, conflicts: 0, resolutions: [] };
  }

  const sorted = changes.slice().sort((a, b) => a.timestamp - b.timestamp);

  const documents = {};
  const conflictLog = [];
  let totalConflicts = 0;
  let totalResolutions = 0;
  const userChangeCount = {};
  const fieldChangeCount = {};

  for (let i = 0; i < sorted.length; i++) {
    const change = sorted[i];
    const docId = change.documentId;
    const field = change.field;

    userChangeCount[change.userId] = (userChangeCount[change.userId] || 0) + 1;
    fieldChangeCount[field] = (fieldChangeCount[field] || 0) + 1;

    if (!documents[docId]) {
      documents[docId] = { fields: {}, history: [], lastModified: 0, modifiedBy: null };
    }

    const doc = documents[docId];

    if (doc.fields[field]) {
      const existing = doc.fields[field];
      const isConflict = existing.userId !== change.userId;

      if (isConflict) {
        totalConflicts++;

        let winner;
        if (change.timestamp > existing.timestamp) {
          winner = 'incoming';
        } else if (change.timestamp === existing.timestamp) {
          if (change.vectorClock && existing.vectorClock) {
            winner = change.vectorClock.counter > existing.vectorClock.counter ? 'incoming' : 'existing';
          } else {
            winner = change.userId > existing.userId ? 'incoming' : 'existing';
          }
        } else {
          winner = 'existing';
        }

        if (conflictLog.length < 50) {
          conflictLog.push({
            documentId: docId,
            field,
            existingUser: existing.userId,
            incomingUser: change.userId,
            existingTimestamp: existing.timestamp,
            incomingTimestamp: change.timestamp,
            winner,
            resolution: 'last_write_wins'
          });
        }

        totalResolutions++;

        if (winner === 'incoming') {
          doc.fields[field] = {
            value: change.value,
            userId: change.userId,
            timestamp: change.timestamp,
            vectorClock: change.vectorClock,
            version: (existing.version || 1) + 1
          };
        }
      } else {
        doc.fields[field] = {
          value: change.value,
          userId: change.userId,
          timestamp: change.timestamp,
          vectorClock: change.vectorClock,
          version: (existing.version || 1) + 1
        };
      }
    } else {
      doc.fields[field] = {
        value: change.value,
        userId: change.userId,
        timestamp: change.timestamp,
        vectorClock: change.vectorClock,
        version: 1
      };
    }

    doc.lastModified = change.timestamp;
    doc.modifiedBy = change.userId;

    if (doc.history.length < 20) {
      doc.history.push({
        field,
        value: change.value,
        userId: change.userId,
        timestamp: change.timestamp
      });
    }
  }

  const documentSummaries = {};
  for (const docId in documents) {
    const doc = documents[docId];
    const fields = {};
    for (const f in doc.fields) {
      fields[f] = {
        value: doc.fields[f].value,
        lastModifiedBy: doc.fields[f].userId,
        version: doc.fields[f].version
      };
    }
    documentSummaries[docId] = {
      fields,
      fieldCount: Object.keys(fields).length,
      lastModified: doc.lastModified,
      modifiedBy: doc.modifiedBy
    };
  }

  const topContributors = Object.entries(userChangeCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([userId, count]) => ({ userId, changes: count, percent: +((count / changes.length) * 100).toFixed(1) }));

  return {
    totalChanges: changes.length,
    documentCount: Object.keys(documents).length,
    totalConflicts,
    totalResolutions,
    conflictRate: changes.length > 0 ? +((totalConflicts / changes.length) * 100).toFixed(2) : 0,
    documents: documentSummaries,
    conflictLog: conflictLog.slice(0, 20),
    topContributors,
    uniqueUsers: Object.keys(userChangeCount).length,
    fieldChangeCount
  };
}
