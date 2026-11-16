// api/_lib/execute-swap.js

import { PrivyClient } from '@privy-io/server-auth';
import { createPublicClient, encodeFunctionData, http, maxUint256, parseAbi } from 'viem';
import { base } from 'viem/chains';
import { resolveToken } from './swap.js';

const BASE_RPC_URL = process.env.BASE_RPC_URL || 'https://mainnet.base.org';

const publicClient = createPublicClient({
  chain: base,
  transport: http(BASE_RPC_URL),
});

const ERC20_ABI = parseAbi([
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
]);

let _privy = null;
function getPrivy() {
  if (_privy) return _privy;

  const appId = process.env.PRIVY_APP_ID;
  const appSecret = process.env.PRIVY_APP_SECRET;
  const signerPrivateKey = process.env.PRIVY_SIGNER_PRIVATE_KEY;

  if (!appId || !appSecret) {
    throw new Error('PRIVY_APP_ID and PRIVY_APP_SECRET must be set');
  }

  _privy = new PrivyClient(appId, appSecret);

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

/**
 * Helper to get the actual Privy Wallet ID from the wallet address.
 */
async function getPrivyWalletId(userId, walletAddress) {
  const privy = getPrivy();
  const wallets = await privy.walletApi.getWallets({ userId });
  const wallet = wallets.data.find(w => w.address.toLowerCase() === walletAddress.toLowerCase());
  if (!wallet) throw new Error(`No Privy wallet found for address ${walletAddress}`);
  return wallet.id;
}

/**
 * Fetches the current USDC allowance.
 */
async function getUsdcAllowance(walletAddress, spenderAddress) {
  const usdc = await resolveToken('USDC');
  return await publicClient.readContract({
    address: usdc.address,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [walletAddress, spenderAddress],
  });
}

/**
 * Builds the ERC-20 approve transaction data.
 */
async function buildApprovalTxData(spenderAddress) {
  const usdc = await resolveToken('USDC');
  return encodeFunctionData({
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [spenderAddress, maxUint256], // Approve Max
  });
}

/**
 * Executes a batch of swaps atomically using EIP-7702 (Privy wallet_sendCalls).
 */
export async function executeSwapBatch(swaps, context) {
  const { userId, executionId, walletAddress } = context;

  if (!walletAddress) {
    throw new Error('walletAddress is required for swap execution');
  }

  const executed = [];
  const failed = [];

  if (swaps.length === 0) return { executed, failed };

  const privy = getPrivy();
  const walletId = await getPrivyWalletId(userId, walletAddress);

  // 1. Prepare all the transactions for the batch
  const calls = [];
  const totalUsdcNeeded = swaps.reduce((sum, swap) => sum + BigInt(swap.usdcAmount), 0n);
  const spenderAddress = swaps[0].transaction.tx.to;

  // 2. Check if we need an approval step
  try {
    const currentAllowance = await getUsdcAllowance(walletAddress, spenderAddress);
    
    if (currentAllowance < totalUsdcNeeded) {
      log('info', 'Adding USDC approval to batch', { walletAddress, spenderAddress });
      const usdc = await resolveToken('USDC');
      const approveData = await buildApprovalTxData(spenderAddress);
      
      calls.push({
        to: usdc.address,
        data: approveData,
        value: '0x0',
      });
    }
  } catch (error) {
    log('error', 'Failed to check approval, aborting batch', { error: error.message });
    return {
      executed: [],
      failed: swaps.map(s => ({ symbol: s.symbol, error: 'Approval Check Failed' })),
    };
  }

  // 3. Add all the swaps to the calls array
  for (const swap of swaps) {
    calls.push({
      to: swap.transaction.tx.to,
      data: swap.transaction.tx.data,
      value: swap.transaction.tx.value || '0x0',
      // We can omit gas parameters here, Privy estimates them for the batch
    });
  }

  // 4. Send the entire batch as ONE transaction using EIP-7702
  log('info', 'Sending atomic batch transaction', { executionId, callCount: calls.length });

  try {
    const { data } = await privy.walletApi.rpc({
      walletId,
      method: 'wallet_sendCalls',
      caip2: 'eip155:8453',
      params: {
        calls,
        // Optional: You can specify atomicity requirements here
        capabilities: {
          atomic: { required: true } // Ensures all swaps succeed or all fail
        }
      },
    });

    // Privy returns a batch ID or a transaction hash depending on implementation.
    // Assuming it returns a hash for the atomic batch:
    const txHash = data.hash || data.id;
    
    if (!txHash) {
      throw new Error('No transaction hash returned from Privy batch call');
    }

    log('info', 'Batch broadcast', { executionId, txHash });

    // Wait for the single batch transaction to confirm
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
      confirmations: 2,
      timeout: 120_000,
    });

    if (receipt.status === 'reverted') {
      throw new Error(`Batch transaction reverted: ${txHash}`);
    }

    log('info', 'Batch confirmed', { executionId, txHash, blockNumber: receipt.blockNumber.toString() });

    // If we get here, the whole batch succeeded
    for (const swap of swaps) {
      executed.push({
        symbol: swap.symbol,
        txHash: txHash,
        blockNumber: receipt.blockNumber.toString(),
      });
    }

    return { executed, failed };

  } catch (error) {
    log('error', 'Batch execution failed', { executionId, error: error.message });
    
    // If the batch fails, ALL swaps fail because it's atomic
    for (const swap of swaps) {
      failed.push({
        symbol: swap.symbol,
        error: error.message,
      });
    }
    
    return { executed: [], failed };
  }
}