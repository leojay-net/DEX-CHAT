import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export async function POST(request: NextRequest) {
    try {
        const { accountNumber, bankCode } = await request.json();

        if (!accountNumber || !bankCode) {
            return NextResponse.json(
                { success: false, message: 'Account number and bank code are required' },
                { status: 400 }
            );
        }

        if (!PAYSTACK_SECRET_KEY) {
            console.warn('Paystack secret key not found, using mock verification');
            // Mock verification when API key is missing
            const mockVerification = {
                account_number: accountNumber,
                account_name: 'John Doe', // Mock verified name
                bank_id: parseInt(bankCode)
            };

            await new Promise(resolve => setTimeout(resolve, 1000));

            return NextResponse.json({
                success: true,
                data: mockVerification
            });
        }

        // Call real Paystack API to verify account
        const response = await axios.get(
            `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
            {
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (response.data.status && response.data.data) {
            return NextResponse.json({
                success: true,
                data: {
                    account_number: response.data.data.account_number,
                    account_name: response.data.data.account_name,
                    bank_id: parseInt(bankCode)
                }
            });
        } else {
            return NextResponse.json(
                { success: false, message: response.data.message || 'Account verification failed' },
                { status: 400 }
            );
        }
    } catch (error: unknown) {
        console.error('Account verification error:', error);

        // Check if it's a Paystack API error
        if (error && typeof error === 'object' && 'response' in error &&
            error.response && typeof error.response === 'object' && 'status' in error.response &&
            error.response.status === 422) {
            return NextResponse.json(
                { success: false, message: 'Invalid account number or bank code' },
                { status: 400 }
            );
        }

        if (error && typeof error === 'object' && 'response' in error &&
            error.response && typeof error.response === 'object' && 'data' in error.response &&
            error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data) {
            return NextResponse.json(
                { success: false, message: (error.response.data as { message: string }).message },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { success: false, message: 'Account verification failed. Please try again.' },
            { status: 500 }
        );
    }
}
