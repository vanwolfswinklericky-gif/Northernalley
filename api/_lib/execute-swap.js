// api/_lib/execute-swap.js

import { PrivyClient } from '@privy-io/server-auth';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

const BASE_RPC_URL = process.env.BASE_RPC_URL || 'https://mainnet.base.org';

const publicClient = createPublicClient({
  chain: base,
  transport: http(BASE_RPC_URL),
});

let _privy = null;
function getPrivy() {
  if (_privy) return _privy;

  const appId = process.env.PRIVY_APP_ID;
  const appSecret = process.env.PRIVY_APP_SECRET;
  const signerPrivateKey = process.env.PRIVY_SIGNER_PRIVATE_KEY;

  if (!appId || !appSecret) {
    throw new Error('PRIVY_APP_ID and PRIVY_APP_SECRET must be set');
  }

  // Old SDK uses positional args
  _privy = new PrivyClient(appId, appSecret);

  // Attach the authorization key for signing
  if (signerPrivateKey) {
    _privy.walletApi.updateAuthorizationKey(signerPrivateKey);
  }

  return _privy;
}

function log(level, message, context = {}) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    service: 'execute-swap',
    message,
    ...context,
  };
  if (level === 'error') console.error(JSON.stringify(entry));
  else if (level === 'warn') console.warn(JSON.stringify(entry));
  else console.log(JSON.stringify(entry));
}

async function signAndBroadcastSwap(swapData, context) {
  const { userId, executionId, walletAddress, symbol } = context;

  if (!walletAddress) {
    throw new Error('walletAddress is required for swap execution');
  }

  const privy = getPrivy();

  log('info', 'Signing swap via Privy', {
    executionId,
    userId,
    symbol,
    walletAddress,
    to: swapData.tx.to,
  });

  // Old SDK uses walletApi.rpc() with walletId in the params
  const { data } = await privy.walletApi.rpc({
    walletId: walletAddress, // Privy uses wallet ID, not address
    method: 'eth_sendTransaction',
    caip2: 'eip155:8453',
    params: {
      transaction: {
        to: swapData.tx.to,
        data: swapData.tx.data,
        value: swapData.tx.value || '0x0',
        gas: swapData.tx.gas,
        maxFeePerGas: swapData.tx.maxFeePerGas,
        maxPriorityFeePerGas: swapData.tx.maxPriorityFeePerGas,
        nonce: swapData.tx.nonce,
        type: '0x2',
      },
    },
  });

  const txHash = data.hash;

  log('info', 'Transaction broadcast', {
    executionId,
    userId,
    symbol,
    txHash,
  });

  const receipt = await publicClient.waitForTransactionReceipt({
    hash: txHash,
    confirmations: 2,
    timeout: 120_000,
  });

  if (receipt.status === 'reverted') {
    throw new Error(`Transaction reverted: ${txHash}`);
  }

  log('info', 'Transaction confirmed', {
    executionId,
    userId,
    symbol,
    txHash,
    blockNumber: receipt.blockNumber.toString(),
  });

  return { txHash, receipt };
}

export async function executeSwapBatch(swaps, context) {
  const { userId, executionId, walletAddress } = context;

  if (!walletAddress) {
    throw new Error('walletAddress is required for swap execution');
  }

  const executed = [];
  const failed = [];

  for (const swap of swaps) {
    try {
      const result = await signAndBroadcastSwap(swap.transaction, {
        userId,
        executionId,
        walletAddress,
        symbol: swap.symbol,
      });

      executed.push({
        symbol: swap.symbol,
        txHash: result.txHash,
        blockNumber: result.receipt.blockNumber.toString(),
      });
    } catch (error) {
      log('error', 'Swap failed', {
        executionId,
        userId,
        symbol: swap.symbol,
        error: error.message,
      });
      failed.push({
        symbol: swap.symbol,
        error: error.message,
      });
    }
  }

  return { executed, failed };
}