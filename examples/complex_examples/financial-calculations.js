/**
 * Financial & Business Logic Patterns
 * =====================================
 * Functions for invoicing, risk analysis, fraud detection, amortization,
 * and revenue forecasting. Common in fintech, SaaS billing, and analytics.
 *
 * How to test with algorate MCP tool:
 *
 * 1. calculateInvoiceTotals
 *    - entryFunction: "calculateInvoiceTotals"
 *    - inputGenerator: `function generateInput(n) {
 *        return {
 *          lineItems: Array.from({length: n}, (_, i) => ({
 *            id: i, description: 'Item ' + i, quantity: 1 + Math.floor(Math.random()*10),
 *            unitPrice: +(Math.random() * 500).toFixed(2),
 *            taxCategory: ['standard','reduced','exempt'][i % 3]
 *          })),
 *          taxRules: { standard: 0.20, reduced: 0.05, exempt: 0 },
 *          discounts: [
 *            { type: 'percentage', value: 10, minSubtotal: 100 },
 *            { type: 'fixed', value: 5, code: 'SAVE5' }
 *          ]
 *        };
 *      }`
 *    - Expected complexity: O(n) where n = line items
 *
 * 2. portfolioRiskAnalysis
 *    - entryFunction: "portfolioRiskAnalysis"
 *    - inputGenerator: `function generateInput(n) {
 *        const symbols = ['AAPL','GOOG','MSFT','AMZN','TSLA','META','NVDA','JPM'];
 *        const holdings = symbols.slice(0, Math.min(8, Math.max(2, Math.floor(n/10)))).map((s, i) => ({
 *          symbol: s, shares: 10 + Math.floor(Math.random()*100), avgCost: 50 + Math.random()*200
 *        }));
 *        const priceHistory = {};
 *        holdings.forEach(h => {
 *          priceHistory[h.symbol] = Array.from({length: n}, (_, i) => h.avgCost * (0.8 + Math.random() * 0.4));
 *        });
 *        return { holdings, priceHistory };
 *      }`
 *    - Expected complexity: O(h * n) where h = holdings, n = price history length
 *
 * 3. detectFraudulentTransactions
 *    - entryFunction: "detectFraudulentTransactions"
 *    - inputGenerator: `function generateInput(n) {
 *        const now = Date.now();
 *        return Array.from({length: n}, (_, i) => ({
 *          id: 'tx_' + i, userId: 'user_' + Math.floor(Math.random() * Math.max(1, n/20)),
 *          amount: Math.random() > 0.95 ? 5000 + Math.random()*10000 : 10 + Math.random()*200,
 *          timestamp: now - Math.floor(Math.random() * 86400000),
 *          merchantCategory: ['retail','food','travel','online','atm'][Math.floor(Math.random()*5)],
 *          location: ['US','UK','NG','RU','BR','JP'][Math.floor(Math.random()*6)],
 *          cardPresent: Math.random() > 0.3
 *        }));
 *      }`
 *    - Expected complexity: O(n) with hash-based grouping
 *
 * 4. generateAmortizationSchedule
 *    - entryFunction: "generateAmortizationSchedule"
 *    - inputGenerator: `function generateInput(n) {
 *        return { principal: 100000 + n * 1000, rate: 0.05 + Math.random() * 0.05, months: n };
 *      }`
 *    - Expected complexity: O(n) where n = number of months
 *
 * 5. forecastRevenue
 *    - entryFunction: "forecastRevenue"
 *    - inputGenerator: `function generateInput(n) {
 *        const base = 10000;
 *        return {
 *          historicalData: Array.from({length: n}, (_, i) => ({
 *            month: '2024-' + String(i % 12 + 1).padStart(2, '0'),
 *            revenue: base + i * 500 + (Math.random() - 0.5) * 2000
 *          })),
 *          forecastMonths: 6
 *        };
 *      }`
 *    - Expected complexity: O(n) for moving average calculation
 */

