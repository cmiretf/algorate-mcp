/**
 * Authentication & Security Patterns
 * ====================================
 * Common security patterns found in fullstack applications including
 * password hashing, token generation, session management, rate limiting,
 * and input sanitization.
 *
 * How to test with algorate MCP tool:
 *
 * 1. hashPassword
 *    - entryFunction: "hashPassword"
 *    - inputGenerator: `function generateInput(n) {
 *        var chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
 *        var password = '';
 *        for (var i = 0; i < Math.min(n, 128); i++) password += chars[Math.floor(Math.random() * chars.length)];
 *        var salt = '';
 *        for (var i = 0; i < 16; i++) salt += chars[Math.floor(Math.random() * chars.length)];
 *        return { password: password, salt: salt, rounds: n };
 *      }`
 *    - Expected complexity: O(n) where n = number of hashing rounds
 *
 * 2. generateToken
 *    - entryFunction: "generateToken"
 *    - inputGenerator: `function generateInput(n) {
 *        var claims = {};
 *        for (var i = 0; i < n; i++) {
 *          claims['claim_' + i] = 'value_' + Math.floor(Math.random() * 10000);
 *        }
 *        return { payload: { sub: 'user_123', iat: Date.now(), exp: Date.now() + 3600000, claims: claims }, secretLength: Math.max(32, n) };
 *      }`
 *    - Expected complexity: O(n) where n = number of claims in payload
 *
 * 3. validateSession
 *    - entryFunction: "validateSession"
 *    - inputGenerator: `function generateInput(n) {
 *        var now = Date.now();
 *        var sessions = [];
 *        for (var i = 0; i < n; i++) {
 *          sessions.push({
 *            token: 'tok_' + i + '_' + Math.random().toString(36).slice(2),
 *            userId: 'user_' + (i % Math.max(1, Math.floor(n/10))),
 *            createdAt: now - Math.floor(Math.random() * 86400000),
 *            expiresAt: now + Math.floor(Math.random() * 86400000) - 43200000,
 *            ip: '192.168.1.' + (i % 256),
 *            userAgent: 'Mozilla/5.0 Agent-' + (i % 5),
 *            permissions: ['read', 'write', 'admin'].slice(0, 1 + (i % 3))
 *          });
 *        }
 *        var targetToken = sessions[Math.floor(Math.random() * sessions.length)].token;
 *        return { sessions: sessions, token: targetToken };
 *      }`
 *    - Expected complexity: O(n) linear scan, O(1) with index
 *
 * 4. rateLimitCheck
 *    - entryFunction: "rateLimitCheck"
 *    - inputGenerator: `function generateInput(n) {
 *        var now = Date.now();
 *        var log = [];
 *        for (var i = 0; i < n; i++) {
 *          log.push({
 *            ip: '10.0.' + (i % 10) + '.' + (i % 256),
 *            timestamp: now - Math.floor(Math.random() * 60000),
 *            endpoint: '/api/v1/' + ['users','posts','comments','auth'][i % 4]
 *          });
 *        }
 *        return { requestLog: log, ip: '10.0.0.1', windowMs: 60000, maxRequests: 100 };
 *      }`
 *    - Expected complexity: O(n) where n = number of log entries
 *
 * 5. sanitizeInput
 *    - entryFunction: "sanitizeInput"
 *    - inputGenerator: `function generateInput(n) {
 *        var parts = [];
 *        var payloads = [
 *          '<script>alert("xss")</script>', '"; DROP TABLE users; --',
 *          '<img onerror="hack()">', 'javascript:void(0)', '{{constructor.constructor}}',
 *          '<svg onload=alert(1)>', 'normal text here', '<b>bold</b>',
 *          '&lt;encoded&gt;', '<iframe src="evil">'
 *        ];
 *        for (var i = 0; i < n; i++) {
 *          parts.push(payloads[i % payloads.length] + ' segment_' + i);
 *        }
 *        return parts.join(' ');
 *      }`
 *    - Expected complexity: O(n) where n = input string length
 */

/**
 * Iterative password hashing simulation. Applies multiple rounds of
 * character-level transformations combining the password with a salt
 * to produce a deterministic hash string.
 * @param {Object} input - { password: string, salt: string, rounds: number }
 * @returns {Object} Hash result with metadata
 * @complexity O(n * m) where n = rounds, m = password length
 */
