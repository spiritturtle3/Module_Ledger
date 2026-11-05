'use client'
/* eslint-disable */
import { FC, useState, useEffect } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useMarketplace } from '@/hooks/useMarketplace'
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'
import { useWallet } from '@solana/wallet-adapter-react'
import { NFT } from '@/hooks/useNfts'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { DownloadIcon } from 'lucide-react'
import { downloadZipFromIpfs } from '@/utils/ipfs'
import { toast } from 'sonner'

interface NftCardProps {
  nft: NFT
  onSuccess?: () => void
}

export const NftCard: FC<NftCardProps> = ({ nft, onSuccess }) => {
  const { listNft, delistNft, purchaseNft } = useMarketplace()
  const wallet = useWallet()
  const [price, setPrice] = useState(0.1)
  const [showPriceInput, setShowPriceInput] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [isOwned, setIsOwned] = useState(false)
  const [modelFileUrl, setModelFileUrl] = useState<string | null>(null)

  const isOwner = nft.maker === wallet.publicKey?.toString()
  useEffect(() => {
    if (wallet.publicKey) {
      if (isOwner) {
        setIsOwned(true)
      } else if (nft.owner === wallet.publicKey.toString()) {
        setIsOwned(true)
      }
    }
  }, [wallet.publicKey, nft, isOwner])

  useEffect(() => {
    if (nft.attributes) {
      const modelWeightAttr = nft.attributes.find(
        (attr) => attr.trait_type === 'Model Weights CID' || attr.trait_type === 'animation_url',
      )

      if (modelWeightAttr?.value) {
        if (
          typeof modelWeightAttr.value === 'string' &&
          (modelWeightAttr.value.startsWith('http') || modelWeightAttr.value.startsWith('ipfs'))
        ) {
          setModelFileUrl(modelWeightAttr.value)
        } else if (typeof modelWeightAttr.value === 'string') {
          setModelFileUrl(`https://ipfs.io/ipfs/${modelWeightAttr.value.replace('ipfs://', '')}`)
        }
      }
    }

    if (nft.animation_url) {
      setModelFileUrl(nft.animation_url)
    }
  }, [nft])

  const handleList = async () => {
    if (!nft.collectionMint) {
      console.error('Collection mint is required for listing')
      return
    }

    try {
      await listNft.mutateAsync({
        price,
        nftMint: new PublicKey(nft.mint),
        collectionMint: new PublicKey(nft.collectionMint),
      })

      setShowPriceInput(false)
      if (onSuccess) onSuccess()
    } catch (error) {
      console.error('Error listing NFT:', error)
    }
  }

  const handleDelist = async () => {
    try {
      await delistNft.mutateAsync({
        nftMint: new PublicKey(nft.mint),
      })

      if (onSuccess) onSuccess()
    } catch (error) {
      console.error('Error delisting NFT:', error)
    }
  }

  const handlePurchase = async () => {
    if (!nft.maker) return

    try {
      await purchaseNft.mutateAsync({
        nftMint: new PublicKey(nft.mint),
        maker: new PublicKey(nft.maker),
      })

      if (onSuccess) onSuccess()
    } catch (error) {
      console.error('Error purchasing NFT:', error)
    }
  }

  const handleDownload = async () => {
    if (!modelFileUrl) {
      toast.error('No model file available to download')
      return
    }

    try {
      toast.loading('Preparing download...')

      if (modelFileUrl.startsWith('https://ipfs.io/ipfs/')) {
        const cid = modelFileUrl.replace('https://ipfs.io/ipfs/', '')
        await downloadZipFromIpfs(`ipfs://${cid}`)
      } else if (modelFileUrl.startsWith('ipfs://')) {
        await downloadZipFromIpfs(modelFileUrl)
      } else {
        window.open(modelFileUrl, '_blank')
      }

      toast.dismiss()
      toast.success('Download started')
    } catch (error) {
      console.error('Error downloading model:', error)
      toast.error('Failed to download model file')
    }
  }

  const truncateMint = (mint: string) => {
    return `${mint.slice(0, 4)}...${mint.slice(-4)}`
  }

  return (
    <Card className="overflow-hidden h-full flex flex-col rounded-2xl bg-card/90 border border-border shadow-xl transition-transform duration-200 hover:-translate-y-1 hover:shadow-2xl group">
      <div className="relative aspect-square bg-gradient-to-br from-muted via-card to-background">
        {nft.image && !imageError ? (
          <Image
            src={nft.image}
            alt={nft.name}
            fill
            className="object-cover rounded-t-2xl transition-all duration-300 group-hover:scale-105"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gray-900 flex items-center justify-center text-gray-400 rounded-t-2xl">
            {nft.name || 'No Image'}
          </div>
        )}

        {isOwned && modelFileUrl && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-green-500/90 text-white shadow px-3 py-1 text-xs font-semibold rounded-full">
              Owned
            </Badge>
          </div>
        )}
      </div>

      <CardHeader className="pb-2 px-4 pt-4">
        <CardTitle className="text-lg font-bold truncate">{nft.name}</CardTitle>
        <CardDescription className="flex justify-between items-center text-xs text-gray-400 mt-1">
          <span>{truncateMint(nft.mint)}</span>
          {nft.symbol && (
            <span className="ml-2 bg-gray-800/80 text-gray-200 px-2 py-1 rounded font-semibold">{nft.symbol}</span>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="pb-2 flex-grow px-4">
        {nft.isListed && nft.price && (
          <div className="font-semibold text-lg text-green-400 mb-1">
            {nft.price} <span className="text-xs text-gray-300">SOL</span>
          </div>
        )}

        {nft.description && <p className="text-sm text-gray-400 line-clamp-2 mt-1">{nft.description}</p>}

        {showPriceInput && (
          <div className="mt-2">
            <label className="block text-sm mb-1 text-gray-300">Price in SOL</label>
            <input
              type="number"
              min="0.001"
              step="0.001"
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value))}
              className="w-full p-2 border border-white/10 rounded bg-black/60 text-white focus:ring-2 focus:ring-white/40 focus:border-white/30 transition"
            />
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-2 pt-2 px-4 pb-4">
        <div className="flex gap-2 w-full">
          {nft.isListed ? (
            isOwner ? (
              <Button
                variant="destructive"
                onClick={handleDelist}
                disabled={delistNft.isPending}
                className="w-1/2 rounded-lg"
              >
                {delistNft.isPending ? 'Delisting...' : 'Delist'}
              </Button>
            ) : (
              <Button
                onClick={handlePurchase}
                disabled={purchaseNft.isPending}
                className="w-1/2 rounded-lg bg-gradient-to-r from-green-400/80 to-green-600/80 text-black font-bold hover:from-green-300 hover:to-green-500"
              >
                {purchaseNft.isPending ? 'Buying...' : 'Buy Now'}
              </Button>
            )
          ) : showPriceInput ? (
            <>
              <Button variant="outline" onClick={() => setShowPriceInput(false)} className="w-1/2 rounded-lg">
                Cancel
              </Button>
              <Button
                onClick={handleList}
                disabled={listNft.isPending}
                className="w-1/2 rounded-lg bg-gradient-to-r from-white to-gray-300 text-black font-bold"
              >
                {listNft.isPending ? 'Listing...' : 'Confirm'}
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setShowPriceInput(true)} className="w-1/2 rounded-lg">
              List for Sale
            </Button>
          )}

          {/* Details Button - Always available */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary" className="w-1/2 rounded-lg">
                Details
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{nft.name}</DialogTitle>
                <DialogDescription>{nft.description || 'No description available'}</DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <h3 className="font-semibold text-sm">Token Address</h3>
                  <p className="text-xs break-all">{nft.mint}</p>
                </div>

                {nft.collectionMint && (
                  <div className="grid gap-2">
                    <h3 className="font-semibold text-sm">Collection</h3>
                    <p className="text-xs break-all">{nft.collectionMint}</p>
                  </div>
                )}

                {nft.uri && (
                  <div className="grid gap-2">
                    <h3 className="font-semibold text-sm">Metadata URI</h3>
                    <p className="text-xs break-all">{nft.uri}</p>
                  </div>
                )}

                {modelFileUrl && isOwned && (
                  <div className="grid gap-2">
                    <h3 className="font-semibold text-sm">Model File</h3>
                    <Button onClick={handleDownload} className="text-xs">
                      <DownloadIcon className="w-4 h-4 mr-2" /> Download Model File
                    </Button>
                  </div>
                )}

                {nft.attributes && nft.attributes.length > 0 && (
                  <div className="grid gap-2">
                    <h3 className="font-semibold text-sm">Attributes</h3>
                    <div className="flex flex-wrap gap-2">
                      {nft.attributes.map((attr, i) => (
                        <div key={i} className="bg-secondary p-2 rounded-md text-xs">
                          <span className="font-semibold">{attr.trait_type}: </span>
                          <span>{attr.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Download model if owned */}
        {isOwned && modelFileUrl && !showPriceInput && (
          <Button
            variant="default"
            onClick={handleDownload}
            className="w-full rounded-lg bg-gradient-to-r from-gray-200 to-white text-black font-bold hover:from-white hover:to-gray-200"
          >
            <DownloadIcon className="w-4 h-4 mr-2" /> Download Model
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