/**
 * Calculates invoice totals with line-item taxes, category-based tax rules,
 * and conditional discounts.
 * @param {Object} input - { lineItems, taxRules, discounts }
 * @returns {Object} Detailed invoice breakdown
 * Complexity: O(n) where n = number of line items
 */
export function calculateInvoiceTotals(input) {
  const { lineItems, taxRules, discounts } = input;
  let subtotal = 0;
  let totalTax = 0;
  const itemizedLines = [];

  for (let i = 0; i < lineItems.length; i++) {
    const item = lineItems[i];
    const lineTotal = +(item.quantity * item.unitPrice).toFixed(2);
    const taxRate = taxRules[item.taxCategory] || 0;
    const lineTax = +(lineTotal * taxRate).toFixed(2);

    subtotal += lineTotal;
    totalTax += lineTax;

    itemizedLines.push({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal,
      taxCategory: item.taxCategory,
      taxRate,
      taxAmount: lineTax,
      totalWithTax: +(lineTotal + lineTax).toFixed(2)
    });
  }

  subtotal = +subtotal.toFixed(2);
  totalTax = +totalTax.toFixed(2);

  let totalDiscount = 0;
  const appliedDiscounts = [];

  if (discounts) {
    for (let i = 0; i < discounts.length; i++) {
      const d = discounts[i];
      if (d.type === 'percentage') {
        if (!d.minSubtotal || subtotal >= d.minSubtotal) {
          const amount = +(subtotal * d.value / 100).toFixed(2);
          totalDiscount += amount;
          appliedDiscounts.push({ ...d, amount });
        }
      } else if (d.type === 'fixed') {
        totalDiscount += d.value;
        appliedDiscounts.push({ ...d, amount: d.value });
      }
    }
  }

  totalDiscount = +totalDiscount.toFixed(2);
  const grandTotal = +(subtotal + totalTax - totalDiscount).toFixed(2);

  return {
    lineItems: itemizedLines,
    subtotal,
    totalTax,
    totalDiscount,
    appliedDiscounts,
    grandTotal,
    itemCount: lineItems.length,
    averageItemValue: lineItems.length > 0 ? +(subtotal / lineItems.length).toFixed(2) : 0
  };
}

/**
 * Calculates portfolio risk metrics: daily returns, volatility, Sharpe ratio,
 * max drawdown, and per-holding analysis.
 * @param {Object} input - { holdings, priceHistory }
 * @returns {Object} Risk analysis results
 * Complexity: O(h * n) where h = number of holdings, n = price history length
 */
export function portfolioRiskAnalysis(input) {
  const { holdings, priceHistory } = input;
  const riskFreeRate = 0.04 / 252;
  const holdingAnalysis = [];
  let totalValue = 0;

  for (let h = 0; h < holdings.length; h++) {
    const holding = holdings[h];
    const prices = priceHistory[holding.symbol] || [];
    if (prices.length < 2) continue;

    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }

    const avgReturn = returns.reduce((s, r) => s + r, 0) / returns.length;
    const variance = returns.reduce((s, r) => s + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance);
    const annualizedVol = volatility * Math.sqrt(252);

    const currentPrice = prices[prices.length - 1];
    const holdingValue = holding.shares * currentPrice;
    const costBasis = holding.shares * holding.avgCost;
    const pnl = holdingValue - costBasis;

    let maxPrice = prices[0];
    let maxDrawdown = 0;
    for (let i = 1; i < prices.length; i++) {
      if (prices[i] > maxPrice) maxPrice = prices[i];
      const drawdown = (maxPrice - prices[i]) / maxPrice;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }

    totalValue += holdingValue;
    holdingAnalysis.push({
      symbol: holding.symbol,
      shares: holding.shares,
      currentPrice: +currentPrice.toFixed(2),
      marketValue: +holdingValue.toFixed(2),
      costBasis: +costBasis.toFixed(2),
      pnl: +pnl.toFixed(2),
      pnlPercent: +((pnl / costBasis) * 100).toFixed(2),
      dailyVolatility: +volatility.toFixed(6),
      annualizedVolatility: +annualizedVol.toFixed(4),
      maxDrawdown: +(maxDrawdown * 100).toFixed(2),
      sharpeRatio: volatility > 0 ? +((avgReturn - riskFreeRate) / volatility).toFixed(4) : 0
    });
  }

  const weights = holdingAnalysis.map(h => h.marketValue / totalValue);
  const portfolioVol = Math.sqrt(
    holdingAnalysis.reduce((s, h, i) => s + Math.pow(weights[i] * h.annualizedVolatility, 2), 0)
  );

  return {
    totalValue: +totalValue.toFixed(2),
    holdingCount: holdings.length,
    holdings: holdingAnalysis,
    portfolioVolatility: +portfolioVol.toFixed(4),
    diversificationRatio: holdingAnalysis.length > 1 ?
      +(holdingAnalysis.reduce((s, h, i) => s + weights[i] * h.annualizedVolatility, 0) / portfolioVol).toFixed(4) : 1
  };
}

