/**
 * Form Validation & Sanitization Patterns
 * ==========================================
 * Functions for validating complex form data, sanitizing user input,
 * credit card validation, password strength, and cross-field dependencies.
 * Common in any web application with user-facing forms.
 *
 * How to test with algorate MCP tool:
 *
 * 1. validateFormData
 *    - entryFunction: "validateFormData"
 *    - inputGenerator: `function generateInput(n) {
 *        const schema = {
 *          name: { type: 'string', required: true, minLength: 2, maxLength: 50 },
 *          email: { type: 'string', required: true, pattern: '^[^@]+@[^@]+\\\\.[^@]+$' },
 *          age: { type: 'number', min: 0, max: 150 },
 *          address: { type: 'object', properties: {
 *            street: { type: 'string', required: true },
 *            city: { type: 'string', required: true },
 *            zip: { type: 'string', pattern: '^\\\\d{5}$' }
 *          }},
 *          tags: { type: 'array', minItems: 1, maxItems: 10 }
 *        };
 *        const fields = Object.keys(schema);
 *        const data = {};
 *        for (let i = 0; i < Math.min(n, fields.length); i++) {
 *          const f = fields[i];
 *          if (f === 'name') data[f] = Math.random() > 0.1 ? 'User ' + i : '';
 *          else if (f === 'email') data[f] = Math.random() > 0.2 ? 'u'+i+'@test.com' : 'invalid';
 *          else if (f === 'age') data[f] = Math.random() > 0.1 ? 25 : -1;
 *          else if (f === 'address') data[f] = { street: '123 Main', city: 'NYC', zip: Math.random() > 0.3 ? '10001' : 'bad' };
 *          else if (f === 'tags') data[f] = Array.from({length: Math.floor(Math.random()*3)}, () => 'tag');
 *        }
 *        return { schema, data };
 *      }`
 *    - Expected complexity: O(f * d) where f = fields, d = depth
 *
 * 2. sanitizeUserInput
 *    - entryFunction: "sanitizeUserInput"
 *    - inputGenerator: `function generateInput(n) {
 *        const inputs = [];
 *        for (let i = 0; i < n; i++) {
 *          const r = Math.random();
 *          if (r < 0.2) inputs.push('<script>alert("xss")</script>Hello ' + i);
 *          else if (r < 0.4) inputs.push('  lots   of   spaces  ' + i + '  ');
 *          else if (r < 0.6) inputs.push('Hello & World <b>bold</b> ' + i);
 *          else if (r < 0.8) inputs.push('normal input ' + i);
 *          else inputs.push('SELECT * FROM users; DROP TABLE users;--' + i);
 *        }
 *        return { inputs, rules: { trim: true, stripHtml: true, escapeHtml: true, maxLength: 100 } };
 *      }`
 *    - Expected complexity: O(n * L) where L = avg input length
 *
 * 3. validateCreditCard
 *    - entryFunction: "validateCreditCard"
 *    - inputGenerator: `function generateInput(n) {
 *        const cards = [];
 *        for (let i = 0; i < n; i++) {
 *          let num = '';
 *          const r = Math.random();
 *          if (r < 0.25) { num = '4'; for(let j=0;j<15;j++) num += Math.floor(Math.random()*10); }
 *          else if (r < 0.5) { num = '5' + (1+Math.floor(Math.random()*5)); for(let j=0;j<14;j++) num += Math.floor(Math.random()*10); }
 *          else if (r < 0.75) { num = '3' + (Math.random()>0.5?'4':'7'); for(let j=0;j<13;j++) num += Math.floor(Math.random()*10); }
 *          else { for(let j=0;j<16;j++) num += Math.floor(Math.random()*10); }
 *          cards.push(num);
 *        }
 *        return cards;
 *      }`
 *    - Expected complexity: O(n * d) where d = digits per card
 *
 * 4. validatePasswordStrength
 *    - entryFunction: "validatePasswordStrength"
 *    - inputGenerator: `function generateInput(n) {
 *        const passwords = [];
 *        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
 *        for (let i = 0; i < n; i++) {
 *          const len = 4 + Math.floor(Math.random() * 20);
 *          let pw = '';
 *          for (let j = 0; j < len; j++) pw += chars[Math.floor(Math.random() * chars.length)];
 *          passwords.push(pw);
 *        }
 *        return passwords;
 *      }`
 *    - Expected complexity: O(n * L) where L = avg password length
 *
 * 5. crossFieldValidation
 *    - entryFunction: "crossFieldValidation"
 *    - inputGenerator: `function generateInput(n) {
 *        const forms = [];
 *        for (let i = 0; i < n; i++) {
 *          forms.push({
 *            password: 'Pass' + i + '!',
 *            confirmPassword: Math.random() > 0.3 ? 'Pass' + i + '!' : 'Wrong',
 *            startDate: '2024-01-' + String(1+i%28).padStart(2,'0'),
 *            endDate: Math.random() > 0.2 ? '2024-02-' + String(1+i%28).padStart(2,'0') : '2023-12-01',
 *            minPrice: Math.floor(Math.random()*100),
 *            maxPrice: Math.random() > 0.2 ? 100 + Math.floor(Math.random()*100) : Math.floor(Math.random()*50),
 *            country: ['US','CA','UK','AU'][i%4],
 *            state: i % 4 === 0 ? 'CA' : ''
 *          });
 *        }
 *        const rules = [
 *          { type: 'match', fields: ['password', 'confirmPassword'], message: 'Passwords must match' },
 *          { type: 'dateOrder', startField: 'startDate', endField: 'endDate', message: 'End date must be after start' },
 *          { type: 'rangeOrder', minField: 'minPrice', maxField: 'maxPrice', message: 'Max must exceed min' },
 *          { type: 'requiredIf', field: 'state', condition: { field: 'country', value: 'US' }, message: 'State required for US' }
 *        ];
 *        return { forms, rules };
 *      }`
 *    - Expected complexity: O(n * r) where r = number of rules
 */

