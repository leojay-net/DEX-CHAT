'use client';

import { useEthereumWallet } from '@/contexts/EthereumWalletContext';
import { Wallet, LogOut, User, DollarSign, Shield, Copy, Plus } from 'lucide-react';

interface EthereumWalletConnectionProps {
    onOpenFiatModal?: () => void;
    onNewChat?: () => void;
}

export default function EthereumWalletConnection({ onOpenFiatModal, onNewChat }: EthereumWalletConnectionProps) {
    const { connection, connect, disconnect, isConnecting, error } = useEthereumWallet();

    const formatAddress = (address: string) => {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    const getNetworkName = (chainId?: number) => {
        switch (chainId) {
            case 1:
                return 'Ethereum';
            case 11155111:
                return 'Sepolia';
            default:
                return 'Unknown';
        }
    };

    return (
        <div className="p-4 border-b border-gray-800 bg-black/90 backdrop-blur-sm">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                            <Shield className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <div className="text-lg font-bold text-white">DeFi Chat</div>
                            <div className="text-xs text-gray-400">AI-Powered Trading Assistant</div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    {/* New Chat Button */}
                    <button
                        onClick={onNewChat}
                        className="flex items-center space-x-1 px-3 py-2 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white text-sm rounded-lg transition-all duration-200 border border-gray-600/30"
                        title="Start New Chat"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">New Chat</span>
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
                            {/* Fiat Off-ramping Button */}
                            <button
                                onClick={onOpenFiatModal}
                                className="flex items-center space-x-1 px-3 py-2 bg-gray-800/80 hover:bg-gray-700 border border-gray-700 text-gray-200 text-sm rounded-lg transition-all duration-200 hover:scale-105"
                                title="Convert to Fiat"
                            >
                                <DollarSign className="w-4 h-4" />
                                <span>Cash Out</span>
                            </button>

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
                            onClick={() => {/* clearError */ }}
                            className="text-red-400 hover:text-red-300 transition-colors duration-200"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {connection.isConnected && (
                <div className="mt-3 flex items-center space-x-2 text-xs text-gray-400">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Connected to {getNetworkName(connection.chainId)} • Ready for trading</span>
                </div>
            )}
        </div>
    );
}
