/* eslint-disable */
import { useWallet } from '@solana/wallet-adapter-react'
import { useQuery } from '@tanstack/react-query'
import { useProgram } from './useProgram'
import { PublicKey } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import {
  fetchMetadata,
  findMetadataPda,
  mplTokenMetadata,
  fetchJsonMetadata,
} from '@metaplex-foundation/mpl-token-metadata'
import { publicKey } from '@metaplex-foundation/umi'

import { fromWeb3JsPublicKey, toWeb3JsPublicKey } from '@metaplex-foundation/umi-web3js-adapters'

export interface NFT {
  address: string
  mint: string
  name: string
  symbol?: string
  uri?: string
  image?: string
  description?: string
  attributes?: Array<{ trait_type: string; value: string }>
  collectionMint?: string
  price?: number
  maker?: string
  isListed?: boolean
  owner?: string
  animation_url?: string
}

// Fallback function to generate a deterministic image URL from mint address if metadata doesn't have one
const getImageUrlFromMint = (mint: string): string => {
  // Use a stable random number based on the mint address
  const seed = mint.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 1000
  return `https://picsum.photos/seed/${seed}/300/300`
}

// Marketplace PDA derivation function
const getMarketplacePda = (programId: PublicKey, name: string): PublicKey => {
  return PublicKey.findProgramAddressSync([Buffer.from('marketplace'), Buffer.from(name)], programId)[0]
}