/**
 * Schema-based form validation supporting nested objects, arrays,
 * type checking, pattern matching, and min/max constraints.
 * @param {Object} input - { schema, data }
 * @returns {Object} Validation result with errors per field
 * Complexity: O(f * d) where f = fields, d = max depth
 */
export function validateFormData(input) {
  const { schema, data } = input;
  const errors = {};

  function validate(schemaNode, value, path) {
    if (schemaNode.required && (value === undefined || value === null || value === '')) {
      if (!errors[path]) errors[path] = [];
      errors[path].push('Field is required');
      return;
    }

    if (value === undefined || value === null) return;

    if (schemaNode.type === 'string') {
      if (typeof value !== 'string') {
        if (!errors[path]) errors[path] = [];
        errors[path].push('Expected string');
        return;
      }
      if (schemaNode.minLength && value.length < schemaNode.minLength) {
        if (!errors[path]) errors[path] = [];
        errors[path].push('Minimum length is ' + schemaNode.minLength);
      }
      if (schemaNode.maxLength && value.length > schemaNode.maxLength) {
        if (!errors[path]) errors[path] = [];
        errors[path].push('Maximum length is ' + schemaNode.maxLength);
      }
      if (schemaNode.pattern) {
        try {
          if (!new RegExp(schemaNode.pattern).test(value)) {
            if (!errors[path]) errors[path] = [];
            errors[path].push('Does not match pattern');
          }
        } catch (e) {}
      }
    } else if (schemaNode.type === 'number') {
      if (typeof value !== 'number' || isNaN(value)) {
        if (!errors[path]) errors[path] = [];
        errors[path].push('Expected number');
        return;
      }
      if (schemaNode.min !== undefined && value < schemaNode.min) {
        if (!errors[path]) errors[path] = [];
        errors[path].push('Minimum value is ' + schemaNode.min);
      }
      if (schemaNode.max !== undefined && value > schemaNode.max) {
        if (!errors[path]) errors[path] = [];
        errors[path].push('Maximum value is ' + schemaNode.max);
      }
    } else if (schemaNode.type === 'object') {
      if (typeof value !== 'object' || Array.isArray(value)) {
        if (!errors[path]) errors[path] = [];
        errors[path].push('Expected object');
        return;
      }
      if (schemaNode.properties) {
        for (const key in schemaNode.properties) {
          validate(schemaNode.properties[key], value[key], path ? path + '.' + key : key);
        }
      }
    } else if (schemaNode.type === 'array') {
      if (!Array.isArray(value)) {
        if (!errors[path]) errors[path] = [];
        errors[path].push('Expected array');
        return;
      }
      if (schemaNode.minItems && value.length < schemaNode.minItems) {
        if (!errors[path]) errors[path] = [];
        errors[path].push('Minimum ' + schemaNode.minItems + ' items required');
      }
      if (schemaNode.maxItems && value.length > schemaNode.maxItems) {
        if (!errors[path]) errors[path] = [];
        errors[path].push('Maximum ' + schemaNode.maxItems + ' items allowed');
      }
    }
  }

  for (const field in schema) {
    validate(schema[field], data[field], field);
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    errorCount: Object.values(errors).reduce((s, e) => s + e.length, 0),
    fieldsChecked: Object.keys(schema).length
  };
}

