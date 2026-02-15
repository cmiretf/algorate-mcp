/**
 * HTTP Middleware & Request Processing
 * =====================================
 * Patterns for HTTP middleware pipelines, route matching, body parsing,
 * response compression, and CORS validation. Common in Express/Koa-style
 * web frameworks and API gateways.
 *
 * How to test with algorate MCP tool:
 *
 * 1. middlewarePipeline
 *    - entryFunction: "middlewarePipeline"
 *    - inputGenerator: `function generateInput(n) {
 *        const middlewares = Array.from({length: n}, (_, i) => ({
 *          name: 'mw_' + i,
 *          transform: i % 3 === 0 ? 'addHeader' : i % 3 === 1 ? 'validate' : 'log',
 *          headerKey: 'X-Custom-' + i,
 *          headerValue: 'value_' + i
 *        }));
 *        return {
 *          middlewares,
 *          request: { method: 'POST', path: '/api/users', headers: { 'Content-Type': 'application/json' }, body: { name: 'test' }, timestamp: Date.now() }
 *        };
 *      }`
 *    - Expected complexity: O(n)
 *
 * 2. routeMatcher
 *    - entryFunction: "routeMatcher"
 *    - inputGenerator: `function generateInput(n) {
 *        const methods = ['GET','POST','PUT','DELETE','PATCH'];
 *        const routes = Array.from({length: n}, (_, i) => ({
 *          method: methods[i % 5],
 *          pattern: '/api/v' + (i % 3) + '/resource_' + i + '/:id/sub/:subId',
 *          handler: 'handler_' + i
 *        }));
 *        return { routes, requestPath: '/api/v1/resource_' + Math.floor(n/2) + '/42/sub/99', requestMethod: 'GET' };
 *      }`
 *    - Expected complexity: O(n * P) where P = path segment count
 *
 * 3. requestBodyParser
 *    - entryFunction: "requestBodyParser"
 *    - inputGenerator: `function generateInput(n) {
 *        const fields = [];
 *        for (let i = 0; i < n; i++) {
 *          if (i % 3 === 0) fields.push('field_' + i + '=' + encodeURIComponent('value with spaces ' + i));
 *          else if (i % 3 === 1) fields.push('nested[obj][key_' + i + ']=' + i);
 *          else fields.push('arr[' + Math.floor(i/3) + ']=' + i);
 *        }
 *        return { rawBody: fields.join('&'), contentType: 'application/x-www-form-urlencoded' };
 *      }`
 *    - Expected complexity: O(n * L) where L = avg field length
 *
 * 4. responseCompressor
 *    - entryFunction: "responseCompressor"
 *    - inputGenerator: `function generateInput(n) {
 *        let data = '';
 *        for (let i = 0; i < n; i++) {
 *          const ch = String.fromCharCode(65 + (i % 26));
 *          const rep = Math.floor(Math.random() * 10) + 1;
 *          data += ch.repeat(rep);
 *        }
 *        return { data, threshold: 100 };
 *      }`
 *    - Expected complexity: O(n)
 *
 * 5. corsValidator
 *    - entryFunction: "corsValidator"
 *    - inputGenerator: `function generateInput(n) {
 *        const origins = Array.from({length: n}, (_, i) =>
 *          i % 4 === 0 ? 'https://app' + i + '.example.com' :
 *          i % 4 === 1 ? '*.subdomain' + i + '.com' :
 *          i % 4 === 2 ? 'https://trusted' + i + '.org' :
 *          'http://localhost:' + (3000 + i)
 *        );
 *        return {
 *          origin: 'https://app' + Math.floor(n/2) + '.example.com',
 *          allowedOrigins: origins,
 *          rules: { allowCredentials: true, maxAge: 86400, allowedMethods: ['GET','POST','PUT','DELETE'], allowedHeaders: ['Content-Type','Authorization','X-Request-ID'] }
 *        };
 *      }`
 *    - Expected complexity: O(n) where n = number of allowed origins
 */

/**
 * Executes a chain of middleware functions in order against a request object.
 * Each middleware can modify the request, add headers, validate, or short-circuit.
 * @param {Object} input - { middlewares, request }
 * @param {Array<Object>} input.middlewares - Array of middleware descriptors with name and transform type
 * @param {Object} input.request - The HTTP request object to process
 * @returns {Object} Processed request with middleware trace and timing
 * @complexity O(n) where n = number of middlewares
 */
