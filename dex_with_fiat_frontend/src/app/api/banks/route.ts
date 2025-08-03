import { NextResponse } from 'next/server';
import axios from 'axios';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export async function GET() {
    try {
        if (!PAYSTACK_SECRET_KEY) {
            console.warn('Paystack secret key not found, using fallback banks');
            // Fallback to a minimal set of Nigerian banks if API key is missing
            const fallbackBanks = [
                { id: 1, name: 'Access Bank', code: '044', active: true, country: 'Nigeria', currency: 'NGN', type: 'nuban' },
                { id: 2, name: 'GTBank', code: '058', active: true, country: 'Nigeria', currency: 'NGN', type: 'nuban' },
                { id: 3, name: 'First Bank', code: '011', active: true, country: 'Nigeria', currency: 'NGN', type: 'nuban' },
                { id: 4, name: 'Zenith Bank', code: '057', active: true, country: 'Nigeria', currency: 'NGN', type: 'nuban' },
                { id: 5, name: 'UBA', code: '033', active: true, country: 'Nigeria', currency: 'NGN', type: 'nuban' },
                { id: 6, name: 'Fidelity Bank', code: '070', active: true, country: 'Nigeria', currency: 'NGN', type: 'nuban' }
            ];

            return NextResponse.json({
                success: true,
                data: fallbackBanks
            });
        }

        // Call real Paystack API to get Nigerian banks
        const response = await axios.get('https://api.paystack.co/bank?country=nigeria', {
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.data.status) {
            return NextResponse.json({
                success: true,
                data: response.data.data
            });
        } else {
            throw new Error('Paystack API returned error status');
        }
    } catch (error) {
        console.error('Error fetching banks from Paystack:', error);

        // Fallback to predefined banks if Paystack API fails
        const fallbackBanks = [
            { id: 1, name: 'Access Bank', code: '044', active: true, country: 'Nigeria', currency: 'NGN', type: 'nuban' },
            { id: 2, name: 'GTBank', code: '058', active: true, country: 'Nigeria', currency: 'NGN', type: 'nuban' },
            { id: 3, name: 'First Bank', code: '011', active: true, country: 'Nigeria', currency: 'NGN', type: 'nuban' },
            { id: 4, name: 'Zenith Bank', code: '057', active: true, country: 'Nigeria', currency: 'NGN', type: 'nuban' },
            { id: 5, name: 'UBA', code: '033', active: true, country: 'Nigeria', currency: 'NGN', type: 'nuban' },
            { id: 6, name: 'Fidelity Bank', code: '070', active: true, country: 'Nigeria', currency: 'NGN', type: 'nuban' },
            { id: 7, name: 'Union Bank', code: '032', active: true, country: 'Nigeria', currency: 'NGN', type: 'nuban' },
            { id: 8, name: 'Sterling Bank', code: '232', active: true, country: 'Nigeria', currency: 'NGN', type: 'nuban' },
            { id: 9, name: 'Stanbic IBTC Bank', code: '221', active: true, country: 'Nigeria', currency: 'NGN', type: 'nuban' },
            { id: 10, name: 'Wema Bank', code: '035', active: true, country: 'Nigeria', currency: 'NGN', type: 'nuban' }
        ];

        return NextResponse.json({
            success: true,
            data: fallbackBanks
        });
    }
}
