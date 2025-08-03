'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ETHEREUM_CHAIN_CONFIG, MORPH_CHAINS } from '@/lib/ethereum';

interface SimpleEthereumWalletConnection {
    address: string;
    isConnected: boolean;
    chainId?: number;
}

interface SimpleEthereumWalletContextType {
    connection: SimpleEthereumWalletConnection;
    connect: () => Promise<void>;
    disconnect: () => void;
    switchToMorph: () => Promise<boolean>;
    isConnecting: boolean;
    error: string | null;
}

const SimpleEthereumWalletContext = createContext<SimpleEthereumWalletContextType | undefined>(undefined);

interface SimpleEthereumWalletProviderProps {
    children: ReactNode;
}

interface EthereumProvider {
    request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    on: (event: string, callback: (accounts: string[]) => void) => void;
    removeListener: (event: string, callback: (accounts: string[]) => void) => void;
    isMetaMask?: boolean;
}

export function SimpleEthereumWalletProvider({ children }: SimpleEthereumWalletProviderProps) {
    const [connection, setConnection] = useState<SimpleEthereumWalletConnection>({
        address: '',
        isConnected: false,
        chainId: 1,
    });
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const connect = async () => {
        const ethereum = (window as Window & { ethereum?: EthereumProvider }).ethereum;

        if (typeof window === 'undefined' || !ethereum) {
            setError('MetaMask not detected. Please install MetaMask to connect.');
            return;
        }

        setIsConnecting(true);
        setError(null);

        try {
            // Request account access
            const accounts = await ethereum.request({
                method: 'eth_requestAccounts',
            }) as string[];

            if (accounts.length > 0) {
                // Get chain ID
                const chainId = await ethereum.request({
                    method: 'eth_chainId',
                }) as string;

                setConnection({
                    address: accounts[0],
                    isConnected: true,
                    chainId: parseInt(chainId, 16),
                });

                // Store connection in localStorage
                localStorage.setItem('ethereum_wallet_connected', 'true');
                localStorage.setItem('ethereum_wallet_address', accounts[0]);
            }
        } catch (error) {
            console.error('Failed to connect wallet:', error);
            setError(error instanceof Error ? error.message : 'Failed to connect wallet');
        } finally {
            setIsConnecting(false);
        }
    };

    const disconnect = () => {
        setConnection({
            address: '',
            isConnected: false,
            chainId: 1,
        });
        localStorage.removeItem('ethereum_wallet_connected');
        localStorage.removeItem('ethereum_wallet_address');
    };

    const switchToMorph = async (): Promise<boolean> => {
        const ethereum = (window as Window & { ethereum?: EthereumProvider }).ethereum;

        if (!ethereum) {
            setError('MetaMask not detected');
            return false;
        }

        try {
            const targetChainId = ETHEREUM_CHAIN_CONFIG.chainId;

            // Try to switch to the network
            await ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: `0x${targetChainId.toString(16)}` }],
            });

            return true;
        } catch (switchError: unknown) {
            // If the network doesn't exist, add it
            const error = switchError as { code?: number };
            if (error.code === 4902) {
                try {
                    const targetChain = ETHEREUM_CHAIN_CONFIG.chainId === MORPH_CHAINS.MAINNET.id ? MORPH_CHAINS.MAINNET : MORPH_CHAINS.HOLESKY;

                    await ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: `0x${targetChain.id.toString(16)}`,
                            chainName: targetChain.name,
                            nativeCurrency: {
                                name: 'Ether',
                                symbol: 'ETH',
                                decimals: 18,
                            },
                            rpcUrls: [targetChain.rpcUrl],
                            blockExplorerUrls: [targetChain.explorer],
                        }],
                    });

                    return true;
                } catch (addError) {
                    console.error('Failed to add Morph network:', addError);
                    setError('Failed to add Morph network to MetaMask');
                    return false;
                }
            } else {
                console.error('Failed to switch to Morph network:', switchError);
                setError('Failed to switch to Morph network');
                return false;
            }
        }
    };

    // Auto-connect on mount if previously connected
    React.useEffect(() => {
        const wasConnected = localStorage.getItem('ethereum_wallet_connected');
        const savedAddress = localStorage.getItem('ethereum_wallet_address');
        const ethereum = (window as Window & { ethereum?: EthereumProvider }).ethereum;

        if (wasConnected === 'true' && savedAddress && ethereum) {
            connect();
        }
    }, []);

    const value: SimpleEthereumWalletContextType = {
        connection,
        connect,
        disconnect,
        switchToMorph,
        isConnecting,
        error,
    };

    return (
        <SimpleEthereumWalletContext.Provider value={value}>
            {children}
        </SimpleEthereumWalletContext.Provider>
    );
}

export function useSimpleEthereumWallet() {
    const context = useContext(SimpleEthereumWalletContext);
    if (context === undefined) {
        throw new Error('useSimpleEthereumWallet must be used within a SimpleEthereumWalletProvider');
    }
    return context;
}