export function hashPassword(input) {
  var password = input.password;
  var salt = input.salt;
  var rounds = input.rounds;

  var combined = password + ':' + salt;
  var hash = [];
  for (var i = 0; i < combined.length; i++) {
    hash.push(combined.charCodeAt(i));
  }

  for (var round = 0; round < rounds; round++) {
    var newHash = [];
    var roundSeed = (round * 31 + 17) & 0xFFFF;

    for (var j = 0; j < hash.length; j++) {
      var val = hash[j];
      val = (val * 31 + roundSeed) & 0xFFFF;
      val = val ^ (hash[(j + 1) % hash.length] << 3);
      val = ((val << 5) | (val >>> 11)) & 0xFFFF;
      val = val ^ (hash[(j + hash.length - 1) % hash.length] >>> 2);
      val = (val + round * 7 + j * 13) & 0xFFFF;
      newHash.push(val & 0xFF);
    }

    if (round % 3 === 0 && newHash.length < 64) {
      var extraLen = Math.min(64 - newHash.length, 8);
      for (var k = 0; k < extraLen; k++) {
        var extra = (newHash[k % newHash.length] * 37 + round) & 0xFF;
        newHash.push(extra);
      }
    }

    hash = newHash;
  }

  var hexChars = '0123456789abcdef';
  var hashStr = '';
  for (var i = 0; i < hash.length; i++) {
    hashStr += hexChars[(hash[i] >> 4) & 0xF] + hexChars[hash[i] & 0xF];
  }

  var strength = 'weak';
  if (password.length >= 12 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^a-zA-Z0-9]/.test(password)) {
    strength = 'strong';
  } else if (password.length >= 8 && (/[A-Z]/.test(password) || /[0-9]/.test(password))) {
    strength = 'medium';
  }

  return {
    hash: hashStr,
    salt: salt,
    rounds: rounds,
    hashLength: hashStr.length,
    algorithm: 'iterative-transform-v1',
    strength: strength,
    passwordLength: password.length
  };
}

/**
 * Generates a JWT-like token by encoding a payload with a generated secret.
 * Creates header, payload, and signature segments with base64-like encoding.
 * @param {Object} input - { payload: Object, secretLength: number }
 * @returns {Object} Token object with segments and metadata
 * @complexity O(n) where n = size of payload (number of claims)
 */
export function generateToken(input) {
  var payload = input.payload;
  var secretLength = input.secretLength;

  var b64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

  function toBase64Like(str) {
    var result = '';
    for (var i = 0; i < str.length; i++) {
      var code = str.charCodeAt(i);
      result += b64Chars[code & 63];
      result += b64Chars[(code >> 6) & 63];
    }
    return result;
  }

  var header = { alg: 'HS256-SIM', typ: 'JWT' };
  var headerStr = '';
  var headerKeys = Object.keys(header);
  for (var i = 0; i < headerKeys.length; i++) {
    if (i > 0) headerStr += ',';
    headerStr += '"' + headerKeys[i] + '":"' + header[headerKeys[i]] + '"';
  }
  headerStr = '{' + headerStr + '}';

  function serializeValue(val) {
    if (val === null || val === undefined) return 'null';
    if (typeof val === 'object' && !Array.isArray(val)) {
      var parts = [];
      var keys = Object.keys(val);
      for (var k = 0; k < keys.length; k++) {
        parts.push('"' + keys[k] + '":' + serializeValue(val[keys[k]]));
      }
      return '{' + parts.join(',') + '}';
    }
    if (Array.isArray(val)) {
      return '[' + val.map(serializeValue).join(',') + ']';
    }
    if (typeof val === 'string') return '"' + val + '"';
    return String(val);
  }

  var payloadStr = serializeValue(payload);
  var encodedHeader = toBase64Like(headerStr);
  var encodedPayload = toBase64Like(payloadStr);

  var secret = '';
  for (var i = 0; i < secretLength; i++) {
    var charCode = ((i * 7 + 13) * 31 + payloadStr.charCodeAt(i % payloadStr.length)) & 0xFF;
    secret += b64Chars[charCode & 63];
  }

  var sigInput = encodedHeader + '.' + encodedPayload;
  var sigHash = 0;
  for (var i = 0; i < sigInput.length; i++) {
    sigHash = ((sigHash << 5) - sigHash + sigInput.charCodeAt(i)) | 0;
    sigHash = sigHash ^ (secret.charCodeAt(i % secret.length) << (i % 8));
  }

  var signature = '';
  var sigNum = Math.abs(sigHash);
  for (var i = 0; i < 43; i++) {
    signature += b64Chars[(sigNum + i * 7) & 63];
    sigNum = (sigNum * 31 + i) & 0x7FFFFFFF;
  }

  var token = encodedHeader + '.' + encodedPayload + '.' + signature;

  return {
    token: token,
    parts: { header: encodedHeader, payload: encodedPayload, signature: signature },
    metadata: {
      headerSize: encodedHeader.length,
      payloadSize: encodedPayload.length,
      signatureSize: signature.length,
      totalSize: token.length,
      claimCount: payload.claims ? Object.keys(payload.claims).length : 0,
      issuedAt: payload.iat || null,
      expiresAt: payload.exp || null
    }
  };
}

