'use client';

import { SimpleEthereumWalletProvider } from '@/contexts/SimpleEthereumWalletContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import SimpleEthereumChatInterface from '@/components/SimpleEthereumChatInterface';

export default function ChatPage() {
    return (
        <ThemeProvider>
            <SimpleEthereumWalletProvider>
                <main className="h-screen w-screen overflow-hidden">
                    <SimpleEthereumChatInterface />
                </main>
            </SimpleEthereumWalletProvider>
        </ThemeProvider>
    );
}
