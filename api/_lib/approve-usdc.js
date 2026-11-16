// api/_lib/approve-usdc.js

import { createPublicClient, encodeFunctionData, http, maxUint256, parseAbi } from 'viem';
import { base } from 'viem/chains'; // Adjust this if you are using a different chain (e.g., mainnet, arbitrum)
import { resolveToken } from './swap.js';
// Import your Privy client here (wherever you initialized it)
import { privy } from './privy-client.js';

const publicClient = createPublicClient({
  chain: base, // Update to your active network
  transport: http(process.env.ALCHEMY_RPC_URL || 'https://mainnet.base.org'),
});

// Standard ERC-20 ABI for allowance and approve
const ERC20_ABI = parseAbi([
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
]);

/**
 * Ensures the user has approved the DEX router to spend their USDC.
 * If not, it sends an approval transaction silently via Privy.
 */
export async function ensureUsdcAllowance(userId, walletAddress, spenderAddress, requiredAmount) {
  try {
    const usdc = await resolveToken('USDC');
    const usdcAddress = usdc.address;

    // 1. Check current allowance
    const currentAllowance = await publicClient.readContract({
      address: usdcAddress,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [walletAddress, spenderAddress],
    });

    // 2. If allowance is enough, we are good to go
    if (currentAllowance >= BigInt(requiredAmount)) {
      return true; 
    }

    console.log(`[Approval] Allowing ${spenderAddress} to spend USDC for wallet ${walletAddress}`);

    // 3. Build the approve transaction (using maxUint256 so we only do this once ever)
    const data = encodeFunctionData({
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [spenderAddress, maxUint256],
    });

    // 4. Send the transaction silently via Privy Session Signer
    // NOTE: The exact syntax depends on your Privy SDK version. 
    // This is the standard way to send a transaction via Privy server-side:
    const { hash } = await privy.walletApi.ethereum.sendTransaction({
      walletId: userId, // Or whatever identifier you use for Privy
      caip2: 'eip155:8453', // Base Mainnet (change if using another chain)
      transaction: {
        to: usdcAddress,
        data: data,
        value: '0',
      },
    });

    console.log(`[Approval] Approval tx sent: ${hash}. Waiting for confirmation...`);

    // 5. Wait for the transaction to be mined (so the swap doesn't fail)
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    
    if (receipt.status !== 'success') {
      throw new Error('Approval transaction failed on-chain');
    }

    console.log(`[Approval] Successfully approved USDC for ${walletAddress}`);
    return true;
  } catch (error) {
    console.error('[Approval] Failed to ensure USDC allowance:', error);
    throw new Error(`Failed to approve USDC: ${error.message}`);
  }
}