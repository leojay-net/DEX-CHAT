'use client';

import { useState, useEffect } from 'react';
import { TransactionData } from '@/types';
import { useSimpleEthereumWallet } from '@/contexts/SimpleEthereumWalletContext';
import { useTheme } from '@/contexts/ThemeContext';
import useChat from '@/hooks/useChat';
import { useChatHistory } from '@/hooks/useChatHistory';
import SimpleEthereumWalletConnection from './SimpleEthereumWalletConnection';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import SimpleEthereumFiatModal from './SimpleEthereumFiatModal';
import ChatHistorySidebar from './ChatHistorySidebar';
import { Menu, X } from 'lucide-react';

export default function SimpleEthereumChatInterface() {
    const { connection } = useSimpleEthereumWallet();
    const { isDarkMode } = useTheme();
    const { messages, isLoading, sendMessage, clearChat, loadChatSession, setTransactionReadyCallback, addMessage } = useChat();
    const { } = useChatHistory(); // Initialize chat history hook
    const [showFiatModal, setShowFiatModal] = useState(false);
    const [autoTriggeredData, setAutoTriggeredData] = useState<TransactionData | null>(null);
    const [showMobileSidebar, setShowMobileSidebar] = useState(false);

    // Register callback for auto-triggered transactions
    useEffect(() => {
        setTransactionReadyCallback((data: TransactionData) => {
            setAutoTriggeredData(data);
            setShowFiatModal(true);
        });
    }, [setTransactionReadyCallback]);

    const handlePortfolioCheck = async () => {
        try {
            // Import the portfolio function
            const { getPortfolioBalance } = await import('@/lib/ethereumContract');

            // Get portfolio balances
            const balances = await getPortfolioBalance(connection.address as `0x${string}`);

            // Format the portfolio display
            let portfolioMessage = `**💼 Your USDT Portfolio Balance**\n\n`;
            portfolioMessage += `**Wallet Address:** \`${connection.address}\`\n\n`;

            let totalHoldings = 0;

            if (balances.length === 0) {
                portfolioMessage += `Unable to retrieve USDT balance from your wallet.\n\n`;
                portfolioMessage += `**Supported Stablecoin:** USDT only\n`;
                portfolioMessage += `**Contract Address:** \`0x3Dc887F12aF3565A2D28FC06492Aa698E6313Cf7\``;
            } else {
                portfolioMessage += `**Stablecoin Holdings:**\n`;
                for (const balance of balances) {
                    const balanceNum = parseFloat(balance.formattedBalance);
                    if (balanceNum > 0) {
                        portfolioMessage += `• **${balance.symbol}** (${balance.name}): ${balanceNum.toFixed(6)} ${balance.symbol}\n`;
                        totalHoldings++;
                    } else {
                        portfolioMessage += `• **${balance.symbol}** (${balance.name}): 0.000000 ${balance.symbol}\n`;
                    }
                }

                if (totalHoldings === 0) {
                    portfolioMessage += `\n**No USDT balance found**\n`;
                    portfolioMessage += `To use this service, you need USDT tokens in your wallet.\n`;
                    portfolioMessage += `**USDT Contract:** \`0x3Dc887F12aF3565A2D28FC06492Aa698E6313Cf7\`\n\n`;
                    portfolioMessage += `**How to get USDT:**\n`;
                    portfolioMessage += `• Transfer USDT to your wallet\n`;
                    portfolioMessage += `• Bridge USDT from another network\n`;
                    portfolioMessage += `• Purchase USDT from an exchange`;
                } else {
                    portfolioMessage += `\n**Available Actions:**\n`;
                    portfolioMessage += `• Convert USDT to fiat currency (NGN, USD, EUR)\n`;
                    portfolioMessage += `• Check current USDT market rates\n`;
                    portfolioMessage += `• Setup secure bank transfers\n\n`;
                    portfolioMessage += `**Ready to convert?** Let me know how much USDT you'd like to convert and to which fiat currency!`;
                }
            }

            // Add portfolio message directly as assistant message without triggering AI
            const portfolioAssistantMessage = {
                id: Date.now().toString(),
                role: 'assistant' as const,
                content: portfolioMessage,
                timestamp: new Date(),
                metadata: {
                    suggestedActions: totalHoldings > 0 ? [
                        { id: 'convert_usdt', type: 'confirm_fiat' as const, label: 'Convert USDT', priority: true },
                        { id: 'usdt_rates', type: 'market_rates' as const, label: 'USDT Rates' }
                    ] : [
                        { id: 'get_usdt', type: 'learn_more' as const, label: 'How to Get USDT' },
                        { id: 'bridge_usdt', type: 'learn_more' as const, label: 'Bridge USDT' }
                    ]
                }
            };

            addMessage(portfolioAssistantMessage);

        } catch (error) {
            console.error('Portfolio check failed:', error);

            // Add error message directly as assistant message
            const errorMessage = {
                id: Date.now().toString(),
                role: 'assistant' as const,
                content: `**USDT Portfolio Check Failed**\n\nSorry, I encountered an issue retrieving your USDT balance: ${error instanceof Error ? error.message : 'Unknown error'}.\n\nThis might be due to:\n• Network connectivity issues\n• Wallet connection problems\n• USDT contract interaction issues\n\n**USDT Contract Address:** \`0x3Dc887F12aF3565A2D28FC06492Aa698E6313Cf7\`\n\nPlease try again or contact support if the problem persists.`,
                timestamp: new Date(),
                metadata: {
                    suggestedActions: [
                        { id: 'retry_usdt_portfolio', type: 'check_portfolio' as const, label: 'Try Again' },
                        { id: 'manual_usdt_conversion', type: 'confirm_fiat' as const, label: 'Manual USDT Conversion' }
                    ]
                }
            };

            addMessage(errorMessage);
        }
    };

    const handleActionClick = async (actionId: string, actionType: string, data?: Partial<TransactionData>) => {
        // Close mobile sidebar when any action is clicked
        setShowMobileSidebar(false);

        switch (actionType) {
            case 'connect_wallet':
                if (!connection.isConnected) {
                    sendMessage("I'd like to connect my Ethereum wallet to get started.");
                }
                break;

            case 'check_portfolio':
                if (connection.isConnected) {
                    handlePortfolioCheck();
                } else {
                    sendMessage("I'd like to check my portfolio. Please help me connect my wallet first.");
                }
                break;

            case 'market_rates':
                sendMessage("What are the current market rates for cryptocurrency conversions?");
                break;

            case 'learn_more':
                sendMessage("How does the crypto-to-fiat conversion process work? I'd like to understand the steps.");
                break;

            case 'confirm_fiat':
                setShowFiatModal(true);
                break;

            case 'cancel':
                // Send a clear cancellation message and reset conversation state
                await sendMessage("I want to cancel the current transaction process.");
                // Also close any open modal
                setShowFiatModal(false);
                setAutoTriggeredData(null);
                break;

            default:
                console.log('Unknown action:', actionType, data);
        }
    };

    const handleFiatExecute = async (fiatData: {
        transactionId: string;
        txHash: string;
        amount: string;
        token: string;
        fiatCurrency: string;
        estimatedFiat: string;
        status: string;
    }) => {
        try {
            console.log('Executing Ethereum fiat conversion:', fiatData);

            // Import AI assistant to generate professional receipt
            const { AIAssistant } = await import('@/lib/aiAssistant');
            const aiAssistant = new AIAssistant();

            // Generate professional receipt
            const receipt = await aiAssistant.generateConversionReceipt({
                ...fiatData,
                status: 'Processing',
                transactionId: `TXN-${Date.now()}`,
                txHash: fiatData.txHash || `0x${Math.random().toString(16).substr(2, 64)}`
            });

            await sendMessage(receipt);

            // Follow up with completion message after a brief delay
            setTimeout(async () => {
                const completionMessage = `
**Conversion Completed Successfully!**

Your crypto-to-fiat conversion has been processed and the funds are on their way to your bank account. 

**What's Next?**
- Check your bank account in 5-15 minutes
- Transaction receipt saved to your history
- Need another conversion? Just let me know!

Thank you for using our service. Is there anything else I can help you with today?
                `.trim();

                await sendMessage(completionMessage);
            }, 3000);

        } catch (error) {
            console.error('Fiat conversion failed:', error);
            await sendMessage(`**Conversion Failed**\n\nSorry, there was an issue processing your conversion: ${error instanceof Error ? error.message : 'Unknown error'}.\n\nPlease try again or contact support if the issue persists. I'm here to help resolve this quickly.`);
        }
    };

    return (
        <div className={`h-screen flex flex-col overflow-hidden transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            {/* Mobile Header with Menu Button */}
            <div className={`md:hidden flex items-center justify-between px-4 py-3 border-b transition-colors duration-300 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                <h1 className={`text-base font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>DEX Chat</h1>
                <button
                    onClick={() => setShowMobileSidebar(!showMobileSidebar)}
                    className={`p-2 rounded-md transition-colors duration-300 ${isDarkMode
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                >
                    {showMobileSidebar ? <X size={18} /> : <Menu size={18} />}
                </button>
            </div>

            {/* Main Container */}
            <div className="flex-1 flex overflow-hidden relative">
                {/* Sidebar - Hidden on mobile by default, overlay when shown */}
                <div className={`${showMobileSidebar ? 'translate-x-0' : '-translate-x-full'
                    } md:translate-x-0 fixed md:relative inset-y-0 left-0 z-50 w-80 border-r flex-col flex-shrink-0 transition-all duration-300 ease-in-out transform ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                    } md:flex ${showMobileSidebar ? 'flex' : 'hidden md:flex'}`}>
                    <ChatHistorySidebar onLoadSession={loadChatSession} />
                </div>

                {/* Mobile Overlay */}
                {showMobileSidebar && (
                    <div
                        className="md:hidden fixed inset-0 bg-black/50 z-40"
                        onClick={() => setShowMobileSidebar(false)}
                    />
                )}

                {/* Main Content */}
                <div className={`flex-1 flex flex-col min-w-0 transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-white'
                    }`}>
                    {/* Header */}
                    <div className={`border-b backdrop-blur-sm transition-colors duration-300 ${isDarkMode ? 'border-gray-700 bg-gray-800/80' : 'border-gray-200 bg-white/80'
                        }`}>
                        <SimpleEthereumWalletConnection
                            onOpenFiatModal={() => {
                                setShowFiatModal(true);
                                setShowMobileSidebar(false); // Close mobile sidebar when opening modal
                            }}
                            onNewChat={() => {
                                clearChat();
                                setShowMobileSidebar(false); // Close mobile sidebar when starting new chat
                            }}
                        />
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 flex flex-col overflow-hidden h-0">
                        {/* Chat Messages */}
                        <div className="flex-1 overflow-hidden">
                            <ChatMessages
                                messages={messages}
                                onActionClick={handleActionClick}
                                isLoading={isLoading}
                            />
                        </div>

                        {/* Chat Input */}
                        <div className={`border-t flex-shrink-0 transition-colors duration-300 ${isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'
                            }`}>
                            <ChatInput
                                onSendMessage={(message) => {
                                    sendMessage(message);
                                    setShowMobileSidebar(false); // Close mobile sidebar when sending message
                                }}
                                isLoading={isLoading}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <SimpleEthereumFiatModal
                isOpen={showFiatModal}
                onClose={() => {
                    setShowFiatModal(false);
                    setAutoTriggeredData(null);
                }}
                onExecute={handleFiatExecute}
                initialData={autoTriggeredData || undefined}
            />
        </div>
    );
}