export function middlewarePipeline(input) {
  const { middlewares, request } = input;
  const trace = [];
  let currentRequest = JSON.parse(JSON.stringify(request));
  let aborted = false;
  let abortReason = null;

  if (!currentRequest.headers) currentRequest.headers = {};
  if (!currentRequest.metadata) currentRequest.metadata = {};

  for (let i = 0; i < middlewares.length; i++) {
    if (aborted) break;

    const mw = middlewares[i];
    const startTime = Date.now();
    let action = 'pass';

    switch (mw.transform) {
      case 'addHeader':
        currentRequest.headers[mw.headerKey || ('X-MW-' + i)] = mw.headerValue || ('applied-' + i);
        action = 'header_added';
        break;

      case 'validate':
        if (!currentRequest.headers['Content-Type'] && currentRequest.method !== 'GET') {
          aborted = true;
          abortReason = 'Missing Content-Type header for ' + currentRequest.method + ' request';
          action = 'validation_failed';
        } else if (currentRequest.body && typeof currentRequest.body === 'object') {
          const bodyKeys = Object.keys(currentRequest.body);
          if (bodyKeys.length === 0 && currentRequest.method === 'POST') {
            aborted = true;
            abortReason = 'Empty body for POST request';
            action = 'validation_failed';
          } else {
            action = 'validation_passed';
          }
        } else {
          action = 'validation_passed';
        }
        break;

      case 'log':
        currentRequest.metadata['logged_at_' + i] = startTime;
        currentRequest.metadata['mw_sequence'] = (currentRequest.metadata['mw_sequence'] || 0) + 1;
        action = 'logged';
        break;

      case 'auth':
        if (!currentRequest.headers['Authorization']) {
          aborted = true;
          abortReason = 'Missing Authorization header';
          action = 'auth_failed';
        } else {
          currentRequest.metadata['authenticated'] = true;
          currentRequest.metadata['auth_method'] = currentRequest.headers['Authorization'].split(' ')[0] || 'unknown';
          action = 'auth_passed';
        }
        break;

      case 'rateLimit':
        const clientId = currentRequest.headers['X-Client-ID'] || 'anonymous';
        currentRequest.metadata['rate_limit_client'] = clientId;
        action = 'rate_limit_checked';
        break;

      default:
        currentRequest.metadata['custom_mw_' + i] = mw.name;
        action = 'custom';
        break;
    }

    trace.push({
      index: i,
      name: mw.name,
      transform: mw.transform,
      action,
      aborted: aborted
    });
  }

  const appliedCount = trace.filter(t => !t.aborted || t.action.includes('failed')).length;

  return {
    request: currentRequest,
    trace,
    totalMiddlewares: middlewares.length,
    appliedCount,
    aborted,
    abortReason,
    headerCount: Object.keys(currentRequest.headers).length,
    metadataKeys: Object.keys(currentRequest.metadata)
  };
}

/**
 * Matches a URL path and method against a list of route patterns with parameter extraction.
 * Supports :param style parameters and wildcard segments.
 * @param {Object} input - { routes, requestPath, requestMethod }
 * @param {Array<Object>} input.routes - Array of route definitions with method, pattern, handler
 * @param {string} input.requestPath - The incoming request path to match
 * @param {string} input.requestMethod - The HTTP method to match
 * @returns {Object} Matched route with extracted parameters or 404
 * @complexity O(n * P) where n = routes, P = path segments
 */
export function routeMatcher(input) {
  const { routes, requestPath, requestMethod } = input;
  const requestSegments = requestPath.split('/').filter(s => s.length > 0);
  const matches = [];

  for (let i = 0; i < routes.length; i++) {
    const route = routes[i];
    if (route.method !== requestMethod && route.method !== '*') continue;

    const patternSegments = route.pattern.split('/').filter(s => s.length > 0);

    let isWildcard = false;
    if (patternSegments.length > 0 && patternSegments[patternSegments.length - 1] === '*') {
      isWildcard = true;
      patternSegments.pop();
    }

    if (!isWildcard && patternSegments.length !== requestSegments.length) continue;
    if (isWildcard && requestSegments.length < patternSegments.length) continue;

    const params = {};
    let matched = true;
    let score = 0;

    for (let j = 0; j < patternSegments.length; j++) {
      const pSeg = patternSegments[j];
      const rSeg = requestSegments[j];

      if (pSeg.startsWith(':')) {
        const paramName = pSeg.slice(1);
        if (paramName.endsWith('?')) {
          params[paramName.slice(0, -1)] = rSeg || null;
        } else {
          params[paramName] = rSeg;
        }
        score += 1;
      } else if (pSeg === rSeg) {
        score += 2;
      } else {
        matched = false;
        break;
      }
    }

    if (matched) {
      if (isWildcard) {
        params['_wildcard'] = requestSegments.slice(patternSegments.length).join('/');
        score += 0.5;
      }

      matches.push({
        routeIndex: i,
        handler: route.handler,
        pattern: route.pattern,
        method: route.method,
        params,
        score,
        isExact: !isWildcard && Object.keys(params).length === 0
      });
    }
  }

  matches.sort((a, b) => b.score - a.score);

  if (matches.length === 0) {
    return {
      matched: false,
      statusCode: 404,
      message: 'No route found for ' + requestMethod + ' ' + requestPath,
      routesChecked: routes.length,
      candidateMatches: 0
    };
  }

  const best = matches[0];
  return {
    matched: true,
    statusCode: 200,
    handler: best.handler,
    pattern: best.pattern,
    params: best.params,
    isExact: best.isExact,
    score: best.score,
    routesChecked: routes.length,
    candidateMatches: matches.length,
    alternates: matches.slice(1, 5).map(m => ({ handler: m.handler, pattern: m.pattern, score: m.score }))
  };
}

