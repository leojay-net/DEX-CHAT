'use client';

import { useState, useEffect } from 'react';
import { TransactionData } from '@/types';
import { useSimpleEthereumWallet } from '@/contexts/SimpleEthereumWalletContext';
import { useTheme } from '@/contexts/ThemeContext';
import { X, DollarSign, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import {
    initiateEthereumFiatTransaction,
    generateEthereumTransactionId,
    getEthereumTokenBalance,
    checkAndApproveEthereumToken
} from '@/lib/ethereumContract';
import { paystackService, Bank } from '@/lib/paystack';
import { ETHEREUM_TOKENS, ETHEREUM_CONTRACTS } from '@/lib/ethereum';

interface SimpleEthereumFiatModalProps {
    isOpen: boolean;
    onClose: () => void;
    onExecute?: (data: {
        transactionId: string;
        txHash: string;
        amount: string;
        token: string;
        fiatCurrency: string;
        estimatedFiat: string;
        status: string;
    }) => void;
    initialData?: Partial<TransactionData>;
}

const CURRENCIES = [
    { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' }
];

const SUPPORTED_TOKENS = [
    { symbol: 'USDT', name: 'Tether USD', address: ETHEREUM_TOKENS.USDT.address },
    // Add more tokens as needed
];

export default function SimpleEthereumFiatModal({ isOpen, onClose, onExecute, initialData }: SimpleEthereumFiatModalProps) {
    const { connection } = useSimpleEthereumWallet();
    const { isDarkMode } = useTheme();
    const [formData, setFormData] = useState({
        tokenIn: initialData?.tokenIn || 'USDT',
        amountIn: initialData?.amountIn || '',
        fiatCurrency: initialData?.fiatCurrency || 'NGN',
        // Bank account details
        accountNumber: '',
        accountName: '',
        bankName: '',
        bankCode: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [tokenBalance, setTokenBalance] = useState<string>('0');
    const [loadingBalance, setLoadingBalance] = useState(false);
    const [currentStep, setCurrentStep] = useState<'form' | 'approving' | 'transacting'>('form');
    const [banks, setBanks] = useState<Bank[]>([]);
    const [loadingBanks, setLoadingBanks] = useState(false);
    const [verifyingAccount, setVerifyingAccount] = useState(false);
    const [accountVerified, setAccountVerified] = useState(false);

    // Initialize form with passed data
    useEffect(() => {
        if (initialData) {
            setFormData(prev => ({
                ...prev,
                tokenIn: initialData.tokenIn || prev.tokenIn,
                amountIn: initialData.amountIn || prev.amountIn,
                fiatCurrency: initialData.fiatCurrency || prev.fiatCurrency
            }));
        }
    }, [initialData]);

    // Load token balance when wallet is connected
    useEffect(() => {
        const loadBalance = async () => {
            if (connection.isConnected && connection.address) {
                setLoadingBalance(true);
                try {
                    const tokenInfo = ETHEREUM_TOKENS[formData.tokenIn as keyof typeof ETHEREUM_TOKENS];
                    if (tokenInfo) {
                        const balance = await getEthereumTokenBalance(
                            tokenInfo.address as `0x${string}`,
                            connection.address as `0x${string}`
                        );
                        setTokenBalance(balance);
                    }
                } catch (error) {
                    console.error('Error loading token balance:', error);
                    setTokenBalance('0');
                } finally {
                    setLoadingBalance(false);
                }
            }
        };

        loadBalance();
    }, [connection.isConnected, connection.address, formData.tokenIn]);

    // Load banks when component mounts
    useEffect(() => {
        const loadBanks = async () => {
            if (formData.fiatCurrency === 'NGN') {
                setLoadingBanks(true);
                try {
                    const bankList = await paystackService.listBanks();
                    setBanks(bankList);
                } catch (error) {
                    console.error('Error loading banks:', error);
                    // Fallback to predefined banks
                    setBanks([
                        { id: 1, name: 'Access Bank', code: '044', active: true, country: 'Nigeria', currency: 'NGN', type: 'nuban' },
                        { id: 2, name: 'GTBank', code: '058', active: true, country: 'Nigeria', currency: 'NGN', type: 'nuban' },
                        { id: 3, name: 'First Bank', code: '011', active: true, country: 'Nigeria', currency: 'NGN', type: 'nuban' },
                        { id: 4, name: 'Zenith Bank', code: '057', active: true, country: 'Nigeria', currency: 'NGN', type: 'nuban' },
                        { id: 5, name: 'UBA', code: '033', active: true, country: 'Nigeria', currency: 'NGN', type: 'nuban' },
                        { id: 6, name: 'Fidelity Bank', code: '070', active: true, country: 'Nigeria', currency: 'NGN', type: 'nuban' }
                    ]);
                } finally {
                    setLoadingBanks(false);
                }
            }
        };

        loadBanks();
    }, [formData.fiatCurrency]);

    // Verify account when account number and bank are provided
    useEffect(() => {
        const verifyAccount = async () => {
            if (formData.accountNumber.length === 10 && formData.bankCode && formData.fiatCurrency === 'NGN') {
                setVerifyingAccount(true);
                setAccountVerified(false);
                try {
                    const verification = await paystackService.verifyAccount(formData.accountNumber, formData.bankCode);
                    setFormData(prev => ({ ...prev, accountName: verification.account_name }));
                    setAccountVerified(true);
                    setError(null);
                } catch (error) {
                    console.error('Account verification failed:', error);
                    setError('Unable to verify account. Please check account number and bank selection.');
                    setAccountVerified(false);
                } finally {
                    setVerifyingAccount(false);
                }
            }
        };

        const timeoutId = setTimeout(() => {
            if (formData.accountNumber.length === 10 && formData.bankCode) {
                verifyAccount();
            }
        }, 500); // Debounce for 500ms

        return () => clearTimeout(timeoutId);
    }, [formData.accountNumber, formData.bankCode, formData.fiatCurrency]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!connection.isConnected || !connection.address) {
            setError('Please connect your wallet first');
            return;
        }

        const amount = parseFloat(formData.amountIn);
        if (amount <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        const balance = parseFloat(tokenBalance);
        if (amount > balance) {
            setError(`Insufficient balance. You have ${balance} ${formData.tokenIn}`);
            return;
        }

        // Validate bank account details for NGN currency
        if (formData.fiatCurrency === 'NGN') {
            if (!formData.accountNumber || formData.accountNumber.length !== 10) {
                setError('Please enter a valid 10-digit account number');
                return;
            }
            if (!formData.accountName.trim()) {
                setError('Please enter the account name');
                return;
            }
            if (!formData.bankName) {
                setError('Please select a bank');
                return;
            }
            if (!accountVerified) {
                setError('Please wait for account verification to complete');
                return;
            }
        }

        setIsLoading(true);
        setError(null);
        setCurrentStep('form');

        try {
            // Generate transaction ID
            const transactionId = generateEthereumTransactionId();
            const fiatAmount = (amount * 1800).toString(); // Mock exchange rate

            console.log('🚀 Starting fiat conversion transaction...');
            console.log(`Amount: ${amount} ${formData.tokenIn}`);
            console.log(`Fiat: ${fiatAmount} ${formData.fiatCurrency}`);
            console.log(`Transaction ID: ${transactionId}`);

            setCurrentStep('approving');

            // Check if token approval is needed
            const tokenInfo = ETHEREUM_TOKENS[formData.tokenIn as keyof typeof ETHEREUM_TOKENS];
            if (!tokenInfo) {
                throw new Error('Unsupported token');
            }

            // This will handle approval if needed (approve FIAT_BRIDGE to spend tokens)
            await checkAndApproveEthereumToken(
                tokenInfo.address as `0x${string}`,
                connection.address as `0x${string}`,
                ETHEREUM_CONTRACTS.FIAT_BRIDGE as `0x${string}`, // Correct spender address
                formData.amountIn
            );

            setCurrentStep('transacting');

            // Initiate the actual blockchain transaction
            const txHash = await initiateEthereumFiatTransaction(
                connection.address as `0x${string}`,
                {
                    token: formData.tokenIn,
                    amount: formData.amountIn,
                    fiatAmount,
                    fiatCurrency: formData.fiatCurrency,
                    transactionId,
                    // Bank account details for off-chain processing
                    accountNumber: formData.accountNumber,
                    accountName: formData.accountName,
                    bankName: formData.bankName,
                    bankCode: formData.bankCode
                }
            );

            const result = {
                transactionId,
                txHash,
                amount: formData.amountIn,
                token: formData.tokenIn,
                fiatCurrency: formData.fiatCurrency,
                estimatedFiat: fiatAmount,
                status: 'confirmed'
            };

            if (onExecute) {
                onExecute(result);
            }

            setSuccess('Transaction confirmed on blockchain!');

            // Reset form after successful submission
            setTimeout(() => {
                // Reset form
                setFormData({
                    tokenIn: 'USDT',
                    amountIn: '',
                    fiatCurrency: 'NGN',
                    accountNumber: '',
                    accountName: '',
                    bankName: '',
                    bankCode: ''
                });
                setCurrentStep('form');
                onClose();
            }, 3000);

        } catch (error: unknown) {
            console.error('Fiat conversion error:', error);

            // Handle user rejection specifically
            const errorObj = error as { message?: string; code?: number };
            if (errorObj?.message?.includes('User rejected') || errorObj?.code === 4001) {
                setError('Transaction was cancelled by user');
            } else {
                setError(error instanceof Error ? error.message : 'Failed to process transaction');
            }

            setCurrentStep('form');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    const selectedCurrency = CURRENCIES.find(c => c.code === formData.fiatCurrency);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className={`relative w-full max-w-md mx-4 rounded-xl shadow-2xl transition-colors duration-300 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                }`}>
                {/* Header */}
                <div className={`flex items-center justify-between p-6 border-b transition-colors duration-300 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'
                    }`}>
                    <h2 className={`text-xl font-semibold flex items-center transition-colors duration-300 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'
                        }`}>
                        <DollarSign className="w-5 h-5 mr-2" />
                        Convert to Fiat
                    </h2>
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 ${isDarkMode
                            ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Token Selection */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className={`text-sm font-medium transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                Token
                            </label>
                            {connection.isConnected && (
                                <span className={`text-xs transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                    }`}>
                                    Balance: {loadingBalance ? 'Loading...' : `${parseFloat(tokenBalance).toFixed(4)} ${formData.tokenIn}`}
                                </span>
                            )}
                        </div>
                        <select
                            value={formData.tokenIn}
                            onChange={(e) => setFormData(prev => ({ ...prev, tokenIn: e.target.value }))}
                            className={`w-full rounded-lg px-3 py-3 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode
                                ? 'bg-gray-700 border border-gray-600 text-gray-100 focus:border-blue-500'
                                : 'bg-gray-50 border border-gray-200 text-gray-900 focus:border-blue-500'
                                }`}
                        >
                            {SUPPORTED_TOKENS.map((token) => (
                                <option key={token.symbol} value={token.symbol}>
                                    {token.symbol} - {token.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Amount Input */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className={`text-sm font-medium transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                Amount
                            </label>
                            {parseFloat(tokenBalance) > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, amountIn: tokenBalance }))}
                                    className={`text-xs px-2 py-1 rounded transition-colors duration-200 ${isDarkMode
                                        ? 'text-blue-400 hover:text-blue-300 hover:bg-blue-900/20'
                                        : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                                        }`}
                                >
                                    Max
                                </button>
                            )}
                        </div>
                        <input
                            type="number"
                            step="0.000001"
                            value={formData.amountIn}
                            onChange={(e) => setFormData(prev => ({ ...prev, amountIn: e.target.value }))}
                            className={`w-full rounded-lg px-3 py-3 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode
                                ? 'bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-400 focus:border-blue-500'
                                : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                                }`}
                            placeholder="0.0"
                            required
                        />
                    </div>

                    {/* Currency Selection */}
                    <div>
                        <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                            Currency
                        </label>
                        <select
                            value={formData.fiatCurrency}
                            onChange={(e) => setFormData(prev => ({ ...prev, fiatCurrency: e.target.value }))}
                            className={`w-full rounded-lg px-3 py-3 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode
                                ? 'bg-gray-700 border border-gray-600 text-gray-100 focus:border-blue-500'
                                : 'bg-gray-50 border border-gray-200 text-gray-900 focus:border-blue-500'
                                }`}
                        >
                            {CURRENCIES.map(currency => (
                                <option key={currency.code} value={currency.code}>
                                    {currency.symbol} {currency.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Bank Account Details - Only for NGN */}
                    {formData.fiatCurrency === 'NGN' && (
                        <div className={`p-4 rounded-lg border transition-colors duration-300 ${isDarkMode ? 'bg-gray-800/50 border-gray-600/30' : 'bg-blue-50 border-blue-200'}`}>
                            <h3 className={`text-sm font-medium mb-3 transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Nigerian Bank Account Details
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className={`block text-xs font-medium mb-1 transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        Account Number
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={formData.accountNumber}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                                                setFormData(prev => ({ ...prev, accountNumber: value }));
                                                setAccountVerified(false); // Reset verification when account number changes
                                            }}
                                            className={`w-full rounded-lg px-3 py-2 pr-8 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode
                                                ? 'bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-400 focus:border-blue-500'
                                                : 'bg-white border border-gray-200 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                                                }`}
                                            placeholder="0123456789"
                                            maxLength={10}
                                            required
                                        />
                                        {verifyingAccount && (
                                            <Loader2 className="absolute right-2 top-2.5 w-3 h-3 animate-spin text-blue-500" />
                                        )}
                                        {accountVerified && !verifyingAccount && (
                                            <CheckCircle className="absolute right-2 top-2.5 w-3 h-3 text-green-500" />
                                        )}
                                    </div>
                                    {formData.accountNumber.length > 0 && formData.accountNumber.length < 10 && (
                                        <div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                            {10 - formData.accountNumber.length} more digits needed
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className={`block text-xs font-medium mb-1 transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        Account Name
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.accountName}
                                        onChange={(e) => setFormData(prev => ({ ...prev, accountName: e.target.value }))}
                                        className={`w-full rounded-lg px-3 py-2 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode
                                            ? 'bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-400 focus:border-blue-500'
                                            : 'bg-white border border-gray-200 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                                            }`}
                                        placeholder={accountVerified ? 'Verified account name' : 'Account name will auto-fill'}
                                        readOnly={accountVerified}
                                        required
                                    />
                                    {accountVerified && (
                                        <div className={`text-xs mt-1 flex items-center ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                                            <CheckCircle className="w-3 h-3 mr-1" />
                                            Account verified successfully
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className={`block text-xs font-medium mb-1 transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        Bank Name
                                    </label>
                                    <select
                                        value={formData.bankName}
                                        onChange={(e) => {
                                            const selectedBank = banks.find(bank => bank.name === e.target.value);
                                            setFormData(prev => ({
                                                ...prev,
                                                bankName: e.target.value,
                                                bankCode: selectedBank?.code || ''
                                            }));
                                            setAccountVerified(false); // Reset verification when bank changes
                                        }}
                                        className={`w-full rounded-lg px-3 py-2 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode
                                            ? 'bg-gray-700 border border-gray-600 text-gray-100 focus:border-blue-500'
                                            : 'bg-white border border-gray-200 text-gray-900 focus:border-blue-500'
                                            }`}
                                        required
                                        disabled={loadingBanks}
                                    >
                                        <option value="">{loadingBanks ? 'Loading banks...' : 'Select Bank'}</option>
                                        {banks.map((bank, index) => (
                                            <option key={`${bank.code}-${index}`} value={bank.name}>
                                                {bank.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className={`block text-xs font-medium mb-1 transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        Bank Code
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.bankCode}
                                        readOnly
                                        className={`w-full rounded-lg px-3 py-2 text-sm transition-all duration-200 ${isDarkMode
                                            ? 'bg-gray-600 border border-gray-600 text-gray-300'
                                            : 'bg-gray-100 border border-gray-200 text-gray-600'
                                            }`}
                                        placeholder="Auto-filled"
                                    />
                                </div>
                            </div>

                            <div className={`text-xs mt-2 transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                💡 Your Nigerian Naira will be sent directly to this bank account
                            </div>
                        </div>
                    )}

                    {/* Estimated Amount */}
                    {formData.amountIn && (
                        <div className={`p-4 rounded-lg transition-colors duration-300 ${isDarkMode ? 'bg-gray-700/50 border border-gray-600/30' : 'bg-green-50 border border-green-200'
                            }`}>
                            <div className={`text-sm font-medium transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                Estimated Amount
                            </div>
                            <div className={`text-xl font-bold transition-colors duration-300 ${isDarkMode ? 'text-green-400' : 'text-green-600'
                                }`}>
                                {selectedCurrency?.symbol}{(parseFloat(formData.amountIn) * 1800).toLocaleString()}
                            </div>
                            <div className={`text-xs transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                Rate: 1 {formData.tokenIn} ≈ 1,800 {formData.fiatCurrency}
                            </div>
                        </div>
                    )}

                    {/* Transaction Progress */}
                    {isLoading && (
                        <div className={`p-4 rounded-lg border transition-colors duration-300 ${isDarkMode
                            ? 'bg-blue-900/20 border-blue-600/30 text-blue-400'
                            : 'bg-blue-50 border-blue-200 text-blue-600'
                            }`}>
                            <div className="flex items-center space-x-3">
                                <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                                <div className="text-sm">
                                    {currentStep === 'approving' && 'Approving token spending...'}
                                    {currentStep === 'transacting' && 'Processing blockchain transaction...'}
                                    {currentStep === 'form' && 'Preparing transaction...'}
                                </div>
                            </div>
                            <div className={`text-xs mt-2 ${isDarkMode ? 'text-blue-300' : 'text-blue-500'}`}>
                                Please confirm the transaction in your wallet
                            </div>
                        </div>
                    )}

                    {/* Error Display */}
                    {error && (
                        <div className={`p-3 rounded-lg border transition-colors duration-300 ${isDarkMode
                            ? 'bg-red-900/20 border-red-600/30 text-red-400'
                            : 'bg-red-50 border-red-200 text-red-600'
                            }`}>
                            <div className="flex items-center">
                                <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                                <span className="text-sm">{error}</span>
                            </div>
                        </div>
                    )}

                    {/* Success Display */}
                    {success && (
                        <div className={`p-3 rounded-lg border transition-colors duration-300 ${isDarkMode
                            ? 'bg-green-900/20 border-green-600/30 text-green-400'
                            : 'bg-green-50 border-green-200 text-green-600'
                            }`}>
                            <div className="flex items-center">
                                <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                                <span className="text-sm">{success}</span>
                            </div>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading || !connection.isConnected || parseFloat(formData.amountIn) <= 0}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 hover:scale-[1.02]"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>
                                    {currentStep === 'approving' && 'Approving...'}
                                    {currentStep === 'transacting' && 'Converting...'}
                                    {currentStep === 'form' && 'Processing...'}
                                </span>
                            </>
                        ) : (
                            <>
                                <DollarSign className="w-4 h-4" />
                                <span>Convert Now</span>
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