/**
 * Detects potentially fraudulent transactions using heuristic pattern matching:
 * unusually large amounts, velocity checks, geographic anomalies.
 * @param {Array<Object>} transactions - Array of transaction objects
 * @returns {Object} Flagged transactions with risk scores
 * Complexity: O(n) with hash-based grouping
 */
export function detectFraudulentTransactions(transactions) {
  const userProfiles = {};

  for (let i = 0; i < transactions.length; i++) {
    const tx = transactions[i];
    if (!userProfiles[tx.userId]) {
      userProfiles[tx.userId] = { amounts: [], locations: new Set(), timestamps: [], count: 0 };
    }
    const profile = userProfiles[tx.userId];
    profile.amounts.push(tx.amount);
    profile.locations.add(tx.location);
    profile.timestamps.push(tx.timestamp);
    profile.count++;
  }

  for (const userId in userProfiles) {
    const p = userProfiles[userId];
    const sum = p.amounts.reduce((a, b) => a + b, 0);
    p.avgAmount = sum / p.amounts.length;
    p.stdAmount = Math.sqrt(p.amounts.reduce((s, a) => s + Math.pow(a - p.avgAmount, 2), 0) / p.amounts.length);
    p.timestamps.sort((a, b) => a - b);
  }

  const flagged = [];
  const clean = [];

  for (let i = 0; i < transactions.length; i++) {
    const tx = transactions[i];
    const profile = userProfiles[tx.userId];
    const flags = [];
    let riskScore = 0;

    if (profile.stdAmount > 0 && (tx.amount - profile.avgAmount) / profile.stdAmount > 2.5) {
      flags.push('unusual_amount');
      riskScore += 30;
    }

    if (tx.amount > 5000) {
      flags.push('high_value');
      riskScore += 20;
    }

    if (profile.locations.size > 3) {
      flags.push('multiple_locations');
      riskScore += 15;
    }

    const recentWindow = 3600000;
    const recentTxCount = profile.timestamps.filter(t => Math.abs(t - tx.timestamp) < recentWindow).length;
    if (recentTxCount > 10) {
      flags.push('high_velocity');
      riskScore += 25;
    }

    if (!tx.cardPresent && tx.amount > 1000) {
      flags.push('cnp_high_value');
      riskScore += 10;
    }

    if (flags.length > 0) {
      flagged.push({ ...tx, flags, riskScore: Math.min(100, riskScore) });
    } else {
      clean.push(tx);
    }
  }

  flagged.sort((a, b) => b.riskScore - a.riskScore);

  return {
    totalTransactions: transactions.length,
    flaggedCount: flagged.length,
    cleanCount: clean.length,
    flagRate: +(flagged.length / transactions.length * 100).toFixed(2),
    flagged: flagged.slice(0, 50),
    riskDistribution: {
      high: flagged.filter(f => f.riskScore >= 70).length,
      medium: flagged.filter(f => f.riskScore >= 40 && f.riskScore < 70).length,
      low: flagged.filter(f => f.riskScore < 40).length
    }
  };
}

