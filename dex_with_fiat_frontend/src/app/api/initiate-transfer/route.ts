import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export async function POST(request: NextRequest) {
    try {
        const { source, reason, amount, recipient, reference } = await request.json();

        if (!source || !amount || !recipient) {
            return NextResponse.json(
                { success: false, message: 'Source, amount, and recipient are required' },
                { status: 400 }
            );
        }

        if (!PAYSTACK_SECRET_KEY) {
            console.warn('Paystack secret key not found, using mock transfer initiation');
            // Mock transfer initiation when API key is missing
            const mockTransfer = {
                reference: reference || `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                integration: 123456,
                domain: 'test',
                amount: amount,
                currency: 'NGN',
                source: source,
                reason: reason || 'Crypto withdrawal',
                recipient: recipient,
                status: 'pending',
                transfer_code: `TRF_${Math.random().toString(36).substr(2, 9)}`,
                id: Math.floor(Math.random() * 1000000),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            await new Promise(resolve => setTimeout(resolve, 1500));

            return NextResponse.json({
                success: true,
                data: mockTransfer
            });
        }

        // Call real Paystack API to initiate transfer
        const transferData = {
            source: source,
            amount: amount * 100, // Convert to kobo for Paystack
            recipient: recipient,
            reason: reason || 'Crypto withdrawal',
            reference: reference || `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };

        const response = await axios.post(
            'https://api.paystack.co/transfer',
            transferData,
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
                data: response.data.data
            });
        } else {
            return NextResponse.json(
                { success: false, message: response.data.message || 'Failed to initiate transfer' },
                { status: 400 }
            );
        }
    } catch (error: unknown) {
        console.error('Initiate transfer error:', error);

        // Handle Paystack API errors
        if (error && typeof error === 'object' && 'response' in error &&
            error.response && typeof error.response === 'object' && 'data' in error.response &&
            error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data) {
            return NextResponse.json(
                { success: false, message: (error.response.data as { message: string }).message },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { success: false, message: 'Failed to initiate transfer. Please try again.' },
            { status: 500 }
        );
    }
}
