/* eslint-disable */
import { useMemo } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { AnchorProvider, Program, web3 } from '@coral-xyz/anchor'

import idl from '@/utils/idl/hack_nft.json'
import { HackNft } from '@/utils/types/hack_nft'
const PROGRAM_ID = new web3.PublicKey('711gctwBN1aGqzRhQbDD3qiescrzg4m9Zjj1ZGndLDis')
const NETWORK = 'https://api.devnet.solana.com'

export const useProgram = () => {
  const wallet = useWallet()

  const connection = useMemo(() => {
    return new web3.Connection(NETWORK, 'confirmed')
  }, [])

  const provider = useMemo(() => {
    if (!wallet || !wallet.publicKey) return null

    return new AnchorProvider(connection, wallet as any, {
      preflightCommitment: 'confirmed',
    })
  }, [wallet, connection])

  const program = useMemo(() => {
    if (!provider) return null

    try {
      // Make sure idl is properly loaded
      if (!idl || typeof idl !== 'object') {
        console.error('Invalid IDL format:', idl)
        return null
      }

      console.log('IDL:', idl)

      return new Program<HackNft>(idl as any, provider)

      // return new Program(idl as any, PROGRAM_ID, provider);
    } catch (error) {
      console.error('Error initializing program:', error)
      return null
    }
  }, [provider])

  return { program, provider }
}
