import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export async function POST(request: NextRequest) {
    try {
        const payload = await request.text();
        const signature = request.headers.get('x-paystack-signature');

        if (!PAYSTACK_SECRET_KEY) {
            console.warn('Paystack secret key not found, skipping webhook verification');
            return NextResponse.json({ received: true });
        }

        if (!signature) {
            return NextResponse.json(
                { message: 'No signature provided' },
                { status: 401 }
            );
        }

        // Verify signature
        const hash = crypto
            .createHmac('sha512', PAYSTACK_SECRET_KEY)
            .update(payload)
            .digest('hex');

        if (hash !== signature) {
            console.error('Invalid webhook signature');
            return NextResponse.json(
                { message: 'Invalid signature' },
                { status: 401 }
            );
        }

        const event = JSON.parse(payload);
        console.log('Received Paystack webhook:', event.event);

        // Handle different event types
        switch (event.event) {
            case 'transfer.success':
                console.log('Transfer successful:', {
                    reference: event.data.reference,
                    amount: event.data.amount,
                    recipient: event.data.recipient,
                    status: event.data.status
                });
                // Here you would typically update your database
                // and potentially call the smart contract to confirm the transaction
                break;

            case 'transfer.failed':
                console.log('Transfer failed:', {
                    reference: event.data.reference,
                    amount: event.data.amount,
                    recipient: event.data.recipient,
                    status: event.data.status,
                    failure_reason: event.data.failure_reason
                });
                // Handle failed transfer - potentially trigger refund
                break;

            case 'transfer.reversed':
                console.log('Transfer reversed:', {
                    reference: event.data.reference,
                    amount: event.data.amount,
                    recipient: event.data.recipient,
                    status: event.data.status
                });
                // Handle reversed transfer
                break;

            default:
                console.log('Unhandled webhook event:', event.event);
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Webhook processing error:', error);
        return NextResponse.json(
            { message: 'Webhook processing failed' },
            { status: 500 }
        );
    }
}
