'use client';

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import ClientOnly from './ClientOnly';

export function ConnectWalletButton() {
  return (
    <ClientOnly fallback={<button className="bg-blue-500 text-white px-4 py-2 rounded-md">Connect Wallet</button>}>
      <WalletMultiButton />
    </ClientOnly>
  );
} 