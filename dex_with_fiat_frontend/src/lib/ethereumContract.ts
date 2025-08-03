import { readContract } from 'wagmi/actions';
import { parseUnits, formatUnits, createWalletClient, custom, publicActions } from 'viem';
import { morphHolesky } from 'viem/chains';
import { USDT_ABI, FIAT_BRIDGE_ABI, ETHEREUM_CONTRACTS, ETHEREUM_TOKENS } from './ethereum';
import { wagmiConfig } from './wagmiConfig';

// Types
export interface EthereumFiatTransactionParams {
    token: string;
    amount: string;
    fiatAmount: string;
    fiatCurrency: string;
    transactionId: string;
    // Bank account details (handled off-chain)
    accountNumber?: string;
    accountName?: string;
    bankName?: string;
    bankCode?: string;
}

export interface PortfolioBalance {
    token: string;
    symbol: string;
    name: string;
    balance: string;
    formattedBalance: string;
    usdValue?: string;
}

// Helper functions
export function generateEthereumTransactionId(): string {
    return `eth_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Get token balance
export async function getEthereumTokenBalance(
    tokenAddress: `0x${string}`,
    userAddress: `0x${string}`
): Promise<string> {
    try {
        const balance = await readContract(wagmiConfig, {
            address: tokenAddress,
            abi: USDT_ABI,
            functionName: 'balanceOf',
            args: [userAddress],
        });

        const decimals = await readContract(wagmiConfig, {
            address: tokenAddress,
            abi: USDT_ABI,
            functionName: 'decimals',
        });

        return formatUnits(balance as bigint, decimals as number);
    } catch (error) {
        console.error('Error getting token balance:', error);
        return '0';
    }
}

// Get comprehensive portfolio balance (focusing on USDT for stable coin swaps)
export async function getPortfolioBalance(userAddress: `0x${string}`): Promise<PortfolioBalance[]> {
    try {
        const balances: PortfolioBalance[] = [];

        // Focus on USDT only since we're only swapping stablecoins
        for (const [tokenKey, tokenInfo] of Object.entries(ETHEREUM_TOKENS)) {
            try {
                const balance = await getEthereumTokenBalance(tokenInfo.address, userAddress);

                balances.push({
                    token: tokenKey,
                    symbol: tokenInfo.symbol,
                    name: tokenInfo.name,
                    balance: parseUnits(balance, tokenInfo.decimals).toString(),
                    formattedBalance: balance,
                });
            } catch (error) {
                console.error(`Error getting ${tokenInfo.symbol} balance:`, error);
                // Add token with zero balance if there's an error
                balances.push({
                    token: tokenKey,
                    symbol: tokenInfo.symbol,
                    name: tokenInfo.name,
                    balance: '0',
                    formattedBalance: '0',
                });
            }
        }

        return balances;
    } catch (error) {
        console.error('Error getting portfolio balance:', error);
        return [];
    }
}

// Check token allowance
export async function getEthereumTokenAllowance(
    tokenAddress: `0x${string}`,
    ownerAddress: `0x${string}`,
    spenderAddress: `0x${string}`
): Promise<string> {
    try {
        const allowance = await readContract(wagmiConfig, {
            address: tokenAddress,
            abi: USDT_ABI,
            functionName: 'allowance',
            args: [ownerAddress, spenderAddress],
        });

        const decimals = await readContract(wagmiConfig, {
            address: tokenAddress,
            abi: USDT_ABI,
            functionName: 'decimals',
        });

        return formatUnits(allowance as bigint, decimals as number);
    } catch (error) {
        console.error('Error getting token allowance:', error);
        return '0';
    }
}

// Approve token spending
export async function approveEthereumToken(
    tokenAddress: `0x${string}`,
    spenderAddress: `0x${string}`,
    amount: string,
    userAddress: `0x${string}`
): Promise<string> {
    try {
        const decimals = await readContract(wagmiConfig, {
            address: tokenAddress,
            abi: USDT_ABI,
            functionName: 'decimals',
        });

        const amountWei = parseUnits(amount, decimals as number);

        // Create wallet client for direct transaction
        const ethereum = (window as Window & { ethereum?: unknown }).ethereum;
        if (!ethereum) {
            throw new Error('MetaMask not detected');
        }

        const walletClient = createWalletClient({
            chain: morphHolesky,
            transport: custom(ethereum),
            account: userAddress,
        }).extend(publicActions);

        const hash = await walletClient.writeContract({
            address: tokenAddress,
            abi: USDT_ABI,
            functionName: 'approve',
            args: [spenderAddress, amountWei],
        });

        // Wait for transaction confirmation
        await walletClient.waitForTransactionReceipt({ hash });

        return hash;
    } catch (error) {
        console.error('Error approving token:', error);
        throw new Error(`Token approval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// Check and approve token if needed
export async function checkAndApproveEthereumToken(
    tokenAddress: `0x${string}`,
    ownerAddress: `0x${string}`,
    spenderAddress: `0x${string}`,
    amount: string
): Promise<{ needsApproval: boolean; approvalTxHash?: string; currentAllowance: string }> {
    try {
        const currentAllowance = await getEthereumTokenAllowance(tokenAddress, ownerAddress, spenderAddress);
        const requiredAmount = parseFloat(amount);
        const allowanceAmount = parseFloat(currentAllowance);

        console.log(`🔍 Checking allowance for ${tokenAddress}:`);
        console.log(`   Required: ${amount}`);
        console.log(`   Current: ${currentAllowance}`);

        if (allowanceAmount >= requiredAmount) {
            console.log('   ✅ Sufficient allowance');
            return {
                needsApproval: false,
                currentAllowance,
            };
        }

        console.log('   ⚠️ Insufficient allowance, requesting approval...');

        // Approve 2x the amount for future transactions
        const approvalAmount = (requiredAmount * 2).toString();
        const approvalTxHash = await approveEthereumToken(tokenAddress, spenderAddress, approvalAmount, ownerAddress);

        console.log(`   ✅ Approval transaction confirmed: ${approvalTxHash}`);

        return {
            needsApproval: true,
            approvalTxHash,
            currentAllowance,
        };
    } catch (error) {
        console.error('Error checking/approving token:', error);
        throw new Error(`Token approval check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// Initiate fiat transaction
export async function initiateEthereumFiatTransaction(
    userAddress: `0x${string}`,
    params: {
        token: string;
        amount: string;
        fiatAmount: string;
        fiatCurrency: string;
        transactionId: string;
        accountNumber?: string;
        accountName?: string;
        bankName?: string;
        bankCode?: string;
    }
): Promise<`0x${string}`> {
    try {
        console.log('🚀 Initiating fiat transaction with params:', params);

        // Get token info
        const tokenInfo = ETHEREUM_TOKENS[params.token as keyof typeof ETHEREUM_TOKENS];
        if (!tokenInfo) {
            throw new Error(`Unsupported token: ${params.token}`);
        }

        // Convert amounts to proper units
        const tokenAmountWei = parseUnits(params.amount, tokenInfo.decimals);
        const fiatAmountWei = parseUnits(params.fiatAmount, 2); // Assuming 2 decimals for fiat

        // Log bank account details for off-chain processing
        console.log('Bank account details for off-chain processing:', {
            accountNumber: params.accountNumber,
            accountName: params.accountName,
            bankName: params.bankName,
            bankCode: params.bankCode
        });

        // Direct contract interaction using viem wallet client
        const ethereum = (window as Window & { ethereum?: unknown }).ethereum;
        if (!ethereum) {
            throw new Error('MetaMask not detected');
        }

        // Create wallet client
        const walletClient = createWalletClient({
            chain: morphHolesky,
            transport: custom(ethereum),
            account: userAddress,
        }).extend(publicActions);

        // Call the contract function
        const hash = await walletClient.writeContract({
            address: ETHEREUM_CONTRACTS.FIAT_BRIDGE,
            abi: FIAT_BRIDGE_ABI,
            functionName: 'initiateOfframp',
            args: [
                tokenInfo.address,
                tokenAmountWei,
                fiatAmountWei,
                params.fiatCurrency,
                params.transactionId,
            ],
        });

        // Wait for transaction confirmation
        await walletClient.waitForTransactionReceipt({ hash });

        console.log(`✅ Fiat transaction initiated: ${hash}`);
        return hash;
    } catch (error) {
        console.error('Fiat transaction initiation error:', error);
        throw new Error(`Fiat transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// TODO: Update these functions to match the new contract ABI
/*
// Confirm fiat transaction (admin function)
export async function confirmEthereumFiatTransaction(
    userAddress: `0x${string}`,
    transactionId: string
): Promise<string> {
    try {
        const hash = await writeContract(wagmiConfig, {
            address: ETHEREUM_CONTRACTS.FIAT_BRIDGE,
            abi: FIAT_BRIDGE_ABI,
            functionName: 'updateRequestStatus',
            args: [requestId, status, externalReference],
        });

        await waitForTransactionReceipt(wagmiConfig, {
            hash,
        });

        return hash;
    } catch (error) {
        console.error('Fiat transaction initiation error:', error);
        throw new Error(`Fiat transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
}

// Get transaction details
export async function getEthereumFiatTransaction(transactionId: string) {
    try {
        const result = await readContract(wagmiConfig, {
            address: ETHEREUM_CONTRACTS.FIAT_BRIDGE,
            abi: FIAT_BRIDGE_ABI,
            functionName: 'getFiatRequest',
            args: [requestId],
        });

        const [user, token, amount, fiatAmount, isConfirmed] = result as [string, string, bigint, bigint, boolean];

        return {
            user,
            token,
            amount: formatUnits(amount, 6), // Assuming USDT with 6 decimals
            fiatAmount: formatUnits(fiatAmount, 2),
            isConfirmed
        };
    } catch (error) {
        console.error('Error getting transaction details:', error);
        throw new Error(`Failed to get transaction details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
*/

// TODO: Fix this function to match the contract ABI
/*
// Get transaction details
export async function getEthereumFiatTransaction(transactionId: string) {
    try {
        const result = await readContract(wagmiConfig, {
            address: ETHEREUM_CONTRACTS.FIAT_BRIDGE,
            abi: FIAT_BRIDGE_ABI,
            functionName: 'getFiatRequest',
            args: [requestId],
        });

        const [user, token, amount, fiatAmount, isConfirmed] = result as [string, string, bigint, bigint, boolean];

        return {
            user,
            token,
            amount: amount.toString(),
            fiatAmount: fiatAmount.toString(),
            isConfirmed,
        };
    } catch (error) {
        console.error('Error getting transaction details:', error);
        throw new Error(`Failed to get transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
*/