/**
 * Validates a session token against a session store. Performs lookup,
 * expiry checking, IP consistency, and permission resolution.
 * @param {Object} input - { sessions: Array, token: string }
 * @returns {Object} Validation result with session details or rejection reason
 * @complexity O(n) where n = number of sessions (linear scan)
 */
export function validateSession(input) {
  var sessions = input.sessions;
  var token = input.token;
  var now = Date.now();

  var sessionIndex = {};
  var userSessionCount = {};
  var expiredCount = 0;
  var activeCount = 0;

  for (var i = 0; i < sessions.length; i++) {
    var s = sessions[i];
    sessionIndex[s.token] = s;

    if (!userSessionCount[s.userId]) {
      userSessionCount[s.userId] = { total: 0, active: 0, expired: 0 };
    }
    userSessionCount[s.userId].total++;

    if (s.expiresAt < now) {
      userSessionCount[s.userId].expired++;
      expiredCount++;
    } else {
      userSessionCount[s.userId].active++;
      activeCount++;
    }
  }

  var session = sessionIndex[token];
  if (!session) {
    return {
      valid: false,
      reason: 'TOKEN_NOT_FOUND',
      totalSessions: sessions.length,
      activeSessions: activeCount,
      expiredSessions: expiredCount
    };
  }

  if (session.expiresAt < now) {
    var timeSinceExpiry = now - session.expiresAt;
    return {
      valid: false,
      reason: 'SESSION_EXPIRED',
      expiredAgo: timeSinceExpiry,
      expiredAgoMinutes: Math.floor(timeSinceExpiry / 60000),
      userId: session.userId,
      canRefresh: timeSinceExpiry < 86400000
    };
  }

  var timeRemaining = session.expiresAt - now;
  var sessionAge = now - session.createdAt;
  var userSessions = userSessionCount[session.userId] || { total: 0, active: 0 };

  var riskScore = 0;
  if (userSessions.active > 5) riskScore += 20;
  if (sessionAge > 72 * 3600000) riskScore += 15;
  if (timeRemaining < 900000) riskScore += 10;

  var permissionSet = {};
  if (session.permissions) {
    for (var p = 0; p < session.permissions.length; p++) {
      permissionSet[session.permissions[p]] = true;
    }
  }

  return {
    valid: true,
    userId: session.userId,
    permissions: permissionSet,
    sessionAge: sessionAge,
    sessionAgeHours: Math.floor(sessionAge / 3600000),
    timeRemaining: timeRemaining,
    timeRemainingMinutes: Math.floor(timeRemaining / 60000),
    needsRefresh: timeRemaining < 900000,
    riskScore: riskScore,
    riskLevel: riskScore >= 30 ? 'high' : riskScore >= 15 ? 'medium' : 'low',
    concurrentSessions: userSessions.active,
    totalSessions: sessions.length,
    activeSessions: activeCount
  };
}

/**
 * Sliding window rate limit check. Analyzes a request log to determine
 * if a specific IP has exceeded the allowed request count within a time window.
 * @param {Object} input - { requestLog: Array, ip: string, windowMs: number, maxRequests: number }
 * @returns {Object} Rate limit status with detailed per-IP analytics
 * @complexity O(n) where n = number of log entries
 */
