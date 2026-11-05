/* eslint-disable */
import { useMutation } from '@tanstack/react-query'
import { useWallet } from '@solana/wallet-adapter-react'
import { web3 } from '@project-serum/anchor'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import {
  createNft,
  findMasterEditionPda,
  findMetadataPda,
  mplTokenMetadata,
  verifySizedCollectionItem,
  verifyCollection,
} from '@metaplex-foundation/mpl-token-metadata'

import {
  createSignerFromKeypair,
  generateSigner,
  keypairIdentity,
  publicKey,
  percentAmount,
} from '@metaplex-foundation/umi'

// Import the renamed function
import { publicKey as umiPublicKey } from '@metaplex-foundation/umi'

// Import this for wallet adapter integration with UMI
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters'

import { toast } from 'sonner'

import { useCollectionManager } from './useCollectionManager'
import { uploadToIPFS, getIPFSImageUrl } from '../utils/ipfs'

// Interfaces for AI model metadata
export interface ModelMetrics {
  accuracyScore?: number
  f1Score?: number
  trainingDataset?: string
}

export interface ContentReferences {
  modelWeightsCID?: string
  configCID?: string
  encryptionScheme?: string
  encryptionNonce?: string
}

export interface ModelSample {
  input: string
  output: string
}

export interface ModelLicense {
  type?: string // "Academic" | "Commercial" | "Custom"
  allowFineTuning?: boolean
  requireAttribution?: boolean
  royaltyPercentage?: number
}

export interface MintNftParams {
  name: string
  symbol: string
  description: string
  image?: string
  sellerFeeBasisPoints?: number
  collectionMint?: string
  fileUri?: string // URL or IPFS CID of the content file
  fileType?: string // MIME type of the content file
  category?: string // Category of content (e.g., "model", "document", "dataset")

  // AI model specific details
  version?: string
  framework?: string // "PyTorch" | "TensorFlow" | "ONNX"
  modelType?: string // "Language" | "Vision" | "Multimodal"
  metrics?: ModelMetrics
  contentReferences?: ContentReferences
  samples?: ModelSample[]
  license?: ModelLicense
}

