'use client';

import SimpleEthereumChatInterface from '@/components/SimpleEthereumChatInterface';
import { SimpleEthereumWalletProvider } from '@/contexts/SimpleEthereumWalletContext';

export default function EthereumPage() {
    return (
        <SimpleEthereumWalletProvider>
            <main className="h-screen w-screen overflow-hidden">
                <SimpleEthereumChatInterface />
            </main>
        </SimpleEthereumWalletProvider>
    );
}
