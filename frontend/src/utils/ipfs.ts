/* eslint-disable */
const PINATA_API_KEY = process.env.NEXT_PUBLIC_PINATA_API_KEY
const PINATA_SECRET_KEY = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY

const IPFS_GATEWAYS = [
  'https://gateway.pinata.cloud/ipfs/',
  'https://ipfs.io/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
]

export interface PostMetadata {
  name: string // Name or title of the post/NFT
  description?: string // Optional description
  image: string // IPFS URI or URL of the image
  attributes?: Array<{
    trait_type: string // Attribute name, e.g., "rarity"
    value: string | number // Attribute value
  }>
  [key: string]: any // Allow extra fields for flexibility
}

export async function uploadToIPFS(data: PostMetadata): Promise<string> {
  try {
    const jsonString = JSON.stringify(data)

    const formData = new FormData()
    const blob = new Blob([jsonString], { type: 'application/json' })
    formData.append('file', blob, 'metadata.json')

    const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        pinata_api_key: PINATA_API_KEY || '',
        pinata_secret_api_key: PINATA_SECRET_KEY || '',
      },
      body: formData,
    })

    const data_res = await res.json()

    if (!res.ok) {
      throw new Error('Failed to upload to Pinata')
    }

    return data_res.IpfsHash
  } catch (error) {
    console.error('Error uploading to IPFS:', error)
    throw error
  }
}
export async function uploadFile(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: {
      pinata_api_key: PINATA_API_KEY || '',
      pinata_secret_api_key: PINATA_SECRET_KEY || '',
    },
    body: formData,
  })
  console.log(res)
  console.log(PINATA_API_KEY, 'and ', PINATA_SECRET_KEY)

  if (!res.ok) {
    throw new Error('Failed to upload file to Pinata')
  }

  const data = await res.json()
  return data.IpfsHash // This is the CID
}
export async function uploadImageToIPFS(file: File): Promise<string> {
  try {
    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        pinata_api_key: PINATA_API_KEY || '',
        pinata_secret_api_key: PINATA_SECRET_KEY || '',
      },
      body: formData,
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error('Failed to upload to Pinata')
    }

    return data.IpfsHash
  } catch (error) {
    console.error('Error uploading image to IPFS:', error)
    throw error
  }
}

async function tryFetchFromGateway(gateway: string, cid: string) {
  try {
    const cleanCid = cid.replace('ipfs://', '')
    const url = `${gateway}${cleanCid}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Failed to fetch from gateway: ${gateway}`)
    return await res.json()
  } catch (error) {
    console.warn(`Failed to fetch from gateway ${gateway}:`, error)
    throw error
  }
}

export async function getFromIPFS(cid: string): Promise<PostMetadata> {
  if (!cid) throw new Error('No CID provided')

  for (const gateway of IPFS_GATEWAYS) {
    try {
      const data = await tryFetchFromGateway(gateway, cid)
      return data
    } catch (error) {
      console.warn(`Gateway ${gateway} failed, trying next...`)
      continue
    }
  }

  throw new Error('Failed to fetch from all IPFS gateways')
}

export function getIPFSImageUrl(cid: string, gatewayIndex = 0): string {
  const cleanCid = cid.replace('ipfs://', '')
  const gateway = IPFS_GATEWAYS[gatewayIndex % IPFS_GATEWAYS.length]
  return `${gateway}${cleanCid}`
}

export const downloadZipFromIpfs = async (ipfsUri: string) => {
  try {
    // Handle both ipfs:// and raw CID formats
    let gatewayUrl: string
    if (ipfsUri.startsWith('ipfs://')) {
      gatewayUrl = ipfsUri.replace('ipfs://', 'https://ipfs.io/ipfs/')
    } else if (ipfsUri.startsWith('https://') || ipfsUri.startsWith('http://')) {
      gatewayUrl = ipfsUri
    } else {
      gatewayUrl = `https://ipfs.io/ipfs/${ipfsUri}`
    }

    const response = await fetch(gatewayUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`)
    }

    const blob = await response.blob()
    const contentDisposition = response.headers.get('Content-Disposition')

    // Try to extract filename from headers
    let fileName = 'file.zip'
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="(.+)"/)
      if (match && match[1]) {
        fileName = match[1]
      }
    } else {
      // Fallback: try to infer filename from URL
      const urlParts = gatewayUrl.split('/')
      fileName = urlParts[urlParts.length - 1] || fileName
    }

    const blobUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(blobUrl)

    console.log(`✅ File "${fileName}" downloaded successfully from IPFS.`)
  } catch (error) {
    console.error('❌ Error downloading from IPFS:', error)
  }
}
