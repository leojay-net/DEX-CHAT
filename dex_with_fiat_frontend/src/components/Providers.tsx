'use client';

import { ReactNode } from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { wagmiConfig } from '@/lib/wagmiConfig';
import { ThemeProvider } from '@/contexts/ThemeContext';

const queryClient = new QueryClient();

interface ProvidersProps {
    children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
    return (
        <ThemeProvider>
            <PrivyProvider
                appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || 'your_privy_app_id_here'}
                config={{
                    appearance: {
                        theme: 'dark',
                        accentColor: '#676FFF',
                    },
                    embeddedWallets: {
                        createOnLogin: 'users-without-wallets',
                    },
                }}
            >
                <QueryClientProvider client={queryClient}>
                    <WagmiProvider config={wagmiConfig}>
                        {children}
                    </WagmiProvider>
                </QueryClientProvider>
            </PrivyProvider>
        </ThemeProvider>
    );
}
