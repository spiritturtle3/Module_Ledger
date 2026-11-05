'use client'
/* eslint-disable */
import { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useNfts } from '@/hooks/useNfts'
import { NftCard } from '@/components/NftCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConnectWalletButton } from '@/components/ConnectWalletButton'
import ClientOnly from '@/components/ClientOnly'
import { NFTMintForm } from '@/components/NFTMintForm'
import { CollectionManager } from '@/components/CollectionManager'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'

const MARKETPLACE_NAME = 'hack-123-x-5-3'

export default function DashboardFeature() {
  const wallet = useWallet()
  const { userNfts, listedNfts } = useNfts()
  const [activeTab, setActiveTab] = useState<'my-nfts' | 'marketplace' | 'mint' | 'collections'>('my-nfts')
  const [collectionMint, setCollectionMint] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('marketplaceName')) {
      localStorage.setItem('marketplaceName', MARKETPLACE_NAME)
      toast.success('Connected to the ModuLedger marketplace')
    }
  }, [])

  const handleCollectionCreated = (mint: string) => {
    setCollectionMint(mint)
    toast.success(`Collection created! Now you can mint NFTs to this collection.`)
    setActiveTab('mint')
  }

  console.log(userNfts, 'nfts are here')

  return (
    <main className="container mx-auto px-4 sm:px-8 md:px-16 pt-28 pb-12 max-w-6xl">
      <ClientOnly>
        {!wallet.connected ? (
          <div className="text-center my-12 p-8 border border-border rounded-2xl bg-card/80 shadow-xl backdrop-blur-xl">
            <h2 className="text-2xl font-semibold mb-4">Connect your wallet to get started</h2>
            <p className="mb-6 text-muted-foreground">Connect a Solana wallet to discover and manage AI model NFTs.</p>
            <ConnectWalletButton />
          </div>
        ) : (
          <>
            <Tabs
              defaultValue="my-nfts"
              value={activeTab}
              onValueChange={(value: string) =>
                setActiveTab(value as 'my-nfts' | 'marketplace' | 'mint' | 'collections')
              }
              className="mb-6"
            >
              <div className="flex flex-wrap justify-center gap-4 pt-6 mb-8">
                {[
                  { key: 'my-nfts', label: 'My models', icon: '◈' },
                  { key: 'marketplace', label: 'Model marketplace', icon: '⌕' },
                  { key: 'mint', label: 'Create model NFT', icon: '+' },
                  { key: 'collections', label: 'Collections', icon: '▦' },
                ].map(({ key, label, icon }) => (
                  <Button
                    key={key}
                    variant={activeTab === key ? 'default' : 'secondary'}
                    onClick={() => setActiveTab(key as typeof activeTab)}
                    className={`capitalize flex items-center gap-2 px-6 py-2 rounded-xl font-semibold transition-all
                      ${
                        activeTab === key
                          ? 'bg-gradient-to-r from-white to-gray-300 text-black shadow-lg'
                          : 'bg-black/60 text-gray-400 border border-white/10 hover:bg-white/10'
                      }
                    `}
                  >
                    <span>{icon}</span> {label}
                  </Button>
                ))}
              </div>

              <TabsContent value="my-nfts">
                <div className="bg-card/80 rounded-2xl p-6 shadow-xl backdrop-blur-xl">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <span>◈</span> My model NFTs
                  </h2>
                  {userNfts.isLoading ? (
                    <div className="text-center py-8 text-gray-400">Loading your NFTs...</div>
                  ) : userNfts.error ? (
                    <div className="text-center py-8 text-red-500">
                      Error loading NFTs: {(userNfts.error as Error).message}
                    </div>
                  ) : userNfts.data?.length === 0 ? (
                    <div className="text-center py-8 border border-border rounded-xl bg-background/50">
                      <p className="text-gray-400">You do not own any AI model NFTs yet.</p>
                      <Button className="mt-4" onClick={() => setActiveTab('mint')} variant="outline">
                        Create your first model NFT
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {userNfts.data?.map((nft) => (
                        <NftCard key={nft.mint} nft={nft} onSuccess={() => userNfts.refetch()} />
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="marketplace">
                <div className="bg-card/80 rounded-2xl p-6 shadow-xl backdrop-blur-xl">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <span>⌕</span> AI model marketplace
                  </h2>
                  {listedNfts.isLoading ? (
                    <div className="text-center py-8 text-gray-400">Loading marketplace...</div>
                  ) : listedNfts.error ? (
                    <div className="text-center py-8 text-red-500">
                      Error loading marketplace: {(listedNfts.error as Error).message}
                    </div>
                  ) : listedNfts.data?.length === 0 ? (
                    <div className="text-center py-8 border border-border rounded-xl bg-background/50">
                      <p className="text-gray-400">No AI models are listed yet.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {listedNfts.data?.map((nft) => (
                        <NftCard key={nft.mint} nft={nft} onSuccess={() => listedNfts.refetch()} />
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="mint">
                <div className="bg-card/80 rounded-2xl p-6 shadow-xl backdrop-blur-xl">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <span>+</span> Create an AI model NFT
                  </h2>
                  {collectionMint && (
                    <div className="mb-4 p-3 bg-green-50/10 border border-green-200/20 rounded-md">
                      <p className="text-green-300 text-sm">
                        Using collection: {collectionMint.slice(0, 8)}...{collectionMint.slice(-8)}
                      </p>
                    </div>
                  )}
                  <div className="max-w-xl mx-auto">
                    <NFTMintForm
                      onSuccess={() => {
                        userNfts.refetch()
                        setActiveTab('my-nfts')
                      }}
                      collectionMint={collectionMint || undefined}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="collections">
                <div className="bg-card/80 rounded-2xl p-6 shadow-xl backdrop-blur-xl">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <span>▦</span> Manage model collections
                  </h2>
                  <div className="max-w-md mx-auto">
                    <CollectionManager onSuccess={handleCollectionCreated} />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </ClientOnly>
    </main>
  )
}
