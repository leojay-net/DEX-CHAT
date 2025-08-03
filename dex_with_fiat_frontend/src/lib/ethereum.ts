// Ethereum Contract ABIs and Configuration

// USDT ERC20 Contract ABI (standard ERC20 functions we need)
export const USDT_ABI = [
    {
        "constant": true,
        "inputs": [{ "name": "_owner", "type": "address" }],
        "name": "balanceOf",
        "outputs": [{ "name": "balance", "type": "uint256" }],
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            { "name": "_spender", "type": "address" },
            { "name": "_value", "type": "uint256" }
        ],
        "name": "approve",
        "outputs": [{ "name": "", "type": "bool" }],
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            { "name": "_owner", "type": "address" },
            { "name": "_spender", "type": "address" }
        ],
        "name": "allowance",
        "outputs": [{ "name": "", "type": "uint256" }],
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            { "name": "_to", "type": "address" },
            { "name": "_value", "type": "uint256" }
        ],
        "name": "transfer",
        "outputs": [{ "name": "", "type": "bool" }],
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "decimals",
        "outputs": [{ "name": "", "type": "uint8" }],
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "symbol",
        "outputs": [{ "name": "", "type": "string" }],
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "name",
        "outputs": [{ "name": "", "type": "string" }],
        "type": "function"
    }
] as const;

// FiatBridge Contract ABI (based on your Solidity contracts)
export const FIAT_BRIDGE_ABI = [
    {
        "inputs": [
            { "name": "token", "type": "address" },
            { "name": "tokenAmount", "type": "uint256" },
            { "name": "fiatAmount", "type": "uint256" },
            { "name": "fiatCurrency", "type": "string" },
            { "name": "transactionId", "type": "string" }
        ],
        "name": "initiateOfframp",
        "outputs": [{ "name": "", "type": "bytes32" }],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "name": "_requestId", "type": "bytes32" },
            { "name": "_status", "type": "uint8" },
            { "name": "_externalReference", "type": "string" }
        ],
        "name": "updateRequestStatus",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "name": "_requestId", "type": "bytes32" }],
        "name": "getFiatRequest",
        "outputs": [
            { "name": "user", "type": "address" },
            { "name": "token", "type": "address" },
            { "name": "tokenAmount", "type": "uint256" },
            { "name": "fiatAmount", "type": "uint256" },
            { "name": "fiatCurrency", "type": "string" },
            { "name": "transactionId", "type": "string" },
            { "name": "requestType", "type": "uint8" },
            { "name": "status", "type": "uint8" },
            { "name": "timestamp", "type": "uint256" },
            { "name": "externalReference", "type": "string" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    // Additional functions  
    {
        "inputs": [{ "name": "_feeRecipient", "type": "address" }],
        "name": "setFeeRecipient",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "feeRecipient",
        "outputs": [{ "name": "", "type": "address" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "feePercentage",
        "outputs": [{ "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "feeRecipient",
        "outputs": [{ "name": "", "type": "address" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "feePercentage",
        "outputs": [{ "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    }
] as const;

// Contract Addresses (Deployed on Morph Blockchain)
export const ETHEREUM_CONTRACTS = {
    USDT: process.env.NEXT_PUBLIC_USDT_ADDRESS as `0x${string}`,
    FIAT_BRIDGE: process.env.NEXT_PUBLIC_FIAT_BRIDGE_ADDRESS as `0x${string}`,
} as const;

// Supported tokens for Ethereum
export const ETHEREUM_TOKENS = {
    USDT: {
        address: ETHEREUM_CONTRACTS.USDT,
        symbol: 'USDT',
        name: 'Tether USD',
        decimals: 6,
        logo_url: 'https://tokens.1inch.io/0xdac17f958d2ee523a2206206994597c13d831ec7.png'
    },
    // Add more tokens as needed
} as const;

// Chain configuration for Morph
export const ETHEREUM_CHAIN_CONFIG = {
    chainId: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '2810'), // Default to Morph Holesky
    rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc-quicknode-holesky.morphl2.io',
} as const;

// Morph chain information
export const MORPH_CHAINS = {
    MAINNET: {
        id: 2818,
        name: 'Morph Mainnet',
        rpcUrl: 'https://rpc-quicknode.morphl2.io',
        explorer: 'https://explorer.morphl2.io',
    },
    HOLESKY: {
        id: 2810,
        name: 'Morph Holesky',
        rpcUrl: 'https://rpc-quicknode-holesky.morphl2.io',
        explorer: 'https://explorer-holesky.morphl2.io',
    }
} as const;
