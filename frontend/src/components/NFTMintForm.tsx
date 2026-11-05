'use client'
/* eslint-disable */
import { FC, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useMintNft } from '@/hooks/useMintNft'
import { Textarea } from '@/components/ui/textarea'
import { downloadZipFromIpfs, getFromIPFS, uploadFile } from '@/utils/ipfs'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

interface MintNFTFormProps {
  onSuccess?: () => void
  collectionMint?: string
}

export const NFTMintForm: FC<MintNFTFormProps> = ({ onSuccess, collectionMint }) => {
  const wallet = useWallet()
  const [status, setStatus] = useState('')
  const [ipfsURI, setIpfsURI] = useState('')
  const { mintNft } = useMintNft()
  const [formData, setFormData] = useState({
    // Basic NFT info
    name: '',
    symbol: 'AI',
    description: '',
    image: '',
    sellerFee: 5,

    // AI Model details
    version: '1.0.0',
    framework: 'PyTorch',
    modelType: 'Language',

    // Performance metrics
    accuracyScore: '',
    f1Score: '',
    trainingDataset: '',

    // Content references
    modelWeightsCID: '',
    configCID: '',
    encryptionScheme: 'AES-256-GCM',
    encryptionNonce: '',

    // Sample I/O
    sampleInput: '',
    sampleOutput: '',

    // Licensing information
    licenseType: 'Academic',
    allowFineTuning: true,
    requireAttribution: true,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    // Handle number fields
    if (['sellerFee', 'accuracyScore', 'f1Score', 'royaltyPercentage'].includes(name)) {
      const numValue = Number(value) || 0
      setFormData((prev) => ({ ...prev, [name]: numValue }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const samples =
      formData.sampleInput && formData.sampleOutput
        ? [{ input: formData.sampleInput, output: formData.sampleOutput }]
        : undefined

    const metrics = {
      ...(formData.accuracyScore && { accuracyScore: Number(formData.accuracyScore) }),
      ...(formData.f1Score && { f1Score: Number(formData.f1Score) }),
      ...(formData.trainingDataset && { trainingDataset: formData.trainingDataset }),
    }

    const contentReferences = {
      ...(formData.modelWeightsCID && { modelWeightsCID: formData.modelWeightsCID }),
      ...(formData.configCID && { configCID: formData.configCID }),
      ...(formData.encryptionScheme && { encryptionScheme: formData.encryptionScheme }),
      ...(formData.encryptionNonce && { encryptionNonce: formData.encryptionNonce }),
    }

    const license = {
      type: formData.licenseType,
      allowFineTuning: formData.allowFineTuning,
      requireAttribution: formData.requireAttribution,
    }

    mintNft.mutate({
      name: formData.name,
      symbol: formData.symbol,
      description: formData.description,
      image: formData.image || undefined,
      sellerFeeBasisPoints: Math.min(formData.sellerFee * 100, 10000),
      collectionMint: collectionMint,
      fileUri: ipfsURI,
      fileType: 'application/zip',
      category: 'model',
      version: formData.version,
      framework: formData.framework,
      modelType: formData.modelType,
      metrics: Object.keys(metrics).length > 0 ? metrics : undefined,
      contentReferences: Object.keys(contentReferences).length > 0 ? contentReferences : undefined,
      samples,
      license,
    })
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setStatus('Uploading model to IPFS...')
    try {
      const cid = await uploadFile(file)
      console.log(cid, 'is here')

      const uri = `ipfs://${cid}`
      console.log(uri, 'uri is here')

      setIpfsURI(uri)
      setFormData((prev) => ({
        ...prev,
        modelWeightsCID: prev.modelWeightsCID || cid,
      }))

      setStatus('File uploaded to IPFS successfully.')
    } catch (error) {
      console.error(error)
      setStatus('IPFS upload failed.')
    }
  }

  if (!wallet.connected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Create an AI model NFT</CardTitle>
          <CardDescription>Connect your wallet to establish on-chain model ownership.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="max-w-2xl mx-auto mt-10 bg-black/70 border border-white/10 shadow-2xl rounded-3xl backdrop-blur-xl p-0">
      <form onSubmit={handleSubmit} className="space-y-0">
        <div className="px-8 pt-8 pb-2 flex flex-col items-center">
          <h2 className="text-3xl font-extrabold bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent mb-2 font-mono tracking-tight drop-shadow-lg">
            Create your AI model NFT
          </h2>
          <p className="text-gray-400 text-base mb-4 text-center max-w-lg">
            Prepare metadata, content references, and licensing details before minting on Solana.
          </p>
        </div>
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="flex flex-wrap gap-2 bg-black/30 rounded-xl p-2 mb-4">
            <TabsTrigger value="basic" className="flex items-center gap-1">
              <span>1</span> Identity
            </TabsTrigger>
            <TabsTrigger value="model" className="flex items-center gap-1">
              <span>2</span> Model
            </TabsTrigger>
            <TabsTrigger value="metrics" className="flex items-center gap-1">
              <span>3</span> Metrics
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-1">
              <span>4</span> Content
            </TabsTrigger>
            <TabsTrigger value="licensing" className="flex items-center gap-1">
              <span>5</span> Licensing
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6 p-6">
            <div className="bg-black/40 border border-white/10 rounded-2xl shadow-lg p-6 mb-6">
              <h3 className="text-2xl font-extrabold mb-6 flex items-center gap-3 bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent font-mono tracking-tight drop-shadow-lg">
                <span className="text-xl">📝</span>
                Basic Information
              </h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-base font-semibold">
                    Name <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Model Name"
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
                    placeholder="AI"
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
                    placeholder="Language model fine-tuned for..."
                    rows={3}
                    className="mt-1 w-full px-4 py-2 rounded-lg bg-black/60 border border-white/10 text-white focus:ring-2 focus:ring-white/40 focus:border-white/30 transition"
                  />
                </div>

                <div>
                  <Label htmlFor="sellerFee" className="text-base font-semibold">
                    Royalty (%)
                  </Label>
                  <Input
                    id="sellerFee"
                    name="sellerFee"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.sellerFee}
                    onChange={handleChange}
                    placeholder="5"
                    className="mt-1 w-full px-4 py-2 rounded-lg bg-black/60 border border-white/10 text-white focus:ring-2 focus:ring-white/40 focus:border-white/30 transition"
                  />
                  <p className="text-xs text-gray-400 mt-1">Percentage fee you earn on secondary sales (0-100%)</p>
                </div>

                <div>
                  <Label htmlFor="image" className="text-base font-semibold">
                    Image URL
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
                    Enter a URL to your image or leave empty to generate a random image
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Model Details Tab */}
          <TabsContent value="model" className="space-y-6 p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span>🤖</span> Model Details
            </h3>
            <div className="space-y-2 bg-black/60 border border-white/10">
              <Label htmlFor="version">Version</Label>
              <Input
                id="version"
                name="version"
                value={formData.version}
                onChange={handleChange}
                placeholder="1.0.0"
                className="bg-black/60 border border-white/10"
              />
            </div>

            <div className="space-y-2 ">
              <Label htmlFor="framework">Framework</Label>
              <Select value={formData.framework} onValueChange={(value) => handleSelectChange('framework', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select framework" />
                </SelectTrigger>
                <SelectContent className="bg-black border border-white/10">
                  <SelectItem value="PyTorch">PyTorch</SelectItem>
                  <SelectItem value="TensorFlow">TensorFlow</SelectItem>
                  <SelectItem value="ONNX">ONNX</SelectItem>
                  <SelectItem value="JAX">JAX</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="modelType">Model Type</Label>
              <Select value={formData.modelType} onValueChange={(value) => handleSelectChange('modelType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select model type" />
                </SelectTrigger>
                <SelectContent className="bg-black border border-white/10">
                  <SelectItem value="Language">Language</SelectItem>
                  <SelectItem value="Vision">Vision</SelectItem>
                  <SelectItem value="Multimodal">Multimodal</SelectItem>
                  <SelectItem value="Audio">Audio</SelectItem>
                  <SelectItem value="Generative">Generative</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Sample Input/Output</Label>
              <div className="grid grid-cols-1 gap-4 space-y-4">
                <div>
                  <Label htmlFor="sampleInput">Input Example</Label>
                  <Textarea
                    id="sampleInput"
                    name="sampleInput"
                    value={formData.sampleInput}
                    onChange={handleChange}
                    placeholder="The quick brown fox"
                  />
                </div>
                <div>
                  <Label htmlFor="sampleOutput">Output Example</Label>
                  <Textarea
                    id="sampleOutput"
                    name="sampleOutput"
                    value={formData.sampleOutput}
                    onChange={handleChange}
                    placeholder="jumps over the lazy dog"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Metrics Tab */}
          <TabsContent value="metrics" className="space-y-6 p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span>📊</span> Performance Metrics
            </h3>
            <div className="space-y-2">
              <Label htmlFor="accuracyScore">Accuracy Score (0-1)</Label>
              <Input
                id="accuracyScore"
                name="accuracyScore"
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={formData.accuracyScore}
                onChange={handleChange}
                placeholder="0.87"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="f1Score">F1 Score (0-1)</Label>
              <Input
                id="f1Score"
                name="f1Score"
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={formData.f1Score}
                onChange={handleChange}
                placeholder="0.92"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="trainingDataset">Training Dataset</Label>
              <Input
                id="trainingDataset"
                name="trainingDataset"
                value={formData.trainingDataset}
                onChange={handleChange}
                placeholder="Common Crawl filtered"
              />
            </div>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-6 p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span>📦</span> Model Content
            </h3>
            <div className="space-y-2">
              <Label htmlFor="modelFile" className="text-base font-semibold">
                Upload Model File *
              </Label>
              <div className="bg-black/30 border border-white/10 rounded-xl p-4 flex flex-col items-center">
                <input
                  id="modelFile"
                  type="file"
                  accept=".pt,.onnx,.pkl,.zip"
                  onChange={handleFileUpload}
                  className="w-full px-4 py-2 border border-gray-400/30 rounded-lg focus:ring-2 focus:ring-white/60 focus:border-white/40 transition bg-black/40 text-white"
                />
                {status && <p className="mt-2 text-sm text-gray-400">{status}</p>}
              </div>
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="ipfsUri">
                Model IPFS URI
              </label>
              <input
                id="ipfsUri"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="ipfs://..."
                value={ipfsURI}
                readOnly
              />
              <p className="mt-1 text-xs text-gray-500">
                This will be used as the model weights CID if no other is provided
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="modelWeightsCID">Model Weights CID (optional override)</Label>
              <Input
                id="modelWeightsCID"
                name="modelWeightsCID"
                value={formData.modelWeightsCID}
                onChange={handleChange}
                placeholder="Qm3a8d7f...f32a"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="configCID">Config CID</Label>
              <Input
                id="configCID"
                name="configCID"
                value={formData.configCID}
                onChange={handleChange}
                placeholder="Qm1c9e8d...a21b"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="encryptionScheme">Encryption Scheme</Label>
              <Select
                value={formData.encryptionScheme}
                onValueChange={(value) => handleSelectChange('encryptionScheme', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select encryption scheme" />
                </SelectTrigger>
                <SelectContent className="bg-black border border-white/10">
                  <SelectItem value="AES-256-GCM">AES-256-GCM</SelectItem>
                  <SelectItem value="ChaCha20-Poly1305">ChaCha20-Poly1305</SelectItem>
                  <SelectItem value="None">None</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="encryptionNonce">Encryption Nonce</Label>
              <Input
                id="encryptionNonce"
                name="encryptionNonce"
                value={formData.encryptionNonce}
                onChange={handleChange}
                placeholder="Public nonce for encryption"
              />
            </div>
          </TabsContent>

          {/* Licensing Tab */}
          <TabsContent value="licensing" className="space-y-6 p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span>🔖</span> Licensing
            </h3>
            <div className="space-y-2 ">
              <Label htmlFor="licenseType">License Type</Label>
              <Select value={formData.licenseType} onValueChange={(value) => handleSelectChange('licenseType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select license type" />
                </SelectTrigger>
                <SelectContent className="bg-black border border-white/10">
                  <SelectItem value="Academic">Academic</SelectItem>
                  <SelectItem value="Commercial">Commercial</SelectItem>
                  <SelectItem value="Custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2 py-2">
              <Checkbox
                id="allowFineTuning"
                checked={formData.allowFineTuning}
                onCheckedChange={(checked) => handleCheckboxChange('allowFineTuning', checked === true)}
              />
              <Label htmlFor="allowFineTuning">Allow Fine-Tuning</Label>
            </div>

            <div className="flex items-center space-x-2 py-2">
              <Checkbox
                id="requireAttribution"
                checked={formData.requireAttribution}
                onCheckedChange={(checked) => handleCheckboxChange('requireAttribution', checked === true)}
              />
              <Label htmlFor="requireAttribution">Require Attribution</Label>
            </div>
          </TabsContent>
        </Tabs>

        <CardFooter className="pt-6 px-8 pb-8">
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-white to-gray-300 text-black font-bold shadow-lg hover:scale-105 transition-transform border-0 text-lg py-3"
            disabled={mintNft.isPending || !ipfsURI}
          >
            {mintNft.isPending ? 'Minting...' : 'Mint AI Model NFT'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