/**
 * Parses URL-encoded form data and JSON bodies with support for nested objects
 * and arrays using bracket notation (e.g., nested[key]=val, arr[0]=val).
 * @param {Object} input - { rawBody, contentType }
 * @param {string} input.rawBody - The raw body string to parse
 * @param {string} input.contentType - Content type header value
 * @returns {Object} Parsed body with field statistics
 * @complexity O(n * L) where n = number of fields, L = avg field length
 */
export function requestBodyParser(input) {
  const { rawBody, contentType } = input;

  if (!rawBody || rawBody.trim().length === 0) {
    return { parsed: {}, fieldCount: 0, contentType, errors: [] };
  }

  const errors = [];

  if (contentType && contentType.includes('application/json')) {
    try {
      const parsed = JSON.parse(rawBody);
      const fieldCount = countFields(parsed);
      return { parsed, fieldCount, contentType, errors, format: 'json' };
    } catch (e) {
      errors.push('JSON parse error: ' + e.message);
      return { parsed: {}, fieldCount: 0, contentType, errors, format: 'json' };
    }
  }

  const result = {};
  const pairs = rawBody.split('&');
  let flatCount = 0;
  let nestedCount = 0;
  let arrayCount = 0;

  for (let i = 0; i < pairs.length; i++) {
    const eqIndex = pairs[i].indexOf('=');
    if (eqIndex === -1) {
      errors.push('Malformed pair at index ' + i + ': ' + pairs[i]);
      continue;
    }

    const rawKey = pairs[i].substring(0, eqIndex);
    const rawValue = pairs[i].substring(eqIndex + 1);
    let key, value;

    try {
      key = decodeURIComponent(rawKey.replace(/\+/g, ' '));
      value = decodeURIComponent(rawValue.replace(/\+/g, ' '));
    } catch (e) {
      key = rawKey;
      value = rawValue;
      errors.push('Decode error for key: ' + rawKey);
    }

    const bracketMatch = key.match(/^([^[]+)(.*)$/);
    if (bracketMatch && bracketMatch[2]) {
      const base = bracketMatch[1];
      const path = bracketMatch[2];
      const segments = [];
      const bracketRegex = /\[([^\]]*)\]/g;
      let m;
      while ((m = bracketRegex.exec(path)) !== null) {
        segments.push(m[1]);
      }

      let current = result;
      if (!result[base]) result[base] = {};
      current = result[base];

      for (let s = 0; s < segments.length - 1; s++) {
        const seg = segments[s];
        const nextSeg = segments[s + 1];
        const isNextArray = /^\d+$/.test(nextSeg) || nextSeg === '';
        if (!current[seg]) {
          current[seg] = isNextArray ? [] : {};
        }
        current = current[seg];
      }

      const lastSeg = segments[segments.length - 1];
      if (lastSeg === '') {
        if (!Array.isArray(current)) {
          result[base] = [value];
        } else {
          current.push(value);
        }
        arrayCount++;
      } else if (/^\d+$/.test(lastSeg)) {
        current[parseInt(lastSeg)] = value;
        arrayCount++;
      } else {
        current[lastSeg] = value;
        nestedCount++;
      }
    } else {
      result[key] = value;
      flatCount++;
    }
  }

  return {
    parsed: result,
    fieldCount: flatCount + nestedCount + arrayCount,
    flatFields: flatCount,
    nestedFields: nestedCount,
    arrayFields: arrayCount,
    contentType,
    errors,
    format: 'urlencoded'
  };
}

function countFields(obj) {
  if (obj === null || typeof obj !== 'object') return 1;
  let count = 0;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      count += countFields(obj[key]);
    }
  }
  return count;
}

/**
 * Simulates response compression using run-length encoding.
 * Only compresses if the data exceeds the threshold size.
 * @param {Object} input - { data, threshold }
 * @param {string} input.data - The response data string to compress
 * @param {number} input.threshold - Minimum size in chars to trigger compression
 * @returns {Object} Compression result with ratio and statistics
 * @complexity O(n) where n = length of data string
 */