/**
 * Generates a loan amortization schedule with monthly payment breakdown.
 * @param {Object} input - { principal, rate, months }
 * @returns {Object} Amortization schedule with summary
 * Complexity: O(n) where n = number of months
 */
export function generateAmortizationSchedule(input) {
  const { principal, rate, months } = input;
  const monthlyRate = rate / 12;
  const payment = monthlyRate > 0
    ? principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1)
    : principal / months;

  const schedule = [];
  let balance = principal;
  let totalInterest = 0;
  let totalPrincipalPaid = 0;

  for (let month = 1; month <= months; month++) {
    const interestPayment = +(balance * monthlyRate).toFixed(2);
    const principalPayment = +(Math.min(payment - interestPayment, balance)).toFixed(2);
    balance = +(balance - principalPayment).toFixed(2);
    if (balance < 0) balance = 0;

    totalInterest += interestPayment;
    totalPrincipalPaid += principalPayment;

    schedule.push({
      month,
      payment: +(interestPayment + principalPayment).toFixed(2),
      principal: principalPayment,
      interest: interestPayment,
      balance,
      cumulativeInterest: +totalInterest.toFixed(2),
      equityPercent: +((totalPrincipalPaid / principal) * 100).toFixed(2)
    });
  }

  return {
    loanAmount: principal,
    annualRate: rate,
    termMonths: months,
    monthlyPayment: +payment.toFixed(2),
    totalInterest: +totalInterest.toFixed(2),
    totalCost: +(principal + totalInterest).toFixed(2),
    interestToLoanRatio: +(totalInterest / principal).toFixed(4),
    schedule
  };
}

/**
 * Forecasts revenue using simple and weighted moving averages.
 * @param {Object} input - { historicalData, forecastMonths }
 * @returns {Object} Forecast with confidence intervals
 * Complexity: O(n) where n = historical data points
 */
export function forecastRevenue(input) {
  const { historicalData, forecastMonths } = input;
  const revenues = historicalData.map(d => d.revenue);
  const windowSize = Math.min(6, Math.floor(revenues.length / 2));

  if (revenues.length < 3) {
    return { forecast: [], error: 'Insufficient historical data' };
  }

  const sma = [];
  for (let i = windowSize - 1; i < revenues.length; i++) {
    let sum = 0;
    for (let j = 0; j < windowSize; j++) sum += revenues[i - j];
    sma.push(sum / windowSize);
  }

  const trend = sma.length >= 2 ? (sma[sma.length - 1] - sma[0]) / (sma.length - 1) : 0;

  const residuals = [];
  for (let i = windowSize - 1; i < revenues.length; i++) {
    residuals.push(Math.abs(revenues[i] - sma[i - windowSize + 1]));
  }
  const avgError = residuals.reduce((a, b) => a + b, 0) / residuals.length;

  const forecast = [];
  const lastSMA = sma[sma.length - 1];

  for (let i = 1; i <= forecastMonths; i++) {
    const predicted = lastSMA + trend * i;
    const confidence = avgError * Math.sqrt(i);
    forecast.push({
      monthOffset: i,
      predicted: +predicted.toFixed(2),
      lower: +(predicted - 1.96 * confidence).toFixed(2),
      upper: +(predicted + 1.96 * confidence).toFixed(2),
      confidence: Math.max(0, +(100 - i * 5).toFixed(1))
    });
  }

  return {
    historicalMonths: revenues.length,
    trend: +trend.toFixed(2),
    trendDirection: trend > 0 ? 'growing' : trend < 0 ? 'declining' : 'flat',
    lastActual: revenues[revenues.length - 1],
    movingAverage: +lastSMA.toFixed(2),
    forecast
  };
}