export function rateLimitCheck(input) {
  var requestLog = input.requestLog;
  var ip = input.ip;
  var windowMs = input.windowMs;
  var maxRequests = input.maxRequests;
  var now = Date.now();

  var ipBuckets = {};
  var endpointCounts = {};
  var windowStart = now - windowMs;

  for (var i = 0; i < requestLog.length; i++) {
    var entry = requestLog[i];
    if (!ipBuckets[entry.ip]) {
      ipBuckets[entry.ip] = { inWindow: [], total: 0, endpoints: {} };
    }

    var bucket = ipBuckets[entry.ip];
    bucket.total++;

    if (!bucket.endpoints[entry.endpoint]) {
      bucket.endpoints[entry.endpoint] = 0;
    }
    bucket.endpoints[entry.endpoint]++;

    if (entry.timestamp >= windowStart) {
      bucket.inWindow.push(entry.timestamp);
    }

    if (!endpointCounts[entry.endpoint]) {
      endpointCounts[entry.endpoint] = 0;
    }
    endpointCounts[entry.endpoint]++;
  }

  var targetBucket = ipBuckets[ip];
  var requestsInWindow = targetBucket ? targetBucket.inWindow.length : 0;
  var isLimited = requestsInWindow >= maxRequests;

  var retryAfter = 0;
  if (isLimited && targetBucket && targetBucket.inWindow.length > 0) {
    var sortedTimestamps = targetBucket.inWindow.slice().sort(function(a, b) { return a - b; });
    retryAfter = sortedTimestamps[0] + windowMs - now;
    if (retryAfter < 0) retryAfter = 0;
  }

  var utilization = requestsInWindow / maxRequests;
  var burstScore = 0;
  if (targetBucket && targetBucket.inWindow.length >= 2) {
    var sorted = targetBucket.inWindow.slice().sort(function(a, b) { return a - b; });
    var gaps = [];
    for (var g = 1; g < sorted.length; g++) {
      gaps.push(sorted[g] - sorted[g - 1]);
    }
    var avgGap = gaps.reduce(function(s, v) { return s + v; }, 0) / gaps.length;
    burstScore = avgGap < (windowMs / maxRequests / 2) ? 'high' : avgGap < (windowMs / maxRequests) ? 'medium' : 'low';
  } else {
    burstScore = 'none';
  }

  var ipSummary = {};
  var ipKeys = Object.keys(ipBuckets);
  for (var k = 0; k < ipKeys.length; k++) {
    var b = ipBuckets[ipKeys[k]];
    ipSummary[ipKeys[k]] = {
      requestsInWindow: b.inWindow.length,
      totalRequests: b.total,
      isLimited: b.inWindow.length >= maxRequests,
      topEndpoint: Object.keys(b.endpoints).sort(function(a, c) { return b.endpoints[c] - b.endpoints[a]; })[0] || null
    };
  }

  return {
    ip: ip,
    allowed: !isLimited,
    requestsInWindow: requestsInWindow,
    maxRequests: maxRequests,
    remaining: Math.max(0, maxRequests - requestsInWindow),
    utilization: utilization,
    retryAfterMs: isLimited ? retryAfter : 0,
    burstPattern: burstScore,
    uniqueIPs: ipKeys.length,
    totalLogEntries: requestLog.length,
    endpointBreakdown: endpointCounts,
    ipSummary: ipSummary
  };
}

/**
 * Deep input sanitization against XSS, SQL injection, and template injection
 * patterns. Applies multiple regex passes and character escaping.
 * @param {string} inputStr - Raw user input string to sanitize
 * @returns {Object} Sanitized output with threat analysis
 * @complexity O(n * p) where n = string length, p = number of patterns
 */
