import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { HackNft } from "../target/types/hack_nft";

import {
  CreateMetadataAccountV3InstructionArgs,
  createNft,
  fetchDigitalAsset,
  fetchDigitalAssetWithTokenByMint,
  fetchJsonMetadata,
  findMasterEditionPda,
  findMetadataPda,
  mplTokenMetadata,
  verifySizedCollectionItem,
  verifyCollection,
  createMasterEditionV3,
} from "@metaplex-foundation/mpl-token-metadata";

import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  KeypairSigner,
  PublicKey,
  Umi,
  createSignerFromKeypair,
  generateSigner,
  keypairIdentity,
  percentAmount,
  publicKey,
} from "@metaplex-foundation/umi";
import {
  TOKEN_PROGRAM_ID,
  getOrCreateAssociatedTokenAccount,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { Keypair, LAMPORTS_PER_SOL, SystemProgram } from "@solana/web3.js";
import * as fs from "fs";
import { expect } from "chai";
import { ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";

import {
  fromWeb3JsPublicKey,
  toWeb3JsPublicKey,
} from "@metaplex-foundation/umi-web3js-adapters";

describe("hack-nft", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.hackNft as Program<HackNft>;

  const connection = provider.connection;

  const umi = createUmi(provider.connection);
  const payer = provider.wallet as NodeWallet;

  console.log("Connected to:", provider.connection.rpcEndpoint);
  console.log("Payer:", payer.payer.publicKey.toString());
  console.log("Program ID:", program.programId.toString());

  let nftMint: KeypairSigner = generateSigner(umi);
  let collectionMint: KeypairSigner = generateSigner(umi);

  const creatorWallet = umi.eddsa.createKeypairFromSecretKey(
    new Uint8Array(payer.payer.secretKey),
  );
  const creator = createSignerFromKeypair(umi, creatorWallet);
  umi.use(keypairIdentity(creator));
  umi.use(mplTokenMetadata());

  let makerAta: anchor.web3.PublicKey;
  let takerAta: anchor.web3.PublicKey;
  let takerAtaReward: anchor.web3.PublicKey;
  let vault: anchor.web3.PublicKey;

  // Load keypairs from JSON files
  const makerSecret = JSON.parse(
    fs.readFileSync("./tests/user-keypair.json", "utf-8"),
  );
  const takerSecret = JSON.parse(
    fs.readFileSync("./tests/taker-wallet.json", "utf-8"),
  );

  const maker = Keypair.fromSecretKey(new Uint8Array(makerSecret));
  const taker = Keypair.fromSecretKey(new Uint8Array(takerSecret));

  const randomNme = Math.floor(Math.random() * 1000000);
  const randomName = `user123-${randomNme}`;
  const randomSalt = Math.floor(Math.random() * 1000000);
  // const name = `hack-nft-${randomName}-${randomSalt}`;
  const name = `hack-${Date.now().toString(36)}`;

  console.log("Name:", name);

  // Set a reasonable price for the NFT (0.1 SOL)
  const price = new anchor.BN(0.1 * LAMPORTS_PER_SOL);

  console.log("Listing Price:", price.toString(), "lamports");

  const marketplace = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("marketplace"), Buffer.from(name)],
    program.programId,
  )[0];
  const rewardsMint = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("rewards"), marketplace.toBuffer()],
    program.programId,
  )[0];
  const treasury = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("treasury"), marketplace.toBuffer()],
    program.programId,
  )[0];
  const listing = anchor.web3.PublicKey.findProgramAddressSync(
    [
      marketplace.toBuffer(),
      new anchor.web3.PublicKey(nftMint.publicKey as PublicKey).toBuffer(),
    ],
    program.programId,
  )[0];

  before(async () => {
    console.log("Maker:", maker.publicKey.toString());
    console.log("Taker:", taker.publicKey.toString());

    // Fund maker wallet on the local validator
    const makerAirdrop = await connection.requestAirdrop(
      maker.publicKey,
      10 * LAMPORTS_PER_SOL,
    );

    const makerBlockhash = await connection.getLatestBlockhash();
    await connection.confirmTransaction(
      {
        signature: makerAirdrop,
        ...makerBlockhash,
      },
      "confirmed",
    );

    // Fund taker wallet on the local validator
    const takerAirdrop = await connection.requestAirdrop(
      taker.publicKey,
      10 * LAMPORTS_PER_SOL,
    );

    const takerBlockhash = await connection.getLatestBlockhash();
    await connection.confirmTransaction(
      {
        signature: takerAirdrop,
        ...takerBlockhash,
      },
      "confirmed",
    );

    console.log(
      "Maker local SOL:",
      (await connection.getBalance(maker.publicKey)) / LAMPORTS_PER_SOL,
    );
    console.log(
      "Taker local SOL:",
      (await connection.getBalance(taker.publicKey)) / LAMPORTS_PER_SOL,
    );

    // Mint Collection NFT with size information
    await createNft(umi, {
      mint: collectionMint,
      name: "Sidd NFT",
      symbol: "Sidd-NFT",
      uri: "https://sidd-metadata.s3.ap-south-1.amazonaws.com/metadata-1742751740128.json",
      sellerFeeBasisPoints: percentAmount(5.5),
      creators: [
        {
          address: umi.identity.publicKey,
          verified: true,
          share: 100,
        },
      ],
      isMutable: true,
      collectionDetails: { __kind: "V1", size: 0 }, // Size zero, will be incremented when items are verified
    }).sendAndConfirm(umi);

    console.log(
      `✅ Created Collection NFT: ${collectionMint.publicKey.toString()}`,
    );

    // Mint NFT into maker's ATA
    await createNft(umi, {
      mint: nftMint,
      name: "Sidd NFT",
      symbol: "Sidd-NFT",
      uri: "https://sidd-metadata.s3.ap-south-1.amazonaws.com/metadata-1742751740128.json",
      sellerFeeBasisPoints: percentAmount(5.5),
      collection: { verified: false, key: collectionMint.publicKey },
      tokenOwner: publicKey(maker.publicKey),
    }).sendAndConfirm(umi);
    console.log(`✅ Created NFT: ${nftMint.publicKey.toString()}`);

    // Verify Collection
    const collectionMetadata = findMetadataPda(umi, {
      mint: collectionMint.publicKey,
    });
    const collectionMasterEdition = findMasterEditionPda(umi, {
      mint: collectionMint.publicKey,
    });
    const nftMetadata = findMetadataPda(umi, { mint: nftMint.publicKey });

    try {
      // First, try verifySizedCollectionItem which is for sized collections (V1)
      await verifySizedCollectionItem(umi, {
        metadata: nftMetadata,
        collectionAuthority: umi.identity,
        collectionMint: collectionMint.publicKey,
        collection: collectionMetadata,
        collectionMasterEditionAccount: collectionMasterEdition,
      }).sendAndConfirm(umi);
      console.log("✅ Collection NFT Verified!");
    } catch (error) {
      console.error("Error verifying sized collection:", error);
      // If that fails, try the standard verification
      try {
        await verifyCollection(umi, {
          metadata: nftMetadata,
          collectionAuthority: umi.identity,
          collectionMint: collectionMint.publicKey,
          collection: collectionMetadata,
          collectionMasterEditionAccount: collectionMasterEdition,
        }).sendAndConfirm(umi);
        console.log("✅ Collection verified using alternate method!");
      } catch (fallbackError) {
        console.error("Fallback verification failed too:", fallbackError);
      }
    }

    // Get or create ATAs
    makerAta = (
      await getOrCreateAssociatedTokenAccount(
        connection,
        maker,
        new anchor.web3.PublicKey(nftMint.publicKey),
        maker.publicKey,
      )
    ).address;

    takerAta = (
      await getOrCreateAssociatedTokenAccount(
        connection,
        taker,
        new anchor.web3.PublicKey(nftMint.publicKey),
        taker.publicKey,
      )
    ).address;

    // Define vault address but don't create it - the program will initialize it
    vault = await getAssociatedTokenAddress(
      new anchor.web3.PublicKey(nftMint.publicKey),
      listing,
      true, // allowOwnerOffCurve
    );

    console.log("Listing:", listing.toBase58());
    console.log("Maker ATA:", makerAta.toString());
    console.log("Taker ATA:", takerAta.toString());
    console.log("Vault ATA:", vault.toBase58());

    // maker mint
    const makerMint = await connection.getParsedAccountInfo(
      makerAta,
      "confirmed",
    );

    console.log("Maker mint:", makerMint.value?.data);

    // vault mint
    const vaultMint = await connection.getParsedAccountInfo(vault, "confirmed");

    console.log("Vault mint:", vaultMint.value?.data);

    const tokenAccount = await connection.getTokenAccountBalance(makerAta);
    console.log("Maker token balance:", tokenAccount.value.amount);
  });

  it("Initialize Marketplace!", async () => {
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
      .rpc();
    console.log("Marketplace Initialized. Tx:", tx);

    // Check if Treasury was created
    const treasuryInfo = await connection.getAccountInfo(treasury);
    console.log("Treasury Exists After Init:", treasuryInfo !== null);

    if (!treasuryInfo) {
      console.log("Treasury needs to be initialized with funds...");
      // Initialize the treasury with some SOL to make it exist
      const adminPayerKeypair = provider.wallet as NodeWallet;
      const transferTx = new anchor.web3.Transaction().add(
        anchor.web3.SystemProgram.transfer({
          fromPubkey: adminPayerKeypair.publicKey,
          toPubkey: treasury,
          lamports: 0.01 * LAMPORTS_PER_SOL,
        }),
      );
      const treasuryInitTx = await provider.sendAndConfirm(transferTx);
      console.log("Treasury Initialized with SOL. Tx:", treasuryInitTx);

      // Verify Treasury now exists
      const treasuryInfoAfter = await connection.getAccountInfo(treasury);
      console.log(
        "Treasury Exists After Transfer:",
        treasuryInfoAfter !== null,
      );
    }
  });

  it("Listing!", async () => {
    const nftMetadata = findMetadataPda(umi, { mint: nftMint.publicKey });
    const nftEdition = findMasterEditionPda(umi, { mint: nftMint.publicKey });

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
        metadataProgram: new anchor.web3.PublicKey(
          "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
        ), // Add the metadata program
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .signers([maker])
      .rpc();

    console.log("\nListing Initialized!");
    console.log("Your transaction signature", tx);
  });

  it("Delisting!", async () => {
    // BEFORE: the NFT should be in the vault, not with the maker
    const vaultBefore = await connection.getTokenAccountBalance(vault);
    const makerAtaBefore = await connection.getTokenAccountBalance(makerAta);
    const listingInfoBefore = await connection.getAccountInfo(listing);
    const vaultInfoBefore = await connection.getAccountInfo(vault);
    const makerSolBefore = await connection.getBalance(maker.publicKey);

    console.log("[DELIST] vault NFT before:", vaultBefore.value.amount);
    console.log("[DELIST] maker ATA NFT before:", makerAtaBefore.value.amount);
    console.log("[DELIST] maker SOL before (lamports):", makerSolBefore);

    expect(vaultBefore.value.amount).to.equal("1");
    expect(makerAtaBefore.value.amount).to.equal("0");
    expect(
      listingInfoBefore,
      "listing should exist before delist",
    ).to.not.equal(null);
    expect(vaultInfoBefore, "vault should exist before delist").to.not.equal(
      null,
    );

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
      .rpc();
    console.log("[DELIST] tx:", tx);

    // AFTER: the NFT is back with the maker; listing and vault are closed
    const makerAtaAfter = await connection.getTokenAccountBalance(makerAta);
    const makerSolAfter = await connection.getBalance(maker.publicKey);
    console.log("[DELIST] maker ATA NFT after:", makerAtaAfter.value.amount);
    console.log(
      "[DELIST] maker SOL refund (lamports):",
      makerSolAfter - makerSolBefore,
    );

    expect(makerAtaAfter.value.amount).to.equal("1");
    expect(
      await connection.getAccountInfo(listing),
      "listing should be closed",
    ).to.equal(null);
    expect(
      await connection.getAccountInfo(vault),
      "vault should be closed",
    ).to.equal(null);

    // The maker did not pay the fee (the provider wallet did), so the refund
    // should equal the rent that was locked in the listing and vault accounts.
    expect(makerSolAfter - makerSolBefore).to.equal(
      listingInfoBefore!.lamports + vaultInfoBefore!.lamports,
    );
  });
  it("R1: a non-maker must NOT be able to delist someone else's listing", async () => {
    // Fresh NFT + listing, so a successful theft cannot affect other tests
    const r1Mint: KeypairSigner = generateSigner(umi);
    const r1MintKey = new anchor.web3.PublicKey(r1Mint.publicKey);

    await createNft(umi, {
      mint: r1Mint,
      name: "R1 NFT",
      symbol: "R1",
      uri: "https://sidd-metadata.s3.ap-south-1.amazonaws.com/metadata-1742751740128.json",
      sellerFeeBasisPoints: percentAmount(5.5),
      collection: { verified: false, key: collectionMint.publicKey },
      tokenOwner: publicKey(maker.publicKey),
    }).sendAndConfirm(umi);

    const r1Metadata = findMetadataPda(umi, { mint: r1Mint.publicKey });
    const r1Edition = findMasterEditionPda(umi, { mint: r1Mint.publicKey });

    await verifySizedCollectionItem(umi, {
      metadata: r1Metadata,
      collectionAuthority: umi.identity,
      collectionMint: collectionMint.publicKey,
      collection: findMetadataPda(umi, { mint: collectionMint.publicKey }),
      collectionMasterEditionAccount: findMasterEditionPda(umi, {
        mint: collectionMint.publicKey,
      }),
    }).sendAndConfirm(umi);

    const r1MakerAta = (
      await getOrCreateAssociatedTokenAccount(
        connection,
        maker,
        r1MintKey,
        maker.publicKey,
      )
    ).address;
    // The attacker (taker) has its own token account for the same mint
    const r1TakerAta = (
      await getOrCreateAssociatedTokenAccount(
        connection,
        taker,
        r1MintKey,
        taker.publicKey,
      )
    ).address;

    const r1Listing = anchor.web3.PublicKey.findProgramAddressSync(
      [marketplace.toBuffer(), r1MintKey.toBuffer()],
      program.programId,
    )[0];
    const r1Vault = await getAssociatedTokenAddress(r1MintKey, r1Listing, true);

    // The maker lists the NFT legitimately
    await program.methods
      .listing(price)
      .accountsPartial({
        maker: maker.publicKey,
        marketplace,
        makerMint: r1MintKey,
        collectionMint: collectionMint.publicKey,
        makerAta: r1MakerAta,
        metadata: new anchor.web3.PublicKey(r1Metadata[0]),
        vault: r1Vault,
        masterEdition: new anchor.web3.PublicKey(r1Edition[0]),
        listing: r1Listing,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        metadataProgram: new anchor.web3.PublicKey(
          "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
        ),
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .signers([maker])
      .rpc();

    const vaultBefore = await connection.getTokenAccountBalance(r1Vault);
    expect(vaultBefore.value.amount).to.equal("1");

    // ATTACK: the taker signs as "maker" and delists the real maker's listing,
    // sending the NFT to the taker's own token account
    let attackSucceeded = false;
    try {
      await program.methods
        .delist()
        .accountsPartial({
          maker: taker.publicKey,
          marketplace,
          makerMint: r1MintKey,
          makerAta: r1TakerAta,
          listing: r1Listing,
          vault: r1Vault,
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([taker])
        .rpc();
      attackSucceeded = true;
    } catch (err: any) {
      console.log(
        "[R1] attack rejected:",
        String(err.message ?? err).slice(0, 300),
      );
    }

    const takerNft = await connection.getTokenAccountBalance(r1TakerAta);
    console.log("[R1] attack succeeded:", attackSucceeded);
    console.log("[R1] taker NFT balance after attack:", takerNft.value.amount);

    expect(
      attackSucceeded,
      "VULNERABLE: a non-maker delisted someone else's listing and took the NFT",
    ).to.equal(false);
  });

  // Helper: mint a fresh NFT to the maker, verify it in the collection, and list it.
  async function createListedNft(label: string) {
    const mint: KeypairSigner = generateSigner(umi);
    const mintKey = new anchor.web3.PublicKey(mint.publicKey);

    await createNft(umi, {
      mint,
      name: label,
      symbol: "TST",
      uri: "https://sidd-metadata.s3.ap-south-1.amazonaws.com/metadata-1742751740128.json",
      sellerFeeBasisPoints: percentAmount(5.5),
      collection: { verified: false, key: collectionMint.publicKey },
      tokenOwner: publicKey(maker.publicKey),
    }).sendAndConfirm(umi);

    const metadata = findMetadataPda(umi, { mint: mint.publicKey });
    const edition = findMasterEditionPda(umi, { mint: mint.publicKey });

    await verifySizedCollectionItem(umi, {
      metadata,
      collectionAuthority: umi.identity,
      collectionMint: collectionMint.publicKey,
      collection: findMetadataPda(umi, { mint: collectionMint.publicKey }),
      collectionMasterEditionAccount: findMasterEditionPda(umi, {
        mint: collectionMint.publicKey,
      }),
    }).sendAndConfirm(umi);

    const makerAtaNew = (
      await getOrCreateAssociatedTokenAccount(
        connection,
        maker,
        mintKey,
        maker.publicKey,
      )
    ).address;
    const listingPda = anchor.web3.PublicKey.findProgramAddressSync(
      [marketplace.toBuffer(), mintKey.toBuffer()],
      program.programId,
    )[0];
    const vaultAta = await getAssociatedTokenAddress(mintKey, listingPda, true);

    await program.methods
      .listing(price)
      .accountsPartial({
        maker: maker.publicKey,
        marketplace,
        makerMint: mintKey,
        collectionMint: collectionMint.publicKey,
        makerAta: makerAtaNew,
        metadata: new anchor.web3.PublicKey(metadata[0]),
        vault: vaultAta,
        masterEdition: new anchor.web3.PublicKey(edition[0]),
        listing: listingPda,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        metadataProgram: new anchor.web3.PublicKey(
          "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
        ),
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .signers([maker])
      .rpc();

    return { mintKey, makerAta: makerAtaNew, listingPda, vaultAta };
  }

  it("R2: a buyer must NOT be able to buy while naming a different maker", async () => {
    const nft = await createListedNft("R2 NFT");
    const fakePayee = Keypair.generate().publicKey; // attacker-controlled address

    const takerNftAta = await getAssociatedTokenAddress(
      nft.mintKey,
      taker.publicKey,
    );
    const takerRewardAta = await getAssociatedTokenAddress(
      rewardsMint,
      taker.publicKey,
    );

    const makerSolBefore = await connection.getBalance(maker.publicKey);

    // ATTACK: the taker buys the real maker's listing but names a different "maker"
    let attackSucceeded = false;
    let errText = "";
    try {
      await program.methods
        .purchase()
        .accountsPartial({
          taker: taker.publicKey,
          maker: fakePayee,
          makerMint: nft.mintKey,
          marketplace,
          takerAta: takerNftAta,
          takerAtaReward: takerRewardAta,
          vault: nft.vaultAta,
          rewardsMint,
          listing: nft.listingPda,
          treasury,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([taker])
        .rpc();
      attackSucceeded = true;
    } catch (err: any) {
      errText = String(err.message ?? err);
      console.log("[R2] attack rejected:", errText.slice(0, 300));
    }

    const makerSolAfter = await connection.getBalance(maker.publicKey);
    const fakePayeeSol = await connection.getBalance(fakePayee);
    const takerNft = await connection
      .getTokenAccountBalance(takerNftAta)
      .then((r) => r.value.amount)
      .catch(() => "no account");

    console.log("[R2] attack succeeded:", attackSucceeded);
    console.log(
      "[R2] real maker SOL change (lamports):",
      makerSolAfter - makerSolBefore,
    );
    console.log("[R2] fake payee received (lamports):", fakePayeeSol);
    console.log("[R2] taker NFT balance after attack:", takerNft);

    expect(
      attackSucceeded,
      "VULNERABLE: a buyer bought the NFT while the real maker was not paid",
    ).to.equal(false);
    // If rejected, it must be rejected by the has_one check, not by a setup problem
    expect(errText).to.include("ConstraintHasOne");
  });
  it("Purchase!", async () => {
    // Fresh NFT + listing for this test (uses the helper added for R2)
    const nft = await createListedNft("Purchase NFT");

    const takerNftAta = await getAssociatedTokenAddress(
      nft.mintKey,
      taker.publicKey,
    );
    const takerRewardAta = await getAssociatedTokenAddress(
      rewardsMint,
      taker.publicKey,
    );

    // The fee is read from the marketplace account (flat lamports today)
    const marketplaceAcc = await program.account.marketplace.fetch(marketplace);
    const fee = marketplaceAcc.fee;
    const priceLamports = price.toNumber();

    // BEFORE
    const listingInfoBefore = await connection.getAccountInfo(nft.listingPda);
    const vaultInfoBefore = await connection.getAccountInfo(nft.vaultAta);
    const vaultBefore = await connection.getTokenAccountBalance(nft.vaultAta);
    const makerAtaBefore = await connection.getTokenAccountBalance(
      nft.makerAta,
    );
    const takerNftAtaBefore = await connection.getAccountInfo(takerNftAta);
    const takerRewardAtaBefore = await connection.getAccountInfo(
      takerRewardAta,
    );
    const rewardBalBefore = takerRewardAtaBefore
      ? Number(
          (await connection.getTokenAccountBalance(takerRewardAta)).value
            .amount,
        )
      : 0;
    const makerSolBefore = await connection.getBalance(maker.publicKey);
    const takerSolBefore = await connection.getBalance(taker.publicKey);
    const treasurySolBefore = await connection.getBalance(treasury);

    console.log(
      "[PURCHASE] fee (lamports):",
      fee,
      "price (lamports):",
      priceLamports,
    );
    console.log("[PURCHASE] vault NFT before:", vaultBefore.value.amount);
    console.log(
      "[PURCHASE] maker ATA NFT before:",
      makerAtaBefore.value.amount,
    );
    console.log(
      "[PURCHASE] taker reward ATA existed before:",
      takerRewardAtaBefore !== null,
    );

    expect(vaultBefore.value.amount).to.equal("1");
    expect(makerAtaBefore.value.amount).to.equal("0");
    expect(
      listingInfoBefore,
      "listing should exist before purchase",
    ).to.not.equal(null);
    expect(vaultInfoBefore, "vault should exist before purchase").to.not.equal(
      null,
    );
    expect(takerNftAtaBefore, "taker NFT ATA should not exist yet").to.equal(
      null,
    );

    const tx = await program.methods
      .purchase()
      .accountsPartial({
        taker: taker.publicKey,
        maker: maker.publicKey,
        makerMint: nft.mintKey,
        marketplace,
        takerAta: takerNftAta,
        takerAtaReward: takerRewardAta,
        vault: nft.vaultAta,
        rewardsMint,
        listing: nft.listingPda,
        treasury,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([taker])
      .rpc();
    console.log("[PURCHASE] tx:", tx);

    // AFTER
    const takerNftAfter = await connection.getTokenAccountBalance(takerNftAta);
    const takerRewardAfter = await connection.getTokenAccountBalance(
      takerRewardAta,
    );
    const makerAtaAfter = await connection.getTokenAccountBalance(nft.makerAta);
    const listingAfter = await connection.getAccountInfo(nft.listingPda);
    const vaultAfter = await connection.getAccountInfo(nft.vaultAta);
    const makerSolAfter = await connection.getBalance(maker.publicKey);
    const takerSolAfter = await connection.getBalance(taker.publicKey);
    const treasurySolAfter = await connection.getBalance(treasury);

    // Rent the taker paid for the token accounts the program created
    const nftAtaRent = (await connection.getAccountInfo(takerNftAta))!.lamports;
    const rewardAtaRent = takerRewardAtaBefore
      ? 0
      : (await connection.getAccountInfo(takerRewardAta))!.lamports;

    const makerDelta = makerSolAfter - makerSolBefore;
    const takerDelta = takerSolAfter - takerSolBefore;
    const treasuryDelta = treasurySolAfter - treasurySolBefore;
    const rewardDelta = Number(takerRewardAfter.value.amount) - rewardBalBefore;
    const expectedMakerDelta =
      priceLamports -
      fee +
      listingInfoBefore!.lamports +
      vaultInfoBefore!.lamports;
    const expectedTakerDelta = -(priceLamports + nftAtaRent + rewardAtaRent);

    console.log("[PURCHASE] taker NFT after:", takerNftAfter.value.amount);
    console.log("[PURCHASE] maker ATA NFT after:", makerAtaAfter.value.amount);
    console.log("[PURCHASE] listing closed:", listingAfter === null);
    console.log("[PURCHASE] vault closed:", vaultAfter === null);
    console.log("[PURCHASE] reward balance change:", rewardDelta);
    console.log(
      "[PURCHASE] maker SOL change:",
      makerDelta,
      "expected:",
      expectedMakerDelta,
    );
    console.log(
      "[PURCHASE] treasury SOL change:",
      treasuryDelta,
      "expected:",
      fee,
    );
    console.log(
      "[PURCHASE] taker SOL change:",
      takerDelta,
      "expected:",
      expectedTakerDelta,
    );

    expect(takerNftAfter.value.amount).to.equal("1");
    expect(makerAtaAfter.value.amount).to.equal("0");
    expect(listingAfter, "listing should be closed").to.equal(null);
    expect(vaultAfter, "vault should be closed").to.equal(null);
    expect(rewardDelta).to.equal(1);
    expect(makerDelta).to.equal(expectedMakerDelta);
    expect(treasuryDelta).to.equal(fee);
    expect(takerDelta).to.equal(expectedTakerDelta);
  });
  it("A second purchase of the same NFT fails and changes nothing", async () => {
    const nft = await createListedNft("Second Purchase NFT");

    const takerNftAta = await getAssociatedTokenAddress(
      nft.mintKey,
      taker.publicKey,
    );
    const takerRewardAta = await getAssociatedTokenAddress(
      rewardsMint,
      taker.publicKey,
    );

    const buy = () =>
      program.methods
        .purchase()
        .accountsPartial({
          taker: taker.publicKey,
          maker: maker.publicKey,
          makerMint: nft.mintKey,
          marketplace,
          takerAta: takerNftAta,
          takerAtaReward: takerRewardAta,
          vault: nft.vaultAta,
          rewardsMint,
          listing: nft.listingPda,
          treasury,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([taker])
        .rpc();

    // First purchase must succeed
    await buy();

    // BEFORE the second attempt
    const makerSolBefore = await connection.getBalance(maker.publicKey);
    const treasurySolBefore = await connection.getBalance(treasury);
    const takerNftBefore = await connection.getTokenAccountBalance(takerNftAta);
    const rewardBefore = await connection.getTokenAccountBalance(takerRewardAta);

    // Second purchase must be rejected
    let rejected = false;
    let errText = "";
    try {
      await buy();
    } catch (err: any) {
      rejected = true;
      errText = String(err?.message ?? err);
    }
    console.log("[SECOND PURCHASE] rejected:", rejected);
    console.log("[SECOND PURCHASE] error:", errText.slice(0, 300));

    // AFTER the second attempt
    const makerSolAfter = await connection.getBalance(maker.publicKey);
    const treasurySolAfter = await connection.getBalance(treasury);
    const takerNftAfter = await connection.getTokenAccountBalance(takerNftAta);
    const rewardAfter = await connection.getTokenAccountBalance(takerRewardAta);

    expect(rejected, "second purchase should be rejected").to.equal(true);
    expect(takerNftBefore.value.amount).to.equal("1");
    expect(takerNftAfter.value.amount).to.equal("1");
    expect(makerSolAfter).to.equal(makerSolBefore);
    expect(treasurySolAfter).to.equal(treasurySolBefore);
    expect(rewardAfter.value.amount).to.equal(rewardBefore.value.amount);
  });

  it("A purchase with insufficient buyer SOL fails and changes nothing", async () => {
    const nft = await createListedNft("Poor Buyer NFT");

    // Brand-new buyer with only 0.01 SOL: enough for fees, far below the 0.1 SOL price
    const poorBuyer = Keypair.generate();
    await provider.sendAndConfirm(
      new anchor.web3.Transaction().add(
        SystemProgram.transfer({
          fromPubkey: provider.wallet.publicKey,
          toPubkey: poorBuyer.publicKey,
          lamports: 0.01 * LAMPORTS_PER_SOL,
        }),
      ),
    );

    const buyerNftAta = await getAssociatedTokenAddress(
      nft.mintKey,
      poorBuyer.publicKey,
    );
    const buyerRewardAta = await getAssociatedTokenAddress(
      rewardsMint,
      poorBuyer.publicKey,
    );

    // BEFORE
    const makerSolBefore = await connection.getBalance(maker.publicKey);
    const treasurySolBefore = await connection.getBalance(treasury);
    const vaultBefore = await connection.getTokenAccountBalance(nft.vaultAta);
    const buyerSolBefore = await connection.getBalance(poorBuyer.publicKey);
    console.log("[POOR BUYER] buyer SOL before (lamports):", buyerSolBefore);
    expect(vaultBefore.value.amount).to.equal("1");

    let rejected = false;
    let errText = "";
    try {
      await program.methods
        .purchase()
        .accountsPartial({
          taker: poorBuyer.publicKey,
          maker: maker.publicKey,
          makerMint: nft.mintKey,
          marketplace,
          takerAta: buyerNftAta,
          takerAtaReward: buyerRewardAta,
          vault: nft.vaultAta,
          rewardsMint,
          listing: nft.listingPda,
          treasury,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([poorBuyer])
        .rpc();
    } catch (err: any) {
      rejected = true;
      errText = String(err?.message ?? err);
    }
    console.log("[POOR BUYER] rejected:", rejected);
    console.log("[POOR BUYER] error:", errText.slice(0, 300));

    // AFTER
    const makerSolAfter = await connection.getBalance(maker.publicKey);
    const treasurySolAfter = await connection.getBalance(treasury);
    const vaultAfter = await connection.getTokenAccountBalance(nft.vaultAta);
    const listingAfter = await connection.getAccountInfo(nft.listingPda);

    expect(rejected, "purchase with insufficient SOL should be rejected").to.equal(true);
    expect(makerSolAfter).to.equal(makerSolBefore);
    expect(treasurySolAfter).to.equal(treasurySolBefore);
    expect(vaultAfter.value.amount).to.equal("1");
    expect(listingAfter, "listing should still exist").to.not.equal(null);
  });

  it.skip("Purchase Initialized!", async () => {
    // Create reward token account for taker

    console.log("Rewards Mint:", rewardsMint.toString());

    const takerAtaReward = await getOrCreateAssociatedTokenAccount(
      connection,
      taker,
      rewardsMint,
      taker.publicKey,
    );

    console.log("Taker Ata Reward:", takerAtaReward.address.toString());

    // Check account balances before purchase
    const takerBalance = await connection.getBalance(taker.publicKey);
    console.log("Taker SOL Balance:", takerBalance / LAMPORTS_PER_SOL, "SOL");

    // Check if rewards mint account exists
    const rewardsMintInfo = await connection.getAccountInfo(rewardsMint);
    console.log("Rewards Mint Exists:", rewardsMintInfo !== null);

    // Check if taker rewards ATA already exists
    const takerRewardAtaInfo = await connection.getAccountInfo(
      takerAtaReward.address,
    );
    console.log("Taker Rewards ATA Exists:", takerRewardAtaInfo !== null);

    // Check all accounts involved in the transaction
    const makerBalance = await connection.getBalance(maker.publicKey);
    console.log("Maker SOL Balance:", makerBalance / LAMPORTS_PER_SOL, "SOL");

    const listingInfo = await connection.getAccountInfo(listing);
    console.log("Listing Account Exists:", listingInfo !== null);
    if (listingInfo) {
      console.log(
        "Listing Account Balance:",
        listingInfo.lamports / LAMPORTS_PER_SOL,
        "SOL",
      );
    }

    const vaultInfo = await connection.getAccountInfo(vault);
    console.log("Vault Account Exists:", vaultInfo !== null);
    if (vaultInfo) {
      console.log(
        "Vault Account Balance:",
        vaultInfo.lamports / LAMPORTS_PER_SOL,
        "SOL",
      );
    }

    // Check the treasury account again before purchase
    const treasuryInfo = await connection.getAccountInfo(treasury);
    console.log("Treasury Account Exists:", treasuryInfo !== null);
    if (treasuryInfo) {
      console.log(
        "Treasury Account Balance:",
        treasuryInfo.lamports / LAMPORTS_PER_SOL,
        "SOL",
      );
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
      .rpc();
    console.log("\nPurchase Initialized!");
    console.log("Your transaction signature", tx);
  });

  // Add a separate verification test
  it.skip("Verify Taker NFT Purchase", async () => {
    console.log("\n--- Verifying Taker's NFT Purchase ---");

    // Get taker's NFT balance
    try {
      const takerNftBalance = await connection.getTokenAccountBalance(takerAta);
      console.log(`Taker NFT Balance: ${takerNftBalance.value.amount}`);

      if (takerNftBalance.value.amount === "1") {
        console.log("✅ SUCCESS: Taker now owns the NFT!");
      } else {
        console.log("❌ FAILURE: NFT not found in taker's account");
      }
    } catch (err) {
      console.log("Error checking taker's NFT balance:", err);
    }

    // Get taker's reward token balance
    try {
      const takerRewardAta = await getAssociatedTokenAddress(
        rewardsMint,
        taker.publicKey,
      );

      const takerRewardBalance = await connection.getTokenAccountBalance(
        takerRewardAta,
      );
      console.log(
        `Taker Reward Token Balance: ${takerRewardBalance.value.amount}`,
      );

      if (parseInt(takerRewardBalance.value.amount) > 0) {
        console.log("✅ SUCCESS: Taker received reward tokens!");
      } else {
        console.log("❌ FAILURE: No reward tokens found in taker's account");
      }
    } catch (err) {
      console.log("Error checking taker's reward balance:", err);
    }

    // Get all token accounts for taker
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      taker.publicKey,
      { programId: TOKEN_PROGRAM_ID },
    );

    console.log(
      `\nTaker owns ${tokenAccounts.value.length} token accounts in total`,
    );

    // Display each token account
    for (let i = 0; i < tokenAccounts.value.length; i++) {
      const tokenAccount = tokenAccounts.value[i];
      const tokenAmount = tokenAccount.account.data.parsed.info.tokenAmount;
      const mintAddress = tokenAccount.account.data.parsed.info.mint;

      if (parseInt(tokenAmount.amount) > 0) {
        console.log(`\nToken ${i + 1}:`);
        console.log(`  Mint: ${mintAddress}`);
        console.log(`  Balance: ${tokenAmount.amount}`);

        // Check if this is our NFT
        if (mintAddress === nftMint.publicKey.toString()) {
          console.log(`  ✅ This is the purchased NFT from collection!`);
        }

        // Check if this is our reward token
        if (mintAddress === rewardsMint.toString()) {
          console.log(`  ✅ This is the marketplace reward token!`);
        }
      }
    }
  });

  it("Get Marketplace PDA and Listing", async () => {
    const marketplaceName = name;

    console.log("Marketplace Name:", marketplaceName);

    // Derive marketplace PDA using web3
    const [marketplace] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("marketplace"), Buffer.from(marketplaceName)],
      program.programId,
    );

    console.log("Marketplace Address:", marketplace.toBase58());

    // Test an NFT mint
    const nftMint = "9qthitdjYgMpL2mpoxBsySttGjSRCz6buh5A3FM4HLQ7";
    const nftMintKey = new anchor.web3.PublicKey(nftMint);

    console.log("NFT Mint Address:", nftMintKey.toBase58());

    // Derive listing PDA
    const [listing] = anchor.web3.PublicKey.findProgramAddressSync(
      [marketplace.toBuffer(), nftMintKey.toBuffer()],
      program.programId,
    );

    console.log("Listing Address:", listing.toBase58());

    // Check if listing account exists
    const accountInfo = await connection.getAccountInfo(listing);

    if (!accountInfo) {
      console.warn("Listing account not found");
      return;
    }

    console.log("Listing Account Exists:", accountInfo);

    console.log("Account exists with size:", accountInfo.data.length);

    // Note: We're not using program.account.listing.fetch here as we would need to
    // set up a full Anchor program. Instead, we'll manually check the account data.
    console.log("Raw account data available:", accountInfo.data.length > 0);
  });

  it("Get all listings for a marketplace", async () => {
    const marketplaceName = name;

    // Derive marketplace PDA
    const [marketplace] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("marketplace"), Buffer.from(marketplaceName)],
      program.programId,
    );

    console.log("Marketplace Address:", marketplace.toBase58());

    try {
      // Get all program accounts without filter first to see what's available
      console.log("\n--- Getting all program accounts ---");
      const allAccounts = await connection.getProgramAccounts(
        program.programId,
      );
      console.log(`Total accounts for program: ${allAccounts.length}`);

      // Log account sizes to help identify different account types
      const accountSizes = new Map<number, number>();
      for (const account of allAccounts) {
        const size = account.account.data.length;
        accountSizes.set(size, (accountSizes.get(size) || 0) + 1);
      }
      console.log("Account sizes distribution:");
      accountSizes.forEach((count, size) => {
        console.log(`Size ${size} bytes: ${count} accounts`);
      });

      // Try to find listing accounts by checking for specific size
      // According to your Listing struct, listings should be 8 + 32 + 32 + 8 + 1 = 81 bytes
      const listingSizeAccounts = allAccounts.filter(
        (a) => a.account.data.length === 81,
      );
      console.log(
        `Found ${listingSizeAccounts.length} accounts of size 81 bytes (expected for listings)`,
      );

      // Extract information from each potential listing account
      for (const account of listingSizeAccounts) {
        console.log("\n=== Analyzing potential listing account ===");
        console.log("Address:", account.pubkey.toBase58());

        const data = account.account.data;
        if (data.length !== 81) continue;

        try {
          // The Anchor account discriminator is the first 8 bytes
          const discriminator = data.slice(0, 8);
          const discriminatorHex = Buffer.from(discriminator).toString("hex");
          console.log("Discriminator:", discriminatorHex);

          // Looking at your Listing struct:
          // pub maker: Pubkey, (32 bytes)
          // pub maker_mint: Pubkey, (32 bytes)
          // pub price: u64, (8 bytes)
          // pub bump: u8, (1 byte)

          // Parse the account data
          const maker = new anchor.web3.PublicKey(data.slice(8, 40));
          const makerMint = new anchor.web3.PublicKey(data.slice(40, 72));
          const price = data.readBigUInt64LE(72);
          const bump = data[80];

          console.log("Maker:", maker.toBase58());
          console.log("Maker Mint (NFT):", makerMint.toBase58());
          console.log(
            `Price: ${price.toString()} lamports (${
              Number(price) / LAMPORTS_PER_SOL
            } SOL)`,
          );
          console.log("Bump:", bump);

          // Now compute the expected PDA for this listing to verify it's valid
          const [expectedListingPDA] =
            anchor.web3.PublicKey.findProgramAddressSync(
              [marketplace.toBuffer(), makerMint.toBuffer()],
              program.programId,
            );

          console.log("Expected listing PDA:", expectedListingPDA.toBase58());
          console.log("Actual account address:", account.pubkey.toBase58());

          if (expectedListingPDA.toBase58() === account.pubkey.toBase58()) {
            console.log("✅ This is a valid listing for this marketplace");

            // Fetch NFT metadata
            try {
              console.log("\nFetching metadata for NFT:", makerMint.toBase58());
              const umiMakerMint = fromWeb3JsPublicKey(makerMint);

              // Fetch the digital asset
              const digitalAsset = await fetchDigitalAsset(umi, umiMakerMint);
              console.log("NFT Name:", digitalAsset.metadata.name);
              console.log("Symbol:", digitalAsset.metadata.symbol);
              console.log("URI:", digitalAsset.metadata.uri);

              // Fetch the JSON metadata if available
              if (digitalAsset.metadata.uri) {
                try {
                  const jsonMetadata = await fetchJsonMetadata(
                    umi,
                    digitalAsset.metadata.uri,
                  );
                  console.log("\nJSON Metadata:");
                  console.log("  Image:", jsonMetadata.image);
                  console.log("  Description:", jsonMetadata.description);

                  // Display attributes if available
                  if (jsonMetadata.attributes) {
                    console.log("  Attributes:");
                    jsonMetadata.attributes.forEach((attr: any) => {
                      console.log(`    ${attr.trait_type}: ${attr.value}`);
                    });
                  }
                } catch (err) {
                  console.error("Error fetching JSON metadata:", err);
                }
              }

              // Try to get token data (current owner, etc.)
              try {
                const assetWithToken = await fetchDigitalAssetWithTokenByMint(
                  umi,
                  umiMakerMint,
                );
                if (assetWithToken.token) {
                  console.log("\nToken Data:");
                  console.log(
                    "  Owner:",
                    assetWithToken.token.owner.toString(),
                  );
                  console.log(
                    "  Amount:",
                    assetWithToken.token.amount.toString(),
                  );

                  // Check if the token is currently in a vault
                  const listingAddress = account.pubkey.toBase58();
                  const vaultOwner = assetWithToken.token.owner.toString();

                  if (vaultOwner.includes(listingAddress.substring(0, 10))) {
                    console.log(
                      "  ✅ NFT is currently in listing vault (active listing)",
                    );
                  } else {
                    console.log(
                      "  ⚠️ NFT is not in listing vault - listing may be inactive",
                    );
                    console.log("  Current holder:", vaultOwner);
                  }
                }
              } catch (err) {
                console.error("Error fetching token data:", err);
              }
            } catch (err) {
              console.error("Error fetching NFT metadata:", err);
            }
          } else {
            console.log(
              "❌ This account is NOT a listing for the specified marketplace",
            );
          }
        } catch (err) {
          console.error("Error parsing account data:", err);
        }
      }

      // If you want to try Anchor's typed account fetching, uncomment this
      try {
        console.log("\n--- Trying Anchor account fetching ---");
        const anchorListings = await program.account.listing.all();
        console.log(
          `Found ${anchorListings.length} listings using Anchor's typed account fetching`,
        );

        for (const listing of anchorListings) {
          console.log("\nListing PDA:", listing.publicKey.toBase58());
          console.log("Maker:", listing.account.maker.toBase58());
          console.log(
            "Maker Mint (NFT):",
            listing.account.makerMint.toBase58(),
          );
          console.log("Price:", listing.account.price.toString());

          // Calculate expected marketplace PDA
          const [expectedListingPDA] =
            anchor.web3.PublicKey.findProgramAddressSync(
              [marketplace.toBuffer(), listing.account.makerMint.toBuffer()],
              program.programId,
            );

          if (expectedListingPDA.toBase58() === listing.publicKey.toBase58()) {
            console.log("✅ This listing belongs to our marketplace");
          } else {
            console.log("⚠️ This listing belongs to a different marketplace");
          }
        }
      } catch (anchorError) {
        console.error("Error with Anchor account fetching:", anchorError);
      }
    } catch (err) {
      console.error("Failed to fetch program accounts:", err);
    }
  });

  it("Get validated listings with metadata", async () => {
    // You can change this to the marketplace name you want to use
    const marketplaceName = name;

    // Derive marketplace PDA
    const [marketplace] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("marketplace"), Buffer.from(marketplaceName)],
      program.programId,
    );

    console.log("\n--- Fetching listings for marketplace ---");
    console.log("Marketplace:", marketplace.toBase58());

    // Get all program accounts
    const allAccounts = await connection.getProgramAccounts(program.programId);

    // Filter to likely listing accounts (81 bytes - size of Listing struct with discriminator)
    const listingSizeAccounts = allAccounts.filter(
      (a) => a.account.data.length === 81,
    );
    console.log(
      `Found ${listingSizeAccounts.length} potential listing accounts`,
    );

    // Process each potential listing
    for (const account of listingSizeAccounts) {
      const data = account.account.data;

      try {
        // Parse account data according to Listing struct
        const maker = new anchor.web3.PublicKey(data.slice(8, 40));
        const makerMint = new anchor.web3.PublicKey(data.slice(40, 72));
        const price = data.readBigUInt64LE(72);
        const bump = data[80];

        // Calculate expected listing PDA
        const [expectedListingPDA] =
          anchor.web3.PublicKey.findProgramAddressSync(
            [marketplace.toBuffer(), makerMint.toBuffer()],
            program.programId,
          );

        // Check if this is a valid listing for our marketplace
        if (expectedListingPDA.toBase58() === account.pubkey.toBase58()) {
          console.log(`\n=== Valid Listing ===`);
          console.log(`Address: ${account.pubkey.toBase58()}`);
          console.log(`Maker: ${maker.toBase58()}`);
          console.log(`NFT Mint: ${makerMint.toBase58()}`);
          console.log(
            `Price: ${price.toString()} lamports (${
              Number(price) / LAMPORTS_PER_SOL
            } SOL)`,
          );

          // Fetch NFT metadata
          try {
            // Convert to UMI PublicKey
            const umiMakerMint = fromWeb3JsPublicKey(makerMint);

            // Fetch the digital asset
            const digitalAsset = await fetchDigitalAsset(umi, umiMakerMint);
            console.log(`NFT Name: ${digitalAsset.metadata.name}`);
            console.log(`Symbol: ${digitalAsset.metadata.symbol}`);
            console.log(`URI: ${digitalAsset.metadata.uri}`);

            // Try to get token data
            try {
              const assetWithToken = await fetchDigitalAssetWithTokenByMint(
                umi,
                umiMakerMint,
              );
              if (assetWithToken.token) {
                const ownerString = assetWithToken.token.owner.toString();
                console.log(`Token Owner: ${ownerString}`);
                console.log(
                  `Token Amount: ${assetWithToken.token.amount.toString()}`,
                );

                const isActive = ownerString.includes(
                  account.pubkey.toBase58().substring(0, 10),
                );
                if (isActive) {
                  console.log(`✅ NFT is in listing vault (active listing)`);
                } else {
                  console.log(`⚠️ NFT is not in listing vault`);
                }
              }
            } catch (tokenErr) {
              console.log(
                `Error fetching token data: ${
                  tokenErr instanceof Error
                    ? tokenErr.message
                    : String(tokenErr)
                }`,
              );
            }

            // Try to get JSON metadata
            if (digitalAsset.metadata.uri) {
              try {
                console.log(
                  `\nAttempting direct fetch of metadata JSON from URI:`,
                );
                console.log(digitalAsset.metadata.uri);

                // First try Metaplex's fetchJsonMetadata
                try {
                  const jsonMetadata = await fetchJsonMetadata(
                    umi,
                    digitalAsset.metadata.uri,
                  );
                  console.log(`\nMetaplex JSON Metadata Result:`);
                  if (jsonMetadata.image) {
                    console.log(`Image URL: ${jsonMetadata.image}`);
                  } else {
                    console.log(`No image found in Metaplex metadata result`);
                  }

                  if (jsonMetadata.description) {
                    console.log(`Description: ${jsonMetadata.description}`);
                  }

                  if (
                    jsonMetadata.attributes &&
                    jsonMetadata.attributes.length > 0
                  ) {
                    console.log(`Attributes:`);
                    jsonMetadata.attributes.forEach((attr: any) => {
                      console.log(`  ${attr.trait_type}: ${attr.value}`);
                    });
                  }
                } catch (metaplexErr) {
                  console.log(
                    `Metaplex metadata fetch error: ${
                      metaplexErr instanceof Error
                        ? metaplexErr.message
                        : String(metaplexErr)
                    }`,
                  );
                }

                // Fallback: Try direct fetch with node-fetch
                try {
                  // Define a hardcoded test metadata in case fetching fails
                  const testMetadata = {
                    name: "test 1 x",
                    symbol: "t1x",
                    description: "this is first test",
                    image:
                      "https://imgs.search.brave.com/NrlZu-RbjGqH--zt6qRLLqua63hgRZuuRQziGS5ua1U/rs:fit:500:0:0:0/g:ce/aHR0cHM6Ly9waXhs/ci5jb20vaW1hZ2Vz/L2luZGV4L2FpLWlt/YWdlLWdlbmVyYXRv/ci1vbmUud2VicA",
                    attributes: [
                      {
                        trait_type: "Item",
                        value: "test 1 x",
                      },
                    ],
                  };

                  console.log(`\nHardcoded Metadata:`);
                  console.log(`Image URL (hardcoded): ${testMetadata.image}`);
                  console.log(
                    `Description (hardcoded): ${testMetadata.description}`,
                  );

                  if (testMetadata.attributes) {
                    console.log(`Attributes (hardcoded):`);
                    testMetadata.attributes.forEach((attr: any) => {
                      console.log(`  ${attr.trait_type}: ${attr.value}`);
                    });
                  }
                } catch (directFetchErr) {
                  console.log(
                    `Direct fetch error: ${
                      directFetchErr instanceof Error
                        ? directFetchErr.message
                        : String(directFetchErr)
                    }`,
                  );
                }
              } catch (metadataErr) {
                console.log(
                  `Error fetching JSON metadata: ${
                    metadataErr instanceof Error
                      ? metadataErr.message
                      : String(metadataErr)
                  }`,
                );
              }
            }
          } catch (err) {
            console.log(
              `Error fetching NFT metadata: ${
                err instanceof Error ? err.message : String(err)
              }`,
            );
          }
        }
      } catch (err) {
        // Skip this account if there's an error parsing it
        continue;
      }
    }
  });
});

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
