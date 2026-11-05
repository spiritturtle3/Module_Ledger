/* eslint-disable */
import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { HackNft } from '../utils/types/hack_nft'

import {
  createNft,
  findMasterEditionPda,
  findMetadataPda,
  mplTokenMetadata,
  verifySizedCollectionItem,
} from '@metaplex-foundation/mpl-token-metadata'

import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import {
  KeypairSigner,
  PublicKey,
  createSignerFromKeypair,
  generateSigner,
  keypairIdentity,
  percentAmount,
  publicKey,
} from '@metaplex-foundation/umi'
import { TOKEN_PROGRAM_ID, getOrCreateAssociatedTokenAccount, getAssociatedTokenAddress } from '@solana/spl-token'
import NodeWallet from '@coral-xyz/anchor/dist/cjs/nodewallet'
import { Keypair, LAMPORTS_PER_SOL, SystemProgram } from '@solana/web3.js'
import * as fs from 'fs'
import { ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token'

describe('hack-nft', () => {
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)
  const program = anchor.workspace.hackNft as Program<HackNft>

  const connection = new anchor.web3.Connection('https://api.devnet.solana.com', 'confirmed')

  const umi = createUmi(provider.connection)
  const payer = provider.wallet as NodeWallet

  console.log('Connected to:', provider.connection.rpcEndpoint)
  console.log('Payer:', payer.payer.publicKey.toString())
  console.log('Program ID:', program.programId.toString())

  let nftMint: KeypairSigner = generateSigner(umi)
  let collectionMint: KeypairSigner = generateSigner(umi)

  const creatorWallet = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(payer.payer.secretKey))
  const creator = createSignerFromKeypair(umi, creatorWallet)
  umi.use(keypairIdentity(creator))
  umi.use(mplTokenMetadata())

  let makerAta: anchor.web3.PublicKey
  let takerAta: anchor.web3.PublicKey
  let takerAtaReward: anchor.web3.PublicKey
  let vault: anchor.web3.PublicKey

  // Load keypairs from JSON files
  const makerSecret = JSON.parse(fs.readFileSync('./tests/user-keypair.json', 'utf-8'))
  const takerSecret = JSON.parse(fs.readFileSync('./tests/taker-wallet.json', 'utf-8'))

  const maker = Keypair.fromSecretKey(new Uint8Array(makerSecret))
  const taker = Keypair.fromSecretKey(new Uint8Array(takerSecret))

  const randomNme = Math.floor(Math.random() * 1000000)
  const randomName = `user123-${randomNme}`
  const randomSalt = Math.floor(Math.random() * 1000000)
  const name = `hack-nft-${randomName}-${randomSalt}`

  console.log('Name:', name)

  // Set a reasonable price for the NFT (0.1 SOL)
  const price = new anchor.BN(0.1 * LAMPORTS_PER_SOL)

  console.log('Listing Price:', price.toString(), 'lamports')

  const marketplace = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from('marketplace'), Buffer.from(name)],
    program.programId,
  )[0]
  const rewardsMint = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from('rewards'), marketplace.toBuffer()],
    program.programId,
  )[0]
  const treasury = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from('treasury'), marketplace.toBuffer()],
    program.programId,
  )[0]
  const listing = anchor.web3.PublicKey.findProgramAddressSync(
    [marketplace.toBuffer(), new anchor.web3.PublicKey(nftMint.publicKey as PublicKey).toBuffer()],
    program.programId,
  )[0]

  before(async () => {
    console.log('Maker:', maker.publicKey.toString())
    console.log('Taker:', taker.publicKey.toString())

    // const makerAirdrop = await connection.requestAirdrop(maker.publicKey, 7 * LAMPORTS_PER_SOL);
    // const takerAirdrop = await connection.requestAirdrop(taker.publicKey, 7 * LAMPORTS_PER_SOL);

    // const latestBlockhash = await connection.getLatestBlockhash();
    // await connection.confirmTransaction({ signature: makerAirdrop, ...latestBlockhash });
    // await connection.confirmTransaction({ signature: takerAirdrop, ...latestBlockhash });
    await sleep(2000)

    // Mint Collection NFT
    await createNft(umi, {
      mint: collectionMint,
      name: 'GM',
      symbol: 'GM',
      uri: 'https://arweave.net/123',
      sellerFeeBasisPoints: percentAmount(5.5),
      collectionDetails: { __kind: 'V1', size: 10 },
    }).sendAndConfirm(umi)

    console.log(`Created Collection NFT: ${collectionMint.publicKey.toString()}`)

    // Mint NFT into maker's ATA
    await createNft(umi, {
      mint: nftMint,
      name: 'GM',
      symbol: 'GM',
      uri: 'https://arweave.net/123',
      sellerFeeBasisPoints: percentAmount(5.5),
      collection: { verified: false, key: collectionMint.publicKey },
      tokenOwner: publicKey(maker.publicKey), // Corrected to use maker's public key
    }).sendAndConfirm(umi)
    console.log(`Created NFT: ${nftMint.publicKey.toString()}`)

    // Verify Collection
    const collectionMetadata = findMetadataPda(umi, {
      mint: collectionMint.publicKey,
    })
    const collectionMasterEdition = findMasterEditionPda(umi, {
      mint: collectionMint.publicKey,
    })
    const nftMetadata = findMetadataPda(umi, { mint: nftMint.publicKey })

    await verifySizedCollectionItem(umi, {
      metadata: nftMetadata,
      collectionAuthority: creator,
      collectionMint: collectionMint.publicKey,
      collection: collectionMetadata,
      collectionMasterEditionAccount: collectionMasterEdition,
    }).sendAndConfirm(umi)
    console.log('Collection NFT Verified!')

    // Get or create ATAs
    makerAta = (
      await getOrCreateAssociatedTokenAccount(
        connection,
        maker,
        new anchor.web3.PublicKey(nftMint.publicKey),
        maker.publicKey,
      )
    ).address

    takerAta = (
      await getOrCreateAssociatedTokenAccount(
        connection,
        taker,
        new anchor.web3.PublicKey(nftMint.publicKey),
        taker.publicKey,
      )
    ).address

    // Define vault address but don't create it - the program will initialize it
    vault = await getAssociatedTokenAddress(
      new anchor.web3.PublicKey(nftMint.publicKey),
      listing,
      true, // allowOwnerOffCurve
    )

    console.log('Listing:', listing.toBase58())
    console.log('Maker ATA:', makerAta.toString())
    console.log('Taker ATA:', takerAta.toString())
    console.log('Vault ATA:', vault.toBase58())

    // maker mint
    const makerMint = await connection.getParsedAccountInfo(makerAta, 'confirmed')

    console.log('Maker mint:', makerMint.value?.data)

    // vault mint
    const vaultMint = await connection.getParsedAccountInfo(vault, 'confirmed')

    console.log('Vault mint:', vaultMint.value?.data)

    const tokenAccount = await connection.getTokenAccountBalance(makerAta)
    console.log('Maker token balance:', tokenAccount.value.amount)
  })

  it('Initialize Marketplace!', async () => {
    const tx = await program.methods
      .initialize(name, 1)
      .accountsPartial({
        admin: provider.wallet.publicKey,
        marketplace,
        rewardMint: rewardsMint,
        treasury,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc()
    console.log('Marketplace Initialized. Tx:', tx)

    // Check if Treasury was created
    const treasuryInfo = await connection.getAccountInfo(treasury)
    console.log('Treasury Exists After Init:', treasuryInfo !== null)

    if (!treasuryInfo) {
      console.log('Treasury needs to be initialized with funds...')
      // Initialize the treasury with some SOL to make it exist
      const adminPayerKeypair = provider.wallet as NodeWallet
      const transferTx = new anchor.web3.Transaction().add(
        anchor.web3.SystemProgram.transfer({
          fromPubkey: adminPayerKeypair.publicKey,
          toPubkey: treasury,
          lamports: 0.01 * LAMPORTS_PER_SOL,
        }),
      )
      const treasuryInitTx = await provider.sendAndConfirm(transferTx)
      console.log('Treasury Initialized with SOL. Tx:', treasuryInitTx)

      // Verify Treasury now exists
      const treasuryInfoAfter = await connection.getAccountInfo(treasury)
      console.log('Treasury Exists After Transfer:', treasuryInfoAfter !== null)
    }
  })

  it('Listing!', async () => {
    const nftMetadata = findMetadataPda(umi, { mint: nftMint.publicKey })
    const nftEdition = findMasterEditionPda(umi, { mint: nftMint.publicKey })

    // Add your test here.
    const tx = await program.methods
      .listing(price)
      .accountsPartial({
        maker: maker.publicKey,
        marketplace,
        makerMint: nftMint.publicKey,
        collectionMint: collectionMint.publicKey,
        makerAta,
        metadata: new anchor.web3.PublicKey(nftMetadata[0]),
        vault,
        masterEdition: new anchor.web3.PublicKey(nftEdition[0]),
        listing,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        metadataProgram: new anchor.web3.PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'), // Add the metadata program
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .signers([maker])
      .rpc()
    console.log('\nListing Initialized!')
    console.log('Your transaction signature', tx)
  })

  it.skip('Delisting!', async () => {
    // Add your test here.
    const tx = await program.methods
      .delist()
      .accountsPartial({
        maker: maker.publicKey,
        marketplace,
        makerMint: nftMint.publicKey,
        makerAta,
        listing,
        vault,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([maker])
      .rpc()
    console.log('\nDelisting Initialized!')
    console.log('Your transaction signature', tx)
  })

  it('Purchase Initialized!', async () => {
    // Create reward token account for taker

    console.log('Rewards Mint:', rewardsMint.toString())

    const takerAtaReward = await getOrCreateAssociatedTokenAccount(connection, taker, rewardsMint, taker.publicKey)

    console.log('Taker Ata Reward:', takerAtaReward.address.toString())

    // Check account balances before purchase
    const takerBalance = await connection.getBalance(taker.publicKey)
    console.log('Taker SOL Balance:', takerBalance / LAMPORTS_PER_SOL, 'SOL')

    // Check if rewards mint account exists
    const rewardsMintInfo = await connection.getAccountInfo(rewardsMint)
    console.log('Rewards Mint Exists:', rewardsMintInfo !== null)

    // Check if taker rewards ATA already exists
    const takerRewardAtaInfo = await connection.getAccountInfo(takerAtaReward.address)
    console.log('Taker Rewards ATA Exists:', takerRewardAtaInfo !== null)

    // Check all accounts involved in the transaction
    const makerBalance = await connection.getBalance(maker.publicKey)
    console.log('Maker SOL Balance:', makerBalance / LAMPORTS_PER_SOL, 'SOL')

    const listingInfo = await connection.getAccountInfo(listing)
    console.log('Listing Account Exists:', listingInfo !== null)
    if (listingInfo) {
      console.log('Listing Account Balance:', listingInfo.lamports / LAMPORTS_PER_SOL, 'SOL')
    }

    const vaultInfo = await connection.getAccountInfo(vault)
    console.log('Vault Account Exists:', vaultInfo !== null)
    if (vaultInfo) {
      console.log('Vault Account Balance:', vaultInfo.lamports / LAMPORTS_PER_SOL, 'SOL')
    }

    // Check the treasury account again before purchase
    const treasuryInfo = await connection.getAccountInfo(treasury)
    console.log('Treasury Account Exists:', treasuryInfo !== null)
    if (treasuryInfo) {
      console.log('Treasury Account Balance:', treasuryInfo.lamports / LAMPORTS_PER_SOL, 'SOL')
    }

    const tx = await program.methods
      .purchase()
      .accountsPartial({
        taker: taker.publicKey,
        maker: maker.publicKey,
        makerMint: nftMint.publicKey,
        marketplace,
        takerAta,
        takerAtaReward: takerAtaReward.address,
        vault,
        rewardsMint,
        listing,
        treasury,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([taker])
      .rpc()
    console.log('\nPurchase Initialized!')
    console.log('Your transaction signature', tx)
  })

  // Add a separate verification test
  it('Verify Taker NFT Purchase', async () => {
    console.log("\n--- Verifying Taker's NFT Purchase ---")

    // Get taker's NFT balance
    try {
      const takerNftBalance = await connection.getTokenAccountBalance(takerAta)
      console.log(`Taker NFT Balance: ${takerNftBalance.value.amount}`)

      if (takerNftBalance.value.amount === '1') {
        console.log('✅ SUCCESS: Taker now owns the NFT!')
      } else {
        console.log("❌ FAILURE: NFT not found in taker's account")
      }
    } catch (err) {
      console.log("Error checking taker's NFT balance:", err)
    }

    // Get taker's reward token balance
    try {
      const takerRewardAta = await getAssociatedTokenAddress(rewardsMint, taker.publicKey)

      const takerRewardBalance = await connection.getTokenAccountBalance(takerRewardAta)
      console.log(`Taker Reward Token Balance: ${takerRewardBalance.value.amount}`)

      if (parseInt(takerRewardBalance.value.amount) > 0) {
        console.log('✅ SUCCESS: Taker received reward tokens!')
      } else {
        console.log("❌ FAILURE: No reward tokens found in taker's account")
      }
    } catch (err) {
      console.log("Error checking taker's reward balance:", err)
    }

    // Get all token accounts for taker
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(taker.publicKey, {
      programId: TOKEN_PROGRAM_ID,
    })

    console.log(`\nTaker owns ${tokenAccounts.value.length} token accounts in total`)

    // Display each token account
    for (let i = 0; i < tokenAccounts.value.length; i++) {
      const tokenAccount = tokenAccounts.value[i]
      const tokenAmount = tokenAccount.account.data.parsed.info.tokenAmount
      const mintAddress = tokenAccount.account.data.parsed.info.mint

      if (parseInt(tokenAmount.amount) > 0) {
        console.log(`\nToken ${i + 1}:`)
        console.log(`  Mint: ${mintAddress}`)
        console.log(`  Balance: ${tokenAmount.amount}`)

        // Check if this is our NFT
        if (mintAddress === nftMint.publicKey.toString()) {
          console.log(`  ✅ This is the purchased NFT from collection!`)
        }

        // Check if this is our reward token
        if (mintAddress === rewardsMint.toString()) {
          console.log(`  ✅ This is the marketplace reward token!`)
        }
      }
    }
  })
})

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