export function useNfts() {
  const { program, provider } = useProgram()
  const wallet = useWallet()

  // Create UMI instance
  const umi = createUmi(provider?.connection.rpcEndpoint || 'https://api.devnet.solana.com').use(mplTokenMetadata())

  // Fetch user's NFTs with metadata
  const fetchUserNfts = async (): Promise<NFT[]> => {
    if (!provider || !wallet.publicKey) return []

    try {
      const connection = provider.connection
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(wallet.publicKey, {
        programId: TOKEN_PROGRAM_ID,
      })

      console.log('Token Accounts:', tokenAccounts)

      // Filter for token accounts with 1 token (NFTs)
      const nftAccounts = tokenAccounts.value.filter((account) => {
        const amount = account.account.data.parsed.info.tokenAmount
        return amount.amount === '1' && amount.decimals === 0
      })

      console.log('NFT Accounts:', nftAccounts)
      console.log('NAccountsFT :', tokenAccounts)

      // Get metadata for each NFT using UMI
      const nfts: NFT[] = []
      for (const account of nftAccounts) {
        const mint = account.account.data.parsed.info.mint

        try {
          // Convert mint to UMI PublicKey format
          const mintPublicKeyUmi = publicKey(mint)

          // Find metadata PDA
          const metadataPda = findMetadataPda(umi, { mint: mintPublicKeyUmi })

          // Fetch metadata
          const metadata = await fetchMetadata(umi, metadataPda)

          // Fetch JSON metadata if URI exists
          let jsonMetadata: any = {}
          let imageUrl = ''

          console.log('Metadata:', metadata)

          if (metadata.uri && metadata.uri.startsWith('http')) {
            try {
              jsonMetadata = await fetchJsonMetadata(umi, metadata.uri)
              imageUrl = jsonMetadata.image || getImageUrlFromMint(mint)
            } catch (error) {
              console.error(`Error fetching JSON metadata for ${mint}:`, error)
              imageUrl = getImageUrlFromMint(mint)
            }
          } else {
            imageUrl = getImageUrlFromMint(mint)
          }

          // Get collection mint if exists
          let collectionMint: string | undefined = undefined
          if (metadata.collection && metadata.collection.__option === 'Some') {
            collectionMint = metadata.collection.value.key.toString()
          }

          console.log('Collection Mint:', metadata)

          // Add NFT to the list
          nfts.push({
            address: account.pubkey.toString(),
            mint,
            name: metadata.name || `NFT ${mint.slice(0, 8)}`,
            symbol: metadata.symbol,
            uri: metadata.uri,
            image: imageUrl,
            description: jsonMetadata.description,
            attributes: jsonMetadata.attributes,
            collectionMint,
            owner: wallet.publicKey.toString(),
            animation_url: jsonMetadata.animation_url,
          })
        } catch (error) {
          console.error(`Error fetching metadata for ${mint}:`, error)

          // Add fallback data if metadata fetch fails
          nfts.push({
            address: account.pubkey.toString(),
            mint,
            name: `NFT ${mint.slice(0, 8)}`,
            image: getImageUrlFromMint(mint),
            owner: wallet.publicKey.toString(),
          })
        }
      }

      return nfts
    } catch (error) {
      console.error('Error fetching user NFTs:', error)
      return []
    }
  }

  // Fetch listed NFTs from the marketplace
  const fetchListedNfts = async (): Promise<NFT[]> => {
    console.log('Fetching listed NFTs')
    if (!program || !provider) return []

    try {
      const marketplaceName = 'hack-123-x-5-3'
      if (!marketplaceName) {
        console.log('Marketplace name not found in localStorage')
        return getMockListings()
      }

      // Calculate marketplace PDA
      const marketplace = getMarketplacePda(program.programId, marketplaceName)
      console.log('Marketplace PDA:', marketplace.toString())

      // Try getting all program accounts directly without filtering
      try {
        console.log('Attempting to fetch program accounts directly')

        // Get all program accounts
        const connection = provider.connection
        const allAccounts = await connection.getProgramAccounts(program.programId)

        // Filter to likely listing accounts (81 bytes - size of Listing struct with discriminator)
        const listingSizeAccounts = allAccounts.filter((a) => a.account.data.length === 81)

        console.log(`Found ${listingSizeAccounts.length} potential listing accounts`)

        const listedNfts: NFT[] = []

        // Process each potential listing
        for (const account of listingSizeAccounts) {
          const data = account.account.data

          try {
            // Parse account data according to Listing struct
            const maker = new PublicKey(data.slice(8, 40))
            const makerMint = new PublicKey(data.slice(40, 72))
            const price = data.readBigUInt64LE(72)

            // Calculate expected listing PDA to verify this is our listing
            const [expectedListingPDA] = PublicKey.findProgramAddressSync(
              [marketplace.toBuffer(), makerMint.toBuffer()],
              program.programId,
            )

            // Check if this is a valid listing for our marketplace
            if (expectedListingPDA.toString() === account.pubkey.toString()) {
              console.log(`Found valid listing: ${account.pubkey.toString()}`)

              try {
                // Convert to UMI PublicKey format
                const mintPublicKeyUmi = fromWeb3JsPublicKey(makerMint)

                // Find metadata PDA
                const metadataPda = findMetadataPda(umi, { mint: mintPublicKeyUmi })

                // Fetch metadata
                const metadata = await fetchMetadata(umi, metadataPda)

                // Fetch JSON metadata if URI exists
                let jsonMetadata: any = {}
                let imageUrl = ''

                if (metadata.uri && metadata.uri.startsWith('http')) {
                  try {
                    jsonMetadata = await fetchJsonMetadata(umi, metadata.uri)
                    imageUrl = jsonMetadata.image || getImageUrlFromMint(makerMint.toString())
                  } catch (error) {
                    console.error(`Error fetching JSON metadata for ${makerMint.toString()}:`, error)
                    imageUrl = getImageUrlFromMint(makerMint.toString())
                  }
                } else {
                  imageUrl = getImageUrlFromMint(makerMint.toString())
                }

                // Get collection mint if exists
                let collectionMint: string | undefined = undefined
                if (metadata.collection && metadata.collection.__option === 'Some') {
                  collectionMint = metadata.collection.value.key.toString()
                }

                // Add NFT to the list
                listedNfts.push({
                  address: account.pubkey.toString(),
                  mint: makerMint.toString(),
                  name: metadata.name || `NFT ${makerMint.toString().slice(0, 8)}`,
                  symbol: metadata.symbol,
                  uri: metadata.uri,
                  image: imageUrl,
                  description: jsonMetadata.description,
                  attributes: jsonMetadata.attributes,
                  collectionMint,
                  price: Number(price) / 1e9, // Convert lamports to SOL
                  maker: maker.toString(),
                  isListed: true,
                })
              } catch (error) {
                console.error(`Error fetching metadata for listing ${account.pubkey.toString()}:`, error)

                // Add fallback data if metadata fetch fails
                listedNfts.push({
                  address: account.pubkey.toString(),
                  mint: makerMint.toString(),
                  name: `NFT ${makerMint.toString().slice(0, 8)}`,
                  image: getImageUrlFromMint(makerMint.toString()),
                  price: Number(price) / 1e9, // Convert lamports to SOL
                  maker: maker.toString(),
                  isListed: true,
                })
              }
            }
          } catch (err) {
            // Skip this account if there's an error parsing it
            console.error('Error parsing account:', err)
            continue
          }
        }

        console.log(`Found ${listedNfts.length} valid listings with metadata`)

        // If no listings are found, return mock data
        if (listedNfts.length === 0) {
          console.log('No valid listings found, using mock data')
          return getMockListings()
        }

        return listedNfts
      } catch (error) {
        console.error('Error fetching listings from program:', error)
        console.log('Falling back to mock listings')
        return getMockListings()
      }
    } catch (error) {
      console.error('Error in fetchListedNfts:', error)
      return getMockListings()
    }
  }

  // Helper function to get mock listings when program isn't available
  const getMockListings = (): NFT[] => {
    console.log('Using mock listings data')
    return [
      {
        address: 'listing-1',
        mint: 'CQoq1xYCyvybMid43UgXmLVbYLhsgHMmPQE5RpYMpxjN',
        name: 'Mock NFT #1',
        symbol: 'MOCK',
        uri: 'https://example.com/1',
        image: getImageUrlFromMint('CQoq1xYCyvybMid43UgXmLVbYLhsgHMmPQE5RpYMpxjN'),
        description: 'This is a mock NFT created for demo purposes',
        collectionMint: '9MynHsZQYpFFpQSLpQUEzpJoVt4UqJdvQosQpgXRTPzS',
        price: 0.5,
        maker: '8ZChRhxf1SAH7DVJgsz6LD1KAWcV2iXJzHCZJHTnb1o4',
        isListed: true,
      },
      {
        address: 'listing-2',
        mint: 'G5ZteLfMtLv5KofbJT8HPPdJmPJEKgFAXEKWxGXLsVhM',
        name: 'Mock NFT #2',
        symbol: 'MOCK',
        uri: 'https://example.com/2',
        image: getImageUrlFromMint('G5ZteLfMtLv5KofbJT8HPPdJmPJEKgFAXEKWxGXLsVhM'),
        description: 'Another mock NFT created for demonstration',
        collectionMint: '9MynHsZQYpFFpQSLpQUEzpJoVt4UqJdvQosQpgXRTPzS',
        price: 1.2,
        maker: wallet.publicKey?.toString() || '8ZChRhxf1SAH7DVJgsz6LD1KAWcV2iXJzHCZJHTnb1o4',
        isListed: true,
      },
    ]
  }

  // React Query hooks
  const userNftsQuery = useQuery({
    queryKey: ['userNfts', wallet?.publicKey?.toString()],
    queryFn: fetchUserNfts,
    enabled: !!provider && !!wallet.publicKey,
  })

  const listedNftsQuery = useQuery({
    queryKey: ['listedNfts'],
    queryFn: fetchListedNfts,
    enabled: !!provider && !!program,
    staleTime: 10 * 1000, // 10 seconds
  })

  return {
    userNfts: userNftsQuery,
    listedNfts: listedNftsQuery,
  }
}