export const useMintNft = () => {
  const wallet = useWallet()
  const { getUserCollection, currentCollection } = useCollectionManager()

  const mintNft = async (params: MintNftParams) => {
    if (!wallet.publicKey || !wallet.signTransaction || !wallet.connected) {
      throw new Error("Wallet not connected or doesn't support signing")
    }

    // Create a Umi instance connected to the cluster
    const endpoint = process.env.NEXT_PUBLIC_RPC_ENDPOINT || 'https://api.devnet.solana.com'
    const umi = createUmi(endpoint)

    try {
      // Add a check to ensure the wallet is still connected
      if (!wallet.connected) {
        throw new Error('Wallet disconnected during operation')
      }

      // Get or create the user's collection
      let collectionMintAddress = params.collectionMint

      // If no collection mint was provided in the params, and we don't already have
      // a collection from the currentCollection query, create a new one
      if (!collectionMintAddress) {
        if (currentCollection?.mint) {
          // Use the existing collection from the query
          collectionMintAddress = currentCollection.mint
          console.log('✅ Using existing collection from query:', collectionMintAddress)
        } else {
          // Create or fetch a collection for this user
          const collectionResult = await getUserCollection.mutateAsync({
            name: params.name || 'My NFT Collection',
            symbol: params.symbol || 'COLL',
            description: params.description || 'My NFT Collection',
            image: params.image,
            sellerFeeBasisPoints: 1,
          })

          collectionMintAddress = collectionResult.mint
          console.log(
            '✅ Using collection:',
            collectionMintAddress,
            collectionResult.isNew ? '(newly created)' : '(existing)',
          )
        }
      }

      // Generate new mint keypair
      const nftMint = generateSigner(umi)

      // Use wallet adapter identity directly
      umi.use(walletAdapterIdentity(wallet))
      umi.use(mplTokenMetadata())

      // Generate a default image if none provided
      const imageUrl = params.image || getRandomImageUrl(params.name || 'NFT')

      // Use percentAmount to convert the seller fee basis points - ensure it's in valid range (0-10000)
      const basisPoints = 1

      console.log('Using seller fee basis points:', basisPoints)

      console.log('TODO: Use the basis points to set the seller fee')

      const sellerFee = percentAmount(1)

      // Create metadata URI using IPFS
      const metadataUri = await createMetadataUri({
        name: params.name,
        description: params.description || '',
        image: imageUrl,
        fileUri: params.fileUri,
        fileType: params.fileType || 'application/octet-stream',
        category: params.category || 'model',
        version: params.version,
        framework: params.framework,
        modelType: params.modelType,
        metrics: params.metrics,
        contentReferences: params.contentReferences,
        samples: params.samples,
        license: params.license,
      })

      console.log('📦 Metadata uploaded to IPFS:', metadataUri)

      // Prepare the NFT creation parameters
      const nftParams: any = {
        mint: nftMint,
        name: params.name,
        symbol: params.symbol,
        image: params.image,
        uri: metadataUri,
        sellerFeeBasisPoints: sellerFee,
        collection: { verified: false, key: publicKey(collectionMintAddress) },
        // Use the wallet's public key directly
        tokenOwner: umi.identity.publicKey,
        creators: [
          {
            address: umi.identity.publicKey,
            verified: true,
            share: 100,
          },
        ],
        isMutable: true,
      }

      console.log('Creating NFT with params:', {
        ...nftParams,
        mint: nftMint.publicKey.toString(),
        sellerFeeBasisPoints: sellerFee.basisPoints.toString(),
        collection: {
          ...nftParams.collection,
          key: collectionMintAddress,
        },
        creators: nftParams.creators.map((c: any) => ({
          ...c,
          address: c.address.toString(),
        })),
        uri: metadataUri,
      })

      // Create the NFT
      const result = await createNft(umi, nftParams).sendAndConfirm(umi)

      console.log('NFT created successfully:', result.signature.toString())

      // Verify collection for the NFT
      const collectionMetadata = findMetadataPda(umi, {
        mint: umiPublicKey(collectionMintAddress),
      })
      const collectionMasterEdition = findMasterEditionPda(umi, {
        mint: umiPublicKey(collectionMintAddress),
      })
      const nftMetadata = findMetadataPda(umi, { mint: nftMint.publicKey })

      try {
        // First, try verifySizedCollectionItem which is for sized collections (V1)
        await verifySizedCollectionItem(umi, {
          metadata: nftMetadata,
          collectionAuthority: umi.identity,
          collectionMint: umiPublicKey(collectionMintAddress),
          collection: collectionMetadata,
          collectionMasterEditionAccount: collectionMasterEdition,
        }).sendAndConfirm(umi)
        console.log('✅ Collection NFT Verified!')
      } catch (error) {
        console.error('Error verifying sized collection:', error)
        console.error('Details:', {
          wallet: wallet.publicKey.toString(),
          nftMetadata: nftMetadata.toString(),
          collectionMint: collectionMintAddress,
        })

        // If that fails, try the standard verification
        try {
          await verifyCollection(umi, {
            metadata: nftMetadata,
            collectionAuthority: umi.identity,
            collectionMint: umiPublicKey(collectionMintAddress),
            collection: collectionMetadata,
            collectionMasterEditionAccount: collectionMasterEdition,
          }).sendAndConfirm(umi)
          console.log('✅ Collection verified using alternate method!')
        } catch (fallbackError) {
          console.error('Fallback verification failed too:', fallbackError)
        }
      }

      return {
        mint: nftMint.publicKey.toString(),
        transactionSignature: result.signature.toString(),
        metadata: {
          name: params.name,
          symbol: params.symbol,
          description: params.description,
          image: imageUrl,
          fileUri: params.fileUri,
          metadataUri,
          collectionMint: collectionMintAddress,
        },
      }
    } catch (error: any) {
      console.error('Error minting NFT:', error)

      // Provide more specific error messages
      if (error.message && error.message.includes('disconnected port')) {
        throw new Error('Wallet connection lost. Please reconnect your wallet and try again.')
      } else if (error.message && error.message.includes('IncorrectOwner')) {
        throw new Error('You do not have authority over the collection. Please use a different collection mint.')
      } else {
        throw error
      }
    }
  }

  const mintNftMutation = useMutation({
    mutationFn: mintNft,
    onSuccess: (data) => {
      console.log('NFT minted successfully!', data)
      toast.success(`NFT minted successfully! Mint: ${data.mint.slice(0, 8)}...`)
    },
    onError: (error: Error) => {
      toast.error(`Failed to mint NFT: ${error.message}`)
    },
  })

  return {
    mintNft: mintNftMutation,
  }
}

// Interface for metadata creation parameters
interface MetadataParams extends Omit<MintNftParams, 'symbol' | 'sellerFeeBasisPoints' | 'collectionMint'> {
  name: string
  description: string
  image: string
  fileUri?: string
  fileType?: string
  category?: string
}

