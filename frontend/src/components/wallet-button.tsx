'use client'

import { useEffect, useState } from 'react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'

export function WalletButton() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <button
        type="button"
        className="wallet-button"
        disabled
        aria-label="Loading wallet connection"
      >
        Connect
      </button>
    )
  }

  return <WalletMultiButton className="wallet-button" />
}