export function sanitizeInput(inputStr) {
  var original = inputStr;
  var threats = [];
  var sanitized = inputStr;

  var xssPatterns = [
    { pattern: /<script[^>]*>[\s\S]*?<\/script>/gi, name: 'script_tag' },
    { pattern: /<iframe[^>]*>[\s\S]*?<\/iframe>/gi, name: 'iframe_tag' },
    { pattern: /<object[^>]*>[\s\S]*?<\/object>/gi, name: 'object_tag' },
    { pattern: /<embed[^>]*>/gi, name: 'embed_tag' },
    { pattern: /<svg[^>]*onload[^>]*>/gi, name: 'svg_onload' },
    { pattern: /<img[^>]*onerror[^>]*>/gi, name: 'img_onerror' },
    { pattern: /on\w+\s*=\s*["'][^"']*["']/gi, name: 'event_handler' },
    { pattern: /javascript\s*:/gi, name: 'javascript_protocol' },
    { pattern: /vbscript\s*:/gi, name: 'vbscript_protocol' },
    { pattern: /data\s*:\s*text\/html/gi, name: 'data_uri_html' }
  ];

  for (var i = 0; i < xssPatterns.length; i++) {
    var matches = sanitized.match(xssPatterns[i].pattern);
    if (matches) {
      for (var m = 0; m < matches.length; m++) {
        threats.push({ type: 'xss', subType: xssPatterns[i].name, match: matches[m].substring(0, 50) });
      }
      sanitized = sanitized.replace(xssPatterns[i].pattern, '');
    }
  }

  var sqlPatterns = [
    { pattern: /(['"])\s*;\s*DROP\s+TABLE/gi, name: 'drop_table' },
    { pattern: /(['"])\s*;\s*DELETE\s+FROM/gi, name: 'delete_from' },
    { pattern: /(['"])\s*;\s*INSERT\s+INTO/gi, name: 'insert_into' },
    { pattern: /(['"])\s*;\s*UPDATE\s+\w+\s+SET/gi, name: 'update_set' },
    { pattern: /UNION\s+(ALL\s+)?SELECT/gi, name: 'union_select' },
    { pattern: /--\s*$/gm, name: 'sql_comment' },
    { pattern: /\/\*[\s\S]*?\*\//g, name: 'block_comment' }
  ];

  for (var i = 0; i < sqlPatterns.length; i++) {
    var matches = sanitized.match(sqlPatterns[i].pattern);
    if (matches) {
      for (var m = 0; m < matches.length; m++) {
        threats.push({ type: 'sql_injection', subType: sqlPatterns[i].name, match: matches[m].substring(0, 50) });
      }
      sanitized = sanitized.replace(sqlPatterns[i].pattern, '');
    }
  }

  var templatePatterns = [
    { pattern: /\{\{[\s\S]*?constructor[\s\S]*?\}\}/gi, name: 'prototype_pollution' },
    { pattern: /\{\{[\s\S]*?__proto__[\s\S]*?\}\}/gi, name: 'proto_access' },
    { pattern: /\$\{[\s\S]*?\}/g, name: 'template_literal' }
  ];

  for (var i = 0; i < templatePatterns.length; i++) {
    var matches = sanitized.match(templatePatterns[i].pattern);
    if (matches) {
      for (var m = 0; m < matches.length; m++) {
        threats.push({ type: 'template_injection', subType: templatePatterns[i].name, match: matches[m].substring(0, 50) });
      }
      sanitized = sanitized.replace(templatePatterns[i].pattern, '');
    }
  }

  sanitized = sanitized.replace(/</g, '&lt;');
  sanitized = sanitized.replace(/>/g, '&gt;');
  sanitized = sanitized.replace(/"/g, '&quot;');
  sanitized = sanitized.replace(/'/g, '&#x27;');

  sanitized = sanitized.replace(/\x00/g, '');
  sanitized = sanitized.replace(/[\x01-\x08\x0B\x0C\x0E-\x1F]/g, '');

  var threatSummary = {};
  for (var t = 0; t < threats.length; t++) {
    var key = threats[t].type;
    if (!threatSummary[key]) threatSummary[key] = 0;
    threatSummary[key]++;
  }

  return {
    sanitized: sanitized,
    originalLength: original.length,
    sanitizedLength: sanitized.length,
    charsRemoved: original.length - sanitized.length,
    threatsDetected: threats.length,
    threatTypes: threatSummary,
    threats: threats.slice(0, 20),
    riskLevel: threats.length > 5 ? 'critical' : threats.length > 2 ? 'high' : threats.length > 0 ? 'medium' : 'safe',
    isSafe: threats.length === 0
  };
}
