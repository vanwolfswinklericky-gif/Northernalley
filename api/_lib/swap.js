// api/lib/swap.js

/**
 * 1inch Swap API client for Base mainnet.
 * Production-grade with retry logic, caching, and fallback token resolution.
 */

const ONEINCH_SWAP_API = 'https://api.1inch.dev/swap/v6.1';
const ONEINCH_TOKEN_API = 'https://api.1inch.dev/token/v1.7';
const CHAIN_ID = 8453; // Base mainnet
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 500;

// Static fallback tokens for critical assets — verified Base mainnet addresses
const STATIC_TOKENS = Object.freeze({
  USDC: { address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimals: 6 },
  WETH: { address: '0x4200000000000000000000000000000000000006', decimals: 18 },
  ETH: { address: '0x4200000000000000000000000000000000000006', decimals: 18 },
});

let tokenCache = null;
let cacheTimestamp = 0;
let tokenListPromise = null;

/**
 * Structured logger for production observability.
 */
function log(level, message, context = {}) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    service: 'swap',
    message,
    ...context,
  };
  if (level === 'error') console.error(JSON.stringify(entry));
  else if (level === 'warn') console.warn(JSON.stringify(entry));
  else console.log(JSON.stringify(entry));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch with retry and exponential backoff.
 * Handles 429 (rate limit) and 5xx (server error) with retries.
 */
async function fetchWithRetry(url, options, context = {}) {
  let lastError;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, options);

      if (response.status === 429 || response.status >= 500) {
        const retryAfter = response.headers.get('retry-after');
        const delay = retryAfter
          ? parseInt(retryAfter, 10) * 1000
          : RETRY_BASE_DELAY_MS * Math.pow(2, attempt);

        log('warn', 'Retryable error from 1inch', {
          ...context,
          status: response.status,
          attempt,
          delayMs: delay,
        });

        if (attempt < MAX_RETRIES) {
          await sleep(delay);
          continue;
        }
      }

      return response;
    } catch (error) {
      lastError = error;
      log('warn', 'Network error calling 1inch', {
        ...context,
        attempt,
        error: error.message,
      });

      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_BASE_DELAY_MS * Math.pow(2, attempt));
      }
    }
  }

  throw lastError || new Error('1inch request failed after retries');
}

/**
 * Fetch the full token list from 1inch and build a symbol -> token map.
 * Cached for 1 hour. Concurrent calls share the same promise.
 */
async function loadTokenList() {
  const now = Date.now();

  if (tokenCache && now - cacheTimestamp < CACHE_TTL_MS) {
    return tokenCache;
  }

  if (tokenListPromise) {
    return tokenListPromise;
  }

  tokenListPromise = (async () => {
    const apiKey = process.env.ONEINCH_API_KEY;
    if (!apiKey) {
      log('warn', 'ONEINCH_API_KEY missing — using static fallback');
      return buildStaticMap();
    }

    try {
      const response = await fetchWithRetry(
        `${ONEINCH_TOKEN_API}/${CHAIN_ID}/tokens`,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Accept': 'application/json',
          },
        },
        { operation: 'loadTokenList' }
      );

      if (!response.ok) {
        throw new Error(`Token list fetch failed: ${response.status}`);
      }

      const data = await response.json();
      const map = buildTokenMap(data);

      tokenCache = map;
      cacheTimestamp = Date.now();

      log('info', 'Token list loaded from 1inch', {
        tokenCount: Object.keys(map).length,
      });

      return map;
    } catch (error) {
      log('error', 'Token list load failed — using static fallback', {
        error: error.message,
      });
      return buildStaticMap();
    } finally {
      tokenListPromise = null;
    }
  })();

  return tokenListPromise;
}

/**
 * Build a symbol -> token map from the raw 1inch token list.
 * Prefers non-bridged tokens when duplicates exist.
 */
function buildTokenMap(data) {
  const map = {};

  for (const [address, token] of Object.entries(data)) {
    if (!token.symbol) continue;

    const symbol = token.symbol.toUpperCase();
    const isBridged = token.name?.toLowerCase().includes('bridged');
    const existing = map[symbol];

    if (!existing || (existing.bridged && !isBridged)) {
      map[symbol] = {
        address,
        decimals: token.decimals ?? 18,
        name: token.name,
        bridged: isBridged,
      };
    }
  }

  return map;
}

function buildStaticMap() {
  const map = {};
  for (const [symbol, token] of Object.entries(STATIC_TOKENS)) {
    map[symbol] = { ...token, name: symbol, bridged: false };
  }
  return map;
}

/**
 * Resolve a token symbol to its contract address and decimals.
 * Throws if the symbol is not found.
 */
export async function resolveToken(symbol) {
  const map = await loadTokenList();
  const upper = symbol.toUpperCase();
  const token = map[upper];

  if (!token) {
    throw new Error(`Token not found on Base: ${symbol}`);
  }

  return token;
}

/**
 * Get a swap quote from 1inch.
 */
export async function getSwapQuote(fromToken, toToken, amount, walletAddress) {
  const apiKey = process.env.ONEINCH_API_KEY;

  const params = new URLSearchParams({
    src: fromToken,
    dst: toToken,
    amount: amount,
    from: walletAddress,
    slippage: '1',
    disableEstimate: 'true',
  });

  const response = await fetchWithRetry(
    `${ONEINCH_SWAP_API}/${CHAIN_ID}/quote?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
    },
    { operation: 'getSwapQuote', walletAddress, toToken }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`1inch quote failed (${response.status}): ${error}`);
  }

  return response.json();
}

/**
 * Get the swap transaction data (ready to sign and broadcast).
 */
export async function getSwapTransaction(fromToken, toToken, amount, walletAddress) {
  const apiKey = process.env.ONEINCH_API_KEY;

  const params = new URLSearchParams({
    src: fromToken,
    dst: toToken,
    amount: amount,
    from: walletAddress,
    slippage: '1',
    disableEstimate: 'true',
  });

  const response = await fetchWithRetry(
    `${ONEINCH_SWAP_API}/${CHAIN_ID}/swap?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
    },
    { operation: 'getSwapTransaction', walletAddress, toToken }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`1inch swap failed (${response.status}): ${error}`);
  }

  return response.json();
}