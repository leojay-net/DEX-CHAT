'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useAccount, useDisconnect } from 'wagmi';

interface EthereumWalletConnection {
    address: string;
    isConnected: boolean;
    chainId?: number;
}

interface EthereumWalletContextType {
    connection: EthereumWalletConnection;
    connect: () => Promise<void>;
    disconnect: () => void;
    isConnecting: boolean;
    error: string | null;
}

const EthereumWalletContext = createContext<EthereumWalletContextType | undefined>(undefined);

interface EthereumWalletProviderProps {
    children: ReactNode;
}

export function EthereumWalletProvider({ children }: EthereumWalletProviderProps) {
    const { login, logout, authenticated, ready } = usePrivy();
    const { address, isConnected, chainId } = useAccount();
    const { disconnect: wagmiDisconnect } = useDisconnect();

    const connection: EthereumWalletConnection = {
        address: address || '',
        isConnected: authenticated && isConnected,
        chainId,
    };

    const connect = async () => {
        try {
            await login();
        } catch (error) {
            console.error('Failed to connect wallet:', error);
            throw error;
        }
    };

    const disconnect = () => {
        try {
            wagmiDisconnect();
            logout();
        } catch (error) {
            console.error('Failed to disconnect wallet:', error);
        }
    };

    const value: EthereumWalletContextType = {
        connection,
        connect,
        disconnect,
        isConnecting: !ready,
        error: null, // TODO: Implement error handling
    };

    return (
        <EthereumWalletContext.Provider value={value}>
            {children}
        </EthereumWalletContext.Provider>
    );
}

export function useEthereumWallet() {
    const context = useContext(EthereumWalletContext);
    if (context === undefined) {
        throw new Error('useEthereumWallet must be used within an EthereumWalletProvider');
    }
    return context;
}
