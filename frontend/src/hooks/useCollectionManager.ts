// src/hooks/useCollectionManager.ts
/* eslint-disable */
import { useMutation, useQuery } from '@tanstack/react-query'
import { useWallet } from '@solana/wallet-adapter-react'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import {
  createNft,
  fetchMetadata,
  findMetadataPda,
  findMasterEditionPda,
  mplTokenMetadata,
} from '@metaplex-foundation/mpl-token-metadata'
import { generateSigner, publicKey as umiPublicKey, percentAmount } from '@metaplex-foundation/umi'
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters'
import { toast } from 'sonner'

// Local storage helpers
const getLocalStorageItem = (key: string): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(key)
}

const setLocalStorageItem = (key: string, value: string): void => {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, value)
}

// Default collection suffix
const COLLECTION_SUFFIX = ' Collection'

// Interface for collection parameters
export interface CollectionParams {
  name: string
  symbol?: string
  description?: string
  image?: string
  sellerFeeBasisPoints?: number
}

// Interface for getting user collection
export interface UserCollectionResult {
  mint: string
  isNew: boolean
  metadata: {
    name: string
    symbol: string
    uri: string
  }
}

export const useCollectionManager = () => {
  const wallet = useWallet()

  // Helper to get the user's storage key
  const getUserStorageKey = () => {
    if (!wallet.publicKey) return null
    return `collection_${wallet.publicKey.toString()}`
  }

  // Get the user's saved collection from local storage
  const getSavedCollection = (): string | null => {
    const key = getUserStorageKey()
    if (!key) return null
    return getLocalStorageItem(key)
  }

  // Save a collection to local storage
  const saveCollection = (mint: string) => {
    const key = getUserStorageKey()
    if (!key) return
    setLocalStorageItem(key, mint)
  }

  // Create a new collection for the user
  const createCollection = async (params: CollectionParams): Promise<UserCollectionResult> => {
    if (!wallet.publicKey || !wallet.signTransaction || !wallet.connected) {
      throw new Error("Wallet not connected or doesn't support signing")
    }

    // Create a Umi instance connected to the cluster
    const endpoint = process.env.NEXT_PUBLIC_RPC_ENDPOINT || 'https://api.devnet.solana.com'
    const umi = createUmi(endpoint)

    // Use wallet adapter identity
    umi.use(walletAdapterIdentity(wallet))
    umi.use(mplTokenMetadata())

    // Generate new mint keypair for the collection
    const collectionMint = generateSigner(umi)

    // Prepare the collection name and other fields
    const collectionName = params.name.endsWith(COLLECTION_SUFFIX) ? params.name : `${params.name}${COLLECTION_SUFFIX}`

    const collectionSymbol = params.symbol || 'COLL'

    // Generate a default image if none provided
    const imageUrl = params.image || getRandomImageUrl(collectionName)

    // Create the metadata URI
    const uri = createMetadataUri(
      collectionName,
      params.description || `Collection of NFTs for ${params.name}`,
      imageUrl,
    )

    console.log('🔑 Collection Mint:', collectionMint.publicKey.toString())
    console.log('Creating Collection with the following details:')
    console.log('Name:', collectionName)
    console.log('Symbol:', collectionSymbol)
    console.log('URI:', uri)
    console.log('Seller Fee Basis Points:', percentAmount(params.sellerFeeBasisPoints || 550, 2))

    // Create the collection NFT
    await createNft(umi, {
      mint: collectionMint,
      name: collectionName,
      symbol: collectionSymbol,
      uri: uri,
      sellerFeeBasisPoints: percentAmount(params.sellerFeeBasisPoints || 550, 2),
      creators: [
        {
          address: umi.identity.publicKey,
          verified: true,
          share: 100,
        },
      ],
      collectionDetails: { __kind: 'V1', size: 0 }, // Initialize as an empty collection
    }).sendAndConfirm(umi)

    // Save to local storage
    saveCollection(collectionMint.publicKey.toString())

    // verify the collection

    console.log('✅ Created new collection:', collectionMint.publicKey.toString())

    return {
      mint: collectionMint.publicKey.toString(),
      isNew: true,
      metadata: {
        name: collectionName,
        symbol: collectionSymbol,
        uri: uri,
      },
    }
  }

  // Get user collection, creating a new one if needed
  const getUserCollection = async (params: CollectionParams): Promise<UserCollectionResult> => {
    if (!wallet.publicKey || !wallet.signTransaction || !wallet.connected) {
      throw new Error("Wallet not connected or doesn't support signing")
    }

    // Check if we have a saved collection
    const savedCollection = getSavedCollection()

    if (savedCollection) {
      try {
        // Create a Umi instance connected to the cluster
        const endpoint = process.env.NEXT_PUBLIC_RPC_ENDPOINT || 'https://api.devnet.solana.com'
        const umi = createUmi(endpoint)
        umi.use(walletAdapterIdentity(wallet))
        umi.use(mplTokenMetadata())

        // Verify collection exists and is valid
        const metadataPda = findMetadataPda(umi, {
          mint: umiPublicKey(savedCollection),
        })

        const metadata = await fetchMetadata(umi, metadataPda)

        // Collection exists, return it
        console.log('✅ Using existing collection:', savedCollection)

        return {
          mint: savedCollection,
          isNew: false,
          metadata: {
            name: metadata.name,
            symbol: metadata.symbol,
            uri: metadata.uri,
          },
        }
      } catch (error) {
        console.error('Saved collection not valid, creating new one', error)
        // Will fall through to create a new collection
      }
    }

    // If we got here, we need to create a new collection
    return createCollection(params)
  }

  // Create a mutation for getting/creating user collection
  const getUserCollectionMutation = useMutation({
    mutationFn: getUserCollection,
    onError: (error: Error) => {
      toast.error(`Failed to get/create collection: ${error.message}`)
    },
  })

  // Create a query to get the current user collection
  const userCollectionQuery = useQuery({
    queryKey: ['userCollection', wallet.publicKey?.toString()],
    queryFn: async () => {
      if (!wallet.publicKey) {
        return null
      }

      const savedCollection = getSavedCollection()
      if (!savedCollection) {
        return null
      }

      // Create a Umi instance
      const endpoint = process.env.NEXT_PUBLIC_RPC_ENDPOINT || 'https://api.devnet.solana.com'
      const umi = createUmi(endpoint)
      umi.use(mplTokenMetadata())

      try {
        // Fetch metadata to verify collection exists
        const metadataPda = findMetadataPda(umi, {
          mint: umiPublicKey(savedCollection),
        })

        const metadata = await fetchMetadata(umi, metadataPda)

        return {
          mint: savedCollection,
          metadata: {
            name: metadata.name,
            symbol: metadata.symbol,
            uri: metadata.uri,
          },
        }
      } catch (error) {
        console.error('Error fetching collection metadata:', error)
        return null
      }
    },
    enabled: !!wallet.publicKey,
  })

  return {
    createCollection: createCollection,
    getUserCollection: getUserCollectionMutation,
    currentCollection: userCollectionQuery.data,
    isLoading: userCollectionQuery.isLoading,
  }
}

// Helper function to create a metadata URI
function createMetadataUri(name: string, description: string, image: string): string {
  // In a real implementation, this would upload metadata to IPFS or Arweave
  return 'https://sidd-metadata.s3.ap-south-1.amazonaws.com/metadata-1742751740128.json'
}

// Helper function to get a random image URL
function getRandomImageUrl(name: string): string {
  const seed = Array.from(name).reduce((acc, char) => acc + char.charCodeAt(0), 0) % 1000
  return `https://picsum.photos/seed/${seed}/300/300`
}
