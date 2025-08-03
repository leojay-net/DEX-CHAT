import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export async function POST(request: NextRequest) {
    try {
        const { type, name, account_number, bank_code, currency } = await request.json();

        if (!type || !name || !account_number || !bank_code || !currency) {
            return NextResponse.json(
                { success: false, message: 'All fields are required' },
                { status: 400 }
            );
        }

        if (!PAYSTACK_SECRET_KEY) {
            console.warn('Paystack secret key not found, using mock recipient creation');
            // Mock recipient creation when API key is missing
            const mockRecipient = {
                active: true,
                createdAt: new Date().toISOString(),
                currency: currency,
                domain: 'test',
                id: Math.floor(Math.random() * 1000000),
                integration: 123456,
                name: name,
                recipient_code: `RCP_${Math.random().toString(36).substr(2, 9)}`,
                type: type,
                updatedAt: new Date().toISOString(),
                is_deleted: false,
                details: {
                    authorization_code: null,
                    account_number: account_number,
                    account_name: name,
                    bank_code: bank_code,
                    bank_name: 'Mock Bank'
                }
            };

            await new Promise(resolve => setTimeout(resolve, 1000));

            return NextResponse.json({
                success: true,
                data: mockRecipient
            });
        }

        // Call real Paystack API to create recipient
        const response = await axios.post(
            'https://api.paystack.co/transferrecipient',
            {
                type: type,
                name: name,
                account_number: account_number,
                bank_code: bank_code,
                currency: currency
            },
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
                { success: false, message: response.data.message || 'Failed to create recipient' },
                { status: 400 }
            );
        }
    } catch (error: unknown) {
        console.error('Create recipient error:', error);

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
            { success: false, message: 'Failed to create recipient. Please try again.' },
            { status: 500 }
        );
    }
}