export function responseCompressor(input) {
  const { data, threshold } = input;

  if (!data || typeof data !== 'string') {
    return { compressed: '', originalSize: 0, compressedSize: 0, ratio: 1, applied: false, reason: 'empty_input' };
  }

  const originalSize = data.length;

  if (originalSize < threshold) {
    return {
      compressed: data,
      originalSize,
      compressedSize: originalSize,
      ratio: 1,
      applied: false,
      reason: 'below_threshold',
      threshold
    };
  }

  let compressed = '';
  let i = 0;
  let runs = 0;
  let maxRun = 0;
  let uniqueChars = new Set();

  while (i < data.length) {
    const ch = data[i];
    uniqueChars.add(ch);
    let count = 1;

    while (i + count < data.length && data[i + count] === ch) {
      count++;
    }

    if (count > 1) {
      compressed += count + ch;
      if (count > maxRun) maxRun = count;
    } else {
      compressed += ch;
    }
    runs++;
    i += count;
  }

  const compressedSize = compressed.length;
  const ratio = originalSize > 0 ? +(compressedSize / originalSize).toFixed(4) : 1;
  const savings = originalSize - compressedSize;

  return {
    compressed,
    originalSize,
    compressedSize,
    ratio,
    savings,
    savingsPercent: +((1 - ratio) * 100).toFixed(2),
    applied: true,
    runs,
    maxRunLength: maxRun,
    uniqueChars: uniqueChars.size,
    effective: compressedSize < originalSize
  };
}

/**
 * Validates a request origin against allowed origins with support for
 * wildcard patterns, regex-like matching, and returns appropriate CORS headers.
 * @param {Object} input - { origin, allowedOrigins, rules }
 * @param {string} input.origin - The request Origin header value
 * @param {Array<string>} input.allowedOrigins - List of allowed origins (supports * wildcards)
 * @param {Object} input.rules - CORS rules including methods, headers, credentials, maxAge
 * @returns {Object} CORS validation result with response headers
 * @complexity O(n) where n = number of allowed origins
 */
export function corsValidator(input) {
  const { origin, allowedOrigins, rules } = input;

  if (!origin) {
    return {
      allowed: false,
      reason: 'no_origin_header',
      headers: {}
    };
  }

  let matched = false;
  let matchedPattern = null;
  let matchType = null;
  let patternsChecked = 0;

  for (let i = 0; i < allowedOrigins.length; i++) {
    patternsChecked++;
    const pattern = allowedOrigins[i];

    if (pattern === '*') {
      matched = true;
      matchedPattern = '*';
      matchType = 'wildcard_all';
      break;
    }

    if (pattern === origin) {
      matched = true;
      matchedPattern = pattern;
      matchType = 'exact';
      break;
    }

    if (pattern.includes('*')) {
      const regexStr = pattern
        .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
        .replace(/\*/g, '.*');
      try {
        const regex = new RegExp('^' + regexStr + '$');
        if (regex.test(origin)) {
          matched = true;
          matchedPattern = pattern;
          matchType = 'wildcard_pattern';
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (pattern.startsWith('.')) {
      if (origin.endsWith(pattern) || origin.includes('://' + pattern.slice(1))) {
        matched = true;
        matchedPattern = pattern;
        matchType = 'suffix';
        break;
      }
    }
  }

  const headers = {};

  if (matched) {
    headers['Access-Control-Allow-Origin'] = matchType === 'wildcard_all' && rules.allowCredentials ? origin : (matchType === 'wildcard_all' ? '*' : origin);
    headers['Vary'] = 'Origin';

    if (rules.allowCredentials && matchType !== 'wildcard_all') {
      headers['Access-Control-Allow-Credentials'] = 'true';
    } else if (rules.allowCredentials && matchType === 'wildcard_all') {
      headers['Access-Control-Allow-Credentials'] = 'true';
      headers['Access-Control-Allow-Origin'] = origin;
    }

    if (rules.allowedMethods && rules.allowedMethods.length > 0) {
      headers['Access-Control-Allow-Methods'] = rules.allowedMethods.join(', ');
    }

    if (rules.allowedHeaders && rules.allowedHeaders.length > 0) {
      headers['Access-Control-Allow-Headers'] = rules.allowedHeaders.join(', ');
    }

    if (rules.maxAge) {
      headers['Access-Control-Max-Age'] = String(rules.maxAge);
    }
  }

  return {
    allowed: matched,
    origin,
    matchedPattern,
    matchType,
    patternsChecked,
    totalPatterns: allowedOrigins.length,
    headers,
    headerCount: Object.keys(headers).length,
    credentialsAllowed: matched && !!rules.allowCredentials
  };
}