// Helper function to create a metadata URI using IPFS
async function createMetadataUri(params: MetadataParams): Promise<string> {
  // Format the content for AI model NFTs
  const metadata: any = {
    name: params.name,
    description: params.description,
    image: params.image,
  }

  if (params.fileUri) {
    // If we have a file URI, use the proper IPFS gateway URL
    const fileUrl = params.fileUri.startsWith('https://')
      ? params.fileUri
      : `https://ipfs.io/ipfs/${params.fileUri.replace('ipfs://', '')}`

    // Add it as animation_url (for non-image content)
    metadata.animation_url = fileUrl

    // Add properties for the file
    metadata.properties = {
      files: [
        {
          uri: fileUrl,
          type: params.fileType || 'application/octet-stream',
        },
      ],
      category: params.category || 'model',
    }

    // Create attributes array with all AI model metadata
    const attributes: any[] = []

    // Add basic AI model attributes if available
    if (params.category === 'model') {
      // Basic attributes
      if (params.modelType) attributes.push({ trait_type: 'Model Type', value: params.modelType })
      if (params.framework) attributes.push({ trait_type: 'Framework', value: params.framework })
      if (params.version) attributes.push({ trait_type: 'Version', value: params.version })

      // Performance metrics
      if (params.metrics) {
        if (params.metrics.accuracyScore !== undefined) {
          attributes.push({
            trait_type: 'Accuracy Score',
            value: params.metrics.accuracyScore.toString(),
          })
        }

        if (params.metrics.f1Score !== undefined) {
          attributes.push({
            trait_type: 'F1 Score',
            value: params.metrics.f1Score.toString(),
          })
        }

        if (params.metrics.trainingDataset) {
          attributes.push({
            trait_type: 'Training Dataset',
            value: params.metrics.trainingDataset,
          })
        }
      }

      // Content references - use fileUri as default for modelWeightsCID if not provided
      if (params.contentReferences) {
        const refs = params.contentReferences

        // Use the main file URI as the model weights CID if not specified
        const modelCID = refs.modelWeightsCID || params.fileUri?.replace('ipfs://', '')
        if (modelCID) {
          attributes.push({
            trait_type: 'Model Weights CID',
            value: modelCID,
          })
        }

        if (refs.configCID) {
          attributes.push({
            trait_type: 'Config CID',
            value: refs.configCID,
          })
        }

        if (refs.encryptionScheme) {
          attributes.push({
            trait_type: 'Encryption Scheme',
            value: refs.encryptionScheme,
          })
        }

        if (refs.encryptionNonce) {
          attributes.push({
            trait_type: 'Encryption Nonce',
            value: refs.encryptionNonce,
          })
        }
      } else if (params.fileUri) {
        // If no content references provided but we have a fileUri, use it as the model weights
        attributes.push({
          trait_type: 'Model Weights CID',
          value: params.fileUri.replace('ipfs://', ''),
        })
      }

      // License information
      if (params.license) {
        if (params.license.type) {
          attributes.push({
            trait_type: 'License Type',
            value: params.license.type,
          })
        }

        if (params.license.allowFineTuning !== undefined) {
          attributes.push({
            trait_type: 'Allow Fine-Tuning',
            value: params.license.allowFineTuning ? 'Yes' : 'No',
          })
        }

        if (params.license.requireAttribution !== undefined) {
          attributes.push({
            trait_type: 'Require Attribution',
            value: params.license.requireAttribution ? 'Yes' : 'No',
          })
        }

        if (params.license.royaltyPercentage !== undefined) {
          attributes.push({
            trait_type: 'Royalty Percentage',
            value: params.license.royaltyPercentage.toString() + '%',
          })
        }
      }

      // Add default category trait
      attributes.push({ trait_type: 'Category', value: 'AI Model' })
    }

    // Add the attributes to metadata if we have any
    if (attributes.length > 0) {
      metadata.attributes = attributes
    }

    // Add samples if provided
    if (params.samples && params.samples.length > 0) {
      metadata.samples = params.samples
    }
  }

  try {
    // Upload to IPFS and get the CID
    const ipfsCid = await uploadToIPFS(metadata)

    // Return as https URL instead of ipfs:// URI
    return `https://ipfs.io/ipfs/${ipfsCid}`
  } catch (error) {
    console.error('Error creating metadata URI:', error)
    throw new Error('Failed to upload metadata to IPFS')
  }
}

// Helper function to get a random image URL
function getRandomImageUrl(name: string): string {
  const seed = Array.from(name).reduce((acc, char) => acc + char.charCodeAt(0), 0) % 1000
  return `https://picsum.photos/seed/${seed}/300/300`
}
