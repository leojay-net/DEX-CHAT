'use client';

import React from 'react';
import { Wallet, Network, Shield, User, Copy, LogOut, Sun, Moon } from 'lucide-react';
import { useSimpleEthereumWallet } from '@/contexts/SimpleEthereumWalletContext';
import { useTheme } from '@/contexts/ThemeContext';
import { ETHEREUM_CHAIN_CONFIG, MORPH_CHAINS } from '@/lib/ethereum';

interface SimpleEthereumWalletConnectionProps {
    onOpenFiatModal?: () => void;
    onNewChat?: () => void;
}

export default function SimpleEthereumWalletConnection({ }: SimpleEthereumWalletConnectionProps) {
    const { connection, connect, disconnect, switchToMorph, isConnecting, error } = useSimpleEthereumWallet();
    const { isDarkMode, toggleDarkMode } = useTheme();

    const formatAddress = (address: string) => {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    const getNetworkName = (chainId?: number) => {
        switch (chainId) {
            case MORPH_CHAINS.MAINNET.id:
                return 'Morph Mainnet';
            case MORPH_CHAINS.HOLESKY.id:
                return 'Morph Holesky';
            case 1:
                return 'Ethereum Mainnet';
            case 11155111:
                return 'Sepolia Testnet';
            default:
                return `Chain ID: ${chainId}`;
        }
    };

    const isOnCorrectNetwork = () => {
        return connection.chainId === ETHEREUM_CHAIN_CONFIG.chainId;
    };

    const handleSwitchNetwork = async () => {
        const success = await switchToMorph();
        if (success) {
            // Optionally refresh the connection
            window.location.reload();
        }
    };

    const clearError = () => {
        // This would need to be implemented in the context
    };

    return (
        <div className={`p-4 transition-colors duration-300 ${isDarkMode ? 'bg-gray-800/90 border-gray-700' : 'bg-white/90 border-gray-200'
            } backdrop-blur-sm`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-md">
                            <Shield className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <div className={`text-lg font-bold transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'
                                }`}>DexFiat</div>
                            <div className={`text-xs transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                }`}>AI-Powered Crypto to Fiat Conversion</div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    {/* Theme Toggle */}
                    <button
                        onClick={toggleDarkMode}
                        className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 ${isDarkMode
                            ? 'text-gray-300 hover:text-yellow-400 hover:bg-gray-700/50'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                            }`}
                        title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
                    >
                        {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </button>



                    {!connection.isConnected ? (
                        <button
                            onClick={connect}
                            disabled={isConnecting}
                            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                        >
                            <Wallet className="w-4 h-4" />
                            <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
                        </button>
                    ) : (
                        <div className="flex items-center space-x-3">
                            {/* Wallet Info */}
                            <div className="flex items-center space-x-2 px-3 py-2 bg-gray-800/80 border border-gray-700 rounded-lg group">
                                <User className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-200 font-mono">{formatAddress(connection.address)}</span>
                                <button
                                    onClick={() => navigator.clipboard.writeText(connection.address || '')}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                    title="Copy Address"
                                >
                                    <Copy className="w-3 h-3 text-gray-400 hover:text-gray-200" />
                                </button>
                            </div>

                            <button
                                onClick={disconnect}
                                className="flex items-center justify-center w-10 h-10 bg-red-600/80 hover:bg-red-600 border border-red-500/50 text-white rounded-lg transition-all duration-200 hover:scale-105"
                                title="Disconnect"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {error && (
                <div className="mt-3 p-3 bg-red-900/20 border border-red-600/30 rounded-lg text-red-200 text-sm backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                        <span>{error}</span>
                        <button
                            onClick={clearError}
                            className="text-red-400 hover:text-red-300 transition-colors duration-200"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {connection.isConnected && (
                <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-xs text-gray-400">
                        <div className={`w-2 h-2 rounded-full animate-pulse ${isOnCorrectNetwork() ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                        <span>Connected to {getNetworkName(connection.chainId)} {isOnCorrectNetwork() ? '• Ready for trading' : '• Wrong network'}</span>
                    </div>

                    {!isOnCorrectNetwork() && (
                        <button
                            onClick={handleSwitchNetwork}
                            className="flex items-center space-x-1 px-2 py-1 bg-orange-600/80 hover:bg-orange-600 text-white text-xs rounded transition-all duration-200"
                            title={`Switch to ${getNetworkName(ETHEREUM_CHAIN_CONFIG.chainId)}`}
                        >
                            <Network className="w-3 h-3" />
                            <span>Switch Network</span>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
