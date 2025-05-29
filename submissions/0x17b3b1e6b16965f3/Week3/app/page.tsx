"use client";
import React, { useEffect, useState } from "react";
import * as fcl from "@onflow/fcl";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import "./styles/globals.css";

// Configure FCL
fcl.config()
  .put("accessNode.api", "https://rest-testnet.onflow.org")
  .put("discovery.wallet", "https://fcl-discovery.onflow.org/testnet/authn")
  .put("app.detail.title", "Emoji Collage NFT")
  .put("app.detail.icon", "https://placekitten.com/g/200/200");

interface NFT {
  id: number;
  emojiCollage: string;
  metadata: {
    name: string;
    description: string;
    image: string;
    attributes: { [key: string]: string };
    createdAt: number;
  };
  creator: string;
  royaltyPercentage: number;
}

interface Listing {
  id: number;
  nftId: number;
  price: number;
  seller: string;
  createdAt: number;
}

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [selectedEmojis, setSelectedEmojis] = useState<string[]>([]);
  const [nftName, setNftName] = useState("");
  const [nftDescription, setNftDescription] = useState("");
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [price, setPrice] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const currentUser = await fcl.currentUser().snapshot();
        setUser(currentUser);
      } catch (err) {
        console.error("Error initializing FCL:", err);
        setError("Failed to initialize wallet connection");
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (user?.addr) {
      fetchNFTs();
      fetchListings();
    }
  }, [user]);

  const handleConnect = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await fcl.authenticate();
    } catch (err) {
      console.error("Error connecting wallet:", err);
      setError("Failed to connect wallet");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setIsLoading(true);
      await fcl.unauthenticate();
      setUser(null);
    } catch (err) {
      console.error("Error disconnecting wallet:", err);
      setError("Failed to disconnect wallet");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNFTs = async () => {
    if (!user) return;
    try {
      const result = await fcl.query({
        cadence: `
          import EmojiNFT from "./contracts/EmojiNFT.cdc"
          pub fun main(): [EmojiNFT.NFT] {
            let collection = getAccount(self).getCapability(/public/EmojiNFTCollection)
              .borrow<&EmojiNFT.Collection>() ?? panic("Collection not found")
            return collection.getNFTs()
          }
        `,
      });
      setNfts(result);
    } catch (error) {
      console.error("Error fetching NFTs:", error);
    }
  };

  const fetchListings = async () => {
    try {
      const result = await fcl.query({
        cadence: `
          import Marketplace from "./contracts/Marketplace.cdc"
          pub fun main(): [Marketplace.Listing] {
            return Marketplace.getAllListings()
          }
        `,
      });
      setListings(result);
    } catch (error) {
      console.error("Error fetching listings:", error);
    }
  };

  const mintNFT = async () => {
    if (!user || selectedEmojis.length === 0) return;
    
    const emojiCollage = selectedEmojis.join("");
    const attributes = {
      emojiCount: selectedEmojis.length.toString(),
      emojis: emojiCollage,
    };

    try {
      const transactionId = await fcl.mutate({
        cadence: `
          import EmojiNFT from "./contracts/EmojiNFT.cdc"
          transaction(
            emojiCollage: String,
            name: String,
            description: String,
            image: String,
            attributes: {String: String},
            royaltyPercentage: UFix64
          ) {
            execute {
              let nft = EmojiNFT.mintNFT(
                emojiCollage: emojiCollage,
                name: name,
                description: description,
                image: image,
                attributes: attributes,
                royaltyPercentage: royaltyPercentage
              )
              let collection = self.account.getCapability(/public/EmojiNFTCollection)
                .borrow<&EmojiNFT.Collection>() ?? panic("Collection not found")
              collection.deposit(token: nft)
            }
          }
        `,
        args: (arg: any, t: any) => [
          arg(emojiCollage, t.String),
          arg(nftName, t.String),
          arg(nftDescription, t.String),
          arg("", t.String),
          arg(attributes, t.Dictionary({key: t.String, value: t.String})),
          arg("0.025", t.UFix64),
        ],
        proposer: fcl.currentUser,
        payer: fcl.currentUser,
        limit: 50,
      });
      console.log("Transaction ID:", transactionId);
      await fetchNFTs();
    } catch (error) {
      console.error("Error minting NFT:", error);
    }
  };

  const createListing = async (nftId: number) => {
    if (!user || !price) return;
    try {
      const transactionId = await fcl.mutate({
        cadence: `
          import Marketplace from "./contracts/Marketplace.cdc"
          transaction(nftId: UInt64, price: UFix64) {
            execute {
              Marketplace.createListing(nftId: nftId, price: price)
            }
          }
        `,
        args: (arg: any, t: any) => [
          arg(nftId, t.UInt64),
          arg(price, t.UFix64),
        ],
        proposer: fcl.currentUser,
        payer: fcl.currentUser,
        limit: 50,
      });
      console.log("Transaction ID:", transactionId);
      await fetchListings();
    } catch (error) {
      console.error("Error creating listing:", error);
    }
  };

  const buyNFT = async (listingId: number) => {
    if (!user) return;
    try {
      const transactionId = await fcl.mutate({
        cadence: `
          import Marketplace from "./contracts/Marketplace.cdc"
          transaction(listingId: UInt64) {
            execute {
              Marketplace.buyNFT(listingId: listingId)
            }
          }
        `,
        args: (arg: any, t: any) => [arg(listingId, t.UInt64)],
        proposer: fcl.currentUser,
        payer: fcl.currentUser,
        limit: 50,
      });
      console.log("Transaction ID:", transactionId);
      await fetchNFTs();
      await fetchListings();
    } catch (error) {
      console.error("Error buying NFT:", error);
    }
  };

  return (
    <div className="container">
      <header className="header">
        <h1>Emoji Collage NFT</h1>
        <p>Create, collect, and trade unique emoji collages on Flow</p>
      </header>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {user?.addr ? (
        <>
          <div className="wallet-info">
            <span className="wallet-address">{user.addr}</span>
            <button 
              className="button" 
              onClick={handleDisconnect}
              disabled={isLoading}
            >
              {isLoading ? "Disconnecting..." : "Disconnect Wallet"}
            </button>
          </div>

          <div className="card">
            <h2>Create NFT</h2>
            <div className="emoji-picker">
              <Picker
                data={data}
                onEmojiSelect={(emoji: any) => setSelectedEmojis([...selectedEmojis, emoji.native])}
                theme="light"
                set="native"
                previewPosition="none"
                skinTonePosition="none"
              />
            </div>
            <input
              className="input"
              type="text"
              placeholder="NFT Name"
              value={nftName}
              onChange={(e) => setNftName(e.target.value)}
            />
            <input
              className="input"
              type="text"
              placeholder="Description"
              value={nftDescription}
              onChange={(e) => setNftDescription(e.target.value)}
            />
            <div style={{ marginTop: "1rem" }}>
              <p>Selected Emojis: {selectedEmojis.join("")}</p>
              <button 
                className="button" 
                onClick={mintNFT}
                disabled={isLoading || selectedEmojis.length === 0}
              >
                {isLoading ? "Minting..." : "Mint NFT"}
              </button>
            </div>
          </div>

          <div className="grid">
            <div className="card">
              <h2>Your NFTs</h2>
              {nfts.length === 0 ? (
                <p className="empty-state">No NFTs yet. Create your first one!</p>
              ) : (
                nfts.map((nft) => (
                  <div key={nft.id} className="nft-card">
                    <h3>{nft.metadata.name}</h3>
                    <p>{nft.metadata.description}</p>
                    <p>Emojis: {nft.emojiCollage}</p>
                    <div style={{ marginTop: "1rem" }}>
                      <input
                        className="input"
                        type="number"
                        placeholder="Price in Flow"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                      />
                      <button
                        className="button secondary"
                        onClick={() => createListing(nft.id)}
                        disabled={isLoading || !price}
                      >
                        {isLoading ? "Listing..." : "List for Sale"}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="card marketplace">
              <h2>Marketplace</h2>
              {listings.length === 0 ? (
                <p className="empty-state">No active listings. Be the first to list an NFT!</p>
              ) : (
                listings.map((listing) => (
                  <div key={listing.id} className="listing">
                    <div className="listing-info">
                      <p>NFT ID: {listing.nftId}</p>
                      <p>Seller: {listing.seller}</p>
                    </div>
                    <div className="listing-price">
                      <p>{listing.price} Flow</p>
                      <button
                        className="button"
                        onClick={() => buyNFT(listing.id)}
                        disabled={isLoading}
                      >
                        {isLoading ? "Buying..." : "Buy"}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="connect-container">
          <div className="connect-card">
            <h2>Connect Your Wallet</h2>
            <p>Connect your Flow wallet to start creating and trading emoji collages</p>
            <button 
              className="button connect-button" 
              onClick={handleConnect}
              disabled={isLoading}
            >
              {isLoading ? "Connecting..." : "Connect Wallet"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 