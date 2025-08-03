import { http, createConfig } from 'wagmi';
import { defineChain } from 'viem';
import { ETHEREUM_CHAIN_CONFIG } from './ethereum';

// Define Morph Mainnet chain
const morphMainnet = defineChain({
    id: 2818,
    name: 'Morph Mainnet',
    nativeCurrency: {
        decimals: 18,
        name: 'Ether',
        symbol: 'ETH',
    },
    rpcUrls: {
        default: {
            http: ['https://rpc-quicknode.morphl2.io'],
        },
    },
    blockExplorers: {
        default: {
            name: 'Morph Explorer',
            url: 'https://explorer.morphl2.io',
        },
    },
});

// Define Morph Holesky Testnet
const morphHolesky = defineChain({
    id: 2810,
    name: 'Morph Holesky',
    nativeCurrency: {
        decimals: 18,
        name: 'Ether',
        symbol: 'ETH',
    },
    rpcUrls: {
        default: {
            http: ['https://rpc-quicknode-holesky.morphl2.io'],
        },
    },
    blockExplorers: {
        default: {
            name: 'Morph Holesky Explorer',
            url: 'https://explorer-holesky.morphl2.io',
        },
    },
});

// Determine which chain to use based on environment
const currentChain = ETHEREUM_CHAIN_CONFIG.chainId === 2818 ? morphMainnet : morphHolesky;

export const wagmiConfig = createConfig({
    chains: [morphMainnet, morphHolesky],
    transports: {
        [morphMainnet.id]: http(ETHEREUM_CHAIN_CONFIG.rpcUrl || morphMainnet.rpcUrls.default.http[0]),
        [morphHolesky.id]: http(ETHEREUM_CHAIN_CONFIG.rpcUrl || morphHolesky.rpcUrls.default.http[0]),
    },
});

export { currentChain, morphMainnet, morphHolesky };