/**
 * Sanitizes an array of user inputs: strips HTML, escapes special chars,
 * trims whitespace, and enforces max length.
 * @param {Object} input - { inputs, rules }
 * @returns {Array<Object>} Sanitized inputs with change flags
 * Complexity: O(n * L) where L = avg input length
 */
export function sanitizeUserInput(input) {
  const { inputs, rules } = input;
  const results = [];

  for (let i = 0; i < inputs.length; i++) {
    let value = inputs[i];
    const original = value;
    const changes = [];

    if (typeof value !== 'string') {
      results.push({ original, sanitized: String(value), changes: ['type_coerced'] });
      continue;
    }

    if (rules.trim) {
      const trimmed = value.replace(/\s+/g, ' ').trim();
      if (trimmed !== value) changes.push('trimmed');
      value = trimmed;
    }

    if (rules.stripHtml) {
      const stripped = value.replace(/<[^>]*>/g, '');
      if (stripped !== value) changes.push('html_stripped');
      value = stripped;
    }

    if (rules.escapeHtml) {
      const escaped = value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
      if (escaped !== value) changes.push('html_escaped');
      value = escaped;
    }

    if (rules.maxLength && value.length > rules.maxLength) {
      value = value.slice(0, rules.maxLength);
      changes.push('truncated');
    }

    results.push({
      original,
      sanitized: value,
      changed: changes.length > 0,
      changes
    });
  }

  return results;
}

/**
 * Validates credit card numbers using the Luhn algorithm and detects card type.
 * @param {Array<string>} cards - Array of card number strings
 * @returns {Array<Object>} Validation results with card type
 * Complexity: O(n * d) where d = digits per card
 */
export function validateCreditCard(cards) {
  function luhn(num) {
    const digits = num.replace(/\D/g, '');
    if (digits.length < 13 || digits.length > 19) return false;

    let sum = 0;
    let alternate = false;

    for (let i = digits.length - 1; i >= 0; i--) {
      let n = parseInt(digits[i], 10);
      if (alternate) {
        n *= 2;
        if (n > 9) n -= 9;
      }
      sum += n;
      alternate = !alternate;
    }

    return sum % 10 === 0;
  }

  function detectType(num) {
    const d = num.replace(/\D/g, '');
    if (/^4/.test(d)) return 'visa';
    if (/^5[1-5]/.test(d)) return 'mastercard';
    if (/^3[47]/.test(d)) return 'amex';
    if (/^6(?:011|5)/.test(d)) return 'discover';
    if (/^35(?:2[89]|[3-8])/.test(d)) return 'jcb';
    if (/^3(?:0[0-5]|[68])/.test(d)) return 'diners';
    return 'unknown';
  }

  return cards.map(card => {
    const cleaned = card.replace(/[\s-]/g, '');
    const valid = luhn(cleaned);
    const type = detectType(cleaned);

    return {
      input: card,
      cleaned,
      valid,
      type,
      length: cleaned.length,
      lastFour: cleaned.slice(-4)
    };
  });
}

