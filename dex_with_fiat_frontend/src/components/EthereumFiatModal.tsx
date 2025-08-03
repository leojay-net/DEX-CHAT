'use client';

import { useState, useEffect, useCallback } from 'react';
import { useEthereumWallet } from '@/contexts/EthereumWalletContext';
import {
    initiateEthereumFiatTransaction,
    generateEthereumTransactionId,
    getEthereumTokenBalance
} from '@/lib/ethereumContract';
import { paystackService } from '@/lib/paystack';
import { ETHEREUM_TOKENS } from '@/lib/ethereum';
import { X, DollarSign, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

interface Bank {
    id: number;
    name: string;
    code: string;
}

interface BankAccount {
    bankCode: string;
    bankName: string;
    accountNumber: string;
    accountName: string;
}

interface EthereumFiatModalProps {
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
}

const CURRENCIES = [
    { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' }
];

export default function EthereumFiatModal({ isOpen, onClose, onExecute }: EthereumFiatModalProps) {
    const { connection } = useEthereumWallet();
    const [formData, setFormData] = useState({
        tokenIn: 'USDT',
        amountIn: '',
        fiatCurrency: 'NGN'
    });
    const [bankAccount, setBankAccount] = useState<BankAccount>({
        bankCode: '',
        bankName: '',
        accountNumber: '',
        accountName: ''
    });
    const [banks, setBanks] = useState<Bank[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [estimatedFiat, setEstimatedFiat] = useState<number>(0);
    const [tokenBalance, setTokenBalance] = useState<string>('0');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Load banks on mount
    useEffect(() => {
        const loadBanks = async () => {
            try {
                const bankList = await paystackService.listBanks();
                setBanks(bankList);
            } catch (error) {
                console.error('Failed to load banks:', error);
                setError('Failed to load bank list');
            }
        };

        if (isOpen) {
            loadBanks();
        }
    }, [isOpen]);

    // Load token balance when connected and token changes
    useEffect(() => {
        const loadBalance = async () => {
            if (connection.isConnected && connection.address && formData.tokenIn) {
                try {
                    const tokenInfo = ETHEREUM_TOKENS[formData.tokenIn as keyof typeof ETHEREUM_TOKENS];
                    if (tokenInfo) {
                        const balance = await getEthereumTokenBalance(
                            tokenInfo.address,
                            connection.address as `0x${string}`
                        );
                        setTokenBalance(balance);
                    }
                } catch (error) {
                    console.error('Failed to load token balance:', error);
                }
            }
        };

        loadBalance();
    }, [connection.isConnected, connection.address, formData.tokenIn]);

    // Calculate estimated fiat amount
    useEffect(() => {
        const calculateFiatEstimate = () => {
            if (formData.amountIn && formData.tokenIn && formData.fiatCurrency) {
                try {
                    // Simple mock conversion rate - in production, this would use real API
                    const mockRate = formData.fiatCurrency === 'NGN' ? 1800 : 1.1; // 1 USDT = 1800 NGN or 1.1 USD
                    const estimate = parseFloat(formData.amountIn) * mockRate;
                    setEstimatedFiat(estimate);
                } catch (error) {
                    console.error('Failed to calculate estimate:', error);
                    setEstimatedFiat(0);
                }
            } else {
                setEstimatedFiat(0);
            }
        };

        const debounceTimer = setTimeout(calculateFiatEstimate, 500);
        return () => clearTimeout(debounceTimer);
    }, [formData.amountIn, formData.tokenIn, formData.fiatCurrency]);

    const verifyBankAccount = useCallback(async () => {
        if (!bankAccount.bankCode || !bankAccount.accountNumber) {
            setError('Please select a bank and enter account number');
            return;
        }

        setIsVerifying(true);
        setError(null);

        try {
            const verification = await paystackService.verifyAccount(bankAccount.accountNumber, bankAccount.bankCode);
            setBankAccount(prev => ({
                ...prev,
                accountName: verification.account_name
            }));
            setSuccess('Account verified successfully!');
        } catch (error) {
            setError('Failed to verify account. Please check the details and try again.');
            console.error('Account verification error:', error);
        } finally {
            setIsVerifying(false);
        }
    }, [bankAccount.bankCode, bankAccount.accountNumber]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!connection.isConnected || !connection.address) {
            setError('Please connect your wallet first');
            return;
        }

        if (!bankAccount.accountName) {
            setError('Please verify your bank account first');
            return;
        }

        if (parseFloat(formData.amountIn) <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const transactionId = generateEthereumTransactionId();

            // Initiate the on-chain transaction
            const txHash = await initiateEthereumFiatTransaction(
                connection.address as `0x${string}`,
                {
                    token: formData.tokenIn,
                    amount: formData.amountIn,
                    fiatAmount: estimatedFiat.toString(),
                    fiatCurrency: formData.fiatCurrency,
                    transactionId,
                    accountNumber: bankAccount.accountNumber,
                    accountName: bankAccount.accountName,
                    bankName: bankAccount.bankName,
                    bankCode: bankAccount.bankCode
                }
            );

            // Create Paystack recipient (simplified for now)
            const recipientData = {
                name: bankAccount.accountName,
                account_number: bankAccount.accountNumber,
                bank_code: bankAccount.bankCode,
                currency: formData.fiatCurrency
            };

            // For now, just log the recipient data (Paystack integration would happen here)
            console.log('Creating recipient:', recipientData);

            // Create transfer (simplified for now)
            const transferData = {
                amount: Math.floor(estimatedFiat * 100), // Convert to kobo/cents
                recipient: `recipient_${transactionId}`,
                reason: `Crypto to fiat conversion - ${transactionId}`,
                reference: transactionId
            };

            console.log('Creating transfer:', transferData);

            const result = {
                transactionId,
                txHash,
                amount: formData.amountIn,
                token: formData.tokenIn,
                fiatCurrency: formData.fiatCurrency,
                estimatedFiat: estimatedFiat.toString(),
                status: 'confirmed'
            };

            if (onExecute) {
                onExecute(result);
            }

            setSuccess('Fiat conversion initiated successfully!');

            // Reset form after successful submission
            setTimeout(() => {
                setFormData({ tokenIn: 'USDT', amountIn: '', fiatCurrency: 'NGN' });
                setBankAccount({ bankCode: '', bankName: '', accountNumber: '', accountName: '' });
                onClose();
            }, 2000);

        } catch (error) {
            console.error('Fiat conversion error:', error);
            setError(error instanceof Error ? error.message : 'Failed to initiate fiat conversion');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    const selectedCurrency = CURRENCIES.find(c => c.code === formData.fiatCurrency);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="relative w-full max-w-md mx-4 rounded-xl shadow-2xl bg-gray-800 border border-gray-700">
                <div className="flex items-center justify-between p-6 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-white flex items-center">
                        <DollarSign className="w-5 h-5 mr-2" />
                        Convert to Fiat
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg transition-all duration-200 hover:scale-110 text-gray-400 hover:text-gray-200 hover:bg-gray-700"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Token Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Token to Convert
                        </label>
                        <select
                            value={formData.tokenIn}
                            onChange={(e) => setFormData(prev => ({ ...prev, tokenIn: e.target.value }))}
                            className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                        >
                            {Object.entries(ETHEREUM_TOKENS).map(([key, token]) => (
                                <option key={key} value={key}>
                                    {token.symbol} - {token.name}
                                </option>
                            ))}
                        </select>
                        <div className="text-xs text-gray-400 mt-1">
                            Balance: {tokenBalance} {formData.tokenIn}
                        </div>
                    </div>

                    {/* Amount Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Amount
                        </label>
                        <input
                            type="number"
                            step="0.000001"
                            value={formData.amountIn}
                            onChange={(e) => setFormData(prev => ({ ...prev, amountIn: e.target.value }))}
                            className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                            placeholder="0.0"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, amountIn: tokenBalance }))}
                            className="text-xs text-blue-400 hover:text-blue-300 mt-1"
                        >
                            Use Max
                        </button>
                    </div>

                    {/* Currency Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Fiat Currency
                        </label>
                        <select
                            value={formData.fiatCurrency}
                            onChange={(e) => setFormData(prev => ({ ...prev, fiatCurrency: e.target.value }))}
                            className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                        >
                            {CURRENCIES.map(currency => (
                                <option key={currency.code} value={currency.code}>
                                    {currency.symbol} {currency.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Estimated Amount */}
                    {estimatedFiat > 0 && (
                        <div className="bg-gray-800 p-3 rounded-lg">
                            <div className="text-sm text-gray-300">Estimated Amount</div>
                            <div className="text-lg font-bold text-green-400">
                                {selectedCurrency?.symbol}{estimatedFiat.toLocaleString()}
                            </div>
                        </div>
                    )}

                    {/* Bank Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Bank
                        </label>
                        <select
                            value={bankAccount.bankCode}
                            onChange={(e) => {
                                const selectedBank = banks.find(b => b.code === e.target.value);
                                setBankAccount(prev => ({
                                    ...prev,
                                    bankCode: e.target.value,
                                    bankName: selectedBank?.name || '',
                                    accountName: '' // Reset account name when bank changes
                                }));
                            }}
                            className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                            required
                        >
                            <option value="">Select Bank</option>
                            {banks.map(bank => (
                                <option key={bank.code} value={bank.code}>
                                    {bank.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Account Number */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Account Number
                        </label>
                        <div className="flex space-x-2">
                            <input
                                type="text"
                                value={bankAccount.accountNumber}
                                onChange={(e) => setBankAccount(prev => ({
                                    ...prev,
                                    accountNumber: e.target.value,
                                    accountName: '' // Reset account name when number changes
                                }))}
                                className="flex-1 bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                                placeholder="1234567890"
                                required
                            />
                            <button
                                type="button"
                                onClick={verifyBankAccount}
                                disabled={isVerifying || !bankAccount.bankCode || !bankAccount.accountNumber}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                            >
                                {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
                            </button>
                        </div>
                    </div>

                    {/* Account Name Display */}
                    {bankAccount.accountName && (
                        <div className="bg-green-900/20 border border-green-600/30 p-3 rounded-lg">
                            <div className="flex items-center text-green-400">
                                <CheckCircle className="w-4 h-4 mr-2" />
                                <span className="font-medium">{bankAccount.accountName}</span>
                            </div>
                        </div>
                    )}

                    {/* Error Display */}
                    {error && (
                        <div className="bg-red-900/20 border border-red-600/30 p-3 rounded-lg">
                            <div className="flex items-center text-red-400">
                                <AlertCircle className="w-4 h-4 mr-2" />
                                <span>{error}</span>
                            </div>
                        </div>
                    )}

                    {/* Success Display */}
                    {success && (
                        <div className="bg-green-900/20 border border-green-600/30 p-3 rounded-lg">
                            <div className="flex items-center text-green-400">
                                <CheckCircle className="w-4 h-4 mr-2" />
                                <span>{success}</span>
                            </div>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading || !connection.isConnected || !bankAccount.accountName}
                        className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Processing...</span>
                            </>
                        ) : (
                            <>
                                <DollarSign className="w-4 h-4" />
                                <span>Convert to Fiat</span>
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
