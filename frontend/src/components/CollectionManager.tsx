'use client'
/* eslint-disable */
import { FC, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { useMutation } from '@tanstack/react-query'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { createNft, mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata'
import { createSignerFromKeypair, generateSigner, keypairIdentity, percentAmount } from '@metaplex-foundation/umi'

interface CollectionManagerProps {
  onSuccess?: (collectionMint: string) => void
}

export const CollectionManager: FC<CollectionManagerProps> = ({ onSuccess }) => {
  const wallet = useWallet()
  const [formData, setFormData] = useState({
    name: '',
    symbol: 'COL',
    description: '',
    image: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const createCollection = async () => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      throw new Error("Wallet not connected or doesn't support signing")
    }

    // Create a Umi instance connected to the cluster
    const endpoint = process.env.NEXT_PUBLIC_RPC_ENDPOINT || 'https://api.devnet.solana.com'
    const umi = createUmi(endpoint)

    // Import the wallet adapter as a Umi signer
    const walletAdapter = {
      publicKey: wallet.publicKey.toBytes(),
      signTransaction: async (transaction: any) => {
        const signedTx = await wallet.signTransaction!(transaction)
        return signedTx
      },
      signAllTransactions: async (transactions: any[]) => {
        const signedTxs = await wallet.signAllTransactions!(transactions)
        return signedTxs
      },
    }

    try {
      // Generate new mint keypair for the collection
      const collectionMint = generateSigner(umi)

      // Set up Umi identity
      const walletSigner = createSignerFromKeypair(umi, walletAdapter as any)
      umi.use(keypairIdentity(walletSigner))
      umi.use(mplTokenMetadata())

      // Use random image if none provided
      const seed = Array.from(formData.name).reduce((acc, char) => acc + char.charCodeAt(0), 0) % 1000
      const imageUrl = formData.image || `https://picsum.photos/seed/${seed}/300/300`

      // Create the collection NFT
      await createNft(umi, {
        mint: collectionMint,
        name: formData.name,
        symbol: formData.symbol,
        uri: `https://arweave.net/placeholder/${formData.name.replace(/\s+/g, '-').toLowerCase()}`,
        sellerFeeBasisPoints: percentAmount(5.5),
        collectionDetails: { __kind: 'V1', size: 0 }, // Initialize as an empty collection
      }).sendAndConfirm(umi)

      console.log('Collection created with mint:', collectionMint.publicKey.toString())

      return {
        collectionMint: collectionMint.publicKey.toString(),
        name: formData.name,
        symbol: formData.symbol,
      }
    } catch (error) {
      console.error('Error creating collection:', error)
      throw error
    }
  }

  const createCollectionMutation = useMutation({
    mutationFn: createCollection,
    onSuccess: (data) => {
      toast.success(`Collection created: ${data.name}`)
      setFormData({
        name: '',
        symbol: 'COL',
        description: '',
        image: '',
      })
      if (onSuccess) onSuccess(data.collectionMint)
    },
    onError: (error: Error) => {
      toast.error(`Failed to create collection: ${error.message}`)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.symbol) {
      toast.error('Name and symbol are required')
      return
    }
    createCollectionMutation.mutate()
  }

  if (!wallet.connected) {
    return (
      <Card className="bg-black/70 border border-white/10 shadow-2xl rounded-3xl backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-extrabold bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent font-mono tracking-tight drop-shadow-lg">
            Create a model collection
          </CardTitle>
          <CardDescription className="text-gray-400">Connect your wallet to organize model NFTs into collections.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="bg-black/70 border border-white/10 shadow-2xl rounded-3xl backdrop-blur-xl">
      <form onSubmit={handleSubmit} className="flex flex-col">
        <CardHeader>
          <CardTitle className="text-2xl font-extrabold bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent font-mono tracking-tight drop-shadow-lg flex items-center gap-3">
            <span className="text-xl">📚</span>
            Create a model collection
          </CardTitle>
          <CardDescription className="text-gray-400">Group related AI model NFTs under a verifiable collection.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-black/40 border border-white/10 rounded-2xl shadow-lg p-6 mb-2">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-base font-semibold">
                  Collection Name <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="My Amazing Collection"
                  required
                  className="mt-1 w-full px-4 py-2 rounded-lg bg-black/60 border border-white/10 text-white focus:ring-2 focus:ring-white/40 focus:border-white/30 transition"
                />
              </div>

              <div>
                <Label htmlFor="symbol" className="text-base font-semibold">
                  Symbol <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="symbol"
                  name="symbol"
                  value={formData.symbol}
                  onChange={handleChange}
                  placeholder="COL"
                  required
                  className="mt-1 w-full px-4 py-2 rounded-lg bg-black/60 border border-white/10 text-white focus:ring-2 focus:ring-white/40 focus:border-white/30 transition"
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-base font-semibold">
                  Description
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe your collection"
                  rows={3}
                  className="mt-1 w-full px-4 py-2 rounded-lg bg-black/60 border border-white/10 text-white focus:ring-2 focus:ring-white/40 focus:border-white/30 transition"
                />
              </div>

              <div>
                <Label htmlFor="image" className="text-base font-semibold">
                  Cover Image URL
                </Label>
                <Input
                  id="image"
                  name="image"
                  value={formData.image}
                  onChange={handleChange}
                  placeholder="https://example.com/image.png"
                  className="mt-1 w-full px-4 py-2 rounded-lg bg-black/60 border border-white/10 text-white focus:ring-2 focus:ring-white/40 focus:border-white/30 transition"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Enter a URL to your collection cover image or leave empty to generate a random image
                </p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-4 px-6 pb-8">
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-white to-gray-300 text-black font-bold shadow-lg hover:scale-105 transition-transform border-0 text-lg py-3"
            disabled={createCollectionMutation.isPending}
          >
            {createCollectionMutation.isPending ? 'Creating...' : 'Create Collection'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