/**
 * Scores password strength on multiple criteria: length, character variety,
 * common patterns, and entropy estimation.
 * @param {Array<string>} passwords - Array of passwords to evaluate
 * @returns {Array<Object>} Strength assessments with scores
 * Complexity: O(n * L) where L = avg password length
 */
export function validatePasswordStrength(passwords) {
  const commonPatterns = ['password', '123456', 'qwerty', 'abc123', 'letmein', 'admin', 'welcome'];

  return passwords.map(pw => {
    let score = 0;
    const feedback = [];

    if (pw.length >= 8) score += 20;
    else feedback.push('Use at least 8 characters');

    if (pw.length >= 12) score += 10;
    if (pw.length >= 16) score += 10;

    if (/[a-z]/.test(pw)) score += 10;
    else feedback.push('Add lowercase letters');

    if (/[A-Z]/.test(pw)) score += 10;
    else feedback.push('Add uppercase letters');

    if (/[0-9]/.test(pw)) score += 10;
    else feedback.push('Add numbers');

    if (/[^a-zA-Z0-9]/.test(pw)) score += 15;
    else feedback.push('Add special characters');

    const uniqueChars = new Set(pw).size;
    if (uniqueChars / pw.length > 0.7) score += 10;
    else if (uniqueChars / pw.length < 0.3) feedback.push('Too many repeated characters');

    const lower = pw.toLowerCase();
    for (const pattern of commonPatterns) {
      if (lower.includes(pattern)) {
        score -= 20;
        feedback.push('Contains common pattern: ' + pattern);
        break;
      }
    }

    if (/(.)\1{2,}/.test(pw)) {
      score -= 10;
      feedback.push('Avoid repeating characters');
    }

    const charsetSize = (/[a-z]/.test(pw) ? 26 : 0) + (/[A-Z]/.test(pw) ? 26 : 0) +
      (/[0-9]/.test(pw) ? 10 : 0) + (/[^a-zA-Z0-9]/.test(pw) ? 32 : 0);
    const entropy = pw.length * Math.log2(charsetSize || 1);

    score = Math.max(0, Math.min(100, score));

    let strength;
    if (score >= 80) strength = 'strong';
    else if (score >= 60) strength = 'good';
    else if (score >= 40) strength = 'fair';
    else if (score >= 20) strength = 'weak';
    else strength = 'very_weak';

    return {
      password: pw.slice(0, 2) + '*'.repeat(Math.max(0, pw.length - 2)),
      score,
      strength,
      entropy: +entropy.toFixed(2),
      length: pw.length,
      feedback
    };
  });
}

/**
 * Validates cross-field dependencies: matching fields, date ordering,
 * range validation, and conditional required fields.
 * @param {Object} input - { forms, rules }
 * @returns {Array<Object>} Validation results per form
 * Complexity: O(n * r) where n = forms, r = rules
 */
export function crossFieldValidation(input) {
  const { forms, rules } = input;

  return forms.map((form, idx) => {
    const errors = [];

    for (let r = 0; r < rules.length; r++) {
      const rule = rules[r];

      switch (rule.type) {
        case 'match':
          if (form[rule.fields[0]] !== form[rule.fields[1]]) {
            errors.push({ rule: rule.type, message: rule.message, fields: rule.fields });
          }
          break;

        case 'dateOrder': {
          const start = new Date(form[rule.startField]);
          const end = new Date(form[rule.endField]);
          if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end <= start) {
            errors.push({ rule: rule.type, message: rule.message, fields: [rule.startField, rule.endField] });
          }
          break;
        }

        case 'rangeOrder':
          if (typeof form[rule.minField] === 'number' && typeof form[rule.maxField] === 'number' && form[rule.maxField] <= form[rule.minField]) {
            errors.push({ rule: rule.type, message: rule.message, fields: [rule.minField, rule.maxField] });
          }
          break;

        case 'requiredIf':
          if (form[rule.condition.field] === rule.condition.value && !form[rule.field]) {
            errors.push({ rule: rule.type, message: rule.message, fields: [rule.field, rule.condition.field] });
          }
          break;
      }
    }

    return {
      formIndex: idx,
      valid: errors.length === 0,
      errors
    };
  });
}
